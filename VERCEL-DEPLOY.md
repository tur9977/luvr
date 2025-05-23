# Vercel Deployment Guide

本文档提供将应用部署到 Vercel 的详细步骤和注意事项。

## 准备工作

1. 确保你有一个 [Vercel 账户](https://vercel.com/signup)
2. 确保你的项目已经推送到 GitHub、GitLab 或 Bitbucket

## 部署步骤

### 1. 连接代码仓库

1. 登录到 Vercel
2. 点击 "New Project"
3. 选择你的代码仓库
4. 选择 "Import"

### 2. 配置项目

在配置页面，你需要设置以下内容：

#### 基本设置
- **Project Name**: 自定义或使用默认名称
- **Framework Preset**: Next.js
- **Root Directory**: `./` (默认)
- **Build Command**: `npm run build` (默认)
- **Output Directory**: `.next` (默认)
- **Install Command**: `npm install` (默认)

#### 环境变量

必须设置以下环境变量:

```
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 管理員設置金鑰
NEXT_PUBLIC_ADMIN_SETUP_KEY=your-admin-key

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# 如果使用邮件功能，需要设置
SMTP_HOSTNAME=mail.example.com
SMTP_PORT=465
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
```

### 3. 点击 "Deploy" 按钮

部署过程将自动开始，并会显示部署日志。

### 4. 部署完成后的检查

部署完成后，你应该:

1. 检查部署日志，确保没有错误
2. 访问生成的 URL 测试应用
3. 验证关键功能:
   - 用户注册/登录
   - 认证流程
   - 验证码功能
   - 活动创建和筛选
   - Supabase 连接

## 常见问题排解

### 构建失败
- 检查日志找出具体错误
- 确保所有环境变量都已设置
- 尝试在本地运行 `npm run build` 复现问题

### 图片加载问题
- 确保 `next.config.js` 中的 `remotePatterns` 配置正确包含了你的 Supabase URL

### 登录认证问题
- 确认 Supabase URL 和 Anon Key 是否正确
- 检查 Supabase 控制台中的 Auth 设置

## 生产环境优化

部署成功后，你可以在 Vercel 控制台中进行以下优化:

1. 启用 "Production Environment"
2. 配置自定义域名
3. 启用自动预览部署
4. 设置性能监控
5. 配置分析和日志

## 备注

- 本项目使用了 Next.js 和 Supabase，两者都在 Vercel 上有很好的支持
- 如果需要执行数据库迁移，请在部署前手动在 Supabase Dashboard 上执行
- 代码中包含的 `.env.local` 和 `.env` 文件不会自动部署，所有环境变量必须在 Vercel 控制台中配置
