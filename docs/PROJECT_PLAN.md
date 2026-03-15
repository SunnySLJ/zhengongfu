# 帧功夫 - 短视频内容营销 SaaS 平台项目规划

> 品牌名：帧功夫。分阶段逐步实现，每步独立可交付。

---

## 一、完整功能模块（按优先级）

| 优先级 | 模块 | 说明 | 导航位置 | 状态 |
|--------|------|------|----------|------|
| P0 | 用户体系与团队管理 | 注册/登录、团队/门店/成员、RBAC权限 | 已隐藏（路由保留） | ✅ 已完成 |
| P0 | 热点雷达 | 多平台热点聚合、热度趋势、收藏、一键创作 | 流量学院 > 热点雷达 | ✅ 已完成 |
| P0 | 爆款文案库 | 行业/类型筛选、排序、卡片浏览、使用/收藏 | 流量学院 > 爆款文案 | ✅ 已完成 |
| P0 | 剪辑模板库 | 行业/类型/时长筛选、搜索、置顶、模板预览 | 流量学院 > 剪辑模板 | ✅ 已完成 |
| P0 | 批量混剪 | 选模板、上传素材、批量生成多条视频 | 流量学院 > 批量混剪 | ✅ 已完成 |
| P0 | 视频生成 | 脚本→AI生成视频，配置风格/配音/比例 | 流量学院 > 视频生成 | ✅ 已完成 |
| P0 | 提示词库 | AI视频生成提示词收藏/复制/自建 | 流量学院 > 提示词库 | ✅ 已完成 |
| P1 | 矩阵分发 | 多平台账号绑定、定时发布、批量分发 | 作品分发 > 矩阵分发 | ✅ 已完成 |
| P1 | 素材预处理 | 本地素材上传、管理、预处理 | 素材预处理 | 占位中 |
| P1 | 首页工作台 | 数据概览、快捷入口、待办事项 | 首页工作台 | 占位中 |
| P2 | 数据看板 | 作品数据回收、多维度分析、趋势图 | 作品分发 > 数据看板 | 占位中 |
| P3 | 创意项目工作台 | 项目创建、剧本编辑、素材关联、生产流程 | **已隐藏，待规划** | 🔒 隐藏 |
| P3 | 数字分身 | 数字人形象定制、口播视频生成 | **已隐藏，待规划** | 🔒 隐藏 |
| P3 | 人脸融合 | AI换脸、形象替换 | **已隐藏，待规划** | 🔒 隐藏 |
| P3 | 学院课程 | 课程内容管理、视频课程、学习进度追踪 | **已隐藏，待规划** | 🔒 隐藏 |

### 隐藏模块详细需求备忘

#### 创意项目工作台（创作空间）
- 项目列表：卡片式，按状态筛选（草稿/生产中/已完成）
- 项目详情三栏布局：左-文案/脚本 | 中-预览画布 | 右-配置面板
- 关联文案库/模板库，一键填入素材
- 生产队列：Celery 异步任务，进度实时更新（SSE/WebSocket）
- 版本历史，可回溯

#### 数字分身
- 形象上传：上传真人照片/视频，生成数字分身模型
- 口播生成：输入文案→数字人配音+口型同步→输出视频
- 多形象管理：不同场景使用不同分身
- 集成方案：HeyGen API / 硅基流动

#### 人脸融合
- 上传模板视频 + 人脸照片 → 一键换脸
- 批量处理：同一模板多张人脸批量生成
- 集成方案：腾讯云人脸融合 API / 百度AI

#### 学院课程
- 课程分类：基础入门 / 进阶技巧 / 行业案例
- 视频课程播放器（支持进度记忆）
- 章节列表，学习进度追踪
- 笔记功能，课后练习

---

## 二、分阶段实现计划

### Phase 1: 基础骨架与内容库（MVP）
> 用户可登录、浏览爆款文案和剪辑模板

#### Step 1.1: 项目脚手架与全局布局
**前端**
- React 18 + TypeScript + Vite + Ant Design 5 + React Router 6 + Zustand + TanStack Query
- 左侧可折叠导航栏（Sider），支持展开/收起
- 响应式 Layout：Sider + Header + Content
- 路由配置（每个导航项对应独立路由，暂用占位页）

**后端**
- FastAPI + SQLAlchemy 2.0 + PostgreSQL + Redis + Alembic
- 统一响应格式：`{ code, message, data, pagination }`
- CORS、日志、异常处理中间件

**验收标准**：应用可运行，导航可跳转，所有页面有占位内容

