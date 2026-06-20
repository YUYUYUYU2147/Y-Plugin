# Y-Plugin (个人维护版)

基于 [Lovely-02/Y-Plugin](https://github.com/Lovely-02/Y-Plugin) 的个人 fork，适用于 [Yunzai-Bot](https://github.com/TimeRainStarSky/Yunzai) / [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai)

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
