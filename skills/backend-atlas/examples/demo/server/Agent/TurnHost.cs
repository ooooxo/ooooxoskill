namespace Demo.Agent;

// =====================================================
// TurnHost - 轮次在后台跑：发消息的请求立即返回
// =====================================================
public sealed class TurnHost(IServiceScopeFactory scopes)
{
    // ---------- [ 在独立作用域里后台跑一个轮次 ] ----------
    public void Start(Guid turnId) => _ = Task.Run(async () =>
    {
        using var scope = scopes.CreateScope();
        await scope.ServiceProvider.GetRequiredService<TurnRunner>().Run(turnId);
    });
}
