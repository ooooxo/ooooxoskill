# GET /api/todos/{id:int}  ·  草稿
id: e:GET /api/todos/{id:int}

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] TodoEndpoints.GetById  ‹TodoEndpoints›call:TodoEndpoints.GetById›  Api/Endpoints/TodoEndpoints.cs:23
  - [call] TodoService.Get  ‹TodoEndpoints.GetById›call:TodoService.Get›  Api/Endpoints/TodoEndpoints.cs:24
