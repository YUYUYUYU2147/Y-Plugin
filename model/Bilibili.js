/**
 * B站 API 模型层
 * 架构说明：
 * - app API（需 access_token）：投币/分享/点赞/三连/收藏/评论/关系操作等
 * - web API（需 SESSDATA）：签到/经验/漫画/信息查询/关注列表
 * - 降级策略：getlivefeed / getFeed / getInfo 优先走 app API，
 *   无 access_token 时自动降级到 web API（SESSDATA cookie）
 * - 投币/分享等写操作：无 access_token 时返回跳过提示（web API 已被 B站 IP 风控返回 -401）
 * 已知限制：服务器 IP 113.31.103.19 被 B站 anti-bot 标记，web 写接口均返回 -401/-403
 */
import fetch from "node-fetch"
import moment from "moment"
import { Config } from "#components"
import { logger } from "#lib"

class Bili {
  constructor() {
    this.signApi = `http://localhost:${Config.Bili.Server_Port}/bili`
    this.prefix = `${Config.Bili.prefix}`
  }

  // 点赞（需 access_token，无则跳过）
  async likevideo(userCookies, aid, action) {
    const likeUrl = `${this.signApi}/like?accesskey=${userCookies.access_token}&aid=${aid}&like=${action}`
    try {
      const response = await fetch(likeUrl)
      const json = await response.json()
      const reply = action === 0 ? "点赞" : "取消点赞"
      return json.code === 0
        ? `${this.prefix}${reply}视频成功`
        : `${this.prefix}${reply}视频失败:${json.message || json.msg || "未知错误"}`
    } catch (err) {
      logger.error("点赞操作失败:", err)
      return `${reply}视频请求失败，请检查日志输出`
    }
  }

  // 点踩
  async dislikevideo(userCookies, aid) {
    const dislikeUrl = `${this.signApi}/dislike?accesskey=${userCookies.access_token}&aid=${aid}`
    try {
      const response = await fetch(dislikeUrl)
      const json = await response.json()
      return json.code === 0
        ? `${this.prefix}点踩视频成功`
        : `${this.prefix}点踩视频失败:${json.message || json.msg || "未知错误"}`
    } catch (err) {
      logger.error("点踩操作失败:", err)
      return "点踩视频请求失败，请检查日志输出"
    }
  }

  // 分享
  async shareVideo(aid, userCookies) {
    if (!userCookies.access_token) return `${this.prefix}分享视频: 跳过(需要access_token)`
    const shareUrl = `${this.signApi}/share?accesskey=${userCookies.access_token}&aid=${aid}`
    try {
      const response = await fetch(shareUrl)
      const json = await response.json()
      if (json.data && json.data.toast) {
        return json.data.toast
      } else if (json.data && json.data.count > 0) {
        return `${this.prefix}分享视频: 成功(5经验)`
      } else {
        return `${this.prefix}分享视频: 失败(请重新登录)`
      }
    } catch (err) {
      logger.error("分享操作失败:", err)
      return "分享视频: 失败(未知错误)"
    }
  }

  // 观看
  async reportWatch(aid, cid, userCookies) {
    const reportUrl = `${this.signApi}/report?SESSDATA=${encodeURIComponent(
      userCookies.SESSDATA
    )}&aid=${aid}&cid=${cid}&csrf=${userCookies.csrf}`
    try {
      const response = await fetch(reportUrl)
      const json = await response.json()
      return json.code === 0 ? `${this.prefix}观看视频: 成功(5经验)` : `${this.prefix}观看视频: 失败(请求错误)`
    } catch (err) {
      logger.error("观看操作失败:", err)
      return "观看视频: 失败(未知错误)"
    }
  }

