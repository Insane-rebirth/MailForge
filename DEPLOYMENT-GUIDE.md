# MailForge 上线部署指南

## 📋 部署前检查清单

### ✅ 已完成的修复

1. **环境变量安全修复**
   - 从 `.env.production` 移除了所有服务端密钥
   - 更新了 `.gitignore` 防止环境变量文件被提交

2. **数据库表结构修复**
   - 添加了缺失的 `pending_payments` 表
   - 添加了缺失的 `crm_settings` 表
   - 添加了缺失的 `reply_rate` 和 `days_active_this_month` 列
   - 添加了所有表的 RLS 策略和索引

3. **API 安全修复**
   - 修复了 `check-subscription` API 未认证时返回 200 的安全漏洞
   - 修复了 `generate-emails` API 配额更新缺失的问题

4. **代码质量修复**
   - 修复了 TypeScript 类型错误
   - 构建和 lint 检查均通过

---

## 🛠️ 步骤1：执行数据库迁移

### 方法A：使用 Supabase Dashboard SQL Editor

登录 [Supabase Dashboard](https://supabase.com/dashboard) → 选择你的项目 → 进入 **SQL Editor** → 新建查询 → 复制并执行以下 SQL：

```sql
-- 添加缺失的列到 profiles 表
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS reply_rate DECIMAL DEFAULT NULL;

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS days_active_this_month INTEGER DEFAULT 0;

-- 创建 pending_payments 表
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'business')),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 crm_settings 表
CREATE TABLE IF NOT EXISTS public.crm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('hubspot', 'salesforce', 'pipedrive')),
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_email ON public.pending_payments(user_email);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON public.pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_created_at ON public.pending_payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_settings_user_id ON public.crm_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_settings_provider ON public.crm_settings(provider);

-- 创建 RLS 策略
CREATE POLICY "Users can view own pending payments" ON public.pending_payments
  FOR SELECT USING (auth.email() = user_email);

CREATE POLICY "Users can insert pending payments" ON public.pending_payments
  FOR INSERT WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own pending payments" ON public.pending_payments
  FOR UPDATE USING (auth.email() = user_email);

CREATE POLICY "Users can view own CRM settings" ON public.crm_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert CRM settings" ON public.crm_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CRM settings" ON public.crm_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CRM settings" ON public.crm_settings
  FOR DELETE USING (auth.uid() = user_id);
```

### 方法B：使用本地脚本

```bash
# 设置环境变量
set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 运行迁移脚本
node scripts/run-migration.js scripts/supabase-migration-full.sql
```

---

## 🛠️ 步骤2：配置 Vercel 环境变量

登录 [Vercel Dashboard](https://vercel.com/dashboard) → 选择你的项目 → 进入 **Settings** → **Environment Variables** → 添加以下变量：

### 🔐 客户端变量（NEXT_PUBLIC_ 前缀）

| 变量名 | 值 |
|--------|-----|
| NEXT_PUBLIC_SUPABASE_URL | https://ymdgkivkaagfrdnvvqbr.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 你的 Supabase Anon Key |
| NEXT_PUBLIC_APP_URL | https://getmailforge.top |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | pk_live_xxx（真实 Stripe 公钥） |
| NEXT_PUBLIC_STRIPE_PRO_PRICE_ID | price_xxx（Pro 套餐的真实价格 ID） |
| NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID | price_xxx（Business 套餐的真实价格 ID） |

### 🔐 服务端变量（无 NEXT_PUBLIC_ 前缀）

| 变量名 | 值 |
|--------|-----|
| SUPABASE_SERVICE_ROLE_KEY | 你的 Supabase Service Role Key |
| STRIPE_SECRET_KEY | sk_live_xxx（真实 Stripe 私钥） |
| STRIPE_WEBHOOK_SECRET | whsec_xxx（真实 Stripe Webhook 密钥） |
| DEEPSEEK_API_KEY | 你的 DeepSeek API Key |
| CREEM_API_KEY | 你的 Creem API Key |
| CREEM_STORE_ID | 你的 Creem Store ID |
| CREEM_STORE_SLUG | mailforge |
| ADMIN_PASSWORD | SecureAdmin2024!（可自定义） |

---

## 🛠️ 步骤3：配置 Stripe

### 3.1 创建产品和价格

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Products** → 创建两个产品：
   - **MailForge Pro**：每月 $29
   - **MailForge Business**：每月 $79
3. 记录价格 ID（price_xxx），用于 Vercel 环境变量

### 3.2 配置 Webhook

1. 进入 **Developers** → **Webhooks** → 添加端点：
   - 端点 URL：`https://getmailforge.top/api/webhook/stripe`
   - 事件类型：
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
2. 记录 Webhook 签名密钥（whsec_xxx），用于 Vercel 环境变量

---

## 🛠️ 步骤4：配置 Creem（可选）

1. 登录 [Creem Dashboard](https://dashboard.creem.io/)
2. 创建支付链接：
   - Pro 套餐：$29/月
   - Business 套餐：$79/月
3. 记录 API Key 和 Store ID，用于 Vercel 环境变量

---

## 🛠️ 步骤5：部署到 Vercel

### 方法A：使用 Vercel CLI

```bash
# 登录 Vercel
npx vercel login

# 部署到生产环境
npx vercel deploy --prod
```

### 方法B：使用 Git 自动部署

1. 将代码推送到 GitHub/GitLab
2. 在 Vercel 中关联仓库
3. 开启自动部署

---

## 🛠️ 步骤6：验证部署

### 运行部署验证脚本

```bash
node scripts/verify-deployment.js
```

### 手动验证清单

- [ ] 首页可访问（https://getmailforge.top）
- [ ] 登录页面可访问（https://getmailforge.top/login）
- [ ] Google OAuth 登录正常
- [ ] 仪表盘页面正常加载
- [ ] 邮件生成功能正常（AI 和模板模式）
- [ ] 配额扣除正常工作
- [ ] 定价页面可访问
- [ ] 支付流程正常（Stripe 和 Creem）
- [ ] 成功页面正常显示

---

## 🛠️ 步骤7：测试完整用户流程

1. **用户注册/登录** → Google OAuth
2. **进入仪表盘** → 查看使用统计
3. **生成邮件** → 验证配额扣除
4. **升级套餐** → 选择 Pro/Business
5. **完成支付** → Stripe/Creem
6. **验证升级** → 回到仪表盘确认套餐变更

---

## 📁 关键文件说明

| 文件 | 说明 |
|------|------|
| `supabase/migrations/` | 数据库迁移脚本 |
| `scripts/supabase-migration-full.sql` | 完整的数据库迁移 SQL |
| `scripts/verify-deployment.js` | 部署验证脚本 |
| `.env.local` | 本地开发环境变量 |
| `.env.production` | 生产环境公共变量（仅 NEXT_PUBLIC_） |

---

## ⚠️ 注意事项

1. **不要将服务端密钥提交到版本控制**
2. **定期备份数据库**
3. **监控 Stripe Webhook 状态**
4. **定期更新依赖包**
5. **设置适当的 API 速率限制**

---

## 📞 技术支持

如需帮助，请联系：support@getmailforge.top
