using Microsoft.EntityFrameworkCore;

namespace Core.Data;

public class Todo { public int Id { get; set; } public string Title { get; set; } = ""; public bool Done { get; set; } public int? TagId { get; set; } }
public class Tag { public int Id { get; set; } public string Name { get; set; } = ""; }
public class Project { public int Id { get; set; } public string Name { get; set; } = ""; public DateTime? ArchivedAt { get; set; } }
public class AuditLog { public int Id { get; set; } public string Action { get; set; } = ""; public DateTime At { get; set; } }

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Todo> Todos => Set<Todo>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b) => b.Entity<Project>();
}
