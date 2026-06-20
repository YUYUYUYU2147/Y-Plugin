import { createHash } from "node:crypto"
import { Config } from "#components"
import express from "express"
import fs from "fs"
import path from "path"
import { logger } from "#lib"

const dataFilePath = path.join("./data/BiliApi.json")
let routeStats
try {
  const data = fs.readFileSync(dataFilePath, "utf-8")
  routeStats = JSON.parse(data)
} catch (error) {
  console.error("无法读取数据文件，初始化为空对象")
  routeStats = {}
}

const countRequests = (req, res, next) => {
  const fullPath = req.originalUrl.toLowerCase()
  const pathWithoutQuery = fullPath.split("?")[0]
  const now = new Date()
  const utcOffset = 8 * 60 * 60 * 1000
  const beijingTime = new Date(now.getTime() + utcOffset)
  const formattedNow = beijingTime.toISOString().replace("T", " ").substring(0, 19)
  if (!routeStats[pathWithoutQuery]) {
    routeStats[pathWithoutQuery] = {
      total: 0,
      today: 0,
      lastVisitedDate: formattedNow
    }
  }
  const lastVisited = new Date(routeStats[pathWithoutQuery].lastVisitedDate)
  const today = new Date(formattedNow)
  if (lastVisited.toDateString() !== today.toDateString()) {
    routeStats[pathWithoutQuery].today = 0
  }
  routeStats[pathWithoutQuery].total++
  routeStats[pathWithoutQuery].today++
  routeStats[pathWithoutQuery].lastVisitedDate = formattedNow
  fs.writeFileSync(dataFilePath, JSON.stringify(routeStats, null, 4), "utf-8")
  logger.debug(
    `[访问统计] ${pathWithoutQuery} - 总访问次数: ${routeStats[pathWithoutQuery].total}, 今日访问次数: ${routeStats[pathWithoutQuery].today}`
  )
  next()
}

function bkn(skey) {
  let hash = 5381
  for (let i = 0; i < skey.length; i++) {
    hash += (((hash << 5) & 2147483647) + skey.charCodeAt(i)) & 2147483647
    hash &= 2147483647
  }
  return hash
}

// app签名
const appSign = (params, appkey, appsec) => {
  params.appkey = appkey
  const searchParams = new URLSearchParams(params)
  searchParams.sort()
  return createHash("md5")
    .update(searchParams.toString() + appsec)
    .digest("hex")
}

function appSign2(params, appkey, appsec) {
  const paramsWithAppkey = {
    ...params,
    appkey
  }
  const sortedParams = Object.fromEntries(Object.entries(paramsWithAppkey).sort())
  const query = new URLSearchParams(sortedParams).toString()
  const sign = createHash("md5")
    .update(query + appsec)
    .digest("hex")
  return {
    ...sortedParams,
    sign
  }
}

const likeApiUrl = "https://app.bilibili.com/x/v2/view/like" // 点赞
const dislikeApiUrl = "https://app.bilibili.com/x/v2/view/dislike" // 点踩
const replyApiUrl = "https://api.bilibili.com/x/v2/reply/add" // 评论视频
const shareApiUrl = "https://api.bilibili.com/x/share/finish" // 完成分享
const reportApiUrl = "https://api.bilibili.com/x/v2/history/report" // 上报视频观看
const addCoinApiUrl = "https://app.bilibili.com/x/v2/view/coin/add" // 投币
const unfavApiUrl = "https://api.bilibili.com/x/v3/fav/resource/unfav-all" // 取消收藏
const experienceApiUrl = "https://api.bilibili.com/x/vip/experience/add" // 大会员经验API
const privUrl = "https://api.bilibili.com/x/vip/privilege/receive" // 卡券
const mangaClockInUrl = "https://manga.bilibili.com/twirp/activity.v1.Activity/ClockIn" // 漫画签到
const mangaShareUrl = "https://manga.bilibili.com/twirp/activity.v1.Activity/ShareComic" // 漫画分享
const tripleUrl = "https://app.bilibili.com/x/v2/view/like/triple" // 一键三连
const refreshUrl = "https://passport.bilibili.com/x/passport-login/oauth2/refresh_token" // 刷新ck
const danmuApiUrl = "https://api.live.bilibili.com/msg/send" // 发弹幕
const favApiUrl = "https://api.biliapi.net/x/v3/fav/resource/batch-deal" // 取消收藏
const fav_spaceApiUrl = "https://api.bilibili.com/x/v3/fav/folder/space" // 获取用户收藏夹信息
const spaceApiUrl = "https://app.bilibili.com/x/v2/space" // 获取用户信息
const spacerepApiUrl = "https://app.bilibili.com/x/v2/space/report" // 举办用户空间违规
const explogApiUrl = "https://api.bilibili.com/x/member/web/exp/log" // 一周的用户经验
const explog2ApiUrl = "https://api.bilibili.com/x/member/web/exp/reward" // 今天的用户经验
const myinfoApiUrl = "https://api.bilibili.com/x/space/myinfo" // 今天的用户经验
const inlineApiUrl = "https://app.bilibili.com/x/v2/activity/inline" // 每周必看
const rankApiUrl = "https://api.bilibili.com/pgc/season/rank/list" // 热门排行榜
const activeApiUrl = "https://app.bilibili.com/x/v2/activity/index" // 每周必看完整版
const info2ApiUrl = "https://app.bilibili.com/x/v2/account/myinfo" // app端个人信息
const feedApiUrl = "https://app.bilibili.com/x/v2/feed/index" // app端首页推荐
const liverankApiUrl = "https://api.live.bilibili.com/xlive/general-interface/v1/rank/queryContributionRank" // 直播间在线观众
const livedamuApiUrl = "https://api.live.bilibili.com/xlive/app-room/v1/dM/gethistory" // 直播间弹幕
const feed2ApiUrl = "https://app.bilibili.com/x/v2/feed/index/story" // app端短视频推荐、
const livefeedApiUrl = "https://api.live.bilibili.com/xlive/app-interface/v2/index/feed" // app端首页推荐
const userinfoApiUrl = "https://api.vc.bilibili.com/x/im/user_infos" // app端首页推荐
const reply2ApiUrl = "https://api.bilibili.com//x/v2/reply/main" // 评论区
const list2ApiUrl = "https://show.bilibili.com/api/ticket/addr/list2" // 收货地址
const addrApiUrl = "https://show.bilibili.com/api/ticket/addr/create" // 添加收货地址
const deladdrApiUrl = "https://show.bilibili.com/api/ticket/addr/delete" // 删除收货地址
const relaApiUrl = "https://api.bilibili.com/x/relation/modify" // 操作用户关系
const followApiUrl = "https://api.bilibili.com/x/relation/followings" // 查询用户关注列表
const sameApiUrl = "https://api.bilibili.com/x/relation/same/followings" // 获取共同关注
const blackApiUrl = "https://api.bilibili.com/x/relation/blacks" // 获取黑名单
const friendApiUrl = "https://api.bilibili.com/x/relation/friends" // 获取黑名单
const livelikeApiUrl = "https://api.live.bilibili.com/xlive/app-ucenter/v1/like_info_v3/like/likeReportV3" // 直播间点赞
const appKey = "1d8b6e7d45233436"
const appSecret = "560c52ccd288fed045859ed18bffd973"

const proxyRouter = express.Router()
// 应用统计中间件到所有路由
proxyRouter.use(countRequests)

