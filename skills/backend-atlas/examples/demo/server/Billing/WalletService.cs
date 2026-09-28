using Demo.Data;
using Microsoft.EntityFrameworkCore;

namespace Demo.Billing;

// =====================================================
// WalletService - 积分：发放与扣费都记一条流水，余额与流水同事务
// =====================================================
public sealed class WalletService(AppDb db)
{
    public const int SignupBonus = 100;

    // ---------- [ 发放：注册赠分等 ] ----------
    public async Task Grant(Guid userId, int amount, string reason)
    {
        var wallet = await db.Wallets.FindAsync(userId);
        if (wallet is null) db.Wallets.Add(new Wallet { UserId = userId, Balance = amount });
        else wallet.Balance += amount;
        db.Ledger.Add(new LedgerEntry { UserId = userId, Amount = amount, Reason = reason });
        await db.SaveChangesAsync();
    }

    // ---------- [ 扣费：余额不够返回 false，不扣 ] ----------
    public async Task<bool> Charge(Guid userId, int amount, string reason)
    {
        var wallet = await db.Wallets.SingleAsync(w => w.UserId == userId);
        if (wallet.Balance < amount) return false;
        wallet.Balance -= amount;
        db.Ledger.Add(new LedgerEntry { UserId = userId, Amount = -amount, Reason = reason });
        await db.SaveChangesAsync();
        return true;
    }
}
