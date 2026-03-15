#!/usr/bin/env python3
"""
🎬 多平台视频生成器 - 四合一
支持: 可灵(Kling) / 即梦(Jimeng) / Sora / Seedance

用法:
  python3 video_generator.py --mock                         # 模拟所有平台
  python3 video_generator.py --provider kling --mock        # 模拟可灵
  python3 video_generator.py --provider kling               # 真实调用可灵
  python3 video_generator.py --provider sora,seedance       # 多平台同时生成
  python3 video_generator.py --prompt-only                  # 只预览 Prompt
  python3 video_generator.py --status                       # 查看各平台配置状态
  python3 video_generator.py -n 3 --download               # 生成并下载视频

API Key 配置（环境变量 或 直接修改下方 KEYS）:
  export KLING_ACCESS_KEY=xxx
  export KLING_SECRET_KEY=xxx
  export JIMENG_API_KEY=xxx
  export OPENAI_API_KEY=xxx
  export SEEDANCE_API_KEY=xxx
"""
import json, os, sys, time, re, argparse, hmac, hashlib, base64
from datetime import datetime

TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
TODAY     = datetime.now().strftime("%Y年%m月%d日")
DATA_DIR  = os.path.join(os.path.dirname(__file__), "..", "data")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ① API KEY 配置（优先读环境变量，其次用下方默认值）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEYS = {
    # 可灵 (Kling) ── 快手
    # 申请: https://app.klingai.com/global/dev/document-api
    "kling_access_key": os.environ.get("KLING_ACCESS_KEY", "AJNfFHbNgFtPMHmn3TffHbpHJteNFHpf"),
    "kling_secret_key": os.environ.get("KLING_SECRET_KEY", "MTNtHkTh3494d9GQp8BbyLn8LdyP3Qpg"),

    # 即梦 (Jimeng) ── 字节跳动 / 火山引擎
    # 申请: https://www.volcengine.com/product/jimeng
    "jimeng_api_key":   os.environ.get("JIMENG_API_KEY",   ""),   # ← 填入 API Key

    # Sora ── OpenAI
    # 申请: https://platform.openai.com (需邀请资格)
    "openai_api_key":   os.environ.get("OPENAI_API_KEY",   ""),   # ← 填入 OpenAI Key

    # Seedance ── 字节跳动 Seed 团队
    # 官方 API 尚未公开，目前通过中转: https://platform.seedance.ai 或火山引擎
    "seedance_api_key": os.environ.get("SEEDANCE_API_KEY", ""),   # ← 填入 Seedance Key
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ② 平台元信息
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROVIDERS = {
    "kling": {
        "name":      "可灵 (Kling)",
        "icon":      "🎬",
        "color":     "#FF6B35",
        "vendor":    "快手",
        "model":     "kling-v2-master",           # 也可用 kling-v1.6
        "base_url":  "https://api.klingai.com",
        "ready":     lambda: bool(KEYS["kling_access_key"] and KEYS["kling_secret_key"]),
        "key_hint":  "需要 KLING_ACCESS_KEY + KLING_SECRET_KEY",
        "apply_url": "https://app.klingai.com/global/dev/document-api",
        "max_dur":   10,
        "note":      "国内最强文生视频，效果极好，有免费额度",
    },
    "jimeng": {
        "name":      "即梦 (Jimeng)",
        "icon":      "✨",
        "color":     "#7B61FF",
        "vendor":    "字节跳动",
        "model":     "JimengVGFMT2VL20",
        "base_url":  "https://visual.volcengineapi.com",
        "ready":     lambda: bool(KEYS["jimeng_api_key"]),
        "key_hint":  "需要 JIMENG_API_KEY（火山引擎）",
        "apply_url": "https://www.volcengine.com/product/jimeng",
        "max_dur":   15,
        "note":      "字节出品，官方 API 内测中，需申请白名单",
    },
    "sora": {
        "name":      "Sora",
        "icon":      "🌀",
        "color":     "#00C9A7",
        "vendor":    "OpenAI",
        "model":     "sora-2",                     # 也可用 sora-2-pro
        "base_url":  "https://api.openai.com/v1",
        "ready":     lambda: bool(KEYS["openai_api_key"]),
        "key_hint":  "需要 OPENAI_API_KEY（需邀请资格）",
        "apply_url": "https://platform.openai.com",
        "max_dur":   20,
        "note":      "OpenAI 出品，效果顶级，需邀请资格，价格较高",
    },
    "seedance": {
        "name":      "Seedance",
        "icon":      "🌱",
        "color":     "#FFB300",
        "vendor":    "字节跳动 Seed",
        "model":     "seedance-2.0",               # 或 seedance-1.5-pro
        "base_url":  "https://api.seedance.ai/v1", # 官方 API 待公开，以实际为准
        "ready":     lambda: bool(KEYS["seedance_api_key"]),
        "key_hint":  "需要 SEEDANCE_API_KEY",
        "apply_url": "https://platform.seedance.ai",
        "max_dur":   15,
        "note":      "字节 Seed 团队，支持文/图/音频多模态，官方 API 即将开放",
    },
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ③ JWT 工具（无需第三方库）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def _b64url(data):
    if isinstance(data, str): data = data.encode()
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_jwt(access_key: str, secret_key: str) -> str:
    """生成 Kling 认证 JWT (HS256)，无需第三方库"""
    now     = int(time.time())
    header  = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")))
    payload = _b64url(json.dumps({"iss": access_key, "exp": now + 1800, "nbf": now - 5}, separators=(",", ":")))
    msg     = f"{header}.{payload}".encode()
    sig     = _b64url(hmac.new(secret_key.encode(), msg, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ④ HTTP 工具
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def http_post(url, body: dict, headers: dict, timeout=30):
    import urllib.request, urllib.error
    data = json.dumps(body).encode("utf-8")
    req  = urllib.request.Request(url, data=data, headers={**headers, "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode()), r.status
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:400]
        return {"_error": f"HTTP {e.code}: {err}"}, e.code

def http_get(url, headers: dict, timeout=20):
    import urllib.request, urllib.error
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode()), r.status
    except urllib.error.HTTPError as e:
        return {"_error": f"HTTP {e.code}: {e.read().decode()[:200]}"}, e.code

def download_file(url: str, path: str) -> bool:
    import urllib.request
    try:
        urllib.request.urlretrieve(url, path)
        return True
    except Exception as ex:
        print(f"  ✗ 下载失败: {ex}", file=sys.stderr)
        return False

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑤ Prompt 生成（脚本 → 视频描述）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE_VISUAL = {
    "干货知识": "信息图动画，简洁白底，文字弹出，专业图表，高清竖屏",
    "情感共鸣": "电影感，暖色调，自然光，真实人物，情绪饱满",
    "娱乐搞笑": "快节奏剪辑，卡通元素，夸张表情，弹幕字幕飞过",
    "新闻资讯": "新闻播报风格，主播台，字幕下方滚动，专业感",
    "激情励志": "宏观航拍，快切镜头，金色光晕，运动员动作",
    "生活vlog": "手持摄影，自然光，第一视角，生活真实场景",
}

def script_to_prompt(script: dict, provider: str = "kling") -> str:
    title    = script.get("title", "")
    style    = script.get("style", "")
    category = script.get("category", "")
    platform = script.get("platform_target", "抖音")
    segs     = script.get("segments", [])
    visuals  = [s.get("visual", "") for s in segs if s.get("visual")][:3]
    visual_base = STYLE_VISUAL.get(style, "竖屏短视频，现代感，高清画质")
    scene       = "；".join(visuals) if visuals else f"{title}相关场景"

    if provider == "sora":
        # Sora 支持英文 Prompt，效果更好
        style_en = {"干货知识":"infographic animation style","情感共鸣":"cinematic warm tones",
                    "娱乐搞笑":"fast-cut funny meme style","新闻资讯":"news broadcast style"}.get(style, "modern short-form video")
        return (f"{style_en}, vertical 9:16 format, {category} content about '{title}', "
                f"scene: {scene[:100]}, suitable for {platform}, vivid colors, "
                f"5 seconds, professional quality, no text overlay")[:500]
    else:
        return (f"{visual_base}。主题：{title}。"
                f"场景：{scene[:150]}。"
                f"竖版9:16，适合{platform}平台，{category}内容，"
                f"时长5秒，画面流畅有吸引力。")[:400]

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑥ 各平台实现
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ── 可灵 (Kling) ──────────────────────────────────────────────────────────────
def kling_generate(prompt: str, duration: int = 5) -> dict:
    jwt_token = make_jwt(KEYS["kling_access_key"], KEYS["kling_secret_key"])
    headers   = {"Authorization": f"Bearer {jwt_token}"}
    url       = f"{PROVIDERS['kling']['base_url']}/v1/videos/text2video"
    body      = {
        "model":           PROVIDERS["kling"]["model"],
        "prompt":          prompt,
        "aspect_ratio":    "9:16",
        "duration":        min(duration, 10),
        "negative_prompt": "模糊,低质量,水印,变形",
        "cfg_scale":       0.5,
    }
    resp, code = http_post(url, body, headers)
    if "_error" in resp:
        return {"status": "error", "error": resp["_error"]}
    task_id = resp.get("data", {}).get("task_id", "")
    if not task_id:
        return {"status": "error", "error": f"无 task_id: {resp}"}
    return {"status": "pending", "task_id": task_id}

def kling_poll(task_id: str, timeout: int = 900) -> dict:
    jwt_token = make_jwt(KEYS["kling_access_key"], KEYS["kling_secret_key"])
    headers   = {"Authorization": f"Bearer {jwt_token}"}
    url       = f"{PROVIDERS['kling']['base_url']}/v1/videos/text2video/{task_id}"
    start     = time.time()
    while time.time() - start < timeout:
        resp, _ = http_get(url, headers)
        if "_error" in resp:
            return {"status": "error", "error": resp["_error"]}
        status = resp.get("data", {}).get("task_status", "")
        if status == "succeed":
            videos = resp.get("data", {}).get("task_result", {}).get("videos", [])
            url_v  = videos[0].get("url", "") if videos else ""
            return {"status": "succeeded", "video_url": url_v}
        if status == "failed":
            return {"status": "error", "error": resp.get("data", {}).get("task_status_msg", "failed")}
        elapsed = int(time.time() - start)
        print(f"    ⏳ Kling: {status} ({elapsed}s)...", end="\r")
        time.sleep(8)
    return {"status": "error", "error": "timeout"}

# ── 即梦 (Jimeng) ──────────────────────────────────────────────────────────────
def jimeng_generate(prompt: str, duration: int = 5) -> dict:
    headers = {"Authorization": f"Bearer {KEYS['jimeng_api_key']}"}
    url     = (f"{PROVIDERS['jimeng']['base_url']}/"
               f"?Action=CVSync2AsyncSubmitTask&Version=2022-08-31")
    body    = {
        "req_key":     "jimeng_video_generation",
        "prompt":      prompt,
        "model":       PROVIDERS["jimeng"]["model"],
        "duration":    min(duration, 15),
        "resolution":  "720p",
        "aspect_ratio":"9:16",
    }
    resp, code = http_post(url, body, headers)
    if "_error" in resp:
        return {"status": "error", "error": resp["_error"]}
    job_id = resp.get("data", {}).get("job_id", "") or resp.get("job_id", "")
    if not job_id:
        return {"status": "error", "error": f"无 job_id: {resp}"}
    return {"status": "pending", "task_id": job_id}

def jimeng_poll(job_id: str, timeout: int = 600) -> dict:
    headers = {"Authorization": f"Bearer {KEYS['jimeng_api_key']}"}
    url     = (f"{PROVIDERS['jimeng']['base_url']}/"
               f"?Action=CVSync2AsyncGetResult&Version=2022-08-31&job_id={job_id}")
    start   = time.time()
    while time.time() - start < timeout:
        resp, _ = http_get(url, headers)
        if "_error" in resp:
            return {"status": "error", "error": resp["_error"]}
        status  = resp.get("data", {}).get("status", "") or resp.get("status", "")
        if status in ("completed", "succeed"):
            video_url = (resp.get("data", {}).get("video_url", "")
                         or resp.get("data", {}).get("url", ""))
            return {"status": "succeeded", "video_url": video_url}
        if status in ("error", "failed"):
            return {"status": "error", "error": resp.get("data", {}).get("message", "failed")}
        elapsed = int(time.time() - start)
        print(f"    ⏳ Jimeng: {status} ({elapsed}s)...", end="\r")
        time.sleep(5)
    return {"status": "error", "error": "timeout"}

# ── Sora (OpenAI) ──────────────────────────────────────────────────────────────
def sora_generate(prompt: str, duration: int = 5) -> dict:
    headers = {"Authorization": f"Bearer {KEYS['openai_api_key']}"}
    url     = f"{PROVIDERS['sora']['base_url']}/videos"
    body    = {
        "model":   PROVIDERS["sora"]["model"],
        "prompt":  prompt,
        "size":    "720x1280",       # 竖屏 9:16
        "seconds": min(duration, 20),
        "quality": "standard",
    }
    resp, code = http_post(url, body, headers)
    if "_error" in resp:
        return {"status": "error", "error": resp["_error"]}
    video_id = resp.get("id", "")
    status   = resp.get("status", "")
    if not video_id:
        return {"status": "error", "error": f"无 video_id: {resp}"}
    if status == "completed":
        return {"status": "succeeded", "video_url": resp.get("url", "")}
    return {"status": "pending", "task_id": video_id}

def sora_poll(video_id: str, timeout: int = 600) -> dict:
    headers = {"Authorization": f"Bearer {KEYS['openai_api_key']}"}
    url     = f"{PROVIDERS['sora']['base_url']}/videos/{video_id}"
    start   = time.time()
    while time.time() - start < timeout:
        resp, _ = http_get(url, headers)
        if "_error" in resp:
            return {"status": "error", "error": resp["_error"]}
        status = resp.get("status", "")
        if status == "completed":
            return {"status": "succeeded", "video_url": resp.get("url", "")}
        if status == "error":
            return {"status": "error", "error": resp.get("error", {}).get("message", "failed")}
        elapsed = int(time.time() - start)
        print(f"    ⏳ Sora: {status} ({elapsed}s)...", end="\r")
        time.sleep(10)
    return {"status": "error", "error": "timeout"}

# ── Seedance (ByteDance Seed) ──────────────────────────────────────────────────
def seedance_generate(prompt: str, duration: int = 5) -> dict:
    headers = {"Authorization": f"Bearer {KEYS['seedance_api_key']}"}
    url     = f"{PROVIDERS['seedance']['base_url']}/video/generations"
    body    = {
        "model":        PROVIDERS["seedance"]["model"],
        "prompt":       prompt,
        "duration":     min(duration, 15),
        "resolution":   "720p",
        "aspect_ratio": "9:16",
        "audio":        False,
    }
    resp, code = http_post(url, body, headers)
    if "_error" in resp:
        return {"status": "error", "error": resp["_error"]}
    task_id = resp.get("id", "") or resp.get("task_id", "")
    if not task_id:
        return {"status": "error", "error": f"无 task_id: {resp}"}
    return {"status": "pending", "task_id": task_id}

def seedance_poll(task_id: str, timeout: int = 600) -> dict:
    headers = {"Authorization": f"Bearer {KEYS['seedance_api_key']}"}
    url     = f"{PROVIDERS['seedance']['base_url']}/video/generations/{task_id}"
    start   = time.time()
    while time.time() - start < timeout:
        resp, _ = http_get(url, headers)
        if "_error" in resp:
            return {"status": "error", "error": resp["_error"]}
        status = resp.get("status", "")
        if status == "completed":
            video_url = resp.get("video_url", "") or resp.get("url", "")
            return {"status": "succeeded", "video_url": video_url}
        if status in ("error", "failed"):
            return {"status": "error", "error": resp.get("message", "failed")}
        elapsed = int(time.time() - start)
        pct     = resp.get("progress", "")
        print(f"    ⏳ Seedance: {status}{' '+str(pct)+'%' if pct else ''} ({elapsed}s)...", end="\r")
        time.sleep(5)
    return {"status": "error", "error": "timeout"}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑦ 统一调用接口
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATE_FN = {"kling": kling_generate, "jimeng": jimeng_generate,
               "sora": sora_generate, "seedance": seedance_generate}
POLL_FN     = {"kling": kling_poll, "jimeng": jimeng_poll,
               "sora": sora_poll, "seedance": seedance_poll}

def generate_one(provider: str, script: dict, duration=5, download=False) -> dict:
    """对单个脚本调用指定平台生成视频"""
    pinfo  = PROVIDERS[provider]
    prompt = script_to_prompt(script, provider)
    base   = {
        "provider":     provider,
        "provider_name":pinfo["name"],
        "script_title": script.get("title", ""),
        "topic":        script.get("topic", ""),
        "platform":     script.get("platform_target", ""),
        "prompt":       prompt,
        "model":        pinfo["model"],
        "generate_time":TIMESTAMP,
    }
    # 提交任务
    result = GENERATE_FN[provider](prompt, duration)
    if result["status"] == "error":
        return {**base, **result}
    if result["status"] == "succeeded":          # Sora 同步情况
        video_url = result.get("video_url", "")
        local_path = _maybe_download(video_url, provider, download)
        return {**base, **result, "local_path": local_path}

    # 轮询
    task_id = result.get("task_id", "")
    print(f"    📋 task_id: {task_id}")
    poll_result = POLL_FN[provider](task_id)
    video_url   = poll_result.get("video_url", "")
    local_path  = _maybe_download(video_url, provider, download) if poll_result["status"] == "succeeded" else ""
    return {**base, **poll_result, "task_id": task_id, "local_path": local_path}

def _maybe_download(url: str, provider: str, do_download: bool) -> str:
    if not do_download or not url:
        return ""
    video_dir = os.path.join(DATA_DIR, "videos")
    os.makedirs(video_dir, exist_ok=True)
    path = os.path.join(video_dir, f"{provider}_{int(time.time())}.mp4")
    if download_file(url, path):
        print(f"    💾 已下载: {path}")
        return path
    return ""

# ── 模拟数据 ──────────────────────────────────────────────────────────────────
def generate_mock(provider: str, script: dict, idx: int) -> dict:
    pinfo = PROVIDERS[provider]
    return {
        "provider":      provider,
        "provider_name": pinfo["name"],
        "script_title":  script.get("title", ""),
        "topic":         script.get("topic", ""),
        "platform":      script.get("platform_target", "抖音"),
        "prompt":        script_to_prompt(script, provider),
        "model":         pinfo["model"],
        "task_id":       f"mock_{provider}_{idx:04d}_{int(time.time())}",
        "status":        "succeeded",
        "video_url":     f"https://mock.example.com/{provider}/video_{idx:04d}.mp4",
        "local_path":    "",
        "duration_s":    5,
        "size":          "720x1280",
        "generate_time": TIMESTAMP,
        "cost_note":     "模拟数据，未实际生成",
    }

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑧ 批量生成
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_videos(scripts: list, providers: list, mock=False, download=False, duration=5) -> list:
    print(f"\n🎬 视频生成 | {'模拟' if mock else '真实'} | 平台: {', '.join(PROVIDERS[p]['name'] for p in providers)} | {len(scripts)} 个脚本\n")
    results = []
    for i, script in enumerate(scripts, 1):
        title = script.get("title", "")[:28]
        print(f"  [{i:02d}/{len(scripts)}] 《{title}》")
        for provider in providers:
            pinfo = PROVIDERS[provider]
            print(f"    {pinfo['icon']} {pinfo['name']}...", end=" ", flush=True)
            t0 = time.time()
            if mock:
                time.sleep(0.2)
                r = generate_mock(provider, script, i)
                print(f"✓ 模拟完成")
            elif not pinfo["ready"]():
                r = {"provider": provider, "provider_name": pinfo["name"],
                     "script_title": title, "status": "skipped",
                     "reason": f"Key 未配置: {pinfo['key_hint']}"}
                print(f"⚠ Key 未配置，跳过")
            else:
                try:
                    r = generate_one(provider, script, duration, download)
                    dt = time.time() - t0
                    if r["status"] == "succeeded":
                        print(f"✓ 完成 ({dt:.0f}s)")
                    else:
                        print(f"✗ {r.get('error', '失败')} ({dt:.0f}s)")
                except Exception as ex:
                    r = {"provider": provider, "status": "error", "error": str(ex), "script_title": title}
                    print(f"✗ 异常: {ex}")
            results.append(r)
        if not mock and i < len(scripts):
            time.sleep(1)
    ok = sum(1 for r in results if r.get("status") == "succeeded")
    print(f"\n📊 完成: {ok}/{len(results)} 条成功")
    return results

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑨ 状态检查 & Prompt 预览
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def show_status():
    print("\n🎬 视频生成平台配置状态\n")
    for pk, p in PROVIDERS.items():
        ready = p["ready"]()
        tag   = "✅ 已配置" if ready else "⚙️  待配置"
        print(f"  {p['icon']} {p['name']} [{p['vendor']}]")
        print(f"     状态: {tag}")
        print(f"     模型: {p['model']}")
        print(f"     说明: {p['note']}")
        if not ready:
            print(f"     配置: {p['key_hint']}")
            print(f"     申请: {p['apply_url']}")
        print()

def preview_prompts(scripts: list, providers: list):
    print(f"\n📝 视频 Prompt 预览\n")
    for i, s in enumerate(scripts, 1):
        print(f"  [{i}] 《{s.get('title','')}》")
        for pk in providers:
            p = script_to_prompt(s, pk)
            print(f"    {PROVIDERS[pk]['icon']} {PROVIDERS[pk]['name']}: {p[:100]}...")
        print()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⑩ main
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def main():
    ap = argparse.ArgumentParser(description="多平台视频生成（可灵/即梦/Sora/Seedance）")
    ap.add_argument("--provider",    type=str, default="kling",  help="平台: kling,jimeng,sora,seedance 或逗号分隔多个（默认kling）")
    ap.add_argument("-i","--input",  type=str,                   help="脚本JSON（默认 data/latest_scripts.json）")
    ap.add_argument("--topic",       type=str,                   help="直接输入话题文字")
    ap.add_argument("-n",            type=int, default=3,        help="最多处理脚本数（默认3）")
    ap.add_argument("--duration",    type=int, default=5,        help="视频时长秒数（默认5）")
    ap.add_argument("--mock",        action="store_true",        help="模拟模式（不调用API）")
    ap.add_argument("--prompt-only", action="store_true",        help="只预览Prompt，不生成")
    ap.add_argument("--download",    action="store_true",        help="下载生成的视频到本地")
    ap.add_argument("--status",      action="store_true",        help="查看各平台配置状态")
    ap.add_argument("-o","--output", type=str,                   help="输出JSON路径")
    a = ap.parse_args()

    if a.status:
        show_status(); return

    os.makedirs(DATA_DIR, exist_ok=True)

    # 解析 provider
    providers = [p.strip() for p in a.provider.split(",")]
    for p in providers:
        if p not in PROVIDERS:
            print(f"⚠ 未知平台: {p}，可选: {', '.join(PROVIDERS.keys())}"); sys.exit(1)

    # 加载脚本
    if a.topic:
        scripts = [{"title": a.topic, "topic": a.topic, "hook": "", "style": "干货知识",
                    "category": "其他", "platform_target": "抖音", "segments": []}]
    else:
        inp = a.input or os.path.join(DATA_DIR, "latest_scripts.json")
        if not os.path.exists(inp):
            print(f"⚠ 找不到脚本文件: {inp}\n  先运行: python3 scripts/script_generator.py --mock")
            sys.exit(1)
        with open(inp, encoding="utf-8") as f:
            scripts = json.load(f)
    scripts = scripts[:a.n]

    if a.prompt_only:
        preview_prompts(scripts, providers); return

    results = generate_videos(scripts, providers, mock=a.mock, download=a.download, duration=a.duration)

    ts  = datetime.now().strftime("%Y%m%d_%H%M")
    out = a.output or os.path.join(DATA_DIR, f"videos_{ts}.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    with open(os.path.join(DATA_DIR, "latest_videos.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"💾 JSON: {out}")

if __name__ == "__main__":
    main()
