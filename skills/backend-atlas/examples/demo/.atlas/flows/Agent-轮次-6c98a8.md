# Agent 轮次  ·  已整理
id: bgrun:m:M:Demo.Agent.TurnRunner.Run(System.Guid)

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] 跑完一个轮次  ‹TurnRunner›call:TurnRunner.Run›  Agent/TurnRunner.cs:18
  - [call] 发布 (turn_started)  ‹TurnRunner.Run›call:ProjectEvents.Publish›  Agent/TurnRunner.cs:21
  - [try] try  ‹TurnRunner.Run›try:try›  Agent/TurnRunner.cs:23
    - [call] 主循环  ‹TurnRunner.Run›call:TurnRunner.Loop›  Agent/TurnRunner.cs:25
      - [loop] true  ‹TurnRunner.Loop›loop:true›  Agent/TurnRunner.cs:39
        - [guard] turn.ModelCalls >= MaxModelCalls  ‹TurnRunner.Loop›guard:turn.ModelCalls >= MaxModelCalls›  Agent/TurnRunner.cs:41
          - [exit] limited · 这一轮已经调用模型 20 次，先停在这里  ‹TurnRunner.Loop›exit:return::limited · 这一轮已经调用模型 20 次，先停在这里›  Agent/TurnRunner.cs:41
        - [call] 取走插话  ‹TurnRunner.Loop›call:TurnRunner.DrainInterjections›  Agent/TurnRunner.cs:42
          - [loop] 每个 i ∈ pending  ‹TurnRunner.DrainInterjections›loop:每个 i ∈ pending›  Agent/TurnRunner.cs:61
            - [call] 发布 (interjection_applied)  ‹TurnRunner.DrainInterjections›call:ProjectEvents.Publish›  Agent/TurnRunner.cs:65
        - [call] 扣费 (agent-call)  ‹TurnRunner.Loop›call:WalletService.Charge›  Agent/TurnRunner.cs:44
        - [guard] !await wallet.Charge(owner, CostPerCall, "agent-call")  ‹TurnRunner.Loop›guard:!await wallet.Charge(owner, CostPerCall, "agent-call")›  Agent/TurnRunner.cs:44
          - [exit] 积分不足，这一轮先停在这里  ‹TurnRunner.Loop›exit:throw:402:积分不足，这一轮先停在这里›  Agent/TurnRunner.cs:44
        - [call] 调一次模型  ‹TurnRunner.Loop›call:ModelClient.Complete›  Agent/TurnRunner.cs:47
        - [call] 对话历史  ‹TurnRunner.Loop›call:TurnRunner.History›  Agent/TurnRunner.cs:47
        - [call] 发布 (reply)  ‹TurnRunner.Loop›call:ProjectEvents.Publish›  Agent/TurnRunner.cs:50
        - [guard] reply.ToolCalls.Count == 0  ‹TurnRunner.Loop›guard:reply.ToolCalls.Count == 0›  Agent/TurnRunner.cs:52
          - [exit] done  ‹TurnRunner.Loop›exit:return::done›  Agent/TurnRunner.cs:52
        - [call] TurnRunner.RunTools  ‹TurnRunner.Loop›call:TurnRunner.RunTools›  Agent/TurnRunner.cs:53
          - [loop] 每个 call ∈ calls  ‹TurnRunner.RunTools›loop:每个 call ∈ calls›  Agent/TurnRunner.cs:77
            - [call] 发布 (tool_start)  ‹TurnRunner.RunTools›call:ProjectEvents.Publish›  Agent/TurnRunner.cs:80
            - [call] NoteTool.Run  ‹TurnRunner.RunTools›call:NoteTool.Run›  Agent/TurnRunner.cs:82
              - [exit] 已记下  ‹NoteTool.Run›exit:return::已记下›  Agent/Tools.cs:29
            - [call] SearchTool.Run  ‹TurnRunner.RunTools›call:SearchTool.Run›  Agent/TurnRunner.cs:82
            - [call] 发布 (tool_done)  ‹TurnRunner.RunTools›call:ProjectEvents.Publish#2›  Agent/TurnRunner.cs:84
        - [guard] await RunTools(turn, reply.ToolCalls)  ‹TurnRunner.Loop›guard:await RunTools(turn, reply.ToolCalls)›  Agent/TurnRunner.cs:53
          - [exit] blocked · 等用户回答  ‹TurnRunner.Loop›exit:return::blocked · 等用户回答›  Agent/TurnRunner.cs:53
    - [catch] AppException  ‹TurnRunner.Run›catch:AppException›  Agent/TurnRunner.cs:27
  - [call] 发布 (turn_ended)  ‹TurnRunner.Run›call:ProjectEvents.Publish#2›  Agent/TurnRunner.cs:33
