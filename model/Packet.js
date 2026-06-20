import pb from "./protobuf/index.js"
import * as jce from "./Jce/index.js"
import { Buffer } from "buffer"
import crypto from "crypto"
import { gzip as _gzip, gunzip as _gunzip } from "zlib"
import { promisify } from "util"
import { logger } from "#lib"

const gzip = promisify(_gzip)
const gunzip = promisify(_gunzip)

const RandomUInt = () => crypto.randomBytes(4).readUInt32BE()

export const Proto = pb

export const replacer = (key, value) => {
  if (typeof value === "bigint") {
    return Number(value) >= Number.MAX_SAFE_INTEGER ? value.toString() : Number(value)
  } else if (Buffer.isBuffer(value)) {
    return `hex->${value.toString("hex")}`
  } else if (value?.type === "Buffer" && Array.isArray(value.data)) {
    return `hex->${Buffer.from(value.data).toString("hex")}`
  } else {
    return value
  }
}

export const encode = (json) => {
  return pb.encode(processJSON(json))
}

export const Send = async (e, cmd, content, isJce = false, isQQ = false) => {
  try {
    const bot = isQQ ? Bot[e] : e.bot

    if (!isJce) {
      const data = encode(typeof content === "object" ? content : JSON.parse(content))
      let ret
      if (bot?.adapter?.name === "OneBotv11") {
        let action = bot?.version?.app_name === "Lagrange.OneBot" ? ".send_packet" : "send_packet"
        ret = Buffer.from(data).toString("hex")
        if (bot?.version?.app_name === "LLOneBot") {
          const resp = await bot.sendApi("send_pb", {
            cmd: cmd,
            hex: ret
          })
          return pb.decode(resp.hex) || {}
        }
        const req = await bot.sendApi(action, {
          cmd: cmd,
          command: cmd,
          data: ret
        })
        let rsp = pb.decode(req.data.result || req.data)
        if (rsp[1] !== 0 && cmd === "MessageSvc.PbSendMsg") {
          throw new Error(`[${bot.uin}] 消息发送失败，请检查您的消息是否正确！\n ${JSON.stringify(rsp, null, 2)}`)
        }
        return rsp
      } else {
        ret = Buffer.from(data)
        const payload = await bot.sendUni(cmd, ret)
        let rsp = pb.decode(payload)
        if (rsp[1] !== 0 && cmd === "MessageSvc.PbSendMsg") {
          throw new Error(`[${bot.uin}] 消息发送失败，请检查您的消息是否正确！\n ${JSON.stringify(rsp, null, 2)}`)
        }
        return rsp
      }
    } else {
      let payload
      if (bot?.adapter?.name === "OneBotv11") {
        let body
        let action = bot?.version?.app_name === "Lagrange.OneBot" ? ".send_packet" : "send_packet"
        if (/^[0-9a-fA-F]+$/.test(content)) {
          body = content
        } else {
          body = Buffer.from(content, "base64").toString("hex")
        }
        const req = await bot.sendApi(action, {
          cmd: cmd,
          command: cmd,
          data: body
        })
        payload = Buffer.from(req.data.result || req.data, "hex")
      } else {
        let body
        if (/^[0-9a-fA-F]+$/.test(content)) {
          body = Buffer.from(content, "hex")
        } else {
          body = content
        }
        payload = await bot.sendUni(cmd, body)
      }
      return payload ? jce.decodeWrapper(payload) : null
    }
  } catch (error) {
    logger.error(`发包失败：${error}`)
    throw error
  }
}

/**
 * 添加机器人
 * @param {Object} e - 事件对象
 * @param {string|number} bot_id - 机器人QQ号
 * @param {boolean} [isQQ=false] - 是否e使用QQ号，默认为false
 */
export const addBot = async (e, bot_id, isQQ = false) => {
  try {
    return sendOidbSvcTrpcTcp(
      e,
      "OidbSvcTrpcTcp.0x9078_1",
      {
        1: bot_id
      },
      isQQ
    )
  } catch (error) {
    logger.error(`添加Bot失败 ${error.message}`)
  }
}

/**
 * 删除机器人
 * @param {Object} e - 事件对象
 * @param {string|number} bot_id - 机器人QQ号
 * @param {boolean} [isQQ=false] - 是否e使用QQ号，默认为false
 */
