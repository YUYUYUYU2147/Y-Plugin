import { Config } from "#components"
import { logger } from "#lib"

const { text, image, video } = Config.randoms

export default class Button {
  whhf() {
    return segment.button(
      [
        { text: "早安", callback: "早安" },
        { text: "午安", callback: "午安" }
      ],
      [
        { text: "晚上好", callback: "晚上好" },
        { text: "晚安", callback: "晚安" }
      ]
    )
  }

  help() {
    return segment.button(
      [
        { text: "登录", callback: "#B站登录" },
        { text: "刷新", callback: "#B站刷新ck" },
        { text: "退出", callback: "#B站退出" },
        { text: "信息", callback: "#我的哔站" }
      ],
      [
        { text: "签到", callback: "#B站签到" },
        { text: "记录", callback: "#B站签到记录" },
        { text: "切换", input: "#B站切换账号" }
      ],
      [
        { text: "开启投币", callback: "#开启投币" },
        { text: "关闭投币", callback: "#关闭投币" }
      ],
      [
        { text: "开启弹幕", callback: "#开启弹幕" },
        { text: "关闭弹幕", callback: "#关闭弹幕" }
      ]
    )
  }

  Operate() {
    return segment.button(
      [
        { text: "登录", callback: "#B站登录" },
        { text: "点赞", input: "#B站点赞视频" },
        { text: "收藏", input: "#B站收藏视频" }
      ],
      [
        { text: "不喜欢", input: "#B站不喜欢视频" },
        { text: "取消点赞", input: "#B站取消点赞视频" },
        { text: "取消收藏", input: "#B站取消收藏视频" }
      ],
      [
        { text: "点踩", input: "#B站点踩视频" },
        { text: "三连", input: "#B站一键三连视频" },
        { text: "评论", input: "#B站评论视频" }
      ],
      [
        { text: "关注", input: "#B站关注up" },
        { text: "拉黑", input: "#B站拉黑up" }
      ],
      [
        { text: "踢出", input: "#B站踢出粉丝up" },
        { text: "取消关注", input: "#B站取消关注up" },
        { text: "取消拉黑", input: "#B站取消拉黑up" }
      ]
    )
  }

  TodayList() {
    return segment.button(
      [
        { text: "重抽运势", callback: "#重抽今日运势" },
        { text: "今日运势", callback: "#今日运势" }
      ],
      [
        { text: "重抽老婆", callback: "#重抽群友老婆" },
        { text: "群友老婆", callback: "#群友老婆" }
      ]
    )
  }

  randoms(type) {
    let selectedItems = []
    switch (type) {
      case "text":
        selectedItems = text
        break
      case "image":
        selectedItems = image
        break
      case "video":
        selectedItems = video
        break
      default:
        logger.error("无效的类型参数")
        return
    }
    const buttons = selectedItems.map((item) => {
      const name = item.name[0]
      return {
        text: name,
        callback: `#随机${name}`
      }
    })
    const array = []
    for (let i = 0; i < buttons.length; i += 5) {
      array.push(buttons.slice(i, i + 5))
    }
    return segment.button(...array)
  }
}
