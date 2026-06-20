import fs from "fs"
import path from "path"
import yaml from "yaml"
import { BiliAPI as Bili, Button } from "#model"
import { Config } from "#components"
import { REG } from "./index.js"
import { logger } from "#lib"

const Reg = `^#?(${REG})?`
const video = "(点赞|评论|收藏|取消收藏|点踩|取消点赞|不喜欢|一键三连)视频"
const UP = "(关注|取关|拉黑|取消拉黑|踢出粉丝|取消关注)(up|主播|煮波|博主)(主)?"
const OperateReg = new RegExp(`${Reg}(${video}|${UP})`)

export class BiliOperate extends plugin {
  constructor() {
    super({
      name: "Y:B站操作",
      dsc: "操作",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: OperateReg,
          fnc: "handleOperation"
        }
      ]
    })
  }

  /**
   * 处理操作的主方法
   * @param {object} e - 事件对象
   */
  async handleOperation(e) {
    try {
      // 获取用户 cookie
      const userCookies = await this.getUserCookies(e)
      if (!userCookies) {
        return
      }

      // 获取视频信息
      const source = await Bili.getSourceMessage(e)
      const remainingTextCache = e.msg.replace(OperateReg, "").trim()
      let videoUrl
      if (!source) {
        videoUrl = remainingTextCache
      } else {
        videoUrl = await Bili.getvideourl(source)
      }
      const videoinfo = await Bili.getvideoid(videoUrl)

      // 匹配操作类型
      const operation = this.getOperation(e.msg)
      if (!operation) {
        await this.replyMessage(e, "未识别到有效操作，请检查输入~")
        return
      }

      // 处理视频操作
      if (/点赞|取消点赞|点踩|不喜欢|收藏|取消收藏|一键三连|评论/.test(operation)) {
        await this.handleVideoOperation(e, userCookies, videoinfo.data.aid, operation)
      } else {
        let remainingText = source || remainingTextCache
        const isPureNumber = /^\d+$/.test(remainingText)
        let mid
        if (isPureNumber) {
          mid = remainingText
        } else {
          mid = videoinfo.data.mid
        }
        // 处理用户关系操作
        await this.handleUserRelationOperation(e, userCookies, mid, operation)
      }
    } catch (err) {
      // 详细记录错误信息
      logger.error("操作失败，详细错误信息：", err.message, err.stack)
      this.handleError(err, e)
    }
  }

  /**
   * 获取用户的 cookie
   * @param {object} e - 事件对象
   * @returns {object | null} 用户的 cookie 信息，如果不存在则返回 null
   */
  async getUserCookies(e) {
    const cookieFile = path.join(`./data/bili/${e.user_id}.yaml`)
    if (!fs.existsSync(cookieFile)) {
      await this.replyMessage(e, "未绑定ck，请发送【B站登录】进行绑定")
      return null
    }
    const cookiesData = yaml.parse(fs.readFileSync(cookieFile, "utf8"))
    const userIds = Object.keys(cookiesData)
    let currentUserId = await redis.get(`Y:Bili:userset:${e.user_id}`)
    if (!userIds.includes(currentUserId)) {
      currentUserId = userIds[0]
      await redis.set(`Y:Bili:userset:${e.user_id}`, currentUserId)
    }
    return cookiesData[currentUserId]
  }

  /**
   * 处理视频操作
   * @param {object} e - 事件对象
   * @param {object} userCookies - 用户的 cookie 信息
   * @param {string} aid - 视频的 aid
   * @param {string} operation - 操作类型
   */
  async handleVideoOperation(e, userCookies, aid, operation) {
    const operationMap = {
      点赞: async () => await Bili.likevideo(userCookies, aid, 0),
      取消点赞: async () => await Bili.likevideo(userCookies, aid, 1),
      点踩: async () => await Bili.dislikevideo(userCookies, aid),
      不喜欢: async () => await Bili.dislikevideo(userCookies, aid),
      收藏: async () => await Bili.favvideo(userCookies, aid),
      取消收藏: async () => await Bili.unfavvideo(userCookies, aid),
      一键三连: async () => await Bili.triplevideo(userCookies, aid),
      评论: async () => {
        const message = e.msg.replace(new RegExp(`^#?(${REG})?评论视频`, "g"), "").trim()
        if (!message) return "评论内容不能为空哦~"
        return await Bili.replyvideo(userCookies, aid, message)
      }
    }
    const func = operationMap[operation]
    if (!func) {
      await this.replyMessage(e, "暂不支持该操作")
      return
    }
    const res = await func()
    await this.replyMessage(e, res)
  }

  /**
   * 处理用户关系操作
   * @param {object} e - 事件对象
   * @param {object} userCookies - 用户的 cookie 信息
   * @param {string} mid - 用户的 mid
   * @param {string} operation - 操作类型
   */
  async handleUserRelationOperation(e, userCookies, mid, operation) {
    const operationMap = {
      关注: 1,
      取关: 2,
      取消关注: 2,
      拉黑: 5,
      取消拉黑: 6,
      踢出粉丝: 7
    }
    const act = operationMap[operation]
    if (act === undefined) {
      await this.replyMessage(e, "不支持的操作类型")
      return
    }
    const result = await Bili.relationup(userCookies, mid, act)
    await this.replyMessage(e, result)
  }

  /**
   * 统一的错误处理方法
   * @param {Error} err - 错误对象
   * @param {object} e - 事件对象
   */
  handleError(err, e) {
    this.replyMessage(e, "操作失败啦~\r你可能用了错误的方式")
  }

  /**
   * 统一的回复消息方法
   * @param {object} e - 事件对象
   * @param {string} message - 要回复的消息
   */
  async replyMessage(e, message) {
    await e.reply([message, new Button().Operate()], true)
  }

  /**
   * 从消息中提取操作类型
   * @param {string} msg - 消息内容
   * @returns {string|null} 操作类型，如果没有匹配到则返回 null
   */
  getOperation(msg) {
    const match = msg.match(
      /(点赞|取消点赞|点踩|不喜欢|收藏|取消收藏|一键三连|评论|关注|取关|拉黑|取消拉黑|踢出粉丝|取消关注)/
    )
    return match ? match[0] : null
  }
}
