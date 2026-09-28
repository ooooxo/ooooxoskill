using Api.Endpoints;
using Api.Hubs;
using Api.Workers;
using Core;
using Core.Data;
using Core.Projects;
using Core.Todos;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase("tutorial"));
builder.Services.AddScoped<TodoService>();
builder.Services.AddScoped(typeof(Repository<>));
builder.Services.AddScoped<INotifier, HubNotifier>();
builder.Services.AddMediatR(c => c.RegisterServicesFromAssemblyContaining<ArchiveProject>());
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddHostedService<CleanupWorker>();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { ok = true }));
app.MapTodoEndpoints();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
