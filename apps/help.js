import lodash from "lodash"
import { Config, common, Data } from "#components"
import { Button } from "#model"
import Theme from "../model/help/theme.js"
import { REG } from "./Bili/index.js"

const help = "(帮助|菜单|功能)"
const helpReg = new RegExp(`^#?[Yy](插件)?${help}$`)
const BilihelpReg = new RegExp(`^#?${REG}${help}$`)
const SesehelpReg = new RegExp(`^#?[Yy](插件)?涩涩${help}$`)
export class Help extends plugin {
  constructor() {
    super({
      name: "Y:帮助",
      dsc: "Y",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: helpReg,
          fnc: "help"
        },
        {
          reg: BilihelpReg,
          fnc: "BiliHelp"
        },
        {
          reg: SesehelpReg,
          fnc: "SeseHelp"
        }
      ]
    })
  }

  async _renderHelp(e, cfgType) {
    let { diyCfg, sysCfg } = await Data.importCfg(cfgType)
    let helpConfig = lodash.merge({}, sysCfg.helpCfg, diyCfg.helpCfg)
    let helpList = lodash.get(diyCfg, "helpList") || lodash.get(sysCfg, "helpList") || []
    let helpGroup = []
    lodash.forEach(helpList, (group) => {
      if (group.auth && group.auth === "master" && !e.isMaster) {
        return true
      }
      lodash.forEach(group.list, (help) => {
        help.css = this._getIconStyle(help.icon)
      })
      helpGroup.push(group)
    })
    let themeData = await Theme.getThemeData(diyCfg.helpCfg || {}, sysCfg.helpCfg || {})
    const img = await common.render(
      "help/index",
      {
        helpCfg: helpConfig,
        helpGroup,
        ...themeData
      },
      { e, scale: 1.6 }
    )
    e.reply([img, new Button().help()])
  }

  _getIconStyle(icon) {
    if (!icon) {
      return "display:none"
    }
    let x = (icon - 1) % 10
    let y = (icon - x - 1) / 10
    return `background-position:-${x * 50}px -${y * 50}px`
  }

  async help(e) {
    return this._renderHelp(e, "help")
  }

  async BiliHelp(e) {
    return this._renderHelp(e, "BiliHelp")
  }

  async SeseHelp(e) {
    return this._renderHelp(e, "SeseHelp")
  }
}