export const delBot = async (e, bot_id, isQQ = false) => {
  try {
    return sendOidbSvcTrpcTcp(
      e,
      "OidbSvcTrpcTcp.0x9079_1",
      {
        1: bot_id
      },
      isQQ
    )
  } catch (error) {
    logger.error(`删除Bot失败 ${error.message}`)
  }
}

/**
 * 获取机器人信息
 * @param {Object} e - 事件对象
 * @param {string|number} bot_id - 要查询的机器人QQ号
 * @param {boolean} [isQQ=false] - 是否e使用QQ号，默认为false
 */
export const getBotinfo = async (e, bot_id, isQQ = false) => {
  try {
    return sendOidbSvcTrpcTcp(
      e,
      "OidbSvcTrpcTcp.0x9075_1",
      {
        1: bot_id,
        2: 0,
        3: String(RandomUInt()),
        5: {
          1: 1,
          2: 1
        }
      },
      isQQ
    )
  } catch (error) {
    logger.error(`获取机器人信息 失败 ${error.message}`)
  }
}

/**
 * 邀请官鸡进群
 * @param {Object} e - 事件对象
 * @param {string|number} group_id - 群号
 * @param {string|number} bot_id - 机器人QQ号
 * @param {boolean} [isQQ=false] - 是否e使用QQ号，默认为false
 */
export const InviteBot = async (e, group_id, bot_id, isQQ = false) => {
  try {
    return sendOidbSvcTrpcTcp(
      e,
      "OidbSvcTrpcTcp.0x9076_1",
      {
        1: group_id,
        2: bot_id
      },
      isQQ
    )
  } catch (error) {
    logger.error(`邀请官鸡进群 失败 ${error.message}`)
  }
}

export const sendOidb = async (e, cmd, body, isQQ = false) => {
  try {
    const bot = isQQ ? Bot[e] : e.bot
    const sp = cmd.replace("OidbSvc.", "").replace("oidb_", "").split("_")
    const type1 = parseInt(sp[0], 16),
      type2 = parseInt(sp[1])
    body = {
      1: type1,
      2: isNaN(type2) ? 1 : type2,
      3: 0,
      4: body,
      ...(bot?.adapter?.name === "OneBotv11"
        ? {
            12: 1
          }
        : {
            6: "android " + (bot?.apk?.ver || "9.0.90")
          })
    }
    return Send(e, cmd, body, false, isQQ)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`)
  }
}

export const sendOidbSvcTrpcTcp = async (e, cmd, body, isQQ = false) => {
  try {
    const bot = isQQ ? Bot[e] : e.bot
    let type1, type2
    if (Array.isArray(cmd) && cmd.length > 2) {
      ;(type1 = cmd[1]), (type2 = cmd[2])
      cmd = String(cmd[0])
    } else {
      cmd = Array.isArray(cmd) ? String(cmd[0]) : cmd
      const sp = cmd.replace("OidbSvcTrpcTcp.", "").split("_")
      ;(type1 = parseInt(sp[0], 16)), (type2 = parseInt(sp[1]))
    }
    const _body = {
      1: type1,
      2: type2,
      4: body,
      ...(bot?.adapter?.name === "OneBotv11"
        ? {
            12: 1
          }
        : {
            6: "android " + (bot?.apk?.ver || "9.0.90")
          })
    }
    const rsp = await Send(e, cmd, _body, false, isQQ)
    return rsp[4]
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`)
  }
}

export const Elem = async (e, content1, content2 = null) => {
  try {
    const rich = {
      2: typeof content1 === "object" ? content1 : JSON.parse(content1),
      4: null
    }
    if (content2) rich[4] = content2
    const packet = {
      1: {
        [e.isGroup ? "2" : "1"]: {
          1: e.isGroup ? e.group_id : e.user_id
        }
      },
      2: {
        1: 1,
        2: 0,
        3: 0
      },
      3: {
        1: rich
      },
      4: RandomUInt(),
      5: RandomUInt()
    }

    return Send(e, "MessageSvc.PbSendMsg", packet)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`)
  }
}

export const SendLong_msg = async (e, resid) => {
  try {
    const elem = {
      37: {
        6: 1,
        7: resid,
        17: 0,
        19: {
          15: 0,
          31: 0,
          41: 0
        }
      }
    }
    return Elem(e, elem)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`)
  }
}

