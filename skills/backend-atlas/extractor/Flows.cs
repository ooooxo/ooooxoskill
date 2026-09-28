using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.FindSymbols;

namespace Atlas;

// =====================================================
// Flows - 入口方法的控制流骨架（零 LLM）：循环、分岔、护栏（if 里直接 throw / return）、结局原话、try/catch、交给后台
// 仓库内方法调用按深度内联展开；每个节点带稳定的锚点键（方法 › 种类:关键文本），挪行号不失效，改了那条语句才失效。
// 读写推送不在这里重算：viewer 按节点的 Method 从 Walker 的边上取。
// =====================================================
public sealed class Flows(Walker walker)
{
    const int MaxDepth = 4;        // 仓库内调用最多内联几层：再深的只留一个调用节点
    const int MaxNodes = 600;      // 一条流程的节点上限：超了就不再内联（一条流程大到这样该拆了）
    const int MaxText = 90;

    public List<Flow> Items { get; } = new();
    private readonly HashSet<string> _bg = new();          // 被 Task.Run 带到后台跑的方法：各自成一条流程
    private readonly Dictionary<string, int> _keyCount = new();
    private HashSet<string>? _touch;                      // 方法自己直接读写 / 推送 / 外呼过（Walker 的非 calls 边）
    private int _nodes;


    // ---------- [ 每个入口一条；后台跑的方法（Task.Run 里调的）也各自一条，挂在发起它的流程上 ] ----------
    public async Task Collect(IEnumerable<Entry> entries)
    {
        _touch = walker.Edges.Where(e => e.Kind != "calls").Select(e => e.From).ToHashSet();
        foreach (var e in entries.Where(e => e.Kind is "http" or "hub" or "hosted" && e.Method is not null))
        {
            if (walker.Inline(e.Method!) is { } lambda) { Items.Add(await BuildInline(e.Id, e.Kind, e.Method!, lambda)); continue; }
            var sym = walker.Symbol(e.Method!);
            if (sym is null) continue;
            Items.Add(await Build(e.Id, e.Kind, sym));
        }
        // 后台流程：一轮轮往外扩，直到没有新的
        var done = new HashSet<string>();
        while (_bg.Except(done).ToList() is { Count: > 0 } fresh)
            foreach (var id in fresh)
            {
                done.Add(id);
                if (walker.Symbol(id) is { } sym) Items.Add(await Build("bgrun:" + id, "background", sym));
            }
    }


    async Task<Flow> Build(string id, string kind, IMethodSymbol m)
    {
        _keyCount.Clear(); _nodes = 0;
        var root = await CallNode(m, null, 0, new HashSet<string>());
        return new Flow(id, kind, root, Inputs(m));
    }


    // Minimal API 的内联 lambda 处理器：lambda 本身当根
    async Task<Flow> BuildInline(string id, string kind, string mid, SyntaxNode lambda)
    {
        _keyCount.Clear(); _nodes = 0;
        var model = walker.Model(lambda.SyntaxTree);
        var root = Node("call", id[(id.IndexOf(':') + 1)..], lambda, mid, keyText: "lambda");
        root.Kids = await Body(lambda, 0, new HashSet<string> { mid });
        var inputs = model.GetSymbolInfo(lambda).Symbol is IMethodSymbol ls ? Inputs(ls) : [];
        return new Flow(id, kind, root, inputs);
    }


    // ────────────────── 调用 ──────────────────

    // ---------- [ 一个仓库内方法 = 一个 call 节点，方法体按深度内联成子节点 ] ----------
    async Task<FlowNode> CallNode(IMethodSymbol m, SyntaxNode? at, int depth, HashSet<string> stack)
    {
        m = m.OriginalDefinition;
        var mid = await walker.Visit(m);
        var decl = m.DeclaringSyntaxReferences.Select(r => r.GetSyntax()).First(n => walker.Own(n.SyntaxTree.FilePath));
        var (label, note) = Label(m, decl);
        var node = Node("call", label, at ?? decl, mid, keyText: $"{m.ContainingType.Name}.{m.Name}");
        node.Note = note;
        if (depth < MaxDepth && _nodes < MaxNodes && stack.Add(mid))
        {
            node.Kids = await Body(decl, depth, stack);
            stack.Remove(mid);
        }
        return node;
    }


