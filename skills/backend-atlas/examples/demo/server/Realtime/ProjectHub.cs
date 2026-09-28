using Microsoft.AspNetCore.SignalR;

namespace Demo.Realtime;

// 项目频道：客户端按项目入组，服务端往组里推事件
public sealed class ProjectHub : Hub
{
    // ---------- [ 加入项目频道 ] ----------
    public Task JoinProject(Guid projectId) => Groups.AddToGroupAsync(Context.ConnectionId, projectId.ToString());

    // ---------- [ 离开项目频道 ] ----------
    public Task LeaveProject(Guid projectId) => Groups.RemoveFromGroupAsync(Context.ConnectionId, projectId.ToString());
}

// =====================================================
// ProjectEvents - 往项目频道推一条事件：{ type, data }
// =====================================================
public sealed class ProjectEvents(IHubContext<ProjectHub> hub)
{
    // ---------- [ 发布：所有订阅这个项目的客户端都会收到 ] ----------
    public Task Publish(Guid projectId, string type, object? data = null) =>
        hub.Clients.Group(projectId.ToString()).SendAsync("event", new { type, data });
}
