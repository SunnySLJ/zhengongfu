# Sora2 视频生成使用指南

## 📋 概述

本模块支持通过多个第三方 API 服务商调用 Sora 2 视频生成能力，无需回调接口，通过轮询方式获取生成结果。

### 支持的服务商

| 服务商 | Host | API Key | 说明 |
|--------|------|---------|------|
| grsai | https://grsai.dakka.com.cn | sk-c40f567ec0ce41509f4be35e47c79885 | GRS AI，主流服务商 |
| poloai | https://poloai.top | sk-AdeTfoNqwVybiIjn8YdJkD6B5rqFqdJkrBqtqawlOIZfauWG | Polo AI，性价比高 |
| n1n | https://api.n1n.ai | sk-qC6USEddOpJENPWyBZKNR6xTU7FcaM8pjAJAVBZtWeP4n4DI | N1N AI，快速生成 |
| wuyin | https://api.wuyinkeji.com/api | iJfhcksCJheHcHzCR7oT990gtH | 无音科技，国内服务 |

## 🚀 快速开始

### 方式一：使用 Python 脚本

```bash
cd trend-fetcher-skill

# 查看配置状态
python3 scripts/sora2_generator.py --status

# 交互式生成
python3 scripts/sora2_generator.py --interactive

# 直接生成（使用默认服务商 grsai）
python3 scripts/sora2_generator.py --prompt "一只可爱的小猫在阳光下玩耍"

# 指定服务商
python3 scripts/sora2_generator.py --provider grsai --prompt "一只可爱的小猫"

# 多个服务商同时生成
python3 scripts/sora2_generator.py --provider grsai,poloai --prompt "一只可爱的小猫"

# 模拟模式（测试用）
python3 scripts/sora2_generator.py --mock --prompt "测试"
```

### 方式二：使用 API

启动服务器：
```bash
python3 server.py
```

#### 1. 生成视频

```bash
curl -X POST http://localhost:8080/api/zgf/gen-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的小猫在阳光下玩耍",
    "duration": 5,
    "provider": "grsai"
  }'
```

响应：
```json
{
  "task_id": "sora2_grsai_1773568756",
  "status": "pending",
  "video_url": "",
  "provider": "GRS AI"
}
```

#### 2. 轮询状态

由于没有回调接口，需要定期轮询获取视频状态：

```bash
curl "http://localhost:8080/api/zgf/video-status?task_id=sora2_grsai_1773568756"
```

处理中响应：
```json
{
  "task_id": "sora2_grsai_1773568756",
  "status": "processing",
  "video_url": "",
  "progress": 50
}
```

完成响应：
```json
{
  "task_id": "sora2_grsai_1773568756",
  "status": "completed",
  "video_url": "https://example.com/video.mp4",
  "progress": 100
}
```

### 方式三：使用测试脚本

```bash
# 测试所有服务商
python3 test_sora2.py --all

# 测试单个服务商
python3 test_sora2.py --provider grsai

# 模拟测试（不调用 API）
python3 test_sora2.py --all --mock
```

## 📊 工作流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  提交任务   │ ──► │  轮询状态   │ ──► │  获取视频   │
│  gen-video  │     │ video-status│     │  video_url  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
  返回 task_id      每 5-10 秒查询一次    下载或播放
  状态：pending     最多轮询 5-10 分钟    MP4 文件
```

## ⏱️ 轮询策略

### 前端轮询（推荐）

```javascript
// 前端每 5 秒轮询一次
const pollInterval = setInterval(async () => {
  const response = await fetch(`/api/zgf/video-status?task_id=${taskId}`);
  const data = await response.json();

  if (data.status === 'completed') {
    clearInterval(pollInterval);
    console.log('视频生成完成:', data.video_url);
  } else if (data.status === 'failed') {
    clearInterval(pollInterval);
    console.error('视频生成失败:', data.error);
  } else {
    console.log(`正在生成：${data.progress}%`);
  }
}, 5000);

// 最多轮询 10 分钟
setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
```

### 后台轮询（自动）

服务器启动时会自动启动后台轮询线程：
- 每 10 秒自动查询所有进行中的任务
- 任务状态会持久化到 `data/sora2_tasks.json`
- 即使重启服务器也能继续查询

## 🔧 配置管理

### 查看配置

```bash
python3 scripts/sora2_generator.py --status
```

### 修改服务商

编辑 `data/sora_config.json`：
```json
{
  "provider": "grsai",
  "providers": {
    "grsai": {
      "name": "GRS AI",
      "host": "https://grsai.dakka.com.cn",
      "apiKey": "sk-xxx"
    },
    "poloai": {
      "name": "Polo AI",
      "host": "https://poloai.top",
      "apiKey": "sk-xxx"
    }
  }
}
```

### 前端配置

在前端页面（`frontend/saas-app/src/pages/ZhenGongFu/index.tsx`）中：
1. 点击「配置」按钮
2. 选择或编辑服务商
3. 修改 Host 和 API Key
4. 点击「保存配置」

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `scripts/sora2_generator.py` | 核心生成脚本 |
| `scripts/video_generator.py` | 多平台视频生成器（含 Sora） |
| `server.py` | API 服务器 |
| `test_sora2.py` | 测试脚本 |
| `data/sora_config.json` | 服务商配置 |
| `data/sora2_tasks.json` | 任务状态持久化 |
| `data/videos_*.json` | 生成结果记录 |

## ⚠️ 注意事项

1. **API Key 安全**：不要将 API Key 提交到公开代码仓库
2. **轮询频率**：建议 5-10 秒轮询一次，避免请求过于频繁
3. **超时处理**：设置合理的超时时间（5-10 分钟）
4. **错误处理**：视频生成可能失败，需要处理错误情况
5. **视频存储**：生成的视频链接有有效期，及时下载保存

## 🛠️ 故障排查

### 问题：所有 endpoint 都返回 404

**原因**：API 服务商的地址或接口格式不正确

**解决**：
1. 检查 Host 是否正确
2. 确认 API Key 有效
3. 查看服务商文档确认 endpoint 格式

### 问题：轮询一直返回 processing

**原因**：视频生成需要时间，或任务已丢失

**解决**：
1. 继续轮询，等待生成完成
2. 检查 task_id 是否正确
3. 查看服务器日志是否有错误

### 问题：认证失败（401/403）

**原因**：API Key 无效或过期

**解决**：
1. 检查 API Key 是否正确
2. 联系服务商确认 Key 的状态
3. 更换其他服务商

## 📞 技术支持

如有问题，请查看：
- 服务器日志：`server.py` 输出
- 任务记录：`data/sora2_tasks.json`
- 生成结果：`data/videos_*.json`