  // 三连
  async triplevideo(userCookies, aid) {
    const tripleUrl = `${this.signApi}/triple?accesskey=${userCookies.access_token}&aid=${aid}`
    try {
      const response = await fetch(tripleUrl)
      const json = await response.json()
      return json.code === 0
        ? `${this.prefix}一键三连成功，视频已收藏至默认文件夹`
        : `${this.prefix}一键三连失败:${json.message || json.msg || "未知错误"}`
    } catch (err) {
      logger.error("一键三连操作失败:", err)
      return "一键三连请求失败，请检查日志输出"
    }
  }

  // 投币（需 access_token，web API 已被 B站风控返回 -401，无 access_token 时跳过）
  async addCoin(userCookies, aid, coin = 1) {
    if (userCookies.access_token) {
      const coinUrl = `${this.signApi}/addcoin?accesskey=${userCookies.access_token}&aid=${aid}&coin=${coin}&like=1`
      try {
        const response = await fetch(coinUrl)
        const json = await response.json()
        if (json.code === 0) return `${this.prefix}投币视频: 成功(10经验)`
      } catch (err) { logger.error("app投币失败:", err) }
    }
    return `${this.prefix}投币视频: 跳过(需要access_token)`
  }

  // 收藏
  async favvideo(userCookies, aid) {
    const favUrl = `${this.signApi}/fav?accesskey=${userCookies.access_token}&aid=${aid}`
    try {
      const response = await fetch(favUrl)
      const json = await response.json()
      return json.code === 0
        ? `${this.prefix}收藏视频成功，视频已收藏至默认文件夹`
        : `${this.prefix}收藏视频失败:${json.message || json.msg || "未知错误"}`
    } catch (err) {
      logger.error("收藏视频操作失败:", err)
      return "收藏视频请求失败，请检查日志输出"
    }
  }

  // 取消收藏
  async unfavvideo(userCookies, aid) {
    const unfavUrl = `${this.signApi}/unfav?accesskey=${userCookies.access_token}&aid=${aid}`
    try {
      const response = await fetch(unfavUrl)
      const json = await response.json()
      return json.code === 0
        ? `${this.prefix}取消收藏视频成功！`
        : `${this.prefix}取消收藏视频失败:${json.message || json.msg || "未知错误"}`
    } catch (err) {
      logger.error("取消收藏视频操作失败:", err)
      return "取消收藏视频请求失败，请检查日志输出"
    }
  }

  // 评论
  async replyvideo(userCookies, aid, msg) {
    const replyUrl = `${this.signApi}/reply?accesskey=${userCookies.access_token}&aid=${aid}&msg=${msg}`
    try {
      const response = await fetch(replyUrl)
      const json = await response.json()
      return json.code === 0
        ? `${this.prefix}评论视频成功！`
        : `${this.prefix}评论视频失败:${json.message || json.msg || "未知错误"}`
    } catch (err) {
      logger.error("评论视频操作失败:", err)
      return "评论视频请求失败，请检查日志输出"
    }
  }

  // 用户关系
  async relationup(userCookies, mid, act) {
    const actionMap = {
      1: "关注",
      2: "取关",
      5: "拉黑",
      6: "取消拉黑",
      7: "踢出粉丝"
    }
    const actionName = actionMap[act] || "未知操作"
    const relationUrl = `${this.signApi}/relation?accesskey=${userCookies.access_token}&mid=${mid}&act=${act}`
    try {
      const response = await fetch(relationUrl)
      const json = await response.json()
      if (json.code === 0) {
        return `${this.prefix}${actionName}成功`
      } else {
        return `${this.prefix}${actionName}失败: ${json.message || json.msg || "未知错误"}`
      }
    } catch (err) {
      logger.error("用户关系操作失败:", err)
      return "用户关系操作请求失败，请检查日志输出"
    }
  }

