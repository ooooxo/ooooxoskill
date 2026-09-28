using Core.Projects;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// 通用增删查：子类只声明实体类型
public abstract class CrudController<T>(Repository<T> repo) : ApiControllerBase where T : class
{
    [HttpGet]
    public Task<List<T>> All() => repo.All();

    [HttpDelete("{id:int}")]
    public Task Delete(int id) => repo.Remove(id);
}
