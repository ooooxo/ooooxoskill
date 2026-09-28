using Core.Data;
using Microsoft.EntityFrameworkCore;

namespace Core.Projects;

// 泛型仓储：实体类型由调用方决定
public class Repository<T>(AppDbContext db) where T : class
{
    public Task<List<T>> All() => db.Set<T>().ToListAsync();

    public async Task Remove(int id)
    {
        var e = await db.Set<T>().FindAsync(id);
        if (e is not null) { db.Set<T>().Remove(e); await db.SaveChangesAsync(); }
    }
}