  // 发弹幕
  async livesenddamu(userCookies, msg, roomid) {
    const livedamu = `${this.signApi}/danmu?SESSDATA=${userCookies.SESSDATA}&csrf=${userCookies.csrf}&msg=${msg}&roomid=${roomid}`
    try {
      const livedamuResponse = await fetch(livedamu)
      const damu = await livedamuResponse.json()
      if (damu.code === 0) {
        return `${this.prefix}账号『${userCookies.DedeUserID}』在直播间『${roomid}』发送弹幕『${msg}』成功`
      } else {
        return `${this.prefix}账号『${
          userCookies.DedeUserID
        }』在直播间『${roomid}』发送弹幕『${msg}』失败\n失败原因:『${damu.message || damu.msg || "未知错误"}』`
      }
    } catch (err) {
      logger.error("发送弹幕失败", err)
      return `${this.prefix}账号『${userCookies.DedeUserID}』在直播间『${roomid}』发送弹幕『${msg}』失败！！\n失败原因:『请求失败』`
    }
  }

  // 分享直播间
  async liveshare(userCookies, roomid) {
    const jxUrl = `${this.signApi}/liveshare?accesskey=${userCookies.access_token}&roomid=${roomid}`
    try {
      const response = await fetch(jxUrl)
      const json = await response.json()
      return json.code === 0
        ? `${this.prefix}分享直播间${roomid}成功`
        : `${this.prefix}分享直播间${roomid}失败:${json.message || json.msg || "未知错误"}`
    } catch (err) {
      logger.error("视频解析失败:", err)
      return `${this.prefix}分享直播间${roomid}失败: 未知错误`
    }
  }

  // 获取直播间ws地址
  async getLiveUrl(roomid, userCookies) {
    const LiveUrl = `${this.signApi}/livewsinfo?accesskey=${userCookies.access_token}&roomid=${roomid}`
    const response = await fetch(LiveUrl)
    const json = await response.json()
    return json
  }

  // 点赞直播间
  async liveclick(userCookies, roomid, upid, click = 10, MAX_CLICK_PER_REQUEST = 10) {
    let successTotal = 0
    let failTotal = 0
    const errorMessages = new Set()
    const sendClickRequest = async (batchClick) => {
      const liveclickUrl = `${this.signApi}/livelike?accesskey=${userCookies.access_token}&roomid=${roomid}&upid=${upid}&uid=${userCookies.DedeUserID}&click=${batchClick}`
      try {
        const response = await fetch(liveclickUrl)
        const json = await response.json()
        if (json.code === 0) {
          return { success: batchClick, error: null }
        } else {
          const msg = json.message || json.msg || "未知错误"
          return { success: 0, error: msg }
        }
      } catch (err) {
        logger.error("直播间点赞请求失败:", err)
        return { success: 0, error: "请求异常" }
      }
    }
    try {
      let remaining = click
      while (remaining > 0) {
        const batchClick = Math.min(remaining, MAX_CLICK_PER_REQUEST)
        const { success, error } = await sendClickRequest(batchClick)
        successTotal += success
        failTotal += error ? batchClick : 0
        if (error) errorMessages.add(error)
        remaining -= batchClick
        await this.sleep(2000)
      }
    } catch (err) {
      logger.error("直播间点赞流程异常:", err)
      return `${this.prefix}直播间点赞流程异常: ${err.message}`
    }
    const successInfo = `${this.prefix}成功给直播间${roomid}点赞${successTotal}下`
    const failInfo = failTotal > 0 ? `\n${this.prefix}其中点赞失败 ${failTotal} 次(未知错误)` : ""
    return `${successInfo}${failInfo}`
  }

