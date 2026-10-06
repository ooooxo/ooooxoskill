# 整理工作单（自动生成，勿手改）

给 agent 用：按业务把控制器归成域、给循环和流程起人话名、把图整理得好读。整理只写进 atlas.json；抽取出来的事实每次重跑照常更新，不会覆盖整理过的东西。做完重跑 run.sh，这里会变短。
取名先用 CONTEXT.md 里的词，其次 ADR 标题、代码注释；代码和文档里都没有的业务说法不要发明，拿不准的问用户。
本项目的取名材料：没有 CONTEXT.md · ADR 3 条有效（adr.md）

## 域（13 个，0 个还是控制器原名）

按业务归类：同一块业务的 `S:c:控制器` 放进同一个域的 match，改 name、写一句 desc；域里卡多就用 groups 按功能分组。

- **前端** `client`
  - **界面** `client.ui`
  - **状态 stores** `client.stores` · ADR 0001「发消息只起轮次，轮次在后台跑」
  - **请求与推送** `client.svc`
  - **桌面端 Tauri** `client.desktop` · ADR 0001「托盘快发走 Rust 命令，不开主窗口」
- **HTTP 管线** `pipe`
- **实时** `hub`
- **账号** `auth` · 端点 2：注册、登录 · 写 User、Wallet、LedgerEntry
- **项目与对话** `projects` · 端点 3：我的项目列表、新建项目、发消息 · 写 Project、Turn、Interjection、Message、Wallet 等 7 条 · ADR 0001「发消息只起轮次，轮次在后台跑」
- **Agent 轮次** `agent` · ADR 0001「发消息只起轮次，轮次在后台跑」
- **服务层** `svc` · ADR 0003「扣费不透支：余额不够直接拒」
- **数据库** `pg`
- **外部模型** `ext`

## 业务循环没起名（0 条）

写进 loops：`"动词 路由": ["人话名", "一句话：谁在什么时候做什么，落到哪"]`

- 没有了

## 流程没起名（2 条：GET 查询与后台流程）

写进 flows：`"流程 id": { "name": "人话名", "story": "一句话" }`（只起名、不写 tree，流程图仍用自动草稿；值得细讲的按 docs/flows.md 写 tree）

- `hub:ProjectHub.JoinProject` · 加入项目频道 · 域 实时 · 「加入项目频道」
- `hub:ProjectHub.LeaveProject` · 离开项目频道 · 域 实时 · 「离开项目频道」

## 图不好读的地方

### 域没写介绍（11）

域的 desc 写一句它管什么业务，抽屉和 index.md 的域树都用它。

- 前端 `client`
- 前端/界面 `client.ui`
- 前端/状态 stores `client.stores`
- 前端/请求与推送 `client.svc`
- 前端/桌面端 Tauri `client.desktop`
- 实时 `hub`
- 账号 `auth`
- 项目与对话 `projects`
- 服务层 `svc`
- 数据库 `pg`
- 外部模型 `ext`

### 一个域直接挂太多卡、没分组（0）

超过 8 张就该分组：`groups: { "D:域 id": [{ "name": "功能", "icon": "…", "match": ["正则：匹配 名字 动词 路由 文件"] }] }`，漏一张 build 会报出来。

- 没有了

### 域与域之间线多却没写字（前 12 对，按线数排）

线上写一句业务话（「下单时扣积分」），比「调用」好读：`edgeLabels: [{ "from": "域 id", "to": "域 id", "label": "…" }]`

- Agent 轮次 → 数据库 `agent → pg` · 15 条 reads/writes
- Agent 轮次 → 实时 `agent → hub` · 6 条 calls
- 服务层 → 数据库 `svc → pg` · 5 条 writes
- Agent 轮次 → 前端/状态 stores `agent → client.stores` · 4 条 push
- 前端/状态 stores → 前端/请求与推送 `client.stores → client.svc` · 4 条 calls
- 前端/界面 → 前端/请求与推送 `client.ui → client.svc` · 4 条 calls
- 账号 → 数据库 `auth → pg` · 3 条 reads/writes
- 前端/请求与推送 → 项目与对话 `client.svc → projects` · 3 条 request
- 前端/界面 → 前端/状态 stores `client.ui → client.stores` · 3 条 calls
- 前端/请求与推送 → 账号 `client.svc → auth` · 2 条 request
- 前端/请求与推送 → 实时 `client.svc → hub` · 2 条 invoke
- 项目与对话 → 数据库 `projects → pg` · 2 条 reads/writes
