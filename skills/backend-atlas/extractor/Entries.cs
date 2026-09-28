using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Atlas;

// =====================================================
// Entries - 找出全部外部可触发的入口并交给 Walker 下钻
// Controller 属性路由（按语义解析特性，含基类上的 Route / Authorize 与继承来的动作）· Minimal API（MapGet… 含 MapGroup 前缀）·
// Hub 方法 · HostedService · 启动管线（Program.cs 顶层语句或 Startup.Configure，按源码顺序）。
// =====================================================
public sealed class Entries(Walker w)
{
    static readonly Dictionary<string, string> MapVerbs = new()
    {
        ["MapGet"] = "GET", ["MapPost"] = "POST", ["MapPut"] = "PUT", ["MapDelete"] = "DELETE", ["MapPatch"] = "PATCH",
    };

    private int _order;

    public List<Module> Modules { get; } = new();
    public List<Entry> Items { get; } = new();


    // ---------- [ 先扫管线拿 MapHub 路径，再按类型分派 ] ----------
    public async Task Collect()
    {
        var hubPaths = await Pipeline();
        await MinimalApis();
        foreach (var t in OwnTypes())
        {
            if (Derives(t, "ControllerBase")) { if (!t.IsAbstract) await Controller(t); }
            else if (Derives(t, "Hub")) await Hub(t, hubPaths);
            else if (!t.IsAbstract && t.AllInterfaces.Any(i => i.Name == "IHostedService")) await Hosted(t);
        }
    }


    // ────────────────── 四类入口 ──────────────────

    // ---------- [ Controller：每个 (路由模板 × 动词集) 一条入口，多条共享同一动作方法 ] ----------
    // Route / Authorize 可写在基类上（ASP.NET 按继承生效）；动作可继承自基类（泛型 CrudController<T>），[controller] 取子类名
    async Task Controller(INamedTypeSymbol t)
    {
        var decl = Decl(t);
        var name = t.Name.EndsWith("Controller") ? t.Name[..^"Controller".Length] : t.Name;
        var mod = new Module("c:" + t.Name, name, "controller", w.Rel(decl), Walker.LineOf(decl), EndOf(decl), Comments.Leading(decl));
        var classRoutes = Chain(t).Select(c => c.GetAttributes().Where(a => a.AttributeClass?.Name == "RouteAttribute").Select(Template).OfType<string>().ToList())
            .FirstOrDefault(l => l.Count > 0) ?? [""];

        var actions = new List<IMethodSymbol>();
        foreach (var c in Chain(t).Where(c => w.Own(c)))
            foreach (var m in c.GetMembers().OfType<IMethodSymbol>()
                         .Where(m => m.MethodKind == MethodKind.Ordinary && m.DeclaredAccessibility == Accessibility.Public && !m.IsStatic && !m.IsAbstract)
                         .OrderBy(m => m.Locations[0].SourceSpan.Start))
                if (!actions.Any(x => Overrides(x, m))) actions.Add(m);
        foreach (var m in actions)
        {
            var routes = Routes(m);
            if (routes.Count == 0) continue;
            var mid = await w.Visit(m);
            var auth = Auth(m, t);
            var rate = Rate(m, t);
            var md = Decl(m);
            var summary = Comments.Leading(md);
            foreach (var (tpl, verbs, line) in routes)
            foreach (var cr in classRoutes)
            {
                var route = "/" + Combine(cr, tpl).Replace("[controller]", name).Replace("[action]", m.Name);
                Items.Add(new Entry($"e:{string.Join(",", verbs)} {route}", "http", mod.Id, verbs, route,
                    auth, rate, false, mid, w.Rel(md), line, summary, _order++));
            }
        }
        if (Items.Any(e => e.Module == mod.Id)) Modules.Add(mod);
    }


