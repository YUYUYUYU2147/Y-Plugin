/*
 * 此配置文件为系统使用，请勿修改，否则可能无法正常使用
 * */

export const helpCfg = {
  title: "Y涩涩帮助",
  subTitle: "[Y插件] Yunzai-Bot&Y-Plugin",
  colCount: 3,
  colWidth: 265,
  theme: "all",
  themeExclude: ["default"],
}

export const helpList = [
  {
    group: "涩涩类",
    list: [
      {
        icon: 1,
        title: "#验车()",
        desc: "要发车咯",
      },
      {
        icon: 2,
        title: "#磁力猫[] [] [] []",
        desc: "[搜索内容] [全部/影视/音乐/图像/文档/压缩包/安装包/其他] [相关度/文件大小/添加时间/热度/最近下载] [结果数量]",
      },
      {
        icon: 3,
        title: "#磁力草[] []",
        desc: "[搜索内容] [热度/大小]",
      },
      {
        icon: 4,
        title: "#jm[]",
        desc: "[漫画id]",
      },
      {
        icon: 5,
        title: "#清理jm",
        desc: "清理已下载漫画",
      },
    ],
  },
  {
    group: "主人功能",
    auth: "master",
    list: [
      {
        icon: 6,
        title: "#(添加|取消)涩涩白名单[]",
        desc: "可以涩涩了吗！",
      },
      {
        icon: 7,
        title: "#开启/关闭涩涩功能",
        desc: "涩涩功能",
      },
      {
        icon: 8,
        title: "#开启/关闭禁漫加密",
        desc: "加密涩涩",
      },
    ],
  },
]

export const isSys = true
