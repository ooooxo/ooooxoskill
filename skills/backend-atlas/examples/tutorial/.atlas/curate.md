# 整理工作单（自动生成，勿手改）

给 agent 用：按业务把控制器归成域、给循环和流程起人话名、把图整理得好读。整理只写进 atlas.json；抽取出来的事实每次重跑照常更新，不会覆盖整理过的东西。做完重跑 run.sh，这里会变短。
取名先用 CONTEXT.md 里的词，其次 ADR 标题、代码注释；代码和文档里都没有的业务说法不要发明，拿不准的问用户。
本项目的取名材料：没有 CONTEXT.md · ADR 0 条有效（adr.md）

## 域（10 个，4 个还是控制器原名）

按业务归类：同一块业务的 `S:c:控制器` 放进同一个域的 match，改 name、写一句 desc；域里卡多就用 groups 按功能分组。

- **前端** `client`
  - **界面** `client.ui`
  - **请求与推送** `client.svc`
- **实时** `hub`
- **Program** `program`（还是控制器原名） · 端点 1：GET /api/health
- **Projects** `projects`（还是控制器原名） · 端点 3：POST /api/Projects/{id:int}/archive、All、DELETE /api/Projects/{id:int} · 写 Project、AuditLog
- **Tags** `tags`（还是控制器原名） · 端点 2：List、POST /api/Tags · 写 Tag
- **TodoEndpoints** `todoendpoints`（还是控制器原名） · 端点 5：GET /api/todos、GetById、POST /api/todos、PUT /api/todos/{id:int}、DELETE /api/todos/{id:int} · 写 Todo、AuditLog
- **服务** `svc`
- **数据库** `db`

## 业务循环没起名（6 条）

写进 loops：`"动词 路由": ["人话名", "一句话：谁在什么时候做什么，落到哪"]`

- `POST /api/todos` · TodoEndpoints.POST /api/todos · 写 Todo、AuditLog · 推 TodoChanged · 前端 TodosView
- `PUT /api/todos/{id:int}` · TodoEndpoints.PUT /api/todos/{id:int} · 写 Todo · 推 TodoChanged · 前端 TodosView
- `DELETE /api/todos/{id:int}` · TodoEndpoints.DeleteTodo · 写 Todo · 推 TodoChanged · 前端 TodosView
- `POST /api/Projects/{id:int}/archive` · ProjectsController.Archive · 写 Project、AuditLog · 前端 ProjectList
- `DELETE /api/Projects/{id:int}` · CrudController.Delete · 前端 ProjectList
- `POST /api/Tags` · TagsController.Create · 写 Tag · 前端 TagList

## 流程没起名（7 条：GET 查询与后台流程）

写进 flows：`"流程 id": { "name": "人话名", "story": "一句话" }`（只起名、不写 tree，流程图仍用自动草稿；值得细讲的按 docs/flows.md 写 tree）

- `e:GET /api/todos` · GET /api/todos · 域 TodoEndpoints
- `e:GET /api/todos/{id:int}` · GET /api/todos/{id:int} · 域 TodoEndpoints
- `e:GET /api/health` · GET /api/health · 域 Program
- `e:GET /api/Projects` · GET /api/Projects · 域 Projects
- `e:GET /api/Tags` · GET /api/Tags · 域 Tags
- `hub:ChatHub.SendMessage` · ChatHub.SendMessage · 域 实时
- `bg:CleanupWorker` · TimedWorker.ExecuteAsync · 域 服务 · 「每 10 分钟清掉已完成的待办」 · 写 Todo

## 图不好读的地方

### 域没写介绍（10）

域的 desc 写一句它管什么业务，抽屉和 index.md 的域树都用它。

- 前端 `client`
- 前端/界面 `client.ui`
- 前端/请求与推送 `client.svc`
- 实时 `hub`
- Program `program`
- Projects `projects`
- Tags `tags`
- TodoEndpoints `todoendpoints`
- 服务 `svc`
- 数据库 `db`

### 一个域直接挂太多卡、没分组（0）

超过 8 张就该分组：`groups: { "D:域 id": [{ "name": "功能", "icon": "…", "match": ["正则：匹配 名字 动词 路由 文件"] }] }`，漏一张 build 会报出来。

- 没有了

### 域与域之间线多却没写字（前 12 对，按线数排）

线上写一句业务话（「下单时扣积分」），比「调用」好读：`edgeLabels: [{ "from": "域 id", "to": "域 id", "label": "…" }]`

- 前端/界面 → 前端/请求与推送 `client.ui → client.svc` · 12 条 calls
- 服务 → 数据库 `svc → db` · 7 条 reads/writes
- TodoEndpoints → 服务 `todoendpoints → svc` · 5 条 calls
- 前端/请求与推送 → TodoEndpoints `client.svc → todoendpoints` · 4 条 request
- 前端/请求与推送 → Projects `client.svc → projects` · 3 条 request
- 服务 → 实时 `svc → hub` · 3 条 calls
- 前端/请求与推送 → Tags `client.svc → tags` · 2 条 request
- 实时 → 前端/界面 `hub → client.ui` · 2 条 push
- Projects → 数据库 `projects → db` · 2 条 writes
- Tags → 数据库 `tags → db` · 2 条 reads/writes
- 前端/请求与推送 → 实时 `client.svc → hub` · 1 条 invoke
- 前端/请求与推送 → Program `client.svc → program` · 1 条 request