    // ---------- [ Minimal API：app.MapGet("/x", 处理器)，前缀沿 MapGroup 链与局部变量往回拼；处理器是 lambda 或方法组 ] ----------
    async Task MinimalApis()
    {
        foreach (var tree in w.OwnTrees)
        {
            var model = w.Model(tree);
            foreach (var inv in tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>())
            {
                if (inv.Expression is not MemberAccessExpressionSyntax ma || !IsMap(ma.Name.Identifier.Text)) continue;
                if (model.GetSymbolInfo(inv).Symbol is not IMethodSymbol sym || (sym.ReducedFrom ?? sym).ContainingType.Name != "EndpointRouteBuilderExtensions") continue;
                var name = ma.Name.Identifier.Text;
                var args = inv.ArgumentList.Arguments;
                if (args.Count < 2 || model.GetConstantValue(args[0].Expression) is not { HasValue: true, Value: string tpl }) continue;
                var verbs = name == "MapMethods"
                    ? args[1].Expression.DescendantNodesAndSelf().OfType<LiteralExpressionSyntax>().Select(l => l.Token.ValueText.ToUpperInvariant()).ToArray()
                    : [MapVerbs[name]];
                var route = JoinRoute(Prefix(ma.Expression, model), tpl);
                var handler = args[^1].Expression;
                string? mid = null;
                ISymbol? hs = null;
                if (handler is AnonymousFunctionExpressionSyntax lam) mid = await w.VisitInline(lam, $"{string.Join(",", verbs)} {route}");
                else if (model.GetSymbolInfo(handler) is var hi && (hi.Symbol ?? hi.CandidateSymbols.FirstOrDefault()) is IMethodSymbol hm && w.Own(hm)) { mid = await w.Visit(hm); hs = hm; }

                var file = w.Rel(inv);
                var modId = "ep:" + file;
                if (Modules.All(m => m.Id != modId))
                    Modules.Add(new Module(modId, Path.GetFileNameWithoutExtension(file), "endpoints", file, 1, EndOf(tree.GetRoot()), null));
                var stmt = inv.FirstAncestorOrSelf<StatementSyntax>();
                Items.Add(new Entry($"e:{string.Join(",", verbs)} {route}", "http", modId, verbs, route,
                    MinimalAuth(inv, ma.Expression, model, hs), null, false, mid, file, Walker.LineOf(inv),
                    stmt is null ? null : Comments.Leading(stmt), _order++));
            }
        }
    }


    static bool IsMap(string n) => MapVerbs.ContainsKey(n) || n == "MapMethods";


    // todos.MapGet(...)：todos = app.MapGroup("/api/todos").RequireAuthorization() → "/api/todos"
    static string Prefix(ExpressionSyntax e, SemanticModel model, int depth = 0)
    {
        if (depth > 8) return "";
        switch (e)
        {
            case InvocationExpressionSyntax { Expression: MemberAccessExpressionSyntax m } i:
                var inner = Prefix(m.Expression, model, depth + 1);
                return m.Name.Identifier.Text == "MapGroup" && i.ArgumentList.Arguments.Count > 0
                       && model.GetConstantValue(i.ArgumentList.Arguments[0].Expression) is { HasValue: true, Value: string g }
                    ? JoinRoute(inner, g) : inner;
            case IdentifierNameSyntax id when model.GetSymbolInfo(id).Symbol is ILocalSymbol local
                                              && local.DeclaringSyntaxReferences.FirstOrDefault()?.GetSyntax() is VariableDeclaratorSyntax { Initializer.Value: { } init }:
                return Prefix(init, model, depth + 1);
            default:
                return "";
        }
    }


    // 端点自己链上的 .RequireAuthorization() / .AllowAnonymous()，所在组链上的，处理器方法上的特性
    static string MinimalAuth(InvocationExpressionSyntax map, ExpressionSyntax recv, SemanticModel model, ISymbol? handler)
    {
        var names = new List<string>();
        for (SyntaxNode? cur = map; cur?.Parent is MemberAccessExpressionSyntax pm && pm.Parent is InvocationExpressionSyntax pi; cur = pi)
            names.Add(pm.Name.Identifier.Text);
        names.AddRange(GroupCalls(recv, model, 0));
        if (names.Contains("AllowAnonymous") || handler is not null && Has(handler, "AllowAnonymousAttribute")) return "anonymous";
        return names.Contains("RequireAuthorization") || handler is not null && Has(handler, "AuthorizeAttribute") ? "jwt" : "none";
    }


