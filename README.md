# MoriiCard

Agent skill:把数据/信息渲染成**零依赖、单文件、可交互**的 HTML 卡片,代替纯文字回答。
Claude Code / Codex / Cursor / Gemini CLI 等 70+ agent 通用。

搜索结果、统计、对比、榜单、日程、天气、新闻摘要——任何 3 个以上相关数字/事实,出卡不出段落。

## 效果

- **单文件零依赖** — 一张卡 = 一个 `.html`,无 CDN 无框架,离线双击即开
- **亮/暗双主题** — `light-dark()` 一套变量自适应系统主题
- **图形优先** — 文字只以原子存在(标题/数值/标签/chip),结论靠图表说话;inline SVG 手绘,无图表库
- **克制配色** — 中性表面 + 每卡一对高饱和小面积 accent,60-30-10
- **移动优先** — 430px 起步,桌面端自动展开多栏

## 四模式

| 模式 | 场景 |
|------|------|
| FAST | 交互对话默认,秒级出卡 |
| RICH | 报告级:完整层级、多图表 |
| LAB  | 「取决于参数」类问题 → 可动手实验台 |
| SERVE | 跟随运行中任务实时填充的卡 |

## 安装

```bash
npx skills add ooooxo/ooooxoskill
```

选中 **morii-card**、选要装的 agent(可多选)即可。装进各 agent 的个人 skill 目录
(Claude Code → `~/.claude/skills/morii-card/`),所以调用是**裸名**:

```
/morii-card
```

## 更新

跟随本仓库的最新提交:

```bash
npx skills update            # 更新全部
npx skills update morii-card # 只更新这个
```

## 手动装法(不用 npx)

```bash
git clone https://github.com/ooooxo/ooooxoskill.git
cp -R ooooxoskill/skills/morii-card ~/.claude/skills/morii-card
# 更新:git pull 后再 cp 一次
```

## 触发

说 卡片 / 可视化 / card / dashboard,或任何数据汇总型提问后自动出卡;手动调用 `/morii-card`;
写代码/调试/git 流程中保持纯文本不打扰。

## 结构

```
skills/morii-card/
  SKILL.md       主规范(模式/布局/配色/图形规则)
  SNIPPETS.md    预验证骨架与交互片段(写卡前必读)
  CHARTS.md      图表几何
  COLLECTIONS.md 内容合集布局路由
  LAB-LIVE.md    LAB 实验卡 + LIVE 回传通道
  MULTI-CARD.md  多卡索引壳
  SERVE.md       SERVE 实时任务卡
  assets/        多卡索引壳模板
  examples/      可直接抄骨架的成品卡
```

MIT · by Rainy
