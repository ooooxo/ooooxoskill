using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.FindSymbols;

namespace Atlas;

// =====================================================
// Walker - 从入口方法沿语义调用链下钻，产出方法节点、资源节点与边
// 只收仓库内方法（解决方案里全部项目）；接口调用按实现展开，MediatR Send/Publish 接到处理器；
// EF / SignalR（含强类型 Hub<T>）/ HttpClient / 缓存 / 文件 IO 落成资源。
// =====================================================
public sealed class Walker(Solution solution, IReadOnlyList<Compilation> comps, string root)
{
    // 显式写操作；跟踪查询 + SaveChanges 的「改」另记 updates（推断，非确证）
    static readonly HashSet<string> WriteOps =
    [
        "Add", "AddAsync", "AddRange", "AddRangeAsync", "Remove", "RemoveRange", "Update", "UpdateRange",
        "Attach", "ExecuteUpdate", "ExecuteUpdateAsync", "ExecuteDelete", "ExecuteDeleteAsync",
    ];
    static readonly HashSet<string> Materialize =
    [
        "First", "FirstAsync", "FirstOrDefault", "FirstOrDefaultAsync", "Single", "SingleAsync",
        "SingleOrDefault", "SingleOrDefaultAsync", "Find", "FindAsync", "ToList", "ToListAsync", "ToArrayAsync",
    ];

    private readonly Dictionary<string, MethodNode> _methods = new();
    private readonly Dictionary<string, Resource> _resources = new();
    private readonly List<Edge> _edges = new();
    private readonly HashSet<string> _edgeKeys = new();
    private readonly Dictionary<IMethodSymbol, List<IMethodSymbol>> _impls = new(SymbolEqualityComparer.Default);
    private readonly Dictionary<SyntaxTree, Compilation> _compOf = comps.SelectMany(c => c.SyntaxTrees.Select(t => (t, c)))
        .GroupBy(x => x.t).ToDictionary(g => g.Key, g => g.First().c);
    private readonly Dictionary<string, SyntaxNode> _inline = new();

    // 强类型 Hub<T> 的 T（客户端接口）：Clients.All.ReceiveMessage(...) 就是推 ReceiveMessage
    public HashSet<string> HubClients { get; } = new();

    public IEnumerable<MethodNode> Methods => _methods.Values.OrderBy(m => m.File).ThenBy(m => m.Line);
    public List<Resource> Resources => _resources.Values.OrderBy(r => r.Kind).ThenBy(r => r.Label).ToList();
    public List<Edge> Edges => _edges;


    // ────────────────── 位置 ──────────────────

