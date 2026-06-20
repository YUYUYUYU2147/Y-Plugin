import { Config } from "#components"
import { logger } from "#lib"

export class Groups extends plugin {
  constructor() {
    super({
      name: "Y:名片/头衔",
      dsc: "修改名片/头衔",
      priority: Config.other.priority,
      event: "message",
      rule: [
        {
          reg: /^#?一键修改群名片$/,
          fnc: "card"
        },
        {
          reg: /^#?一键修改群头衔$/,
          fnc: "setTitle"
        }
      ]
    })
  }

  async edit(action) {
    const Lists = await this.e.group.getMemberMap()
    const tasks = []
    for (const id of Lists.keys()) {
      const text = await (await fetch(Config.other.EditGroup)).text()
      if (text) {
        tasks.push(action(id, text))
        logger.mark(id, "|", text)
      }
      await Bot.sleep(5000)
    }
    await this.reply("修改完成！")
    return Promise.all(tasks)
  }

  async card(e) {
    if (e.isMaster && e.group.is_admin) {
      await e.reply("正在修改群名片，请稍等...")
      this.edit((id, text) => this.e.group.setCard(id, text))
    } else {
      await e.reply("TAT,没有权限哦~")
      return false
    }
  }

  async setTitle(e) {
    if (e.isMaster && e.group.is_owner) {
      await e.reply("正在修改群头衔，请稍等...")
      this.edit((id, text) => this.e.group.setTitle(id, text))
    } else {
      await e.reply("TAT,没有权限哦~")
      return false
    }
  }
}
