import { Config } from "#components"
import { Tencent as Ten } from "#model"
import { logger } from "#lib"

export class LuckyWord extends plugin {
  constructor() {
    super({
      name: "Y:幸运字符",
      desc: "幸运字符",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: /^#?抽幸运字符/,
          fnc: "luckyword"
        }
      ]
    })
    this.task = [
      {
        cron: "40 1 0,6 * * ?",
        name: "幸运字符",
        fnc: () => this.luckyword()
      }
    ]
  }

  async luckyword(e) {
    const isMastere = e && e.isMaster
    if (isMastere && !e.isMaster) return
    if (isMastere) {
      await e.reply("开始对所有机器人执行抽取幸运字符请稍等....", true, {
        recallMsg: 10
      })
    }
    const botQQNumbers = await Ten.getQQlist()
    const allowedGroups = Config.other.LuckywordGroup || []
    if (allowedGroups.length === 0) {
      logger.warn("未配置幸运字符抽取的群组列表")
    }
    for (const qqNumber of botQQNumbers) {
      try {
        if (isMastere) {
          await e.reply(`正在处理账号 ${qqNumber}...`, true, { recallMsg: 10 })
        }
        const cookies = await Promise.race([
          Ten.getQQck(qqNumber, "qun.qq.com"),
          Ten.sleep(15000).then(() => ({ code: -1, msg: "获取cookies超时(15s)" }))
        ])
        if (cookies.code === 0) {
          const { skey, pskey } = cookies
          for (const [groupId] of Bot[qqNumber].gl) {
            if (allowedGroups.includes(groupId)) {
              for (let i = 0; i < 3; i++) {
                const result = await Ten.Luckyword(qqNumber, skey, pskey, groupId)
                if (result.code === 0) break
              }
              await Ten.sleep(3000)
            }
          }
          if (isMastere) {
            await e.reply(`账号 ${qqNumber} 处理完成`, true, { recallMsg: 10 })
          }
        } else {
          logger.warn(`账号${qqNumber}获取cookies失败: ${cookies.msg}`)
          if (isMastere) {
            await e.reply(`账号 ${qqNumber} 跳过: ${cookies.msg}`, true, { recallMsg: 10 })
          }
        }
      } catch (error) {
        logger.error(`处理 QQ ${qqNumber} 时出错: ${error.message}`, {
          qqNumber,
          error
        })
        if (isMastere) {
          await e.reply(`账号 ${qqNumber} 出错: ${error.message}`, true, { recallMsg: 10 })
        }
      }
    }
    if (isMastere) await e.reply("机器人执行抽取幸运字符完成", true, { recallMsg: 10 })
  }
}
