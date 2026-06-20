import fs from "fs"
import path from "path"
import yaml from "yaml"
import moment from "moment"
import { BiliAPI as Bili } from "#model"
import { Config } from "#components"
import { logger } from "#lib"

export class UserLive extends plugin {
  constructor() {
    super({
      name: "Y:B站主播",
      desc: "主播去哪了",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: /^#?(关注)?(主播|煮波)开播(了)?(没|吗)|#?(主播|煮波)(在干嘛|还没开播吗|怎么回事|逝了|去哪)(了)?(辽)?(嘞)?(没)?$/,
          fnc: "UserLive"
        }
      ]
    })
  }

  async UserLive(e) {
    let userID = e.user_id
    const atQQNumbers = e.message.filter((msg) => msg.type === "at").map((msg) => msg.qq)
    if (atQQNumbers.length > 0) {
      userID = atQQNumbers[0]
    }

    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }

    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    if (await redis.get(`bili:getlivefeed:${userID}`)) {
      return await e.reply("笨蛋你明明刚刚找过你主播了，过一会再试吧~", true)
    }

    await e.reply("开始获取你的关注列表主播直播状态请稍等...", true)
    await redis.set(`bili:getlivefeed:${userID}`, "1", { EX: 180 })

    const forwardNodes = []
    let count = 0

    for (const userId in cookiesData) {
      const userCookies = cookiesData[userId]
      try {
        const livefeed = await Bili.getlivefeed(userCookies)
        if (!livefeed || livefeed.length === 0) {
          forwardNodes.push({
            user_id: e.user_id || "84227871",
            nickname: e.sender.nickname || "B站主播",
            message: `===========================\rB站账号 ${userId} 的关注主播没开播\r===========================`
          })
          continue
        }

        forwardNodes.push({
          user_id: e.user_id || "84227871",
          nickname: e.sender.nickname || "B站主播",
          message: `B站账号 ${userId} 当前关注列表有${livefeed.length}人开播啦~`
        })

        for (const live of livefeed) {
          forwardNodes.push(await this.createLiveNode(live, e))
        }
      } catch (err) {
        logger.error("B站 获取主播去哪了失败:", err)
        forwardNodes.push({
          user_id: e.user_id || "84227871",
          nickname: e.sender.nickname || "B站主播",
          message: "获取主播开播状态失败"
        })
      }

      count++
      if (count > 0) {
        await Bili.sleep(2000)
      }
    }

    const forwardMessage = await Bot.makeForwardMsg(forwardNodes)
    await e.reply(forwardMessage, false)
    return true
  }

  async createLiveNode(live, e) {
    const { roomid, uid, name, cover, title, live_time, area_name, area_v2_name, area_v2_parent_name, online } = live

    const replyMessage = [
      segment.image(cover),
      `\r『主播: ${name}(${uid})』`,
      `\r『房间号: ${roomid}』`,
      `\r『标题: ${title}』`,
      `\r『分区: ${area_name}』`,
      //  `『分区v2：${area_v2_name}』`
      //  `『分区v3：${area_v2_parent_name}』`,
      `\r『在线人数: ${online}』`,
      `\r『开播时间: ${moment(live_time * 1000).format("YYYY-MM-DD HH:mm:ss")}』`,
      `\r『房间链接: https://live.bilibili.com/${roomid}』`,
      `\r『独立播放器: https://www.bilibili.com/blackboard/live/live-activity-player.html?enterTheRoom=0&cid=${roomid}』`
    ]

    return {
      user_id: e.user_id || "84227871",
      nickname: e.sender.nickname || "主播去哪了",
      message: replyMessage
    }
  }
}
