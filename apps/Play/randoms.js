import { Config, common, Res_Path } from "#components"
import { Button } from "#model"
import { logger } from "#lib"
const { text, image, video, open, Force, CompImage } = Config.randoms

const regStrings = [
  ...text.map((item) => item.name.join("|")),
  ...image.map((item) => item.name.join("|")),
  ...video.map((item) => item.name.join("|"))
].join("|")
const REGS = Force ? new RegExp(`^#(随机)?(${regStrings})$`) : new RegExp(`^#?(随机)?(${regStrings})$`)

export class randoms extends plugin {
  constructor() {
    super({
      name: "Y:随机回复",
      dsc: "随机回复",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: REGS,
          fnc: "random"
        },
        {
          reg: /^#?随机列表$/,
          fnc: "showRandomList"
        },
        {
          reg: /^#?(随机)?(文本|图片|视频)列表$/,
          fnc: "Lists"
        }
      ]
    })
  }

  async random(e) {
    if (!open) return false
    try {
      const allItems = [...text, ...image, ...video]
      const matchedItem = allItems.find((item) => item.name.some((name) => e.msg.includes(name)))
      if (matchedItem) {
        let itemType
        if (text.includes(matchedItem)) {
          itemType = "text"
        } else if (image.includes(matchedItem)) {
          itemType = "image"
        } else if (video.includes(matchedItem)) {
          itemType = "video"
        }

        switch (itemType) {
          case "text":
            e.reply([await (await fetch(matchedItem.url)).text(), new Button().randoms(itemType)])
            break
          case "image":
            const image = await common.CompImage(matchedItem.url, CompImage)
            e.reply([segment.image(image), new Button().randoms(itemType)])
            break
          case "video":
            const response = await fetch(matchedItem.url)
            const contentType = response.headers.get("Content-Type")
            let video = matchedItem.url
            if (contentType?.includes("text/")) video = (await response.text()) || matchedItem.url
            const forwardNodes = [
              {
                user_id: e.bot.uin,
                nickname: e.bot.nickname,
                message: `色胚来点${e.msg}`
              },
              {
                user_id: e.user_id,
                nickname: e.sender.nickname,
                message: [{ type: "video", file: video }]
              }
            ]
            const forwardMessage = await Bot.makeForwardMsg(forwardNodes)
            await e.reply([forwardMessage, new Button().randoms(itemType)])
            break
          default:
            logger.error("未识别的回复类型")
            break
        }
      }
    } catch (error) {
      logger.error("请求出错:", error)
    }
  }

  async showRandomList(e) {
    let textList = []
    text.forEach((item) => {
      textList.push(item.name.join(" | "))
    })

    let imgList = []
    image.forEach((item) => {
      imgList.push(item.name.join(" | "))
    })

    let videoList = []
    video.forEach((item) => {
      videoList.push(item.name.join(" | "))
    })

    const params = {
      textList,
      imgList,
      videoList,
      bgcover: `${Res_Path}/help/theme/default/main.jpg`
    }
    const imgs = await common.render("randoms/index", params, { e, scale: 1 })
    e.reply(imgs)
  }

  async Lists(e) {
    const match = e.msg.match(/^#?(随机)?(文本|图片|视频)列表$/)
    const type = match?.[2]
    const typeMap = {
      文本: "text",
      图片: "image",
      视频: "video"
    }
    await e.reply(["点击下方按钮开始吧", new Button().randoms(typeMap[type])])
  }
}
