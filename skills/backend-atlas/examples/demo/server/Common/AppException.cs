namespace Demo.Common;

// 业务错误：状态码 + 机器码 + 给人看的一句话
public sealed class AppException(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}

// ---------- [ 统一错误信封：AppException 按它的码返回，其余 500 ] ----------
public sealed class ErrorMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (AppException e)
        {
            ctx.Response.StatusCode = e.Status;
            await ctx.Response.WriteAsJsonAsync(new { code = e.Code, message = e.Message });
        }
    }
}
