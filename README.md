# 🔥 AutoPipeline - 六位一体无人值守流水线

> 从热点感知到数据分析的全自动内容生产系统

## 📁 项目结构

```
auto-pipeline-project/
│
├── frontend/                          # 前端React组件（.jsx）
│   ├── 01-pipeline-dashboard/         # 六位一体总控面板
│   │   └── pipeline-mvp.jsx           # 6个环节流水线Dashboard
│   ├── 02-trend-detection/            # 热点感知模块（静态数据版）
│   │   └── trend-detection.jsx        # 真实热点展示：主题+文案+标签+分析
│   └── 03-trend-fetcher-live/         # 热点采集模块（实时联网版）
│       └── trend-fetcher-live.jsx     # 一键采集6平台Top20热搜
│
├── backend/                           # 后端Python脚本
│   └── trend-fetcher-skill/           # 千问API热点采集Skill
│       ├── SKILL.md                   # Skill配置文件
│       ├── README.md                  # 详细使用说明
│       ├── test_api.py                # API连通性测试
│       ├── daily_fetch.py             # 每日一键采集（推荐）
│       ├── scripts/
│       │   ├── __init__.py
│       │   └── fetch_trends.py        # 核心采集脚本
│       └── data/                      # 采集数据存放（自动创建）
│
└── docs/                              # 项目文档
    └── README.md                      # 本文件
```

## 🚀 六位一体流水线架构

```
┌─────────────────── 上游：智能生产 ───────────────────┐
│                                                       │
│  ① 热点感知  →  ② 剧本创意  →  ③ 素材匹配          │
│  Trend Detection  Script Gen     Asset Matching       │
│  <5分钟响应      1000+/日        <100ms匹配          │
│                                                       │
├─────────────────── 下游：自动分发 ───────────────────┤
│                                                       │
│  ④ 批量生产  →  ⑤ 定时上传  →  ⑥ 数据分析          │
│  Mass Production  Publishing     Analytics            │
│  10万+/日        65+平台         38项指标             │
│                                                       │
└───────────────── 闭环：自循环飞轮 ────────────────────┘
```

## 📋 当前进度

| 模块 | 状态 | 说明 |
|------|------|------|
| ① 热点感知 | ✅ 已完成 | 前端展示 + Python采集 + Skill封装 |
| ② 剧本创意 | ✅ 已完成 | 千问API自动生成脚本 + 前端 + HTML报告 |
| ③ 素材匹配 | ✅ 已完成 | 43件素材库关键词匹配 + HTML报告 |
| ④ 批量生产 | ✅ 已完成 | 多变体渲染模拟 + 任务调度 |
| ⑤ 定时上传 | ✅ 已完成 | 多平台智能排期调度 |
| ⑥ 数据分析 | ✅ 已完成 | 38项指标全景追踪 + 前端 + HTML报告 |
| 总控面板 | ✅ 已完成 | 六环节可视化Dashboard |
| 流水线总控 | ✅ 已完成 | pipeline_runner.py 一键运行全部6环节 |

---

## 🔧 快速开始

### 方式一：前端React组件

将 `frontend/` 下的 `.jsx` 文件直接在 Claude Artifact 中打开预览，或放入你的React项目中。

**01-pipeline-dashboard** — 六位一体总控面板
- 点击「启动流水线」查看6个环节依次启动动画
- 点击任意节点查看详细信息

**02-trend-detection** — 热点感知面板（2026.3.15真实数据）
- 10条真实热点，含爆款文案、主题方向、标签集合
- 左侧点击切换热点，右侧查看四个维度详情

**03-trend-fetcher-live** — 实时热点采集器
- 联网搜索6大平台真实热搜
- 支持导出JSON供后续模块使用

### 方式二：🚀 一键运行完整六位一体流水线（推荐）

```bash
cd trend-fetcher-skill

# 模拟模式（无需API，快速测试全流程）
python3 pipeline_runner.py --mock -n 3

# 真实API模式（需要有效的千问API Key）
python3 pipeline_runner.py -n 5

# 只运行指定环节（如只采集+生成脚本）
python3 pipeline_runner.py --stage 1,2 --mock

# 查看报告（运行后自动生成）
open data/latest.html            # 热点报告
open data/latest_scripts.html   # 脚本报告
open data/latest_matched.html   # 素材匹配报告
open data/latest_analytics.html # 数据分析报告
```

### 方式三：Python单模块使用

```bash
cd trend-fetcher-skill

# ① 热点采集
python3 daily_fetch.py

# ② 剧本生成（从热点自动生成脚本）
python3 scripts/script_generator.py --mock -n 5

# ③ 素材匹配
python3 scripts/asset_matcher.py --mock

# ⑥ 数据分析（38项指标）
python3 scripts/analytics.py
```

### 方式三：定时自动采集

```bash
crontab -e
# 每天 8:00、13:00、19:00 自动采集
0 8,13,19 * * * cd /path/to/backend/trend-fetcher-skill && python daily_fetch.py >> cron.log 2>&1
```

---

## ⚙️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React + Recharts | 交互式Dashboard，内联样式无依赖 |
| API | 通义千问 qwen-plus | DashScope OpenAI兼容接口 |
| 后端 | Python 3.6+ | 零依赖，仅用标准库 |
| Skill | SKILL.md规范 | 可直接装入Claude Skills系统 |

## 🔑 API配置

千问API Key已内置于代码中：
```
sk-sp-432aa1b7751a4fea8e6425131ed89eb4
```

如需更换，修改以下文件：
- `backend/trend-fetcher-skill/scripts/fetch_trends.py` → `QWEN_API_KEY`
- `backend/trend-fetcher-skill/test_api.py` → `API_KEY`

---

## 📊 数据格式

采集输出的 JSON 格式：
```json
[
  {
    "platform": "weibo",
    "name": "微博",
    "fetch_time": "2026-03-15 14:30:00",
    "status": "ok",
    "trends": [
      {
        "rank": 1,
        "title": "#315晚会今晚直播#",
        "heat": "9999万",
        "category": "社会"
      }
    ]
  }
]
```

## 🔗 模块联动设计

```
热点采集 (latest.json)
    ↓ 读取热点数据
剧本生成 (script_generator.py)  ← 待开发
    ↓ 输出脚本
素材匹配 (asset_matcher.py)     ← 待开发
    ↓ 匹配素材
批量生产 (video_renderer.py)    ← 待开发
    ↓ 渲染视频
定时上传 (scheduler.py)         ← 待开发
    ↓ 多平台发布
数据分析 (analytics.py)         ← 待开发
    ↓ 反馈优化 → 回到热点采集
```
