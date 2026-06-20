import fs from "fs"
import path from "path"
import { BiliAPI as Bili } from "#model"
import { logger } from "#lib"

class BSign {
  async saveSignData(userId, data) {
    const saveDir = path.join("./data/bilisign")
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true })
    }
    const savePath = path.join(saveDir, `${userId}.json`)
    fs.writeFileSync(savePath, JSON.stringify(data, null, 2))
  }

  async processVideos(videoData) {
    return videoData.map((video) => video.short_link)
  }

  async processCoins(videoData, userCookies) {
    if (!userCookies.coin) {
      return "您未开启投币任务,进行跳过操作"
    }

    const web = await Bili.getwebinfo(userCookies)
    if (web.data.level === 6) {
      return "恭喜您已达至尊，6级啦~ 跳过投币任务"
    }

    const expRet = await Bili.gettoexplog(userCookies)
    if (expRet.code === 0) {
      const currentCoins = expRet.data.coins
      const targetCoins = 50
      let remainingCoins = Math.max(targetCoins - currentCoins, 0)
      const coinOperations = Math.ceil(remainingCoins / 10)

      let coinResults = []
      for (let i = 0; i < coinOperations && i < videoData.length; i++) {
        const video = videoData[i]
        const result = await Bili.addCoin(userCookies, video.aid)
        coinResults.push(result)
        await Bili.sleep(5000)
      }
      return `今日投币已领经验: ${currentCoins}, 还需投${coinOperations}个硬币, 投币结果: ${coinResults.join(", ")}`
    } else {
      logger.warn("[BiliSign] 获取今日投币数失败，默认执行5次投币操作")
      return "获取今日投币数失败: 默认投5个硬币"
    }
  }

  async processShares(videoData, userCookies) {
    let lastShareResult
    for (const video of videoData) {
      lastShareResult = await Bili.shareVideo(video.aid, userCookies)
      await Bili.sleep(5000)
    }
    return lastShareResult
  }

  async processWatches(videoData, userCookies) {
    let watchResult
    for (const video of videoData) {
      watchResult = await Bili.reportWatch(video.aid, video.cid, userCookies)
      await Bili.sleep(5000)
    }
    return watchResult
  }

  async processExperience(userCookies) {
    try {
      const expResult = await Bili.getExperience(userCookies)
      return `${expResult}`
    } catch (error) {
      logger.error(`[BiliSign] 领取大会员经验失败: ${error}`)
      return "未知错误"
    }
  }

  async processCoupons(userCookies) {
    try {
      const couponsResult = await Bili.getCoupons(userCookies)
      return couponsResult
    } catch (error) {
      logger.error(`[BiliSign] 领取卡券失败: ${error}`)
      return "未知错误"
    }
  }

  async processManhuaSign(userCookies) {
    try {
      const manhuaSignResult = await Bili.signManhua(userCookies)
      return manhuaSignResult
    } catch (error) {
      logger.error(`[BiliSign] 漫画签到失败: ${error}`)
      return "未知错误"
    }
  }

  async processManhuaShare(userCookies) {
    try {
      const manhuaShareResult = await Bili.shareManhua(userCookies)
      return manhuaShareResult
    } catch (error) {
      logger.error(`[BiliSign] 漫画分享失败: ${error}`)
      return "未知错误"
    }
  }
}

export default new BSign()
