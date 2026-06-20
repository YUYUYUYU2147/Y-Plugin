import fs from "fs"
import path from "path"
import yaml from "yaml"
import { Config } from "#components"
import { Button } from "#model"
import { REG } from "./index.js"

const SwitchReg = new RegExp(`^#?${REG}(切换账号|账号切换)`)

export class SwitchPlugin extends plugin {
  constructor() {
    super({
      name: "Y:B站设置",
      desc: "设置",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: SwitchReg,
          fnc: "switchAccount"
        },
        {
          reg: /^#?(开启|关闭)投币$/,
          fnc: "switchcoin"
        },
        {
          reg: /^#?(开启|关闭)(直播间)?(自动)?(发)?弹幕$/,
          fnc: "switchLiveDanmu"
        }
      ]
    })
  }

  async switchAccount(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const userIds = Object.keys(cookiesData)
    if (userIds.length === 1) {
      e.reply(`无需切换，当前账号为${userIds[0]}`)
      return
    }
    let action = e.msg.replace(SwitchReg, "").trim()
    if (!userIds.map((_, index) => String(index + 1)).includes(action)) {
      e.reply(`无效的操作，请输入1到${userIds.length}之间的数字来选择要切换的账号`, true)
      return
    }

    const targetUserId = userIds[action - 1]
    await redis.set(`Y:Bili:userset:${e.user_id}`, targetUserId)
    let replyMsg = "已成功切换账号:\n"
    userIds.forEach((id, idx) => {
      replyMsg += `${id} ${idx + 1 === Number(action) ? "√" : ""}\n`
    })

    e.reply([replyMsg.trim(), new Button().help()], true)
  }

  async switchcoin(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const userIds = Object.keys(cookiesData)
    let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
    if (!userIds.includes(currentUserId)) {
      currentUserId = userIds[0]
      await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
    }

    const action = e.msg.includes("开启") ? "开启" : e.msg.includes("关闭") ? "关闭" : ""

    if (!action) {
      e.reply("无效的操作，请输入“开启投币”或“关闭投币”", true)
      return
    }

    cookiesData[currentUserId].coin = action === "开启"
    const updatedCookiesContent = yaml.stringify(cookiesData)
    fs.writeFileSync(cookieFile, updatedCookiesContent)
    let replyMsg = `操作成功！${
      cookiesData[currentUserId].coin ? "呜攒不了硬币惹~" : "又可以攒硬币啦~"
    }\n账号投币状态:\n`
    userIds.forEach((id) => {
      replyMsg += `${id}: ${cookiesData[id].coin ? "开启" : "关闭"}\n`
    })

    if (userIds.length > 1) {
      replyMsg += "您还可以使用指令: #切换B站账号2 完成切换账号操作进行修改账号2的投币状态"
    }
    e.reply([replyMsg.trim(), new Button().help()], true)
  }

  async switchLiveDanmu(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      return await e.reply("未绑定ck，请发送【B站登录】进行绑定", true)
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const userIds = Object.keys(cookiesData)
    let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
    if (!userIds.includes(currentUserId)) {
      currentUserId = userIds[0]
      await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
    }

    const action = e.msg.includes("开启") ? "开启" : e.msg.includes("关闭") ? "关闭" : ""

    if (!action) {
      e.reply("无效的操作，请输入“开启直播间弹幕”或“关闭直播间弹幕”", true)
      return
    }

    cookiesData[currentUserId].live = action === "开启"
    const updatedCookiesContent = yaml.stringify(cookiesData)
    fs.writeFileSync(cookieFile, updatedCookiesContent)
    let replyMsg = "操作成功，当前直播间弹幕状态:\n"
    userIds.forEach((id) => {
      replyMsg += `${id}: ${cookiesData[id].live ? "开启" : "关闭"}\n`
    })

    if (userIds.length > 1) {
      replyMsg += "您还可以使用指令: #切换B站账号2 完成切换账号操作进行修改账号2的弹幕状态"
    }
    e.reply([replyMsg.trim(), new Button().help()], true)
  }
}
