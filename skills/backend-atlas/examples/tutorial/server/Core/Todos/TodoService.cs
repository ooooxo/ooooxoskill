using Core.Data;
using Microsoft.EntityFrameworkCore;

namespace Core.Todos;

public record TodoInput(string Title, int? TagId);

public class TodoService(AppDbContext db, INotifier notifier)
{
    public Task<List<Todo>> List() => db.Todos.AsNoTracking().ToListAsync();

    public Task<Todo?> Get(int id) => db.Todos.FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Todo> Create(TodoInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Title)) throw new ArgumentException("title required");
        var todo = new Todo { Title = input.Title, TagId = input.TagId };
        db.Todos.Add(todo);
        db.AuditLogs.Add(new AuditLog { Action = "todo.create", At = DateTime.UtcNow });
        await db.SaveChangesAsync();
        await notifier.TodoChanged(todo.Id);
        return todo;
    }

    public async Task<bool> Update(int id, TodoInput input)
    {
        var todo = await db.Todos.FindAsync(id);
        if (todo is null) return false;
        todo.Title = input.Title;
        await db.SaveChangesAsync();
        await notifier.TodoChanged(id);
        return true;
    }

    public async Task Delete(int id)
    {
        await db.Todos.Where(t => t.Id == id).ExecuteDeleteAsync();
        await notifier.TodoChanged(id);
    }

    public Task<int> PurgeDone() => db.Todos.Where(t => t.Done).ExecuteDeleteAsync();
}
