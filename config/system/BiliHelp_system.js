/*
 * B站帮助配置
 * 已移除条目（因无 access_token 且 web API 风控不可用）：
 * - 视频操作：点赞/收藏/点踩/取消赞/取消藏/不喜欢/一键三连/评论
 * - 关系操作：关注/取消关注/拉黑/取消拉黑/踢出粉丝
 * - #B站刷新ck
 * - 开始推送直播间
 * - #B站用户统计 / #B站删除失效用户
 * 剩余功能：签到(部分) / 关注列表 / 发弹幕 / 订阅UP / 登录/退出 / 开关设置
 * */

export const helpCfg = {
  title: "B站帮助",
  subTitle: "[Y插件] Yunzai-Bot&Y-Plugin",
  colCount: 3,
  colWidth: 265,
  theme: "all",
  themeExclude: ["default"]
}

export const helpList = [
  {
    group: "本插件均为开源项目，严禁将本库内容用于任何商业用途或违法行为"
  },
  {
    group: "账号操作",
    list: [
      {
        icon: 1,
        title: "#B站登录",
        desc: "使用APP扫码获取权限"
      },
      {
        icon: 31,
        title: "#B站设置token",
        desc: "手动设置access_token"
      },
      {
        icon: 2,
        title: "#B站退出",
        desc: "执行退出操作"
      },
      {
        icon: 4,
        title: "#B站切换账号2",
        desc: "切换B站账号"
      },
      {
        icon: 5,
        title: "#B站(重新)签到",
        desc: "执行B站签到"
      },
      {
        icon: 6,
        title: "#B站签到记录",
        desc: "查看B站签到记录"
      },
      {
        icon: 7,
        title: "#(开启|关闭)投币",
        desc: "泥要投币吗！"
      },
      {
        icon: 8,
        title: "#(开启|关闭)直播间弹幕",
        desc: "泥要发弹幕吗！"
      },
      {
        icon: 30,
        title: "#我的关注",
        desc: "查看B站关注列表"
      }
    ]
  },
  {
    group: "订阅操作",
    list: [
      {
        icon: 22,
        title: "#订阅up",
        desc: "订阅B站up"
      },
      {
        icon: 23,
        title: "#取消订阅up",
        desc: "取消订阅B站up"
      }
    ]
  },
  {
    group: "直播间操作",
    list: [
      {
        icon: 24,
        title: "#发弹幕 [房间号] [内容]",
        desc: "在直播间发弹幕"
      }
    ]
  },
  {
    group: "管理命令，仅主人可用",
    list: [
      {
        icon: 27,
        title: "#B站全部签到",
        desc: "手动B站全部签到"
      }
    ]
  }
]

export const isSys = true
