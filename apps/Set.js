import { Config } from "#components"

export class SetSet extends plugin {
  constructor() {
    super({
      name: "Y:设置",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#?(开启|关闭)联系主人$",
          fnc: "contact"
        },
        {
          reg: "^#?(开启|关闭)问候回复$",
          fnc: "whhf"
        },
        {
          reg: "^#?(开启|关闭)天气功能$",
          fnc: "weather"
        },
        {
          reg: "^#?(开启|关闭)闹钟功能$",
          fnc: "Alarmclock"
        },
        {
          reg: "^#?(开启|关闭)涩涩功能$",
          fnc: "sese"
        },
        {
          reg: "^#?(开启|关闭)([Jj][Mm]|禁漫)加密$",
          fnc: "JM"
        },
        {
          reg: "^#(添加|取消)涩涩白名单",
          fnc: "SeseList"
        }
      ]
    })
  }

  async contact(e) {
    if (!e.isMaster) return
    const type = /开启/.test(e.msg)
    if ((type && Config.sendMaster.open) || (!type && !Config.sendMaster.open))
      return e.reply(`❎ 联系主人已处于${type ? "开启" : "关闭"}状态`)
    Config.modify("sendMaster", "open", type)
    e.reply(`✅ 已${type ? "开启" : "关闭"}联系主人`)
  }

  async whhf(e) {
    if (!e.isMaster) return
    const type = /开启/.test(e.msg)
    if ((type && Config.other.WhhfSet) || (!type && !Config.other.WhhfSet))
      return e.reply(`❎ 问候回复已处于${type ? "开启" : "关闭"}状态`)
    Config.modify("other", "WhhfSet", type)
    e.reply(`✅ 已${type ? "开启" : "关闭"}问候回复`)
  }

  async weather(e) {
    if (!e.isMaster) return
    const type = /开启/.test(e.msg)
    if ((type && Config.other.WeatherSet) || (!type && !Config.other.WeatherSet))
      return e.reply(`❎ 天气功能已处于${type ? "开启" : "关闭"}状态`)
    Config.modify("other", "WeatherSet", type)
    e.reply(`✅ 已${type ? "开启" : "关闭"}天气功能`)
  }

  async Alarmclock(e) {
    if (!e.isMaster) return
    const type = /开启/.test(e.msg)
    if ((type && Config.other.nzSet) || (!type && !Config.other.nzSet))
      return e.reply(`❎ 闹钟功能已处于${type ? "开启" : "关闭"}状态`)
    Config.modify("other", "nzSet", type)
    e.reply(`✅ 已${type ? "开启" : "关闭"}闹钟功能`)
  }
  async sese(e) {
    if (!e.isMaster) return
    const type = /开启/.test(e.msg)
    if ((type && Config.other.SeseSet) || (!type && !Config.other.SeseSet))
      return e.reply(`❎ 涩涩功能已处于${type ? "开启" : "关闭"}状态`)
    Config.modify("other", "SeseSet", type)
    e.reply(`✅ 已${type ? "开启" : "关闭"}涩涩功能`)
  }

  async JM(e) {
    if (!e.isMaster) return
    const type = /开启/.test(e.msg)
    if ((type && Config.other.JMJM) || (!type && !Config.other.JMJM))
      return e.reply(`❎ 禁漫加密已处于${type ? "开启" : "关闭"}状态`)
    Config.modify("other", "JMJM", type)
    e.reply(`✅ 已${type ? "开启" : "关闭"}禁漫加密`)
  }

  async SeseList(e) {
    if (!e.isMaster) return
    const match = e.msg.match(/#(添加|取消)涩涩白名单(\d+)/)
    if (!match) return e.reply("请输入正确的号码哦！")
    const type = match[1] === "添加" ? "add" : "del"
    const id = match[2]
    const isopen = Config.other.SeseList.includes(id)
    if (isopen && type === "add") return e.reply(`❎ 用户 ${id} 已在验车白名单`)
    if (!isopen && type === "del") return e.reply(`❎ 用户 ${id} 不在验车白名单`)
    Config.modifyarr("other", "SeseList", id, type)
    e.reply(`✅ 已${type === "add" ? "添加" : "取消"}「${id}」验车白名单`)
  }
}
