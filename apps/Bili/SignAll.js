/**
 * B站全部签到（主人命令）
 * 修复：issign = true 和 redis key 写入移入 try 成功分支，
 * 防止签到失败后仍被标记为"已签到"
 */
import fs from "fs"
import path from "path"
import yaml from "yaml"
import moment from "moment"
import { BiliAPI as Bili, BSign } from "#model"
import { Config, Res_Path } from "#components"
import { REG } from "./index.js"
import common from "../../../../lib/common/common.js"
import { logger } from "#lib"

const SignReg = new RegExp(`^#?${REG}全部签到$`)

export class BiliAllSign extends plugin {
  constructor() {
    super({
      name: "Y:B站功能",
      desc: "全部签到",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: SignReg,
          fnc: "signAll",
          permission: "master"
        }
      ]
    })

    this.task = {
      cron: Config.Bili.SignCron,
      name: "B站自动签到",
      fnc: () => this.signAll()
    }
  }

  async signAll() {
    const cookiesDirPath = path.join("./data/bili")
    if (!fs.existsSync(cookiesDirPath)) return logger.info("暂无B站可以签到已跳过")
    if (await redis.get("bili:autosign:task")) {
      const message = await redis.get("bili:autosign:task")
      await this.e.reply(message, true)
      return true
    }
    let files = fs.readdirSync(cookiesDirPath).filter((file) => path.extname(file) === ".yaml")
    shuffleArray(files)

    const tempDirPath = path.join("./data/bilisign")
    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath, { recursive: true })
    }

    let existingFiles = []
    if (fs.existsSync(tempDirPath)) {
      existingFiles = fs.readdirSync(tempDirPath).filter((file) => path.extname(file) === ".json")
    }
    files = files.filter((file) => !existingFiles.includes(file))

    if (files.length < 1) {
      logger.mark("B站全部账号已完成签到")
      if (this.e) {
        await this.e.reply("所有用户已完成签到啦~", true)
      }
      return
    }

    const ts = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
    const tsstart = moment()
    const tasklength = files.length
    const estimatedCompletionTime = moment(Date.now() + tasklength * 100000).format("YYYY-MM-DD HH:mm:ss")
    const cd = tasklength * 120

    let signedCount = 0
    let signskipCount = 0

    redis.set(
      "bili:autosign:task",
      `请勿执行签到操作！！！\n当前正在执行B站自动签到任务: \n开始时间: ${ts} \n任务人数: ${tasklength}\n预计完成时间: ${estimatedCompletionTime}`,
      { EX: cd }
    )
    let remainingTasks = tasklength

    const signm = `[B站插件推送]报告主人！\n我要开始B站签到啦~\n任务人数: ${tasklength}\n任务开始时间: ${ts} \n预计完成时间: ${estimatedCompletionTime}`
    if (this.e) {
      await this.e.reply(signm)
    } else {
      if (!Bot.sendMasterMsg) {
        const cfg = (await import("../../../../lib/config/config.js")).default
        Bot.sendMasterMsg = async (signm) => {
          const masterList = cfg.masterQQ
          const firstMaster = masterList[0] === "stdin" && masterList.length > 1 ? masterList[1] : masterList[0]
          await common.relpyPrivate(firstMaster, signm)
        }
      }
      Bot.sendMasterMsg?.(signm)
    }
    let allParams = []
    for (const file of files) {
      const cookiesFilePath = path.join(cookiesDirPath, file)
      const cookiesData = yaml.parse(fs.readFileSync(cookiesFilePath, "utf-8"))
      let issign = false
      for (const userId in cookiesData) {
        if (await redis.get(`bili:alsign:${userId}`)) {
          logger.warn(`[BiliAllSign] B站账号${userId}今日已签到`)
          signskipCount++
          continue
        }
        logger.mark(`[BiliAllSign] 开始${file}的B站签到账号${userId}执行签到`)
        const userCookies = cookiesData[userId]
        const infoData = await Bili.getInfo(userCookies)
        const num = Math.floor(Math.random() * infoData.collectionTop.length)
        try {
          const videoData = await Bili.getFeed(userCookies)
          const userData = {
            uid: userId,
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
          issign = true
          const cd = Math.floor((new Date().setHours(24, 0, 0, 0) - Date.now()) / 1000 - 1)
          await redis.set(`bili:alsign:${userId}`, "1", { EX: cd })
        } catch (error) {
          logger.error(`[BiliSign] 签到任务失败: ${error}`)
        }
        signedCount++
        if (Object.keys(cookiesData).length > 1) {
          await Bili.sleep(5000)
        }
      }

      if (issign) await BSign.saveSignData(file, allParams)
      if (Object.keys(cookiesData).length > 1) {
        await Bili.sleep(5000)
      }
      remainingTasks--
      const Time = moment(Date.now() + remainingTasks * 100000).format("YYYY-MM-DD HH:mm:ss")
      let text = `请勿执行签到操作！！！\n当前正在执行B站自动签到任务\n任务剩余人数: ${remainingTasks}\n开始时间: ${ts}\n预计完成时间: ${Time}`
      if (remainingTasks > 0)
        await redis.set("bili:autosign:task", text, {
          EX: remainingTasks * 100
        })
    }

    await redis.del("bili:autosign:task")
    const tsfinish = moment()
    const duration = tsfinish.diff(tsstart)
    const m = `[B站插件推送]报告主人！\nB站自动签到完成啦~\n任务开始时间: ${ts} \n任务人数: ${tasklength}人\n执行签到账号数:${signedCount}\n跳过账号数(已签): ${signskipCount}\n预计完成时间(已完成): ${estimatedCompletionTime}\n任务耗时: ${moment
      .duration(duration)
      .asSeconds()} 秒`
    if (this.e) {
      await this.e.reply(m)
    } else {
      if (!Bot.sendMasterMsg) {
        const cfg = (await import("../../../../lib/config/config.js")).default
        Bot.sendMasterMsg = async (m) => {
          const masterList = cfg.masterQQ
          const firstMaster = masterList[0] === "stdin" && masterList.length > 1 ? masterList[1] : masterList[0]
          await common.relpyPrivate(firstMaster, m)
        }
      }
      if (files.length) {
        Bot.sendMasterMsg?.(m)
      }
    }
  }
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}
