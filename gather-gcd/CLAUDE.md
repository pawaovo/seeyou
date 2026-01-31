# seeyou (gather-gcd)

聚会时间协调 Web 应用 - 极简免登录协同，7x3 矩阵涂色寻找时间最大公约数

## 项目概述

- **产品名称**: seeyou
- **目标用户**: 中国大陆移动端用户
- **核心功能**: 多人协作选择可用时间段，通过热力图找到最佳聚会时间
- **设计风格**: Apple-Zen (果式禅意)，Glassmorphism，24px 超大圆角
- **部署平台**: Cloudflare Pages + Supabase

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) + React 18 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 + shadcn/ui (New York) |
| 动画 | Framer Motion |
| 后端 | Supabase (PostgreSQL + JSONB) |
| 工具 | date-fns, lucide-react, html-to-image, sonner |
| 部署 | Cloudflare Pages (Edge Runtime) |

## 项目结构

```
gather-gcd/
├── app/
│   ├── globals.css              # Tailwind + zen 颜色变量
│   ├── layout.tsx               # 根布局 + 字体配置
│   ├── page.tsx                 # 首页 - 创建活动入口
│   ├── create/page.tsx          # 创建活动页面
│   ├── e/[eventId]/page.tsx     # 活动主页面 (验证 + 画布)
│   └── api/
│       ├── events/
│       │   ├── route.ts                    # POST: 创建活动
│       │   └── [eventId]/
│       │       ├── route.ts                # GET: 获取活动详情
│       │       ├── verify/route.ts         # POST: 验证口令 (含速率限制)
│       │       ├── lock/route.ts           # POST: 锁定活动
│       │       └── heatmap/route.ts        # GET: 获取热力图
│       └── responses/route.ts              # POST/PUT: 提交响应
├── components/
│   ├── gather/                  # 核心业务组件
│   │   ├── collaborative-canvas.tsx  # 协作画布容器
│   │   ├── create-event-form.tsx     # 创建活动表单
│   │   ├── data-insight.tsx          # 排行榜 + 成员视图
│   │   ├── share-dialog.tsx          # 分享对话框
│   │   ├── sticky-header.tsx         # 粘性头部导航
│   │   └── week-card.tsx             # 7x3 时间矩阵
│   └── ui/                      # shadcn/ui 组件库
├── hooks/
│   ├── use-event.ts             # 活动数据 Hook
│   ├── use-mobile.ts            # 移动端检测
│   └── use-toast.ts             # Toast 通知
├── lib/
│   ├── utils.ts                 # cn() 类名合并
│   ├── fingerprint.ts           # 用户指纹生成
│   └── supabase/server.ts       # Supabase 服务端客户端
├── types/index.ts               # 全局类型定义
└── supabase/migrations/         # 数据库迁移脚本
```

## 路由设计

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 创建活动入口 |
| `/create` | 创建页 | 输入标题 + 选择日期 |
| `/e/[eventId]` | 活动页 | 口令验证 → 协作画布 |

## API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/events` | POST | 创建活动，返回 id + passcode |
| `/api/events/[id]` | GET | 获取活动详情 + 所有响应 |
| `/api/events/[id]/verify` | POST | 验证口令 (含速率限制) |
| `/api/events/[id]/lock` | POST | 锁定活动 (仅创建者) |
| `/api/events/[id]/heatmap` | GET | 获取热力图数据 |
| `/api/responses` | POST | 提交/更新用户选择 |

## 数据库表结构

### events 表
```sql
id              uuid PRIMARY KEY
title           varchar(50) NOT NULL
passcode        char(6) NOT NULL        -- 6位数字口令
start_date      date NOT NULL
creator_token   uuid                    -- 创建者身份令牌
is_locked       boolean DEFAULT false
final_slot      jsonb NULL
created_at      timestamptz
expires_at      timestamptz             -- 45天后过期
```

### responses 表
```sql
id              serial PRIMARY KEY
event_id        uuid REFERENCES events(id)
nickname        varchar(20) NOT NULL
user_fingerprint varchar(128) NOT NULL
availability    jsonb NOT NULL          -- { "2024-01-15": ["morning", "afternoon"] }
updated_at      timestamptz
UNIQUE(event_id, nickname)
```

## 环境变量

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://seeyou.xiaoweigezzz.xyz
```

## 开发命令

```bash
pnpm dev              # 本地开发
pnpm build            # 生产构建
pnpm build:pages      # Cloudflare Pages 构建
pnpm lint             # ESLint 检查
```

## 重要约定

### Edge Runtime
所有 API 路由和动态页面必须声明 Edge Runtime 以支持 Cloudflare Pages:
```typescript
export const runtime = "edge";
```

### Next.js 15 动态路由参数
动态路由的 params 必须使用 Promise 类型:
```typescript
export default function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  // ...
}
```

### 口令验证
- 口令为 6 位数字
- 每个 IP + eventId 组合每分钟最多 5 次尝试
- 验证失败返回剩余尝试次数

### localStorage 使用
- `creator_token` - 创建者身份识别
- `nickname` - 用户昵称回填
- `user_fingerprint` - 用户指纹

### 性能优化
- WeekCard 使用 useMemo 优化 slotUsersMap 和 selectedSlotsSet
- 避免在渲染阶段读取 localStorage

## 安全措施

1. **口令保护**: 6位数字口令 + 速率限制
2. **RLS 策略**: Supabase 行级安全策略
3. **创建者验证**: 通过 creator_token 验证身份
4. **数据过期**: 45天自动清理

## 部署

项目部署在 Cloudflare Pages，连接 GitHub 仓库自动部署。

**域名**: https://seeyou.xiaoweigezzz.xyz

**构建命令**: `npm run build:pages`

**环境变量**: 在 Cloudflare Pages 设置中配置 Supabase 相关变量
