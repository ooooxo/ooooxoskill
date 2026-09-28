using Demo.Data;

namespace Demo.Agent;

public sealed record ToolCall(string Name, string Input);
public sealed record ModelReply(string Text, List<ToolCall> ToolCalls);

// =====================================================
// ModelClient - 调大模型：把对话历史发过去，拿回一段话和要调的工具
// =====================================================
public sealed class ModelClient(HttpClient http)
{
    // ---------- [ 调一次模型 ] ----------
    public async Task<ModelReply> Complete(List<Message> history)
    {
        var resp = await http.PostAsJsonAsync("https://api.example.com/v1/chat", new { messages = history.Select(m => new { m.Role, m.Content }) });
        resp.EnsureSuccessStatusCode();
        return await resp.Content.ReadFromJsonAsync<ModelReply>() ?? new ModelReply("", []);
    }
}