const apis = [
  // 用户信息类
  {
    path: "/myinfo",
    method: "GET",
    description: "获取当前登录号网页端信息",
    parameters: ["query.SESSDATA"]
  },
  {
    path: "/myinfo2",
    method: "GET",
    description: "获取当前登录号app端信息",
    parameters: ["query.accesskey"]
  },
  {
    path: "/space",
    method: "GET",
    description: "获取用户app端完整信息",
    parameters: ["query.accesskey(可选参数)", "query.mid"]
  },
  {
    path: "/userinfo",
    method: "GET",
    description: "批量获取用户信息",
    parameters: ["query.accesskey(可选)", "query.mid"]
  },
  {
    path: "/fav_space",
    method: "GET",
    description: "获取用户收藏夹",
    parameters: ["query.accesskey", "query.mid"]
  },
  // 视频互动类
  {
    path: "/like",
    method: "GET",
    description: "点赞或取消点赞",
    parameters: ["query.accesskey", "query.aid", "query.like(0点赞/1取消)"]
  },
  {
    path: "/dislike",
    method: "GET",
    description: "点踩视频",
    parameters: ["query.accesskey", "query.aid"]
  },
  {
    path: "/share",
    method: "GET",
    description: "分享操作",
    parameters: ["query.accesskey", "query.aid"]
  },
  {
    path: "/triple",
    method: "GET",
    description: "一键三连",
    parameters: ["query.accesskey", "query.aid"]
  },
  {
    path: "/addcoin",
    method: "GET",
    description: "投币",
    parameters: ["query.accesskey", "query.aid", "query.coin", "query.like"]
  },
  {
    path: "/fav",
    method: "GET",
    description: "添加收藏",
    parameters: ["query.accesskey", "query.aid"]
  },
  {
    path: "/unfav",
    method: "GET",
    description: "取消收藏",
    parameters: ["query.accesskey", "query.aid"]
  },
  {
    path: "/reply",
    method: "GET",
    description: "评论视频",
    parameters: ["query.accesskey", "query.aid", "query.msg"]
  },

  // 直播相关
  {
    path: "/danmu",
    method: "GET",
    description: "直播间发弹幕",
    parameters: ["query.roomid", "query.SESSDATA", "query.msg", "query.csrf"]
  },
  {
    path: "/liverank",
    method: "GET",
    description: "直播间在线观众",
    parameters: ["query.accesskey(可选)", "query.roomid", "query.upid"]
  },
  {
    path: "/livewsinfo",
    method: "GET",
    description: "获取指定房间的ws连接地址",
    parameters: ["query.accesskey", "query.roomid"]
  },
  {
    path: "/livedamu",
    method: "GET",
    description: "直播间弹幕",
    parameters: ["query.accesskey(可选)", "query.roomid"]
  },
  {
    path: "/livelike",
    method: "GET",
    description: "直播间点赞",
    parameters: ["query.accesskey", "query.roomid", "query.upid", "query.uid", "query.click"]
  },
  {
    path: "/liveshare",
    method: "GET",
    description: "直播间分享",
    parameters: ["query.accesskey", "query.roomid"]
  },
  {
    path: "/livefocus",
    method: "GET",
    description: "通过直播间关注主播",
    parameters: ["query.accesskey", "query.roomid"]
  },

  // 数据记录类
  {
    path: "/report",
    method: "ALL",
    description: "上报观看记录",
    parameters: ["query.csrf", "query.SESSDATA", "query.aid", "query.cid", "query.time"]
  },
  {
    path: "/exp_log",
    method: "GET",
    description: "最近一周经验情况",
    parameters: ["query.SESSDATA"]
  },
  {
    path: "/exp_log2",
    method: "GET",
    description: "今天经验领取情况",
    parameters: ["query.SESSDATA"]
  },

  // 会员权益类
  {
    path: "/experience",
    method: "ALL",
    description: "大会员经验",
    parameters: ["query.SESSDATA", "query.csrf"]
  },
  {
    path: "/kaquan",
    method: "ALL",
    description: "领取会员卡券",
    parameters: ["query.SESSDATA", "query.csrf", "query.type(1-7)"]
  },

  // 漫画类
  {
    path: "/manhuasign",
    method: "ALL",
    description: "哔站漫画签到",
    parameters: ["query.SESSDATA"]
  },
  {
    path: "/manhuashare",
    method: "ALL",
    description: "哔站漫画分享",
    parameters: ["query.SESSDATA"]
  },

  // 推荐流类
  {
    path: "/feed",
    method: "GET",
    description: "app端首页推荐",
    parameters: ["query.accesskey(可选)"]
  },
  {
    path: "/feed2",
    method: "GET",
    description: "app端短视频推荐",
    parameters: ["query.accesskey(可选)"]
  },
  {
    path: "/livefeed",
    method: "GET",
    description: "直播首页内容",
    parameters: ["query.accesskey(可选)"]
  },

  // 社交关系类addspecial
  {
    path: "/relation",
    method: "GET",
    description: "操作用户关系",
    parameters: ["query.accesskey", "query.mid", "query.act", "query.src"]
  },
  {
    path: "/addspecial",
    method: "GET",
    description: "添加特别关系",
    parameters: ["query.accesskey", "query.mid"]
  },
  {
    path: "/delspecial",
    method: "GET",
    description: "删除特别关系",
    parameters: ["query.accesskey", "query.mid"]
  },
  {
    path: "/friends",
    method: "GET",
    description: "获取互相关注",
    parameters: ["query.accesskey"]
  },
  {
    path: "/follow",
    method: "GET",
    description: "获取关注列表",
    parameters: ["query.accesskey(可选)", "query.mid", "query.pn", "query.ps"]
  },
  {
    path: "/same",
    method: "GET",
    description: "获取共同关注",
    parameters: ["query.accesskey", "query.mid", "query.pn", "query.ps"]
  },
  {
    path: "/blacks",
    method: "GET",
    description: "获取黑名单列表",
    parameters: ["query.accesskey", "query.pn", "query.ps"]
  },

  // 排行榜单类
  {
    path: "/inline",
    method: "GET",
    description: "每周必看",
    parameters: ["query.accesskey(可选)"]
  },
  {
    path: "/act_1",
    method: "GET",
    description: "每周必看完整版",
    parameters: ["query.accesskey(可选)"]
  },
  {
    path: "/rank",
    method: "GET",
    description: "排行榜",
    parameters: ["query.accesskey(可选)", "query.type(1-7)"]
  },

  // QQ功能类
  {
    path: "/qqdaily",
    method: "GET",
    description: "收集卡",
    parameters: ["query.uin", "query.skey", "query.pskey"]
  },
  {
    path: "/qqdaily2",
    method: "GET",
    description: "普通日签卡",
    parameters: ["query.uin", "query.skey", "query.pskey"]
  },
  {
    path: "/qqdaily3",
    method: "GET",
    description: "晚安卡",
    parameters: ["query.uin", "query.skey", "query.pskey"]
  },
  {
    path: "/qqdaily4",
    method: "GET",
    description: "每日Q崽",
    parameters: ["query.uin", "query.skey", "query.pskey"]
  },
  {
    path: "/qqdaily5",
    method: "GET",
    description: "心事罐",
    parameters: ["query.uin", "query.skey", "query.pskey"]
  },
  {
    path: "/qqshare",
    method: "GET",
    description: "收集卡分享",
    parameters: ["query.uin", "query.skey", "query.pskey", "query.friend"]
  },
  {
    path: "/luckyword",
    method: "GET",
    description: "群幸运字符",
    parameters: ["query.uin", "query.skey", "query.pskey", "query.group"]
  },

  // 工具类
  {
    path: "/refresh",
    method: "GET",
    description: "刷新哔站ck",
    parameters: ["query.accesskey", "query.refresh_token"]
  },
  {
    path: "/getid",
    method: "GET",
    description: "获取视频 ID",
    parameters: ["query.url - 视频地址"]
  },

  // 其他功能
  {
    path: "/sp_report",
    method: "GET",
    description: "举办用户空间",
    parameters: ["query.accesskey", "query.mid", "query.reason", "query.reason_v2", "query.csrf"]
  },
  {
    path: "/reply2",
    method: "GET",
    description: "评论区",
    parameters: ["query.accesskey(可选)", "query.id", "query.pn", "query.ps", "query.type"]
  },

  // 地址管理类
  {
    path: "/lists",
    method: "GET",
    description: "收货地址查询",
    parameters: ["query.SESSDATA"]
  },
  {
    path: "/deladdr",
    method: "GET",
    description: "删除收货地址",
    parameters: ["query.SESSDATA", "query.id"]
  },
  {
    path: "/addr",
    method: "GET",
    description: "添加收货地址",
    parameters: [
      "query.name",
      "query.phone",
      "query.prov_id",
      "query.area_id",
      "query.city_id",
      "query.addr",
      "query.prov",
      "query.city",
      "query.area",
      "query.SESSDATA"
    ]
  }
]

proxyRouter.get("/", (req, res) => {
  // 为每个路由添加访问次数
  const apiList = apis.map((api) => ({
    ...api,
    visitCount: routeStats[`/bili${api.path}`]?.total || 0,
    todayVisitCount: routeStats[`/bili${api.path}`]?.today || 0
  }))

  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bilibili API</title>
    <style>
        :root {
            --primary: #00a1d6;
            --warning: #ffb74d;
            --info: #4dd0e1;
            --success: #81c784;
            --text-primary: #2d3339;
            --text-secondary: #4d555d;
            --bg-blur: rgba(255,255,255,0.95);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell;
            margin: 0;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
            -webkit-tap-highlight-color: transparent;
        }

        .bg-layer {
            position: fixed;
            inset: 0;
            background-size: cover;
            background-position: center;
            opacity: 0;
            transition: opacity 1s ease-in-out;
            filter: blur(8px) brightness(0.8);
            z-index: -1;
            scale: 1.02;
        }

        .container {
            max-width: 1440px;
            margin: 0 auto;
            padding: 2rem 1rem;
            position: relative;
        }

        .header {
            text-align: center;
            margin-bottom: 3rem;
            position: relative;
        }

        .gradient-text {
            background: linear-gradient(271.14deg, #001bff 0.98%, #00f0ff 15.79%, #fce84a 37.33%, #f34628 55.77%, #b275ff 72.4%, #a50cdd 91.4%);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradientMove 5s ease infinite;
            font-weight: 700;
            font-size: clamp(2rem, 5vw, 3.5rem);
        }

        .notice-container {
            max-width: 800px;
            margin: 2rem auto;
        }

        .notice-container .card {
            margin-bottom: 1.5rem;
        }

        .grid {
            display: grid;
            gap: 1.5rem;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            grid-auto-rows: minmax(180px, auto);
            align-items: start;
        }

        .card {
            background: var(--bg-blur);
            border-radius: 1rem;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 8px 32px rgba(0,0,0,0.05);
            transition: var(--transition);
            cursor: pointer;
            user-select: none;
            margin: 0.5rem;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.1);
        }

        .api-info {
            margin-top: 1rem;
        }

        .api-info p {
            margin: 0.5rem 0;
            color: var(--text-secondary);
        }

        .api-stats {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            padding: 0.75rem;
            background: rgba(var(--primary), 0.1);
            border-radius: 0.75rem;
        }

        .stat-item {
            flex: 1;
            text-align: center;
            padding: 0.5rem;
            background: rgba(255,255,255,0.9);
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .stat-item span {
            display: block;
            font-size: 0.9em;
            color: var(--text-secondary);
        }

        .stat-item strong {
            font-size: 1.1em;
            color: var(--primary);
        }

        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5em 1em;
            border-radius: 2em;
            background: var(--primary);
            color: white;
            font-size: 0.9em;
            gap: 0.5em;
            transition: var(--transition);
        }

        .modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(5px);
            display: none;
            place-items: center;
            padding: 1rem;
            z-index: 999;
        }

        .modal-content {
            background: var(--bg-blur);
            width: min(90%, 600px);
            padding: 2rem;
            border-radius: 1.5rem;
            backdrop-filter: blur(20px);
            transform: scale(0.95);
            transition: var(--transition);
            max-height: 90vh;
            overflow-y: auto;
            user-select: text;
        }

        .stats-content {
            text-align: center;
            line-height: 1.8;
        }

        .stats-content strong {
            display: block;
            margin: 1rem 0;
        }

        .stats-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
        }

        @media (max-width: 640px) {
            .modal-content {
                padding: 1.5rem;
                width: 95%;
            }
        }

        .stats {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            backdrop-filter: blur(10px);
            background: rgba(var(--primary), 0.9);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 2rem;
            font-size: 0.9em;
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .tips {
            max-width: 800px;
            margin: 2rem auto;
        }
    </style>
    <script>
        let currentBg = 1;
        const startDate = new Date('2013-06-14T12:00:00');
        
        function updateRuntime() {
            const now = new Date();
            const diff = now - startDate;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            document.getElementById('runtime').innerHTML = 
                \`已运行 \${days}天\${hours}小时\${minutes}分\${seconds}秒\`;
        }

        function showModal(content) {
            const overlay = document.getElementById('modalOverlay');
            const modalContent = document.getElementById('modalContent');
            modalContent.innerHTML = content;
            overlay.style.display = 'grid';
        }

        function changeBackground() {
            const newBg = 'https://api.zy1314.icu/img?' + Math.random();
            const bg1 = document.getElementById("background");
            const bg2 = document.getElementById("background2");
            const img = new Image();
            img.src = newBg;

            img.onload = function () {
                if (currentBg === 1) {
                    bg2.style.backgroundImage = 'url(' + newBg + ')';
                    bg2.style.opacity = 0.35;
                    bg1.style.opacity = 0;
                    currentBg = 2;
                } else {
                    bg1.style.backgroundImage = 'url(' + newBg + ')';
                    bg1.style.opacity = 0.35;
                    bg2.style.opacity = 0;
                    currentBg = 1;
                }
            };
        }

        window.onload = function () {
            setInterval(changeBackground, 7000);
            setInterval(updateRuntime, 1000);
            changeBackground();
            updateRuntime();

            document.querySelectorAll('.card').forEach(box => {
                box.addEventListener('click', () => {
                    const title = box.querySelector('h3').innerText;
                    const info = box.querySelector('.api-info').innerHTML;
                    showModal(\`<h3>\${title}</h3><div class="api-info">\${info}</div>\`);
                });
            });

            document.querySelector('.notice-info').addEventListener('click', () => {
            });
        };
    </script>
</head>
<body>
    <div id="background" class="bg-layer"></div>
    <div id="background2" class="bg-layer"></div>
    
    <div id="modalOverlay" class="modal" onclick="this.style.display='none'">
        <div class="modal-content" onclick="event.stopPropagation()">
            <div id="modalContent"></div>
        </div>
    </div>

    <div class="container">
        <header class="header">
            <h1><span class="gradient-text">Bilibili API</span></h1>
        </header>

        <div class="notice-container">
            <div class="card notice-warning">
                <strong>⚠ 免责声明：</strong><br>
                请勿用于商业盈利，通过使用本API所导致的责任均由使用者承担。本API不会保留您的B站登录状态，若您的账号封禁、被盗等处罚与我方无关，害怕风险请勿使用。
            </div>
        </div>

        <div class="grid">
            ${apiList
              .map(
                (api) => `
                <div class="card">
                    <h3>${api.path}</h3>
                    <div class="api-info">
                        <p><strong>方法:</strong> ${api.method}</p>
                        <p><strong>描述:</strong> ${api.description}</p>
                        <p><strong>参数:</strong> ${api.parameters.join(", ")}</p>
                        <div class="api-stats">
                            <div class="stat-item">
                                <span>今日访问</span>
                                <strong>${api.todayVisitCount}</strong>
                            </div>
                            <div class="stat-item">
                                <span>总访问</span>
                                <strong>${api.visitCount}</strong>
                            </div>
                        </div>
                    </div>
                </div>`
              )
              .join("")}
        </div>

        <div class="card tips">
            💡 使用提示：所有的请求参数直接拼接在本api后面即可。如需获取Cookie，请前往 
            <a href="https://api.521002.xyz/bili" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 500;">
                完成获取
            </a>
        </div>
    </div>

    <div class="stats">
        🚀 <span id="runtime"></span> | 特别鸣谢 84227871
    </div>
</body>
</html>`

  res.send(htmlContent)
})

