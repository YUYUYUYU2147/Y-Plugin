/**
 * B站用户信息模块
 * - 我的B站信息：getInfo（SESSDATA web API 降级）
 * - #我的关注 / #我的关注列表：getFollowList（SESSDATA web API，无 access_token 可用）
 * 修复：getTargetUserID 过滤 bot 自身 @ 以避免误判
 */
import fs from "fs"
import path from "path"
import yaml from "yaml"
import { BiliAPI as Bili, Button } from "#model"
import { Config, common, Res_Path } from "#components"
import { REG } from "./index.js"
import { logger } from "#lib"
const InfoReg = new RegExp(`^#?${REG}信息$|^#?我的${REG}$`)
const FollowReg = /^#?我的(关注|关注列表)$/

export class BiliInfo extends plugin {
  constructor() {
    super({
      name: "Y:B站信息",
      dsc: "信息",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: InfoReg,
          fnc: "UserInfo"
        },
        {
          reg: /^#?查询up(.*)/im,
          fnc: "Searchup"
        },
        {
          reg: FollowReg,
          fnc: "FollowList"
        }
      ]
    })
  }

  async UserInfo(e) {
    const targetUserID = this.getTargetUserID(e)
    const cookieFilePath = path.join(`./data/bili/${targetUserID}.yaml`)
    if (!fs.existsSync(cookieFilePath)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFilePath, "utf8"))
    await e.reply("开始获取你的B站信息请稍等....", true, { recallMsg: 5 })
    for (const userId in cookiesData) {
      try {
        const userCookies = cookiesData[userId]
        const infoData = await Bili.getInfo(userCookies)
        const num = Math.floor(Math.random() * infoData.collectionTop.length)

        if (infoData.currentLevel === 6) {
          infoData.expNeeded = 0
          infoData.daysToLevelUp = 0
        }

        const params = {
          isSelf: userCookies.DedeUserID,
          avatarUrl: infoData.face,
          replace_face: infoData.face,
          name: infoData.name,
          uid: infoData.uid,
          pendantname: infoData.pendant?.name,
          guajian: infoData.pendant?.image,
          fans: infoData.fans,
          attention: infoData.attention,
          coins: infoData.coins,
          senior: infoData.senior,
          sign: infoData.sign,
          vipClass: infoData.vipStatus ? "active" : "",
          vipText: infoData.vipStatus ? infoData.vipLabel : "",
          vipDue: infoData.vipStatus ? infoData.vipDue : "",
          statusClass: infoData.accountStatus === "正常" ? "normal" : "danger",
          accountStatus: infoData.accountStatus,
          currentLevel: "Lv." + infoData.currentLevel,
          currentExp: infoData.currentExp || 0,
          nextExp: infoData.nextExp || 0,
          expNeeded: infoData.expNeeded,
          daysToLevelUp: infoData.daysToLevelUp,
          coinClass: infoData.coinStatus ? "success" : "danger",
          coinStatus: infoData.coinStatus ? "开启" : "关闭",
          liveClass: infoData.liveStatus ? "success" : "danger",
          liveStatus: infoData.liveStatus ? "开启" : "关闭",
          // joinTime: infoData.joinTime,
          birthday: infoData.birthday,
          expireTime: infoData.expireTime,
          expTasks: infoData.expTasks
        }
        if (infoData.collectionTop[num]?.cover) {
          params.bgcover = infoData.collectionTop[num].cover
        } else {
          params.bgcover = `${Res_Path}/help/theme/default/main.jpg`
        }
        const msg = await common.render("Bili/info", params, { e, scale: 1 })
        e.reply([msg, new Button().help()])
      } catch (error) {
        logger.error("查询信息失败：", error)
        await e.reply("出错了，请检查日志", true)
      }
    }
  }

  async Searchup(e) {
    try {
      const cookieFilePath = path.join(`./data/bili/${e.user_id}.yaml`)
      if (!fs.existsSync(cookieFilePath)) {
        return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
      }
      const cookiesData = yaml.parse(fs.readFileSync(cookieFilePath, "utf8"))
      const userIds = Object.keys(cookiesData)
      let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
      if (!userIds.includes(currentUserId)) {
        currentUserId = userIds[0]
        await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
      }
      const userCookies = cookiesData[currentUserId]
      let msg = e.msg.replace(/，/gi, ",").trim()
      let mids = msg.replace(/#?查询up/gi, "").trim()
      if (!mids) await e.reply("输入错误，请按照这个格式重试：查询up123456,789456", true)
      const forwardNodes = await Bili.getupinfo(mids, userCookies)
      const forwardMessage = await Bot.makeForwardMsg(forwardNodes)
      await e.reply(forwardMessage, false)
    } catch (error) {
      logger.error("查询up信息失败：", error)
      await e.reply("出错了，请检查日志", true)
    }
  }

  async FollowList(e) {
    const targetUserID = this.getTargetUserID(e)
    const cookieFilePath = path.join(`./data/bili/${targetUserID}.yaml`)
    if (!fs.existsSync(cookieFilePath)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFilePath, "utf8"))
    await e.reply("正在获取你的B站关注列表...", true, { recallMsg: 5 })
    const forwardNodes = []
    for (const userId in cookiesData) {
      const userCookies = cookiesData[userId]
      const list = await Bili.getFollowList(userCookies)
      if (!list.length) {
        forwardNodes.push({
          user_id: e.user_id,
          nickname: "B站关注",
          message: `B站账号 ${userId} 暂无关注`
        })
        continue
      }
      forwardNodes.push({
        user_id: e.user_id,
        nickname: "B站关注",
        message: `B站账号 ${userId} 共关注了 ${list.length} 人`
      })
      for (const u of list) {
        forwardNodes.push({
          user_id: e.user_id,
          nickname: u.name,
          message: [
            segment.image(u.face),
            `\r昵称: ${u.name}`,
            `\rUID: ${u.mid}`,
            `\r签名: ${u.sign || "无"}`
          ].join("")
        })
      }
    }
    const forwardMessage = await Bot.makeForwardMsg(forwardNodes)
    await e.reply(forwardMessage, false)
    return true
  }

  getTargetUserID(e) {
    const atQQNumbers = e.message.filter((msg) => msg.type === "at" && msg.qq != e.self_id).map((msg) => msg.qq)
    return atQQNumbers.length > 0 ? atQQNumbers[0] : e.user_id
  }
}