    // ---------- [ 自己的代码＝仓库内源码，排除 obj/bin 生成物与包内符号 ] ----------
    public bool Own(ISymbol s) => s.Locations.Any(l => l.IsInSource && Own(l.SourceTree!.FilePath));
    public bool Own(string path) => path.StartsWith(root) && !path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}") && !path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}");

    public string Rel(SyntaxNode n) => Path.GetRelativePath(root, n.SyntaxTree.FilePath);
    public SemanticModel Model(SyntaxTree t) => _compOf[t].GetSemanticModel(t);
    public IEnumerable<SyntaxTree> OwnTrees => _compOf.Keys.Where(t => Own(t.FilePath)).OrderBy(t => t.FilePath);
    public SyntaxNode? Inline(string id) => _inline.GetValueOrDefault(id);

    // 方法 id（m:文档注释 id）→ 符号：多项目时逐个编译找
    public IMethodSymbol? Symbol(string methodId)
    {
        var docId = methodId.StartsWith("m:") ? methodId[2..] : methodId;
        return comps.Select(c => DocumentationCommentId.GetFirstSymbolForDeclarationId(docId, c)).OfType<IMethodSymbol>().FirstOrDefault(Own);
    }
    public static int LineOf(SyntaxNode n) => n.GetLocation().GetLineSpan().StartLinePosition.Line + 1;
    static int EndOf(SyntaxNode n) => n.GetLocation().GetLineSpan().EndLinePosition.Line + 1;


    // ────────────────── 节点 ──────────────────

    // ---------- [ 首次见到的方法才建节点并下钻；递归环由「已建」短路 ] ----------
    public async Task<string> Visit(IMethodSymbol m)
    {
        m = m.OriginalDefinition;
        var id = "m:" + (m.GetDocumentationCommentId() ?? m.ToDisplayString());
        if (_methods.ContainsKey(id)) return id;
        var decl = m.DeclaringSyntaxReferences.Select(r => r.GetSyntax()).First(n => Own(n.SyntaxTree.FilePath));
        // 方法名所在行（跳过特性行），跳转源码时落在签名上
        var line = decl is MethodDeclarationSyntax md
            ? md.Identifier.GetLocation().GetLineSpan().StartLinePosition.Line + 1
            : LineOf(decl);
        _methods[id] = new MethodNode
        {
            Id = id, Label = $"{m.ContainingType.Name}.{m.Name}", Type = m.ContainingType.Name,
            File = Rel(decl), Line = line, EndLine = EndOf(decl), Summary = Comments.Leading(decl),
        };
        await Walk(decl, id, m.ContainingType.Name);
        return id;
    }


    // ---------- [ 内联 lambda（Program.cs 的 app.Use(async ...)）当方法节点 ] ----------
    public async Task<string> VisitInline(SyntaxNode lambda, string label)
    {
        var id = $"m:inline:{Rel(lambda)}:{LineOf(lambda)}";
        if (_methods.ContainsKey(id)) return id;
        _inline[id] = lambda;
        _methods[id] = new MethodNode
        {
            Id = id, Label = label, Type = "Program", File = Rel(lambda),
            Line = LineOf(lambda), EndLine = EndOf(lambda), Summary = Comments.Nearest(lambda),
        };
        await Walk(lambda, id, "Program");
        return id;
    }


    public bool IsUtil(string id) => _methods.TryGetValue(id, out var m) && m.Util;


    // ---------- [ 高扇入且整个下游都不落资源的方法标 util：ApiResult.Ok、TryGetUserId 这类 ] ----------
    // 必须看传递下游：NotifyMessage 扇入高、自己不推送，但经下一跳推 SocialHint，是业务循环的关键一跳
    public void MarkUtil(IEnumerable<string?> entryMethods, int threshold = 6)
    {
        var calls = _edges.Where(e => e.Kind == "calls").ToList();
        var fanIn = calls.GroupBy(e => e.To).ToDictionary(g => g.Key, g => g.Select(e => e.From).Distinct().Count());
        var callers = calls.GroupBy(e => e.To).ToDictionary(g => g.Key, g => g.Select(e => e.From).ToList());
        var reaches = _edges.Where(e => e.Kind != "calls").Select(e => e.From).ToHashSet();
        var queue = new Queue<string>(reaches);
        while (queue.TryDequeue(out var id))
            foreach (var c in callers.GetValueOrDefault(id) ?? [])
                if (reaches.Add(c)) queue.Enqueue(c);
        var entrySet = entryMethods.Where(x => x is not null).ToHashSet();
        foreach (var m in _methods.Values)
            m.Util = fanIn.GetValueOrDefault(m.Id) >= threshold && !reaches.Contains(m.Id) && !entrySet.Contains(m.Id);
    }


    // ────────────────── 下钻 ──────────────────

    // ---------- [ 扫一段语法：DbSet 访问与调用逐个归类成边（含嵌套 lambda / 本地函数） ] ----------
    async Task Walk(SyntaxNode body, string from, string ctxType)
    {
        var model = Model(body.SyntaxTree);
        var saves = body.ToString().Contains("SaveChanges");
        foreach (var n in body.DescendantNodes())
        {
            if (n is MemberAccessExpressionSyntax ma) Table(model, ma, from, saves);
            else if (n is InvocationExpressionSyntax inv) await Invocation(model, inv, from, ctxType, saves);
        }
    }


    // ---------- [ db.Xxx：显式增删改＝writes，跟踪实体 + SaveChanges＝updates，其余 reads ] ----------
    void Table(SemanticModel model, MemberAccessExpressionSyntax ma, string from, bool saves)
    {
        var t = model.GetSymbolInfo(ma).Symbol switch
        {
            IPropertySymbol p => p.Type, IFieldSymbol f => f.Type, _ => null,
        } as INamedTypeSymbol;
        if (t is not { Name: "DbSet", TypeArguments.Length: 1 } || t.TypeArguments[0] is ITypeParameterSymbol) return;
        TableEdge(ma, t.TypeArguments[0].Name, from, saves);
    }


    // db.Set<Project>()：实体类型写在泛型实参里；泛型仓储的 Set<T>() 运行时才知道，不猜
    void TableEdge(SyntaxNode at, string entity, string from, bool saves)
    {
        var chain = Chain(at);
        var kind = chain.Any(WriteOps.Contains) ? "writes"
            : saves && !chain.Contains("AsNoTracking") && !chain.Contains("Select") && chain.Any(Materialize.Contains) ? "updates"
            : "reads";
        Link(from, Res("t:" + entity, "table", entity), kind, at, [], When(at), false);
    }


    // ---------- [ 调用归类：资源调用落资源边，仓库内方法落 calls 边并递归 ] ----------
    async Task Invocation(SemanticModel model, InvocationExpressionSyntax inv, string from, string ctxType, bool saves)
    {
        var info = model.GetSymbolInfo(inv);
        if ((info.Symbol ?? info.CandidateSymbols.FirstOrDefault()) is not IMethodSymbol sym) return;
        var def = (sym.ReducedFrom ?? sym).OriginalDefinition;
        var type = def.ContainingType;
        var ns = type?.ContainingNamespace?.ToDisplayString() ?? "";
        var args = Literals(model, inv);
        var when = When(inv);
        var async = IsAsync(inv);

        if (def.Name is "SendAsync" or "SendCoreAsync" && ns.StartsWith("Microsoft.AspNetCore.SignalR"))
        {   // 事件名必须是第一个实参本身的常量；不是常量就记「?」，不拿载荷里的常量顶替
            var ev = inv.ArgumentList.Arguments.Count > 0 && model.GetConstantValue(inv.ArgumentList.Arguments[0].Expression) is { HasValue: true, Value: string e } ? e : "?";
            Link(from, Res("h:" + ev, "hubEvent", ev), "pushes", inv, ev == "?" ? args : args.Skip(1).ToArray(), when, async);
            return;
        }
        if (type is { TypeKind: TypeKind.Interface } && HubClients.Contains(type.ToDisplayString()))
        {   // 强类型 Hub：Clients.All.ReceiveMessage(user, text) = 推 ReceiveMessage
            Link(from, Res("h:" + def.Name, "hubEvent", def.Name), "pushes", inv, args, when, async);
            return;
        }
        if (def.Name == "Set" && IsDbContext(type) && sym.TypeArguments is [INamedTypeSymbol entity])
        {
            TableEdge(inv, entity.Name, from, saves);
            return;
        }
        if (ns is "System.Net.Http" or "System.Net.Http.Json" && type!.Name is "HttpClient" or "HttpClientJsonExtensions")
        {
            Link(from, Res("x:" + ctxType, "external", ctxType), "http", inv, [def.Name, .. args], when, async);
            return;
        }
        if (ns.StartsWith("Microsoft.Extensions.Caching.Memory"))
        {
            Link(from, Res("cache", "cache", "内存缓存"), "cache", inv, [def.Name], when, async);
            return;
        }
        if (ns == "System.IO" && type!.Name is "File" or "Directory")
        {
            Link(from, Res("disk", "disk", "本地磁盘"), "io", inv, [def.Name], when, async);
            return;
        }
        if (WriteOps.Contains(def.Name) && IsDbContext(type) && inv.ArgumentList.Arguments.Count > 0
            && model.GetTypeInfo(inv.ArgumentList.Arguments[0].Expression).Type is { SpecialType: not SpecialType.System_Object } et)
        {   // db.Add(object)：实体类型运行时才知道，静态不猜，不落假表
            Link(from, Res("t:" + et.Name, "table", et.Name), "writes", inv, [], when, async);
            return;
        }

        foreach (var t in await Targets(model, inv, def))
            Link(from, await Visit(t), "calls", inv, args, when, async);
    }


    // ---------- [ 一个调用会走到哪些仓库内方法：本身 / 接口与抽象的实现 / MediatR 的处理器（Flows 共用） ] ----------
    public async Task<List<IMethodSymbol>> Targets(SemanticModel model, InvocationExpressionSyntax inv, IMethodSymbol def)
    {
        if (def.Name is "Send" or "Publish" && def.ContainingNamespace?.ToDisplayString() == "MediatR" && inv.ArgumentList.Arguments.Count > 0
            && model.GetTypeInfo(inv.ArgumentList.Arguments[0].Expression).Type is INamedTypeSymbol req)
            return Handlers(req);
        if (!Own(def) || def.IsImplicitlyDeclared) return [];
        if (def.MethodKind is MethodKind.LocalFunction or MethodKind.AnonymousFunction) return []; // 已随外层方法内联扫过
        return def.ContainingType!.TypeKind == TypeKind.Interface || def.IsAbstract ? await Impls(def) : [def];
    }


    // IRequestHandler<Req, …> / INotificationHandler<Req> 的 Handle
    List<IMethodSymbol> Handlers(INamedTypeSymbol req)
    {
        var found = new List<IMethodSymbol>();
        foreach (var t in OwnTrees.SelectMany(tr => tr.GetRoot().DescendantNodes().OfType<ClassDeclarationSyntax>().Select(c => Model(tr).GetDeclaredSymbol(c))).OfType<INamedTypeSymbol>())
            if (t.AllInterfaces.Any(i => i.Name is "IRequestHandler" or "INotificationHandler" && i.ContainingNamespace.ToDisplayString() == "MediatR"
                    && i.TypeArguments.FirstOrDefault()?.ToDisplayString() == req.ToDisplayString()))   // 跨项目的同一类型不是同一个符号对象，按全名比
                found.AddRange(t.GetMembers("Handle").OfType<IMethodSymbol>().Where(Own));
        return found;
    }


    // ---------- [ 接口 / 抽象方法 → 仓库内实现（DI 注册的就是它们） ] ----------
    async Task<List<IMethodSymbol>> Impls(IMethodSymbol def)
    {
        if (_impls.TryGetValue(def, out var hit)) return hit;
        // 接口成员找实现；抽象 / 虚方法找覆盖（TimedWorker.Tick → CleanupWorker.Tick）
        var raw = def.ContainingType.TypeKind == TypeKind.Interface
            ? await SymbolFinder.FindImplementationsAsync(def, solution)
            : await SymbolFinder.FindOverridesAsync(def, solution);
        var found = raw.OfType<IMethodSymbol>().Where(Own).ToList();
        _impls[def] = found;
        return found;
    }


    // ────────────────── 私有辅助 ──────────────────

    string Res(string id, string kind, string label)
    {
        _resources.TryAdd(id, new Resource(id, kind, label));
        return id;
    }


    void Link(string from, string to, string kind, SyntaxNode at, string[] args, string? when, bool async)
    {
        var line = LineOf(at);
        if (!_edgeKeys.Add($"{from}|{to}|{kind}|{line}")) return;
        _edges.Add(new Edge(from, to, kind, async, Rel(at), line, args, when));
    }


    // ---------- [ 流式链上的方法名：db.X.Where().AsNoTracking().ToListAsync() → [Where, AsNoTracking, ToListAsync] ] ----------
    static List<string> Chain(SyntaxNode n)
    {
        var names = new List<string>();
        for (var cur = n; ;)
        {
            if (cur.Parent is MemberAccessExpressionSyntax p && p.Expression == cur) { names.Add(p.Name.Identifier.Text); cur = p; }
            else if (cur.Parent is InvocationExpressionSyntax i && i.Expression == cur) cur = i;
            else return names;
        }
    }


    // ---------- [ 实参里的字符串常量 + 匿名对象的常量字段（推送载荷 new { kind = "x" }） ] ----------
    static string[] Literals(SemanticModel model, InvocationExpressionSyntax inv)
    {
        var out_ = new List<string>();
        foreach (var a in inv.ArgumentList.Arguments) Collect(model, a.Expression, null, out_);
        return out_.ToArray();
    }


    static void Collect(SemanticModel model, ExpressionSyntax e, string? name, List<string> acc)
    {
        if (e is AnonymousObjectCreationExpressionSyntax anon)
        {
            foreach (var m in anon.Initializers)
            {
                var key = m.NameEquals?.Name.Identifier.Text ?? (m.Expression as IdentifierNameSyntax)?.Identifier.Text;
                Collect(model, m.Expression, key, acc);
            }
            return;
        }
        if (model.GetConstantValue(e) is { HasValue: true, Value: string s })
            acc.Add(name is null ? s : $"{name}={s}");
    }


    // ---------- [ 最近外层 if / switch 条件：边在什么分支下才走 ] ----------
    static string? When(SyntaxNode n)
    {
        foreach (var a in n.Ancestors())
        {
            if (a is MemberDeclarationSyntax or LocalFunctionStatementSyntax) return null;
            if (a is IfStatementSyntax ifs && !ifs.Condition.Span.Contains(n.Span))
            {
                var cond = Squash(ifs.Condition.ToString());
                return ifs.Else?.Span.Contains(n.Span) == true ? $"!({cond})" : cond;
            }
            if (a is SwitchSectionSyntax sec)
                return "case " + string.Join(" | ", sec.Labels.Select(l => Squash(l.ToString().Replace("case ", "").TrimEnd(':'))));
        }
        return null;
    }


    // ---------- [ 发出不等：Task.Run / StartNew 的 lambda 体内，或 _ = X() ] ----------
    static bool IsAsync(InvocationExpressionSyntax inv)
    {
        if (inv.Parent is AssignmentExpressionSyntax { Left: IdentifierNameSyntax { Identifier.Text: "_" } }) return true;
        foreach (var a in inv.Ancestors())
        {
            if (a is MemberDeclarationSyntax) return false;
            if (a is LambdaExpressionSyntax && a.Parent is ArgumentSyntax { Parent.Parent: InvocationExpressionSyntax host }
                && host.Expression.ToString() is var s && (s.EndsWith("Task.Run") || s.EndsWith("StartNew"))) return true;
        }
        return false;
    }


    static bool IsDbContext(INamedTypeSymbol? t)
    {
        for (; t is not null; t = t.BaseType)
            if (t.Name == "DbContext" && t.ContainingNamespace.ToDisplayString() == "Microsoft.EntityFrameworkCore") return true;
        return false;
    }


    static string Squash(string s)
    {
        var one = string.Join(' ', s.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        return one.Length > 80 ? one[..80] + "…" : one;
    }
}