// ==================== B站扫码登录 ====================
// 存储二维码key与key映射表
const qrcodeMap = new Map()

// 生成二维码 / 轮询登录状态
proxyRouter.get("/login", async (req, res) => {
  const t = req.query.t

  if (t === "bili") {
    // 获取二维码
    try {
      const qrRes = await fetch("https://passport.bilibili.com/x/passport-login/web/qrcode/generate", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.bilibili.com/"
        }
      })
      const data = await qrRes.json()
      if (data.code !== 0 || !data.data) {
        return res.json({ code: -1, msg: data.message || "获取二维码失败" })
      }
      const { url, qrcode_key } = data.data
      // 存储 qrcode_key，后续轮询需要
      qrcodeMap.set(qrcode_key, { createdAt: Date.now() })

      res.json({
        code: 0,
        data: {
          url,
          auth_code: qrcode_key
        }
      })
    } catch (error) {
      logger.error("获取B站二维码失败：", error)
      res.json({ code: -1, msg: error.message || "获取二维码失败" })
    }
  } else if (t === "bilipoll") {
    // 轮询扫码状态
    const { auth_code, key } = req.query
    if (!auth_code) {
      return res.json({ code: -1, msg: "缺少auth_code参数" })
    }
    try {
      const pollRes = await fetch(
        `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${auth_code}`,
        {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: "https://www.bilibili.com/"
          }
        }
      )
      const data = await pollRes.json()

      // B站轮询返回结构：{ code: 0, data: { url: "...", code: 86101/86090/0, ... } }
      // 真正的扫码状态在 data.data.code 里
      if (!data.data) {
        return res.json({ code: -1, msg: "无效的响应数据" })
      }

      const innerCode = data.data.code

      if (innerCode === 0) {
        // 登录成功
        logger.info(`[扫码登录] B站登录成功，完整数据: ${JSON.stringify(data.data)}`)

        const redirectUrl = data.data.url || ""

        // 优先从URL中提取mid（B站登录回调url里包含DedeUserID）
        let mid = ""
        try {
          if (redirectUrl.includes("DedeUserID=")) {
            const match = redirectUrl.match(/DedeUserID=(\d+)/)
            if (match) mid = match[1]
          }
        } catch (e) {}
        // 兜底：从data.data.mid取
        if (!mid) mid = data.data.mid || ""

        let cookieInfo = {
          SESSDATA: "",
          bili_jct: "",
          DedeUserID: "",
          DedeUserID__ckMd5: "",
          sid: ""
        }

        if (redirectUrl) {
          try {
            const redirectRes = await fetch(redirectUrl, {
              method: "GET",
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: "https://passport.bilibili.com/",
                Accept: "*/*"
              },
              redirect: "manual"
            })

            logger.info(`[扫码登录] 重定向状态=${redirectRes.status}`)

            // 兼容多种 Node.js 版本提取 Set-Cookie
            let setCookieStr = ""
            try {
              if (typeof redirectRes.headers.getSetCookie === "function") {
                // Node.js 18.3+ 原生方法
                const cookies = redirectRes.headers.getSetCookie()
                setCookieStr = cookies.join("|||")
              } else if (Array.isArray(redirectRes.headers["set-cookie"])) {
                // node-fetch / undici
                setCookieStr = redirectRes.headers["set-cookie"].join("|||")
              } else if (typeof redirectRes.headers["set-cookie"] === "string") {
                setCookieStr = redirectRes.headers["set-cookie"]
              } else if (redirectRes.headers.raw && typeof redirectRes.headers.raw === "function") {
                // fetch API raw()
                const rawHeaders = redirectRes.headers.raw()
                setCookieStr = (rawHeaders["set-cookie"] || []).join("|||")
              }
            } catch (e) {
              logger.warn(`[扫码登录] 提取Set-Cookie异常: ${e.message}`)
            }

            logger.info(`[扫码登录] Set-Cookie原始数据长度: ${setCookieStr.length}`)

            // 从 Set-Cookie 字符串解析各字段
            if (setCookieStr) {
              const cookiePairs = setCookieStr.split("|||")
              cookiePairs.forEach((cookieHeader) => {
                const pair = cookieHeader.split(";")[0].trim() // 只取 name=value 部分
                const eqIdx = pair.indexOf("=")
                if (eqIdx > 0) {
                  const name = pair.substring(0, eqIdx).trim()
                  const value = pair.substring(eqIdx + 1).trim()
                  switch (name) {
                    case "SESSDATA": cookieInfo.SESSDATA = value; break
                    case "bili_jct": cookieInfo.bili_jct = value; break
                    case "DedeUserID": cookieInfo.DedeUserID = value; break
                    case "DedeUserID__ckMd5": cookieInfo.DedeUserID__ckMd5 = value; break
                    case "sid": cookieInfo.sid = value; break
                  }
                }
              })
            }

            // 从URL的fragment或query中补全缺失的cookie字段
            try {
              let parseUrl = redirectUrl
              if (parseUrl.includes("#")) {
                parseUrl = parseUrl.split("#")[1]
              }
              const urlObj = new URL(parseUrl)
              const params = urlObj.searchParams

              // 用URL参数补全任何缺失的字段
              const urlSESSDATA = params.get("SESSDATA")
              const urlBiliJct = params.get("bili_jct")
              const urlDedeUID = params.get("DedeUserID")
              const urlCkMd5 = params.get("DedeUserID__ckMd5")
              const urlSid = params.get("sid")

              // 只在Set-Cookie没拿到时才用URL的值（避免覆盖）
              if (!cookieInfo.SESSDATA && urlSESSDATA) cookieInfo.SESSDATA = urlSESSDATA
              if (!cookieInfo.bili_jct && urlBiliJct) cookieInfo.bili_jct = urlBiliJct
              if (!cookieInfo.DedeUserID && urlDedeUID) cookieInfo.DedeUserID = urlDedeUID
              if (!cookieInfo.DedeUserID__ckMd5 && urlCkMd5) cookieInfo.DedeUserID__ckMd5 = urlCkMd5
              if (!cookieInfo.sid && urlSid) cookieInfo.sid = urlSid
              // DedeUserID 兜底用mid
              if (!cookieInfo.DedeUserID) cookieInfo.DedeUserID = mid
            } catch (e) {
              logger.warn(`[扫码登录] URL解析异常: ${e.message}`)
            }
          } catch (e) {
            logger.warn(`[扫码登录] 获取登录Cookie失败：${e.message}`)
          }
        }

        const refresh_token = data.data.refresh_token || ""
        let access_token = ""

        if (refresh_token) {
          try {
            const tokenRes = await fetch("https://passport.bilibili.com/x/passport-login/oauth2/refresh_token", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              },
              body: new URLSearchParams({ refresh_token }).toString()
            })
            const tokenData = await tokenRes.json()
            if (tokenData.code === 0 && tokenData.data?.token_info?.access_token) {
              access_token = tokenData.data.token_info.access_token
            }
          } catch (e) {
            logger.warn("获取access_token失败：", e.message)
          }
        }

        logger.info(`[扫码登录] 最终返回: mid=${mid}, DedeUserID=${cookieInfo.DedeUserID}, SESSDATA=${cookieInfo.SESSDATA ? "有" : "无"}`)
        res.json({
          code: 0,
          data: {
            mid: mid,
            access_token: access_token,
            refresh_token: refresh_token,
            expires_in: 15552000,
            cookie: cookieInfo
          }
        })
        qrcodeMap.delete(auth_code)
      } else if (innerCode === 86038) {
        qrcodeMap.delete(auth_code)
        res.json({ code: 86038, msg: "二维码已过期" })
      } else if (innerCode === 86090) {
        res.json({ code: 86090, msg: "已扫描，等待确认" })
      } else if (innerCode === 86101) {
        res.json({ code: 86101, msg: "等待扫描" })
      } else {
        res.json({ code: -1, msg: `未知状态: ${data.data.message || innerCode}` })
      }
    } catch (error) {
      logger.error("轮询B站登录状态失败：", error)
      res.json({ code: -1, msg: error.message || "轮询失败" })
    }
  } else {
    res.json({ code: -1, msg: "参数错误：t参数应为bili或bilipoll" })
  }
})

