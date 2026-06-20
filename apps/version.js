import { Version, common } from "#components"
import { Config } from "#components"

export class Version_Info extends plugin {
  constructor() {
    super({
      name: "Y:版本信息",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#?Y(插件)?版本$",
          fnc: "plugin_version"
        }
      ]
    })
  }

  async plugin_version(e) {
    const ver = await common.render(
      "help/version-info",
      {
        currentVersion: Version.ver,
        changelogs: Version.logs
      },
      { e, scale: 1.4 }
    )
    e.reply(ver)
  }
}
