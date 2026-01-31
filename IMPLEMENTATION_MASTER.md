
---

### 1. 核心实施蓝图：`IMPLEMENTATION_MASTER.md`

这是 AI 的“大脑”，包含了所有的逻辑、架构和视觉灵魂。

```markdown
# IMPLEMENTATION_MASTER.md - Gather GCD 聚会公约数

## 1. 项目定位与设计灵魂
- **核心逻辑**：极简免登录 Web 协同，利用 7x3（早/中/晚）矩阵涂色寻找时间最大公约数（GCD）。
- **设计风格**：Apple-Zen (果式禅意)。大量留白、Glassmorphism（玻璃拟态）、渐变水彩涂抹感。
- **字体规范**：标题与日期使用优雅衬线体（Serif, 如 Playfair Display），数据与功能文本使用干净无衬线体（Sans-serif, 如 Inter）。

## 2. 技术规格
- **框架**: Next.js 14+ (App Router), TypeScript.
- **样式与动效**: Tailwind CSS, Framer Motion.
- **数据库**: Supabase (PostgreSQL + JSONB).
- **前端工具**: lucide-react (图标), html-to-image (海报生成).

## 3. 核心功能逻辑
### 3.1 免登录身份识别
- **创建者**: 存入 `creator_token` (UUID) 到 LocalStorage。
- **参与者**: 存入 `nickname` 和 `user_fingerprint` 到 LocalStorage。
- **回填逻辑**: 再次访问时，前端优先从本地读取昵称并自动向后端请求该昵称的 `availability` 数据进行回填。

### 3.2 动态周扩展与下滑交互
- **布局**: 垂直排布的周卡片。
- **动态入口**: 顶部 Tab 仅展示有数据的周。
- **下滑操作**: 用户下滑到底部点击 `+` 可解锁下一周。
- **数据结构**: `availability` 采用 JSONB 稀疏存储：`{"2026-02-14": [1, 3]}`。

### 3.3 GCD 聚合视图
- **全量排行榜**: 格式为 `14 周六 · 下午`。背景色深度对应重合人数。
- **全量成员视图**: 每个人一个卡片，展示其选中的微缩时间矩阵。

## 4. 关键算法：最大公约数 (GCD)
- 遍历所有 `responses`，对每个 `Slot` (日期-时段) 进行计数。
- 排序规则：人数从多到少 > 日期从早到晚 > 时段（早-中-晚）。

```

---

### 2. 数据库执行脚本：`DATABASE_SETUP.sql`

直接让 AI 在 Supabase 控制台运行此代码。

```sql
-- 开启 UUID 扩展
create extension if not exists "uuid-ossp";

-- 活动表
create table events (
  id uuid primary key default uuid_generate_v4(),
  title varchar(50) not null,
  passcode char(4) not null, 
  start_date date not null,
  creator_token uuid default uuid_generate_v4(),
  is_locked boolean default false,
  final_slot jsonb null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '45 days')
);

-- 响应表
create table responses (
  id serial primary key,
  event_id uuid references events(id) on delete cascade,
  nickname varchar(20) not null,
  user_fingerprint varchar(128) not null,
  availability jsonb not null, 
  updated_at timestamptz default now(),
  unique(event_id, nickname)
);

-- 热力图聚合函数
create or replace function get_event_heatmap(target_event_id uuid)
returns table (slot_date date, slot_type int, participant_count bigint, names text[]) as $$
begin
  return query
  with unnested as (
    select 
      (jsonb_each(availability)).key as d,
      (jsonb_array_elements((jsonb_each(availability)).value))::int as s,
      nickname
    from responses
    where event_id = target_event_id
  )
  select 
    d::date, s, count(*), array_agg(nickname)
  from unnested
  group by d, s
  order by count(*) desc, d asc, s asc;
end;
$$ language plpgsql;

```

---

### 3. 环境配置模板：`.env.example`

指导 AI 正确连接后端。

```text
# Supabase 连接信息
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 基础路径
NEXT_PUBLIC_SITE_URL=http://localhost:3000

```

---

### 4. 视觉资产清单：`ASSETS_MANIFEST.md`

确保 UI 细节符合“设计感”要求。

```markdown
# ASSETS_MANIFEST - 视觉资产与约束

## 1. 图标映射 (Lucide-React)
- 🌅 上午 (08:00-12:00): `Sun`
- ☀️ 下午 (12:00-18:00): `SunMedium`
- 🌙 晚上 (18:00-24:00): `Moon`
- ➕ 扩展周: `Plus` (圆形外框，带呼吸动画)
- 🏆 最佳时间: `Crown`
- 🔒 锁定活动: `Lock`

## 2. 视觉约束
- **圆角**: 统一 `24px` (或 Tailwind 的 `rounded-3xl`)。
- **边框**: 统一 `1.5px` 实线，颜色为 `border-black/5`。
- **阴影**: 使用极轻的 `shadow-sm` 结合 `backdrop-blur`。
- **涂抹颜色**: 线性渐变 `from-[#00FF88] to-[#00CCBB]`。

## 3. 动效约束
- 页面切换: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- 涂色反馈: `whileTap={{ scale: 0.95 }}`

```

---

### 5. 验收测试清单：`QA_CHECKLIST.md`

确保交付质量。

```markdown
# QA_CHECKLIST - 验收与测试

## 1. 核心交互测试
- [ ] **涂色手势**: 在手机上左右滑动是否能连续涂抹/擦除多个日期？
- [ ] **动态扩展**: 点击底部 `+` 是否能即时生成新周卡片？顶部 Tab 是否同步更新？
- [ ] **排行榜实时性**: 点击“保存”后，排行榜是否按最新重合度重排？

## 2. 免登录逻辑测试
- [ ] **身份回填**: 刷新页面或关闭浏览器再进入，是否自动填入之前的昵称和涂色？
- [ ] **权限隔离**: 只有创建者（LocalStorage 匹配 token）能看到“锁定”按钮吗？

## 3. 视觉与输出测试
- [ ] **海报渲染**: 生成的海报是否清晰？长名字是否能优雅排版？
- [ ] **氛围感**: 页面是否有充足的留白？动效是否流畅不卡顿？

```

---