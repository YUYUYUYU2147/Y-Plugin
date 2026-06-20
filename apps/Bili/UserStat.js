import fs from "fs"
import path from "path"
import yaml from "yaml"
import { Config } from "#components"
import { BiliAPI as Bili } from "#model"
import { REG } from "./index.js"
import { logger } from "#lib"

const STAT_REG = new RegExp(`^#?${REG}(用户|账号|账户|ck)统计$`)
const DelUser_REG = new RegExp(`^#?${REG}删除失效(用户|账号|账户|ck)$`)
const COOKIE_DIR = path.join("./data/bili/")

export class UserStat extends plugin {
  constructor() {
    super({
      name: "Y:B站用户",
      desc: "用户",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: STAT_REG,
          fnc: "UserStat"
        },
        {
          reg: DelUser_REG,
          fnc: "DelUser"
        }
      ]
    })
  }

  async UserStat(e) {
    if (!e.isMaster) return
    try {
      e.reply("正在统计B站用户, 请稍等~")
      const yamlFiles = this.getYamlFiles(COOKIE_DIR)
      let totalUsers = yamlFiles.length
      let totalAccounts = 0
      let invalidAccounts = 0
      for (const file of yamlFiles) {
        const data = this.readYamlFile(path.join(COOKIE_DIR, file))
        const cookies = this.extractCookies(data)
        totalAccounts += cookies.length
        for (const userCookies of cookies) {
          await Bili.sleep(100)
          const isValid = await Bili.status(userCookies)
          if (!isValid) {
            invalidAccounts++
          }
        }
      }
      e.reply(`B站用户统计\r绑定人数: ${totalUsers}\r绑定账号: ${totalAccounts}\r失效账号: ${invalidAccounts}`)
    } catch (error) {
      logger.error("B站用户统计时出错:", error)
      e.reply("B站用户统计时出错")
    }
  }

  async DelUser(e) {
    if (!e.isMaster) return
    try {
      e.reply("正在删除失效B站账号, 请稍等~")
      const yamlFiles = this.getYamlFiles(COOKIE_DIR)
      let deletedAccounts = 0
      for (const file of yamlFiles) {
        const filePath = path.join(COOKIE_DIR, file)
        const data = this.readYamlFile(filePath)
        const newData = await this.filterValidAccounts(data)
        const newYaml = yaml.stringify(newData)
        fs.writeFileSync(filePath, newYaml, "utf-8")
        deletedAccounts += this.getDeletedCount(data, newData)
        if (Object.keys(newData).length === 0) {
          fs.unlinkSync(filePath)
        }
      }
      e.reply(`已删除 ${deletedAccounts} 个失效账号`)
    } catch (error) {
      logger.error("B站删除失效账号时出错:", error)
      e.reply("B站删除失效账号时出错")
    }
  }

  getYamlFiles(dir) {
    const files = fs.readdirSync(dir)
    return files.filter((file) => file.endsWith(".yaml"))
  }

  readYamlFile(filePath) {
    const fileContent = fs.readFileSync(filePath, "utf-8")
    return yaml.parse(fileContent)
  }

  extractCookies(data) {
    const cookies = []
    const extract = (obj) => {
      if (typeof obj !== "object" || obj === null) return
      if (obj.DedeUserID) {
        cookies.push(obj)
      }
      for (const key in obj) {
        if (typeof obj[key] === "object") {
          extract(obj[key])
        }
      }
    }
    extract(data)
    return cookies
  }

  async filterValidAccounts(data) {
    const filter = async (obj) => {
      if (typeof obj !== "object" || obj === null) return obj
      if (obj.DedeUserID) {
        await Bili.sleep(100)
        const isValid = await Bili.status(obj)
        return isValid ? obj : null
      }
      const newObj = {}
      for (const key in obj) {
        const value = await filter(obj[key])
        if (value !== null) {
          newObj[key] = value
        }
      }
      return newObj
    }
    return await filter(data)
  }

  getDeletedCount(oldData, newData) {
    const oldIds = this.extractDedeUserIds(oldData)
    const newIds = this.extractDedeUserIds(newData)
    return oldIds.length - newIds.length
  }

  extractDedeUserIds(data) {
    const dedeUserIds = []
    const extract = (obj) => {
      if (typeof obj !== "object" || obj === null) return
      for (const key in obj) {
        if (key === "DedeUserID") {
          dedeUserIds.push(obj[key])
        } else if (typeof obj[key] === "object") {
          extract(obj[key])
        }
      }
    }
    extract(data)
    return dedeUserIds
  }
}
