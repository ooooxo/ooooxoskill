# Api 系统图 · agent 索引（自动生成，勿手改）

事实来自代码抽取，域 / 循环名 / 流程来自 atlas.json，决策来自 docs/adr 和代码注释里的 ADR 引用。要改内容就改这三处，再重跑 run.sh。

- 改某个文件前：在 by-file.md 里 grep 它的文件名，看它属于哪个域、在哪些业务循环里、哪些 ADR 管着它，只读那几条 ADR。
- 找决策：按关键词 grep adr.md（一条一行，别整个读进来）。看一条业务怎么跑：flows/index.md，再只读那一条的文件。
- 整理（按业务归类、起名、让图好读）：curate.md。第一次接项目先做这一步；以后新增的端点 / 流程也从这里补。

## 全貌

域 10 · 端点 11 · 业务循环 6（起了名 0） · 流程 13（有名字 0，整理成树 0）· ADR 0（有效 0，注释引用 0 处）

## 域

- **前端**
  - **界面**
  - **请求与推送**
- **实时**
- **Program** · 端点 1
- **Projects** · 端点 3 · 循环：POST /api/Projects/{id:int}/archive、DELETE /api/Projects/{id:int}
- **Tags** · 端点 2 · 循环：POST /api/Tags
- **TodoEndpoints** · 端点 5 · 循环：POST /api/todos、PUT /api/todos/{id:int}、DELETE /api/todos/{id:int}
- **服务**
- **数据库**

## 还差什么

逐步打磨就从这里挑；做完重跑 run.sh，这里会跟着变。

- 体检「多域共写」1 项：AuditLog
- 域还是控制器原名 4 个：Program、Projects、Tags、TodoEndpoints（curate.md，按业务合并、起名）
- 业务循环没起人话名 6 条：POST /api/todos、PUT /api/todos/{id:int}、DELETE /api/todos/{id:int}、POST /api/Projects/{id:int}/archive、DELETE /api/Projects/{id:int} 等 6 条（curate.md）
- 流程没起名 7 条（GET 查询与后台流程，curate.md）
- 图不好读：域没写介绍 10 · 挂太多卡没分组 0 · 域间连线没写字 12（curate.md）
- 流程还是草稿 13 条，最值得整理的：TimedWorker.ExecuteAsync、POST /api/todos、DELETE /api/todos/{id:int}、PUT /api/todos/{id:int}、GET /api/todos/{id:int} 等 13 条（见 flows/index.md）
