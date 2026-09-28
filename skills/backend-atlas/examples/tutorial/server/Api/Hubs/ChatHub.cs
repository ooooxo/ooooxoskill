using Core;
using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

// 强类型 Hub：客户端能收的事件写成接口方法
public interface IChatClient
{
    Task ReceiveMessage(string user, string text);
    Task TodoChanged(int id);
}

public class ChatHub : Hub<IChatClient>
{
    public Task SendMessage(string user, string text) => Clients.All.ReceiveMessage(user, text);
}

// INotifier 的 SignalR 实现：领域层（Core）经接口调到这里
public class HubNotifier(IHubContext<ChatHub, IChatClient> hub) : INotifier
{
    public Task TodoChanged(int id) => hub.Clients.All.TodoChanged(id);
}
