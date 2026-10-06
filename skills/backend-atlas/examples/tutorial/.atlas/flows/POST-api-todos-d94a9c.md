# POST /api/todos  ·  草稿
id: e:POST /api/todos

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] POST /api/todos  ‹TodoEndpoints.MapTodoEndpoints›call:lambda›  Api/Endpoints/TodoEndpoints.cs:13
  - [call] TodoService.Create  ‹TodoEndpoints.MapTodoEndpoints›call:TodoService.Create›  Api/Endpoints/TodoEndpoints.cs:15
    - [guard] string.IsNullOrWhiteSpace(input.Title)  ‹TodoService.Create›guard:string.IsNullOrWhiteSpace(input.Title)›  Core/Todos/TodoService.cs:16
      - [exit] title required  ‹TodoService.Create›exit:throw::title required›  Core/Todos/TodoService.cs:16
    - [call] HubNotifier.TodoChanged  ‹TodoService.Create›call:HubNotifier.TodoChanged›  Core/Todos/TodoService.cs:21
