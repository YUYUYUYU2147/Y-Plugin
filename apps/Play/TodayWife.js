import { Config } from "#components"
import { Button } from "#model"
import { logger } from "#lib"

export class TodayWife extends plugin {
  constructor() {
    super({
      name: "Y:群友老婆",
      dsc: "老婆",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#?(重抽)?群友老婆$",
          fnc: "TodayWife"
        }
      ]
    })
    this.task = {
      cron: "50 59 23 * * *",
      name: "清空老婆缓存",
      fnc: () => this.del()
    }
  }

  async TodayWife(e) {
    if (!e.isGroup) return e.reply("不在群里发老婆有什么用！")
    const key = `Y:TodayWife:${e.user_id}:${e.group_id}`
    const wifeStr = await redis.get(key)
    let data
    if (e.msg.includes("重抽") || !wifeStr) {
      data = await this.getTodayWife(e)
      await redis.set(key, JSON.stringify(data))
    } else {
      data = JSON.parse(wifeStr)
    }
    const msg = [
      segment.at(e.user_id),
      `\r你的群友老婆是 ${data.nickname || ""}\r`,
      segment.at(data.user_id),
      "\r",
      segment.image(data.avatarUrl),
      new Button().TodayList()
    ]
    await e.reply(msg)
  }

  async getTodayWife(e) {
    const lists = await e.group.getMemberMap()
    const keys = Array.from(lists.keys())
    const randomIndex = Math.floor(Math.random() * keys.length)
    const randomKey = keys[randomIndex]
    const member = lists.get(randomKey)
    const avatarUrl = await this.url(e.group_id, member.user_id)
    return { ...member, avatarUrl }
  }

  async url(group, userId) {
    const baseUrl = Bot.pickMember(group, String(userId)).getAvatarUrl(100)
    return baseUrl.replace(/\/0$/, "/100")
  }

  async del() {
    const keys = await redis.keys("Y:TodayWife:*")
    await Promise.all(keys.map((key) => redis.del(key)))
  }
}
