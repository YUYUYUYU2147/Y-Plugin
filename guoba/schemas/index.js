import Bili from "./Bili.js"
import CodeUpdate from "./CodeUpdate.js"
import randoms from "./randoms.js"
import sendMaster from "./SendMaster.js"
import poke from "./poke.js"
import summary from "./Summary.js"
import Signature from "./Signature.js"
import proxy from "./proxy.js"
import other from "./other.js"
import { Config } from "#components"

export const schemas = [Bili, CodeUpdate, randoms, sendMaster, poke, summary, Signature, proxy, other].flat()

export function getConfigData() {
  const configKeys = ["Bili", "CodeUpdate", "randoms", "sendMaster", "poke", "summary", "Signature", "proxy", "other"]
  return configKeys.reduce((acc, key) => {
    acc[key] = Config[key]
    return acc
  }, {})
}

export async function setConfigData(data, { Result }) {
  for (const key in data) {
    Config.modify(...key.split("."), data[key])
  }
  return Result.ok({}, "Ciallo～(∠・ω< )⌒☆")
}
