using Demo.Common;
using Demo.Data;
using Microsoft.EntityFrameworkCore;

namespace Demo.Agent;

// =====================================================
// TurnService - 起轮次或记插话：一个项目同时只跑一个轮次
// =====================================================
public sealed class TurnService(AppDb db, TurnHost host)
{
    public const int MaxRunning = 3;

    // ---------- [ 续跑：空闲时起新轮次交给后台，进行中则记成插话 ] ----------
    public async Task<string> StartOrInterject(Guid projectId, string text)
    {
        if (text.Trim().Length == 0) throw new AppException(400, "text_required", "说点什么吧");
        var running = await db.Turns.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Status == "running");
        if (running is not null && running.LeaseUntil > DateTime.UtcNow)
        {
            db.Interjections.Add(new Interjection { ProjectId = projectId, Text = text });
            await db.SaveChangesAsync();
            return "interjection";
        }
        if (running is not null) running.Status = "interrupted";
        if (await db.Turns.CountAsync(t => t.Status == "running") >= MaxRunning)
            throw new AppException(429, "too_many_turns", "同时进行的任务太多了");

        var turn = new Turn { Id = Guid.NewGuid(), ProjectId = projectId, LeaseUntil = DateTime.UtcNow.AddMinutes(1) };
        db.Turns.Add(turn);
        db.Messages.Add(new Message { ProjectId = projectId, Role = "user", Content = text });
        await db.SaveChangesAsync();
        host.Start(turn.Id);
        return "turn";
    }
}
