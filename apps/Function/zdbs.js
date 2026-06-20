import { Config } from "#components"
import { Tencent as Ten } from "#model"
import moment from "moment"
import Lunar from "lunar-javascript"
import { logger } from "#lib"

const { zdbsGroup, zdbsMsg, zdbsType, zdbsUrl } = Config.other

export class zdbs extends plugin {
  constructor() {
    super({
      name: "Y:整点报时",
      dsc: "整点报时",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#(整点)?报时$",
          fnc: "bs"
        },
        {
          reg: "^#(开启|关闭)(整点)?报时$",
          fnc: "bsset"
        }
      ]
    })
    this.task = {
      name: " 整点报时",
      fnc: () => this.zdbs(),
      cron: "0 * * * *"
    }
  }

  async zdbs() {
    for (const group of zdbsGroup) {
      await Ten.sleep(5000)
      const push = await Ten.PushBot()
      switch (zdbsType) {
        case 1:
          push.pickGroup(group).sendMsg(await TimeMsg())
          break
        case 2:
          push.pickGroup(group).sendMsg(await TimeMsg())
          push.pickGroup(group).sendMsg(segment.record(zdbsUrl))
          break
        default:
          push.pickGroup(group).sendMsg(segment.record(zdbsUrl))
      }
    }
  }

  async bs(e) {
    switch (zdbsType) {
      case 1:
        e.reply(await TimeMsg())
        break
      case 2:
        e.reply(await TimeMsg())
        e.reply(segment.record(zdbsUrl))
        break
      default:
        e.reply(segment.record(zdbsUrl))
    }
  }

  async bsset(e) {
    if (!(e.isMaster || e.member.is_admin || e.member.is_owner)) return
    const type = /开启/.test(e.msg) ? "add" : "del"
    const isopen = zdbsGroup.includes(e.group_id)
    if (isopen && type === "add") return e.reply("❎ 本群报时已开启")
    if (!isopen && type === "del") return e.reply("❎ 本群报时已关闭")
    Config.modifyarr("other", "zdbsGroup", e.group_id, type)
    e.reply(`✅ 已${type === "add" ? "开启" : "关闭"}「${e.group_id}」报时`)
  }
}

/**
 * 文字版整点报时
 */
async function TimeMsg() {
  const now = moment()
  const lunarDate = Lunar.Lunar.fromDate(now.toDate())

  const formattedDate = now.format("YYYY年MM月DD日")
  const formattedTime = now.format("HH:mm")
  const weekDay = now.format("dddd")

  const ganzhiYear = lunarDate.getYearInGanZhi()
  const zodiac = lunarDate.getYearShengXiao()
  const lunarMonth = lunarDate.getMonthInChinese()
  const lunarDay = lunarDate.getDayInChinese()

  const JieQi = lunarDate.getJieQi()
  const JieQiData = JieQi ? `${JieQi}` : ""
  const JieRi = lunarDate.getFestivals()
  const JieRiData = JieRi.length > 0 ? `${JieRi.join("、")}` : ""

  const time = `🕑${formattedDate} ${formattedTime} ${weekDay}\r🗓️${ganzhiYear}年【${zodiac}年】${lunarMonth}月${lunarDay}`
  const extraInfo = `${JieQiData} ${JieRiData}`.trim()

  const Message = extraInfo ? `${time}\r✨${extraInfo}` : time
  let yy
  try {
    yy = await (await fetch(zdbsMsg)).text()
  } catch (error) {
    logger.error("获取不到辣")
    yy = "🌸 是Darling把我带到这里的哦~ 我第一次看到能游泳的大海 🌸"
  }

  return `${Message}\r${yy}`
}
