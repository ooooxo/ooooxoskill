---
name: morii-compare
description: >
  「对照版」—— whenever the user wants to SEE several design options side by side before deciding,
  build one self-contained HTML lab page that renders ≥5 complete alternatives (plus 第 0 档 = the
  current state) on real specimens, switchable by number keys, light/dark, and verified by
  screenshots. Use it for any 「出几套方案 / 给我 5–10 套设计 / 对照版 / 对比一下几种做法 / A/B /
  哪种好看 / 多档对照 / 换个样式看看 / 这个不好看给我几种」 about UI, layout, components, buttons,
  motion, color. The page lives in the repo (docs/lab/<topic>.html), reads the project's real
  tokens, keeps rounds (R) so the next iteration narrows on what the user picked, and ends with
  「挑哪档 / 哪几个零件拼一起」. Not for single-answer fixes and not for data cards (morii-card).
  Keywords: 对照版 对照 对比方案 几套 多档 A/B lab 方案对比 设计选型 compare variants.
  Triggers: 对照版, 出几套, 5 套, 10 套, 对比方案, 几种样式, A/B, 对照一下, compare designs.
---

# Morii Compare —— 对照版

**用户说「给我几套看看」，交付物永远是一页能切档的对照 HTML，不是一段文字描述。**
看得见才判得准；文字描述的方案，用户只能凭想象判，判完还得重来一轮。

一句话流程：**先问清比什么 → 定样本与第 0 档 → 写 ≥5 档完整方案 → 拍图自检 → `open` 给用户 → 按他挑的开下一轮。**

---

## ① 开工前：三件事问清（能从代码查到的就去查，不问）

1. **比的是什么维度。** 「整块重做」和「只换按钮皮」是两种对照。先定哪些**可以变**、哪些**已经定了不许动**
   （已定的每一档都遵守 —— 否则档与档之间同时在变好几样东西，用户没法判是哪一样好）。
2. **痛点原话。** 用户圈出来的那几处就是验收标准。每一档都要回答那几处，答不上的档不出。
3. **样本从哪来。** 见 ②。

问法：一次一个问题，附上推荐答案（grilling 的问法）。已经能从代码 / CONTEXT / ADR 读到的，不问。

## ② 样本：真形状，≥3 条，覆盖稀 / 中 / 满

- **样本的字段、动作、状态照项目里真的 schema / 组件抄**；数可以造，形状必须是真的。
  用户截图里那一条必须在样本里。
- 至少三条，刻意挑出**极端**：稀（一两格、没有主角）· 中（用户截图那条）· 满（动作多、字段多、全部零件都有）。
  一个方案在稀和满两头都站得住才算站得住。
- 一条样本不够暴露某个毛病时（例如「挤了会怎样」），**补一条能暴露它的真样本**，别调参数假装。
- **第 0 档永远是现状**，照现行代码抄（类名、间距、墨阶照搬），不画成稻草人。`C` 键随时和现状来回切。

## ③ 档：≥5 套完整方案，每套一个论点

- **至少 5 档（不含现状），建议 6–8。** 少于 5 档没有选择余地；超过 10 档用户看不完。
- **每档是一套完整方案，不是一个零件。** 每档都把所有样本、所有部位画全。
- **每档一句论点**（它相信什么：「动作沉底」「状态是一条路」「值本身就是控件」），外加一排零件标签
  （`动作 底栏` `字段 窄标签列` …，一个参数一枚 chip，不用 `·` 串）和**一行代价**（它牺牲了什么，琥珀色）。
  写不出代价的档，要么是没想透，要么是稻草人。
- 档与档之间**只变同一组维度**；覆盖度优先：每个可变部位的每种做法至少在一档里出现一次，用户才能说「3 的路轨 + 1 的底栏」。
- **用户否过的方向**（项目记忆 / 口味清单里）可以放一档当对照，但代价行里写明「否过」。
- 守项目的设计系统：只引 token、不写裸色值；morii-design 的铁清单照走（一屏一颗主键、不许一个控件独占一行、选中不铺色块……）。

## ④ 骨架：从 `template.html` 起

