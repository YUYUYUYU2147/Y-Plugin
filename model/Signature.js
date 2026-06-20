import { Config } from "#components"
import moment from "moment"
import { logger } from "#lib"

export class Ature extends plugin {
  constructor() {
    super({
      name: "Y:更新个性签名",
      dsc: "更新个性签名",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#更新个性签名$",
          fnc: "Ature"
        }
      ]
    })
    if (Config.Signature.Auto) {
      this.task = {
        cron: Config.Signature.Cron,
        name: "更新个性签名",
        fnc: () => this.Ature()
      }
    }
  }

  async Ature(e) {
    const isMastere = e && e.isMaster
    if (isMastere && !e.isMaster) return
    if (isMastere) {
      await e.reply("开始对机器人执行更新个性签名请稍等....", true, {
        recallMsg: 5
      })
    }
    const tsstart = moment()
    let data
    try {
      data = await (await fetch(Config.Signature.Url)).text()
    } catch (error) {
      logger.error("获取不到辣")
      data = "🌸 是Darling把我带到这里的哦~ 我第一次看到能游泳的大海 🌸"
    }
    let Count = 0
    let Msg = ""
    for (const BotUIN of Config.Signature.Bot) {
      if (typeof Bot[BotUIN].setSignature === "function") {
        Bot[BotUIN].setSignature(data)
      } else {
        Bot[BotUIN].sendApi("set_self_longnick", { longNick: data })
      }
      Count++
      Msg += `账号 ${BotUIN} 已更新签名为: ${data}\n`
    }
    const tsfinish = moment()
    const duration = tsfinish.diff(tsstart)
    const time = moment.duration(duration).asSeconds()
    let msg = []
    msg.push({
      user_id: "80000000",
      nickname: "匿名消息",
      message: `任务耗时：${time} 秒\n总共执行账号：${Count}\n${Msg}`
    })

    const Formsg = await Bot.makeForwardMsg(msg)
    if (isMastere) await e.reply(Formsg, false)
  }
}
