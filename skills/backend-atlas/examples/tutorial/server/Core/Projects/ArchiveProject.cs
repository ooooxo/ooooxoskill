using Core.Data;
using MediatR;

namespace Core.Projects;

public record ArchiveProject(int Id) : IRequest<bool>;

public class ArchiveProjectHandler(AppDbContext db) : IRequestHandler<ArchiveProject, bool>
{
    public async Task<bool> Handle(ArchiveProject request, CancellationToken ct)
    {
        var project = await db.Set<Project>().FindAsync([request.Id], ct);
        if (project is null) return false;
        project.ArchivedAt = DateTime.UtcNow;
        db.AuditLogs.Add(new AuditLog { Action = "project.archive", At = DateTime.UtcNow });
        await db.SaveChangesAsync(ct);
        return true;
    }
}
