# POST /api/Projects/{id:int}/archive  ·  草稿
id: e:POST /api/Projects/{id:int}/archive

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] ProjectsController.Archive  ‹ProjectsController›call:ProjectsController.Archive›  Api/Controllers/ProjectsController.cs:10
  - [call] ArchiveProjectHandler.Handle  ‹ProjectsController.Archive›call:ArchiveProjectHandler.Handle›  Api/Controllers/ProjectsController.cs:12
