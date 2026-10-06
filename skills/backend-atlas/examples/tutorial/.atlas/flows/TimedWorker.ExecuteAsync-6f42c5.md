# TimedWorker.ExecuteAsync  ·  草稿
id: bg:CleanupWorker

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] TimedWorker.ExecuteAsync  ‹Workers›call:TimedWorker.ExecuteAsync›  Api/Workers/Workers.cs:8
  - [loop] await timer.WaitForNextTickAsync(ct)  ‹TimedWorker.ExecuteAsync›loop:await timer.WaitForNextTickAsync(ct)›  Api/Workers/Workers.cs:11
    - [call] CleanupWorker.Tick  ‹TimedWorker.ExecuteAsync›call:CleanupWorker.Tick›  Api/Workers/Workers.cs:11
      - [call] TodoService.PurgeDone  ‹CleanupWorker.Tick›call:TodoService.PurgeDone›  Api/Workers/Workers.cs:23
