/**
 * B站签到
 * - 使用 getFeed(SESSDATA降级) + getInfo(SESSDATA降级) + reportWatch + getExperience + getCoupons + 漫画签到
 * - 投币/分享/三连因无 access_token 跳过（不报错）
 * 修复：签到 catch 块末尾加 continue，防止失败后仍设 redis 已签到标记
 */
import fs from "fs"
import path from "path"
import { BiliAPI as Bili, Button, BSign } from "#model"
import yaml from "yaml"
import { Config, common, Res_Path } from "#components"
import { REG } from "./index.js"
import { logger } from "#lib"

const SignReg = new RegExp(`^#?${REG}(重新)?签到$`)

export class BiliSign extends plugin {
  constructor() {
    super({
      name: "Y:B站签到",
      dsc: "签到",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: SignReg,
          fnc: "sign"
        }
      ]
    })
  }

  async sign(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }

    if (await redis.get("bili:autosign:task")) {
      const message = await redis.get("bili:autosign:task")
      await e.reply(message, true)
      return true
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const isReSign = e.msg.includes("重新")
    if (isReSign) {
      await e.reply("开始重新执行B站签到任务", true)
    }
    let allParams = []
    for (const dedeUserId in cookiesData) {
      const userCookies = cookiesData[dedeUserId]
      if (isReSign) {
        await redis.del(`bili:alsign:${dedeUserId}`)
      }
      if (await redis.get(`bili:alsign:${dedeUserId}`)) {
        await e.reply(`账号${dedeUserId}: 今日已签到`, true)
        continue
      }

      await e.reply(`客官请稍等~ 正在为账号${dedeUserId}签到中...`)
      try {
        const videoData = await Bili.getFeed(userCookies)
        const infoData = await Bili.getInfo(userCookies)
        const num = Math.floor(Math.random() * infoData.collectionTop.length)
        const userData = {
          uid: dedeUserId,
          video: await BSign.processVideos(videoData),
          Coins: await BSign.processCoins(videoData, userCookies),
          Shares: await BSign.processShares(videoData, userCookies),
          Watches: await BSign.processWatches(videoData, userCookies),
          Experience: await BSign.processExperience(userCookies),
          Coupons: await BSign.processCoupons(userCookies),
          ManhuaSign: await BSign.processManhuaSign(userCookies),
          ManhuaShare: await BSign.processManhuaShare(userCookies)
        }
        if (infoData.collectionTop[num]?.cover) {
          userData.bgcover = infoData.collectionTop[num].cover
        } else {
          userData.bgcover = `${Res_Path}/help/theme/default/main.jpg`
        }
        allParams.push(userData)
        const msg = await common.render("Bili/signlog", userData, { e, scale: 1 })
        await e.reply([msg, new Button().help()])
      } catch (error) {
        logger.error(`[BiliSign] 签到任务失败: ${error}`)
        await e.reply("签到任务失败: 未知错误")
        continue
      }
      const cd = Math.floor((new Date().setHours(24, 0, 0, 0) - Date.now()) / 1000 - 1)
      await redis.set(`bili:alsign:${dedeUserId}`, "1", { EX: cd })
    }
    if (allParams.length) {
      await BSign.saveSignData(e.user_id, allParams)
    }
  }
}
