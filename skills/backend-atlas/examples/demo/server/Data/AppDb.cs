using Microsoft.EntityFrameworkCore;

namespace Demo.Data;

public sealed class User { public Guid Id { get; set; } public string Email { get; set; } = ""; public string PasswordHash { get; set; } = ""; }
public sealed class Wallet { public Guid UserId { get; set; } public int Balance { get; set; } }
public sealed class LedgerEntry { public long Id { get; set; } public Guid UserId { get; set; } public int Amount { get; set; } public string Reason { get; set; } = ""; }
public sealed class Project { public Guid Id { get; set; } public Guid UserId { get; set; } public string Title { get; set; } = ""; }
public sealed class Turn { public Guid Id { get; set; } public Guid ProjectId { get; set; } public string Status { get; set; } = "running"; public int ModelCalls { get; set; } public DateTime LeaseUntil { get; set; } }
public sealed class Message { public long Id { get; set; } public Guid ProjectId { get; set; } public string Role { get; set; } = ""; public string Content { get; set; } = ""; }
public sealed class Interjection { public long Id { get; set; } public Guid ProjectId { get; set; } public string Text { get; set; } = ""; public bool Consumed { get; set; } }
public sealed class Note { public long Id { get; set; } public Guid ProjectId { get; set; } public string Text { get; set; } = ""; }

public sealed class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<LedgerEntry> Ledger => Set<LedgerEntry>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Turn> Turns => Set<Turn>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Interjection> Interjections => Set<Interjection>();
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder b) => b.Entity<Wallet>().HasKey(w => w.UserId);
}
