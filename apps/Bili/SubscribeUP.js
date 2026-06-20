import { BiliAPI as Bili, Tencent as Ten } from "#model"
import { Config } from "#components"
import { REG } from "./index.js"
import { logger } from "#lib"

const DYupReg = new RegExp(`^#?(${REG})?(订阅|取消订阅)[Uu][Pp]`)

export class DYup extends plugin {
  constructor() {
    super({
      name: "Y:B站订阅",
      dsc: "订阅主播",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: DYupReg,
          fnc: "DYup"
        }
      ]
    })
    this.task = [
      {
        cron: Config.Bili.DYupcron,
        name: "B站订阅",
        fnc: () => this.autoUP()
      }
    ]
  }

  /**
   * 处理订阅 UP 主的消息事件
   * @param {object} e - 消息事件对象
   */
  async DYup(e) {
    const isUnsubscribe = e.msg.includes("取消订阅")
    const UPids = e.msg.match(/\d+/g)
    if (!UPids || UPids.length === 0) {
      e.reply("未找到有效的 UP 主 ID")
      return
    }

    const groupId = e.group_id
    const successList = []
    const failList = []

    for (const upId of UPids) {
      try {
        await Config.modifyBiliUP(groupId, upId, isUnsubscribe ? "del" : "add")
        successList.push(upId)
      } catch (err) {
        logger.error(`${isUnsubscribe ? "取消" : ""}订阅UP主 ${upId} 失败: ${err}`)
        failList.push(upId)
      }
    }

    let replyMsg = []
    if (successList.length > 0) {
      replyMsg.push(`${isUnsubscribe ? "成功取消订阅" : "成功订阅"}以下UP主: ${successList.join(", ")}\n`)
    }
    if (failList.length > 0) {
      replyMsg.push(`${isUnsubscribe ? "取消订阅" : "订阅"}失败的UP主: ${failList.join(", ")}`)
    }
    replyMsg.push(`操作群组: ${groupId}`)

    e.reply(replyMsg)
  }

  async autoUP() {
    const uniqueUPs = new Set()
    const upToGroupsMap = new Map()

    for (const item of Config.Bili.UPList) {
      const { Group, UP, Filter = [] } = item
      for (const up of UP) {
        uniqueUPs.add(up)
        if (!upToGroupsMap.has(up)) {
          upToGroupsMap.set(up, [])
        }
        for (const group of Group) {
          upToGroupsMap.get(up).push({
            groupId: group,
            filters: Filter
          })
        }
      }
    }

    const upArray = Array.from(uniqueUPs)
    const resultsArray = await Promise.all(
      upArray.map(async (mid) => {
        const result = await Bili.SubscribeUP(mid)
        return result
      })
    )

    const fixedResults = []
    resultsArray.forEach((resultString) => {
      if (resultString) {
        const fixedString = `[${resultString.replace(/}{/g, "},{")}]`
        const parsedResult = JSON.parse(fixedString)
        fixedResults.push(...parsedResult)
      }
    })

    for (let i = 0; i < upArray.length; i++) {
      const up = upArray[i]
      const result = fixedResults[i]
      const groupsWithFilters = upToGroupsMap.get(up)

      if (result) {
        if (Config.Bili.DYLive) await this.handleLiveStatus(up, result, groupsWithFilters)
        if (Config.Bili.DYVideo) await this.handleVideoUpdate(up, result, groupsWithFilters)
      }
    }
  }

  /**
   * 处理直播状态
   * @param {string} up - UP 主 ID
   * @param {object} result - 订阅结果
   * @param {Array} groupsWithFilters - 群组及其过滤条件列表
   */
  async handleLiveStatus(up, result, groupsWithFilters) {
    const { liveStatus } = result.liveItem
    const Livekey = `Y:Bili:LiveStatus:${up}`
    let liveData = await redis.get(Livekey)
    liveData = liveData ? JSON.parse(liveData) : { status: 0, StartTime: 0, EndTime: 0 }

    if (liveStatus === 1 && liveData.status === 0) {
      const startTime = Date.now()
      const endTime = liveData.EndTime
      let lastText = ""
      if (endTime !== 0) {
        const LastTime = startTime - endTime
        lastText = FormatTime(LastTime)
      }
      liveData.status = 1
      liveData.StartTime = startTime
      await redis.set(Livekey, JSON.stringify(liveData))

      const message = LiveMsg(result.liveItem, "开播", "", lastText)
      await this.sendFilteredMessageToGroups(groupsWithFilters, message, result.liveItem.title)
    } else if (liveStatus === 0 && liveData.status === 1) {
      const endTime = Date.now()
      const contTime = endTime - liveData.StartTime
      const contText = FormatTime(contTime)
      liveData.status = 0
      liveData.EndTime = endTime
      await redis.set(Livekey, JSON.stringify(liveData))
      const message = LiveMsg(result.liveItem, "下播", contText, "")
      await this.sendFilteredMessageToGroups(groupsWithFilters, message, result.liveItem.title)
    }
  }

  /**
   * 处理视频更新
   * @param {string} up - UP 主 ID
   * @param {object} result - 订阅结果
   * @param {Array} groupsWithFilters - 群组及其过滤条件列表
   */
  async handleVideoUpdate(up, result, groupsWithFilters) {
    const param = result.archiveInfo.param
    const redisKey = `Y:Bili:UPinfo:${up}`
    const cachedParam = await redis.get(redisKey)
    if (!cachedParam || cachedParam !== param) {
      const archiveMessage = [
        segment.image(`${result.archiveInfo.cover}`),
        `UP:${result.archiveInfo.author} 更新啦~！\r标题: ${result.archiveInfo.title}\rhttps://b23.tv/${result.archiveInfo.bvid}`
      ]
      await this.sendFilteredMessageToGroups(groupsWithFilters, archiveMessage, result.archiveInfo.title)
      await redis.set(redisKey, param)
    }
  }

  /**
   * 向群组发送经过过滤的消息
   * @param {Array} groupsWithFilters - 群组及其过滤条件列表
   * @param {Array} message - 消息内容
   * @param {string} title - 标题内容（用于过滤判断）
   */
  async sendFilteredMessageToGroups(groupsWithFilters, message, title) {
    for (const groupInfo of groupsWithFilters) {
      const { groupId, filters } = groupInfo

      if (!this.shouldFilterForGroup(title, filters)) {
        const push = await Ten.PushBot()
        await push.pickGroup(groupId).sendMsg(message)
        await Bili.sleep(5000)
      }
    }
  }

  /**
   * 判断特定群组是否需要过滤消息
   * @param {string} title - 标题
   * @param {Array} filters - 该群组的过滤关键词列表
   * @returns {boolean} - 是否需要过滤
   */
  shouldFilterForGroup(title, filters) {
    if (!filters || filters.length === 0) {
      return false
    }
    for (const filter of filters) {
      if (title.includes(filter)) {
        return true
      }
    }
    return false
  }
}

/**
 * 生成直播消息内容
 * @param {object} liveItem - 直播信息对象
 * @param {string} statusText - 直播状态文本，如 '开播' 或 '下播'
 * @param {string} contText - 直播时长文本
 * @param {string} lastText - 距离上次直播的时间文本
 * @returns {Array} - 消息内容数组
 */
function LiveMsg(liveItem, statusText, contText = "", lastText = "") {
  let message = [segment.image(`${liveItem.cover}`), `主播${statusText}啦\r标题：${liveItem.title}\r${liveItem.url}`]
  if (contText) {
    message.push(`\r本次直播时长 ${contText}`)
  }
  if (lastText) {
    message.push(`\r距离上次直播 ${lastText}`)
  }
  return message
}

/**
 * 格式化时长为小时和分钟
 * @param {number} contTime - 时长（毫秒）
 * @returns {string} - 格式化后的时长文本
 */
function FormatTime(contTime) {
  const totalMinutes = Math.floor(contTime / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} 小时 ${minutes} 分钟`
}
