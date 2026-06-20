import moment from "moment"
import { Config } from "#components"
import { Tencent as Ten } from "#model"
import { logger } from "#lib"

export class DailySignCard extends plugin {
  constructor() {
    super({
      name: "Y:日签卡",
      desc: "日签卡打卡",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: /^#?日签打卡/,
          fnc: "sign"
        }
      ]
    })
    this.task = [
      {
        cron: "40 1 0,6 * * ?",
        name: "日签打卡",
        fnc: () => this.sign()
      }
    ]
  }

  async sign(e) {
    const isMastere = e && e.isMaster
    if (isMastere && !e.isMaster) return
    if (isMastere)
      await e.reply("开始对所有机器人执行日签打卡请稍等....", true, {
        recallMsg: 5
      })
    let BotUin = await Ten.getQQlist()
    const tsstart = moment()
    let msg = []
    let Count = 0
    for (const qqNum of BotUin) {
      try {
        let skey, pskey
        const cookies = await Ten.getQQck(qqNum, "ti.qq.com")
        if (cookies.code === 0) {
          skey = cookies.skey
          pskey = cookies.pskey
        } else {
          logger.warn(`账号${qqNum}获取cookies失败，已跳过日签卡...\n错误信息：${cookies.msg}`)
          msg.push({
            user_id: "80000000",
            nickname: "匿名消息",
            message: `账号${qqNum}获取cookies失败，已跳过日签卡...\n错误信息：${cookies.msg}`
          })
          Count++
          continue
        }
        const msg1 = (await Ten.DailySignCard(qqNum, skey, pskey)).trim()
        const msg2 = (await Ten.Dailyfriend(qqNum, skey, pskey)).trim()
        logger.info(`日签打卡结果（QQ: ${qqNum}）: \n${msg1}\n${msg2}`)
        msg.push({
          user_id: "80000000",
          nickname: "匿名消息",
          message: `QQ: ${qqNum} 的打卡结果:\n${msg1}\n${msg2}`
        })
        Count++
      } catch (error) {
        logger.error(`处理 QQ ${qqNum} 时出错: ${error.message}`)
        msg.push({
          user_id: "80000000",
          nickname: "匿名消息",
          message: `QQ: ${qqNum} 的打卡失败: ${error.message}\n`
        })
      }
    }
    const tsfinish = moment()
    const duration = tsfinish.diff(tsstart)
    const time = moment.duration(duration).asSeconds()
    msg.push({
      user_id: "80000000",
      nickname: "匿名消息",
      message: `任务耗时：${time} 秒\n总共执行账号：${Count}`
    })
    const Formsg = await Bot.makeForwardMsg(msg)
    if (isMastere) await e.reply(Formsg, false)
  }
}
