export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "其他配置"
  },
  {
    component: "Divider",
    label: "优先级配置"
  },
  {
    field: "other.priority",
    label: "插件优先级",
    required: true,
    componentProps: {
      placeholder: "请输入数字"
    },
    component: "InputNumber"
  },
  {
    component: "Divider",
    label: "推送配置"
  },
  {
    field: "other.PushBot",
    label: "推送Bot",
    bottomHelpMessage: "为空TRSS自动选择",
    componentProps: {
      allowAdd: true,
      allowDel: true
    },
    component: "GTags"
  },
  {
    component: "Divider",
    label: "问候回复配置"
  },
  {
    field: "other.WhhfSet",
    label: "开关",
    component: "Switch"
  },
  {
    field: "other.whhf",
    helpMessage: "图片请求的接口地址",
    label: "图片地址",
    componentProps: {
      placeholder: "请输入接口地址"
    },
    component: "Input"
  },
  {
    component: "Divider",
    label: "天气配置"
  },
  {
    field: "other.WeatherSet",
    label: "开关",
    component: "Switch"
  },
  {
    field: "other.weather",
    helpMessage: "高德天气请求的接口key",
    label: "高德天气key",
    bottomHelpMessage: "获取方法：https://lbs.amap.com/api/webservice/guide/api/weatherinfo",
    componentProps: {
      placeholder: "请输入天气key"
    },
    component: "Input"
  },
  {
    component: "Divider",
    label: "报时配置"
  },
  {
    field: "other.zdbsType",
    label: "报时类型",
    component: "RadioGroup",
    componentProps: {
      options: [
        { label: "语音", value: 0 },
        { label: "文字", value: 1 },
        { label: "全部", value: 2 }
      ],
      placeholder: "请选择报时类型"
    }
  },
  {
    field: "other.zdbsGroup",
    helpMessage: "推送群",
    label: "推送群",
    componentProps: {
      placeholder: "点击选择要推送的群"
    },
    component: "GSelectGroup"
  },
  {
    field: "other.zdbsUrl",
    helpMessage: "请求的接口地址",
    label: "语音",
    componentProps: {
      placeholder: "请输入报时语音地址"
    },
    component: "Input"
  },
  {
    field: "other.zdbsMsg",
    helpMessage: "请求的接口地址",
    label: "文本",
    componentProps: {
      placeholder: "请输入报时文本地址"
    },
    component: "Input"
  },
  {
    component: "Divider",
    label: "闹钟配置"
  },
  {
    field: "other.nzSet",
    label: "开关",
    component: "Switch"
  },
  {
    field: "other.nzCron",
    helpMessage: "修改后重启生效",
    label: "提醒定时表达式",
    componentProps: {
      placeholder: "请输入Cron表达式"
    },
    component: "EasyCron"
  },
  {
    field: "other.nzCount",
    helpMessage: "最大提醒次数",
    label: "提醒次数",
    componentProps: {
      placeholder: "请输入数字"
    },
    component: "InputNumber"
  },
  {
    field: "other.nzMsg",
    helpMessage: "闹钟提醒语",
    label: "提醒语",
    componentProps: {
      placeholder: "请输入提醒语"
    },
    component: "Input"
  },
  {
    component: "Divider",
    label: "哪吒面板配置"
  },
  {
    field: "other.nezhaIP",
    helpMessage: "用于请求哪吒面板",
    label: "面板IP",
    bottomHelpMessage: "你的哪吒面板IP地址",
    componentProps: {
      placeholder: "请输入IP"
    },
    component: "Input"
  },
  {
    field: "other.nezhaUser",
    helpMessage: "用于请求哪吒面板",
    label: "面板用户",
    componentProps: {
      placeholder: "请输入用户名"
    },
    component: "Input"
  },
  {
    field: "other.nezhaCode",
    helpMessage: "用于请求哪吒面板",
    label: "面板密码",
    componentProps: {
      placeholder: "请输入密码"
    },
    component: "Input"
  },
  {
    component: "Divider",
    label: "字符配置"
  },
  {
    field: "other.LuckywordGroup",
    label: "抽字符群",
    componentProps: {
      placeholder: "点击选择要抽字符的群"
    },
    component: "GSelectGroup"
  },
  {
    component: "Divider",
    label: "点赞配置"
  },
  {
    field: "other.DZList",
    label: "自动点赞列表",
    bottomHelpMessage: "自动点赞列表",
    componentProps: {
      allowAdd: true,
      allowDel: true
    },
    component: "GTags"
  },
  {
    component: "Divider",
    label: "涩涩配置"
  },
  {
    field: "other.SeseSet",
    label: "开关",
    component: "Switch"
  },
  {
    field: "other.Sese",
    label: "涩涩权限",
    bottomHelpMessage: "0-全部 1-仅主人 2-主人及白名单",
    component: "RadioGroup",
    componentProps: {
      options: [
        { label: "全部", value: 0 },
        { label: "仅主人", value: 1 },
        { label: "主人及白名单", value: 2 }
      ],
      placeholder: "请选择涩涩权限"
    }
  },
  {
    field: "other.SeseList",
    label: "白名单列表",
    bottomHelpMessage: "白名单列表",
    componentProps: {
      allowAdd: true,
      allowDel: true
    },
    component: "GTags"
  },
  {
    field: "other.JMJM",
    label: "JM加密开关",
    component: "Switch"
  },
  {
    field: "other.JMMAX",
    label: "JM最大限制",
    required: true,
    componentProps: {
      placeholder: "请输入数字"
    },
    component: "InputNumber"
  },
  {
    component: "Divider",
    label: "名片/头衔配置"
  },
  {
    field: "other.EditGroup",
    helpMessage: "用于请求文本",
    label: "文本URL",
    bottomHelpMessage: "修改文本URL",
    componentProps: {
      placeholder: "请输入接口地址"
    },
    component: "Input"
  },
  {
    component: "Divider",
    label: "今日运势配置"
  },
  {
    field: "other.JrysType",
    label: "运势模式",
    component: "RadioGroup",
    componentProps: {
      options: [
        { label: "文字", value: 0 },
        { label: "图片", value: 1 }
      ],
      placeholder: "请选择运势模式"
    }
  },
  {
    field: "other.JrysJ",
    label: "主人大吉开关",
    component: "Switch"
  },
  {
    field: "other.Jrysmd",
    label: "markdown模式开关",
    component: "Switch"
  },
  {
    field: "other.Jrysimg",
    helpMessage: "用于请求图片",
    label: "图片URL",
    bottomHelpMessage: "不填不输出图片",
    componentProps: {
      placeholder: "请输入接口地址"
    },
    component: "Input"
  }
]