export const Long = async (e, content) => {
  try {
    const resid = await sendLong(e, content)
    const elem = {
      37: {
        6: 1,
        7: resid,
        17: 0,
        19: {
          15: 0,
          31: 0,
          41: 0
        }
      }
    }
    return Elem(e, elem)
  } catch (error) {
    logger.error(`sendMessage failed: ${error.message}`)
  }
}

export const sendLong = async (e, content) => {
  const data = {
    2: {
      1: "MultiMsg",
      2: {
        1: [
          {
            3: {
              1: {
                2: typeof content === "object" ? content : JSON.parse(content)
              }
            }
          }
        ]
      }
    }
  }
  const compressedData = await gzip(pb.encode(data))
  const target = e.isGroup ? BigInt(e.group_id) : e.user_id

  const packet = {
    2: {
      1: e.isGroup ? 3 : 1,
      2: {
        2: target
      },
      3: `${target}`,
      4: compressedData
    },
    15: {
      1: 4,
      2: 2,
      3: 9,
      4: 0
    }
  }

  const resp = await Send(e, "trpc.group.long_msg_interface.MsgService.SsoSendLongMsg", packet)
  return resp?.["2"]?.["3"]
}

export const recvLong = async (e, resid) => {
  const packet = {
    1: {
      2: resid,
      3: true
    },
    15: {
      1: 2,
      2: 0,
      3: 0,
      4: 0
    }
  }

  const resp = await Send(e, "trpc.group.long_msg_interface.MsgService.SsoRecvLongMsg", packet)
  return pb.decode(await gunzip(resp?.["1"]?.["4"]))
}

export const getMsg = async (e, message_id, isSeq = false, cnt = 1, group, isQQ = false) => {
  const bot = isQQ ? Bot[e] : e.bot
  const group_id = isQQ ? group : e.group_id
  const targetValue = isSeq ? message_id : await bot.sendApi("get_msg", { message_id: message_id })
  const seq = parseInt(isSeq ? targetValue : targetValue?.real_seq ?? targetValue?.message_seq)
  if (!seq) throw new Error("获取seq失败，请尝试更新napcat")
  const packet = {
    1: {
      1: group_id,
      2: seq - cnt + 1,
      3: Number(seq)
    },
    2: 1
  }
  return Send(e, "trpc.msg.register_proxy.RegisterProxy.SsoGetGroupMsg", packet, false, isQQ)
}

// 仅用于方便用户手动输入pb时使用，一般不需要使用
export const processJSON = (json) => _processJSON(typeof json === "string" ? JSON.parse(json) : json)

function _processJSON(json, path = []) {
  const result = {}
  if (Buffer.isBuffer(json) || json instanceof Uint8Array) {
    return json
  } else if (Array.isArray(json)) {
    return json.map((item, index) => processJSON(item, path.concat(index + 1)))
  } else if (typeof json === "object" && json !== null) {
    for (const key in json) {
      const numKey = Number(key)
      if (Number.isNaN(numKey)) {
        throw new Error(`Key is not a valid integer: ${key}`)
      }
      const currentPath = path.concat(key)
      const value = json[key]

      if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          result[numKey] = value.map((item, idx) => processJSON(item, currentPath.concat(String(idx + 1))))
        } else {
          result[numKey] = processJSON(value, currentPath)
        }
      } else {
        if (typeof value === "string") {
          if (value.startsWith("hex->")) {
            const hexStr = value.slice("hex->".length)
            if (isHexString(hexStr)) {
              result[numKey] = Buffer.from(hexStr, "hex")
            } else {
              result[numKey] = value
            }
          } else if (currentPath.slice(-2).join(",") === "5,2" && isHexString(value)) {
            result[numKey] = Buffer.from(value, "hex")
          } else {
            result[numKey] = value
          }
        } else {
          result[numKey] = value
        }
      }
    }
  } else {
    return json
  }
  return result
}

function isHexString(s) {
  return s.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(s)
}
