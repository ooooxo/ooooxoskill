# PUT /api/todos/{id:int}  ·  草稿
id: e:PUT /api/todos/{id:int}

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] PUT /api/todos/{id:int}  ‹TodoEndpoints.MapTodoEndpoints›call:lambda›  Api/Endpoints/TodoEndpoints.cs:18
  - [call] TodoService.Update  ‹TodoEndpoints.MapTodoEndpoints›call:TodoService.Update›  Api/Endpoints/TodoEndpoints.cs:19
    - [call] HubNotifier.TodoChanged  ‹TodoService.Update›call:HubNotifier.TodoChanged›  Core/Todos/TodoService.cs:31
