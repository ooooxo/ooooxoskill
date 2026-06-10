# MoriiCard

Claude Code skill:把数据/信息渲染成**零依赖、单文件、可交互**的 HTML 卡片,代替纯文字回答。

搜索结果、统计、对比、榜单、日程、天气、新闻摘要——任何 3 个以上相关数字/事实,出卡不出段落。

## 效果

- **单文件零依赖** — 一张卡 = 一个 `.html`,无 CDN 无框架,离线双击即开
- **亮/暗双主题** — `light-dark()` 一套变量自适应系统主题
- **图形优先** — 文字只以原子存在(标题/数值/标签/chip),结论靠图表说话;inline SVG 手绘,无图表库
- **克制配色** — 中性表面 + 每卡一对高饱和小面积 accent,60-30-10
- **移动优先** — 430px 起步,桌面端自动展开多栏

## 四模式 + 两能力

| 模式 | 场景 |
|------|------|
| FAST | 交互对话默认,秒级出卡 |
| RICH | 报告级:完整层级、多图表 |
| MICRO | 微确认/单事实回应 |
| LAB | 「取决于参数」类问题 → 可动手实验台 |

- **步进布局 (Stepper)** — 教程/流程类回答:进度点 + 上一步/下一步逐步跟进
- **LIVE 回传** — 卡上选项可点击,点击直接唤醒 agent 继续干活

## 安装

```
/plugin marketplace add ooooxo/ooooxoskill
/plugin install morii-card@ooooxoskill
```

## 更新

自动。作者 push 即发版,订阅者每次启动 Claude Code 自动拉新;等不及时:

```
/plugin marketplace update
```

## 触发

说 卡片 / 可视化 / card / dashboard,或任何数据汇总型提问后自动出卡;写代码/调试/git 流程中保持纯文本不打扰。
