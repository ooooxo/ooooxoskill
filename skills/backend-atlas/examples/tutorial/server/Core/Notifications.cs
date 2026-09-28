namespace Core;

// 领域层只知道「要通知」，怎么推由 Api 层实现（SignalR）
public interface INotifier
{
    Task TodoChanged(int id);
}
