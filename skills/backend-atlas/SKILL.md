---
name: backend-atlas
description: >
  「系统图」—— extract a whole-system map from real code (not from docs or memory): ASP.NET Core
  server via Roslyn + Vue/TS client via the TS compiler API + Tauri Rust via tree-sitter, joined
  deterministically into business loops (UI action → REST/WS/invoke → controller → service → table
  → SignalR push → receiver), rendered as one self-contained HTML. Use when the user wants to SEE
  how the system hangs together or trace one feature end to end: 「系统图 / 架构图 / 画一下整个系统
  / 业务循环 / 这个接口谁调的 / 这个按钮最后写了哪张表 / 推送谁收 / 端到端链路 / 重新出一版 atlas /
  更新系统图」. Also the REVERSE direction — design-first: open an editable canvas (blank, or over the
  real map) where the user double-clicks to add the domains / endpoints / tables / events they WANT,
  saved to intent/<project>.json; the agent reads that file plus its change log to work out with the
  user what structure they need, and planned-vs-real shows as dashed-vs-solid: 「画一下我想要的结构 /
  开个空白画布 / 意图图 / 我在画布上改了看看 / 按画布实现 / 还差哪些没做」. Not for single-file call
  questions a grep answers. Keywords: atlas 系统图 架构图 业务循环 调用链 意图 画布 intent canvas.
---

# backend-atlas

事实全由抽取器给（谁调谁、读写哪张表、推什么事件），人只写**语义层**（域怎么分、叫什么、循环讲什么）。图不猜：跨端连接只靠确定性对接——路由模板、Hub 事件名、Tauri 命令名、总线事件名；对不上的列进体检，不静默吞。

## 管线

```
extractor/  Roslyn  → server.graph.json   (.csproj + 它引用的项目，或整个 .sln/.slnx：Controller（含基类上的 Route/Authorize、继承的动作）·
                                          Minimal API（MapGet… + MapGroup 前缀）· Hub（含 Hub<T>）· HostedService · Program.cs / Startup 管线
                                          → 调用链（接口 / 抽象按实现展开，MediatR Send 接到处理器）→ EF 表（DbSet / Set<T>）/ SignalR / HttpClient / 缓存 / IO；
                                          + 每个入口的控制流骨架 flows：循环 · 分岔 · 护栏 · 结局原话 · try/catch · Task.Run 交给后台)
client/     TS API  → client.graph.json   (Vue 3（<script setup> / Options API）+ TS / JS：SignalR on / 总线 listen / 组件动作 → REST / invoke / emit；
                                          REST 认 fetch · axios（含实例 baseURL）· 自己包的请求函数（路径由调用方传，自动推断）；有 src-tauri 就补 Rust 腿；
                                          事件信封：一个 Hub 事件名装多种类型时按 e.type 分支拆成「事件#类型」)
join.ts             → system.json         (两端合并 + 跨端边 + 每个改状态的 HTTP 端点一条业务循环 + 没对上的前端调用 unmatched)
viewer/build.ts     → out.html            (语义层归并成 泳道 → 域 → 功能组 → 叶，内联 graph.html + Token.css；
                                          viewer/flows.ts 把 flows 转成流程树：整理过的按锚点核对，其余自动草稿；旁边写 flows/ 大纲：index.md + 每条流程一个文件)
viewer/serve.ts     → http://127.0.0.1    (可编辑：图 + intent.json 叠加；只监听本机)
```

## 跑

需要 .NET 10 SDK、bun、bash（macOS / Linux）。目标服务端能编译（有编译错直接退出）；没 restore 过会先 restore；客户端 `node_modules` 装了类型解析更准，不装也能跑；不在 git 里也能跑（版本记 nogit）。

```bash
cd <本 skill 目录>
SEM=<项目>/atlas.json ./run.sh <server.csproj | .sln> <client-root | -> out/<项目>-atlas.html
open out/<项目>-atlas.html        # Linux 用 xdg-open
```

- **语义层放在用户自己的项目仓库里**（推荐 `<项目根>/atlas.json`），不要放进 skill 目录——skill 更新会覆盖它。示例：`examples/demo/atlas.json`。
- **第一次接项目**：`SEM` 指向一个还不存在的文件，build 按抽取结果生成骨架（每个控制器组一个域、全部循环键）写到那里再出图。之后改名字 / 合并域 / 写循环故事，整趟重跑。
- 客户端写 `-` = 只有服务端。环境变量：`ICONS`（默认自带的 `viewer/icons.ts`）· `WORK`（中间件目录，默认按项目分开放在 `$TMPDIR`）· `FORCE=1`（强制全量）· `SHARE=1`（HTML 里不写本机绝对路径，发给别人时用）。

