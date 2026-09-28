namespace Atlas;

// =====================================================
// Model - graph.json 的全部形状（viewer 只认这些字段）
// 入口/方法/资源是节点，Edge 连它们；位置一律仓库相对路径 + 1 起行号。
// =====================================================

// 模块：一个 Controller / Hub / 后台服务 / 管线，入口的分组单位
public sealed record Module(string Id, string Label, string Kind, string File, int Line, int EndLine, string? Summary);

// 入口：外部能触发执行的点。Kind ∈ http / hub / hosted / middleware / setup / startup
public sealed record Entry(
    string Id, string Kind, string Module, string[] Verbs, string? Route,
    string Auth, string? RateLimit, bool Conditional, string? Method,
    string File, int Line, string? Summary, int Order);

// 方法：调用链上的一个仓库内方法（含内联中间件 lambda）
public sealed class MethodNode
{
    public required string Id { get; init; }
    public required string Label { get; init; }
    public required string Type { get; init; }
    public required string File { get; init; }
    public required int Line { get; init; }
    public required int EndLine { get; init; }
    public string? Summary { get; init; }
    public bool Util { get; set; } // 高扇入的纯工具方法，viewer 默认折叠
}

// 资源：调用链的落点。Kind ∈ table / hubEvent / external / cache / disk
public sealed record Resource(string Id, string Kind, string Label);

// 边：Kind ∈ calls / reads / writes / pushes / http / cache / io；Async＝Task.Run 或 _ = 发出不等
// Args＝调用点的字符串常量实参 + 推送载荷里的常量字段（kind=message）；When＝最近外层 if 条件。
// 这两样是跨端拼业务循环的钥匙：服务端推 SocialHint{kind,op} ↔ 客户端按同样的 kind 分流。
public sealed record Edge(string From, string To, string Kind, bool Async, string File, int Line, string[] Args, string? When);

// 流程：一个入口（或被 Task.Run 带到后台的方法）的控制流骨架，见 Flows.cs
// Inputs＝入口方法带进来的东西：普通参数写「名字」，项目自己的请求类（MessageDto）展开成它的字段；CancellationToken 这类不算
public sealed record Flow(string Id, string Kind, FlowNode Root, string[] Inputs);

// K ∈ call / if(then/else) / guard / loop / switch(case) / try(catch) / exit / bg(link)
// Key＝稳定锚点「方法 › 种类:关键文本」，语义层整理流程时引用它；挪行号不变，改了那条语句才变
public sealed class FlowNode
{
    public required string K { get; init; }
    public required string T { get; init; }
    public required string File { get; init; }
    public required int Line { get; init; }
    public required string Key { get; init; }
    public string? Method { get; init; }
    public string? Note { get; set; }
    public string? Code { get; set; }
    public string? How { get; set; }
    public string[]? Args { get; set; }   // 调用点的字符串常量实参：Publish(…, "turn_started") → [turn_started]
    public List<FlowNode>? Kids { get; set; }
}

// Root＝全部路径的基准目录（多项目时是各项目目录的公共祖先），viewer 拼源码跳转用
public sealed record Graph(
    int Schema, string Project, string Root, string Revision, int DirtyFiles, string GeneratedAt,
    List<Module> Modules, List<Entry> Entries, List<MethodNode> Methods,
    List<Resource> Resources, List<Edge> Edges, List<Flow> Flows);