    // 方法头注释「做什么：怎么做」→ 标题取冒号前；没注释用 类.方法
    static (string, string?) Label(IMethodSymbol m, SyntaxNode decl)
    {
        var s = Comments.Nearest(decl);
        if (s is null) return ($"{m.ContainingType.Name}.{m.Name}", null);
        var cut = s.IndexOfAny(['：', ':']);
        var head = cut > 0 ? s[..cut].Trim() : s;
        if (head.Contains(" - ")) head = head[(head.IndexOf(" - ") + 3)..];   // 「TurnRunner - 一个轮次的主循环」取破折号后
        return head.Length is > 0 and <= 28 ? (head, cut > 0 ? s[(cut + 1)..].Trim() : null) : ($"{m.ContainingType.Name}.{m.Name}", s);
    }


    async Task<List<FlowNode>> Body(SyntaxNode decl, int depth, HashSet<string> stack)
    {
        var body = decl switch
        {
            BaseMethodDeclarationSyntax b => (SyntaxNode?)b.Body ?? b.ExpressionBody?.Expression,
            LocalFunctionStatementSyntax l => (SyntaxNode?)l.Body ?? l.ExpressionBody?.Expression,
            AnonymousFunctionExpressionSyntax a => (SyntaxNode?)a.Block ?? a.ExpressionBody,
            _ => null,
        };
        if (body is null) return [];
        var model = walker.Model(body.SyntaxTree);
        return body is BlockSyntax blk ? await Stmts(blk.Statements, model, depth, stack) : await Calls(body, model, depth, stack);
    }


    // ────────────────── 语句 ──────────────────

    async Task<List<FlowNode>> Stmts(IEnumerable<StatementSyntax> list, SemanticModel model, int depth, HashSet<string> stack)
    {
        var out_ = new List<FlowNode>();
        foreach (var s in list) out_.AddRange(await Stmt(s, model, depth, stack));
        return out_;
    }