---

#### Step 1.2: 用户认证与团队基础
**数据库**：users、teams、team_members、stores 表

**后端 API**
- `POST /api/v1/auth/register` — 手机号+验证码注册
- `POST /api/v1/auth/login` — 登录返回JWT
- `GET /api/v1/teams/current` — 当前团队信息
- `GET /api/v1/teams/members` — 成员列表

**前端**：登录/注册页、AuthGuard、团队概况/成员/门店管理

**验收标准**：用户可注册、登录、创建团队、邀请成员

---

#### Step 1.3: 爆款文案库
**数据库**：copywriting、copywriting_favorites 表

**后端 API**
- `GET /api/v1/copywriting/` — 支持 industry/type/sort_by/page 参数
- `GET /api/v1/copywriting/{id}` — 详情
- `POST /api/v1/copywriting/{id}/use` — 使用（Redis incr 计数）
- `POST /api/v1/copywriting/{id}/favorite` — 收藏/取消

**前端组件**：IndustryFilter、TypeFilter、SortSelector、CopywritingCard、CopywritingGrid、CopywritingDetail

**关键点**：
- URL searchParams 驱动筛选（刷新保持状态）
- 图片懒加载
- 使用次数：乐观更新 + Redis incr → 定期回写DB

**验收标准**：可按行业/类型筛选，可排序，可查看详情和使用

---

#### Step 1.4: 剪辑模板库
**数据库**：templates 表（含 is_pinned、duration_seconds、template_data jsonb）

**后端 API**
- `GET /api/v1/templates/` — 支持 industry/type/duration/keyword/sort_by/page
- `GET /api/v1/templates/{id}` — 详情
- `POST /api/v1/templates/{id}/use` — 使用模板

**前端组件**：DurationFilter、SearchInput（防抖300ms）、TemplateCard（含置顶badge、hover预览）

**关键点**：
- 置顶模板始终排前（ORDER BY is_pinned DESC）
- PostgreSQL 全文检索关键词搜索
- hover 播放短预览视频
- 复用 IndustryFilter、SortSelector

**验收标准**：多维度筛选，关键词搜索，置顶模板展示

---

### Phase 2: 创作核心流程

#### Step 2.1: 素材管理
- 分片上传 + Celery 异步转码
- 文件夹管理、视频/图片预览
- 存储：OSS/S3 + CDN

#### Step 2.2: 创意项目工作台
- 项目创建 → 选文案 → 选模板 → 素材填槽 → 配置 → 生产
- 三栏布局：文案 | 预览 | 配置面板

#### Step 2.3: 首页工作台
- 数据概览卡片：今日创作数、本周发布数等
- 快捷入口 + 最近项目

---

### Phase 3: 分发与数据

#### Step 3.1: 矩阵分发
- 多平台 OAuth 授权绑定
- 定时发布（Celery Beat）
- 批量发布 + 状态实时更新（SSE）

#### Step 3.2: 数据看板
- 定时拉取平台数据
- ECharts 折线图/柱状图
- 时间范围/平台/账号筛选

#### Step 3.3: 爆款标题库
- 与文案库同架构
- 增加 AI 标题改写（LLM API）

---

### Phase 4: AI增强

- Step 4.1: 数字分身（集成 HeyGen / 硅基智能）
- Step 4.2: 人脸融合（腾讯云/百度AI）
- Step 4.3: 学院课程（视频课程管理）

---

## 三、技术架构

```
前端: React 18 + TypeScript + Vite + Ant Design 5
后端: FastAPI + SQLAlchemy 2.0 + PostgreSQL + Redis + Celery
存储: OSS/S3 + CDN
部署: Docker + Docker Compose
```

### 通用筛选器架构
```typescript
// URL searchParams 驱动，TanStack Query 自动缓存
useFilteredList<T>({ apiEndpoint, filters, defaultSort })
// 返回 { data, filters, setFilter, sort, setSort, pagination }
```

### 使用次数高并发
- 点击"使用" → Redis INCR → 前端乐观+1
- 定时任务每5分钟批量回写 PostgreSQL

---

## 四、当前进度

| 步骤 | 状态 |
|------|------|
| 1.1 项目脚手架与全局布局 | 待开始 |
| 1.2 用户认证与团队基础 | 待开始 |
| 1.3 爆款文案库 | 待开始 |
| 1.4 剪辑模板库 | 待开始 |
| 2.x 创作核心流程 | 待开始 |
| 3.x 分发与数据 | 待开始 |
| 4.x AI增强 | 待开始 |
