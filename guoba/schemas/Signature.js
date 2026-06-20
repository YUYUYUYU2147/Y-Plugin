export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "个性签名配置"
  },
  {
    field: "Signature.Auto",
    label: "个性签名开关",
    component: "Switch"
  },
  {
    field: "Signature.Bot",
    label: "个性签名指定Bot",
    bottomHelpMessage: "个性签名指定Bot",
    componentProps: {
      allowAdd: true,
      allowDel: true
    },
    component: "GTags"
  },
  {
    field: "Signature.Url",
    helpMessage: "个性签名文本URL",
    label: "文本请求的接口地址",
    bottomHelpMessage: "个性签名文本URL",
    componentProps: {
      placeholder: "请输入接口地址"
    },
    component: "Input"
  },
  {
    field: "Signature.Cron",
    helpMessage: "修改后重启生效",
    label: "个性签名定时表达式",
    componentProps: {
      placeholder: "请输入Cron表达式"
    },
    component: "EasyCron"
  }
]
