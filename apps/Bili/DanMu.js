import fs from "fs"
import path from "path"
import yaml from "yaml"
import { BiliAPI as Bili, Tencent as Ten } from "#model"
import { Config } from "#components"
import { REG } from "./index.js"
import { logger } from "#lib"

const DanMuReg = new RegExp(`^#?(${REG})?发弹幕`)

export class Bilidamu extends plugin {
  constructor() {
    super({
      name: "Y:B站弹幕",
      dsc: "弹幕发送功能",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: DanMuReg,
          fnc: "senddamu"
        }
      ]
    })
    this.task = [
      {
        cron: Config.Bili.DanMuCron,
        name: "B站自动发送弹幕",
        fnc: () => this.autodamu()
      }
    ]
  }

  async senddamu(e) {
    try {
      const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
      if (!fs.existsSync(cookieFile)) {
        return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
      }
      const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
      const userIds = Object.keys(cookiesData)
      if (userIds.length === 0) {
        return await e.reply("账号数据异常，请先发送【B站登录】进行绑定", true)
      }
      let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
      if (!userIds.includes(currentUserId)) {
        currentUserId = userIds[0]
        await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
      }
      const parts = e.msg.split(" ")
      if (parts.length < 3) {
        return await e.reply("格式错误，正确格式：#发弹幕 房间号 内容\n示例：#发弹幕 123456 你好呀", true)
      }
      const roomid = parts[1]
      const msg = parts.slice(2).join(" ").trim()
      if (!msg) {
        return await e.reply("弹幕内容不能为空", true)
      }
      const userCookies = cookiesData[currentUserId]
      const result = await Bili.livesenddamu(userCookies, msg, parseInt(roomid))
      await e.reply(result, true)
    } catch (err) {
      logger.error("弹幕发送异常:", err)
    }
    return true
  }

  async autodamu() {
    const cookiesDirPath = path.join("./data/bili")
    if (!fs.existsSync(cookiesDirPath)) {
      logger.warn("自动弹幕：未找到Cookie目录，跳过自动弹幕任务")
      return
    }
    const files = fs.readdirSync(cookiesDirPath).filter((file) => path.extname(file) === ".yaml")
    shuffleArray(files)

    for (const file of files) {
      const fileName = path.basename(file, ".yaml")
      const cookiesFilePath = path.join(cookiesDirPath, file)
      const cookiesData = yaml.parse(fs.readFileSync(cookiesFilePath, "utf-8"))
      let hasLiveEnabled = false
      let hasLiveroom = false
      const forwardNodes = []
      let messageBuffer = []
      const header = `[B站直播间弹幕]\n用户 ${fileName} 的本次自动弹幕结果：\n`

      for (const userId in cookiesData) {
        if (!cookiesData[userId].live) {
          const msg = `B站账号 ${userId} 未开启自动弹幕功能`
          logger.info(`${msg}`)
          messageBuffer.push(msg)
          continue
        }
        hasLiveEnabled = true
        try {
          const liveroom = await Bili.getlivefeed(cookiesData[userId])
          if (!liveroom || liveroom.length === 0) {
            const msg = `B站账号 ${userId} 的关注主播没开播`
            logger.info(`${msg}`)
            messageBuffer.push(msg)
            continue
          }

          for (const room of liveroom) {
            const RoomId = room.roomid
            if (await redis.get(`bili:aldamu:${userId}:${RoomId}`)) {
              logger.info(`B站用户 ${fileName} B站账号 ${userId} 4小时内已在房间${RoomId}发送过弹幕`)
              continue
            }
            let data
            try {
              data = await (await fetch(Config.Bili.DanMutext)).text()
            } catch (error) {
              logger.error("获取不到辣")
              data = "🌸 是Darling把我带到这里的哦~ 我第一次看到能游泳的大海 🌸"
            }
            let msg = data.slice(0, 20)
            const result = await Bili.livesenddamu(cookiesData[userId], msg, RoomId)
            const modifiedResult = result.replace(
              new RegExp(`直播间『${RoomId}』`, "g"),
              `主播『${room.name}』的直播间`
            )
            await redis.set(`bili:aldamu:${userId}:${RoomId}`, "1", {
              EX: 14400
            })
            await Bili.sleep(2000)
            const result2 = await Bili.liveshare(cookiesData[userId], RoomId)
            const click = Math.floor(Math.random() * 201) + 300
            const result3 = await Bili.liveclick(cookiesData[userId], RoomId, room.uid, click)
            messageBuffer.push(`${modifiedResult}\n${result2}\n${result3}\n`)
            await Bili.sleep(2000)
            hasLiveroom = true
          }
        } catch (err) {
          logger.error("自动弹幕报错：", err)
          messageBuffer.push(`B站账号 ${userId} 处理失败：${err.message}`)
        }
      }
      const groupKey = cookiesData[Object.keys(cookiesData)[0]].LoginGroup
      const isOnWhiteList = Config.Bili.DanMuHGroup.includes(groupKey)
      const isOnBlackList = Config.Bili.DanMuBGroup.includes(groupKey)
      if (isOnBlackList) {
        logger.info(` 群组 ${groupKey} 在黑名单中`)
        continue
      }
      if (Config.Bili.DanMuHGroup.length > 0 && !isOnWhiteList) {
        logger.info(` 群组 ${groupKey} 不在白名单中`)
        continue
      }
      while (messageBuffer.length > 0) {
        const chunk = messageBuffer.splice(0, 5)
        forwardNodes.push(createForwardNodes([header, ...chunk]))
      }
      if (forwardNodes.length > 0 && hasLiveroom && hasLiveEnabled) {
        try {
          const push = await Ten.PushBot()
          const forwardMessage = await Bot.makeForwardMsg(forwardNodes)
          push.pickGroup(groupKey).sendMsg(forwardMessage)
        } catch (err) {
          logger.error(" 消息发送失败：", err)
        }
      }
      await Bili.sleep(5000)
    }
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

function createForwardNodes(messages) {
  return {
    user_id: "80000000",
    nickname: "自动弹幕助手",
    message: messages.join("\n")
  }
}
