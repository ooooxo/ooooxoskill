using Demo.Billing;
using Demo.Common;
using Demo.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Demo.Auth;

public sealed record CredentialsDto(string Email, string Password);

[ApiController, Route("api/auth")]
public sealed class AuthController(AppDb db, WalletService wallet) : ControllerBase
{
    // ---------- [ 注册：邮箱 + 密码，送注册积分 ] ----------
    [HttpPost("register")]
    public async Task<object> Register([FromBody] CredentialsDto body)
    {
        if (!body.Email.Contains('@')) throw new AppException(400, "email_invalid", "邮箱格式不正确");
        if (body.Password.Length < 8) throw new AppException(400, "password_too_short", "密码至少 8 位");
        if (await db.Users.AnyAsync(u => u.Email == body.Email)) throw new AppException(409, "email_registered", "该邮箱已注册");

        var user = new User { Id = Guid.NewGuid(), Email = body.Email, PasswordHash = Hash(body.Password) };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        await wallet.Grant(user.Id, WalletService.SignupBonus, "signup-bonus");
        return new { userId = user.Id };
    }

    // ---------- [ 登录：失败统一一句话，不暴露账号是否存在 ] ----------
    [HttpPost("login")]
    public async Task<object> Login([FromBody] CredentialsDto body)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == body.Email);
        if (user is null || user.PasswordHash != Hash(body.Password)) throw new AppException(401, "bad_credentials", "邮箱或密码不正确");
        return new { userId = user.Id };
    }

    static string Hash(string password) => Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(password)));
}