    async Task<List<FlowNode>> Stmt(StatementSyntax s, SemanticModel model, int depth, HashSet<string> stack)
    {
        switch (s)
        {
            case BlockSyntax b:
                return await Stmts(b.Statements, model, depth, stack);

            case IfStatementSyntax ifs:
            {
                var cond = Squash(ifs.Condition.ToString());
                var pre = await Calls(ifs.Condition, model, depth, stack);          // 条件里的调用（if (!await wallet.Charge(...))）先发生
                var then = await Stmt(ifs.Statement, model, depth, stack);
                var els = ifs.Else is null ? [] : await Stmt(ifs.Else.Statement, model, depth, stack);
                if (then.Count == 0 && els.Count == 0) return pre;
                if (els.Count == 0 && then.LastOrDefault()?.K == "exit")
                {   // 护栏：条件成立就结束（throw / return）
                    var g = Node("guard", cond, ifs, null, cond);
                    g.Kids = then;
                    return [.. pre, g];
                }
                var br = Node("if", cond, ifs, null, cond);
                var t = Node("then", "是", ifs.Statement, null, cond + "?是"); t.Kids = then;
                br.Kids = [t];
                if (els.Count > 0) { var e = Node("else", "否", ifs.Else!, null, cond + "?否"); e.Kids = els; br.Kids.Add(e); }
                return [.. pre, br];
            }

            case WhileStatementSyntax w:
                return await Loop(w, Squash(w.Condition.ToString()), w.Statement, model, depth, stack);
            case DoStatementSyntax d:
                return await Loop(d, Squash(d.Condition.ToString()), d.Statement, model, depth, stack);
            case ForStatementSyntax f:
                return await Loop(f, Squash(f.Condition?.ToString() ?? "for"), f.Statement, model, depth, stack);
            case ForEachStatementSyntax fe:
                return [.. await Calls(fe.Expression, model, depth, stack), .. await Loop(fe, $"每个 {fe.Identifier.Text} ∈ {Squash(fe.Expression.ToString())}", fe.Statement, model, depth, stack)];

            case SwitchStatementSyntax sw:
            {
                var node = Node("switch", Squash(sw.Expression.ToString()), sw, null, Squash(sw.Expression.ToString()));
                node.Kids = [];
                foreach (var sec in sw.Sections)
                {
                    var label = string.Join(" | ", sec.Labels.Select(l => Squash(l.ToString().Replace("case ", "").TrimEnd(':'))));
                    var c = Node("case", label, sec, null, label);
                    c.Kids = await Stmts(sec.Statements, model, depth, stack);
                    if (c.Kids.Count > 0) node.Kids.Add(c);
                }
                return node.Kids.Count > 0 ? [node] : [];
            }

            case TryStatementSyntax tr:
            {
                var body = await Stmts(tr.Block.Statements, model, depth, stack);
                var catches = new List<FlowNode>();
                foreach (var c in tr.Catches)
                {
                    var type = c.Declaration?.Type.ToString() ?? "Exception";
                    var label = c.Filter is null ? type : $"{type} when {Squash(c.Filter.FilterExpression.ToString())}";
                    var cn = Node("catch", label, c, null, label);
                    cn.Kids = await Stmts(c.Block.Statements, model, depth, stack);
                    catches.Add(cn);
                }
                if (catches.Count == 0) return [.. body, .. tr.Finally is null ? [] : await Stmts(tr.Finally.Block.Statements, model, depth, stack)];
                var node = Node("try", "try", tr, null, "try");
                node.Kids = [.. body, .. catches];
                return [node, .. tr.Finally is null ? [] : await Stmts(tr.Finally.Block.Statements, model, depth, stack)];
            }

            case ReturnStatementSyntax r:
            {
                var pre = r.Expression is null ? [] : await Calls(r.Expression, model, depth, stack);
                var text = r.Expression is null ? "" : Texts(r.Expression, model);
                // 只有带原话的 return 才算结局；嵌套方法里的 return 只是交回调用方，除非原话是人话（中文 / 大写开头的英文句子）或状态词（done / limited）
                var outcome = text.Length > 0 && (depth == 0 || System.Text.RegularExpressions.Regex.IsMatch(text, @"\p{IsCJKUnifiedIdeographs}|^[a-z][a-z_]*( · |$)|^[A-Z][a-z']+( [A-Za-z']+)+"));
                return outcome ? [.. pre, Exit("return", text, null, r)] : pre;
            }

            case ThrowStatementSyntax th:
            {
                var (code, msg) = th.Expression is null ? (null, "重新抛出") : ThrowText(th.Expression, model);
                return [Exit("throw", msg, code, th)];
            }

            case UsingStatementSyntax u:
                return [.. u.Expression is null ? [] : await Calls(u.Expression, model, depth, stack), .. u.Statement is null ? [] : await Stmt(u.Statement, model, depth, stack)];
            case LockStatementSyntax l:
                return await Stmt(l.Statement, model, depth, stack);
            case LocalFunctionStatementSyntax:
                return [];
            default:
                return await Calls(s, model, depth, stack);
        }
    }


    async Task<List<FlowNode>> Loop(StatementSyntax s, string cond, StatementSyntax body, SemanticModel model, int depth, HashSet<string> stack)
    {
        var kids = await Stmt(body, model, depth, stack);
        if (kids.Count == 0) return [];
        var n = Node("loop", cond, s, null, cond);
        n.Kids = kids;
        return [n];
    }


