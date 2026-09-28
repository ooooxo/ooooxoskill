using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace Atlas;

// =====================================================
// Comments - 取声明上方的注释当一句话说明（零 LLM）
// 剥掉 // /// 前缀、XML 标签与分隔线装饰（=====、----------[ ]----------、────）。
// =====================================================
public static class Comments
{
    const int Max = 200;


    // ---------- [ 声明前导注释合成一行，超长截断；没有注释返回 null ] ----------
    public static string? Leading(SyntaxNode n)
    {
        var parts = n.GetLeadingTrivia()
            .Where(t => t.IsKind(SyntaxKind.SingleLineCommentTrivia) || t.IsKind(SyntaxKind.SingleLineDocumentationCommentTrivia))
            .SelectMany(t => t.ToString().Split('\n'))
            .Select(Clean).Where(s => s.Length > 0);
        var s = string.Join(" ", parts);
        return s.Length == 0 ? null : s.Length > Max ? s[..Max] + "…" : s;
    }


    // ---------- [ 紧贴声明的那一段注释：跳过更上面的分节标题（──── 轮次生命周期 ────）；有 [ … ] 行优先取最后一条 ] ----------
    public static string? Nearest(SyntaxNode n)
    {
        var lines = new List<string>();
        foreach (var t in n.GetLeadingTrivia().Reverse())
        {
            if (t.IsKind(SyntaxKind.WhitespaceTrivia)) continue;
            if (t.IsKind(SyntaxKind.EndOfLineTrivia)) { if (lines.Count > 0 && lines[0] == "\n") break; lines.Insert(0, "\n"); continue; }   // 连续两个换行 = 空行，段落到此为止
            if (t.IsKind(SyntaxKind.SingleLineCommentTrivia) || t.IsKind(SyntaxKind.SingleLineDocumentationCommentTrivia)) { lines.RemoveAll(x => x == "\n"); lines.Insert(0, t.ToString()); continue; }
            break;
        }
        var raw = lines.Where(x => x != "\n").SelectMany(x => x.Split('\n')).ToList();
        var bracket = raw.LastOrDefault(x => x.Contains("[") && x.TrimEnd().EndsWith("]") || x.Contains("[ ") && x.Contains(" ]"));
        var s = bracket is not null ? Clean(bracket) : string.Join(" ", raw.Select(Clean).Where(x => x.Length > 0));
        return s.Length == 0 ? null : s.Length > Max ? s[..Max] + "…" : s;
    }


    static string Clean(string line)
    {
        var s = line.Trim().TrimStart('/').Trim();
        s = System.Text.RegularExpressions.Regex.Replace(s, @"</?\w+[^>]*>", "");
        s = s.Trim('=', '─', '-', ' ').Trim();
        if (s.StartsWith('[') && s.EndsWith(']')) s = s[1..^1].Trim();
        return s;
    }
}
