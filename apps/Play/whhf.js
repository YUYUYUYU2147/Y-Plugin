import { Config } from "#components"
import { Button } from "#model"
const url = `${Config.other.whhf}` // 返回图的API

// 获取当前小时
const getCurrentHour = () => new Date().getHours()

// 文案库
const TextDict = {
  GoodMoring: {
    "05:00-08:00": [
      "嗨，新的一天开始啦！愿你充满活力，迎接新的冒险！",
      "清晨的鸟鸣和微风都在向你打招呼，早安！",
      "崭新的一天，充满希望和机会。祝你早安，愿你笑逐颜开！",
      "ハイ、新しい一日が始まりました！あなたが活力に満ちて、新しい冒険を迎えることを願っています!",
      "ハイ、新しい一日が始まりました！あなたが活力に満ちて、新しい冒険を迎えることを願っています!"
    ],
    "08:00-09:00": [
      "早上好！虽然有点晚，但愿你的笑容早早闪亮起来！",
      "都这个点了还说早安，是不是想多享受一会儿被窝的温暖？",
      "嘿，早安？这是刚刚踏出被窝还是准备再来个小憩？"
    ],
    "09:00-12:00": [
      "早上好？这个点怕是早餐都要吃午饭了吧！",
      "你这早安发得有点晚啊，是不是昨晚熬夜刷剧了？",
      "早安？太阳都晒屁股了，你才起床吗？"
    ],
    "12:00-18:00": [
      "早上好？你确定不是下午好吗？是不是时差没倒过来？",
      "这个点说早上好，你是不是刚睡醒？昼夜颠倒了吧！",
      "午安都过了，你还在这说早安。是不是需要个闹钟来拯救你的作息时间？"
    ],
    "18:00-23:00": [
      "晚上好？不对，现在是晚上了。你的早安是不是发错时间了？",
      "这个点说早上好？你确定不是晚安吗？是不是今天过得太快了？",
      "晚上好！不过你的‘早上好’是不是穿越了？需要我帮你倒倒时差吗？"
    ],
    "23:00-05:00": [
      "晚上好？已经是深夜了，你的‘早上好’是不是想提前预约明天的？",
      "这个点说早上好，你是不是准备半夜起来干坏事？",
      "晚安！不过你的‘早上好’让我有点懵，你是不是时差党？"
    ]
  },

  GoodNoon: {
    "11:00-13:00": [
      "中午好，吃饭了吗？祝你午餐愉快！",
      "阳光正好，微风不燥，愿你中午好心情！",
      "中午好，愿你的一天过得充实又愉快！"
    ],
    "13:00-18:00": [
      "下午好！中午已经过去，你是不是刚刚醒来？",
      "中午好？这个点都快吃晚饭了，你是不是刚起床？",
      "下午好！你的中午好来得有点晚啊，是不是午睡过头了？"
    ],
    "18:00-00:00": [
      "晚上好！这会儿已经过了中午，你的中午好有点迟到哦。",
      "中午好？现在是晚上啦，你是不是刚刚醒来？",
      "下午好！你的中午好来得晚了点，是不是午觉睡得太久了？"
    ],
    "00:00-05:00": [
      "深夜好！已经过了中午，你是不是刚从梦中醒来？",
      "中午好？这个点都快吃早餐了，你是不是刚刚起床？",
      "凌晨好！你的中午好有点迟了，是不是睡觉时间搞错了？"
    ],
    "05:00-11:00": [
      "早安！还没到中午呢，你这是不是刚刚起床的节奏？",
      "中午好？现在是早晨，你是不是刚起床还没适应？",
      "早上好！你的中午好来得有点早，是不是时差调整中？"
    ]
  },

  GoodEvening: {
    "17:00-21:00": [
      "晚上好，愿你有一个宁静的夜晚！",
      "晚上好，今天过得怎么样？希望你晚上愉快！",
      "夜幕降临，祝你晚上好，心情愉快！"
    ],
    "21:00-00:00": [
      "晚上好！准备休息了吗？熬夜对身体不好哦！",
      "深夜了，还在忙碌吗？记得早点休息，晚安！",
      "晚上好！不过快要进入梦乡了，你是不是也该睡觉了？"
    ],
    "00:00-07:00": [
      "晚上好？已经是深夜到凌晨了，你是不是该睡觉了？",
      "这个点说晚上好，你是不是夜猫子准备出动了？",
      "晚安！不过你的‘晚上好’…… 你是不是该调整作息了？"
    ],
    "07:00-12:00": [
      "早上好！已经是上午了，你的晚上好是不是发错时间了？",
      "这个点说晚上好？你是不是刚起床还是准备睡觉？",
      "中午好都快到了，你还在说晚上好。是不是需要我帮你倒倒时差？"
    ],
    "12:00-17:00": [
      "晚上好！已经是下午了，你的晚上好是不是穿越了？",
      "这个点说晚上好？你是不是把下午当成晚上了？",
      "下午好都快过完了，你才说晚上好。是不是太忙了？"
    ]
  },

  GoodNight: {
    "21:00-23:00": ["晚安，愿你有一个好梦！", "晚安，今天辛苦了！祝你有个美好的夜晚！", "夜深了，该休息了。晚安！"],
    "23:00-02:00": [
      "晚安！已经是深夜了，你是不是还在熬夜？",
      "这个点还不睡？熬夜对身体不好哦！早点休息吧！",
      "晚安！不过你的熬夜行为让我有点担心，是不是有什么心事？"
    ],
    "02:00-07:00": [
      "晚安！夜深人静了，你是不是该睡觉了？",
      "这个点还不睡？是不是准备通宵了？熬夜伤身哦！",
      "都快天亮了还不睡？你是不是要准备少走几十年弯路提前离开这个世界？"
    ],
    "07:00-11:00": [
      "早上好！已经是上午了，你的晚上好是不是发错时间了？",
      "这个点说晚上好？你是不是刚起床还是准备睡觉？",
      "中午好都快到了，你还在说晚上好。是不是需要我帮你倒倒时差？"
    ],
    "11:00-13:00": [
      "中午好！别人都睡午觉了你才说晚安？",
      "这个点说晚安？你是不是刚起床还是准备午睡？",
      "午安都快过完了你才说晚安。是不是太忙了？"
    ],
    "13:00-17:00": [
      "下午好！下午了才说晚安你是要少走几十年弯路提前去世吗？",
      "这个点说晚安？你是不是把下午当成晚上了？",
      "下午好都快过完了你才说晚安。是不是需要我帮你倒倒时差？"
    ],
    "17:00-19:00": [
      "晚上好！这么早就睡觉了吗？我不信。",
      "这个点说晚安？你是不是今天太累了想早点休息？",
      "晚上好！不过你的‘晚安’让我有点想笑你是不是提前进入梦乡了？"
    ],
    "19:00-21:00": [
      "晚上好，准备休息了吗？愿你有个好梦！",
      "晚安！愿你今晚有个美好的梦境！",
      "夜幕降临，祝你晚安，好梦相伴！"
    ]
  }
}

