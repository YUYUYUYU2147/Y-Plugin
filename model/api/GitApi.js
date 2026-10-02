import { request, Config } from '#components'
import { logger } from '#lib'

const GitUrl = {
  GitHub: 'https://api.github.com/repos',
  Gitee: 'https://gitee.com/api/v5/repos',
  Gitcode: 'https://api.gitcode.com/api/v5/repos',
  CNB: 'https://api.cnb.cool'
}

/**
 * 日志里打 URL 前必须过这个。
 *
 * 访问令牌是作为查询参数挂在 URL 上的（见下方 urlObj.searchParams.set('access_token', token)），
 * 而错误分支会把完整 URL 写进日志。实测 logs/error.log 里因此积了 34 处明文
 * token，而且链路越不稳、报错越多，抄写得越勤。
 *
 * 按名字脱敏而不是只针对 access_token：Gitee / GitCode 的令牌字段名不同，
 * 将来换数据源也不会又漏出去。
 */
const SENSITIVE_QUERY = /([?&](?:access_token|token|api_key|apikey|secret|password)=)[^&#\s]*/gi

export const redactUrl = url => String(url ?? '').replace(SENSITIVE_QUERY, '$1***')

const ApiUrl = source => {
  const CfgApiUrl = Config.CodeUpdate.repos.reduce((acc, item) => {
    acc[item.provider] = item.ApiUrl
    return acc
  }, {})
  return CfgApiUrl[source] || GitUrl[source]
}

export default new (class {
  /**
   * 获取仓库的最新数据
   * @param {string} repo - 仓库路径（用户名/仓库名）
   * @param {string} source - 数据源（GitHub/Gitee/Gitcode）
   * @param {string} type - 请求类型（commits/releases）
   * @param {string} token - 访问Token
   * @param {string} sha - 提交起始的SHA值或者分支名. 默认: 仓库的默认分支
   * @returns {Promise<object[]>} 提交数据或false（请求失败）
   */
  async getRepositoryData(repo, source, type = 'commits', token, sha) {
    const sourceLower = String(source || '').toLowerCase()
    // const isGitHub = /github/i.test(sourceLower)
    const isGitea = /gitea/i.test(sourceLower)
    const isGitee = /gitee/i.test(sourceLower)
    const isGitcode = /gitcode/i.test(sourceLower)
    const isCNB = /cnb/i.test(sourceLower)

    const baseURL = ApiUrl(source)
    if (!baseURL) {
      logger.error(`未知数据源: ${source}`)
      return 'return'
    }

    let pathname = ''
    const params = new URLSearchParams()

    if (type === 'commits' && sha) {
      if (isGitea) {
        // Gitea: /{repo}/commits?per_page=1&sha={sha}
        pathname = `${repo}/commits`
        params.set('page', '1')
        params.set('sha', sha)
      } else if (isCNB) {
        pathname = `${repo}/-/git/commits/${sha}`
      } else {
        pathname = `${repo}/commits/${sha}`
        if (isGitcode) params.set('show_diff', 'true')
      }
    } else {
      if (isCNB) {
        pathname = `${repo}/-/git/${type}`
        params.set('page', '1')
      } else {
        pathname = `${repo}/${type}`
        isGitea ? params.set('page', '1') : params.set('per_page', '1')
      }
    }

    const joinUrl = (base, relative) => {
      try {
        const u = new URL(base)
        const basePath = (u.pathname || '').replace(/\/+$/, '')
        const rel = String(relative).replace(/^\/+/, '')
        u.pathname = basePath === '' ? `/${rel}` : `${basePath}/${rel}`
        return u.toString()
      } catch (e) {
        const b = String(base).replace(/\/+$/, '')
        const r = String(relative).replace(/^\/+/, '')
        return `${b}/${r}`
      }
    }

    const urlBaseWithPath = joinUrl(baseURL, pathname)
    let urlObj
    try {
      urlObj = new URL(urlBaseWithPath)
    } catch (e) {
      logger.error('构造 URL 失败', { baseURL, pathname, err: e })
      return 'return'
    }

    for (const [k, v] of params.entries()) urlObj.searchParams.set(k, v)

    if (!isGitee && token) urlObj.searchParams.set('access_token', token)

    const headers = this.getHeaders(token, source)

    try {
      const data = await this.fetchData(urlObj.toString(), headers, repo, source, baseURL)
      if (type === 'commits' && !Array.isArray(data) && data !== 'return' && data !== false) {
        logger.mark(
          `[结构] ${repo} 返回的是${typeof data}（不是数组），keys=${Object.keys(data || {}).slice(0, 4).join(',')}`
        )
      }
      return data || 'return'
    } catch (err) {
      logger.error('获取仓库数据失败', { url: redactUrl(urlObj.toString()), err })
      return 'return'
    }
  }

  /**
   * 获取仓库默认分支
   * @param {string} repo - 仓库路径（用户名/仓库名）
   * @param {string} source - 数据源（GitHub/Gitee/Gitcode）
   * @param {string} token - 访问Token
   * @returns {Promise<string|false>} 默认分支名或false（请求失败）
   */
  async getDefaultBranch(repo, source, token) {
    const baseURL = ApiUrl(source)
    const isCNB = /cnb/i.test(source)

    if (!baseURL) {
      logger.error(`未知数据源: ${source}`)
      return 'return'
    }
    let url = `${baseURL}/${repo}`
    if (isCNB) url = `${baseURL}/${repo}/-/git/head`

    const headers = this.getHeaders(token, source)
    const data = await this.fetchData(url, headers, repo, source, baseURL)
    if (data) {
      return isCNB ? data?.name : data?.default_branch
    } else {
      return 'return'
    }
  }

  /**
   * 获取请求头
   * @param {string} token - 访问Token
   * @param {string} source - 数据源（GitHub/Gitee/Gitcode）
   * @returns {object} 请求头
   */
  getHeaders(token, source) {
    const headers = {
      'User-Agent': 'request',
      Accept: (() => {
        switch (source) {
          case 'GitHub':
            return 'application/vnd.github+json'
          case 'Gitee':
            return 'application/vnd.gitee+json'
          default:
            return 'application/json'
        }
      })()
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  /**
   * 获取指定 URL 的 JSON 数据
   * @param {string} url - 请求的 URL
   * @param {object} [headers] - 请求头
   * @param {string} repo - 仓库路径
   * @param {string} source - 数据源
   * @returns {Promise<object | false>} 返回请求的数据或 false（请求失败）
   */
  /**
   * 把前缀代理地址换回官方地址。
   *
   * 形如 https://gh-proxy.com/https://api.github.com/repos/a/b?access_token=xxx
   * 换成 https://api.github.com/repos/a/b，并去掉 access_token 查询参数 ——
   * GitHub 已不再支持用查询参数认证，认证只认 Authorization 头。
   *
   * 本来就是官方地址（或没给 baseURL）时返回空串，表示没什么可换的。
   */
  directUrl(url, baseURL, source) {
    const official = GitUrl[source]
    if (!official || !baseURL) return ''
    const base = String(baseURL).replace(/\/+$/, '')
    if (String(url).startsWith(official)) return ''
    if (!String(url).startsWith(base)) return ''
    const u = new URL(official + String(url).slice(base.length))
    u.searchParams.delete('access_token')
    return u.toString()
  }

  async fetchData(url, headers = {}, repo, source, baseURL = '') {
    try {
      let response = await request.get(url, {
        headers,
        responseType: 'raw'
      })

      // 前缀代理（gh-proxy 之类）只把 URL 转发给上游，不会带上 Authorization 头，
      // 于是私库一律 404 —— 代理看得见地址、看不见凭据。实测同一私库：
      //   经代理 + Authorization 头        404
      //   经代理 + ?access_token=          404
      //   经代理 + 无认证                  404
      //   直连 + Authorization 头          200
      //
      // 所以拿到 404 且手里有 token 时，改用官方地址再试一次。公开仓库本来就能
      // 走通代理，不会触发这段，所以代理的速度和稳定性对它们没有影响。
      if (response.status === 404 && headers.Authorization && baseURL) {
        const direct = this.directUrl(url, baseURL, source)
        if (direct) {
          logger.mark(`[GitApi] ${repo} 代理取不到，改走官方地址重试（多半是私库）`)
          try {
            response = await request.get(direct, {
              headers,
              responseType: 'raw'
            })
            logger.mark(
              `[回退结果] ${repo} ok=${response?.ok} status=${response?.status} 有headers=${!!response?.headers} body长度=${response?.body?.length ?? '-'}`
            )
          } catch (err) {
            logger.error(`回退官方地址失败: ${redactUrl(direct)}，${err.message}`)
            // 回退失败时 response 仍是之前那个 404，后面会拿它当结果继续走，
            // 于是报出「状态码：404」——看着像代理的错，其实直连才是失败的那个。
            return false
          }
        }
      }

      if (!response || !response.ok) {
        let msg
        switch (response?.status) {
          case 401:
            msg = '访问令牌无效或已过期 (code: 401)'
            break
          case 403:
            msg = '请求达到Api速率限制或无权限，请尝试填写token或降低请求频率后重试 (code: 403)'
            break
          case 404:
            msg = '仓库不存在 (code: 404)'
            break
          default:
            msg = `状态码：${response.status}`
            break
        }

        logger.error(`请求 ${logger.magenta(source)} 失败: ${logger.cyan(repo)}, ${msg}`)
        return false
      }

      const contentType = response?.headers?.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        logger.error(`响应非 JSON 格式: ${redactUrl(url)} , 内容：${await response.text()}`)
        return false
      }

      return await response.json()
    } catch (error) {
      logger.error(`请求失败: ${redactUrl(url)}，错误信息: ${error.stack}`)
      return false
    }
  }
})()
