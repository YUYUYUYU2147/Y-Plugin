import { Config } from "#components"
import { logger } from "#lib"

export class tq extends plugin {
  constructor() {
    super({
      name: "Y:天气查询",
      dsc: "Api访问查询",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^(.*)天气$",
          fnc: "tq"
        }
      ]
    })
  }

  async tq(e) {
    if (!Config.other.WeatherSet) return false
    let query = e.msg.replace(/天气$/, "").trim()
    if (!query) return
    try {
      const res = await fetch(
        `https://restapi.amap.com/v3/weather/weatherInfo?key=${Config.other.weather}&city=${query}&extensions=all`
      )
      const response = await res.json()
      const forecasts = Array.isArray(response.forecasts) ? response.forecasts : []
      const list1 = forecasts.flatMap((forecast) => forecast.casts)
      if (this.e.bot?.version?.app_name === "NapCat.Onebot") {
        const requestBody = {
          group_id: e.group_id,
          user_id: e.user_id,
          message: [
            {
              type: "node",
              data: {
                nickname: e.sender.nickname,
                user_id: e.user_id,
                content: list1.map((list) => ({
                  type: "node",
                  data: {
                    nickname: e.sender.nickname,
                    user_id: e.user_id,
                    content: [
                      {
                        type: "markdown",
                        data: {
                          content: `
# 时间${list.date} 星期: ${list.week}
---

> 白天天气: ${list.dayweather}
> 晚上天气: ${list.nightweather}
> 白天温度: ${list.daytemp}℃
> 晚上温度: ${list.nighttemp}℃
> 白天风向: ${list.daywind}风
> 晚上风向: ${list.nightwind}风
> 白天风力: ${list.daypower}级
> 晚上风力: ${list.nightpower}级
`
                        }
                      }
                    ]
                  }
                })),
                news: [{ text: `${response.forecasts[0].city}天气预报` }],
                prompt: "YYDS!!",
                summary: "QQ + 84227871",
                source: "查询成功!"
              }
            }
          ],
          news: [{ text: `${response.forecasts[0].province}天气` }],
          prompt: "YYDS!!",
          summary: "QQ + 84227871",
          source: "天气查询"
        }
        await e.bot.sendApi("send_group_forward_msg", requestBody)
      } else {
        const forwardNodes = list1.map((list) => ({
          user_id: e.user_id,
          nickname: e.sender.nickname,
          message: [
            `\r时间${list.date} 星期: ${list.week}`,
            `\r白天天气: ${list.dayweather}`,
            `\r晚上天气: ${list.nightweather}`,
            `\r白天温度: ${list.daytemp}℃`,
            `\r晚上温度: ${list.nighttemp}℃`,
            `\r白天风向: ${list.daywind}风`,
            `\r晚上风向: ${list.nightwind}风`,
            `\r白天风力: ${list.daypower}级`,
            `\r晚上风力: ${list.nightpower}级`
          ]
        }))
        const forwardMessage = await Bot.makeForwardMsg(forwardNodes)
        await e.reply(forwardMessage)
      }
    } catch {
      logger.warn(`不可用天气 ${query}`)
    }
  }
}
