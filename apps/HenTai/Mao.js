/**
 * @file 泥也要涩涩吗
 * @author 原作者kkp-plugin
 * @version 1.0.0
 */

import { Config } from "#components"
import puppeteer from "puppeteer"

export class Mao extends plugin {
  constructor() {
    super({
      name: "Y:磁力猫",
      dsc: "磁力猫",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#?磁力猫(.*)$",
          fnc: "processMagnetLink"
        }
      ]
    })
  }

  async processMagnetLink(e) {
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

    let match = e.msg.match(/^#?磁力猫\s*(\S+)(\s+(\S+))?(\s+(\S+))?(\s+(\d+))?$/)
    if (!match) {
      return
    }

    const userInput = encodeURIComponent(match[1])
    const fileType = this.fileTypeMap[match[3]] ?? 0
    const orderType = this.orderTypeMap[match[5]] ?? 0
    const resultCount = parseInt(match[7]) || 10

    const urls = [
      `${Config.proxy.pr || ""}https://www.8800481.xyz/search-${userInput}-${fileType}-${orderType}-1.html`,
      `${Config.proxy.pr || ""}https://www.8800482.xyz/search-${userInput}-${fileType}-${orderType}-1.html`,
      `${Config.proxy.pr || ""}https://www.8800475.xyz/search-${userInput}-${fileType}-${orderType}-1.html`
    ]

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    })
    let page

    for (let i = 0; i < urls.length; i++) {
      try {
        page = await browser.newPage()
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        await page.goto(urls[i], {
          waitUntil: "domcontentloaded",
          timeout: 10000
        })

        await page.waitForSelector(".ssbox", { timeout: 5000 })

        const searchResults = await page.$$(".ssbox")
        if (searchResults.length === 0) {
          await this.reply("搜索失败，正在尝试下个链接")
          await page.close()
          continue
        }

        const results = []
        for (let i = 0; i < Math.min(resultCount, searchResults.length); i++) {
          const result = searchResults[i]

          const title = await result.$eval(".title h3 a", (el) => el.textContent.trim())
          const magnetLink = await result.$eval('.sbar a[href^="magnet:"]', (el) => el.href)
          const metadata = await result.$$eval(".sbar span", (spans) => {
            const data = {}
            spans.forEach((span) => {
              const text = span.textContent
              if (text.includes("添加时间")) {
                data.addedTime = span.querySelector("b").textContent
              } else if (text.includes("大小")) {
                data.size = span.querySelector(".yellow-pill").textContent
              } else if (text.includes("最近下载")) {
                data.recentDownload = span.querySelector("b").textContent
              } else if (text.includes("热度")) {
                data.heat = span.querySelector("b").textContent
              }
            })
            return data
          })

          results.push({
            user_id: e.user_id,
            nickname: e.user_id,
            message: `${title}\r\r${magnetLink}\r\r添加时间：${metadata.addedTime}\r大小：${metadata.size}\r最近下载：${metadata.recentDownload}\r热度：${metadata.heat}`
          })
        }

        if (results.length > 0) {
          const forwardMsg = await Bot.makeForwardMsg(results)
          await e.reply(forwardMsg)
          await browser.close()
          return
        } else {
          await this.reply("未找到磁力链接")
          await page.close()
          continue
        }
      } catch (error) {
        console.log(`在URL ${urls[i]} 上出现错误：${error.toString()}`)
        if (page) await page.close()
        continue
      }
    }
    await this.reply("所有链接均无搜索结果")
    await browser.close()
  }

  fileTypeMap = {
    全部: 0,
    影视: 1,
    音乐: 2,
    图像: 3,
    文档: 4,
    压缩包: 5,
    安装包: 6,
    其他: 7
  }

  orderTypeMap = {
    相关度: 0,
    文件大小: 1,
    添加时间: 2,
    热度: 3,
    最近下载: 4
  }
}
