function configuration(fieldName, label) {
  return {
    field: `randoms.${fieldName}`,
    label: `${label}列表`,
    bottomHelpMessage: "修改后重启生效",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      schemas: [
        {
          field: "name",
          label: "名称",
          helpMessage: "触发的名称",
          componentProps: {
            allowAdd: true,
            allowDel: true
          },
          component: "GTags"
        },
        {
          field: "url",
          label: "地址",
          helpMessage: "用于请求URL",
          component: "Input",
          componentProps: {
            placeholder: "请输入地址URL"
          }
        }
      ]
    }
  }
}

export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "随机回复配置"
  },
  {
    field: "randoms.open",
    label: "开关",
    component: "Switch"
  },
  {
    field: "randoms.Force",
    label: "强制#开关",
    component: "Switch"
  },
  {
    field: "randoms.CompImage",
    label: "图片压缩质量",
    component: "InputNumber",
    required: true,
    componentProps: {
      placeholder: "请输入数字",
      min: 0.1,
      max: 1,
      step: 0.1
    }
  },
  configuration("text", "文本"),
  configuration("image", "图片"),
  configuration("video", "视频")
]