    static IEnumerable<string> GroupCalls(ExpressionSyntax e, SemanticModel model, int depth)
    {
        if (depth > 8) yield break;
        if (e is InvocationExpressionSyntax { Expression: MemberAccessExpressionSyntax m })
        {
            yield return m.Name.Identifier.Text;
            foreach (var x in GroupCalls(m.Expression, model, depth + 1)) yield return x;
        }
        else if (e is IdentifierNameSyntax id && model.GetSymbolInfo(id).Symbol is ILocalSymbol local
                 && local.DeclaringSyntaxReferences.FirstOrDefault()?.GetSyntax() is VariableDeclaratorSyntax { Initializer.Value: { } init })
            foreach (var x in GroupCalls(init, model, depth + 1)) yield return x;
    }


    static string JoinRoute(string prefix, string tpl)
    {
        var joined = "/" + string.Join('/', new[] { prefix, tpl }.Select(p => p.Trim('/')).Where(p => p.Length > 0));
        return joined;
    }


    // ---------- [ Hub：公开方法与连接生命周期回调，路径取自 MapHub<T>("...") ] ----------
    async Task Hub(INamedTypeSymbol t, Dictionary<string, string> paths)
    {
        var decl = Decl(t);
        var mod = new Module("hub:" + t.Name, t.Name, "hub", w.Rel(decl), Walker.LineOf(decl), EndOf(decl), Comments.Leading(decl));
        Modules.Add(mod);
        var auth = Has(t, "AllowAnonymousAttribute") ? "anonymous" : Has(t, "AuthorizeAttribute") ? "jwt" : "none";
        foreach (var m in t.GetMembers().OfType<IMethodSymbol>()
                     .Where(m => m.MethodKind == MethodKind.Ordinary && m.DeclaredAccessibility == Accessibility.Public && !m.IsStatic))
        {
            var md = Decl(m);
            Items.Add(new Entry($"hub:{t.Name}.{m.Name}", "hub", mod.Id, [], paths.GetValueOrDefault(t.Name),
                auth, null, false, await w.Visit(m), w.Rel(md), Walker.LineOf(md), Comments.Leading(md), _order++));
        }
    }


    // ---------- [ 后台服务：ExecuteAsync（BackgroundService）优先，否则 StartAsync ] ----------
    async Task Hosted(INamedTypeSymbol t)
    {
        var decl = Decl(t);
        var mod = new Module("bg:" + t.Name, t.Name, "hosted", w.Rel(decl), Walker.LineOf(decl), EndOf(decl), Comments.Leading(decl));
        Modules.Add(mod);
        // ExecuteAsync 可能写在自己的抽象基类里（TimedWorker : BackgroundService）；整条链上都不是自己写的就只记入口不下钻
        var run = Chain(t).Where(c => w.Own(c)).SelectMany(c => c.GetMembers("ExecuteAsync").Concat(c.GetMembers("StartAsync")))
            .OfType<IMethodSymbol>().FirstOrDefault(m => !m.IsAbstract && w.Own(m));
        var md = run is null ? decl : Decl(run);
        Items.Add(new Entry("bg:" + t.Name, "hosted", mod.Id, [], null, "none", null, false,
            run is null ? null : await w.Visit(run), w.Rel(md), Walker.LineOf(md), mod.Summary, _order++));
    }