    // ---------- [ 一句普通语句里的调用：按出现顺序；lambda 里的不算（Task.Run 例外：那是交给后台） ] ----------
    async Task<List<FlowNode>> Calls(SyntaxNode s, SemanticModel model, int depth, HashSet<string> stack)
    {
        var out_ = new List<FlowNode>();
        foreach (var inv in s.DescendantNodesAndSelf().OfType<InvocationExpressionSyntax>()
                     .Where(i => !i.Ancestors().TakeWhile(a => a != s).Any(a => a is AnonymousFunctionExpressionSyntax))
                     .OrderBy(i => i.SpanStart))
        {
            var info = model.GetSymbolInfo(inv);
            if ((info.Symbol ?? info.CandidateSymbols.FirstOrDefault()) is not IMethodSymbol sym) continue;
            var def = (sym.ReducedFrom ?? sym).OriginalDefinition;
            if (def.Name is "Run" or "StartNew" && def.ContainingType?.Name is "Task" or "TaskFactory")
            {   // 交给后台：lambda 里调到的仓库内方法各自成一条后台流程，这里只留一个 bg 节点指过去
                var bg = Node("bg", "交给后台", inv, null, "Task.Run");
                bg.Kids = [];
                foreach (var inner in inv.DescendantNodes().OfType<InvocationExpressionSyntax>())
                    if (model.GetSymbolInfo(inner).Symbol is IMethodSymbol t && Own(t.OriginalDefinition) && !t.IsImplicitlyDeclared
                        && t.MethodKind is not (MethodKind.LocalFunction or MethodKind.AnonymousFunction))
                    {
                        var tid = await walker.Visit(t.OriginalDefinition);
                        _bg.Add(tid);
                        var link = Node("link", Label(t.OriginalDefinition, t.OriginalDefinition.DeclaringSyntaxReferences[0].GetSyntax()).Item1, inner, tid, "bgrun:" + tid);
                        bg.Kids.Add(link);
                    }
                if (bg.Kids.Count > 0) out_.Add(bg);
                continue;
            }
            var targets = await walker.Targets(model, inv, def);
            var args = inv.ArgumentList.Arguments.Select(a => model.GetConstantValue(a.Expression)).Where(v => v is { HasValue: true, Value: string }).Select(v => (string)v.Value!).ToArray();
            foreach (var t in targets)
            {
                var id = await walker.Visit(t);
                if (walker.IsUtil(id)) continue;          // Ok()、TryGetUserId 这类工具方法不画
                var node = await CallNode(t, inv, depth + 1, stack);
                // 既没往下走、自己也不读写推送的小帮手（Key()、CopyWith()）不画
                if (node.Kids is not { Count: > 0 } && !_touch!.Contains(id)) continue;
                if (args.Length > 0) node.Args = args;
                out_.Add(node);
            }
        }
        return out_;
    }


    // 入口带进来的：请求类（…Dto / Input / Body / Request / Command）展开成字段；其它项目类型写「参数 · 类型」（job · GenerationJob）；
    // 基础设施参数（取消令牌、HttpContext）不算
    // Minimal API 处理器的参数里混着依赖注入的服务（TodoService svc、IMediator），那不是请求带进来的
    static readonly System.Text.RegularExpressions.Regex DiType = new("(Service|Repository|Repo|Handler|Context|Db|Client|Store|Manager|Notifier|Mediator|Sender|Publisher|Factory|Logger)(`\\d+)?$");

    string[] Inputs(IMethodSymbol m) => m.Parameters
        .Where(p => p.Type.Name is not ("CancellationToken" or "HttpContext" or "ClaimsPrincipal" or "HttpRequest" or "HttpResponse"))
        .Where(p => p.Type.TypeKind != TypeKind.Interface && !DiType.IsMatch(p.Type.Name))
        .SelectMany(p =>
        {
            var own = p.Type is INamedTypeSymbol t && t.Locations.Any(l => l.IsInSource && walker.Own(l.SourceTree!.FilePath));
            if (own && System.Text.RegularExpressions.Regex.IsMatch(p.Type.Name, "(Dto|Input|Body|Request|Command)$"))
                return p.Type.GetMembers().OfType<IPropertySymbol>().Where(x => x.DeclaredAccessibility == Accessibility.Public && !x.IsStatic).Select(x => x.Name);
            return [own ? $"{p.Name} · {p.Type.Name}" : p.Name];
        })
        .Distinct().ToArray();