复制本目录的 **`template.html`** 到项目里 `docs/lab/<topic>.html`（没有 `docs/lab/` 就建），改头部三件事：

| 改什么 | 怎么改 |
|---|---|
| token | `<link>` 指向项目的 token 源（Hrige：`../../src/styles/tokens.css` + `control.css`；Morii 仓内：`src/panel/shell/tokens.css`；没有项目 token：把 morii-design 的 `Token.css` 拷到页面旁边） |
| 图标 | 从项目的图标注册表抽一次、内联进 `ICON`（Hrige：`bun -e 'import {icons} from "./src/components/ui/icons.ts"…'`），**不手画**；缺的图标走 morii-icon |
| 数据 | `SPECS`（样本）、`ROUNDS`（每轮的档：`name / thesis / parts / cost / render`） |

骨架已经带好：数字切档 · `C` 对照现状 · `T` 明暗 · `R` 换轮次 · `P` 重播动效 · `[ ]` 调宽度 ·
档位与主题记在 localStorage · 一枚通用锚定层（状态下拉 / ⋯ 菜单）· 弹簧 `step()` 与 rAF `kick()`。
**实验台自己的那条（标题、档位、论点）与被比较的东西分开写**，被比较的东西只准吃 token。

页头注释三行必须有：干什么 / 怎么跑 / 需要什么。可调参数放 `:root` 与脚本最上面，不埋在逻辑里。

## ⑤ 动效档（用户要动 / 液体 / 弹簧时）

- 动效照抄项目里已有的同类原件（Morii 的液体：`src/panel/shell/liquid/` 的几何与弹簧），**不自己拿分段曲线拼**。
- 形逐帧画成一条 path；内容按同一条 path 裁（`clip-path: path()`），**液体长到哪露到哪**。
- 大面的影用 box-shadow 投影板，小件用 svg `feDropShadow`；亮色白对白时形只靠影显形，别把影撤了。
- 必须逐帧验（见 VERIFY.md），中间帧也得成立。

## ⑥ 验收：拍了再交

照 **`VERIFY.md`**：每档 × 明暗各拍一张全景，病灶处放大裁切，动效接管 rAF 逐帧拍。
自己先挑毛病（折行、控件独占一行、字截断、竖线错位、内容露出液体外），修完再拍。
ego 截的是 Chromium：`filter` / `mask` / `clip-path` / `backdrop` 这类内核差异大的，交付时明说「WebKit 未验」。

## ⑦ 交付

1. `/usr/bin/open <绝对路径>` 用系统浏览器打开（裸 `open` 在 cmux 里可能被替身接走）。
2. 回复里：一张表列出各档（`# · 名 · 一句话`），写明第 0 档是现状、键位怎么用，再说一句哪些已验、哪些没验。
3. 最后一行问：**挑哪档；有没有想从一档挪到另一档的零件；哪档一眼不要。**

## ⑧ 下一轮

- 用户挑完，**同一页开下一轮**（`ROUNDS` 加一项，`R` 切换），上一轮原样留着当判据记录。
- 新一轮把选中的部分**钉成底子**，只变还没定的维度，仍然 ≥4 档（收敛轮可以少于 5）。
- 每定下一条，当场写进项目的 CONTEXT.md（术语）或 ADR（难反悔、有取舍的决定）—— 项目用 domain-modeling 时照它的格式。

---

## 反模式（见一个删一个）

| 反模式 | 为什么错 |
|---|---|
| 用文字描述 N 套方案让用户选 | 用户只能凭想象判，判完还要再做一遍 |
| 第 0 档画成稻草人 | 对照失去意义；照现行代码抄 |
| 只有一两条样本，全是「中等」 | 稀和满两头才暴露毛病 |
| 档与档同时变好几样 | 判不出是哪一样好 |
| 每档只画一个零件 | 零件好看不等于整体成立 |
| 代价行空着 | 没有代价的方案是没想透 |
| 没拍图就交 | 折行、截断、错位只有眼睛看得出 |
| 下一轮另开新页、旧轮删掉 | 判据记录丢了，下次又问一遍 |