// 获取互相关注
proxyRouter.get("/friends", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    if (!accessKey) {
      return res.status(400).send("缺少必要的参数（ accesskey ）")
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      disable_rcmd: "0",
      mobi_app: "android",
      nohot: "1",
      platform: "android",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000)
    }
    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(friendApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 查询用户共同关注列表
proxyRouter.get("/blacks", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const pn = req.query.pn || "1"
    const ps = req.query.ps || "50"
    if (!accessKey) {
      return res.status(400).send("缺少必要的参数（ accesskey、pn(默认1)、ps(默认10) ）")
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      disable_rcmd: "0",
      mobi_app: "android",
      nohot: "1",
      platform: "android",
      pn,
      ps,
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000)
    }
    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(blackApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 查询用户共同关注列表
proxyRouter.get("/same", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const mid = req.query.mid
    const pn = req.query.pn || "1"
    const ps = req.query.ps || "50"
    if (!accessKey || !mid) {
      return res.status(400).send("缺少必要的参数（ accesskey、pn(默认1)、ps(默认10)、mid ）")
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      disable_rcmd: "0",
      mobi_app: "android",
      nohot: "1",
      vmid: mid,
      platform: "android",
      pn,
      ps,
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000)
    }
    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(sameApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 查询用户关注列表
proxyRouter.get("/follow", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    const mid = req.query.mid
    const pn = req.query.pn || "1"
    const ps = req.query.ps || "50"
    if (!accessKey || !mid) {
      return res.status(400).send("缺少必要的参数（ accesskey(可选)、pn(默认1)、ps(默认10)、mid ）")
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      disable_rcmd: "0",
      mobi_app: "android",
      nohot: "1",
      vmid: mid,
      platform: "android",
      order_type: "attention",
      pn,
      ps,
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000)
    }
    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(followApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 操作用户关系
proxyRouter.get("/delspecial", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const mid = req.query.mid

    if (!accessKey || !mid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 mid）")
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      fid: mid,
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.biliapi.net",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch("https://api.bilibili.com/x/relation/tag/special/del", {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 1514664085 进行解决")
  }
})

// 添加特别关系
proxyRouter.get("/addspecial", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const mid = req.query.mid

    if (!accessKey || !mid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 mid）")
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      fid: mid,
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.biliapi.net",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch("https://api.bilibili.com/x/relation/tag/special/add", {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 1514664085 进行解决")
  }
})

// 操作用户关系
proxyRouter.get("/relation", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const mid = req.query.mid
    const src = req.query.re_src || "11"
    const act = req.query.act

    if (!accessKey || !mid || !act || !src) {
      return res
        .status(400)
        .send(
          "缺少必要的参数（accesskey、src、act(1为关注;2为取关;3为悄悄关注;4为取消悄悄关注;5为拉黑;6为取消拉黑;7为踢出粉丝)或 mid）"
        )
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      appkey: appKey,
      act,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      fid: mid,
      mobi_app: "android",
      platform: "android",
      re_src: src,
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.biliapi.net",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch(relaApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 删除收货地址
proxyRouter.get("/deladdr", async (req, res) => {
  try {
    const { id, SESSDATA } = req.query
    const missingParams = []
    if (!id) missingParams.push("query.id")
    if (!SESSDATA) missingParams.push("query.SESSDATA")

    if (missingParams.length > 0) {
      return res.status(400).send(`缺少必要的参数: ${missingParams.join(", ")}`)
    }
    const params = {
      id
    }

    const headers = {
      Host: "show.bilibili.com",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; 2206123SC Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 BiliApp/8020300 mobi_app/android isNotchWindow/0 NotchHeight=24 mallVersion/8020300 mVersion/263 disable_rcmd/0",
      "Content-Type": "application/json",
      Accept: "*/*",
      Origin: "https://mall.bilibili.com",
      "X-Requested-With": "tv.danmaku.bili",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      Referer: "https://mall.bilibili.com/",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Cookie: `SESSDATA=${SESSDATA}`
    }

    const response = await fetch(deladdrApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 添加收货地址
proxyRouter.get("/addr", async (req, res) => {
  try {
    const { name, phone, prov_id, area_id, city_id, addr, prov, city, area, SESSDATA } = req.query
    const missingParams = []
    if (!name) missingParams.push("query.name")
    if (!phone) missingParams.push("query.phone")
    if (!prov_id) missingParams.push("query.prov_id")
    if (!area_id) missingParams.push("query.area_id")
    if (!city_id) missingParams.push("query.city_id")
    if (!addr) missingParams.push("query.addr")
    if (!SESSDATA) missingParams.push("query.SESSDATA")

    if (missingParams.length > 0) {
      return res.status(400).send(`缺少必要的参数: ${missingParams.join(", ")}`)
    }
    const params = {
      name,
      phone,
      prov_id: parseInt(prov_id),
      area_id: parseInt(area_id),
      city_id: parseInt(city_id),
      addr,
      prov,
      city,
      area,
      def: 1,
      provCityArea: ""
    }

    const headers = {
      Host: "show.bilibili.com",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; 2206123SC Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 BiliApp/8020300 mobi_app/android isNotchWindow/0 NotchHeight=24 mallVersion/8020300 mVersion/263 disable_rcmd/0",
      "Content-Type": "application/json",
      Accept: "*/*",
      Origin: "https://mall.bilibili.com",
      "X-Requested-With": "tv.danmaku.bili",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      Referer: "https://mall.bilibili.com/",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Cookie: `SESSDATA=${SESSDATA}`
    }

    const response = await fetch(addrApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 获取自己的网页端用户信息
proxyRouter.get("/myinfo", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA || req.query.sessdata

    if (!SESSDATA) {
      return res.status(400).send("缺少必要的参数（SESSDATA）")
    }
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; 2206123SC Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 Mobile os/android model/2206123SC build/8020300 osVer/12 sdkInt/32 network/2 BiliApp/8020300 mobi_app/android channel/yingyongbao Buvid/XU4C85241BF18FBC9C5C20CA1D08F38937711 sessionID/94944b0b innerVer/8020300 c_locale/zh_CN s_locale/zh_CN disable_rcmd/0 8.2.0 os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      host: "www.bilibili.com",
      cookie: `SESSDATA=${SESSDATA}`
    }

    const response = await fetch(myinfoApiUrl, {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请稍后再试或联系支持人员")
  }
})

// 今天的签到情况
proxyRouter.get("/exp_log2", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA || req.query.sessdata

    if (!SESSDATA) {
      return res.status(400).send("缺少必要的参数（SESSDATA）")
    }
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; 2206123SC Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 Mobile os/android model/2206123SC build/8020300 osVer/12 sdkInt/32 network/2 BiliApp/8020300 mobi_app/android channel/yingyongbao Buvid/XU4C85241BF18FBC9C5C20CA1D08F38937711 sessionID/94944b0b innerVer/8020300 c_locale/zh_CN s_locale/zh_CN disable_rcmd/0 8.2.0 os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      host: "www.bilibili.com",
      cookie: `SESSDATA=${SESSDATA}`
    }

    const response = await fetch(explog2ApiUrl, {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请稍后再试或联系支持人员")
  }
})

// 用户经验
proxyRouter.get("/exp_log", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA || req.query.sessdata

    if (!SESSDATA) {
      return res.status(400).send("缺少必要的参数（SESSDATA）")
    }
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; 2206123SC Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 Mobile os/android model/2206123SC build/8020300 osVer/12 sdkInt/32 network/2 BiliApp/8020300 mobi_app/android channel/yingyongbao Buvid/XU4C85241BF18FBC9C5C20CA1D08F38937711 sessionID/94944b0b innerVer/8020300 c_locale/zh_CN s_locale/zh_CN disable_rcmd/0 8.2.0 os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "www.bilibili.com",
      cookie: `access_token=84227871; SESSDATA=${SESSDATA}`
    }

    const response = await fetch(explogApiUrl, {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 空间举办
proxyRouter.get("/sp_report", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const csrf = req.query.csrf
    const reason = req.query.reason
    const reason_v2 = req.query.reason_v2
    const mid = req.query.mid

    if (!accessKey || !reason_v2 || !reason || !csrf || !mid) {
      return res
        .status(400)
        .send(
          "缺少必要的参数（accesskey 、csrf 、reason_v2(只能为 1 - 6 数字) 、 reason(只能为 1 - 3 数字，可以多选：1,2) 或 mid）"
        )
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      appkey: appKey,
      csrf,
      disable_rcmd: 0,
      mid,
      mobi_app: "android",
      platform: "android",
      reason,
      reason_v2,
      statistics: JSON.stringify({
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      }),
      ts
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; 2206123SC Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 Mobile os/android model/2206123SC build/8020300 osVer/12 sdkInt/32 network/2 BiliApp/8020300 mobi_app/android channel/yingyongbao Buvid/XU4C85241BF18FBC9C5C20CA1D08F38937711 sessionID/94944b0b innerVer/8020300 c_locale/zh_CN s_locale/zh_CN disable_rcmd/0 8.2.0 os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(spacerepApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 批量获取用户信息
proxyRouter.get("/userinfo", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const mid = req.query.mid
    if (!accessKey || !mid) {
      return res.status(400).send("缺少必要的参数（ accesskey 或 mid(多个mid通过英文逗号隔开)）")
    }

    const params = {
      _device: "android",
      _hwid: "e0l9GCEVJB15HSUTIUN1RQVLH1d6O3VFdQ",
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      src: "yingyongbao",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      style: "16",
      trace_id: "20250203224200010",
      ts: Math.floor(Date.now() / 1000),
      uids: mid,
      version: "8.2.0.8020300"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(userinfoApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})
// 直播间点赞
proxyRouter.get("/livelike", async (req, res) => {
  try {
    const { accesskey, roomid, upid, uid } = req.query
    const click = req.query.click || "10"

    if (!accesskey || !roomid || !upid || !click || !uid) {
      return res.status(400).send("缺少必要的参数（accesskey、upid、click、uid或roomid）")
    }

    const params = {
      access_key: accesskey,
      actionKey: "appkey",
      anchor_id: upid,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      click_time: click,
      device: "android",
      disable_rcmd: "0",
      mobi_app: "android",
      platform: "android",
      room_id: roomid,
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      uid,
      version: "8.2.0"
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      "x-bili-aurora-eid": "UlEFQFcADlMOVENQV1IARA==",
      "x-bili-trace-id": "5912ba8891393cb9f94da97fce67b75d:f94da97fce67b75d:0:0",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const apiUrl = livelikeApiUrl
    const body = new URLSearchParams(params).toString()

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 1514664085 进行解决")
  }
})

// 直播间弹幕
proxyRouter.get("/livedamu", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "123456"
    const roomid = req.query.roomid
    if (!accessKey || !roomid) {
      return res.status(400).send("缺少必要的参数（ accesskey 或 roomid）")
    }

    const params = {
      access_key: accessKey,
      actionKey: "appkey",
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      device: "android",
      disable_rcmd: "0",
      mobi_app: "android",
      platform: "android",
      room_id: roomid,
      room_type: "0",
      s_locale: "zh_CN",
      scene: "0",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      version: "8.2.0"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(livedamuApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 直播间在线观众
proxyRouter.get("/liverank", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "123456"
    const roomid = req.query.roomid
    const upid = req.query.upid
    if (!accessKey || !roomid || !upid) {
      return res.status(400).send("缺少必要的参数（ accesskey 、roomid 或 upid）")
    }

    const params = {
      access_key: accessKey,
      actionKey: "appkey",
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      device: "android",
      disable_rcmd: "0",
      mobi_app: "android",
      platform: "android",
      room_id: roomid,
      ruid: upid,
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      switch: "contribution_rank",
      ts: "1738589619",
      type: "online_rank",
      version: "8.2.0"
    }
    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(liverankApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// app端个人信息
proxyRouter.get("/myinfo2", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    if (!accessKey) {
      return res.status(400).send("缺少必要的参数（accesskey(可选)）")
    }
    const params = {
      access_key: accessKey,
      appkey: "783bbb7264451d82",
      build: "8020300",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      local_id: "XU4C85241BF18FBC9C5C20CA1D08F38937711",
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000)
    }

    params.sign = appSign(params, "783bbb7264451d82", "2653583c8873dea268ab9386918b1d65")
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(info2ApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 每周必看完整版
proxyRouter.get("/act_1", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    if (!accessKey) {
      return res.status(400).send("缺少必要的参数（accesskey(可选)）")
    }
    const params = {
      access_key: accessKey,
      activity_from: "",
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      current_tab: "",
      disable_rcmd: "0",
      dynamic_id: "",
      fnval: "912",
      fnver: "0",
      force_host: "0",
      fourk: "1",
      from_spmid: "dynamic.activity.0.0",
      https_url_req: "0",
      memory: "4019",
      mobi_app: "android",
      offset: "0",
      page_id: "337",
      platform: "android",
      player_net: "1",
      qn: "32",
      qn_policy: "1",
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      tab_id: "0",
      tab_module_id: "0",
      ts: Math.floor(Date.now() / 1000),
      voice_balance: "1"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(activeApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 首页直播间推荐
proxyRouter.get("/livefeed", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    if (!accessKey) {
      return res.status(400).send("缺少必要的参数（ accesskey ）")
    }

    const params = {
      access_key: accessKey,
      actionKey: "appkey",
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      device: "android",
      device_name: "2206123SC",
      disable_rcmd: "0",
      https_url_req: "0",
      is_refresh: "0",
      login_event: "1",
      mobi_app: "android",
      module_select: "0",
      network: "wifi",
      out_ad_name: "",
      page: "1",
      platform: "android",
      qn: "0",
      relation_page: "1",
      s_locale: "zh_CN",
      scale: "hdpi",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      version: "8.2.0"
    }
    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(livefeedApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 收货地址
proxyRouter.get("/lists", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA || req.query.sessdata
    if (!SESSDATA) {
      return res.status(400).send("缺少必要的参数（ SESSDATA ）")
    }

    const params = {
      ts: Math.floor(Date.now())
    }
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; 2206123SC Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 BiliApp/8020300 mobi_app/android isNotchWindow/0 NotchHeight=24 mallVersion/8020300 mVersion/263 disable_rcmd/0",
      Cookie: `SESSDATA=${SESSDATA}`,
      Referer: "https://mall.bilibili.com/",
      Origin: "https://mall.bilibili.com",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "X-Requested-With": "tv.danmaku.bili",
      Accept: "*/*",
      Host: "show.bilibili.com",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(list2ApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 评论区
proxyRouter.get("/reply2", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    const type = req.query.type || "1"
    const id = req.query.id
    const pn = req.query.pn || "1"
    const ps = req.query.ps || "10"
    if (!accessKey || !type || !id) {
      return res
        .status(400)
        .send(
          "缺少必要的参数（ accesskey、pn(默认1)、ps(默认10)、id 或 type(默认1详情参见https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/comment/readme.md#评论区类型代码) ）"
        )
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      disable_rcmd: "0",
      mobi_app: "android",
      nohot: "1",
      oid: id,
      platform: "android",
      pn,
      ps,
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      type,
      web_location: "333.923"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(reply2ApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 直播间ws地址
proxyRouter.get("/livewsinfo", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const roomid = req.query.roomid
    if (!accessKey || !roomid) {
      return res.status(400).send("缺少必要的参数（ accesskey 、roomid）")
    }

    const params = {
      access_key: accessKey,
      actionKey: "appkey",
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      device: "android",
      disable_rcmd: 0,
      free_type: 0,
      is_anchor: "false",
      mobi_app: "android",
      platform: "android",
      room_id: roomid,
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      version: "8.2.0"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(
      "https://api.live.bilibili.com/xlive/app-room/v1/index/getDanmuInfo" + "?" + new URLSearchParams(params),
      {
        method: "GET",
        headers
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 1514664085 进行解决")
  }
})

// 首页短视频推荐
proxyRouter.get("/feed2", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    if (!accessKey) {
      return res.status(400).send("缺少必要的参数（ accesskey ）")
    }

    const params = {
      access_key: accessKey,
      aid: "",
      appkey: appKey,
      auto_play: "0",
      build: "8020300",
      bvid: "",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      cid: "",
      contain: "false",
      creative_id: "0",
      device_name: "2206123SC",
      disable_rcmd: "0",
      display_id: "1",
      epid: "0",
      feed_status: "0",
      fnval: "912",
      fnver: "0",
      force_host: "0",
      fourk: "1",
      from: "6",
      from_spmid: "main.homepage.avatar.0",
      goto: "",
      mobi_app: "android",
      network: "wifi",
      ogv_style: "0",
      platform: "android",
      player_net: "1",
      pull: "1",
      qn: "32",
      request_from: "1",
      s_locale: "zh_CN",
      spmid: "main.switch-mode.story.0",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      story_param: "",
      trackid: "",
      ts: Math.floor(Date.now() / 1000),
      video_mode: "1",
      voice_balance: "1"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(feed2ApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 首页推荐
proxyRouter.get("/feed", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    if (!accessKey) {
      return res.status(400).send("缺少必要的参数（ accesskey ）")
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      auto_refresh_state: "1",
      autoplay_card: "11",
      autoplay_timestamp: "0",
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      column: "2",
      column_timestamp: "1737453599",
      device_name: "2206123SC",
      device_type: "0",
      disable_rcmd: "0",
      flush: "0",
      fnval: "912",
      fnver: "0",
      force_host: "0",
      fourk: "1",
      guidance: "0",
      https_url_req: "0",
      idx: "0",
      inline_danmu: "2",
      inline_sound: "1",
      inline_sound_cold_state: "2",
      interest_id: "0",
      login_event: "2",
      mobi_app: "android",
      network: "wifi",
      open_event: "cold",
      platform: "android",
      player_net: "1",
      pull: "true",
      qn: "32",
      qn_policy: "1",
      recsys_mode: "0",
      s_locale: "zh_CN",
      splash_id: "",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      video_mode: "1",
      voice_balance: "1"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(feedApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 排行榜
proxyRouter.get("/rank", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    const type = req.query.type
    if (!type) {
      return res
        .status(400)
        .send(
          "缺少必要的参数（ accesskey(可选) 或 type(其中 1为番剧; 2为电影; 3为纪录片; 4为国创; 5为电视剧; 7为....) ）"
        )
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      season_type: type,
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      style_id: "0",
      ts: Math.floor(Date.now() / 1000)
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(rankApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 每周必看
proxyRouter.get("/inline", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      fnval: "912",
      fnver: "0",
      force_host: "0",
      fourk: "1",
      https_url_req: "0",
      memory: "4046",
      mobi_app: "android",
      page_id: "402828",
      platform: "android",
      player_net: "1",
      qn: "32",
      qn_policy: "1",
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      voice_balance: "1"
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(inlineApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 获取指定up信息
proxyRouter.get("/space", async (req, res) => {
  try {
    const accessKey = req.query.accesskey || "12345"
    const mid = req.query.mid

    if (!mid) {
      return res.status(400).send("缺少必要的参数（accesskey(可选) 或 mid）")
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: 0,
      fnval: 912,
      fnver: 0,
      force_host: 0,
      fourk: 1,
      from: 0,
      local_time: Math.floor(Date.now() / 1000),
      mobi_app: "android",
      platform: "android",
      player_net: 1,
      qn: 32,
      qn_policy: 1,
      s_locale: "zh_CN",
      statistics: JSON.stringify({
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      }),
      ts: Math.floor(Date.now() / 1000),
      vmid: mid,
      voice_balance: 1
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(spaceApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 获取指定up收藏夹信息
proxyRouter.get("/fav_space", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const mid = req.query.mid

    if (!accessKey || !mid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 mid）")
    }

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: 0,
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      statistics: JSON.stringify({
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      }),
      ts: Math.floor(Date.now() / 1000),
      up_mid: mid
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "user-agent:Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/2206123SC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711"
    }

    const response = await fetch(fav_spaceApiUrl + "?" + new URLSearchParams(params), {
      method: "GET",
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 收藏视频
proxyRouter.get("/fav", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const aid = req.query.aid

    if (!accessKey || !aid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 aid）")
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      add_media_ids: "0",
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      del_media_ids: "",
      disable_rcmd: "0",
      extra: {
        item_id: aid,
        from_spmid: "tm.recommend.0.0",
        spmid: "main.ugc-video-detail-vertical.0.0",
        track_id: "story_20.router-story-1901288-5ccc768c7f-g48sm.1737775288293.986",
        goto: "vertical_av"
      },
      from: "",
      mobi_app: "android",
      platform: "android",
      resources: `${aid}:2`,
      s_locale: "zh_CN",
      statistics: {
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      },
      ts
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.biliapi.net",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch(favApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 刷新ck
proxyRouter.get("/refresh", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const refresh_token = req.query.refresh_token

    if (!accessKey || !refresh_token) {
      return res.status(400).send("缺少必要的参数（accesskey 或 refresh_token）")
    }

    const ts = Math.floor(Date.now() / 1000)
    const appkey2 = "783bbb7264451d82"
    const appsec2 = "2653583c8873dea268ab9386918b1d65"

    const signedParams = appSign2(
      {
        access_key: accessKey,
        refresh_token,
        ts
      },
      appkey2,
      appsec2
    )

    const headers = {
      "User-Agent":
        "Dalvik/2.1.0 (Linux; U; Android 12; 24031PN0DC Build/5fd930f.0) 8.2.0 os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2"
    }

    const response = await fetch(refreshUrl, {
      method: "POST",
      body: new URLSearchParams(signedParams),
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 发弹幕
proxyRouter.get("/danmu", async (req, res) => {
  try {
    const roomid = req.query.roomid
    const msg = req.query.msg
    const csrf = req.query.csrf
    const SESSDATA = req.query.SESSDATA
    if (!msg || !roomid || !SESSDATA || !csrf) {
      return res.status(400).send("缺少必要的参数（csrf, roomid, SESSDATA 或 msg）")
    }

    const params = {
      color: 16777215,
      fontsize: 25,
      mode: 1,
      msg: msg.trim(),
      rnd: Math.floor(Date.now() / 1000),
      roomid,
      bubble: 0,
      csrf_token: csrf,
      csrf
    }

    //  params.sign = appSign(params, appKey, appSecret);
    const headers = {
      "User-Agent":
        "Dalvik/2.1.0 (Linux; U; Android 12; 24031PN0DC Build/5fd930f.0) 8.2.0 os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `SESSDATA=${SESSDATA}`
    }

    const response = await fetch(danmuApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 点踩
proxyRouter.get("/dislike", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const aid = req.query.aid

    if (!accessKey || !aid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 aid）")
    }

    const ts = Math.floor(Date.now() / 1000)
    const params = {
      access_key: accessKey,
      aid,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      dislike: "0",
      from: "7",
      from_spmid: "tm.recommend.0.0",
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      spmid: "united.player-video-detail.0.0",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "Dalvik/2.1.0 (Linux; U; Android 12; 24031PN0DC Build/5fd930f.0) 8.2.0 os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch(dislikeApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 评论
proxyRouter.get("/reply", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const aid = req.query.aid
    const msg = req.query.msg
    if (!accessKey || !aid || !msg) {
      return res.status(400).send("缺少必要的参数（accesskey, msg 或 aid）")
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      from_spmid: "tm.recommend.0.0",
      goto: "vertical_av",
      has_vote_option: "false",
      message: msg,
      mobi_app: "android",
      oid: aid,
      ordering: "heat",
      plat: "2",
      platform: "android",
      s_locale: "zh_CN",
      scene: "main",
      spmid: "main.ugc-video-detail-vertical.0.0",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      sync_to_dynamic: "false",
      track_id: "all_49.router-pegasus-1914948-cd87cf9bc-rhz8m.1737638175528.728",
      ts,
      type: "1"
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      Host: "api.bilibili.com",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711",
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/NTH-AN00 mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      session_id: "12934079",
      guestid: "24145498840755"
    }

    const response = await fetch(replyApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 一键三连
proxyRouter.get("/triple", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const aid = req.query.aid

    if (!accessKey || !aid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 aid）")
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      aid,
      appkey: appKey,
      build: 8020300,
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: 0,
      from: 7,
      from_spmid: "tm.recommend.0.0",
      goto: "vertical_av",
      mobi_app: "android",
      platform: "android",
      s_locale: "zh_CN",
      source: "view_vvoucher",
      spmid: "main.ugc-video-detail-vertical.0.0",
      statistics: JSON.stringify({
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      }),
      token: "",
      track_id: "all_49.router-pegasus-1914948-cd87cf9bc-rhz8m.1737638175528.728",
      ts
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch(tripleUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 喜欢/取消 点赞
proxyRouter.get("/like", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const like = req.query.like
    const aid = req.query.aid

    if (!accessKey || !aid || !like) {
      return res.status(400).send("缺少必要的参数（accesskey 、 aid 或 like）")
    }

    if (!["0", "1"].includes(like)) {
      return res.status(400).send("无效的like参数，只能为0或1,其中0为点赞，1为取消点赞")
    }

    const params = {
      access_key: accessKey,
      aid,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      from: "7",
      from_spmid: "tm.recommend.0.0",
      goto: "vertical_av",
      like,
      mobi_app: "android",
      ogv_type: "0",
      platform: "android",
      s_locale: "zh_CN",
      source: "view_vvoucher",
      spmid: "main.ugc-video-detail-vertical.0.0",
      statistics: JSON.stringify({
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      }),
      token: "",
      track_id: "all_49.router-pegasus-1914948-cd87cf9bc-xvjrp.1737546540957.109",
      ts: Math.floor(Date.now() / 1000)
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      "User-Agent":
        "Dalvik/2.1.0 (Linux; U; Android 12; 24031PN0DC Build/5fd930f.0) 8.2.0 os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch(likeApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 通过直播间关注主播
proxyRouter.get("/livefocus", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const roomid = req.query.roomid
    if (!accessKey || !roomid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 roomid）")
    }

    const params2 = {
      access_key: accessKey,
      actionKey: "appkey",
      appkey: appKey,
      build: "7750600",
      c_locale: "zh_CN",
      channel: "master",
      device: "android",
      disable_rcmd: "0",
      interact_type: "2",
      mobi_app: "android_i",
      platform: "android",
      roomid,
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      version: "8.2.0"
    }
    params2.sign = appSign(params2, appKey, appSecret)
    const headers = {
      Host: "api.live.bilibili.com",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711",
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/NTH-AN00 mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "e16983bccc666a198e784932fb44b81a20250223145458e4737e7fb5ed4bee29",
      fp_remote: "e16983bccc666a198e784932fb44b81a20250223145458e4737e7fb5ed4bee29"
    }

    const response2 = await fetch("https://api.live.bilibili.com/xlive/app-room/v1/index/TrigerInteract", {
      method: "POST",
      headers,
      body: new URLSearchParams(params2).toString()
    })
    if (!response2.ok) {
      throw new Error(`HTTP error! Status: ${response2.status}`)
    }
    const responseData2 = await response2.json()
    const mergedResponse = responseData2
    res.json(mergedResponse)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 1514664085 进行解决")
  }
})

// 直播间分享
proxyRouter.get("/liveshare", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const roomid = req.query.roomid
    if (!accessKey || !roomid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 roomid）")
    }

    const params2 = {
      access_key: accessKey,
      actionKey: "appkey",
      appkey: appKey,
      build: "7750600",
      c_locale: "zh_CN",
      channel: "master",
      device: "android",
      disable_rcmd: "0",
      interact_type: "3",
      mobi_app: "android_i",
      platform: "android",
      roomid,
      s_locale: "zh_CN",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      ts: Math.floor(Date.now() / 1000),
      version: "8.2.0"
    }
    params2.sign = appSign(params2, appKey, appSecret)
    const headers = {
      Host: "api.live.bilibili.com",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711",
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/NTH-AN00 mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "e16983bccc666a198e784932fb44b81a20250223145458e4737e7fb5ed4bee29",
      fp_remote: "e16983bccc666a198e784932fb44b81a20250223145458e4737e7fb5ed4bee29"
    }

    const response2 = await fetch("https://api.live.bilibili.com/xlive/app-room/v1/index/TrigerInteract", {
      method: "POST",
      headers,
      body: new URLSearchParams(params2).toString()
    })
    if (!response2.ok) {
      throw new Error(`HTTP error! Status: ${response2.status}`)
    }
    const responseData2 = await response2.json()
    const mergedResponse = responseData2
    res.json(mergedResponse)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 1514664085 进行解决")
  }
})

// 分享视频
proxyRouter.get("/share", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const aid = req.query.aid
    if (!accessKey || !aid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 aid）")
    }

    const params2 = {
      access_key: accessKey,
      appkey: appKey,
      build: "8020300",
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: "0",
      from_spmid: "tm.recommend.0.0",
      mobi_app: "android",
      object_extra_fields:
        '{"goto":"vertical_av","track_id":"all_49.router-pegasus-1914948-cd87cf9bc-rhz8m.1737638175528.728"}',
      oid: aid,
      panel_type: "1",
      platform: "android",
      s_locale: "zh_CN",
      share_channel: "biliIm",
      share_id: "main.ugc-video-detail-vertical.0.0.pv",
      share_origin: "story",
      share_session_id: "d4a6cffa-4988-4078-b2b9-b6ec5b2c6177",
      sid: "27882881279",
      spm_id: "main.ugc-video-detail-vertical.0.0",
      statistics: '{"appId":1,"platform":3,"version":"8.2.0","abtest":""}',
      success: "true",
      ts: Math.floor(Date.now() / 1000)
    }
    params2.sign = appSign(params2, appKey, appSecret)
    const headers = {
      Host: "api.bilibili.com",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711",
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/NTH-AN00 mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      "Content-Type": "application/x-www-form-urlencoded",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      session_id: "3d5cec47",
      guestid: "24145498840755"
    }

    const response2 = await fetch(shareApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params2).toString()
    })
    if (!response2.ok) {
      throw new Error(`HTTP error! Status: ${response2.status}`)
    }
    const responseData2 = await response2.json()
    const mergedResponse = responseData2
    res.json(mergedResponse)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 上报视频观看进度
proxyRouter.all("/report", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA
    const aid = req.query.aid
    const cid = req.query.cid
    const csrf = req.query.csrf
    const time = req.query.time || "90"
    if (!SESSDATA || !aid || !cid || !csrf) {
      return res.status(400).send("缺少必要的参数（SESSDATA 、cid 、csrf、time 或 aid）")
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `SESSDATA=${SESSDATA}`,
      Accept: "*/*",
      Connection: "keep-alive"
    }

    const body = new URLSearchParams({
      aid: String(aid),
      cid: String(cid),
      progress: time,
      csrf
    })
    const response = await fetch(reportApiUrl, {
      method: "POST",
      headers,
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 投币
proxyRouter.get("/addcoin", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const aid = req.query.aid
    const multiply = req.query.coin
    const selectLike = req.query.like || "1" // 默认为1 同时点赞

    if (!accessKey || !aid || !multiply) {
      return res.status(400).send("缺少必要的参数（accesskey, aid, like 或 coin）")
    }

    if (!["1", "2"].includes(multiply)) {
      return res.status(400).send("无效的coin参数，只能为1或2")
    }

    if (selectLike && !["0", "1"].includes(selectLike)) {
      return res.status(400).send("无效的like参数，只能为0或1，其中1为同时点赞，0为不点赞")
    }

    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      aid,
      appkey: appKey,
      avtype: 1,
      build: 8020300,
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: 0,
      from: 7,
      from_spmid: "tm.recommend.0.0",
      goto: "vertical_av",
      mobi_app: "android",
      multiply,
      platform: "android",
      s_locale: "zh_CN",
      select_like: selectLike,
      source: "",
      spmid: "main.ugc-video-detail-vertical.0.0",
      statistics: JSON.stringify({
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      }),
      token: "",
      track_id: "all_49.router-pegasus-1914948-cd87cf9bc-xvjrp.1737546540957.109",
      ts,
      upid: 0
    }

    params.sign = appSign(params, appKey, appSecret)

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "app.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch(addCoinApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 取消收藏
proxyRouter.get("/unfav", async (req, res) => {
  try {
    const accessKey = req.query.accesskey
    const rid = req.query.aid
    if (!accessKey || !rid) {
      return res.status(400).send("缺少必要的参数（accesskey 或 aid）")
    }
    const ts = Math.floor(Date.now() / 1000)

    const params = {
      access_key: accessKey,
      appkey: appKey,
      build: 8020300,
      c_locale: "zh_CN",
      channel: "yingyongbao",
      disable_rcmd: 0,
      mobi_app: "android",
      platform: "android",
      rid,
      s_locale: "zh_CN",
      statistics: JSON.stringify({
        appId: 1,
        platform: 3,
        version: "8.2.0",
        abtest: ""
      }),
      ts,
      type: 2
    }

    params.sign = appSign(params, appKey, appSecret)
    const headers = {
      Host: "api.bilibili.com",
      buvid: "XU4C85241BF18FBC9C5C20CA1D08F38937711",
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      fp_local: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      fp_remote: "ce14fc8255de098acb8c4f83e245543820250121175935cc89db065489232e72",
      session_id: "677a70ff",
      guestid: "24145498840755",
      "x-bili-aurora-eid": "UFYCRFUNAlEGWA==",
      "Content-Type": "application/x-www-form-urlencoded"
    }

    const response = await fetch(unfavApiUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 大会员经验
proxyRouter.all("/experience", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA
    const csrf = req.query.csrf
    if (!SESSDATA || !csrf) {
      return res.status(400).send("缺少必要的参数（SESSDATA 或 csrf）")
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `SESSDATA=${SESSDATA}`,
      Accept: "*/*",
      Connection: "keep-alive"
    }

    const body = new URLSearchParams({
      csrf
    })
    const response = await fetch(experienceApiUrl, {
      method: "POST",
      headers,
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 卡券
proxyRouter.all("/kaquan", async (req, res) => {
  try {
    const csrf = req.query.csrf
    const SESSDATA = req.query.SESSDATA
    const type = req.query.type
    if (!SESSDATA || !type || !csrf) {
      return res.status(400).send("缺少必要的参数（SESSDATA 或 csrf 或 type）")
    }
    // if (!['1', '2', '3', '4', '5', '6', '7'].includes(type)) {
    //     return res.status(400).send('无效的type参数，只能为1到7');
    // }
    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `SESSDATA=${SESSDATA}`,
      Accept: "*/*",
      Connection: "keep-alive"
    }

    const body = new URLSearchParams({
      type: String(type),
      csrf
    })
    const response = await fetch(privUrl, {
      method: "POST",
      headers,
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 漫画签到
proxyRouter.all("/manhuasign", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA
    if (!SESSDATA) {
      return res.status(400).send("缺少必要的参数（SESSDATA）")
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `SESSDATA=${SESSDATA}`,
      Accept: "*/*",
      Connection: "keep-alive"
    }

    const body = new URLSearchParams({
      platform: "android"
    })
    const response = await fetch(mangaClockInUrl, {
      method: "POST",
      headers,
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 漫画分享
proxyRouter.all("/manhuashare", async (req, res) => {
  try {
    const SESSDATA = req.query.SESSDATA
    if (!SESSDATA) {
      return res.status(400).send("缺少必要的参数（SESSDATA）")
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 BiliDroid/8.2.0 (bbcallen@gmail.com) os/android model/24031PN0DC mobi_app/android build/8020300 channel/yingyongbao innerVer/8020300 osVer/12 network/2",
      Host: "api.bilibili.com",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `SESSDATA=${SESSDATA}`,
      Accept: "*/*",
      Connection: "keep-alive"
    }

    const body = new URLSearchParams({
      platform: "android"
    })
    const response = await fetch(mangaShareUrl, {
      method: "POST",
      headers,
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const responseData = await response.json()
    res.json(responseData)
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 获取id
proxyRouter.get("/getid", async (req, res) => {
  try {
    const inputUrl = req.query.url
    if (!inputUrl) {
      return res.status(400).json({
        code: 400,
        message: "请提供 B 站视频链接或者 BV 号"
      })
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9",
      Referer: "https://www.bilibili.com/"
    }

    let url = inputUrl
    if (url.startsWith("BV")) {
      url = `https://www.bilibili.com/video/${url}`
    }

    async function getRealUrl(url, headers) {
      const response = await fetch(url, {
        method: "GET",
        headers,
        redirect: "manual"
      })
      if (response.status === 302) {
        return response.headers.get("location")
      }
      return url
    }

    const realUrl = await getRealUrl(url, headers)
    const response = await fetch(realUrl, { headers })
    if (!response.ok) {
      throw new Error(`请求失败，状态码: ${response.status}`)
    }
    const htmlContent = await response.text()

    const aidPattern = /"aid":(\d+)/
    const aidMatch = htmlContent.match(aidPattern)
    const aid = aidMatch ? aidMatch[1] : null

    const cidPattern = /"cid":(\d+)/
    const cidMatch = htmlContent.match(cidPattern)
    const cid = cidMatch ? cidMatch[1] : null

    const bvidPattern = /"bvid":"([^"]+)"/
    const bvidMatch = htmlContent.match(bvidPattern)
    const bvid = bvidMatch ? bvidMatch[1] : null

    const midPattern = /"mid":(\d+)/
    const midMatch = htmlContent.match(midPattern)
    const mid = midMatch ? midMatch[1] : null

    if (aid || cid || bvid || mid) {
      return res.status(200).json({
        code: 0,
        message: "成功获取关键 ID",
        data: {
          aid,
          cid,
          bvid,
          mid
        }
      })
    } else {
      return res.status(500).json({
        code: -1,
        message: "未找到关键 ID"
      })
    }
  } catch (error) {
    console.error("请求出错:", error)
    return res.status(500).json({
      code: 114514,
      message: "请求出错，请稍后重试"
    })
  }
})

// 访问统计
proxyRouter.get("/total", (req, res) => {
  try {
    const data = fs.readFileSync(dataFilePath, "utf-8")
    const stats = JSON.parse(data)
    res.json(stats)
  } catch (error) {
    console.error("无法读取数据文件", error)
    res.status(500).send({ error: "无法读取访问统计数据" })
  }
})

// 收集卡
proxyRouter.get("/QQdaily", async (req, res) => {
  try {
    const uin = req.query.uin
    const skey = req.query.skey
    const p_skey = req.query.pskey
    if (!uin || !skey || !p_skey) {
      return res.status(400).send("缺少必要的参数（uin、skey或pskey）")
    }
    const bknValue = bkn(skey)
    const base_url = `https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignInMainPage?bkn=${bknValue}`
    const data = JSON.stringify({
      uin: `${uin}`,
      QYY: "2",
      qua: "V1_AND_SQ_9.1.31_8542_YYB_D",
      loc: {},
      mpExtend: {
        tianshuAdsReq: '{"app":"QQ","os":"Android","version":"9.1.31","imei":""}'
      }
    })

    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; AOSP Build/SQ1A.220205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 V1_AND_SQ_9.1.31_8542_YYB_D QQ/9.1.31.22255 NetType/WIFI WebP/0.4.1 AppId/537262754 Pixel/1600 StatusBarHeight/36 SimpleUISwitch/0 QQTheme/1000 StudyMode/0 CurrentMode/0 CurrentFontScale/1.0 GlobalDensityScale/1.0 AllowLandscape/true InMagicWin/0",
      "X-Requested-With": "com.tencent.mobileqq",
      "Content-Length": data.length.toString(),
      Referer: "https://ti.qq.com/signin/public/index.html",
      Host: "ti.qq.com",
      Origin: "https://ti.qq.com"
    })

    const cookieUin = uin.startsWith("o") ? uin : `o${uin}`
    headers.set("Cookie", `uin=${cookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${cookieUin}`)
    const options = {
      method: "POST",
      headers,
      body: data
    }
    const response = await fetch(base_url, options)
    const result = await response.json()
    if (response.status !== 200) {
      return res.status(response.status).send(result)
    }
    const vecSignInfo = result.data.vecSignInfo.value
    const target = vecSignInfo.find((item) => item.type === 4)
    if (!target) {
      return res.status(404).send({ error: "SubType not found" })
    }
    const subType = target.subType
    const signInUrl = "https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignIn"
    const postData = JSON.stringify({
      uin: `${uin}`,
      type: "4",
      subType: `${subType}`,
      qua: "V1_AND_SQ_9.1.31_8542_YYB_D"
    })

    const signInHeaders = new Headers({
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; AOSP Build/SQ1A.220205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 V1_AND_SQ_9.1.31_8542_YYB_D QQ/9.1.31.22255 NetType/WIFI WebP/0.4.1 AppId/537262754 Pixel/1600 StatusBarHeight/36 SimpleUISwitch/0 QQTheme/1000 StudyMode/0 CurrentMode/0 CurrentFontScale/1.0 GlobalDensityScale/1.0 AllowLandscape/true InMagicWin/0"
    })

    const signInCookieUin = uin.startsWith("o") ? uin.slice(1) : uin
    signInHeaders.set("Cookie", `uin=${signInCookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${signInCookieUin}`)

    const signInOptions = {
      method: "POST",
      headers: signInHeaders,
      body: postData
    }

    const signInResponse = await fetch(signInUrl, signInOptions)
    const signInResult = await signInResponse.json()

    if (signInResult.ret === 0 && signInResult.msg === "success!") {
      return res.json({
        code: 0,
        uin,
        msg: `${uin} 日签卡收集卡签到成功`
      })
    } else {
      return res.json(signInResult)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 日签卡
proxyRouter.get("/QQdaily2", async (req, res) => {
  try {
    const uin = req.query.uin
    const skey = req.query.skey
    const p_skey = req.query.pskey
    if (!uin || !skey || !p_skey) {
      return res.status(400).send("缺少必要的参数（uin、skey或pskey）")
    }

    const signInUrl = "https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignIn"
    const postData = JSON.stringify({
      uin: `${uin}`,
      type: "1",
      qua: "V1_AND_SQ_9.1.31_8542_YYB_D",
      mpExtend: {
        tianshuAdsReq: '{"app":"QQ","os":"Android","version":"9.1.31","imei":""}'
      }
    })

    const signInHeaders = new Headers({
      "Content-Type": "application/json",
      "Content-Length": postData.length.toString(),
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; AOSP Build/SQ1A.220205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 V1_AND_SQ_9.1.31_8542_YYB_D QQ/9.1.31.22255 NetType/WIFI WebP/0.4.1 AppId/537262754 Pixel/1600 StatusBarHeight/36 SimpleUISwitch/0 QQTheme/1000 StudyMode/0 CurrentMode/0 CurrentFontScale/1.0 GlobalDensityScale/1.0 AllowLandscape/true InMagicWin/0"
    })

    const signInCookieUin = uin.startsWith("o") ? uin.slice(1) : uin
    signInHeaders.set("Cookie", `uin=${signInCookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${signInCookieUin}`)

    const signInOptions = {
      method: "POST",
      headers: signInHeaders,
      body: postData
    }

    const signInResponse = await fetch(signInUrl, signInOptions)
    const signInResult = await signInResponse.json()

    if (signInResult.ret === 0 && signInResult.msg === "success!") {
      return res.json({
        code: 0,
        uin,
        msg: `${uin} 日签卡签到成功`
      })
    } else {
      return res.json(signInResult)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 晚安卡
proxyRouter.get("/QQdaily3", async (req, res) => {
  try {
    const uin = req.query.uin
    const skey = req.query.skey
    const p_skey = req.query.pskey
    if (!uin || !skey || !p_skey) {
      return res.status(400).send("缺少必要的参数（uin、skey或pskey）")
    }

    const signInUrl = "https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignIn"
    const postData = JSON.stringify({
      uin: `${uin}`,
      type: "2",
      qua: "V1_AND_SQ_9.1.31_8542_YYB_D",
      mpExtend: {
        tianshuAdsReq: '{"app":"QQ","os":"Android","version":"9.1.31","imei":""}'
      }
    })

    const signInHeaders = new Headers({
      "Content-Type": "application/json",
      "Content-Length": postData.length.toString(),
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; AOSP Build/SQ1A.220205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 V1_AND_SQ_9.1.31_8542_YYB_D QQ/9.1.31.22255 NetType/WIFI WebP/0.4.1 AppId/537262754 Pixel/1600 StatusBarHeight/36 SimpleUISwitch/0 QQTheme/1000 StudyMode/0 CurrentMode/0 CurrentFontScale/1.0 GlobalDensityScale/1.0 AllowLandscape/true InMagicWin/0"
    })

    const signInCookieUin = uin.startsWith("o") ? uin.slice(1) : uin
    signInHeaders.set("Cookie", `uin=${signInCookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${signInCookieUin}`)

    const signInOptions = {
      method: "POST",
      headers: signInHeaders,
      body: postData
    }

    const signInResponse = await fetch(signInUrl, signInOptions)
    const signInResult = await signInResponse.json()

    if (signInResult.ret === 0 && signInResult.msg === "success!") {
      return res.json({
        code: 0,
        uin,
        msg: `${uin} 晚安卡签到成功`
      })
    } else {
      return res.json(signInResult)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 每日Q崽
proxyRouter.get("/QQdaily4", async (req, res) => {
  try {
    const uin = req.query.uin
    const skey = req.query.skey
    const p_skey = req.query.pskey
    if (!uin || !skey || !p_skey) {
      return res.status(400).send("缺少必要的参数（uin、skey或pskey）")
    }

    const bknValue = bkn(skey)
    const signInUrl = `https://ti.qq.com/qbox/trpc/SignIn?bkn=${bknValue}`

    const signInHeaders = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; AOSP Build/SQ1A.220205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 V1_AND_SQ_9.1.31_8542_YYB_D QQ/9.1.31.22255 NetType/WIFI WebP/0.4.1 AppId/537262754 Pixel/1600 StatusBarHeight/36 SimpleUISwitch/0 QQTheme/1000 StudyMode/0 CurrentMode/0 CurrentFontScale/1.0 GlobalDensityScale/1.0 AllowLandscape/true InMagicWin/0"
    })

    const signInCookieUin = uin.startsWith("o") ? uin.slice(1) : uin
    signInHeaders.set("Cookie", `uin=${signInCookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${signInCookieUin}`)

    const signInOptions = {
      method: "GET",
      headers: signInHeaders
    }

    const signInResponse = await fetch(signInUrl, signInOptions)
    const signInResult = await signInResponse.json()

    if (signInResult.errcode === 0) {
      return res.json({
        code: 0,
        uin,
        msg: `${uin} 每日Q崽签到成功:${signInResult.data.wording} `
      })
    } else {
      return res.json(signInResult)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 心事罐
proxyRouter.get("/QQdaily5", async (req, res) => {
  try {
    const uin = req.query.uin
    const skey = req.query.skey
    const p_skey = req.query.pskey
    if (!uin || !skey || !p_skey) {
      return res.status(400).send("缺少必要的参数（uin、skey或pskey）")
    }
    const bknValue = bkn(skey)
    const signInUrl = `https://ti.qq.com/qqsignin/mindjar/trpc/WriteMindJar?bkn=${bknValue}`

    const signInHeaders = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; AOSP Build/SQ1A.220205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 V1_AND_SQ_9.1.31_8542_YYB_D QQ/9.1.31.22255 NetType/WIFI WebP/0.4.1 AppId/537262754 Pixel/1600 StatusBarHeight/36 SimpleUISwitch/0 QQTheme/1000 StudyMode/0 CurrentMode/0 CurrentFontScale/1.0 GlobalDensityScale/1.0 AllowLandscape/true InMagicWin/0"
    })

    const signInCookieUin = uin.startsWith("o") ? uin.slice(1) : uin
    signInHeaders.set("Cookie", `uin=${signInCookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${signInCookieUin}`)

    const signInOptions = {
      method: "GET",
      headers: signInHeaders
    }

    const signInResponse = await fetch(signInUrl, signInOptions)
    const signInResult = await signInResponse.json()

    if (signInResult.errcode === 0) {
      return res.json({
        code: 0,
        uin,
        msg: `${uin} 心事罐签到成功`
      })
    } else {
      return res.json(signInResult)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 分享卡
proxyRouter.get("/QQshare", async (req, res) => {
  try {
    const uin = req.query.uin
    const skey = req.query.skey
    const p_skey = req.query.pskey
    const friend = req.query.friend
    if (!uin || !skey || !p_skey) {
      return res.status(400).send("缺少必要的参数（uin、skey、friend或pskey）")
    }
    const url = "https://ti.qq.com/hybrid-h5/api/json/daily_attendance/ShareFriend"
    const postData = JSON.stringify({
      friendUin: friend
    })
    const signInHeaders = new Headers({
      "Content-Type": "application/json",
      "Content-Length": postData.length.toString(),
      Accept: "application/json, text/plain, */*",
      "X-Requested-With": "com.tencent.mobileqq",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12; AOSP Build/SQ1A.220205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/101.0.4951.61 Safari/537.36 V1_AND_SQ_9.1.31_8542_YYB_D QQ/9.1.31.22255 NetType/WIFI WebP/0.4.1 AppId/537262754 Pixel/1600 StatusBarHeight/36 SimpleUISwitch/0 QQTheme/1000 StudyMode/0 CurrentMode/0 CurrentFontScale/1.0 GlobalDensityScale/1.0 AllowLandscape/true InMagicWin/0"
    })

    const signInCookieUin = uin.startsWith("o") ? uin.slice(1) : uin
    signInHeaders.set("Cookie", `uin=${signInCookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${signInCookieUin}`)

    const signInOptions = {
      method: "POST",
      headers: signInHeaders,
      body: postData
    }

    const signInResponse = await fetch(url, signInOptions)
    const signInResult = await signInResponse.json()

    if (signInResult.ret === 0) {
      return res.json({
        code: 0,
        uin,
        msg: `${uin} 向好友 ${friend} 日签卡分享成功(放心这是假分享，好友收不到但是可以增加收集卡抽取次数)`
      })
    } else {
      return res.json(signInResult)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

// 幸运字符
proxyRouter.get("/luckyword", async (req, res) => {
  try {
    const uin = req.query.uin
    const skey = req.query.skey
    const p_skey = req.query.pskey
    const group = req.query.group
    if (!uin || !skey || !p_skey || !group) {
      return res.status(400).send("缺少必要的参数（uin、skey、group或pskey）")
    }
    const bknValue = bkn(skey)
    const signInUrl = `https://qun.qq.com/v2/luckyword/proxy/domain/qun.qq.com/cgi-bin/group_lucky_word/draw_lottery?bkn=${bknValue}`
    let body = JSON.stringify({
      group_code: group
    })

    const signInHeaders = new Headers({
      "Content-Type": "application/json;charset=UTF-8",
      "qname-service": "976321:131072",
      "qname-space": "Production"
    })

    const signInCookieUin = uin.startsWith("o") ? uin.slice(1) : uin
    signInHeaders.set("Cookie", `uin=${signInCookieUin}; skey=${skey}; p_skey=${p_skey}; p_uin=${signInCookieUin}`)

    const signInOptions = {
      method: "POST",
      headers: signInHeaders,
      body
    }

    const signInResponse = await fetch(signInUrl, signInOptions)
    const responseJson = await signInResponse.json()
    if (responseJson.retcode === 0 && responseJson.data.word_info) {
      let { wording, word_desc } = responseJson.data.word_info.word_info
      return res.json({
        code: 0,
        uin,
        msg: `抽中了字符:『${wording}』 寓意为:『${word_desc}』`
      })
    } else if (responseJson.retcode === 11004) {
      return res.json({
        code: -1,
        uin,
        msg: `今日已抽过字符: ${responseJson.msg}`
      })
    } else if (responseJson.retcode !== 0) {
      return res.json({
        code: 114514,
        uin,
        msg: `抽字符时遇到错误: ${responseJson.data || responseJson.msg}`
      })
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send("未知错误，请联系 84227871 进行解决")
  }
})

const PORT = Config.Bili.Server_Port
const app = express()
app.use("/bili", proxyRouter)
if (!Array.isArray(app.quiet)) {
  app.quiet = []
}
app.quiet.push("/bili")
app.listen(PORT, () => {
  logger.mark(logger.yellow(`[B站签到api]启动成功！！！http://localhost:${PORT}`))
})
