using Core.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

public class TagsController(AppDbContext db) : ApiControllerBase
{
    [HttpGet]
    public Task<List<Tag>> List() => db.Tags.ToListAsync();

    [HttpPost]
    public async Task<Tag> Create(Tag tag)
    {
        db.Tags.Add(tag);
        await db.SaveChangesAsync();
        return tag;
    }
}
