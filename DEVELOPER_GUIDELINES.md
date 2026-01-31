# DEVELOPER_GUIDELINES - 开发规范与原则

## 1. 代码质量与模式
- **TypeScript**: 严禁使用 `any`。所有 API 响应、数据库模型和组件 Props 必须定义接口（Interface）或类型（Type）。
- **组件化**: 遵循"单一职责"原则。复杂的 UI 逻辑（如 7x3 涂色矩阵）必须拆分为小的子组件（如 `Cell.tsx`, `WeekGrid.tsx`）。
- **状态管理**: 优先使用 React `useState` 和 `useMemo`。只有在跨页面共享数据且逻辑极其复杂时才考虑 Context API。

## 2. 动效与交互 (Framer Motion)
- **拒绝生硬**: 所有的显示/隐藏必须配合 `AnimatePresence` 实现淡入淡出或滑入。
- **物理反馈**: 按钮点击必须有 `whileTap={{ scale: 0.95 }}`。
- **布局平滑**: 在排行榜人数变动导致重排时，必须使用 `layout` 属性实现平滑位置交换。

## 3. 容错处理
- **网络异常**: 所有请求 Supabase 的操作必须包裹在 `try-catch` 中，并在 UI 上显示优雅的错误提示（吐司通知 Toast）。
- **空状态**: 当没有人填写时间或排行榜为空时，展示具有"艺术感"的空状态占位符（由 Sally 设计的文案）。

## 4. 与我协作的原则
- **先确认再大改**: 在进行大规模文件结构调整或更换核心库之前，必须先给出方案并询问我的意见。
- **步步为营**: 每完成一个 Epic（史诗任务），请停下来并提醒我根据 `QA_CHECKLIST` 进行验收，通过后再继续。

## 5. 代码清理记录 (2026-01-31)

### 已删除的冗余文件
| 文件 | 原因 |
|------|------|
| `components/ui/use-mobile.tsx` | 与 `hooks/use-mobile.ts` 重复 |
| `components/ui/use-toast.ts` | 与 `hooks/use-toast.ts` 重复 |
| `components/gather/auth-gate.tsx` | 未被任何地方引用 |
| `hooks/use-responses.ts` | 未被任何地方引用 |
| `components/theme-provider.tsx` | 未被任何地方引用 |
| `lib/supabase/client.ts` | 未被引用 |
| `lib/supabase/types.ts` | 未被引用 |

### 已修复的代码问题
- `week-card.tsx`: 移除未使用的 `useMemo` 和 `getDay` 导入
- `data-insight.tsx`: 移除未使用的 `alpha` 变量
- `next.config.mjs`: 移除 `ignoreBuildErrors: true`（TypeScript 检查已通过）
- `package.json`: 修复 `build:pages` 脚本，确保先运行 `next build`

### 保留的 UI 组件
`components/ui/` 目录下的 shadcn/ui 组件虽然大部分未被直接使用，但作为组件库保留以备将来扩展。