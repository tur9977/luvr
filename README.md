# LUVR - 活动社交平台

LUVR是一个活动社交平台，帮助用户发现、创建和参加各种活动。

## 特点

- 🙋‍♂️ **用户认证系统** - 安全的注册和登录流程，包括reCAPTCHA验证
- 📅 **活动管理** - 创建、编辑和管理活动
- 🔍 **高级搜索** - 按类型、位置、日期搜索活动
- 📝 **社交互动** - 评论、照片共享和活动参与
- 📱 **响应式设计** - 适配各种设备大小
- 📊 **管理员后台** - 用户管理和内容审核
- 📬 **通知系统** - 邮件和推送通知

## 技术栈

- **前端**: [Next.js](https://nextjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **UI组件**: [shadcn/ui](https://ui.shadcn.com/)
- **后端**: [Supabase](https://supabase.io/)
- **认证**: Supabase Auth, Google reCAPTCHA
- **数据库**: PostgreSQL (通过Supabase)
- **部署**: [Vercel](https://vercel.com/)

## 开始使用

### 必要条件

- [Node.js](https://nodejs.org/) 18.0.0 或更高版本
- [npm](https://www.npmjs.com/) 8.0.0 或更高版本
- [Supabase](https://supabase.io/) 账户

### 安装

1. 克隆仓库

```bash
git clone https://github.com/your-username/luvr.git
cd luvr
```

2. 安装依赖

```bash
npm install
```

3. 设置环境变量

创建一个 `.env.local` 文件，包含以下内容：

```
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 管理员设置密钥
NEXT_PUBLIC_ADMIN_SETUP_KEY=your-admin-key

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

4. 运行开发服务器

```bash
npm run dev
```

5. 访问 [http://localhost:3000](http://localhost:3000)

### 数据库设置

执行 `supabase/migrations` 文件夹中的SQL迁移文件，以设置必要的数据库表和函数。

## 部署

项目可以轻松部署到Vercel。请参阅 [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md) 获取详细的部署指南。

## 项目结构

```
luvr/
├── app/                  # Next.js App Router
│   ├── admin/            # 管理员后台
│   ├── api/              # API 路由
│   ├── auth/             # 认证页面
│   ├── create/           # 创建内容页面
│   ├── events/           # 活动页面
│   ├── profile/          # 用户资料页面
│   └── ...
├── components/           # 可复用组件
├── hooks/                # 自定义React Hooks
├── lib/                  # 工具函数和类型
│   ├── supabase/         # Supabase 客户端配置
│   └── types/            # TypeScript 类型定义
├── public/               # 静态资源
├── styles/               # 全局样式
├── supabase/             # Supabase相关文件
│   ├── migrations/       # SQL迁移文件
│   └── functions/        # Edge函数
└── ...
```

## 贡献

欢迎贡献！请遵循以下步骤：

1. Fork仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 许可证

MIT
