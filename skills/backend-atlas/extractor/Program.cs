// =====================================================
// atlas-extract - Roslyn 语义抽取 ASP.NET Core 项目：入口 · 调用链 · 资源读写 → graph.json
// 怎么跑：dotnet run -c Release --project extractor -- <X.csproj> <out/graph.json>
// 需要：.NET 10 SDK；目标项目可 restore。工作区编译有错即失败退出（图不能建在坏代码上）。
// =====================================================
using System.Diagnostics;
using System.Text.Encodings.Web;
using System.Text.Json;
using Atlas;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.MSBuild;

if (args.Length != 2)
{
    Console.Error.WriteLine("usage: atlas-extract <project.csproj | solution.sln | solution.slnx> <graph.json>");
    return 2;
}

var sw = Stopwatch.StartNew();
var input = Path.GetFullPath(args[0]);
if (!File.Exists(input)) { Console.Error.WriteLine($"找不到 {input}"); return 2; }
using var ws = MSBuildWorkspace.Create();
// 给 .csproj：它 + 它引用的项目（分层项目的 Core / Infrastructure 一起进来）；给 .sln / .slnx：解决方案里全部项目
var isSln = input.EndsWith(".sln") || input.EndsWith(".slnx");
var solution = isSln ? await ws.OpenSolutionAsync(input) : (await ws.OpenProjectAsync(input)).Solution;
var name = isSln ? Path.GetFileNameWithoutExtension(input) : solution.Projects.First(p => p.FilePath == input).Name;
var projects = solution.Projects.Where(p => p.Language == LanguageNames.CSharp && p.FilePath is not null).ToList();
var tLoad = sw.Elapsed;
foreach (var d in ws.Diagnostics.Where(d => d.Kind == WorkspaceDiagnosticKind.Failure))
    Console.Error.WriteLine($"workspace: {d.Message}");
if (projects.Count == 0) { Console.Error.WriteLine($"{input} 里没有 C# 项目"); return 1; }

var comps = new List<Compilation>();
var errors = new List<Diagnostic>();
foreach (var p in projects)
{
    var c = await p.GetCompilationAsync() ?? throw new InvalidOperationException($"无法取得编译：{p.Name}");
    comps.Add(c);
    errors.AddRange(c.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error));
}
var tComp = sw.Elapsed;
if (errors.Count > 0)
{
    foreach (var e in errors.Take(10)) Console.Error.WriteLine(e);
    Console.Error.WriteLine($"{errors.Count} compile errors — 先让项目能编译再抽取（没 restore 过先 dotnet restore）");
    return 1;
}

// 仓库相对路径的根：全部项目目录的公共祖先
var root = CommonRoot(projects.Select(p => Path.GetDirectoryName(p.FilePath!)!)) + Path.DirectorySeparatorChar;
var walker = new Walker(solution, comps, root);
foreach (var t in walker.OwnTrees)
    foreach (var c in t.GetRoot().DescendantNodes().OfType<Microsoft.CodeAnalysis.CSharp.Syntax.ClassDeclarationSyntax>())
        for (var b = (walker.Model(t).GetDeclaredSymbol(c) as INamedTypeSymbol)?.BaseType; b is not null; b = b.BaseType)
            if (b is { Name: "Hub", TypeArguments: [var client] }) walker.HubClients.Add(client.ToDisplayString());
var entries = new Entries(walker);
await entries.Collect();
walker.MarkUtil(entries.Items.Select(e => e.Method));
var tWalk = sw.Elapsed;
var flows = new Flows(walker);
await flows.Collect(entries.Items);
var tFlow = sw.Elapsed;

var (rev, dirty) = Git(root);
var methods = walker.Methods.ToList();
var graph = new Graph(1, name, root.TrimEnd(Path.DirectorySeparatorChar), rev, dirty, DateTime.UtcNow.ToString("o"),
    entries.Modules, entries.Items, walker.Methods.ToList(), walker.Resources, walker.Edges, flows.Items);

var outPath = Path.GetFullPath(args[1]);
Directory.CreateDirectory(Path.GetDirectoryName(outPath)!);
File.WriteAllText(outPath, JsonSerializer.Serialize(graph, new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true,
    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping, // 中文注释原样可读
}));
Console.WriteLine($"{name} @ {rev[..Math.Min(8, rev.Length)]}{(dirty > 0 ? $" (+{dirty} dirty)" : "")}: " +
    $"{entries.Items.Count} entries · {methods.Count} methods ({methods.Count(m => m.Util)} util) · " +
    $"{walker.Resources.Count} resources · {walker.Edges.Count} edges · {flows.Items.Count} flows · {sw.Elapsed.TotalSeconds:F1}s" +
    $"（加载 {tLoad.TotalSeconds:F1} · 编译 {(tComp - tLoad).TotalSeconds:F1} · 遍历 {(tWalk - tComp).TotalSeconds:F1} · 流程 {(tFlow - tWalk).TotalSeconds:F1}）");
return 0;


// ---------- [ 当前 HEAD 与未提交文件数：图描述的是工作区，dirty 必须可见；不在 git 里（zip 下载、新项目）就记 nogit 并警告 ] ----------
static (string Rev, int Dirty) Git(string dir)
{
    string? Run(string a)
    {
        try
        {
            var p = Process.Start(new ProcessStartInfo("git", $"-C \"{dir}\" {a}") { RedirectStandardOutput = true, RedirectStandardError = true })!;
            var o = p.StandardOutput.ReadToEnd();
            p.WaitForExit();
            return p.ExitCode == 0 ? o.Trim() : null;
        }
        catch (System.ComponentModel.Win32Exception) { return null; }   // 没装 git
    }
    var rev = Run("rev-parse HEAD");
    if (rev is null) { Console.Error.WriteLine($"注意：{dir} 不在 git 仓库里或还没有提交，版本记为 nogit"); return ("nogit", 0); }
    return (rev, (Run("status --porcelain -- .") ?? "").Split('\n', StringSplitOptions.RemoveEmptyEntries).Length);
}


static string CommonRoot(IEnumerable<string> dirs)
{
    var parts = dirs.Select(d => d.TrimEnd(Path.DirectorySeparatorChar).Split(Path.DirectorySeparatorChar)).ToList();
    var n = 0;
    while (parts.All(p => p.Length > n && p[n] == parts[0][n])) n++;
    return string.Join(Path.DirectorySeparatorChar, parts[0].Take(n));
}
