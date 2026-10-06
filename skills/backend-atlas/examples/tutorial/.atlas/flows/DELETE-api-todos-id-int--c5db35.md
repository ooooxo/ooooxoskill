# DELETE /api/todos/{id:int}  ·  草稿
id: e:DELETE /api/todos/{id:int}

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] TodoEndpoints.DeleteTodo  ‹TodoEndpoints›call:TodoEndpoints.DeleteTodo›  Api/Endpoints/TodoEndpoints.cs:26
  - [call] TodoService.Delete  ‹TodoEndpoints.DeleteTodo›call:TodoService.Delete›  Api/Endpoints/TodoEndpoints.cs:28
    - [call] HubNotifier.TodoChanged  ‹TodoService.Delete›call:HubNotifier.TodoChanged›  Core/Todos/TodoService.cs:38