    // ────────────────── 结局原话 ──────────────────

    FlowNode Exit(string how, string text, string? code, SyntaxNode at)
    {
        var n = Node("exit", text.Length > 0 ? text : how == "throw" ? "抛出异常" : "返回", at, null, $"{how}:{code}:{text}");
        n.Code = code; n.How = how;
        return n;
    }


    // throw new AppException(402, "insufficient_credits", "积分不足…") → (402, 积分不足…)：取第一个数字当码，最后一个字符串当原话
    static (string?, string) ThrowText(ExpressionSyntax e, SemanticModel model)
    {
        if (e is not ObjectCreationExpressionSyntax { ArgumentList: { } args } oc)
            return (null, Squash(e.ToString()));
        string? code = null; string? msg = null;
        foreach (var a in args.Arguments)
        {
            var v = model.GetConstantValue(a.Expression);
            if (v.HasValue && v.Value is int i) code ??= i.ToString();
            var t = TextOf(a.Expression, model);
            if (t is not null) msg = t;
        }
        return (code, msg ?? oc.Type.ToString());
    }


    // return 里的原话：字符串常量、插值串（插值处写成 {…}）、常量成员（TurnStatus.Limited → "limited"）
    static string Texts(ExpressionSyntax e, SemanticModel model)
    {
        var parts = new List<string>();
        void Take(ExpressionSyntax x)
        {
            switch (x)
            {
                case ParenthesizedExpressionSyntax p: Take(p.Expression); break;
                case TupleExpressionSyntax t: foreach (var a in t.Arguments) Take(a.Expression); break;
                case ConditionalExpressionSyntax c: Take(c.WhenTrue); Take(c.WhenFalse); break;
                case AwaitExpressionSyntax aw: Take(aw.Expression); break;
                case BaseObjectCreationExpressionSyntax oc when oc.ArgumentList is { } al: foreach (var a in al.Arguments) if (TextOf(a.Expression, model) is { Length: > 0 } v) parts.Add(v); break;
                default: if (TextOf(x, model) is { Length: > 0 } s0) parts.Add(s0); break;
            }
        }
        Take(e);
        var s = string.Join(" · ", parts.Distinct());
        return s.Length > MaxText ? s[..MaxText] + "…" : s;
    }


    static string? TextOf(ExpressionSyntax e, SemanticModel model)
    {
        if (e is InterpolatedStringExpressionSyntax ins)
            return string.Concat(ins.Contents.Select(c => c is InterpolatedStringTextSyntax t ? t.TextToken.ValueText
                : model.GetConstantValue(((InterpolationSyntax)c).Expression) is { HasValue: true } v ? Convert.ToString(v.Value) : "{…}"));
        return model.GetConstantValue(e) is { HasValue: true, Value: string s } ? s : null;
    }


    // ────────────────── 辅助 ──────────────────

    FlowNode Node(string k, string t, SyntaxNode at, string? method, string keyText)
    {
        _nodes++;
        var owner = at.Ancestors().OfType<BaseMethodDeclarationSyntax>().FirstOrDefault() is { } md && walker.Model(md.SyntaxTree).GetDeclaredSymbol(md) is { } s
            ? $"{s.ContainingType.Name}.{s.Name}" : Path.GetFileNameWithoutExtension(at.SyntaxTree.FilePath);
        var key = $"{owner}›{k}:{Squash(keyText)}";
        var n = _keyCount[key] = _keyCount.GetValueOrDefault(key) + 1;
        return new FlowNode { K = k, T = t.Length > MaxText ? t[..MaxText] + "…" : t, File = walker.Rel(at), Line = Walker.LineOf(at), Method = method, Key = n > 1 ? $"{key}#{n}" : key };
    }


    bool Own(IMethodSymbol m) => walker.Own(m);


    static string Squash(string s)
    {
        var t = System.Text.RegularExpressions.Regex.Replace(s, @"\s+", " ").Trim();
        return t.Length > MaxText ? t[..MaxText] + "…" : t;
    }
}
