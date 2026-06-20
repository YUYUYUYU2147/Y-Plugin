import { Config, common, Res_Path } from "#components"
import { Button } from "#model"
import fs from "fs"
import { logger } from "#lib"

export class TodayFate extends plugin {
  constructor() {
    super({
      name: "Y:今日运势",
      dsc: "运势",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#?(重抽)?今日运势$",
          fnc: "TodayFate"
        }
      ]
    })
    this.task = {
      cron: "50 59 23 * * *",
      name: "清空运势缓存",
      fnc: () => this.del()
    }
  }

  async TodayFate(e) {
    const key = `Y:TodayFate:${e.user_id}`
    const Fate = await redis.get(key)
    let data
    if (e.msg.includes("重抽")) {
      // 只有主人或白名单用户可以重抽
      const whiteList = Config.other.whiteList || []
      if (!e.isMaster && !whiteList.includes(e.user_id)) {
        e.reply("你没有权限重抽今日运势哦~")
        return
      }
    }
    if (e.msg.includes("重抽") || !Fate) {
      data = await this.getTodayFate(e)
      await redis.set(key, JSON.stringify(data))
    } else {
      data = JSON.parse(Fate)
    }
    const { Fortune, Star, Sign, Text } = data

    switch (Config.other.JrysType) {
      case 0:
        const img = Config.other.Jrysimg ? segment.image(Config.other.Jrysimg) : ""
        const markdown = Config.other.Jrysmd ? ">" : ""
        const msg = [
          img,
          markdown,
          `🌸运势: ${Fortune}\n`,
          `🔯星级: ${Star}\n`,
          `🔖点评: ${Sign}\n`,
          `📖解读: ${Text}\n`,
          "🎮仅供娱乐|相信科学|请勿迷信",
          new Button().TodayList()
        ]
        e.reply(msg)
        break
      case 1:
        const params = {
          Fortune,
          Start: Star,
          Sign,
          Text
        }
        if (Config.other.Jrysimg) {
          params.bgcover = Config.other.Jrysimg
        } else {
          params.bgcover = `${Res_Path}/help/theme/default/main.jpg`
        }
        const imgs = await common.render("TodayFate/index", params, {
          e,
          scale: 1
        })
        e.reply([imgs, new Button().TodayList()])
        break
      default:
        logger.error("泥没有填写对哦")
    }
  }

  async getTodayFate(e) {
    const data = fs.readFileSync(`${Res_Path}/TodayFate/TodayFate.json`)
    const json = JSON.parse(data)
    let randomIndex
    if (Config.other.JrysJ && e.isMaster) {
      const luckyFates = json.filter((item) => item.Fortune.includes("大吉"))
      randomIndex = Math.floor(Math.random() * luckyFates.length)
      const luckyItem = luckyFates[randomIndex]
      randomIndex = json.indexOf(luckyItem)
    } else {
      randomIndex = Math.floor(Math.random() * json.length)
    }
    return json[randomIndex]
  }

  async del() {
    const keys = await redis.keys("Y:TodayFate:*")
    await Promise.all(keys.map((key) => redis.del(key)))
  }
}
