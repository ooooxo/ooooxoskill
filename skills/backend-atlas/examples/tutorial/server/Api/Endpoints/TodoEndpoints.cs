using Core.Todos;

namespace Api.Endpoints;

public static class TodoEndpoints
{
    public static void MapTodoEndpoints(this IEndpointRouteBuilder app)
    {
        var todos = app.MapGroup("/api/todos").RequireAuthorization();

        todos.MapGet("/", (TodoService svc) => svc.List());
        todos.MapGet("/{id:int}", GetById);
        todos.MapPost("/", async (TodoInput input, TodoService svc) =>
        {
            var todo = await svc.Create(input);
            return Results.Created($"/api/todos/{todo.Id}", todo);
        });
        todos.MapPut("/{id:int}", async (int id, TodoInput input, TodoService svc) =>
            await svc.Update(id, input) ? Results.NoContent() : Results.NotFound());
        todos.MapDelete("/{id:int}", DeleteTodo);
    }

    static async Task<IResult> GetById(int id, TodoService svc) =>
        await svc.Get(id) is { } todo ? Results.Ok(todo) : Results.NotFound();

    static async Task<IResult> DeleteTodo(int id, TodoService svc)
    {
        await svc.Delete(id);
        return Results.NoContent();
    }
}
