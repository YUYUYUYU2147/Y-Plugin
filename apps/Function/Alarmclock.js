import { Config } from "#components"
import { Tencent as Ten } from "#model"
import { logger } from "#lib"

export class Alarmclock extends plugin {
  constructor() {
    super({
      name: "Y:闹钟",
      dsc: "闹钟",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#定(个)?闹钟([01]?[0-9]|2[0-3])[.:：·]([0-5][0-9])$",
          fnc: "nz"
        },
        {
          reg: "^#关闭闹钟$",
          fnc: "scnz"
        }
      ]
    })
    if (Config.other.nzSet) {
      this.task = {
        name: " 闹钟",
        fnc: () => this.Alarmclock(),
        cron: Config.other.nzCron,
        log: false
      }
    }
  }

  async nz(e) {
    if (!Config.other.nzSet) return e.reply("此功能已被关闭。")
    if (!e.isGroup) return e.reply("请在群聊中使用此功能。")
    const input = e.msg
    const regex = /^#定(个)?闹钟([01]?[0-9]|2[0-3])[.:：·]([0-5][0-9])$/
    const match = input.match(regex)
    if (match) {
      const hours = match[2]
      const minutes = match[3]
      const inputTime = `${hours}:${minutes}`
      const currentTime = this.getCurrentTime()
      let isTomorrow = false
      if (inputTime < currentTime) {
        isTomorrow = true
      }
      const alarmInfo = {
        group: e.group_id,
        time: inputTime,
        isTomorrow,
        pushCount: 0
      }
      await redis.set(`Y:Alarmclock:${e.user_id}`, JSON.stringify(alarmInfo))
      let replyMsg = `闹钟设置成功 ${inputTime}`
      if (isTomorrow) {
        replyMsg += "（明天提醒）"
      }
      replyMsg += "\r到点会提醒你哦~\r#关闭闹钟 可以关闭闹钟"
      e.reply(replyMsg)
    } else {
      e.reply("未正确识别到时间，请使用 #定个闹钟HH:MM 格式输入。")
    }
  }

  async scnz(e) {
    if (!e.isGroup) return e.reply("请在群聊中使用此功能。")
    let _key = `Y:Alarmclock:${e.user_id}`
    let key = await redis.get(_key)
    if (!key) return e.reply("未设置闹钟")
    const alarmInfo = JSON.parse(key)
    const { time } = alarmInfo
    e.reply(`已删除${time}闹钟`)
    await redis.del(_key)
  }

  async Alarmclock() {
    const currentTime = this.getCurrentTime()
    const keys = await redis.keys("Y:Alarmclock:*")
    for (const key of keys) {
      const value = await redis.get(key)
      if (value) {
        const alarmInfo = JSON.parse(value)
        const { group, time, isTomorrow, pushCount } = alarmInfo
        let shouldAlert = false
        if (isTomorrow) {
          if (currentTime >= "00:00" && currentTime < time) {
            shouldAlert = true
            alarmInfo.isTomorrow = false
          }
        } else {
          if (currentTime >= time) {
            shouldAlert = true
          }
        }
        if (shouldAlert && pushCount < Config.other.nzCount) {
          const userId = key.split(":")[2]
          const push = await Ten.PushBot()
          try {
            push.pickGroup(group).sendMsg([segment.at(userId), Config.other.nzMsg])
          } catch (error) {
            logger.error(" 闹钟提醒失败：可能为群号错误或机器人未加群。")
          }
          alarmInfo.pushCount++
          await redis.set(key, JSON.stringify(alarmInfo))
          await Ten.sleep(5000)
        } else if (pushCount >= Config.other.nzCount) {
          await redis.del(key)
          logger.error(" 闹钟提醒失败：已达到最大提醒次数，已删除闹钟。")
        }
      }
    }
  }

  getCurrentTime() {
    const now = new Date()
    const currentHours = String(now.getHours()).padStart(2, "0")
    const currentMinutes = String(now.getMinutes()).padStart(2, "0")
    return `${currentHours}:${currentMinutes}`
  }
}
