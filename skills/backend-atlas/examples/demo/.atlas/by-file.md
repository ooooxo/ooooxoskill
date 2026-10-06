# 按文件反查（自动生成，勿手改）

改一个文件前先 grep 它的文件名：属于哪个域、在哪些业务循环里、注释引了哪些 ADR（只读这几条）。
服务端路径相对 `server`，客户端相对 `client`。ADR 后面没写状态的就是有效。

| 文件 | 域 | 业务循环 | ADR |
|---|---|---|---|
| 客户端 src-tauri/src/lib.rs | 前端/桌面端 Tauri | 发消息 | 0001 |
| 客户端 src/services/api.ts | 前端/请求与推送 | 新建项目、注册、登录 |  |
| 客户端 src/services/http.ts | 前端/请求与推送 |  |  |
| 客户端 src/services/hub.ts | 前端/请求与推送 |  |  |
| 客户端 src/stores/chat.ts | 前端/状态 stores |  | 服务端 0001 |
| 客户端 src/views/ChatView.vue | 前端/界面 | 发消息、新建项目 |  |
| 客户端 src/views/LoginView.vue | 前端/界面 | 注册、登录 |  |
| 客户端 src/views/QuickSend.vue | 前端/界面 | 发消息 |  |
| 服务端 Agent/LeaseSweeper.cs | Agent 轮次 |  |  |
| 服务端 Agent/ModelClient.cs | Agent 轮次 | 发消息 |  |
| 服务端 Agent/Tools.cs | Agent 轮次 | 发消息 |  |
| 服务端 Agent/TurnHost.cs | Agent 轮次 | 发消息 |  |
| 服务端 Agent/TurnRunner.cs | Agent 轮次 | 发消息 |  |
| 服务端 Agent/TurnService.cs | Agent 轮次 | 发消息 | 0001、0002 作废 |
| 服务端 Auth/AuthController.cs | 账号 | 注册、登录 |  |
| 服务端 Billing/WalletService.cs | 服务层 | 发消息、注册 | 0003 待确认 |
| 服务端 Data/AppDb.cs |  |  | 0009 不存在 |
| 服务端 Projects/ProjectsController.cs | 项目与对话 | 发消息、新建项目 | 0001 |
| 服务端 Realtime/ProjectHub.cs | 实时 | 发消息 |  |
