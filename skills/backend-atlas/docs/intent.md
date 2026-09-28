# 意图画布：先画想要的，再实现

backend-atlas 的反方向用法。用户要画想要的结构、开空白画布、「按画布实现 / 还差哪些没做」时读。

## 意图画布（反方向：先画想要的，再实现）

同一张图、同一套词汇。代码抽出来的是实心卡；**用户想要、代码里还没有的是虚线卡**。实现以后重跑 `run.sh`，对上的虚线卡自动变实心（头部「想要 N · 已实现 M」）。

```bash
bun viewer/serve.ts <项目>/atlas.intent.json                        # 空白画布（新项目，还没代码）
bun viewer/serve.ts <项目>/atlas.intent.json out/<项目>-atlas.html   # 叠在真图上（已有项目）
open http://localhost:4870                                          # PORT 可改；用 run_in_background 起
```

画布分两种模式（浮岛左侧切换；空白画布默认「画」，有真图默认「看」）：

- **看**：只读。悬停聚焦预览、点击开抽屉讲解、点亮业务循环。
- **画**：单击不开抽屉。**双击空白**写想法（只填名字 + 介绍，建出来一律 `kind: idea`）· **双击想法卡**就地改、往里加、删除 · **从一张卡拖到另一张**连线 · 拖空白平移 · Esc 关浮层。
  位置是唯一的结构信息：落在展开的域框里 = 属于那个域，落在某条泳道里 = 那一端，都不在 = 最左的「想法」泳道。连线种类按两端推（指向表=writes，指向事件=push，客户端→服务端=request，其余 calls）。

**用户只表达想法，不做分类**；把想法归成域 / 端点 / 表 / 事件是 agent 和用户商量后改文件的事。

### 文件（agent 读写的就是这两个）

`<项目>/atlas.intent.json`（放在项目仓库里，和语义层一起）—— 意图本体，agent 直接改，画布 1 秒内跟上：

```json
{ "title": "新画布",
  "nodes": [ { "id": "i:orders", "kind": "domain", "label": "订单", "lane": "server", "desc": "下单、支付、退款" },
             { "id": "i:place", "kind": "endpoint", "label": "下单", "parent": "i:orders", "route": "POST /Orders" } ],
  "edges": [ { "from": "i:place", "to": "i:orders-table", "k": "writes", "label": "可空" } ] }
```

- `kind` ∈ idea（用户画布上建的，未归类）/ domain / endpoint（要 `route`）/ table / event / file（模块）；顶层给 `lane`（idea / client / server / store），否则给 `parent`。
- `parent` / `from` / `to` 可以是意图 id，也可以是真图 id（`D:conv`、`D:conv/消息`、叶 id 从页面 `[data-node]` 取）。
- `k` 用图里已有种类：calls / request / reads / writes / push / invoke / bus / http …
- 引用对不上 → 页面头部红字报错、保留上一版，不静默吞。

**「已实现」判定**：端点按「动词 + 路由」（`{x}` 参数名不计），表 / 事件 / 域按名字，对上真实节点即实现；连线两端都是真节点、真图里两端子树间已有同种边即实现。想法（idea）和模块（file）不自动判定——想法先归类，模块做完由 agent 删掉。

`intent/<project>.log.jsonl` —— **用户在画布上的每次保存**一行结构 diff（agent 直接改文件不记）：

```json
{"at":"…","by":"canvas","added":[…],"removed":[…],"changed":[{"id":"…","from":{…},"to":{…}}],"linked":[…],"unlinked":[…]}
```

### agent 怎么用

1. **读意图**：读 `intent.json` 看全貌，`tail` 日志看用户**最近动了什么**——增删的先后比终态更能说明意图（删了又加 = 在犹豫；先建域再补端点 = 在从粗到细想）。
2. **和用户一起推断**：把读出来的想法用业务话复述一遍，给出归类提议（这条是个域 / 这是 `POST /Orders` 端点 / 这要一张表 + 一个推送事件），指出缺口（没写落哪张表、事件没人收、和真图里现有的重名 / 重叠），**问**而不是自己补。
3. **归类写回**：用户确认后改 `intent.json`——**保留原 id**，把 `kind` 从 idea 改成具体种类、补 `route` / 搬 `parent` / 拆成几个节点加连线，用户在画布上立刻看到。
4. **实现**：按虚线卡逐个做；做完重跑 `run.sh` + 刷新画布，看虚线是否变实心。仍是虚线的就是没对上（路由 / 表名写得不一致，或者真没做）。
5. 用户只是在想、还没定时，不动代码。
