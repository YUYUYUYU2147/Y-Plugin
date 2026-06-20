import { Config } from "#components"
import { logger } from "#lib"

class Tencent {
  constructor() {
    this.signApi = `http://localhost:${Config.Bili.Server_Port}/bili`
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async PushBot() {
    const PushBot = Array.isArray(Config.other.PushBot)
      ? Config.other.PushBot[Math.floor(Math.random() * Config.other.PushBot.length)]
      : Config.other.PushBot
    return PushBot ? Bot[PushBot] : Bot
  }

  async extractCookies(cookiesStr, keysToFind) {
    const cookies = {}
    cookiesStr.split("; ").forEach((cookie) => {
      const [key, value] = cookie.split("=")
      if (keysToFind.includes(key)) {
        cookies[key] = value
      }
    })
    return cookies
  }

  async getQQck(qq, domain) {
    try {
      let skey, pskey
      let isSuccess = false
      for (let i = 0; i < 10; i++) {
        let cookiesStr
        try {
          cookiesStr = Bot[qq].sendApi
            ? (await Bot[qq].sendApi("get_cookies", { domain })).data.cookies
            : await Bot[qq].cookies[domain]
        } catch (err) {
          logger.error(`第 ${i + 1} 次获取 cookies 失败:`, err)
          continue
        }
        const parsedCookies = await this.extractCookies(cookiesStr, ["skey", "p_skey"])
        skey = parsedCookies.skey
        pskey = parsedCookies.p_skey

        if (skey && pskey) {
          isSuccess = true
          break
        }
        await this.sleep(5000)
      }

      return isSuccess
        ? {
            code: 0,
            uin: qq,
            skey,
            pskey
          }
        : {
            code: 114514,
            uin: qq,
            skey: skey || "获取失败",
            pskey: pskey || "获取失败",
            msg: "多次尝试后仍未能获取完整 cookies"
          }
    } catch (err) {
      logger.error("获取机器人ck失败:", err)
      return {
        code: -1,
        uin: qq,
        skey: "获取失败",
        pskey: "获取失败",
        msg: `获取异常: ${err.message}`
      }
    }
  }

  async getQQlist() {
    let qq = []
    const getUins = (source) => {
      if (Array.isArray(source)) {
        return source
      } else if (typeof source === "number" || typeof source === "string") {
        return [source]
      }
      return []
    }
    let uins = getUins(Bot.uin)
    if (uins.length === 0 && Bin && Bin.uin) {
      uins = getUins(Bin.uin)
    }
    for (let attempt = 0; uins.length === 0 && attempt < 3; attempt++) {
      uins = getUins(Bot.uin)
      if (uins.length === 0 && Bin && Bin.uin) {
        uins = getUins(Bin.uin)
      }
    }
    qq.push(...uins.map(Number).filter((num) => !isNaN(num)))
    qq = qq.filter(
      (number) =>
        !(
          (number >= 2854000000 && number <= 2855000000) ||
          (number >= 2854196301 && number <= 2854216399) ||
          (number >= 3889000000 && number <= 3890000000) ||
          number === 3328144510 ||
          number === 66600000 ||
          (number >= 4010000000 && number <= 4019999999)
        )
    )
    return qq
  }

  async Dailyfriend(uin, skey, pskey) {
    const qqdaily = `${this.signApi}/qqdaily?uin=${uin}&skey=${skey}&pskey=${pskey}`
    const results = []
    try {
      const qqdailydataFirst = await (await fetch(qqdaily)).json()
      await this.sleep(1500)
      results.push(
        qqdailydataFirst.code === 0
          ? "收集卡(第1张): 成功"
          : `收集卡(第1张): 失败(${qqdailydataFirst.message || qqdailydataFirst.msg || "未知错误"})`
      )
      const filteredFriends = Array.from(Bot[uin].fl.keys()).filter((friendId) => friendId !== uin)
      const shuffledFriends = filteredFriends.sort(() => 0.5 - Math.random())
      const friendsToShareWith = shuffledFriends.slice(0, 3)
      for (let i = 0; i < friendsToShareWith.length; i++) {
        const friend = friendsToShareWith[i]
        const qqshare = `${this.signApi}/qqshare?uin=${uin}&skey=${skey}&pskey=${pskey}&friend=${friend}`
        const qqsharedata = await (await fetch(qqshare)).json()
        await this.sleep(1500)
        results.push(
          qqsharedata.code === 0
            ? `分享操作(第${i + 1}次): 成功`
            : `分享(第${i + 1}次): 失败(${qqsharedata.message || qqsharedata.msg || "未知错误"})`
        )
        const qqdailydataNext = await (await fetch(qqdaily)).json()
        await this.sleep(1500)
        results.push(
          qqdailydataNext.code === 0
            ? `收集卡(第${i + 2}张): 成功`
            : `收集卡(第${i + 2}张): 失败(${qqdailydataNext.message || qqdailydataNext.msg || "未知错误"})`
        )
      }
      return results.join("\n")
    } catch (err) {
      logger.error("日签分享:", err)
      return "日签分享: 失败(未知错误)"
    }
  }

  async DailySignCard(uin, skey, pskey) {
    const qqdaily2 = `${this.signApi}/qqdaily2?uin=${uin}&skey=${skey}&pskey=${pskey}`
    const qqdaily3 = `${this.signApi}/qqdaily3?uin=${uin}&skey=${skey}&pskey=${pskey}`
    const qqdaily4 = `${this.signApi}/qqdaily4?uin=${uin}&skey=${skey}&pskey=${pskey}`
    const qqdaily5 = `${this.signApi}/qqdaily5?uin=${uin}&skey=${skey}&pskey=${pskey}`
    const results = []
    try {
      const qqdaily2data = await (await fetch(qqdaily2)).json()
      await this.sleep(1500)
      const qqdaily3data = await (await fetch(qqdaily3)).json()
      await this.sleep(1500)
      const qqdaily4data = await (await fetch(qqdaily4)).json()
      await this.sleep(1500)
      const qqdaily5data = await (await fetch(qqdaily5)).json()
      await this.sleep(1500)
      results.push(
        qqdaily2data.code === 0
          ? "普通日签卡: 成功"
          : `普通日签卡: 失败(${qqdaily2data.message || qqdaily2data.msg || "未知错误"})`
      )
      results.push(
        qqdaily3data.code === 0
          ? "晚安卡: 成功"
          : `晚安卡: 失败(${qqdaily3data.message || qqdaily3data.msg || "未知错误"})`
      )
      results.push(
        qqdaily4data.code === 0
          ? "每日Q崽: 成功"
          : `每日Q崽: 失败(${qqdaily4data.message || qqdaily4data.msg || "未知错误"})`
      )
      results.push(
        qqdaily5data.code === 0
          ? "心事罐: 成功"
          : `心事罐: 失败(${qqdaily5data.message || qqdaily5data.msg || "未知错误"})`
      )
      return results.join("\n")
    } catch (err) {
      logger.error("日签卡失败:", err)
      return "日签卡: 失败(未知错误)"
    }
  }

  async Luckyword(uin, skey, pskey, group) {
    const Luckyword = `${this.signApi}/luckyword?uin=${uin}&skey=${skey}&pskey=${pskey}&group=${group}`
    try {
      const lucky = await (await fetch(Luckyword)).json()
      return lucky
    } catch (err) {
      logger.error("群抽幸运字符失败:", err)
      return {
        code: -1,
        msg: `账号 ${uin} 在群 ${group} 抽字符失败: Y-Plugin 内部错误，请检查日志输出`
      }
    }
  }
}
export default new Tencent()