    // ---------- [ Program.cs 顶层语句：app.Use*/Map*/Run 按源码顺序即管线顺序 ] ----------
    async Task<Dictionary<string, string>> Pipeline()
    {
        var paths = new Dictionary<string, string>();
        // Program.cs 顶层语句；老式项目是 Startup.Configure(IApplicationBuilder …)
        SyntaxNode? root = w.OwnTrees.Select(t => t.GetRoot()).FirstOrDefault(r => r.ChildNodes().OfType<GlobalStatementSyntax>().Any());
        root ??= w.OwnTrees.SelectMany(t => t.GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>())
            .FirstOrDefault(m => m.Identifier.Text == "Configure" && m.ParameterList.Parameters.Any(p => p.Type?.ToString() is "IApplicationBuilder" or "WebApplication"));
        if (root is null) return paths;
        var tree = root.SyntaxTree;
        var model = w.Model(tree);
        var mod = new Module("pipeline", "HTTP 管线", "pipeline", w.Rel(root), 1, EndOf(tree.GetRoot()), null);
        Modules.Add(mod);

        foreach (var inv in root.DescendantNodes().OfType<InvocationExpressionSyntax>())
        {
            if (inv.Ancestors().Any(a => a is LambdaExpressionSyntax or AnonymousMethodExpressionSyntax)) continue;
            if (inv.Expression is not MemberAccessExpressionSyntax ma) continue;
            if (model.GetSymbolInfo(inv).Symbol is not IMethodSymbol sym) continue;
            var def = (sym.ReducedFrom ?? sym).OriginalDefinition;
            var name = def.Name;
            if (IsMap(name) || name == "MapGroup" || w.Own(def) && RegistersEndpoints(def)) continue;   // 端点由 MinimalApis 收，这里只留中间件
            var kind = model.GetTypeInfo(ma.Expression).Type?.Name switch
            {
                "WebApplication" or "IApplicationBuilder" or "IEndpointRouteBuilder"
                    when name.StartsWith("Use") || name.StartsWith("Map") || name == "Run" => "middleware",
                "DatabaseFacade" when name == "Migrate" => "startup",
                "IServiceCollection" when w.Own(def) => "setup",
                _ => null,
            };
            if (kind is null) continue;

            var lit = inv.ArgumentList.Arguments.Select(a => model.GetConstantValue(a.Expression))
                .Where(c => c.HasValue).Select(c => c.Value as string).FirstOrDefault(s => s is not null);
            if (name == "MapHub" && sym.TypeArguments.Length == 1 && lit is not null) paths[sym.TypeArguments[0].Name] = lit;

            var line = Walker.LineOf(inv);
            string? mid = null;
            if (w.Own(def)) mid = await w.Visit(def);
            else if (inv.ArgumentList.Arguments.Select(a => a.Expression).OfType<LambdaExpressionSyntax>().FirstOrDefault() is { } lam)
                mid = await w.VisitInline(lam, $"app.{name} · L{line}");

            var stmt = inv.FirstAncestorOrSelf<GlobalStatementSyntax>();
            Items.Add(new Entry($"mw:{line}", kind, mod.Id, [], lit, "none", null,
                inv.Ancestors().Any(a => a is IfStatementSyntax), mid, mod.File, line,
                stmt is null ? null : Comments.Leading(stmt), _order++));
        }
        return paths;
    }


    // ────────────────── 特性解析 ──────────────────

    // ---------- [ 动作的路由：HttpX("t") 自成一条；Route("t") 吃 AcceptVerbs + 无模板 HttpX 的动词 ] ----------
    static List<(string? Tpl, string[] Verbs, int Line)> Routes(IMethodSymbol m)
    {
        var routes = new List<(string?, string[], int)>();
        var loose = new List<string>();
        var routeTpls = new List<(string, int)>();
        var firstLine = 0;
        foreach (var a in m.GetAttributes())
        {
            var n = a.AttributeClass?.Name ?? "";
            var line = a.ApplicationSyntaxReference is { } r ? Walker.LineOf(r.GetSyntax()) : 0;
            if (n == "AcceptVerbsAttribute")
            {
                loose.AddRange(a.ConstructorArguments.SelectMany(c => c.Kind == TypedConstantKind.Array ? c.Values : [c])
                    .Select(v => ((string)v.Value!).ToUpperInvariant()));
                if (a.NamedArguments.FirstOrDefault(x => x.Key == "Route").Value.Value is string rt) routeTpls.Add((rt, line));
                firstLine = firstLine == 0 ? line : firstLine;
            }
            else if (n == "RouteAttribute") routeTpls.Add((Template(a) ?? "", line));
            else if (n.StartsWith("Http") && n.EndsWith("Attribute") && Derives(a.AttributeClass!, "HttpMethodAttribute"))
            {
                var verb = n[4..^"Attribute".Length].ToUpperInvariant();
                if (Template(a) is { } tpl) routes.Add((tpl, [verb], line));
                else { loose.Add(verb); firstLine = firstLine == 0 ? line : firstLine; }
            }
        }
        foreach (var (tpl, line) in routeTpls) routes.Add((tpl, loose.ToArray(), line));
        if (routeTpls.Count == 0 && loose.Count > 0) routes.Add((null, loose.ToArray(), firstLine));
        return routes;
    }


