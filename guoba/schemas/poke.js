import { Poke_List } from '#components'

export default [
  {
    component: 'SOFT_GROUP_BEGIN',
    label: '戳一戳配置'
  },
  {
    field: 'poke.poke',
    label: '戳一戳开关',
    component: 'Switch'
  },
  {
    field: 'poke.cd',
    label: '触发冷却',
    bottomHelpMessage: '单位：秒',
    component: 'InputNumber',
    required: true,
    componentProps: {
      min: 1,
      placeholder: '请输入冷却时间'
    }
  },
  {
    field: 'poke.list',
    label: '戳一戳指定内容',
    bottomHelpMessage: '戳一戳指定内容',
    componentProps: {
      placeholder: '不填默认全部',
      mode: 'multiple',
      options: Poke_List.map(name => ({ value: name }))
    },
    component: 'Select'
  },
  {
    field: 'poke.text',
    helpMessage: '戳一戳文本回复',
    label: '文本请求的接口地址',
    bottomHelpMessage: '戳一戳文本回复URL',
    componentProps: {
      placeholder: '请输入接口地址'
    },
    component: 'Input'
  },
  {
    field: 'poke.img',
    helpMessage: '戳一戳图片回复',
    label: '图片请求的接口地址',
    bottomHelpMessage: '戳一戳图片回复URL',
    componentProps: {
      placeholder: '请输入接口地址'
    },
    component: 'Input'
  },
  {
    field: 'poke.voice',
    helpMessage: '戳一戳语音回复',
    label: '语音请求的接口地址',
    bottomHelpMessage: '戳一戳语音回复URL',
    componentProps: {
      placeholder: '请输入接口地址'
    },
    component: 'Input'
  }
]
