using Demo.Agent;
using Demo.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo.Projects;

public sealed record CreateProjectDto(string Title);
public sealed record MessageDto(string Text);

[ApiController, Route("api/projects")]
public sealed class ProjectsController(AppDb db, TurnService turns) : ControllerBase
{
    // ---------- [ 我的项目 ] ----------
    [HttpGet]
    public async Task<List<Project>> List([FromQuery] Guid userId) => await db.Projects.Where(p => p.UserId == userId).ToListAsync();

    // ---------- [ 新建项目 ] ----------
    [HttpPost]
    public async Task<Project> Create([FromQuery] Guid userId, [FromBody] CreateProjectDto body)
    {
        var p = new Project { Id = Guid.NewGuid(), UserId = userId, Title = body.Title };
        db.Projects.Add(p);
        await db.SaveChangesAsync();
        return p;
    }

    // ---------- [ 发消息：空闲时起一个轮次交给后台，进行中则记成插话 ] ----------
    [HttpPost("{id:guid}/messages")]
    public Task<string> Send(Guid id, [FromBody] MessageDto body) => turns.StartOrInterject(id, body.Text);
}
