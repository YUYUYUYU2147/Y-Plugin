import { update as Update } from "../../other/update.js"
import { Plugin_Name } from "#components"
import { Config } from "#components"

export class Yupdate extends plugin {
  constructor() {
    super({
      name: "Y:更新插件",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#[Yy](插件)?(强制)?更新(日志)?$",
          fnc: "update"
        }
      ]
    })
  }

  async update(e = this.e) {
    const isLog = e.msg.includes("日志")
    const Type = isLog ? "#更新日志" : e.msg.includes("强制") ? "#强制更新" : "#更新"
    e.msg = Type + Plugin_Name
    const up = new Update(e)
    up.e = e
    return isLog ? up.updateLog() : up.update()
  }
}
