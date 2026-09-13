# Morii

一套 agent skill 合集 —— 主体是 **视觉 / 设计** 向的 Morii 系列(把「看不见的东西」做成看得见的:
数据出卡、界面成系统、图标成家族、图标会动),外加两个工程纪律向 skill。
Claude Code / Codex / Cursor / Gemini CLI 等 70+ agent 通用,**按需装,装哪个用哪个**。

## Morii 视觉系列

| skill | 干什么 | 触发词 |
|-------|--------|--------|
| **morii-card** | 把数据/信息渲染成零依赖、单文件、可交互的 HTML 卡片,代替纯文字回答 | 卡片 · 可视化 · card · dashboard · 对比 |
| **morii-design** | 新界面/组件/原型的视觉与交互规范底座(铺满视口的完整页面,非单卡) | 设计 · UI · 界面 · 组件 · 原型 · design system |
| **morii-icon** | 画一个 Morii 扁平 SVG 图标 —— 实心/线性二选一整套一档 · 大圆角 · 单色成家族 · 含图标动效 | 图标 · icon · svg 图标 · glyph · 一套图标 |
| **morii-charm** | 拟物「角饰」—— 用堆叠 div 手搭的立体小物件 + 一段循环动画,不是扁平图标 | 角饰 · 拟物图标 · 会动的图标 · charm · animated icon |

一家人:`morii-design` 定页面基调 → `morii-card` 出数据卡 → `morii-icon` 画其中的静态图标 →
`morii-charm` 做会动的拟物小物件。互相引用,但各自独立可用。

## 工程向 skill

| skill | 干什么 | 触发词 |
|-------|--------|--------|
| **backend-discipline** | 后端/API 服务的决策纪律:ADR 决策记录 · CONTEXT.md 领域语言 · 铁律 · 决策卫生 · 发布闸门(与语言栈无关) | 后端设计 · ADR · 数据模型 · 鉴权/删除/幂等 |
| **git-commit-convention** | 中文前缀提交规范 `[更新][优化][重构][修复]` + 附带 `commit-msg` 校验 hook | 提交 · commit message |

## 安装

```bash
npx skills add ooooxo/ooooxoskill
```

跑起来是个多选器 —— **勾你要的那几个**(可只装一个),再选装进哪些 agent。
装进各 agent 的个人 skill 目录(Claude Code → `~/.claude/skills/<name>/`),调用是**裸名**:

```
/morii-card   /morii-design   /morii-icon   /morii-charm
/backend-discipline   /git-commit-convention
```

只装单个,直接点名:

```bash
npx skills add ooooxo/ooooxoskill@morii-icon
npx skills add ooooxo/ooooxoskill@backend-discipline
```

## 更新

跟随本仓库的最新提交:

```bash
npx skills update            # 全部
npx skills update morii-icon # 只更新这个
```

## 手动装法(不用 npx)

```bash
git clone https://github.com/ooooxo/ooooxoskill.git
cp -R ooooxoskill/skills/morii-icon ~/.claude/skills/morii-icon   # 换成你要的那个
# 更新:git pull 后再 cp 一次
```

## 结构

```
skills/
  morii-card/    数据 → 单文件交互 HTML 卡片
    SKILL.md       路由核心(场景表/模式/工作流/布局图型表)
    DESIGN.md      工艺规范(配色/图形/原子/检查单,写卡时装载)
    SNIPPETS.md    预验证骨架与交互片段(写卡前必读) · snippets/
    CHARTS.md      图型路由 · charts/
    COLLECTIONS.md 内容合集布局路由 · collections/
    LAB.md · LIVE.md  实验卡 / 回传通道
    MULTI-CARD.md  多卡索引壳
    SERVE.md       SERVE 实时任务卡
    assets/ examples/
  morii-design/  界面/组件/原型的视觉规范底座
    SKILL.md       入口 + 工作流路由
    Token.css      设计令牌单一真源
    FOUNDATION.md  色/字/间距/圆角/按钮/组件状态
    LAYOUT.md · SHELL.md · CHARTS.md · STATES.md  骨架 / 外壳与浮层 / 图形 / 异步与空态
    MOTION.md      动效(授权后才读)
  morii-icon/    单个扁平 SVG 图标
    SKILL.md · MOTION.md(图标动效) · build-gallery.mjs(渲染自检工具) · design-card.md · exemplars(-dark).svg
  morii-charm/   拟物会动的角饰
    SKILL.md · charms-gallery.html · references/
  backend-discipline/     后端决策纪律
    SKILL.md · IRON-LAWS.md · DECISION-HYGIENE.md · RELEASE-GATE.md · ADR-TEMPLATE.md · CONTEXT-TEMPLATE.md
  git-commit-convention/  中文前缀提交规范
    SKILL.md · commit-msg-hook.sh
```

每个 skill 自带支持文件与工具;`npx skills` 会把整个文件夹一并落到
`~/.claude/skills/<name>/`,所以 SKILL.md 里对这些文件的引用装完即通。

MIT · by Rainy
