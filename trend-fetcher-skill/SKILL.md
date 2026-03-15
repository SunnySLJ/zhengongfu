---
name: trend-fetcher
description: 全网热点实时采集技能。通过通义千问API采集微博、抖音、小红书、B站、知乎、百度6大平台各Top20热搜数据。每当用户需要获取热点、热搜、趋势话题、全网热门、今日热榜、爆款话题时触发此技能。也适用于需要做内容选题、蹭热点、趋势分析、舆情监控的场景。即使用户只是说"帮我看看今天有什么热点"也应该触发。
---

# 全网热点实时采集

通过通义千问（Qwen）大模型 API，实时采集中国6大主流平台的热搜/热榜数据。

## 使用方式

### 1. 运行采集脚本

```bash
python /path/to/skill/scripts/fetch_trends.py
```

这会采集全部6个平台的热点并输出JSON。

### 2. 采集单个平台

```bash
python /path/to/skill/scripts/fetch_trends.py --platform weibo
```

支持的平台：`weibo`, `douyin`, `xiaohongshu`, `bilibili`, `zhihu`, `baidu`

### 3. 输出到文件

```bash
python /path/to/skill/scripts/fetch_trends.py --output /path/to/output.json
```

### 4. 生成前端展示页面

```bash
python /path/to/skill/scripts/fetch_trends.py --html /path/to/output.html
```

## 配置

API密钥在脚本中已内置，使用通义千问 DashScope OpenAI兼容接口：
- Base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- Model: `qwen-plus`

## 输出格式

每个平台返回最多20条热点，格式：
```json
{
  "platform": "weibo",
  "name": "微博",
  "fetch_time": "2026-03-15 14:30:00",
  "trends": [
    {
      "rank": 1,
      "title": "热搜标题",
      "heat": "热度值",
      "category": "分类"
    }
  ]
}
```

category分类包括：科技、娱乐、社会、财经、体育、政策、生活、教育、国际、其他

## 工作流程

1. 读取此 SKILL.md 了解用法
2. 运行 `scripts/fetch_trends.py` 采集数据
3. 将结果展示给用户（可生成HTML页面或直接在对话中展示）
4. 如需持久化，输出到 JSON 文件供后续模块使用

## 注意事项

- 需要网络访问 DashScope API
- 每次全量采集约需 1-2 分钟（6个平台顺序请求）
- 千问模型基于自身训练数据和实时知识返回热点，准确度取决于模型能力
- 建议每日采集 1-3 次，早中晚各一次覆盖热点变化
