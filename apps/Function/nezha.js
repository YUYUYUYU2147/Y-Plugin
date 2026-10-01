import { Config } from "#components"
import moment from "moment"
import { logger } from "#lib"
import crypto from "node:crypto"

export class ServerDetails extends plugin {
  constructor() {
    super({
      name: "Y:服务器面板",
      dsc: "哪吒/1Panel 面板",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
            // 三支：哪吒系列、1Panel 系列、以及不点名的通用名。
            // 通用名这一支是给「面板类型」这个配置项留入口的 —— 之前规则只认
            // 带面板名的指令，panelType 配了也没机会被读到，敲什么走什么。
            // 现在敲 #服务器面板 不带名字，才会回落到配置里的 panelType。
            reg: /^#?(?:(nz|nezha|哪吒)(面板|探针)|(1panel|1Panel|1panal|1Panal)(面板|状态|探针)?|(服务器面板|主机面板|面板))$/,
          fnc: "mb"
        }
      ]
    })
  }

  async mb(e) {
    if (!e.isMaster) return
    const msg = String(e.msg || "")
    // 指令里带了哪个面板名就按哪个来，两个都没带才读配置。
    // 之前只判 1Panel，#哪吒面板 / #nz面板 这类会落到配置里的 panelType，
    // 而默认是 1Panel —— 结果敲哪吒的指令却去查 1Panel。
    let type
    if (/1pan(?:el|al)/i.test(msg)) type = "1panel"
    else if (/(nz|nezha|哪吒)/i.test(msg)) type = "nezha"
    else type = String(Config.other.panelType || "1panel").toLowerCase()
    try {
      if (type === "1panel") return await this.onePanel(e)
      return await this.nezha(e)
    } catch (err) {
      logger.error(`[Y][server-panel] ${err?.stack || err?.message || err}`)
      return e.reply(`面板请求失败：${err?.message || err}`, true)
    }
  }

  async nezha(e) {
    const { nezhaIP, nezhaUser, nezhaCode } = Config.other
    if (!nezhaIP || !nezhaUser || !nezhaCode) return e.reply("哪吒面板配置不完整，请在锅巴填写面板地址、用户和密码。", true)
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
    if (!login.ok || !loginjson?.data?.token) throw new Error(loginjson?.message || `哪吒登录失败(${login.status})`)
    const headers = {
      Authorization: `Bearer ${loginjson.data.token}`
    }
    const url = `${nezhaIP}/api/v1/server`
    const response = await fetch(url, { headers })
    const json = await response.json()
    let servers = json.data
    if (!response.ok || !Array.isArray(servers)) throw new Error(json?.message || `哪吒服务器列表获取失败(${response.status})`)
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

  async onePanel(e) {
    const {
      onePanelIP,
      onePanelKey,
      onePanelName,
      nezhaIP
    } = Config.other
    const baseUrl = String(onePanelIP || nezhaIP || "").trim().replace(/\/+$/, "")
    const apiKey = String(onePanelKey || "").trim()
    if (!baseUrl || !apiKey) return e.reply("1Panel 配置不完整，请在锅巴填写 1Panel 地址和 API Key。", true)

    const data = await this.loadOnePanel(baseUrl, apiKey)
    const base = data.base || {}
    const cur = data.current || base.currentInfo || {}
    const disk = this.pickDisk(cur.diskData)
    const title = onePanelName || base.hostname || "1Panel"
    const gpuLine = this.formatAccelerators(cur)
    const topLines = this.formatTopProcesses(data.topCpu, data.topMem)
    const lines = [
      `名称：${title}`,
      `面板：1Panel ${data.version}`,
      `主机：${base.hostname || "未知"}`,
      `系统：${base.prettyDistro || [base.platform, base.platformVersion].filter(Boolean).join(" ") || base.os || "未知"} [${base.kernelArch || "未知"}]`,
      `内核：${base.kernelVersion || "未知"}`,
      `CPU：${base.cpuModelName || "未知"} (${base.cpuLogicalCores || cur.cpuTotal || "?"} 线程)`,
      `使用：${this.formatPercent(cur.cpuUsedPercent)}`,
      `内存：${this.formatSize(cur.memoryUsed)} / ${this.formatSize(cur.memoryTotal)} (${this.formatPercent(cur.memoryUsedPercent)})`,
      `交换：${this.formatSize(cur.swapMemoryUsed)} / ${this.formatSize(cur.swapMemoryTotal)} (${this.formatPercent(cur.swapMemoryUsedPercent)})`,
      `磁盘：${disk ? `${this.formatSize(disk.used)} / ${this.formatSize(disk.total)} (${this.formatPercent(disk.usedPercent)})` : "未知"}`,
      `流量：↓${this.formatSize(cur.netBytesRecv)} ↑${this.formatSize(cur.netBytesSent)}`,
      `IO：读 ${this.formatSize(cur.ioReadBytes)} / 写 ${this.formatSize(cur.ioWriteBytes)}`,
      `负载：${this.formatNumber(cur.load1)} / ${this.formatNumber(cur.load5)} / ${this.formatNumber(cur.load15)}`,
      `进程：${cur.procs ?? "未知"}`,
      `运行：${this.formatRunningTime(cur)}`,
      ...(gpuLine ? [`加速卡：${gpuLine}`] : []),
      ...(topLines.length ? ["", ...topLines] : [])
    ]
    return e.reply(lines.join("\n"), true)
  }

  /**
   * 只支持 v2。
   *
   * v1 的 dashboard 挂在登录态中间件上（v1.9.6 backend/router/ro_dashboard.go）：
   *   cmdRouter := Router.Group("dashboard").Use(middleware.JwtAuth()).Use(middleware.SessionAuth())
   * 而 1Panel-Token / 1Panel-Timestamp 这套 API Key 鉴权是 v2 才有的
   * （只在 core/app/auth/api_auth.go，v1 的 backend/ 里搜不到）。
   * 所以拿 API Key 查 v1 的 /api/v1/dashboard/... 一定失败，v1 兜底是死代码。
   */
  async loadOnePanel(baseUrl, apiKey) {
    const errors = []
    for (const auth of this.onePanelAuthModes()) {
      try {
        const base = await this.onePanelJson(baseUrl, apiKey, "v2", "/api/v2/dashboard/base/all/all", auth)
        // Top 进程是附加信息，取不到就少两行，不该让整个查询失败
        const topCpu = await this.onePanelTop(baseUrl, apiKey, "cpu", auth)
        const topMem = await this.onePanelTop(baseUrl, apiKey, "mem", auth)
        return { version: `v2/${auth}`, base, current: base?.currentInfo || {}, topCpu, topMem }
      } catch (err) {
        errors.push(`v2/${auth}: ${err.message}`)
      }
    }
    throw new Error(errors.join("；") || "1Panel API 无返回")
  }

  /** Top 进程单独兜错：v1 没有这个接口、或权限不足时都只影响这两行 */
  async onePanelTop(baseUrl, apiKey, kind, auth) {
    try {
      const data = await this.onePanelJson(baseUrl, apiKey, `/api/v2/dashboard/current/top/${kind}`, auth)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  /** 两种签名都试：hmac 是 2.x 主推的，md5 兼容旧版 */
  onePanelAuthModes() {
    return ["hmac", "md5"]
  }

  async onePanelJson(baseUrl, apiKey, path, authMode) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: this.onePanelHeaders(apiKey, authMode),
        signal: controller.signal
      })
      const text = await response.text()
      let json = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(`返回非 JSON：${text.slice(0, 80)}`)
      }
      if (!response.ok) throw new Error(json?.message || json?.msg || `HTTP ${response.status}`)
      const code = Number(json?.code ?? 200)
      if (code && code !== 200) throw new Error(json?.message || json?.msg || `code=${json.code}`)
      return json?.data ?? json
    } catch (err) {
      throw new Error(err?.name === "AbortError" ? "请求超时" : err.message)
    } finally {
      clearTimeout(timer)
    }
  }

  onePanelHeaders(apiKey, authMode) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const token = authMode === "hmac"
      ? crypto.createHmac("sha256", apiKey).update(`1panel:${timestamp}`).digest("hex")
      : crypto.createHash("md5").update(`1panel${apiKey}${timestamp}`).digest("hex")
    return {
      "1Panel-Token": token,
      "1Panel-Timestamp": timestamp,
      "Content-Type": "application/json"
    }
  }

  getFlagEmoji(countryCode) {
    countryCode = String(countryCode || "").toUpperCase()
    if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
      logger.error("国家代码无效:", countryCode)
      return ""
    }
    const firstLetter = countryCode.charCodeAt(0) - 65 + 0x1f1e6
    const secondLetter = countryCode.charCodeAt(1) - 65 + 0x1f1e6
    return String.fromCodePoint(firstLetter, secondLetter)
  }

  formatSize(sizeInBytes) {
    if (sizeInBytes === undefined || sizeInBytes === null || Number.isNaN(Number(sizeInBytes))) return "未知"
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

  formatPercent(value) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return "未知"
    return `${Number(value).toFixed(2)}%`
  }

  formatNumber(value) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return "未知"
    return Number(value).toFixed(2)
  }

  formatRunningTime(cur = {}) {
    if (cur.runningTime) {
      const { days = 0, hours = 0, minutes = 0 } = cur.runningTime
      return `${days}天 ${hours}小时 ${minutes}分钟`
    }
    return cur.uptime ? this.formatUptime(cur.uptime) : "未知"
  }

  pickDisk(disks = []) {
    if (!Array.isArray(disks) || !disks.length) return null
    const disk = disks.find(i => i.path === "/") || disks.reduce((sum, disk) => ({
      used: Number(sum.used || 0) + Number(disk.used || 0),
      total: Number(sum.total || 0) + Number(disk.total || 0),
      usedPercent: 0
    }), {})
    if (!disk.usedPercent && disk.total) disk.usedPercent = disk.used / disk.total * 100
    return disk
  }

  /**
   * Top 进程。1Panel 的 dashboard 路由在 agent 侧（agent/router/ro_dashboard.go），
   * core 的启动日志里不打印，所以别照着 core 的路由表找。
   * 返回的是 [{ name, pid, percent, memory, cmd }]，各版本字段可能缺，逐项兜底。
   */
  formatTopProcesses(topCpu = [], topMem = [], limit = 3) {
    const brief = (list, render) => {
      if (!Array.isArray(list) || !list.length) return ""
      return list
        .filter(i => i && (i.name || i.cmd))
        .slice(0, limit)
        .map((i, idx) => `${idx + 1}. ${i.name || "未知"}(${i.pid ?? "?"}) ${render(i)}`)
        .join(" / ")
    }
    const lines = []
    const cpu = brief(topCpu, (i) => this.formatPercent(i.percent))
    const mem = brief(topMem, (i) => this.formatSize(i.memory))
    if (cpu) lines.push(`CPU 占用 TOP${limit}：${cpu}`)
    if (mem) lines.push(`内存占用 TOP${limit}：${mem}`)
    return lines
  }

  formatAccelerators(cur = {}) {
    const list = [
      ...(Array.isArray(cur.gpuData) ? cur.gpuData : []),
      ...(Array.isArray(cur.npuData) ? cur.npuData : []),
      ...(Array.isArray(cur.xpuData) ? cur.xpuData : [])
    ]
    return list
      .map(i => [i.productName || i.deviceName || i.type, i.gpuUtil || i.memoryUtil, i.temperature].filter(Boolean).join(" "))
      .filter(Boolean)
      .join("；")
  }
}
