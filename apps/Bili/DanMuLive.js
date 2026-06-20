import WebSocket from "ws"
import fs from "fs"
import path from "path"
import yaml from "yaml"
import { Buffer } from "buffer"
import { BiliAPI as Bili } from "#model"
import { inflateSync, brotliDecompressSync } from "zlib"
import { Config } from "#components"
import { REG } from "./index.js"
import { logger } from "#lib"

const LivedamuReg = new RegExp(`^#?(${REG})?开始推送直播间`)

export class BiliLivedamu extends plugin {
  constructor() {
    super({
      name: "BiliLivedamu",
      dsc: "监听直播间弹幕",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: LivedamuReg,
          fnc: "bindLiveRoom"
        }
      ]
    })

    this.wsClient = null
    this.timeout = null
    this.heartbeatInterval = null
    this.messageBuffer = []
    this.eventObject = null
    this.messageSendInterval = setInterval(() => {
      this.sendBufferedMessages()
    }, Config.Bili.LivedamuTime)
  }

  sendBufferedMessages() {
    if (this.messageBuffer.length > 0 && this.eventObject) {
      const combinedMessage = this.messageBuffer.join("\n")
      this.eventObject.reply(combinedMessage)
      this.messageBuffer = []
    }
  }

  async bindLiveRoom(e) {
    if (this.wsClient) {
      this.wsClient.close()
    }
    this.cleanup()

    switch (Config.Bili.Livedamu) {
      case 1:
        if (!e.isMaster) {
          return e.reply("为避免刷屏，请让主人开启哦！")
        }
        break
      case 2:
        if (!(e.isMaster || e.member.is_admin || e.member.is_owner)) {
          return e.reply("为避免刷屏，请让群主或管理员开启哦！")
        }
        break
      default:
        break
    }

    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const userIds = Object.keys(cookiesData)
    let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
    if (!userIds.includes(currentUserId)) {
      currentUserId = userIds[0]
      await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
    }
    const userCookies = cookiesData[currentUserId]
    const roomId = e.msg.replace(/#?开始推送直播间/g, "").trim()
    if (!roomId) return e.reply("请输入正确的直播间ID")

    try {
      const danmuInfo = await this.getDanmuInfo(roomId, userCookies)
      await this.connectToLiveRoom(e, danmuInfo, roomId, userCookies)
      this.setAutoDisconnect()
      const time = Config.Bili.LivedamuTime / 1000
      return e.reply(`监听直播间 ${roomId}\r10分钟后断开 ${time}s推送一次`, true)
    } catch (err) {
      return e.reply(`连接失败: ${err.message}`)
    }
  }

  async getDanmuInfo(roomId, userCookies) {
    const data = await Bili.getLiveUrl(roomId, userCookies)
    if (data.code !== 0) throw new Error(data.message)
    return {
      host: data.data.host_list[0].host,
      port: data.data.host_list[0].wss_port,
      token: data.data.token
    }
  }

  async connectToLiveRoom(e, danmuInfo, roomId, userCookies) {
    const wsUrl = `wss://${danmuInfo.host}:${danmuInfo.port}/sub`
    this.wsClient = new WebSocket(wsUrl)

    this.wsClient.on("open", () => {
      this.sendAuthPacket(danmuInfo.token, roomId, userCookies)
      this.startHeartbeat()
    })

    this.wsClient.on("message", (data) => {
      this.decodeMessage(data, e)
    })

    this.wsClient.on("close", () => this.cleanup())
    this.wsClient.on("error", (err) => logger.error("WebSocket错误:", err))
  }

  sendAuthPacket(token, roomId, userCookies) {
    const authData = JSON.stringify({
      uid: Number(userCookies.DedeUserID),
      roomid: Number(roomId),
      protover: 3,
      platform: "web",
      type: 2,
      key: token
    })

    const header = Buffer.alloc(16)
    header.writeUInt32BE(16 + Buffer.byteLength(authData), 0)
    header.writeUInt16BE(16, 4)
    header.writeUInt16BE(1, 6)
    header.writeUInt32BE(7, 8)
    header.writeUInt32BE(1, 12)

    this.wsClient.send(Buffer.concat([header, Buffer.from(authData)]))
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const header = Buffer.alloc(16)
      header.writeUInt32BE(16 + 4, 0)
      header.writeUInt16BE(16, 4)
      header.writeUInt16BE(1, 6)
      header.writeUInt32BE(2, 8)
      header.writeUInt32BE(2, 12)

      const payload = Buffer.from("[object Object]")
      this.wsClient.send(Buffer.concat([header, payload]))
    }, 30000)
  }

  decodeMessage(data, e) {
    try {
      let buffer = Buffer.from(data)
      while (buffer.length >= 16) {
        const packetLen = buffer.readUInt32BE(0)
        if (buffer.length < packetLen) break

        const headerLen = buffer.readUInt16BE(4)
        const ver = buffer.readUInt16BE(6)
        const operation = buffer.readUInt32BE(8)

        const body = buffer.slice(headerLen, packetLen)
        buffer = buffer.slice(packetLen)

        if (operation === 5) {
          let decompressed = body
          try {
            if (ver === 2) decompressed = inflateSync(body)
            if (ver === 3) decompressed = brotliDecompressSync(body)
          } catch (err) {
            logger.error("解压失败:", err)
            continue
          }

          const messages = decompressed
            .toString("utf-8")
            .split(/\x00/g)
            .filter((msg) => {
              const trimmedMsg = msg.trim()
              return trimmedMsg && trimmedMsg.startsWith("{") && trimmedMsg.endsWith("}")
            })

          messages.forEach((msg) => {
            try {
              const data = JSON.parse(msg)
              this.handleMessage(data, e)
            } catch (err) {
              logger.error("消息解析失败:", err, "原始数据:", msg)
            }
          })
        }
      }
    } catch (err) {
      logger.error("解码消息失败:", err)
    }
  }

  handleMessage(data, e) {
    if (!this.wsClient) {
      logger.warn("WebSocket 已关闭，不再处理消息")
      return
    }

    try {
      const cmd = data.cmd?.split(":")[0] || ""
      const info = data.info || []
      const cmdData = data.data || {}

      let message = ""
      switch (cmd) {
        case "DANMU_MSG":
          const content = info[1] || "未知内容"
          const userInfo = info[2] || []
          const userName = userInfo[1] || "未知用户"
          message = `[弹幕] ${userName}: ${content}`
          break

        case "SEND_GIFT":
          const giftName = cmdData.giftName || "未知礼物"
          const num = cmdData.num || 1
          const uname = cmdData.uname || "未知用户"
          message = `[礼物] ${uname} 赠送了 ${num} 个 ${giftName}`
          break

        case "INTERACT_WORD":
          const msgType = cmdData.msg_type
          const userName2 = cmdData.uname || "未知用户"
          const medalInfo = cmdData.fans_medal || {}
          const medalName = medalInfo.medal_name ? `【${medalInfo.medal_name}${medalInfo.medal_level}】` : ""

          if (msgType === 1) {
            message = `[进场] 欢迎 ${userName2} ${medalName}进入直播间`
          } else if (msgType === 2) {
            message = `[关注] 感谢 ${userName2} ${medalName}关注主播`
          } else {
            logger.debug(`[未知互动类型] CMD: ${cmd}, 类型: ${msgType}, 数据: ${JSON.stringify(data)}`)
            break
          }
          break

        case "GUARD_BUY":
          const guardLevel2 = cmdData.guard_level || 0
          const guardName = { 1: "总督", 2: "提督", 3: "舰长" }[guardLevel2] || "未知"
          message = `[上舰] ${cmdData.username} 成为了 ${guardName}`
          break

        case "SUPER_CHAT_MESSAGE":
          const scUser = cmdData.user_info?.uname || "未知用户"
          const scMessage = cmdData.message || ""
          const price = cmdData.price || 0
          message = `[醒目留言] ${scUser} 发送了 ${price} 元 SC: ${scMessage}`
          break

        case "LIKE_INFO_V3_CLICK":
          const likeText = cmdData.like_text || "为主播点赞了"
          message = `[点赞] ${cmdData.uname} ${likeText}`
          break

        case "ONLINE_RANK_COUNT":
          const RANK_COUNT = cmdData.count || "未知"
          message = `[高能用户数] 直播间高能用户数量 ${RANK_COUNT} 人`
          break
        case "ONLINE_RANK_V2":
          if (cmdData.list?.length) {
            const top3 = cmdData.list
              .slice(0, 3)
              .map((user) => `${user.rank}位: ${user.uname}（${user.score}）`)
              .join(" | ")
            message = `[高能榜刷新] 当前前三：${top3}`
          }
          break

        case "ROOM_CHANGE":
          const newTitle = cmdData.title || "未知标题"
          const areaName = cmdData.area_name || "未知分区"
          message = `[直播间信息更新] 新标题：${newTitle} | 分区：${areaName}`
          break

        case "WATCHED_CHANGE":
          const watchedCount = cmdData.num ? `${cmdData.num}人` : "数据更新"
          message = `[观众数据] 已观看人数：${watchedCount}`
          break

        case "POPULARITY_RED_POCKET_START":
          const gifts = cmdData.awards?.map((a) => `${a.gift_name}×${a.num}`).join("+") || "神秘礼物"
          message = `[红包预告] ${cmdData.sender_name} 发送红包（含${gifts}），快去参与！`
          break

        case "POPULARITY_RED_POCKET_WINNER_LIST":
          const winners =
            cmdData.winner_info
              ?.slice(0, 3)
              .map((w) => w[1])
              .join(", ") || "神秘用户"
          message = `[红包结果] ${winners} 等${cmdData.total_num}人抢到红包`
          break

        case "COMBO_SEND":
          message = `[连击礼物] ${cmdData.uname} 连续投喂 ${cmdData.gift_name}×${cmdData.total_num}`
          break

        case "USER_TOAST_MSG":
          const guardMap = { 1: "总督", 2: "提督", 3: "舰长" }
          const guardLevel = guardMap[cmdData.guard_level] || "船员"
          message = `[上舰通知] 🎉 ${cmdData.username} 开通了${guardLevel}（${cmdData.toast_msg}）`
          break

        case "ROOM_REAL_TIME_MESSAGE_UPDATE":
          const fans = cmdData.fans ? `粉丝数：${cmdData.fans}` : ""
          const fansClub = cmdData.fans_club ? `粉丝团：${cmdData.fans_club}` : ""
          if (fans || fansClub) {
            message = `[主播数据更新] ${fans} ${fansClub}`
          }
          break

        case "PREPARING":
          const status = cmdData.round === 1 ? "轮播中" : "准备中"
          message = `[直播间状态] 主播进入${status}状态`
          break

        case "LIKE_INFO_V3_UPDATE":
          message = `[点赞数据] 直播间累计点赞数：${cmdData.click_count}`
          break

        case "ONLINE_RANK_TOP3":
          const topList = cmdData.list?.map((item) => `${item.rank}位: ${item.msg.match(/<%(.+?)%>/)?.[1]}`).join(" | ")
          if (topList) {
            message = `[高能用户] ${topList}`
          }
          break

        case "GIFT_STAR_PROCESS":
          message = `[礼物星球] ${cmdData.tip}`
          break

        case "STOP_LIVE_ROOM_LIST":

        case "ONLINE_RANK_COUNT":
          break

        default:
          if (!["DANMU_MSG", "SEND_GIFT", "INTERACT_WORD", "GUARD_BUY", "SUPER_CHAT_MESSAGE"].includes(cmd)) {
            logger.debug(`[未知消息] CMD: ${cmd}, 数据: ${JSON.stringify(data)}`)
          }
      }

      if (message) {
        this.messageBuffer.push(message)
        this.eventObject = e
      }
    } catch (err) {
      logger.error("处理消息失败:", err)
    }
  }

  destructor() {
    clearInterval(this.messageSendInterval)
  }

  setAutoDisconnect() {
    this.timeout = setTimeout(() => this.cleanup(), 10 * 60 * 1000)
  }

  cleanup() {
    this.wsClient?.close()
    clearInterval(this.heartbeatInterval)
    clearTimeout(this.timeout)
    this.wsClient = null
  }
}