// 从数组中随机选择一个元素
const getRandomElement = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    console.error("Invalid array passed to getRandomElement")
    return // 或者其他处理方式
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

// 导出一个问候插件
export class greetings extends plugin {
  // 构建正则匹配等
  constructor() {
    super({
      name: "Y:每日问候",
      event: "message",
      priority: Config.other.priority,
      rule: [
        {
          reg: "^#?(早安|早上好|早安丫|早)$",
          fnc: "goodMorning"
        },
        {
          reg: "^#?(午安|中好|午安丫|中午好)$",
          fnc: "goodNoon"
        },
        {
          reg: "^#?(晚上好)$",
          fnc: "goodEvening"
        },
        {
          reg: "^#?(晚安|晚安丫|晚)$",
          fnc: "goodNight"
        }
      ]
    })
  }

  // 早安问候
  async goodMorning(e) {
    if (!Config.other.WhhfSet) return false
    const currentHour = getCurrentHour()
    const timeRanges = {
      "05:00-08:00": [5, 8],
      "08:00-09:00": [8, 9],
      "09:00-12:00": [9, 12],
      "12:00-18:00": [12, 18],
      "18:00-23:00": [18, 23],
      "23:00-05:00": [23, 5]
    }

    let message = "23:00-5:00"

    for (const [key, [start, end]] of Object.entries(timeRanges)) {
      if (
        (start < end && currentHour >= start && currentHour < end) ||
        (start > end && (currentHour >= start || currentHour < end))
      ) {
        message = key
        break
      }
    }

    await e.reply([getRandomElement(TextDict.GoodMoring[message]), segment.image(url), new Button().whhf()], true)
    return true
  }

  // 午安问候
  async goodNoon(e) {
    if (!Config.other.WhhfSet) return false
    const currentHour = getCurrentHour()
    const timeRanges = {
      "11:00-13:00": [11, 13],
      "13:00-18:00": [13, 18],
      "18:00-00:00": [18, 0],
      "00:00-05:00": [0, 5],
      "05:00-11:00": [5, 11]
    }

    let message = "5:00-11:00"

    for (const [key, [start, end]] of Object.entries(timeRanges)) {
      if (
        (start < end && currentHour >= start && currentHour < end) ||
        (start > end && (currentHour >= start || currentHour < end))
      ) {
        message = key
        break
      }
    }

    await e.reply([getRandomElement(TextDict.GoodNoon[message]), segment.image(url), new Button().whhf()], true)
    return true
  }

  // 晚上问候
  async goodEvening(e) {
    if (!Config.other.WhhfSet) return false
    const currentHour = getCurrentHour()
    const timeRanges = {
      "17:00-21:00": [17, 21],
      "21:00-00:00": [21, 0],
      "00:00-07:00": [0, 7],
      "07:00-12:00": [7, 12],
      "12:00-17:00": [12, 17]
    }

    let message = "17:00-21:00"

    for (const [key, [start, end]] of Object.entries(timeRanges)) {
      if (
        (start < end && currentHour >= start && currentHour < end) ||
        (start > end && (currentHour >= start || currentHour < end))
      ) {
        message = key
        break
      }
    }

    await e.reply([getRandomElement(TextDict.GoodEvening[message]), segment.image(url), new Button().whhf()], true)
    return true
  }

  // 晚安问候
  async goodNight(e) {
    if (!Config.other.WhhfSet) return false
    const currentHour = getCurrentHour()
    const timeRanges = {
      "21:00-23:00": [21, 23],
      "23:00-02:00": [23, 2],
      "02:00-07:00": [2, 7],
      "07:00-11:00": [7, 11],
      "11:00-13:00": [11, 13],
      "13:00-17:00": [13, 17],
      "17:00-19:00": [17, 19],
      "19:00-21:00": [19, 21]
    }

    let message = "19:00-21:00"

    for (const [key, [start, end]] of Object.entries(timeRanges)) {
      if (
        (start < end && currentHour >= start && currentHour < end) ||
        (start > end && (currentHour >= start || currentHour < end))
      ) {
        message = key
        break
      }
    }

    await e.reply([getRandomElement(TextDict.GoodNight[message]), segment.image(url), new Button().whhf()], true)
    return true
  }
}
