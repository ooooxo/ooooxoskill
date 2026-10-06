# 按文件反查（自动生成，勿手改）

改一个文件前先 grep 它的文件名：属于哪个域、在哪些业务循环里、注释引了哪些 ADR（只读这几条）。
服务端路径相对 `server`，客户端相对 `client`。ADR 后面没写状态的就是有效。

| 文件 | 域 | 业务循环 | ADR |
|---|---|---|---|
| 客户端 src/api/client.ts | 前端/请求与推送 | DELETE /api/Projects/{id:int}、POST /api/Projects/{id:int}/archive |  |
| 客户端 src/api/health.js | 前端/请求与推送 |  |  |
| 客户端 src/api/tags.ts | 前端/请求与推送 | POST /api/Tags |  |
| 客户端 src/api/todos.ts | 前端/请求与推送 | DELETE /api/todos/{id:int}、POST /api/todos、PUT /api/todos/{id:int} |  |
| 客户端 src/components/ChatPanel.vue | 前端/界面 |  |  |
| 客户端 src/components/ProjectList.vue | 前端/界面 | DELETE /api/Projects/{id:int}、POST /api/Projects/{id:int}/archive |  |
| 客户端 src/components/TagList.vue | 前端/界面 | POST /api/Tags |  |
| 客户端 src/realtime.ts | 前端/请求与推送 |  |  |
| 客户端 src/views/TodosView.vue | 前端/界面 | DELETE /api/todos/{id:int}、POST /api/todos、PUT /api/todos/{id:int} |  |
| 服务端 Api/Controllers/CrudController.cs | Projects | DELETE /api/Projects/{id:int} |  |
| 服务端 Api/Controllers/ProjectsController.cs | Projects | POST /api/Projects/{id:int}/archive |  |
| 服务端 Api/Controllers/TagsController.cs | Tags | POST /api/Tags |  |
| 服务端 Api/Endpoints/TodoEndpoints.cs | TodoEndpoints | DELETE /api/todos/{id:int}、POST /api/todos、PUT /api/todos/{id:int} |  |
| 服务端 Api/Hubs/ChatHub.cs | 实时 | DELETE /api/todos/{id:int}、POST /api/todos、PUT /api/todos/{id:int} |  |
| 服务端 Api/Program.cs | Program |  |  |
| 服务端 Api/Workers/Workers.cs | 服务 |  |  |
| 服务端 Core/Projects/ArchiveProject.cs | Projects | POST /api/Projects/{id:int}/archive |  |
| 服务端 Core/Projects/Repository.cs | Projects |  |  |
| 服务端 Core/Todos/TodoService.cs | 服务 | DELETE /api/todos/{id:int}、POST /api/todos、PUT /api/todos/{id:int} |  |
