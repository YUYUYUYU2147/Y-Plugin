import { Config } from "#components"
import moment from "moment"
import { logger } from "#lib"

export class ServerDetails extends plugin {
  constructor() {
    super({
      name: "Y:哪吒面板",
      dsc: "哪吒面板",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: /^#?(nz|nezha|哪吒)(面板|探针)$/,
          fnc: "mb"
        }
      ]
    })
  }

  async mb(e) {
    if (!e.isMaster) return
    const { nezhaIP, nezhaUser, nezhaCode } = Config.other
    const loginurl = `${nezhaIP}/api/v1/login`
    const lg = {
      username: nezhaUser,
      password: nezhaCode
    }
    const login = await fetch(loginurl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(lg)
    })
    const loginjson = await login.json()
    const headers = {
      Authorization: `Bearer ${loginjson.data.token}`
    }
    const url = `${nezhaIP}/api/v1/server`
    const response = await fetch(url, { headers })
    const json = await response.json()
    let servers = json.data
    servers = servers.sort((a, b) => a.id - b.id)
    const forwardNodes = servers.map((mb) => ({
      user_id: e.user_id,
      nickname: e.sender.nickname,
      message: [
        `${this.getFlagEmoji(mb.geoip?.country_code)} 名称：${mb.name || "未知"}`,
        `id：${mb.id || "未知"}`,
        ...(e.isGroup ? [] : [`V4：${mb.geoip?.ip?.ipv4_addr || "未知"}`, `V6：${mb.geoip?.ip?.ipv6_addr || "未知"}`]),
        `系统：${mb.host?.platform || "未知"} ${mb.host?.platform_version || ""} [${mb.host?.arch || "未知"}]`,
        `CPU：${mb.host?.cpu ? mb.host.cpu.join(", ") : "未知"}`,
        `GPU：${mb.host?.gpu ? mb.host.gpu.join(", ") : "未知"}`,
        `使用：${mb.state?.cpu ? mb.state.cpu.toFixed(2) + "%" : "未知"}`,
        `内存：${mb.state?.mem_used ? this.formatSize(mb.state.mem_used) : "未知"} / ${
          mb.host?.mem_total ? this.formatSize(mb.host.mem_total) : "未知"
        }`,
        `交换：${mb.state?.swap_used ? this.formatSize(mb.state.swap_used) : "未知"} / ${
          mb.host?.swap_total ? this.formatSize(mb.host.swap_total) : "未知"
        }`,
        `磁盘：${mb.state?.disk_used ? this.formatSize(mb.state.disk_used) : "未知"} / ${
          mb.host?.disk_total ? this.formatSize(mb.host.disk_total) : "未知"
        }`,
        `网速：↓${mb.state?.net_in_speed ? this.formatSize(mb.state.net_in_speed) + "/s" : "未知"} ↑${
          mb.state?.net_out_speed ? this.formatSize(mb.state.net_out_speed) + "/s" : "未知"
        }`,
        `流量：↓${mb.state?.net_in_transfer ? this.formatSize(mb.state.net_in_transfer) : "未知"} ↑${
          mb.state?.net_out_transfer ? this.formatSize(mb.state.net_out_transfer) : "未知"
        }`,
        `负载：${mb.state?.load_1 ? mb.state.load_1.toFixed(2) : "未知"} / ${
          mb.state?.load_5 ? mb.state.load_5.toFixed(2) : "未知"
        } / ${mb.state?.load_15 ? mb.state.load_15.toFixed(2) : "未知"}`,
        `运行：${mb.state?.uptime ? this.formatUptime(mb.state.uptime) : "未知"}`,
        `启动：${mb.host?.boot_time ? this.formatDate(mb.host.boot_time) : "未知"}`
      ].join("\n")
    }))
    const forwardMessage = await Bot.makeForwardMsg(forwardNodes)
    await e.reply(forwardMessage)
  }

  getFlagEmoji(countryCode) {
    countryCode = countryCode.toUpperCase()
    if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
      logger.error("国家代码无效:", countryCode)
      return ""
    }
    const firstLetter = countryCode.charCodeAt(0) - 65 + 0x1f1e6
    const secondLetter = countryCode.charCodeAt(1) - 65 + 0x1f1e6
    return String.fromCodePoint(firstLetter, secondLetter)
  }

  formatSize(sizeInBytes) {
    const sizeInKB = sizeInBytes / 1024
    const sizeInMB = sizeInKB / 1024
    if (sizeInMB < 1) {
      return sizeInKB < 1024 ? sizeInKB.toFixed(2) + " K" : sizeInMB.toFixed(2) + " M"
    } else if (sizeInMB >= 1024) {
      return (sizeInMB / 1024).toFixed(2) + " G"
    } else {
      return sizeInMB.toFixed(2) + " M"
    }
  }

  formatUptime(seconds) {
    const duration = moment.duration(seconds, "seconds")
    return `${duration.days()}天 ${duration.hours()}小时 ${duration.minutes()}分钟`
  }

  formatDate(timestamp) {
    return moment.unix(timestamp).format("YYYY年MM月DD日 HH:mm:ss")
  }
}
