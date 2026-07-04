# Morii

一套 **视觉 / 设计** 向的 agent skill 系列 —— 把「看不见的东西」做成看得见的:
数据出卡、界面成系统、图标成家族、图标会动。
Claude Code / Codex / Cursor / Gemini CLI 等 70+ agent 通用,**按需装,装哪个用哪个**。

## 四个 skill

| skill | 干什么 | 触发词 |
|-------|--------|--------|
| **morii-card** | 把数据/信息渲染成零依赖、单文件、可交互的 HTML 卡片,代替纯文字回答 | 卡片 · 可视化 · card · dashboard · 对比 |
| **morii-design** | 新界面/组件/原型的视觉与交互规范底座(铺满视口的完整页面,非单卡) | 设计 · UI · 界面 · 组件 · 原型 · design system |
| **morii-icon** | 画一个 Morii 实心风 SVG 图标 —— 扁平 · 大圆角 · 实心块面 · 单色成家族 | 图标 · icon · svg 图标 · glyph · 一套图标 |
| **morii-charm** | 拟物「角饰」—— 用堆叠 div 手搭的立体小物件 + 一段循环动画,不是扁平图标 | 角饰 · 拟物图标 · 会动的图标 · charm · animated icon |

一家人:`morii-design` 定页面基调 → `morii-card` 出数据卡 → `morii-icon` 画其中的静态图标 →
`morii-charm` 做会动的拟物小物件。互相引用,但各自独立可用。

## 安装

```bash
npx skills add ooooxo/ooooxoskill
```

跑起来是个多选器 —— **勾你要的那几个**(可只装一个),再选装进哪些 agent。
装进各 agent 的个人 skill 目录(Claude Code → `~/.claude/skills/<name>/`),调用是**裸名**:

```
/morii-card   /morii-design   /morii-icon   /morii-charm
```

只装单个,直接点名:

```bash
npx skills add ooooxo/ooooxoskill@morii-icon
npx skills add ooooxo/ooooxoskill@morii-charm
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
    SKILL.md       主规范(模式/布局/配色/图形规则)
    SNIPPETS.md    预验证骨架与交互片段(写卡前必读)
    CHARTS.md      图表几何
    COLLECTIONS.md 内容合集布局路由
    LAB-LIVE.md    LAB 实验卡 + LIVE 回传通道
    MULTI-CARD.md  多卡索引壳
    SERVE.md       SERVE 实时任务卡
    assets/ examples/
  morii-design/  界面/组件/原型的视觉规范底座
    SKILL.md · Token.css(设计令牌单一真源)
  morii-icon/    单个实心风 SVG 图标
    SKILL.md · build-gallery.mjs(渲染自检工具) · design-card.md · exemplars(-dark).svg
  morii-charm/   拟物会动的角饰
    SKILL.md · charms-gallery.html · references/
```

每个 skill 自带支持文件与工具;`npx skills` 会把整个文件夹一并落到
`~/.claude/skills/<name>/`,所以 SKILL.md 里对这些文件的引用装完即通。

MIT · by Rainy
