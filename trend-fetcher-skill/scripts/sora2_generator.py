#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sora2 多平台视频生成器
支持用户配置的多个第三方 API 服务商：
  - grsai:  https://grsai.dakka.com.cn
  - poloai: https://poloai.top
  - n1n:    https://api.n1n.ai
  - wuyin:  https://api.wuyinkeji.com/api

用法:
  python3 sora2_generator.py --mock                      # 模拟模式
  python3 sora2_generator.py --provider grsai --mock     # 模拟特定服务商
  python3 sora2_generator.py --provider grsai,poloai     # 多个服务商
  python3 sora2_generator.py --prompt "一只可爱的小猫"    # 直接生成
  python3 sora2_generator.py --status                    # 查看配置状态

由于没有回调接口，使用轮询方式获取生成结果。
"""
import sys
import io
# 设置 UTF-8 输出，兼容 Windows 控制台
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import json, os, time, argparse, ssl, urllib.request, urllib.error
from datetime import datetime
from typing import Dict, List, Optional, Any

TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ① API 配置（与 server.py 共享配置）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SORA_CONFIG_FILE = os.path.join(DATA_DIR, "sora_config.json")

SORA_DEFAULT_PROVIDERS = {
    "n1n":  {"name": "N1N AI", "host": "https://api.n1n.ai", "apiKey": "sk-qC6USEddOpJENPWyBZKNR6xTU7FcaM8pjAJAVBZtWeP4n4DI"},
}

def _load_sora_config() -> Dict:
    """加载 Sora 配置，优先从文件读取，否则使用默认配置"""
    if os.path.exists(SORA_CONFIG_FILE):
        try:
            with open(SORA_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {"provider": "n1n", "providers": dict(SORA_DEFAULT_PROVIDERS)}

def _save_sora_config(config: Dict) -> bool:
    try:
        with open(SORA_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ② 元信息配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROVIDERS = {
    "grsai": {
        "name": "GRS AI", "icon": "🌟", "color": "#6366f1",
        "model": "sora-2", "max_dur": 30,
        "note": "主流 Sora API 服务商，稳定性好",
    },
    "poloai": {
        "name": "Polo AI", "icon": "🎯", "color": "#f59e0b",
        "model": "sora-2", "max_dur": 30,
        "note": "性价比高，支持多种视频风格",
    },
    "n1n": {
        "name": "N1N AI", "icon": "⚡", "color": "#10b981",
        "model": "sora-2", "max_dur": 30,
        "note": "快速生成，适合短视频",
    },
    "wuyin": {
        "name": "无音科技", "icon": "🔮", "color": "#8b5cf6",
        "model": "sora-2", "max_dur": 30,
        "note": "国内服务商，网络延迟低",
    },
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ③ HTTP 工具
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def http_post(url: str, body: dict, api_key: str, timeout: int = 60) -> tuple:
    """发送 POST 请求"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")[:400]
        return {"_error": f"HTTP {e.code}: {err}", "_http_code": e.code}, e.code
    except Exception as e:
        return {"_error": str(e)}, 0

