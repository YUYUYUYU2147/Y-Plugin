/*
 * 此配置文件为系统使用，请勿修改，否则可能无法正常使用
 * */

export const helpCfg = {
  title: "Y帮助",
  subTitle: "[Y插件] Yunzai-Bot&Y-Plugin",
  colCount: 3,
  colWidth: 265,
  theme: "all",
  themeExclude: ["default"]
}

export const helpList = [
  {
    group: "功能类",
    list: [
      {
        icon: 1,
        title: "Git仓库更新推送",
        desc: "前往Guoba或插件内配置"
      },
      {
        icon: 2,
        title: "哪吒面板",
        desc: "前往Guoba或插件内配置"
      },
      {
        icon: 3,
        title: "天气",
        desc: "前往Guoba或插件内配置"
      },
      {
        icon: 32,
        title: "#Y版本",
        desc: "查看当前插件版本"
      }
    ]
  },
  {
    group: "给主人带话",
    list: [
      {
        icon: 4,
        title: "#联系主人",
        desc: "给主人带句话"
      },
      {
        icon: 5,
        title: "#联系回复",
        desc: "主人回复群友的消息"
      }
    ]
  },
  {
    group: "图片外显",
    auth: "master",
    list: [
      {
        icon: 6,
        title: "#开启/关闭图片外显",
        desc: "开关外显功能"
      },
      {
        icon: 7,
        title: "#设置外显+文字",
        desc: "设置自定义外显文本"
      },
      {
        icon: 8,
        title: "#切换外显模式",
        desc: "切换一言/文本模式"
      }
    ]
  },
  {
    group: "报时功能",
    auth: "master",
    list: [
      {
        icon: 9,
        title: "#报时",
        desc: "报时"
      },
      {
        icon: 10,
        title: "#开启/关闭报时",
        desc: "开关报时功能"
      }
    ]
  },
  {
    group: "闹钟功能",
    list: [
      {
        icon: 12,
        title: "#定闹钟0:02",
        desc: "设置闹钟"
      },
      {
        icon: 13,
        title: "#关闭闹钟",
        desc: "关闭闹钟"
      }
    ]
  },
  {
    group: "游戏功能",
    list: [
      {
        icon: 14,
        title: "#今日运势",
        desc: "今天的运势怎么样呢"
      },
      {
        icon: 15,
        title: "#群友老婆",
        desc: "让我看看老婆是谁"
      }
    ]
  },
  {
    group: "每日问候",
    list: [
      {
        icon: 22,
        title: "#早安/#早上好",
        desc: "早安问候回复"
      },
      {
        icon: 23,
        title: "#午安/#中午好",
        desc: "午安问候回复"
      },
      {
        icon: 24,
        title: "#晚安/#晚上好",
        desc: "晚安问候回复"
      }
    ]
  },
  {
    group: "随机功能",
    list: [
      {
        icon: 25,
        title: "#随机[文本/图片/视频]",
        desc: "随机回复一条内容"
      },
      {
        icon: 26,
        title: "#随机列表",
        desc: "查看随机列表内容"
      }
    ]
  },
  {
    group: "涩涩功能",
    list: [
      {
        icon: 27,
        title: "#磁力草+关键词",
        desc: "搜索磁力链接资源"
      },
      {
        icon: 28,
        title: "#磁力猫+关键词",
        desc: "搜索磁力链接资源"
      },
      {
        icon: 29,
        title: "#JM/禁漫+编号",
        desc: "查看禁漫本子"
      },
      {
        icon: 30,
        title: "#验车",
        desc: "校验链接内容"
      },
      {
        icon: 31,
        title: "#清理JM缓存",
        desc: "清理禁漫缓存"
      }
    ]
  },
  {
    group: "主人功能",
    auth: "master",
    list: [
      {
        icon: 16,
        title: "#Y(强制)?更新",
        desc: "拉取Git更新"
      },
      {
        icon: 17,
        title: "#开启/关闭问候回复",
        desc: "问候回复"
      },
      {
        icon: 18,
        title: "#开启/关闭天气功能",
        desc: "天气功能"
      },
      {
        icon: 19,
        title: "#开启/关闭联系主人",
        desc: "联系主人"
      },
      {
        icon: 20,
        title: "#开启/关闭闹钟功能",
        desc: "叮铃！叮铃！"
      },
      {
        icon: 21,
        title: "#一键修改群名片/头衔",
        desc: "格式化泥们！"
      },
      {
        icon: 33,
        title: "#日签打卡",
        desc: "QQ空间日签打卡"
      },
      {
        icon: 34,
        title: "#抽幸运字符",
        desc: "抽取QQ幸运字符"
      },
      {
        icon: 35,
        title: "#更新个性签名",
        desc: "更新QQ个性签名"
      },
      {
        icon: 36,
        title: "#点赞全部",
        desc: "点赞全部QQ好友"
      },
      {
        icon: 37,
        title: "#开启/关闭涩涩功能",
        desc: "开关涩涩功能"
      },
      {
        icon: 38,
        title: "#添加/取消涩涩白名单",
        desc: "管理涩涩白名单"
      },
      {
        icon: 39,
        title: "#开启/关闭JM加密",
        desc: "开关禁漫加密"
      },
      {
        icon: 40,
        title: "#Y清理无效数据",
        desc: "清理插件无效数据"
      }
    ]
  }
]

export const isSys = true
