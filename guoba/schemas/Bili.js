export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "Bili配置"
  },
  {
    field: "Bili.Server_Port",
    label: "开放端口",
    bottomHelpMessage: "Bili服务开放端口",
    component: "InputNumber",
    required: true,
    componentProps: {
      placeholder: "请输入端口",
      min: 1,
      max: 65535,
      step: 1
    }
  },
  {
    field: "Bili.prefix",
    label: "自定义前缀提示词",
    bottomHelpMessage: "设置自定义前缀提示词",
    component: "Input",
    componentProps: {
      placeholder: "请输入前缀提示词"
    }
  },
  {
    component: "Divider",
    label: "定时配置"
  },
  {
    field: "Bili.SignCron",
    helpMessage: "修改后重启生效",
    label: "自动签到定时表达式",
    componentProps: {
      placeholder: "请输入Cron表达式"
    },
    component: "EasyCron"
  },
  {
    field: "Bili.DanMuCron",
    helpMessage: "修改后重启生效",
    label: "自动弹幕定时表达式",
    componentProps: {
      placeholder: "请输入Cron表达式"
    },
    component: "EasyCron"
  },
  {
    component: "Divider",
    label: "订阅配置"
  },
  {
    field: "Bili.DYupcron",
    helpMessage: "修改后重启生效",
    label: "订阅UP定时表达式",
    componentProps: {
      placeholder: "请输入Cron表达式"
    },
    component: "EasyCron"
  },
  {
    field: "Bili.DYLive",
    label: "订阅直播开关",
    component: "Switch"
  },
  {
    field: "Bili.DYVideo",
    label: "订阅动态开关",
    component: "Switch"
  },
  {
    field: "Bili.UPList",
    label: "推送列表",
    bottomHelpMessage: "UP订阅列表",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      schemas: [
        {
          field: "Group",
          helpMessage: "检测到UP更新后推送的群列表",
          label: "推送群",
          componentProps: {
            placeholder: "点击选择要推送的群"
          },
          component: "GSelectGroup"
        },
        {
          field: "UP",
          helpMessage: "检测的UP列表",
          label: "UP列表",
          componentProps: {
            allowAdd: true,
            allowDel: true
          },
          component: "GTags"
        },
        {
          field: "Filter",
          helpMessage: "过滤包含此消息的推送",
          label: "过滤列表",
          componentProps: {
            allowAdd: true,
            allowDel: true
          },
          component: "GTags"
        }
      ]
    }
  },
  {
    component: "Divider",
    label: "弹幕推送配置"
  },
  {
    field: "Bili.DanMutext",
    helpMessage: "弹幕一言",
    label: "一言URL",
    componentProps: {
      placeholder: "请输入弹幕一言接口地址"
    },
    component: "Input"
  },
  {
    field: "Bili.DanMuHGroup",
    helpMessage: "白名单群",
    label: "弹幕推送白名单群",
    componentProps: {
      placeholder: "点击选择要推送的群"
    },
    component: "GSelectGroup"
  },
  {
    field: "Bili.DanMuBGroup",
    helpMessage: "黑名单群",
    label: "弹幕推送黑名单群",
    componentProps: {
      placeholder: "点击选择要推送的群"
    },
    component: "GSelectGroup"
  },
  {
    field: "Bili.Livedamu",
    label: "弹幕监听权限",
    bottomHelpMessage: "0-全部 1-仅主人 2-主人及群主及管理员",
    component: "RadioGroup",
    componentProps: {
      options: [
        { label: "全部", value: 0 },
        { label: "仅主人", value: 1 },
        { label: "管理员及群主", value: 2 }
      ],
      placeholder: "请选择弹幕监听权限"
    }
  },
  {
    field: "Bili.LivedamuTime",
    label: "弹幕监听推送时间",
    bottomHelpMessage: "弹幕监听推送时间单位毫秒",
    component: "InputNumber",
    componentProps: {
      placeholder: "单位毫秒"
    }
  },
  {
    component: "Divider",
    label: "登录配置"
  },
  {
    field: "Bili.Sign_Api",
    helpMessage: "登录Api请求的接口地址",
    label: "登录Api",
    bottomHelpMessage: "如果你不知道这是什么请勿修改",
    componentProps: {
      placeholder: "请输入登录Api接口地址"
    },
    component: "Input"
  }
]