    // AllowAnonymous 在端点元数据里任一层出现即放行（ASP.NET 语义），与 Authorize 的层级无关
    static string Auth(IMethodSymbol m, INamedTypeSymbol t) =>
        Has(m, "AllowAnonymousAttribute") || Chain(t).Any(c => Has(c, "AllowAnonymousAttribute")) ? "anonymous"
        : Has(m, "AuthorizeAttribute") || Chain(t).Any(c => Has(c, "AuthorizeAttribute")) ? "jwt"
        : "none";


    static string? Rate(IMethodSymbol m, INamedTypeSymbol t) =>
        Has(m, "DisableRateLimitingAttribute") ? null
        : Policy(m) ?? Chain(t).Select(Policy).FirstOrDefault(p => p is not null);


    static string? Policy(ISymbol s) =>
        s.GetAttributes().FirstOrDefault(a => a.AttributeClass?.Name == "EnableRateLimitingAttribute") is { } a ? Template(a) : null;


    static string? Template(AttributeData a) =>
        a.ConstructorArguments.FirstOrDefault(c => c.Kind == TypedConstantKind.Primitive).Value as string;


    static string Combine(string cls, string? tpl)
    {
        if (tpl is null) return cls.Trim('/');
        if (tpl.StartsWith('/') || tpl.StartsWith("~/")) return tpl.TrimStart('~', '/');
        return string.Join('/', new[] { cls, tpl }.Select(p => p.Trim('/')).Where(p => p.Length > 0));
    }


    // ────────────────── 私有辅助 ──────────────────

    IEnumerable<INamedTypeSymbol> OwnTypes() =>
        w.OwnTrees.SelectMany(t => t.GetRoot().DescendantNodes().OfType<ClassDeclarationSyntax>()
                .Select(c => w.Model(t).GetDeclaredSymbol(c)))
            .OfType<INamedTypeSymbol>().Distinct<INamedTypeSymbol>(SymbolEqualityComparer.Default);


    // app.MapTodoEndpoints() 这种注册端点的扩展方法：它本身不是中间件
    bool RegistersEndpoints(IMethodSymbol m) => m.DeclaringSyntaxReferences.Any(r =>
        r.GetSyntax().DescendantNodes().OfType<InvocationExpressionSyntax>().Any(i => i.Expression is MemberAccessExpressionSyntax x && IsMap(x.Name.Identifier.Text)));


    // 自己 + 各层基类（到框架类型为止也照样列出，调用方按需过滤 Own）
    static IEnumerable<INamedTypeSymbol> Chain(INamedTypeSymbol t)
    {
        for (var c = t; c is not null; c = c.BaseType) yield return c;
    }


    // 子类已收的动作覆盖了基类的同名方法：基类那个不再算
    static bool Overrides(IMethodSymbol derived, IMethodSymbol baseM)
    {
        for (var o = derived.OverriddenMethod; o is not null; o = o.OverriddenMethod)
            if (SymbolEqualityComparer.Default.Equals(o.OriginalDefinition, baseM.OriginalDefinition)) return true;
        return false;
    }


    SyntaxNode Decl(ISymbol s) => s.DeclaringSyntaxReferences.Select(r => r.GetSyntax()).First(n => w.Own(n.SyntaxTree.FilePath));

    static int EndOf(SyntaxNode n) => n.GetLocation().GetLineSpan().EndLinePosition.Line + 1;

    static bool Has(ISymbol s, string attr) => s.GetAttributes().Any(a => a.AttributeClass?.Name == attr);


    static bool Derives(INamedTypeSymbol t, string baseName)
    {
        for (var b = t.BaseType; b is not null; b = b.BaseType)
            if (b.Name == baseName) return true;
        return false;
    }
}