**增量**：每一段按输入内容哈希判断，没变就跳过——只改语义层 / 模板时整趟约 0.1–0.2 秒（全量：中型项目约 60 个入口约 7 秒、大型项目约 90 个服务端入口 + 800 个客户端入口约 9 秒）；抽取器 / join 自身的代码、被引用的项目、tsconfig 也算进哈希。
所以反复改语义层、整理流程时放心整趟重跑 `run.sh`，不用手挑步骤。
出图后**主动 `open`** 给用户看；自己验收走 ego-browser 截图。

**回归**：改了抽取器 / join / build 后跑 `bun test/examples.ts`——在 `examples/` 下每个示例（demo：自家写法；tutorial：官方教程 / 分层项目写法）整趟跑，快照 `expected.json` 逐项对账 + `must.json` 人工标注的事实逐条核对 + 意图画布冒烟；快照有意改动用 `UPDATE=1` 重写，随改动一起提交。

## 语义层 `atlas.json`

一个项目一份。字段（以 `examples/demo/atlas.json` 为活样本，别照抄它的域划分）：

| 字段 | 作用 |
|---|---|
| `title` / `subtitle` | 页头 |
| `lanes` | 泳道 → 占哪些 col（客户端 0–3 · 服务端 4–6 · 存储 7） |
| `domains` | 业务域树。`match` 认领节点 id（叶 id 只能精确点名，组 id 可用 `*` 结尾前缀）；`hue` 色相；`route` 路由前缀；`children` 子域；`spread` 子项各占各的列 |
| `groups` | `{ 域节点 id: [ {name, icon, match: [正则…]} ] }` 域内再按功能分组；正则匹配 `名字 动词 路由 文件` |
| `loops` | `{ "VERB /route": [人话名, 一句话故事] }` 循环标题；键对不上任何循环 build 直接报错（常见：`[controller]` 取类名原样大小写） |
| `flows` | 整理过的流程，见 `docs/flows.md` |
| `homes` / `uiSplit` / `database` | 项目专属归属规则 / 客户端目录再细分 / 数据库卡的名字，见 `docs/porting.md` |
| `edgeLabels` | 域与域之间连线上的字 |

**写法 = 让 build 报错驱动**：build 会报 `语义层没认领这些节点：…` / `… 里这些没被分组认领：…`，按报错补 `match`，直到不报。不要加兜底"其他"域吞掉孤儿——孤儿就是没想清楚的归属。

节点 id 形状：服务端 `S:c:<控制器名 或 Minimal API 所在文件名>` · `S:f:<相对路径>` · `S:pipe` `S:hub` `S:bg` `S:svc` `S:pg` `S:cache` `S:disk` `S:x:<外部>`；客户端 `C:ui:<区>` `C:stores` `C:svc` `C:rust` `C:sqlite` `C:bus`。

## 图的重点：体检

build 从抽取事实里确定性算五类命中，头部芯片 + 浮岛「体检」列出，点一项画布只亮它涉及的卡：

| 项 | 规则 |
|---|---|
| 跨域直调 | 一个域的控制器调到另一个域的控制器 |
| 控制器直连外部 | 控制器方法直接发 HTTP，没经过一层通道 |
| 共享热点 | 被 ≥3 个域触达的服务文件；目录名撞上某个业务域的控制器名 = 「住错了地方」，排最前 |
| 前端调用没对上 | 前端请求的路径在服务端找不到端点：外部服务、路由写错，或端点没被抽到（这条循环就断了） |
| 多域共写 | 同一张表的写入方落在 ≥2 个域（都经同一个 store 写的不算） |

**服务文件自动归位**：语义层认领了 `S:svc` 的那个域 = 共享域。build 从每个控制器方法（以及语义层点名给某个域的服务文件里的方法）沿 calls 走进服务文件，只一个域用到的文件搬进该域的「内部实现」组，多个域用的留在共享域（>12 个时按目录分组），HostedService 所在文件进「后台任务」。所以图上连共享域的线就是真共享。

**外部收成一张「出站 HTTP」卡**：目标地址多在运行时配置、静态拿不到；卡的抽屉列发起方。

## 按需读（别一次全读）

| 什么时候 | 读 |
|---|---|
| 改图的画法、解释图上线型 / 颜色 / 抽屉怎么排 | `docs/viewer.md` |
| 整理一条业务流程（build 报「草稿 N」、锚点对不上、用户问「这个循环怎么跑」） | `docs/flows.md` |
| 用户要画想要的结构、意图画布、「按画布实现」 | `docs/intent.md` |
| 接一个新项目、图上缺东西、支持范围 | `docs/porting.md` |

## 其他

- `docs/lab/`：主视图的对照版实验页：`loop-mindmap.html` 是流程画法的对照版（四种画法的定稿来源，`__bench()` 可测渲染性能），不是主流程。
- HTML 里带着代码派生的文字（结局原话、字符串常量、注释）：代码里有不该外传的字面量时，别把图发出去。
- 产物与中间件（`out/`、`node_modules/`、`extractor/bin|obj/`、`<WORK>/`）不进 git；`semantics/`、`intent/` 目录只给本机用，不发布。
