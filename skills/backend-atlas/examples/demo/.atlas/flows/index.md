# 流程索引（自动生成，勿手改）

9 条 · 已整理 3。草稿按复杂度排，越靠前越值得整理；整理时只读那一条的文件。

| 流程 | id（语义层 flows 的键） | 状态 | 节点 | 循环 | 后台 | 出口 | 域 | 文件 |
|---|---|---|---|---|---|---|---|---|
| Agent 轮次 | `bgrun:m:M:Demo.Agent.TurnRunner.Run(System.Guid)` | 已整理 | 29 | 3 | 0 | 5 | Agent 轮次 | Agent-轮次-6c98a8.md |
| 发消息 | `e:POST /api/projects/{id:guid}/messages` | 已整理 | 12 | 0 | 1 | 4 | 项目与对话 | 发消息-e084bd.md |
| 注册 | `e:POST /api/auth/register` | 已整理 | 8 | 0 | 0 | 3 | 账号 | 注册-ec0ef2.md |
| 登录 | `e:POST /api/auth/login` | 草稿 | 3 | 0 | 0 | 1 | 账号 | 登录-e80d79.md |
| 租约回收 | `bg:LeaseSweeper` | 草稿 | 1 | 0 | 0 | 0 | Agent 轮次 | 租约回收-078c02.md |
| 我的项目列表 | `e:GET /api/projects` | 草稿 | 1 | 0 | 0 | 0 | 项目与对话 | 我的项目列表-5d8bcb.md |
| 新建项目 | `e:POST /api/projects` | 草稿 | 1 | 0 | 0 | 0 | 项目与对话 | 新建项目-e664b8.md |
| 加入项目频道 | `hub:ProjectHub.JoinProject` | 草稿 | 1 | 0 | 0 | 0 | 实时 | 加入项目频道-ae72fc.md |
| 离开项目频道 | `hub:ProjectHub.LeaveProject` | 草稿 | 1 | 0 | 0 | 0 | 实时 | 离开项目频道-9b51b8.md |
