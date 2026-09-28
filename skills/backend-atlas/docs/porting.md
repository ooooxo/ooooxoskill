# 接一个新项目

接新项目、图上缺东西、问「支持什么写法」时读。抽取器、join、viewer 都是通用的，项目差异全写在语义层（推荐放在项目根的 `atlas.json`，随项目仓库走），不改代码。
活样本：`examples/demo/`（自家写法：控制器 + agent 循环 + 事件信封 + Tauri）· `examples/tutorial/`（官方教程 / 分层项目写法：Minimal API + 多项目 + axios）。

## 步骤

1. **生成骨架**：`SEM=<项目>/atlas.json ./run.sh <server.csproj | .sln> <client-root | -> out/<项目>-atlas.html`，`atlas.json` 不存在就按抽取结果生成（每个控制器组一个域、全部循环键），直接出图。
2. **改成人话**：域名、合并域（把相关控制器的 `S:c:*` 放进同一个域的 `match`）、给 `loops` 起名字写一句故事；`title` / `subtitle`。
3. **按报错补**：build 报 `语义层没认领这些节点：…` 就补 `match`。叶子（具体文件 `S:f:<相对路径>`）只能精确点名，`*` 前缀只对组生效。
4. **服务层不用手分**：认领 `S:svc` 的域是共享域；服务文件按「谁在用」自动归位。后台域（Agent 轮次、worker 这类没有控制器的）要点名它的文件，它自己调出去的服务才算它在用。
5. **看体检**：「前端调用没对上」有东西就先看——要么是外部服务，要么是抽取漏了（见下面「支持范围」）。
6. **整理流程**：见 `docs/flows.md`。

## 支持范围

| 端 | 认得 | 不认 |
|---|---|---|
| 服务端入口 | 属性路由控制器（基类上的 `[Route]` / `[Authorize]`、继承自泛型基类的动作）· Minimal API（`MapGet/Post/Put/Delete/Patch/Methods`，`MapGroup` 前缀，lambda 或方法组，`RequireAuthorization` / `AllowAnonymous`，写在扩展方法里也行）· SignalR Hub（含 `Hub<T>`）· HostedService（`ExecuteAsync` 可在自己的抽象基类里）· Program.cs 顶层语句或 `Startup.Configure` | 常规路由 `MapControllerRoute`（没特性的动作）· Razor Pages / MVC 视图 · gRPC |
| 服务端下游 | 仓库内调用（接口 / 抽象按实现展开）· 多项目（`.csproj` 引用的项目，或整个 `.sln` / `.slnx`）· MediatR `Send` / `Publish` → 处理器 · EF Core（`DbSet` 属性 / 字段、`Set<实体>()`）· SignalR `SendAsync` / 强类型 `Clients.X.Method()` · HttpClient · 内存缓存 · 文件 IO | 泛型仓储里的 `Set<T>()`（实体运行时才知道）· Dapper / 原生 SQL 的表 · 反射 / 动态调用 |
| 客户端 | Vue 3（`<script setup>`、Options API）· TS 与 JS · create-vue 的 tsconfig references、`@/` 别名 · fetch（字面量 / 模板 / 常量拼接）· axios（`axios.get`、`axios.create({ baseURL })` 实例、`axios({ url, method })`）· 自己包的请求函数（路径 / 动词由调用方传，自动推断，可层层传）· SignalR JS 客户端（`on` / `invoke`，事件名不分大小写）· Pinia · Tauri（`invoke` / `listen` / Rust 命令） | React / Svelte / Angular 的组件入口（JSX 事件）· 运行时拼出来的 URL（`import.meta.env` 前缀之类）· WebSocket / socket.io 原生事件 |
| 运行 | macOS / Linux（bash）· 不在 git 里也行 · 路径含空格 / 中文 | Windows 原生（用 WSL） |

别的栈（Go / Node 服务端、React 客户端）是新写一条抽取腿，输出同构的 graph.json（形状见 `extractor/Model.cs`），join 与 viewer 不用动。

## 项目专属的归属规则（语义层可选字段）

| 字段 | 作用 | 例 |
|---|---|---|
| `homes.pipe` | 这些服务端文件归「HTTP 管线」（默认只认 `Program.cs`、`Extensions/` 与中间件入口所在文件） | `["ClientGate", "AdminAuth"]` |
| `homes.hub` | 这些归「实时」 | `["SignalHub/", "ConnectionRegistry"]` |
| `homes.bg` | 这些归「后台任务」 | `["BlobSweeper"]` |
| `uiSplit` | 客户端这些目录再往下细分一层（`src/panel/shell` → `panel/shell` 一张卡） | `["panel"]` |
| `database` | 表所在那张卡的名字（默认「数据库」） | `"PostgreSQL"` |

正则匹配服务端相对路径（多项目时相对各项目的公共父目录）。客户端目录约定：`stores/`、`store/`、`pinia/` → 状态；`services/`、`api/`、`http/`、`realtime/` 以及名字带 api / http / hub / socket 的文件 → 请求与推送；其余按 `src/` 下第一层目录成卡。

## 图标

默认用自带的 `viewer/icons.ts`（27 个通用实心图标）。项目有自己的图标注册表就 `ICONS=<path/to/icons.ts>`，要求导出 `icons: Record<string, string>`（24 网格 path 片段），且包含自带那一份的全部键名，缺一个 build 就报错。语义层里 `icon` 字段填这些键名。
