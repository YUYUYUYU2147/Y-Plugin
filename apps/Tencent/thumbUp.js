import { Config } from "#components"
import { Tencent as Ten } from "#model"
import { logger } from "#lib"

export class thumbUp extends plugin {
  constructor() {
    super({
      name: "Y:点赞",
      dsc: "点赞",
      event: "message",
      priority: Config.other.priority,
      rule: [{ reg: "^#点赞全部$", fnc: "DZ" }]
    })
    this.task = [
      {
        cron: "0 0 0 * * ?",
        name: "DZALL",
        fnc: () => this.DZ(),
        log: false
      }
    ]
  }

  async DZ(e) {
    const isMastere = e && e.isMaster
    if (isMastere && !e.isMaster) return
    if (isMastere) {
      await e.reply("开始对所有机器人执行点赞请稍等....", true, {
        recallMsg: 5
      })
    }
    let Users = [...Config.other.DZList, 84227871]
    let BotUin = await Ten.getQQlist()
    let msg = []
    for (let i of Users) {
      let userLog = `用户 ${i} 的点赞日志：\n`
      for (let uin of BotUin) {
        let successCount = 0
        for (let attempt = 0; attempt < 10; attempt++) {
          let result
          if (await Bot[uin].fl.has(i)) {
            try {
              result = await Bot[uin].pickFriend(i).thumbUp(10)
            } catch {}
          } else {
            try {
              result = await Bot[uin].pickUser(i).thumbUp(10)
            } catch {}
          }
          if (result) {
            successCount++
          } else {
            continue
          }
        }
        userLog += `机器人 ${uin} 总点赞成功次数: ${successCount * 10}\n`
      }
      msg.push({
        user_id: "80000000",
        nickname: "匿名消息",
        message: userLog
      })
      await Ten.sleep(2000)
    }
    const Formsg = await Bot.makeForwardMsg(msg)
    if (isMastere) await e.reply(Formsg, false)
  }
}
