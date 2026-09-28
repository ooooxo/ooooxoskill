using Core.Todos;

namespace Api.Workers;

// 定时任务基类：子类只写每一拍做什么
public abstract class TimedWorker(TimeSpan every) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(every);
        while (await timer.WaitForNextTickAsync(ct)) await Tick(ct);
    }

    protected abstract Task Tick(CancellationToken ct);
}

// 每 10 分钟清掉已完成的待办
public class CleanupWorker(IServiceScopeFactory scopes) : TimedWorker(TimeSpan.FromMinutes(10))
{
    protected override async Task Tick(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        await scope.ServiceProvider.GetRequiredService<TodoService>().PurgeDone();
    }
}
