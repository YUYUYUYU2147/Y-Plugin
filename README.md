# Y-Plugin (个人维护版)

适用于 [Yunzai-Bot](https://github.com/TimeRainStarSky/Yunzai) / [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai)

> **原作者：Lovely-02** —— 其仓库已被删除，GitHub / Gitee / GitCode 上的链接均已不可访问（实测均返回 404）。原作者的 GitHub 账号仍在：<https://github.com/Lovely-02>
>
> **现维护者：鱼鱼鱼鱼** —— <https://github.com/YUYUYUYU2147/Y-Plugin>
>
> 本仓库与原版已产生分歧，是独立维护的分支，**不保证与原版功能一致**。若需要原始版本，只能通过原作者的 GitHub 账号寻找。

## 主要修改

### B站模块

| 修改 | 说明 |
|------|------|
| **web QR 登录** | 扫码捕获 SESSDATA + refresh_token，尝试兑换 access_token |
| **`#B站设置token`** | 手动填入 access_token（web 无法兑换 app token 的降级入口） |
| **直播查询(getlivefeed)** | app feed API → B站 followings + room status web API |
| **info 降级** | myinfo2(app) 失败降级到 web API `/x/web-interface/nav` |
| **feed 降级** | 无 access_token 时走 web rcmd API + BV 解析 |
| **投币/分享/三连** | 无 access_token 时跳过提示（不报错） |
| **签到 catch 修复** | 失败时 `continue` 防止仍设 redis 已签到标记 |
| **SignAll redis 修复** | `issign = true` 移入 try 成功分支 |
| **SignLog 空文件修复** | `readFileSync` 前检查 `fs.existsSync` |
| **@bot 误判修复** | `getTargetUserID` 过滤 bot 自身 @ |
| **关注列表** | `#我的关注` / `#我的关注列表` |
| **帮助清理** | 移除无 access_token 不可用的功能条目 |

### 其他修复

以下改动可从本仓库的版本历史逐条追溯。

| 修改 | 说明 |
|------|------|
| **`#抽幸运字符` cookie 获取** | 同时请求 `qun.qq.com`(skey) 与 `qq.com`(p_skey) 两个域，修 cookie 取不到 |
| **`#抽幸运字符` 超时与进度** | 加超时与进度提示，减少 cookie 重试 |
| **接口返回非 JSON 的处理** | 新增 `safeJson()`。服务端异常分支会返回纯文本、网关风控会返回 HTML 错误页，直接 `.json()` 会抛 `SyntaxError` 把真实原因掩盖掉；改为先读文本按内容尝试解析，失败时回退为带原始片段的结构化结果并记警告 |
| **引用消息回复联系主人** | 修好该路径 |
| **联系主人** | 发送者信息存 Redis；过滤主人消息中的回复段 |
| **锅巴 AutoPath 标签** | 缩短标签，避免被开关遮挡 |
| **Y 帮助** | 补上非 B 站 app 的功能 |
| **仓库更新检查** | GitHub API 改走 `gh-proxy`。本机到 `api.github.com` 的链路不稳（实测连续 8 次失败 3 次，HTTP/1.1 与 HTTP/2 均失败），直连会让三个仓库的更新检查一起报错；改走代理后实测 5/5 成功、单次约 0.25 秒 |

### 已知限制

- **access_token**：iOS 无法抓包，web QR 的 refresh_token 无法兑换为 app access_token（返回 -400）
- **IP 风控**：服务器 IP 被 B站 anti-bot 标记，web 写接口（投币/分享等）返回 -401/-403
- **投币/点赞/三连/收藏/评论/关系操作**：均需 access_token（app API 或未风控的 web API），当前不可用
- **签到**：观看/经验/漫画任务正常（SESSDATA），投币/分享跳过

## 安装

```bash
git clone --depth=1 https://github.com/YUYUYUYU2147/Y-Plugin.git ./plugins/Y-Plugin/
pnpm install
```

## 使用

请使用 `#Y帮助` `#B站帮助` 获取完整帮助

## 免责声明

1. 本插件均为开源项目，严禁将本库内容用于任何商业用途或违法行为
2. 素材均来自于网络，仅供交流学习使用，如有侵权请联系，会立即删除
