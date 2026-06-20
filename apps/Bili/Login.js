/**
 * B站登录模块
 * - #B站登录：web QR 扫码，捕获 SESSDATA + refresh_token，尝试兑换 access_token
 * - #B站设置token：手动填入 access_token [refresh_token]（用于 web 无法兑换 app token 的降级方案）
 * - #B站退出：删除本地 YAML 文件
 * - restart：POST 方式调用 refresh_token 接口续期
 * 已知限制：
 * - web QR 的 refresh_token 无法通过 OAuth2 接口兑换为 access_token（返回 -400）
 * - 无 access_token 时投币/分享/点赞等写操作跳过
 */
import fs from "fs"
import path from "path"
import yaml from "yaml"
import { Config } from "#components"
import { Button } from "#model"
import { REG } from "./index.js"
import { logger } from "#lib"
import qrcode from "qrcode"

const BILIBILI_API = "https://passport.bilibili.com/x/passport-login/web"
const OAUTH_REFRESH = "https://passport.bilibili.com/x/passport-login/oauth2/refresh_token"

const login = "(扫码)?(登陆|登录)"
const restart = "刷新[Cc][Kk]"
const out = "退出"
const setToken = "设置token"

const loginReg = new RegExp(`^#?${REG}${login}$|^#?${login}${REG}$`)
const restartReg = new RegExp(`^#?${REG}${restart}$`)
const outReg = new RegExp(`^#?${REG}${out}$|^#?${out}${REG}$`)
const setTokenReg = new RegExp(`^#?${REG}${setToken}\\s+`)

