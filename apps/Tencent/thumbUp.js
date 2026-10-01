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
      // 好友列表 fl 的键是字符串还是数字，取决于 OneBot 实现（NapCat 给字符串，
      // 部分实现给数字），而 Map 查键类型敏感 —— 类型对不上就查不到，会静默掉进
      // pickUser 分支。另外锅巴里填纯数字 QQ 时，yaml 会给它加引号存成字符串
      // （不加引号会被当成数字解析），同一个号存成什么样全看当时怎么填的。
      // 所以字符串和数字两种形式都准备一份，实际用哪种以 fl 里的键为准。
      const ids = [String(i)]
      if (/^\d+$/.test(String(i))) ids.push(Number(i))
      for (let uin of BotUin) {
        let successCount = 0
        for (let attempt = 0; attempt < 10; attempt++) {
          let result
          const id = ids.find(v => Bot[uin].fl.has(v))
          if (id !== undefined) {
            try {
              result = await Bot[uin].pickFriend(id).thumbUp(10)
            } catch {}
          } else {
            try {
              result = await Bot[uin].pickUser(ids[0]).thumbUp(10)
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
