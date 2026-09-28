using Demo.Data;
using Microsoft.EntityFrameworkCore;

namespace Demo.Agent;

// agent 能调的工具：名字 + 执行
public interface ITool
{
    string Name { get; }
    Task<string> Run(Guid projectId, string input);
}

// ---------- [ 搜索笔记 ] ----------
public sealed class SearchTool(AppDb db) : ITool
{
    public string Name => "search_notes";
    public async Task<string> Run(Guid projectId, string input) =>
        string.Join("\n", await db.Notes.Where(n => n.ProjectId == projectId && n.Text.Contains(input)).Select(n => n.Text).ToListAsync());
}

// ---------- [ 写一条笔记 ] ----------
public sealed class NoteTool(AppDb db) : ITool
{
    public string Name => "write_note";
    public async Task<string> Run(Guid projectId, string input)
    {
        db.Notes.Add(new Note { ProjectId = projectId, Text = input });
        await db.SaveChangesAsync();
        return "已记下";
    }
}
