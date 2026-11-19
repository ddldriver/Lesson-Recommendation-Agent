# 选课推荐助手

桌面优先的 React 聊天 Demo。前端只请求本地 `/api/chat`；Node 服务端从 `.env` 读取 Coze PAT，再转发到工作流，不会将密钥打包进浏览器。

## 本地运行

```sh
pnpm install
pnpm dev
```

开发服务地址为 `http://127.0.0.1:5173`。`.env` 已被 Git 忽略，需配置 `COZE_API_TOKEN`；可参考 `.env.example`。工作流地址可通过 `COZE_WORKFLOW_URL` 覆盖。

前端提交 `conversation_id`、`user_query` 和 `history`，服务端按 Coze cURL 示例将这三个字段放在 JSON 顶层。回复优先读取 `data.reply`，并兼容该工作流实际返回的顶层 `final_reply`。

## 工作流输入字段

`conversation_id` 首次为空；后续请求将本次会话中已有的用户和助手消息作为 `history` 发送。
