/**
 * @file 泥也要涩涩吗
 * @author 原作者MiX
 * @version 1.0.0
 */
import { Config } from "#components"

export class ycyc extends plugin {
  constructor() {
    super({
      name: "Y:验车",
      dsc: "验车",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#验车",
          fnc: "yc"
        }
      ]
    })
  }

  async yc(e) {
    if (!Config.other.SeseSet) return false
    switch (Config.other.Sese) {
      case 1:
        if (!e.isMaster) {
          return e.reply("仅主人可用哦！", true, { recallMsg: 5 })
        }
        break
      case 2:
        if (!(e.isMaster || Config.other.SeseList.includes(String(e.user_id)))) {
          return e.reply("仅主人和白名单可用哦！", true, { recallMsg: 5 })
        }
        break
      default:
        break
    }

    let CD = {}
    if (CD[e.user_id] && !e.isMaster) {
      e.reply("防止风控，功能冷却中，请稍后再试", true, { recallMsg: 500 })
      return true
    }
    CD[e.user_id] = true
    CD[e.user_id] = setTimeout(() => {
      if (CD[e.user_id]) {
        delete CD[e.user_id]
      }
    }, 360000)
    const link = e.msg.replace(/#验车/g, "")
    e.reply("正在验车！马上就来, 不要走开哦~", true)
    try {
      const response = await fetchMagnetInfo(link)
      const { type, file_type, name, screenshots, size, count } = response
      if (/is\s+too\s+frequent/.test(name)) return e.reply("获取验车信息失败: 请求过于频繁")
      const formattedSize = formatFileSize(size)
      const dec = "点我查看验车内容"
      const messageContent = [
        `文件名: ${name}\n文件类型: ${file_type || type}\n文件数量: ${count}\n${
          file_type === "folder" || type === "FOLDER" ? "文件夹" : "文件"
        }总大小: ${formattedSize}`
      ]

      if (screenshots) {
        screenshots.forEach((screenshot) => {
          const urls = screenshot.screenshot
          messageContent.push(segment.image(urls))
        })
      }
      let Msg = await this.makeForwardMsg(e, messageContent, dec)
      await e.reply(Msg, false, { recallMsg: 100 })
    } catch (error) {
      e.reply(`获取验车信息失败: ${error}`)
    }
  }

  async makeForwardMsg(e, msg = [], dec = "") {
    let userInfo = {
      nickname: e.sender.nickname,
      user_id: e.user_id
    }

    let forwardMsg = []
    msg.forEach((v) => {
      forwardMsg.push({
        ...userInfo,
        message: v
      })
    })

    if (e.isGroup) {
      forwardMsg = await e.group.makeForwardMsg(forwardMsg)
    } else if (e.friend) {
      forwardMsg = await e.friend.makeForwardMsg(forwardMsg)
    } else {
      return false
    }

    if (dec) {
      if (typeof forwardMsg.data === "object") {
        let detail = forwardMsg.data?.meta?.detail
        if (detail) {
          detail.news = [{ text: dec }]
        }
      } else {
        forwardMsg.data = forwardMsg.data
          .replace('<?xml version="1.0" encoding="utf-8"?>', '<?xml version="1.0" encoding="utf-8" ?>')
          .replace(/\n/g, "")
          .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, "___")
          .replace(/___+/, `<title color="#777777" size="26">${dec}</title>`)
      }
    }
    return forwardMsg
  }
}

// const getCookies = async (url) => {
//  const response = await fetch(url, {
//    method: "GET",
//    headers: {
//      Accept: "application/json, text/plain, */*",
//      "Accept-Encoding": "gzip, deflate, br",
//      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
//      Connection: "keep-alive",
//      Host: "whatslink.info",
//      Referer: "https://whatslink.info/",
//      "User-Agent":
//        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.36"
//    }
//  })
//
//  if (!response.ok) {
//    throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`)
//  }
//
//  const cookies = response.headers.get("set-cookie")
//  if (!cookies) throw new Error("No Set-Cookie header found.")
//  return cookies
// }

const fetchMagnetInfo = async (url) => {
  // const cookieString = await getCookies("https://whatslink.info/api/v1/link?url=magnet:?xt=urn:btih:b84368dd748663885d5bd8ff38edb193ba5e0293")
  const options = {
    method: "GET",
    headers: {
      // Accept: "application/json, text/plain, */*",
      // "Accept-Encoding": "gzip, deflate, br",
      // "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      // Connection: "keep-alive",
      // Host: "whatslink.info",
      Referer: "https://whatslink.info/"
      // "User-Agent":
      //  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.36",
      // Cookie: cookieString,
    }
  }

  const res = await fetch(`${Config.proxy.pr || ""}https://whatslink.info/api/v1/link?url=${url}`, options)
  if (!res.ok) throw new Error("网络响应失败")
  return res.json()
}

const formatFileSize = (size) => {
  const units = ["Bytes", "KB", "MB", "GB", "TB"]
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}