def http_get(url: str, api_key: str, timeout: int = 30) -> tuple:
    """发送 GET 请求"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {api_key}",
    }, method="GET")

    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        return {"_error": f"HTTP {e.code}"}, e.code
    except Exception as e:
        return {"_error": str(e)}, 0

def download_file(url: str, path: str) -> bool:
    """下载视频文件"""
    try:
        urllib.request.urlretrieve(url, path)
        return True
    except Exception as ex:
        print(f"  ✗ 下载失败：{ex}")
        return False

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ④ 任务存储（用于轮询）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_tasks: Dict[str, Dict] = {}  # task_id -> task_info

TASKS_FILE = os.path.join(DATA_DIR, "sora2_tasks.json")

def _save_tasks():
    try:
        with open(TASKS_FILE, 'w', encoding='utf-8') as f:
            json.dump(_tasks, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def _load_tasks():
    global _tasks
    if os.path.exists(TASKS_FILE):
        try:
            with open(TASKS_FILE, 'r', encoding='utf-8') as f:
                _tasks = json.load(f)
        except Exception:
            pass

def _extract_task_id(data: dict, fallback: str) -> str:
    """从 API 响应中提取 task_id"""
    # 多种可能的字段名
    for key in ["id", "task_id", "video_id", "request_id"]:
        if data.get(key):
            return str(data[key])
    # 嵌套在 data 中
    if isinstance(data.get("data"), dict):
        for key in ["id", "task_id", "video_id"]:
            if data["data"].get(key):
                return str(data["data"][key])
    return fallback

def _extract_video_url(data: dict) -> str:
    """从 API 响应中提取 video_url"""
    # 多种可能的字段名
    for key in ["video_url", "url", "video", "download_url", "output_url"]:
        if data.get(key):
            return str(data[key])
    # 嵌套在 data/output/video 中
    for container in ["data", "output", "video", "result"]:
        if isinstance(data.get(container), dict):
            for key in ["video_url", "url", "download_url"]:
                if data[container].get(key):
                    return str(data[container][key])
    return ""

def _extract_status(data: dict) -> str:
    """从 API 响应中提取状态"""
    status = data.get("status", data.get("state", data.get("task_status", "")))
    status_lower = str(status).lower()

    # 状态映射
    if status_lower in ["completed", "succeeded", "success", "done", "finished"]:
        return "completed"
    elif status_lower in ["failed", "error", "failure"]:
        return "failed"
    elif status_lower in ["processing", "running", "queued", "pending", "generating"]:
        return "processing"
    return status or "processing"

def _extract_progress(data: dict) -> int:
    """从 API 响应中提取进度"""
    progress = data.get("progress", data.get("percent", data.get("completion", 0)))
    try:
        return int(progress)
    except (ValueError, TypeError):
        return 0

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑤ 视频生成核心逻辑
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def sora2_generate(
    prompt: str,
    provider_key: str = "grsai",
    duration: int = 5,
    size: str = "720x1280",  # 竖屏 9:16
) -> Dict:
    """
    调用 Sora2 API 生成视频

    Args:
        prompt: 视频描述提示词
        provider_key: 服务商 key
        duration: 视频时长（秒）
        size: 视频尺寸

    Returns:
        {
            "status": "pending"|"completed"|"error",
            "task_id": "...",
            "provider": "...",
            "video_url": "",  # 如果同步返回
            "error": ""       # 如果有错误
        }
    """
    config = _load_sora_config()
    providers = config.get("providers", SORA_DEFAULT_PROVIDERS)

    if provider_key not in providers:
        return {"status": "error", "error": f"未知的服务商：{provider_key}"}

    p = providers[provider_key]
    host = p["host"].rstrip("/")
    api_key = p["apiKey"]
    pinfo = PROVIDERS.get(provider_key, {})

    # 尝试多个可能的 endpoint
    endpoints_to_try = [
        "/v1/video/generations",
        "/v1/videos/generations",
        "/v1/videos",
        "/v1/generate/video",
        "/v1/sora/generate",
        "/api/v1/video/generations",
    ]

    body = {
        "model": pinfo.get("model", "sora-2"),
        "prompt": prompt,
        "duration": min(duration, 30),
        "size": size,
        "n": 1,
    }

    errors_log = []

    for ep in endpoints_to_try:
        url = f"{host}{ep}"
        print(f"    尝试：{url}", end=" ", flush=True)

        resp, code = http_post(url, body, api_key)

        if "_error" in resp:
            error_msg = resp["_error"]
            # 404 表示 endpoint 不存在，继续尝试下一个
            if code == 404:
                print("❌ (404)")
                errors_log.append(f"{ep}: 404")
                continue
            # 401/403 认证错误，不再继续
            elif code in (401, 403):
                print(f"❌ (HTTP {code})")
                return {"status": "error", "error": f"认证失败：{error_msg}"}
            else:
                print(f"❌ (HTTP {code})")
                errors_log.append(f"{ep}: {error_msg}")
                continue

        # 成功响应，提取 task_id
        task_id = _extract_task_id(resp, f"sora2_{provider_key}_{int(time.time())}")
        video_url = _extract_video_url(resp)
        status = _extract_status(resp)

        # 如果同步返回视频
        if status == "completed" and video_url:
            print("✅ (同步完成)")
            return {
                "status": "completed",
                "task_id": task_id,
                "provider": pinfo.get("name", provider_key),
                "video_url": video_url,
                "prompt": prompt,
                "duration": duration,
                "generate_time": TIMESTAMP,
            }

        # 异步任务，存储任务信息
        print(f"✅ (task_id: {task_id[:20]}...)")

        task_info = {
            "task_id": task_id,
            "provider_key": provider_key,
            "provider": pinfo.get("name", provider_key),
            "host": host,
            "api_key": api_key,
            "endpoint": ep,
            "status": status,
            "prompt": prompt,
            "duration": duration,
            "created": time.time(),
            "video_url": "",
            "progress": 0,
        }
        _tasks[task_id] = task_info
        _save_tasks()

        return {
            "status": "pending",
            "task_id": task_id,
            "provider": pinfo.get("name", provider_key),
            "video_url": "",
        }

    # 所有 endpoint 都失败
    err_msg = "; ".join(errors_log) if errors_log else "所有 endpoint 均返回 404"
    return {
        "status": "error",
        "error": f"视频生成失败 ({pinfo.get('name', provider_key)}): {err_msg}",
        "task_id": "",
    }

def sora2_poll_status(task_id: str, timeout: int = 600, interval: int = 5) -> Dict:
    """
    轮询视频生成状态

    Args:
        task_id: 任务 ID
        timeout: 超时时间（秒）
        interval: 轮询间隔（秒）

    Returns:
        {
            "status": "completed"|"processing"|"failed",
            "video_url": "...",
            "progress": 50,
        }
    """
    # 从存储中加载任务信息
    task = _tasks.get(task_id)
    if not task:
        return {"status": "unknown", "error": "未找到该任务", "video_url": ""}

    # 已完成直接返回
    if task.get("status") == "completed" and task.get("video_url"):
        return {
            "status": "completed",
            "video_url": task["video_url"],
            "progress": 100,
        }

    host = task["host"]
    api_key = task["api_key"]
    ep = task["endpoint"]

    url = f"{host}{ep}/{task_id}"
    start_time = time.time()

    while time.time() - start_time < timeout:
        resp, _ = http_get(url, api_key)

        if "_error" in resp:
            # 可能是任务还未创建，继续轮询
            time.sleep(interval)
            continue

        status = _extract_status(resp)
        video_url = _extract_video_url(resp)
        progress = _extract_progress(resp)

        # 更新任务状态
        task["status"] = status
        if video_url:
            task["video_url"] = video_url
        task["progress"] = progress
        _save_tasks()

        if status == "completed":
            return {
                "status": "completed",
                "video_url": video_url,
                "progress": 100,
            }
        elif status == "failed":
            error_msg = resp.get("error", {}).get("message", resp.get("message", "未知错误"))
            return {
                "status": "failed",
                "error": error_msg,
                "video_url": "",
            }

        # 显示进度
        elapsed = int(time.time() - start_time)
        print(f"\r    ⏳ {task['provider']}: {status} {progress}% ({elapsed}s)...", end="", flush=True)
        time.sleep(interval)

    # 超时
    return {
        "status": "timeout",
        "error": f"等待超时 ({timeout}s)",
        "video_url": "",
    }

def sora2_poll_status_non_blocking(task_id: str) -> Dict:
    """
    非阻塞轮询（单次检查）

    Returns:
        {
            "status": "completed"|"processing"|"failed"|"unknown",
            "video_url": "...",
            "progress": 50,
        }
    """
    task = _tasks.get(task_id)
    if not task:
        return {"status": "unknown", "error": "未找到该任务"}

    # 已完成直接返回
    if task.get("status") == "completed" and task.get("video_url"):
        return {
            "status": "completed",
            "video_url": task["video_url"],
            "progress": 100,
        }

    host = task["host"]
    api_key = task["api_key"]
    ep = task["endpoint"]

    url = f"{host}{ep}/{task_id}"
    resp, _ = http_get(url, api_key)

    if "_error" in resp:
        return {"status": "processing", "progress": task.get("progress", 0)}

    status = _extract_status(resp)
    video_url = _extract_video_url(resp)
    progress = _extract_progress(resp)

    task["status"] = status
    if video_url:
        task["video_url"] = video_url
    task["progress"] = progress
    _save_tasks()

    result = {
        "status": status,
        "progress": progress,
        "video_url": video_url,
    }
    if status == "failed":
        result["error"] = resp.get("error", {}).get("message", resp.get("message", "生成失败"))

    return result

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑥ 模拟模式
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_mock(provider_key: str, prompt: str, idx: int) -> Dict:
    """生成模拟数据"""
    pinfo = PROVIDERS.get(provider_key, {"name": provider_key, "icon": "🎬"})
    return {
        "provider": provider_key,
        "provider_name": pinfo["name"],
        "prompt": prompt,
        "task_id": f"sora2_{provider_key}_{idx:04d}_{int(time.time())}",
        "status": "pending",
        "video_url": "",
        "progress": 0,
        "generate_time": TIMESTAMP,
        "note": "模拟数据，等待 5 秒后轮询状态",
    }

def poll_mock(task_id: str, call_count: int) -> Dict:
    """模拟轮询状态"""
    # 模拟：前 3 次返回 processing，第 4 次返回 completed
    if call_count < 3:
        return {
            "status": "processing",
            "progress": min(call_count * 30, 90),
            "video_url": "",
        }
    else:
        return {
            "status": "completed",
            "progress": 100,
            "video_url": f"https://mock.example.com/sora2/video_{call_count}.mp4",
        }

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑦ 命令行工具
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def show_status():
    """显示各服务商配置状态"""
    print("\n🎬 Sora2 视频生成配置状态\n")
    config = _load_sora_config()
    providers = config.get("providers", SORA_DEFAULT_PROVIDERS)

    for pk, p in providers.items():
        pinfo = PROVIDERS.get(pk, {})
        ready = bool(p.get("apiKey"))
        tag = "✅" if ready else "⚠️"
        print(f"  {pinfo.get('icon', '🎬')} {pinfo.get('name', p.get('name', pk))}")
        print(f"     Host: {p['host']}")
        print(f"     Key:  {p['apiKey'][:8]}...{p['apiKey'][-4:]}")
        print(f"     状态: {tag} {'已配置' if ready else '未配置'}")
        print(f"     说明: {pinfo.get('note', '-')}")
        print()

def interactive_generate():
    """交互式生成视频"""
    print("\n🎬 Sora2 视频生成器\n")
    show_status()

    config = _load_sora_config()
    providers = config.get("providers", SORA_DEFAULT_PROVIDERS)

    # 选择服务商
    provider_keys = list(providers.keys())
    print("请选择服务商:")
    for i, pk in enumerate(provider_keys):
        pinfo = PROVIDERS.get(pk, {})
        print(f"  [{i+1}] {pinfo.get('icon', '🎬')} {pinfo.get('name', p.get('name', pk))}")
    print(f"  [a] 全部服务商")

    choice = input("\n选择 (输入数字或 a): ").strip().lower()
    if choice == 'a':
        selected = provider_keys
    else:
        try:
            idx = int(choice) - 1
            selected = [provider_keys[idx]] if 0 <= idx < len(provider_keys) else provider_keys[:1]
        except (ValueError, IndexError):
            selected = provider_keys[:1]

    # 输入提示词
    prompt = input("\n请输入视频描述 (Prompt): ").strip()
    if not prompt:
        print("❌ 提示词不能为空")
        return

    duration = input("视频时长 (秒，默认 5): ").strip()
    duration = int(duration) if duration.isdigit() else 5

    # 开始生成
    print(f"\n📤 开始生成视频 | 服务商：{', '.join(selected)} | 时长：{duration}s\n")

    results = []
    for pk in selected:
        pinfo = PROVIDERS.get(pk, {})
        print(f"  {pinfo.get('icon', '🎬')} {pinfo.get('name', p.get('name', pk))}...")

        result = sora2_generate(prompt, provider_key=pk, duration=duration)

        if result["status"] == "error":
            print(f"    ❌ 错误：{result.get('error', '未知错误')}")
            results.append(result)
            continue

        print(f"    ✅ 已提交 | task_id: {result['task_id'][:30]}...")

        # 轮询状态
        print(f"    正在轮询状态...", end="")
        poll_result = sora2_poll_status(result["task_id"], timeout=300, interval=10)

        if poll_result["status"] == "completed":
            print(f"\n    ✅ 生成完成!")
            print(f"    🎬 视频链接：{poll_result['video_url']}")
            result["status"] = "completed"
            result["video_url"] = poll_result["video_url"]
        elif poll_result["status"] == "failed":
            print(f"\n    ❌ 生成失败：{poll_result.get('error', '未知错误')}")
            result["status"] = "failed"
            result["error"] = poll_result.get("error")
        else:
            print(f"\n    ⏱️ 超时/未完成，稍后可用 task_id 继续查询")

        results.append({**result, **poll_result})

    # 保存结果
    out_file = os.path.join(DATA_DIR, f"sora2_result_{int(time.time())}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n💾 结果已保存：{out_file}")

def main():
    _load_tasks()  # 加载之前的任务

    parser = argparse.ArgumentParser(description="Sora2 多平台视频生成器", formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--provider", type=str, default="grsai",
                        help="服务商 key，多个用逗号分隔 (默认：grsai)")
    parser.add_argument("--prompt", type=str, help="视频描述提示词")
    parser.add_argument("--duration", type=int, default=5, help="视频时长秒数 (默认：5)")
    parser.add_argument("--size", type=str, default="720x1280", help="视频尺寸 (默认：720x1280 竖屏)")
    parser.add_argument("--mock", action="store_true", help="模拟模式")
    parser.add_argument("--status", action="store_true", help="显示配置状态")
    parser.add_argument("--poll", type=str, help="轮询指定 task_id 的状态")
    parser.add_argument("--interactive", "-i", action="store_true", help="交互式模式")
    parser.add_argument("-o", "--output", type=str, help="输出 JSON 路径")

    args = parser.parse_args()

    if args.status:
        show_status()
        return

    if args.poll:
        result = sora2_poll_status_non_blocking(args.poll)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if args.interactive:
        interactive_generate()
        return

    # 解析服务商列表
    providers = [p.strip() for p in args.provider.split(",")]
    for p in providers:
        if p not in SORA_DEFAULT_PROVIDERS:
            print(f"⚠️ 未知服务商：{p}")

    # 提示词
    prompt = args.prompt
    if not prompt:
        print("❌ 请提供 --prompt 或使用 --interactive 交互式模式")
        return

    # 生成
    if args.mock:
        result = generate_mock(providers[0], prompt, 1)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        results = []
        for pk in providers:
            result = sora2_generate(prompt, provider_key=pk, duration=args.duration, size=args.size)
            results.append(result)

        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
        else:
            print(json.dumps(results, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