export class Bililogin extends plugin {
  constructor() {
    super({
      name: "Y:B站登录",
      desc: "登录",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: loginReg,
          fnc: "login"
        },
        {
          reg: setTokenReg,
          fnc: "setToken"
        },
        {
          reg: restartReg,
          fnc: "restart"
        },
        {
          reg: outReg,
          fnc: "out"
        }
      ]
    })
  }

  async login(e) {
    if (await redis.get(`login:${e.user_id}`)) return e.reply("前置二维码未失效，请稍后尝试", true)
    const storageDir = "./data/bili"
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }
    try {
      await redis.set(`login:${e.user_id}`, "pending", "EX", 300)
      const qrRes = await fetch(`${BILIBILI_API}/qrcode/generate`, {
        method: 'GET',
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.bilibili.com/"
        },
        signal: AbortSignal.timeout(10000)
      })
      if (!qrRes.ok) {
        throw new Error(`API返回状态码: ${qrRes.status}`)
      }
      const qrInfo = await qrRes.json()
      if (qrInfo.code !== 0 || !qrInfo.data) throw new Error(`获取二维码信息失败: ${qrInfo.message || "未知错误"}`)
      const { url, qrcode_key } = qrInfo.data
      let qrBuffer
      try {
        qrBuffer = await qrcode.toBuffer(url, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 200
        })
        await e.reply(["请使用B站APP扫描下方二维码登录（支持投币等完整功能）：", segment.image(qrBuffer)], true)
      } catch (qrError) {
        logger.error("生成二维码失败：", qrError)
        await e.reply("生成二维码失败，请稍后再试", true)
        await redis.del(`login:${e.user_id}`)
        return
      }
      let isSuccess = false
      let pollCount = 0
      const maxPollCount = 30
      const pollInterval = 2000

      while (pollCount < maxPollCount && !isSuccess) {
        try {
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
          pollCount++
          const pollRes = await fetch(`${BILIBILI_API}/qrcode/poll?qrcode_key=${qrcode_key}`, {
            method: 'GET',
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Referer: "https://www.bilibili.com/"
            }
          })
          const pollData = await pollRes.json()

          if (pollData.code === 0 && pollData.data) {
            const innerCode = pollData.data.code
            if (innerCode === 0) {
              isSuccess = true
              await this.handleLoginSuccess(pollData.data, e)
              break
            } else if (innerCode === 86038) {
              await e.reply("二维码已过期，请重新获取", true)
              break
            }
          } else {
            logger.error(`轮询异常响应: ${JSON.stringify(pollData)}`)
            break
          }
        } catch (pollError) {
          logger.error("登录轮询失败：", pollError)
          await e.reply("登录验证失败，请重试", true)
          break
        }
      }
      if (!isSuccess && pollCount >= maxPollCount) {
        await e.reply("登录超时，请重新获取二维码", true)
      }
    } catch (error) {
      logger.error("登录流程失败：", error)
      const errMsg = error.message || error.toString()
      if (errMsg.includes('timeout') || errMsg.includes('AbortSignal')) {
        await e.reply("二维码服务响应超时，请检查API服务是否正常运行", true)
      } else if (errMsg.includes('状态码')) {
        await e.reply(`二维码服务异常（${errMsg}），请联系管理员检查配置`, true)
      } else {
        await e.reply("获取二维码失败，请稍后再试", true)
      }
    } finally {
      await redis.del(`login:${e.user_id}`)
    }
  }

  async handleLoginSuccess(data, e) {
    try {
      const redirectUrl = data.url || ""

      let mid = ""
      if (redirectUrl.includes("DedeUserID=")) {
        const match = redirectUrl.match(/DedeUserID=(\d+)/)
        if (match) mid = match[1]
      }
      if (!mid) mid = data.mid || ""

      let cookieInfo = {
        SESSDATA: "",
        bili_jct: "",
        DedeUserID: mid,
        DedeUserID__ckMd5: "",
        sid: ""
      }

      if (redirectUrl) {
        try {
          const redirectRes = await fetch(redirectUrl, {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Referer: "https://passport.bilibili.com/",
              Accept: "*/*"
            },
            redirect: "manual"
          })

          logger.info(`[扫码登录] 重定向状态=${redirectRes.status}`)

          let setCookieStr = ""
          try {
            if (typeof redirectRes.headers.getSetCookie === "function") {
              const cookies = redirectRes.headers.getSetCookie()
              setCookieStr = cookies.join("|||")
            } else if (Array.isArray(redirectRes.headers["set-cookie"])) {
              setCookieStr = redirectRes.headers["set-cookie"].join("|||")
            } else if (typeof redirectRes.headers["set-cookie"] === "string") {
              setCookieStr = redirectRes.headers["set-cookie"]
            } else if (redirectRes.headers.raw && typeof redirectRes.headers.raw === "function") {
              const rawHeaders = redirectRes.headers.raw()
              setCookieStr = (rawHeaders["set-cookie"] || []).join("|||")
            }
          } catch (e) {
            logger.warn(`[扫码登录] 提取Set-Cookie异常: ${e.message}`)
          }

          logger.info(`[扫码登录] Set-Cookie原始数据长度: ${setCookieStr.length}`)

          if (setCookieStr) {
            const cookiePairs = setCookieStr.split("|||")
            cookiePairs.forEach((cookieHeader) => {
              const pair = cookieHeader.split(";")[0].trim()
              const eqIdx = pair.indexOf("=")
              if (eqIdx > 0) {
                const name = pair.substring(0, eqIdx).trim()
                const value = pair.substring(eqIdx + 1).trim()
                switch (name) {
                  case "SESSDATA": cookieInfo.SESSDATA = value; break
                  case "bili_jct": cookieInfo.bili_jct = value; break
                  case "DedeUserID": cookieInfo.DedeUserID = value; break
                  case "DedeUserID__ckMd5": cookieInfo.DedeUserID__ckMd5 = value; break
                  case "sid": cookieInfo.sid = value; break
                }
              }
            })
          }
        } catch (fetchErr) {
          logger.error(`[扫码登录] 请求重定向URL失败: ${fetchErr.message}`)
        }
      }

      if (!cookieInfo.SESSDATA) {
        logger.error(`登录数据校验失败：SESSDATA为空, mid=${mid}, url=${redirectUrl}`)
        await e.reply("登录成功但获取凭证失败，请重试", true)
        return
      }

      const refreshToken = data.refresh_token || ""
      let accessToken = ""

      // 尝试从poll响应直接获取token_info
      if (data.token_info?.access_token) {
        accessToken = data.token_info.access_token
        logger.info("[扫码登录] poll直接返回access_token")
      }

      // 尝试用refresh_token兑换access_token
      if (!accessToken && refreshToken) {
        try {
          const tokenRes = await fetch(OAUTH_REFRESH, {
            method: "POST",
            headers: { 
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Cookie": `SESSDATA=${cookieInfo.SESSDATA}; bili_jct=${cookieInfo.bili_jct}`
            },
            body: new URLSearchParams({ refresh_token: refreshToken }).toString()
          })
          const tokenData = await tokenRes.json()
          if (tokenData.code === 0 && tokenData.data?.token_info?.access_token) {
            accessToken = tokenData.data.token_info.access_token
            logger.info("[扫码登录] 成功获取access_token")
          }
        } catch (e) {
          logger.warn("获取access_token失败：", e.message)
        }
      }

      const newUserData = {
        SESSDATA: cookieInfo.SESSDATA,
        csrf: cookieInfo.bili_jct,
        DedeUserID: cookieInfo.DedeUserID,
        DedeUserID__ckMd5: cookieInfo.DedeUserID__ckMd5,
        sid: cookieInfo.sid,
        expires_in: Date.now() + 86400 * 1000 * 30,
        LoginGroup: e.group_id
      }
      if (accessToken) {
        newUserData.access_token = accessToken
        newUserData.refresh_token = refreshToken
      }

      const storageDir = "./data/bili"
      const filePath = path.join(storageDir, `${e.user_id}.yaml`)
      let existingData = {}
      if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, "utf8")
        existingData = yaml.parse(existingContent) || {}
      }
      const targetUserId = cookieInfo.DedeUserID || mid
      const mergedData = {
        ...existingData,
        [targetUserId]: existingData[targetUserId] ? { ...existingData[targetUserId], ...newUserData } : newUserData
      }
      const yamlString = yaml.stringify(mergedData, {
        indent: 2,
        simpleKeys: true
      })
      fs.writeFileSync(filePath, yamlString, "utf8")
      logger.info(`用户 ${e.user_id} B站登录成功（${existingData[targetUserId] ? "覆盖" : "新增"}账号：${targetUserId}`)
      const replyMsg = accessToken
        ? `登录成功！用户ID：${mid || targetUserId}（已获取完整app权限）`
        : `登录成功！用户ID：${mid || targetUserId}（仅网页权限，投币等功能需重新使用APP扫码）`
      await e.reply(replyMsg, true)
    } catch (saveError) {
      logger.error("登录数据存储失败：", saveError)
      await e.reply("登录成功，但数据存储失败，请联系管理员", true)
    }
  }

  async setToken(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请先发送【B站登录】再设置token", true)
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const userIds = Object.keys(cookiesData)
    let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
    if (!userIds.includes(currentUserId)) {
      currentUserId = userIds[0]
      await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
    }
    const parts = e.msg.replace(setTokenReg, "").trim().split(/\s+/)
    const accessToken = parts[0]
    const refreshToken = parts[1] || ""
    if (!accessToken) {
      return await e.reply("用法：#B站设置token access_token [refresh_token]\n需要至少提供access_token", true)
    }
    cookiesData[currentUserId].access_token = accessToken
    if (refreshToken) cookiesData[currentUserId].refresh_token = refreshToken
    fs.writeFileSync(cookieFile, yaml.stringify(cookiesData))
    logger.info(`用户 ${e.user_id} 手动设置access_token成功`)
    await e.reply("access_token 设置成功！可以重新尝试签到等操作了", true)
  }

  async restart(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    let cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const updatedCookies = {}
    const successMessages = []
    for (const dedeUserId in cookiesData) {
      const userCookies = cookiesData[dedeUserId]
      try {
        const restartData = await fetch("https://passport.bilibili.com/x/passport-login/oauth2/refresh_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            access_key: userCookies.access_token,
            refresh_token: userCookies.refresh_token
          }).toString()
        })
        if (!restartData.ok) {
          throw new Error(`请求失败，状态码: ${restartData.status}`)
        }
        const data = await restartData.json()

        const ts = Math.floor(Date.now() / 1000)
        const expires = data.data.token_info.expires_in
        const ationTime = ts * 1000 + expires * 1000

        const excludedKeys = [
          "access_token",
          "SESSDATA",
          "csrf",
          "DedeUserID",
          "DedeUserID__ckMd5",
          "sid",
          "refresh_token",
          "expires_in",
          "LoginGroup"
        ]
        const additionalParams = {}
        for (const key in userCookies) {
          if (!excludedKeys.includes(key)) {
            additionalParams[key] = userCookies[key]
          }
        }

        const updatedCookie = {
          access_token: data.data.token_info.access_token,
          SESSDATA: data.data.cookie_info.cookies.find((c) => c.name === "SESSDATA")?.value,
          csrf: data.data.cookie_info.cookies.find((c) => c.name === "bili_jct")?.value,
          DedeUserID: data.data.cookie_info.cookies.find((c) => c.name === "DedeUserID")?.value,
          DedeUserID__ckMd5: data.data.cookie_info.cookies.find((c) => c.name === "DedeUserID__ckMd5")?.value,
          sid: data.data.cookie_info.cookies.find((c) => c.name === "sid")?.value,
          refresh_token: data.data.token_info.refresh_token,
          expires_in: ationTime,
          LoginGroup: e.group_id,
          ...additionalParams
        }

        updatedCookies[dedeUserId] = updatedCookie
        successMessages.push(`账号${successMessages.length + 1}：${dedeUserId}`)
      } catch (err) {
        logger.error(`刷新Token失败 (DedeUserID: ${dedeUserId}):`, err)
        e.reply(`B站CK更新失败 (DedeUserID: ${dedeUserId})`, true)
      }
    }
    try {
      const updatedContent = yaml.stringify(updatedCookies)
      fs.writeFileSync(cookieFile, updatedContent, "utf8")
      const successReply = `B站CK刷新成功\n${successMessages.join("\n")}`
      e.reply([successReply, new Button().help()], true)
    } catch (err) {
      logger.error("无法写入cookie文件:", err)
      e.reply("B站CK刷新失败", true)
    }
  }

  async out(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    let cookiesData = yaml.parse(await fs.promises.readFile(cookieFile, "utf8"))
    const userIds = Object.keys(cookiesData)
    let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
    if (!userIds.includes(currentUserId)) {
      currentUserId = userIds[0]
      await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
    }
    const deleteUserId = currentUserId
    delete cookiesData[deleteUserId]
    if (Object.keys(cookiesData).length === 0) {
      await fs.promises.unlink(cookieFile)
      await redis.del(`Y:Bili:userset:${e.user_id}`)
      e.reply("B站账号已全部退出", true)
    } else {
      const newCurrentUserId = Object.keys(cookiesData)[0]
      await redis.set(`Y:Bili:userset:${e.user_id}`, newCurrentUserId)
      const updatedContent = yaml.stringify(cookiesData)
      await fs.promises.writeFile(cookieFile, updatedContent, "utf8")
      const replyMsg =
        `账号 ${deleteUserId} 成功退出登录\n剩余账号:\n` +
        Object.keys(cookiesData)
          .map((id) => `${id} ${id === newCurrentUserId ? "√" : ""}`)
          .join("\n")
      e.reply([replyMsg.trim(), new Button().help()], true)
    }
  }
}
