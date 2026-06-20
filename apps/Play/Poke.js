import { Config, Poke_List } from "#components"
import { logger } from "#lib"

export class ChuoYiChuo extends plugin {
  constructor() {
    super({
      name: "Y:戳一戳随机",
      dsc: "戳一戳机器人返回信息",
      event: "notice.*.poke",
      priority: Config.other.priority
    })
  }

  async accept(e) {
    const { poke, list, text, img, voice, cd } = Config.poke
    if (!poke) return false
    if (e.target_id !== e.self_id) return true

    let key = `Y:poke:${e.group_id}`
    if (await redis.get(key)) return
    if (cd) redis.set(key, "1", { EX: cd })

    let replyTypes
    if (Array.isArray(list) && list.length === 0) {
      replyTypes = Poke_List
    } else {
      replyTypes = list
    }

    const randomReplyType = replyTypes[Math.floor(Math.random() * replyTypes.length)]
    logger.mark("[戳一戳生效]", randomReplyType)

    switch (randomReplyType) {
      case "文本": {
        try {
          const data = await (await fetch(text)).text()
          await e.reply(data)
        } catch (error) {
          await e.reply("不准戳了！都让你戳坏了")
        }
        break
      }
      case "图片": {
        try {
          await e.reply(segment.image(img))
        } catch (error) {
          await e.reply("不准戳了！都让你戳坏了")
        }
        break
      }
      case "语音": {
        try {
          await e.reply(segment.record(voice))
        } catch (error) {
          await e.reply("不准戳了！都让你戳坏了")
        }
        break
      }
      case "文本图片": {
        try {
          const data = await (await fetch(text)).text()
          await e.reply([data, segment.image(img)])
        } catch (error) {
          await e.reply("不准戳了！都让你戳坏了")
        }
        break
      }
      case "回复": {
        try {
          const picktype = Math.ceil(Math.random() * 2)
          if (picktype === 1) {
            let reply = ["不要戳我啦！你再戳逝逝！", await segment.at(e.operator_id)]
            await e.reply(reply)
          } else if (picktype === 2) {
            e.reply("不！！")
            await Bot.sleep(500)
            e.reply("准！！")
            await Bot.sleep(750)
            e.reply("戳！！")
            await Bot.sleep(1000)
            e.reply("涩批！")
          }
        } catch (error) {
          await e.reply("戳洗你！！！")
        }
        break
      }
      case "表情包": {
        try {
          const randomType = Math.floor(Math.random() * 166) + 1
          await e.reply(
            await segment.image(
              `https://api.lolimi.cn/API/preview/api.php?qq=${e.operator_id}&msg=${e.sender.nickname}&msg2=大牛&type=${randomType}`
            )
          )
        } catch (error) {
          await e.reply("戳洗你！！！")
        }
        break
      }
      case "反击": {
        try {
          e.reply("吃我亿拳！")
          await Bot.sleep(1000)
          await e.group.pokeMember(e.operator_id)
        } catch (error) {
          await e.bot.sendApi("group_poke", {
            user_id: e.operator_id,
            group_id: e.group_id
          })
        }
        break
      }
      case "禁言": {
        try {
          await e.reply("杂鱼~不准戳我, 我要口球泥！")
          if (e.isMaster) return e.reply("诶, 原来是主人戳我 (｡･ω･｡)ﾉ♡")
          await e.group.muteMember(e.user_id, 60)
        } catch (error) {
          await e.reply("口球失败了, 群主快给我管理员！")
        }
        break
      }
      default:
        break
    }
  }
}
