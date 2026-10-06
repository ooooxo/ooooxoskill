# 注册  ·  已整理
id: e:POST /api/auth/register

每行：[种类] 文本  ‹锚点键›  文件:行。语义层 flows 的节点用 "at": "锚点键" 引用。

- [call] 注册  ‹AuthController›call:AuthController.Register›  Auth/AuthController.cs:15
  - [guard] !body.Email.Contains('@')  ‹AuthController.Register›guard:!body.Email.Contains('@')›  Auth/AuthController.cs:18
    - [exit] 邮箱格式不正确  ‹AuthController.Register›exit:throw:400:邮箱格式不正确›  Auth/AuthController.cs:18
  - [guard] body.Password.Length < 8  ‹AuthController.Register›guard:body.Password.Length < 8›  Auth/AuthController.cs:19
    - [exit] 密码至少 8 位  ‹AuthController.Register›exit:throw:400:密码至少 8 位›  Auth/AuthController.cs:19
  - [guard] await db.Users.AnyAsync(u => u.Email == body.Email)  ‹AuthController.Register›guard:await db.Users.AnyAsync(u => u.Email == body.Email)›  Auth/AuthController.cs:20
    - [exit] 该邮箱已注册  ‹AuthController.Register›exit:throw:409:该邮箱已注册›  Auth/AuthController.cs:20
  - [call] 发放 (signup-bonus)  ‹AuthController.Register›call:WalletService.Grant›  Auth/AuthController.cs:25
