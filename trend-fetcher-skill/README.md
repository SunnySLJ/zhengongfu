# 🔥 全网热点实时采集 (trend-fetcher)

通过**通义千问API**采集中国6大平台各Top20热搜数据的自动化工具。

## 📦 目录结构

```
trend-fetcher-skill/
├── SKILL.md            # Skill配置文件
├── README.md           # 本说明文件
├── test_api.py         # API连通性测试
├── daily_fetch.py      # 每日一键采集（推荐使用）
├── scripts/
│   ├── __init__.py
│   └── fetch_trends.py # 核心采集脚本
└── data/               # 采集数据存放目录（自动创建）
    ├── latest.json     # 最新一次采集结果
    ├── latest.html     # 最新一次可视化报告
    └── trends_YYYYMMDD_HHMM.json  # 历史数据
```

## 🚀 快速开始

### 1. 测试API连通

```bash
python test_api.py
```

如果看到 `✅ API连通正常！`，说明千问API正常可用。

### 2. 每日一键采集（推荐）

```bash
python daily_fetch.py
```

会自动：
- 采集 6 大平台各 Top 20 热点（约1-2分钟）
- 保存 JSON 数据到 `data/` 目录
- 生成 HTML 可视化报告
- 同时更新 `data/latest.json` 和 `data/latest.html`

采集完成后打开 `data/latest.html` 即可查看报告。

### 3. 命令行高级用法

```bash
# 采集全部平台，输出到指定文件
python scripts/fetch_trends.py --output trends.json --pretty

# 只采集微博
python scripts/fetch_trends.py --platform weibo

# 只采集抖音，生成HTML
python scripts/fetch_trends.py --platform douyin --html douyin.html

# 采集全部，同时输出JSON和HTML
python scripts/fetch_trends.py --output all.json --html report.html
```

### 4. 定时采集（Linux/Mac）

使用crontab每天早中晚各采集一次：

```bash
# 编辑定时任务
crontab -e

# 添加以下三行（每天8点、13点、19点采集）
0 8 * * * cd /path/to/trend-fetcher-skill && python daily_fetch.py >> cron.log 2>&1
0 13 * * * cd /path/to/trend-fetcher-skill && python daily_fetch.py >> cron.log 2>&1
0 19 * * * cd /path/to/trend-fetcher-skill && python daily_fetch.py >> cron.log 2>&1
```

### 5. 在Python代码中调用

```python
from scripts.fetch_trends import fetch_all, fetch_platform, PLATFORMS

# 采集全部平台
results = fetch_all()

# 采集单个平台
weibo = fetch_platform(PLATFORMS[0])
print(f"微博热搜: {len(weibo['trends'])} 条")
for t in weibo['trends'][:5]:
    print(f"  {t['rank']}. {t['title']} ({t['category']})")
```

## 📡 支持平台

| 平台 | ID | 说明 |
|------|-----|------|
| 微博 | weibo | 微博热搜榜 |
| 抖音 | douyin | 抖音热搜榜 |
| 小红书 | xiaohongshu | 小红书热门话题 |
| B站 | bilibili | 哔哩哔哩热搜 |
| 知乎 | zhihu | 知乎热榜 |
| 百度 | baidu | 百度热搜榜 |

## ⚙️ API配置

当前使用通义千问 DashScope API：
- **Base URL**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **Model**: `qwen-plus`
- **API Key**: 已内置于脚本中

如需更换API Key，编辑 `scripts/fetch_trends.py` 中的 `QWEN_API_KEY` 变量。

## 📊 输出格式

JSON格式示例：
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

## 🔗 与其他模块联动

采集到的 `latest.json` 可直接供后续模块使用：
- **剧本创意模块**: 读取热点自动生成脚本
- **素材匹配模块**: 根据热点关键词匹配素材
- **数据分析模块**: 追踪热点趋势变化

## ⚠️ 注意事项

- 需要 Python 3.6+，无需安装额外依赖（仅使用标准库）
- 需要网络访问 DashScope API
- 千问模型返回的热点基于其训练数据和实时知识，不保证100%精确
- 每次全量采集约1-2分钟
- 建议每日采集2-3次覆盖热点变化
