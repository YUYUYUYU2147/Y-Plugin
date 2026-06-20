/**
 * B站签到记录
 * 修复：readFileSync 前 fs.existsSync 检查，JSON 解析后空数组检查
 * 避免文件不存在或内容为空时报错
 */
import fs from "fs"
import path from "path"
import { Config, common } from "#components"
import { REG } from "./index.js"
import { logger } from "#lib"

const SignLogReg = new RegExp(`^#?${REG}签到记录$`)

export class Bilisignlog extends plugin {
  constructor() {
    super({
      name: "Y:B站记录",
      desc: "签到记录",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: SignLogReg,
          fnc: "signlog"
        }
      ]
    })
    this.task = {
      cron: "50 59 23 * * *",
      name: "B站自动删除日志文件",
      fnc: () => this.dellog()
    }
  }

  async signlog(e) {
    const cookieFile = `./data/bili/${e.user_id}.yaml`
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    const LogFile = `./data/bilisign/${e.user_id}.json`
    if (!fs.existsSync(LogFile)) {
      logger.warn(`签到记录文件不存在: ${LogFile}`)
      return await e.reply("暂无签到记录，请先签到")
    }
    const rawData = fs.readFileSync(LogFile, "utf8")
    const recordsArray = JSON.parse(rawData)
    if (!recordsArray.length) {
      return await e.reply("暂无签到记录，请先签到", true)
    }
    for (const records of recordsArray) {
      const msg = await common.render("Bili/signlog", records, { e, scale: 1 })
      await e.reply(msg)
    }
    return true
  }

  async dellog() {
    const dirPath = path.join("./data/bilisign")
    try {
      if (!fs.existsSync(dirPath)) {
        logger.info("B站签到日志目录不存在")
        return
      }
      const files = await new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
          if (err) {
            reject(err)
          } else {
            resolve(files)
          }
        })
      })
      const jsonFiles = files.filter((file) => path.extname(file).toLowerCase() === ".json")
      if (jsonFiles.length === 0) {
        logger.warn("B站没有找到签到日志文件")
        return
      }
      for (const file of jsonFiles) {
        const filePath = path.join(dirPath, file)
        try {
          await new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            })
          })
          logger.info(`已删除文件 data/bilisign/${file}`)
        } catch (err) {
          logger.error(`无法删除文件 ${file}: ${err}`)
        }
      }
      logger.info("所有签到日志已删除")
    } catch (err) {
      logger.error(`无法读取签到日志目录: ${err}`)
    }
  }
}
