using Demo.Billing;
using Demo.Common;
using Demo.Data;
using Demo.Realtime;
using Microsoft.EntityFrameworkCore;

namespace Demo.Agent;

// =====================================================
// TurnRunner - 一个轮次的主循环：取插话 → 扣费 → 调模型 → 执行工具 → 再调模型，直到出结局
// =====================================================
public sealed class TurnRunner(AppDb db, WalletService wallet, ModelClient model, IEnumerable<ITool> tools, ProjectEvents events)
{
    public const int MaxModelCalls = 20;
    public const int CostPerCall = 1;

    // ---------- [ 跑完一个轮次：广播开始 → 主循环 → 落结局并广播 ] ----------
    public async Task Run(Guid turnId)
    {
        var turn = await db.Turns.SingleAsync(t => t.Id == turnId);
        await events.Publish(turn.ProjectId, "turn_started");
        string status;
        try
        {
            status = await Loop(turn);
        }
        catch (AppException e)
        {
            status = "failed: " + e.Message;
        }
        turn.Status = status;
        await db.SaveChangesAsync();
        await events.Publish(turn.ProjectId, "turn_ended", new { status });
    }

    // ---------- [ 主循环：返回结局 ] ----------
    async Task<string> Loop(Turn turn)
    {
        while (true)
        {
            if (turn.ModelCalls >= MaxModelCalls) return "limited · 这一轮已经调用模型 20 次，先停在这里";
            await DrainInterjections(turn);
            var owner = await db.Projects.Where(p => p.Id == turn.ProjectId).Select(p => p.UserId).SingleAsync();
            if (!await wallet.Charge(owner, CostPerCall, "agent-call")) throw new AppException(402, "insufficient_credits", "积分不足，这一轮先停在这里");
            turn.ModelCalls++;

            var reply = await model.Complete(await History(turn.ProjectId));
            db.Messages.Add(new Message { ProjectId = turn.ProjectId, Role = "assistant", Content = reply.Text });
            await db.SaveChangesAsync();
            await events.Publish(turn.ProjectId, "reply", new { reply.Text });

            if (reply.ToolCalls.Count == 0) return "done";
            if (await RunTools(turn, reply.ToolCalls)) return "blocked · 等用户回答";
        }
    }

    // ---------- [ 取走插话：写成用户消息，模型下一步就能看到 ] ----------
    async Task DrainInterjections(Turn turn)
    {
        var pending = await db.Interjections.Where(i => i.ProjectId == turn.ProjectId && !i.Consumed).ToListAsync();
        foreach (var i in pending)
        {
            i.Consumed = true;
            db.Messages.Add(new Message { ProjectId = turn.ProjectId, Role = "user", Content = i.Text });
            await events.Publish(turn.ProjectId, "interjection_applied", new { i.Text });
        }
        await db.SaveChangesAsync();
    }

    // ---------- [ 对话历史：最近 40 条 ] ----------
    async Task<List<Message>> History(Guid projectId) =>
        await db.Messages.Where(m => m.ProjectId == projectId).OrderByDescending(m => m.Id).Take(40).ToListAsync();

    // ---------- [ 执行一步里的全部工具；返回 true = 要等用户回答，本轮结束 ] ----------
    async Task<bool> RunTools(Turn turn, List<ToolCall> calls)
    {
        foreach (var call in calls)
        {
            if (call.Name == "ask_user") return true;
            await events.Publish(turn.ProjectId, "tool_start", new { call.Name });
            var tool = tools.FirstOrDefault(t => t.Name == call.Name);
            var result = tool is null ? "未知工具" : await tool.Run(turn.ProjectId, call.Input);
            db.Messages.Add(new Message { ProjectId = turn.ProjectId, Role = "tool", Content = result });
            await events.Publish(turn.ProjectId, "tool_done", new { call.Name });
        }
        await db.SaveChangesAsync();
        return false;
    }
}
