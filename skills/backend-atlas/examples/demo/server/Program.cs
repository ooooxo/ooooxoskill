using Demo.Agent;
using Demo.Billing;
using Demo.Common;
using Demo.Data;
using Demo.Realtime;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDb>(o => o.UseInMemoryDatabase("demo"));
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddScoped<WalletService>();
builder.Services.AddScoped<TurnService>();
builder.Services.AddScoped<TurnRunner>();
builder.Services.AddScoped<ProjectEvents>();
builder.Services.AddSingleton<TurnHost>();
builder.Services.AddScoped<ITool, SearchTool>();
builder.Services.AddScoped<ITool, NoteTool>();
builder.Services.AddHttpClient<ModelClient>();
builder.Services.AddHostedService<LeaseSweeper>();

var app = builder.Build();
app.UseMiddleware<ErrorMiddleware>();
app.MapControllers();
app.MapHub<ProjectHub>("/hubs/project");
app.Run();