  // 关注主播 - 优先走 app API (access_token)，降级到 SESSDATA web API
  async getlivefeed(userCookies) {
    if (userCookies.access_token) {
      const livefeed = `${this.signApi}/livefeed?accesskey=${userCookies.access_token}`
      try {
        const res = await fetch(livefeed)
        if (res.ok) {
          const json = await res.json()
          let data = json.data?.card_list
            ?.filter(c => c.card_type === "my_idol_v1" && Array.isArray(c.card_data?.my_idol_v1?.list))
            .flatMap(c => c.card_data.my_idol_v1.list)
            .map(r => ({
              roomid: r.roomid, uid: r.uid, name: r.uname, face: r.face,
              cover: r.cover, title: r.title, live_time: r.live_time,
              area_name: r.area_name, area_v2_name: r.area_v2_name,
              area_v2_parent_name: r.area_v2_parent_name, online: r.online
            }))
          if (data?.length) return data
        }
      } catch (e) { logger.error("getlivefeed app接口失败", e) }
    }
    const uid = userCookies.DedeUserID
    if (!uid) return []
    try {
      const followRes = await fetch(
        `https://api.bilibili.com/x/relation/followings?vmid=${uid}&ps=50`,
        {
          headers: {
            Cookie: `SESSDATA=${userCookies.SESSDATA}`,
            'User-Agent': 'Mozilla/5.0',
            Referer: 'https://space.bilibili.com/'
          }
        }
      )
      const followJson = await followRes.json()
      if (followJson.code !== 0) return []
      const uids = (followJson.data?.list || []).map(u => u.mid).filter(Boolean)
      if (!uids.length) return []
      const roomRes = await fetch(
        'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0',
            Cookie: `SESSDATA=${userCookies.SESSDATA}`
          },
          body: uids.map(id => `uids[]=${id}`).join('&')
        }
      )
      const roomJson = await roomRes.json()
      if (roomJson.code !== 0) return []
      const rooms = Object.values(roomJson.data || {}).filter(r => r.live_status === 1)
      return rooms.map(r => ({
        roomid: r.room_id, uid: r.uid, name: r.uname, face: r.face,
        cover: r.cover_from_user || r.face,
        title: r.title, live_time: r.live_time,
        area_name: r.area_name || '', area_v2_name: r.area_v2_name || '',
        area_v2_parent_name: r.area_v2_parent_name || '', online: r.online
      }))
    } catch (e) {
      logger.error("getlivefeed web接口失败", e)
      return []
    }
  }

  // 经验
  async gettoexplog(userCookies) {
    const expLogUrl = `${this.signApi}/exp_log2?SESSDATA=${userCookies.SESSDATA}`
    try {
      const expResponse = await fetch(expLogUrl)
      const expRet = await expResponse.json()
      return expRet
    } catch (err) {
      logger.error("获取经验日志失败", err)
    }
  }

  // 用户web信息
  async getwebinfo(userCookies) {
    const webinfo = `${this.signApi}/myinfo?SESSDATA=${userCookies.SESSDATA}`
    try {
      const webinfoResponse = await fetch(webinfo)
      const web = await webinfoResponse.json()
      return web
    } catch (err) {
      logger.error("获取用户web端信息失败", err)
    }
  }

  // up信息
  async getupinfo(mids, userCookies) {
    const getInfoUrl = `${this.signApi}/userinfo?mid=${mids}&accesskey=${userCookies.access_token}`
    const apiResponse = await (await fetch(getInfoUrl)).json()
    const forwardNodes = []
    if (apiResponse.code === 0 && apiResponse.data && apiResponse.data.length > 0) {
      for (const card of apiResponse.data) {
        const vipStatus = card.vip?.status !== 0
        const messageContent = [
          segment.image(card.face),
          `\r用户名：${card.name}`,
          `\rUID：${card.mid}`,
          `\r性别：${card.sex}`,
          `\r签名：${String(card.sign).replace(/\./g, "·").trim()}`,
          `\r会员：${vipStatus ? card.vip?.label?.text : "无会员"}`,
          vipStatus && card.vip?.due_date
            ? `\r会员到期时间：${moment(card.vip.due_date).format("YYYY-MM-DD HH:mm:ss")}`
            : null,
          `\r账号状态：${card.silence === 0 ? "正常" : "封禁中"}`,
          `\r当前等级：${card.level}`,
          `\r认证信息：${card.official?.role !== 0 ? card.official?.title : "无"}`,
          `\r生日：${card.birthday ? moment(card.birthday * 1000).format("YYYY-MM-DD") : "未设置"}`
        ].filter((item) => item !== null && item !== undefined)
        forwardNodes.push({
          user_id: "80000000",
          nickname: "匿名消息",
          message: messageContent
        })
      }
    } else {
      forwardNodes.push({
        user_id: "80000000",
        nickname: "匿名消息",
        message: `没有查询到up主信息:${apiResponse.message}`
      })
    }
    return forwardNodes
  }

  // 关注列表
  async getFollowList(userCookies) {
    const uid = userCookies.DedeUserID
    if (!uid) return []
    try {
      const res = await fetch(
        `https://api.bilibili.com/x/relation/followings?vmid=${uid}&ps=50`,
        {
          headers: {
            Cookie: `SESSDATA=${userCookies.SESSDATA}`,
            'User-Agent': 'Mozilla/5.0',
            Referer: 'https://space.bilibili.com/'
          }
        }
      )
      const json = await res.json()
      if (json.code !== 0) return []
      return (json.data?.list || []).map(u => ({
        mid: u.mid, name: u.uname, face: u.face, sign: u.sign || ''
      }))
    } catch (e) {
      logger.error("获取关注列表失败", e)
      return []
    }
  }

  // 用户信息
  async getInfo(userCookies) {
    const getInfoUrl = `${this.signApi}/space?accesskey=${userCookies.access_token}&mid=${userCookies.DedeUserID}`
    const expLogUrl = `${this.signApi}/exp_log2?SESSDATA=${userCookies.SESSDATA}`
    const info2 = `${this.signApi}/myinfo2?accesskey=${userCookies.access_token}`
    const webInfoUrl = `${this.signApi}/myinfo?SESSDATA=${userCookies.SESSDATA}`
    // const joinUrl = `https://member.bilibili.com/x2/creative/h5/calendar/event?ts=0&access_key=${userCookies.access_token}`
    const defaultResponse = {
      code: -1,
      data: {
        face: "",
        name: "未知用户",
        vip: {
          label: {
            text: ""
          }
        },
        level_info: {
          current_level: 0
        }
      }
    }
    let infoRet = {
      ...defaultResponse
    }
    try {
      const infoResponse = await fetch(getInfoUrl)
      infoRet = await infoResponse.json()
      if (infoRet.code !== 0) {
        logger.error("空间接口响应异常:", infoRet)
      }
    } catch (err) {
      logger.error("空间接口请求失败:", err)
    }
    if (!infoRet.data?.card?.level_info?.next_exp) {
      try {
        const navRes = await fetch("https://api.bilibili.com/x/web-interface/nav", {
          headers: {
            Cookie: `SESSDATA=${userCookies.SESSDATA}`,
            'User-Agent': 'Mozilla/5.0',
            Referer: 'https://www.bilibili.com/'
          }
        })
        const navJson = await navRes.json()
        if (navJson.code === 0 && navJson.data?.level_info) {
          if (!infoRet.data) infoRet.data = {}
          if (!infoRet.data.card) infoRet.data.card = {}
          infoRet.data.card.level_info = navJson.data.level_info
          if (navJson.data.money) infoRet.data.card.coins = navJson.data.money
        }
      } catch (e) { logger.error("nav接口请求失败:", e) }
    }
    await this.sleep(1000)
    let info2Ret = {
      code: -1,
      data: {
        coins: 0
      }
    }
    try {
      const info2Response = await fetch(info2)
      info2Ret = await info2Response.json()
      if (info2Ret.code !== 0) {
        logger.error("详细信息接口异常:", info2Ret)
      }
    } catch (err) {
      logger.error("详细信息请求失败:", err)
    }
    if (!info2Ret.data?.coins) {
      try {
        const webInfoRes = await fetch(webInfoUrl)
        const webInfo = await webInfoRes.json()
        if (webInfo.code === 0 && webInfo.data?.coins) {
          if (!info2Ret.data) info2Ret.data = {}
          info2Ret.data.coins = webInfo.data.coins
          if (webInfo.data.money) info2Ret.data.money = webInfo.data.money
          if (webInfo.data.birthday) info2Ret.data.birthday = webInfo.data.birthday
          if (webInfo.data.set_birthday !== undefined) info2Ret.data.set_birthday = webInfo.data.set_birthday
        }
      } catch (e) { logger.error("webInfo接口请求失败:", e) }
    }
    await this.sleep(1000)
    let expRet = {
      code: -1,
      data: {}
    }
    try {
      const expResponse = await fetch(expLogUrl)
      expRet = await expResponse.json()
      if (expRet.code !== 0) {
        logger.error("经验接口异常:", expRet)
      }
    } catch (err) {
      logger.error("经验日志请求失败:", err)
    }
    // let joindata = await (await fetch(joinUrl)).json()
    // const join = joindata.data?.pfs.profile.jointime || 0
    const card = infoRet.data.card || defaultResponse.data
    const currentExp = card.level_info?.current_exp || 0
    const collectionTop = infoRet.data.images?.collection_top_simple?.top?.result || []
    const pendant = card.pendant
    const nextExp = card.level_info?.next_exp || card.level_info.current_level * 1000 + 2000
    const divisor = !userCookies.coin ? (card.vip?.vipStatus ? 25 : 15) : card.vip?.vipStatus ? 75 : 65
    const expTasks = [
      {
        name: "每日登录",
        exp: `${expRet.data?.login ? "5/5" : "0/5"}`,
        status: expRet.data?.login || false
      },
      {
        name: "每日观看",
        exp: `${expRet.data?.watch ? "5/5" : "0/5"}`,
        status: expRet.data?.watch || false
      },
      {
        name: "每日投币",
        exp: `${expRet.data?.coins}/50`,
        status: (expRet.data?.coins || 0) >= 50
      },
      {
        name: "每日分享",
        exp: `${expRet.data?.share ? "5/5" : "0/5"}`,
        status: expRet.data?.share || false
      },
      {
        name: "绑定邮箱",
        exp: `${expRet.data?.email ? "20/20" : "0/20"}`,
        status: expRet.data?.email || false
      },
      {
        name: "绑定手机",
        exp: `${expRet.data?.tel ? "100/100" : "0/100"}`,
        status: expRet.data?.tel || false
      },
      {
        name: "设置密保",
        exp: `${expRet.data?.safe_question ? "30/30" : "0/30"}`,
        status: expRet.data?.safe_question || false
      },
      {
        name: "实名认证",
        exp: `${expRet.data?.identify_card ? "50/50" : "0/50"}`,
        status: expRet.data?.identify_card || false
      }
    ]
    return {
      face: card.face,
      name: card.name || "未知用户",
      uid: card.mid || "0",
      fans: card.fans || 0,
      attention: card.attention || 0,
      coins: info2Ret.data?.coins || 0,
      senior: info2Ret.data?.is_senior_member === 1 ? "硬核会员" : "",
      collectionTop,
      pendant,
      sign: card.sign ? card.sign : "这个人很神秘，什么都没有写",
      vipStatus: !!card.vip?.vipStatus,
      vipLabel: card.vip?.label?.text || "普通用户",
      vipDue: card.vip?.vipDueDate ? moment(card.vip.vipDueDate).format("YYYY-MM-DD") : "未开通",
      accountStatus: card.silence === 0 ? "正常" : "封禁中",
      currentLevel: card.level_info?.current_level || 0,
      currentExp: currentExp,
      nextExp: nextExp,
      expNeeded: Math.max(0, nextExp - currentExp),
      daysToLevelUp: Math.ceil(Math.max(0, nextExp - currentExp) / divisor),
      coinStatus: !!userCookies.coin,
      liveStatus: !!userCookies.live,
      // joinTime: join ? moment.unix(join).format("YYYY-MM-DD") : "未知",
      birthday: info2Ret.data?.set_birthday ? moment(info2Ret.data.birthday).format("YYYY-MM-DD") : null,
      expireTime: userCookies.expires_in ? moment(userCookies.expires_in).format("YYYY-MM-DD") : "已过期",
      expTasks
    }
  }

  // 获取UP最新信息
  async SubscribeUP(mid) {
    const UPUrl = `${this.signApi}/space?mid=${mid}`
    const response = await fetch(UPUrl)
    const data = await response.json()
    const live = data.data.live
    const archive = data.data.archive.item[0]
    const liveItem = {
      roomStatus: live.roomStatus,
      roundStatus: live.roundStatus,
      liveStatus: live.liveStatus,
      url: live.url,
      title: live.title,
      cover: live.cover,
      roomid: live.roomid
    }
    const archiveInfo = {
      title: archive.title,
      cover: archive.cover,
      param: archive.param,
      duration: archive.duration,
      bvid: archive.bvid,
      ctime: archive.ctime,
      author: archive.author
    }
    const result = {
      liveItem,
      archiveInfo
    }
    return JSON.stringify(result)
  }

  // 视频推荐
  async getFeed(userCookies) {
    let videoData = []
    while (videoData.length < 5) {
      if (userCookies.access_token) {
        const feedUrl = `${this.signApi}/feed2?accesskey=${userCookies.access_token}`
        try {
          const res = await fetch(feedUrl)
          const json = await res.json()
          if (json.code === 0) {
            const items = json.data.items
            for (const item of items) {
              if (item.player_args && item.player_args.type === "av" && videoData.length < 5) {
                videoData.push({ short_link: item.short_link, aid: item.player_args.aid, cid: item.player_args.cid })
              }
            }
            if (videoData.length >= 5) break
          }
        } catch (e) { logger.error("feed2接口失败:", e) }
      } else {
        try {
          const res = await fetch("https://api.bilibili.com/x/web-interface/index/top/feed/rcmd?ps=5", {
            headers: {
              Cookie: `SESSDATA=${userCookies.SESSDATA}`,
              'User-Agent': 'Mozilla/5.0',
              Referer: 'https://www.bilibili.com/'
            }
          })
          const json = await res.json()
          if (json.code === 0) {
            for (const item of (json.data.item || [])) {
              if (item.bvid && videoData.length < 5) {
                const infoRes = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${item.bvid}`, {
                  headers: { 'User-Agent': 'Mozilla/5.0' }
                })
                const info = await infoRes.json()
                videoData.push({
                  short_link: `https://b23.tv/${item.bvid}`,
                  aid: info.data?.aid || 0,
                  cid: info.data?.cid || 0,
                  bvid: item.bvid
                })
              }
            }
            if (videoData.length >= 5) break
          }
        } catch (e) { logger.error("web feed接口失败:", e) }
      }
      await this.sleep(2500)
    }
    return videoData
  }

  // 大会员经验
  async getExperience(userCookies) {
    const expUrl = `${this.signApi}/experience?SESSDATA=${encodeURIComponent(userCookies.SESSDATA)}&csrf=${
      userCookies.csrf
    }`
    try {
      const response = await fetch(expUrl)
      const json = await response.json()
      return json.code === 0 ? "成功" : `失败(${json.message || json.msg || "未知错误"})`
    } catch (err) {
      logger.error("大会员经验领取失败:", err)
      return "失败"
    }
  }

  // 卡券
  async getCoupons(userCookies) {
    const couponResults = {}
    for (let type = 1; type <= 7; type++) {
      let result = "领取失败(未知错误)"
      try {
        const couponUrl = `${this.signApi}/kaquan?SESSDATA=${encodeURIComponent(userCookies.SESSDATA)}&csrf=${
          userCookies.csrf
        }&type=${type}`
        const response = await fetch(couponUrl)
        const json = await response.json()
        result = json.code === 0 ? "成功" : `${"失败" || json.msg || "未知错误"}`
      } catch (err) {
        logger.error(`类型 ${type} 领取失败:`, err)
      }
      couponResults[type] = result
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
    return couponResults
  }

  // 漫画分享
  async shareManhua(userCookies) {
    const manhuaShareUrl = `${this.signApi}/manhuashare?SESSDATA=${encodeURIComponent(userCookies.SESSDATA)}`
    try {
      const response = await fetch(manhuaShareUrl)
      const json = await response.json()
      if (json.msg === "今日已分享") {
        return "失败(今日已分享)"
      } else if (json.data && json.data.point !== undefined) {
        const earnedPoints = json.data.point
        return `漫画分享:成功(${earnedPoints} 积分)`
      } else {
        return `失败(${json.msg || json.message || "未知错误"})`
      }
    } catch (err) {
      logger.error("漫画分享失败:", err)
      return "失败(未知错误)"
    }
  }

  // 漫画签到
  async signManhua(userCookies) {
    const manhuaSignUrl = `${this.signApi}/manhuasign?SESSDATA=${encodeURIComponent(userCookies.SESSDATA)}`
    try {
      const response = await fetch(manhuaSignUrl)
      const json = await response.json()
      return json.code === 0 ? "成功" : `失败(${json.message || json.msg || "未知错误"})`
    } catch (err) {
      logger.error("漫画签到失败:", err)
      return "失败(未知错误)"
    }
  }

  // 获取视频ID
  async getvideoid(url) {
    const videourl = `${this.signApi}/getid?url=${url}`
    try {
      const data = await fetch(videourl)
      const json = await data.json()
      return json
    } catch (err) {
      logger.error("JSON 解析失败:", err)
      return null
    }
  }

  // 获取视频链接
  async getvideourl(source) {
    const parsedSource = JSON.parse(JSON.stringify(source))
    const urlRegex =
      /https?:\/\/(b23\.tv\/[\w\-]+|live\.bilibili\.com\/[\w\-\/]+|www\.bilibili\.com\/[\w\-\/?=&;]+|bili2233\.cn\/[\w\-\/?=&;]+)/
    const bvRegex = /BV[\w]{10}/

    for (let item of parsedSource.message) {
      if (item.type === "text" || item.type === "json") {
        let content
        if (item.type === "text") {
          content = item.text
        } else {
          try {
            const jsonData = JSON.parse(item.data)
            content = jsonData.meta?.detail_1?.qqdocurl || jsonData
          } catch (error) {
            logger.error("JSON 解析失败:", error)
            continue
          }
        }

        // 先尝试匹配完整的 URL
        let match = content.match(urlRegex)
        if (match) {
          return match[0]
        }

        match = content.match(bvRegex)
        if (match) {
          // 将 BV 号转换为完整的 B 站视频 URL
          return `https://www.bilibili.com/video/${match[0]}`
        }
      }
    }
    return null
  }

  // 检查可用性
  async status(userCookies) {
    try {
      const info2 = `${this.signApi}/myinfo2?accesskey=${userCookies.access_token}`
      const response = await fetch(info2)
      const json = await response.json()
      return json.code === 0
    } catch (error) {
      logger.mark(logger.blue(""), logger.cyan("获取可用性失败，疑似网络问题"), logger.red(error))
      return false
    }
  }

  // 获取引用消息
  async getSourceMessage(e) {
    if (e.getReply) {
      return await e.getReply()
    } else if (e.source) {
      let source
      if (e.isGroup) {
        source = (await e.group.getChatHistory(e.source?.seq, 1)).pop()
      } else {
        source = (await e.friend.getChatHistory(e.source?.time + 1, 1)).pop()
      }
      return source
    }
    return null
  }

  // 延时
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export default new Bili()
