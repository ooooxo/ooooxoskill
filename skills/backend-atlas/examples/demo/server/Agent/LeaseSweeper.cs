using Demo.Data;
using Microsoft.EntityFrameworkCore;

namespace Demo.Agent;

// =====================================================
// LeaseSweeper - 每 15 秒收走租约过期的轮次（进程崩溃留下的「运行中」僵尸行）
// =====================================================
public sealed class LeaseSweeper(IServiceScopeFactory scopes) : BackgroundService
{
    // ---------- [ 每 15 秒扫一次 ] ----------
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        while (await timer.WaitForNextTickAsync(ct))
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDb>();
            await db.Turns.Where(t => t.Status == "running" && t.LeaseUntil < DateTime.UtcNow)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.Status, "interrupted"), ct);
        }
    }
}
