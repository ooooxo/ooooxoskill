using Core.Data;
using Core.Projects;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public class ProjectsController(Repository<Project> repo, IMediator mediator) : CrudController<Project>(repo)
{
    [HttpPost("{id:int}/archive")]
    public async Task<IActionResult> Archive(int id) =>
        await mediator.Send(new ArchiveProject(id)) ? NoContent() : NotFound();
}
