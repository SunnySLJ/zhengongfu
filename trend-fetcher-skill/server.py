#!/usr/bin/env python3
"""
AutoPipeline API Server (纯后端 API，前端由 saas-app 提供)
用法: python3 server.py
"""
import json, os, sys, subprocess, threading, time, queue
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from datetime import datetime
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts"))

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ─── Sora 视频生成配置 ──────────────────────────────────────────────────────────
SORA_CONFIG_FILE = os.path.join(DATA_DIR, "sora_config.json")
SORA_TASKS_FILE = os.path.join(DATA_DIR, "sora2_tasks.json")
_sora_tasks = {}  # task_id -> {host, apiKey, endpoint, status, created, video_url, ...}

# 后台轮询配置
_sora_poll_interval = 10  # 轮询间隔（秒）
_sora_poll_timeout = 600  # 超时时间（秒）
_sora_poll_thread = None
_sora_poll_stop = threading.Event()

def _save_sora_tasks():
    """保存任务到文件"""
    try:
        # 清理过期任务（超过 1 小时）
        now = time.time()
        tasks_to_save = {}
        for tid, task in _sora_tasks.items():
            if now - task.get("created", 0) < 3600:
                tasks_to_save[tid] = task
        with open(SORA_TASKS_FILE, 'w', encoding='utf-8') as f:
            json.dump(tasks_to_save, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def _load_sora_tasks():
    """从文件加载任务"""
    global _sora_tasks
    if os.path.exists(SORA_TASKS_FILE):
        try:
            with open(SORA_TASKS_FILE, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
            # 只加载 1 小时内的任务
            now = time.time()
            _sora_tasks = {tid: t for tid, t in loaded.items() if now - t.get("created", 0) < 3600}
        except Exception:
            pass

def _poll_sora_tasks_bg():
    """后台轮询线程：定期查询所有进行中的任务"""
    while not _sora_poll_stop.is_set():
        try:
            # 复制一份任务 ID 列表，避免遍历中修改
            task_ids = list(_sora_tasks.keys())
            for tid in task_ids:
                task = _sora_tasks.get(tid)
                if not task:
                    continue
                # 只处理进行中的任务
                if task.get("status") not in ("processing", "pending"):
                    continue
                # 检查是否超时
                if time.time() - task.get("created", 0) > _sora_poll_timeout:
                    task["status"] = "timeout"
                    task["error"] = f"等待超时（>{_sora_poll_timeout}s）"
                    continue
                # 查询状态
                try:
                    result = zgf_video_status(tid)
                    if result.get("status") == "completed" and result.get("video_url"):
                        print(f"[Sora2] 任务完成：{tid[:20]}...")
                except Exception:
                    pass  # 继续轮询
            _save_sora_tasks()
        except Exception:
            pass
        _sora_poll_stop.wait(_sora_poll_interval)

def _start_sora_poll():
    """启动后台轮询线程"""
    global _sora_poll_thread, _sora_poll_stop
    _sora_poll_stop = threading.Event()
    _sora_poll_thread = threading.Thread(target=_poll_sora_tasks_bg, daemon=True)
    _sora_poll_thread.start()
    print("[Sora2] 后台轮询线程已启动")

SORA_DEFAULT_PROVIDERS = {
    "n1n":  {"name": "N1N AI", "host": "https://api.n1n.ai", "apiKey": "sk-qC6USEddOpJENPWyBZKNR6xTU7FcaM8pjAJAVBZtWeP4n4DI"},
}

def _load_sora_config():
    if os.path.exists(SORA_CONFIG_FILE):
        try:
            with open(SORA_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {"provider": "n1n", "providers": dict(SORA_DEFAULT_PROVIDERS)}

def _save_sora_config(config):
    with open(SORA_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

# ─── 热点分析缓存 (TTL=1小时) ──────────────────────────────────────────────────
_analyze_cache = {}          # topic_key -> (result_dict, expire_ts)
_analyze_cache_lock = threading.Lock()
ANALYZE_TTL = 3600           # 秒

def _cache_get(key):
    with _analyze_cache_lock:
        entry = _analyze_cache.get(key)
        if entry and time.time() < entry[1]:
            return entry[0]
        if entry:
            del _analyze_cache[key]
    return None

def _cache_set(key, value):
    with _analyze_cache_lock:
        _analyze_cache[key] = (value, time.time() + ANALYZE_TTL)

# ─── 抖音热点缓存 (TTL=10分钟) ──────────────────────────────────────────────────
_douyin_cache = {"data": None, "expire": 0}
_douyin_lock = threading.Lock()

QWEN_API_KEY = "sk-sp-432aa1b7751a4fea8e6425131ed89eb4"
QWEN_API_URL = "https://coding.dashscope.aliyuncs.com/v1/chat/completions"
QWEN_MODEL   = "qwen3-coder-plus"

# 豆包 API（火山引擎 ARK）
DOUBAO_API_KEY     = "6f876e44-60d3-4a87-8669-44d2f809b12e"
DOUBAO_BASE_URL    = "https://ark.cn-beijing.volces.com/api/v3"
DOUBAO_MODEL       = "doubao-1-5-pro-32k-250115"

def _call_qwen(messages, temperature=0.7, max_tokens=4000):
    """统一的千问 API 调用"""
    import urllib.request, urllib.error
    body = json.dumps({
        "model": QWEN_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode("utf-8")
    req = urllib.request.Request(QWEN_API_URL, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {QWEN_API_KEY}",
    }, method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]

def _call_doubao(messages, temperature=0.7, max_tokens=4000):
    """豆包 API 调用"""
    import urllib.request, urllib.error
    body = json.dumps({
        "model": DOUBAO_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode("utf-8")
    req = urllib.request.Request(f"{DOUBAO_BASE_URL}/chat/completions", data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DOUBAO_API_KEY}",
    }, method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]

def _parse_json(raw, bracket="["):
    """从 AI 返回文本中提取 JSON"""
    import re
    c = re.sub(r'```(?:json)?\s*', '', raw.strip()).strip()
    open_b, close_b = (("[", "]") if bracket == "[" else ("{", "}"))
    s, e = c.find(open_b), c.rfind(close_b)
    if s >= 0 and e > s:
        try:
            return json.loads(c[s:e+1])
        except Exception:
            pass
    return None

def fetch_douyin_trends_api():
    """调用千问 API 获取抖音热搜，含视频链接和封面图"""
    import urllib.parse

    with _douyin_lock:
        if _douyin_cache["data"] and time.time() < _douyin_cache["expire"]:
            return _douyin_cache["data"]

    today = datetime.now().strftime("%Y年%m月%d日")
    prompt = (
        f"请列出抖音今天({today})的热搜榜/热点榜前20条。\n"
        "要求：\n"
        "1. 每条包含：排名、话题标题（不要带#号）、热度播放量、分类、一句话描述、"
        "一个相关的抖音视频链接(格式如 https://www.douyin.com/video/xxxx，编一个合理的ID)、"
        "一个封面图URL(使用 https://picsum.photos/seed/话题关键词/400/300 格式生成)\n"
        "2. 标题中不要包含#符号，直接写话题名称即可\n"
        "严格返回JSON数组（只返回JSON，不要markdown代码块和任何其他文字）：\n"
        '[{"rank":1,"title":"话题标题","heat":"4523万播放","category":"社会",'
        '"desc":"一句话描述","video_url":"https://www.douyin.com/video/7xxxxxxxxxxxx",'
        '"cover":"https://picsum.photos/seed/keyword/400/300"}]\n'
        "category可选: 科技/娱乐/社会/财经/体育/政策/生活/教育/国际/美食/时尚/其他"
    )

    try:
        raw = _call_qwen([
            {"role": "system", "content": "你是抖音热点数据分析师。只返回纯JSON数组，不要markdown代码块和任何其他文字。"},
            {"role": "user", "content": prompt}
        ])
    except Exception as e:
        return {"error": str(e), "trends": []}

    arr = _parse_json(raw, "[")
    if isinstance(arr, list):
        trends = []
        for i, item in enumerate(arr[:20]):
            title = str(item.get("title", "")).strip().replace("#", "").strip()
            if not title:
                continue
            # 生成封面图（基于标题的 hash seed）
            import hashlib
            seed = hashlib.md5(title.encode()).hexdigest()[:8]
            cover = item.get("cover", "") or f"https://picsum.photos/seed/{seed}/400/300"
            video_url = item.get("video_url", "") or f"https://www.douyin.com/search/{urllib.parse.quote(title)}"
            trends.append({
                "rank": item.get("rank", i + 1),
                "title": title,
                "heat": str(item.get("heat", "")),
                "category": item.get("category", "其他"),
                "description": item.get("desc", item.get("description", "")),
                "video_url": video_url,
                "cover": cover,
                "search_url": f"https://www.douyin.com/search/{urllib.parse.quote(title)}",
            })
        result = {"trends": trends, "fetch_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        with _douyin_lock:
            _douyin_cache["data"] = result
            _douyin_cache["expire"] = time.time() + 600
        return result

    return {"error": "Failed to parse trending data", "trends": []}

def gen_video_copy(topic, description=""):
    """根据热点话题生成完整的短视频文案"""
    prompt = f"""请为以下抖音热点话题生成一个完整的短视频文案（口播稿），可以直接拿去拍摄使用。

热点话题：{topic}
话题描述：{description or '无'}

请严格返回以下JSON（不要markdown代码块）：
{{
  "topic": "{topic}",
  "title": "视频标题（吸引人，15字以内）",
  "hook": "开场钩子（前3秒，制造悬念吸引停留）",
  "full_script": "完整口播文案（200-400字，包含开头、中间、结尾，语言口语化，有节奏感）",
  "segments": [
    {{"time": "0-3s", "action": "画面动作", "text": "口播内容"}},
    {{"time": "3-15s", "action": "画面动作", "text": "口播内容"}},
    {{"time": "15-45s", "action": "画面动作", "text": "口播内容（核心部分）"}},
    {{"time": "45-60s", "action": "画面动作", "text": "口播内容（结尾引导）"}}
  ],
  "hashtags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"],
  "bgm_suggestion": "推荐背景音乐风格",
  "tips": "拍摄建议（50字以内）"
}}"""
    try:
        raw = _call_qwen([
            {"role": "system", "content": "你是顶级短视频文案策划师，擅长抖音爆款内容创作。只返回纯JSON，不要markdown代码块。"},
            {"role": "user", "content": prompt}
        ], temperature=0.85, max_tokens=3000)
        result = _parse_json(raw, "{")
        if isinstance(result, dict):
            result["generate_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return result
    except Exception as e:
        return {"error": str(e), "topic": topic}
    return {"error": "文案生成失败，请重试", "topic": topic}

# ─── 任务状态管理 ─────────────────────────────────────────────────────────────
task_log   = []   # [{time, text, level}]
task_running = False
task_lock  = threading.Lock()

def add_log(text, level="info"):
    with task_lock:
        task_log.append({"time": datetime.now().strftime("%H:%M:%S"), "text": text, "level": level})
        if len(task_log) > 500:
            task_log.pop(0)

def run_pipeline_async(stages=None, mock=False, n=5):
    global task_running
    with task_lock:
        if task_running:
            return False
        task_running = True
        task_log.clear()

    def _run():
        global task_running
        try:
            cmd = [sys.executable, os.path.join(BASE_DIR, "pipeline_runner.py")]
            if mock:    cmd.append("--mock")
            if stages:  cmd += ["--stage", stages]
            cmd += ["-n", str(n)]
            add_log(f"🚀 启动流水线: {' '.join(cmd[2:])}", "start")

            proc = subprocess.Popen(
                cmd, cwd=BASE_DIR,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, bufsize=1, encoding="utf-8"
            )
            for line in proc.stdout:
                line = line.rstrip()
                if not line: continue
                # 去除 ANSI 颜色码
                import re
                clean = re.sub(r'\x1b\[[0-9;]*m', '', line)
                if not clean.strip(): continue
                level = "error" if "✗" in clean else "success" if ("✓" in clean or "✅" in clean) else "info"
                add_log(clean, level)
            proc.wait()
            add_log(f"{'✅ 流水线完成！' if proc.returncode==0 else '❌ 流水线出错'}", "success" if proc.returncode==0 else "error")
        except Exception as e:
            add_log(f"❌ 异常: {e}", "error")
        finally:
            task_running = False

    threading.Thread(target=_run, daemon=True).start()
    return True

# ─── URL 内容提取 ─────────────────────────────────────────────────────────────
def extract_url_content(url):
    import urllib.request, urllib.parse, re
    # 对 URL 中的非 ASCII 字符做百分比编码
    parsed = urllib.parse.urlsplit(url)
    safe_url = urllib.parse.urlunsplit((
        parsed.scheme, parsed.netloc,
        urllib.parse.quote(parsed.path, safe='/:@!$&\'()*+,;='),
        urllib.parse.quote(parsed.query, safe='=&+%'),
        urllib.parse.quote(parsed.fragment, safe=''),
    ))
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5',
        'Accept-Encoding': 'identity',
    }
    req = urllib.request.Request(safe_url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        ct = resp.headers.get('Content-Type', '')
        charset = 'utf-8'
        if 'charset=' in ct:
            charset = ct.split('charset=')[-1].split(';')[0].strip() or 'utf-8'
        raw = resp.read()
    try:
        text = raw.decode(charset, errors='replace')
    except Exception:
        text = raw.decode('utf-8', errors='replace')
    # 去除 script / style
    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', text, flags=re.DOTALL|re.IGNORECASE)
    # 去除 HTML 标签
    text = re.sub(r'<[^>]{1,300}>', ' ', text)
    # 解码常见 HTML 实体
    for ent, ch in [('&amp;','&'),('&lt;','<'),('&gt;','>'),('&nbsp;',' '),('&quot;','"'),('&#39;',"'")]:
        text = text.replace(ent, ch)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()[:4000]

# ─── 单条脚本生成 ─────────────────────────────────────────────────────────────
def gen_script_api(topic, heat, category, platform, style, duration, content, user_prompt):
    import urllib.request, urllib.error, json as _json, re as _re
    body = _json.dumps({
        "model": "qwen3-coder-plus",
        "messages": [
            {"role": "system", "content": "你是专业短视频脚本策划师，擅长抖音、小红书爆款内容创作。只返回纯JSON，不要markdown代码块。"},
            {"role": "user", "content": _build_script_prompt(topic, heat, category, platform, style, duration, content, user_prompt)}
        ],
        "temperature": 0.85, "max_tokens": 3000,
        "enable_thinking": False,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://coding.dashscope.aliyuncs.com/v1/chat/completions", data=body,
        headers={"Content-Type":"application/json","Authorization":"Bearer sk-sp-432aa1b7751a4fea8e6425131ed89eb4"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
            raw = data["choices"][0]["message"]["content"]
        c = _re.sub(r'```(?:json)?\s*','',raw.strip()).strip()
        for ch_s, ch_e in [('{','}')]:
            s, e = c.find(ch_s), c.rfind(ch_e)
            if s>=0 and e>s:
                try:
                    obj = _json.loads(c[s:e+1])
                    from datetime import datetime
                    obj["generate_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    return obj
                except: pass
    except urllib.error.HTTPError as ex:
        err = (ex.read().decode()[:200] if ex.fp else '')
        return {"error": f"API错误 {ex.code}: {err}", "topic": topic}
    except Exception as ex:
        return {"error": str(ex), "topic": topic}
    return {"error": "脚本生成失败，请重试", "topic": topic}

def _build_script_prompt(topic, heat, category, platform, style, duration, content, user_prompt):
    style = style or "情感共鸣"
    duration = duration or "60秒"
    dur_s = ''.join(c for c in duration if c.isdigit()) or "60"
    mid_s = str(int(dur_s) * 3 // 4)
    content_block = f"\n\n参考文案（从链接提取，请结合使用）：\n{content[:1500]}" if content.strip() else ""
    extra = f"\n\n创作者额外要求（请严格遵守）：{user_prompt}" if user_prompt.strip() else ""
    return f"""为以下热点话题创作一个{duration}短视频脚本，目标平台：{platform}，风格：{style}。

热点话题：{topic}
热度：{heat}
分类：{category}{content_block}{extra}

严格返回以下JSON结构（只返回JSON，不要任何其他文字）：
{{
  "topic": "{topic}",
  "category": "{category}",
  "platform_target": "{platform}",
  "style": "{style}",
  "title": "吸引人的视频标题（15字以内）",
  "hook": "前3秒开场钩子（制造悬念/冲突/好奇心，20字以内）",
  "segments": [
    {{"time": "0-3s",  "type": "hook",     "text": "开场钩子文案", "visual": "画面描述"}},
    {{"time": "3-15s", "type": "conflict", "text": "冲突/痛点文案", "visual": "画面描述"}},
    {{"time": "15-{mid_s}s","type": "content",  "text": "核心内容文案（100字以内）", "visual": "画面描述"}},
    {{"time": "{mid_s}-{dur_s}s","type": "cta",      "text": "行动号召文案（20字以内）", "visual": "画面描述"}}
  ],
  "hashtags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"],
  "bgm_style": "背景音乐风格",
  "conversion_goal": "涨粉|带货|品牌|流量",
  "difficulty": "低|中|高",
  "estimated_views": "预估播放量（如：10万-50万）"
}}"""

# ─── HTTP Handler ─────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass  # 静默HTTP日志

    def send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        p = urlparse(self.path)
        path = p.path
        qs   = parse_qs(p.query)

        # ── API: 任务日志（轮询）
        if path == "/api/logs":
            offset = int(qs.get("offset",["0"])[0])
            with task_lock:
                logs = task_log[offset:]
                running = task_running
            self.send_json({"logs": logs, "total": len(task_log)+offset, "running": running})
            return

        # ── API: 最新数据
        if path == "/api/data":
            result = {}
            for key, fname in [("trends","latest.json"),("scripts","latest_scripts.json"),
                                ("matched","latest_matched.json"),("analytics","latest_analytics.json"),
                                ("produced","latest_produced.json"),("scheduled","latest_scheduled.json")]:
                fpath = os.path.join(DATA_DIR, fname)
                if os.path.exists(fpath):
                    try:
                        with open(fpath, encoding="utf-8") as f:
                            result[key] = json.load(f)
                    except: pass
            self.send_json(result)
            return

        # ── API: 摘要统计
        if path == "/api/summary":
            summary_path = os.path.join(DATA_DIR, "pipeline_summary.json")
            if os.path.exists(summary_path):
                with open(summary_path, encoding="utf-8") as f:
                    self.send_json(json.load(f))
            else:
                self.send_json({})
            return

        # ── API: 热点深度分析
        if path == "/api/analyze":
            topic    = unquote(qs.get("topic",   [""])[0])
            heat     = unquote(qs.get("heat",    [""])[0])
            category = unquote(qs.get("category",[""])[0])
            platform = unquote(qs.get("platform",[""])[0])
            if not topic:
                self.send_json({"error": "缺少 topic 参数"}, 400); return
            cache_key = f"{topic}|{category}|{platform}"
            cached = _cache_get(cache_key)
            if cached:
                self.send_json({**cached, "_cached": True})
                return
            try:
                from topic_analyzer import analyze_topic
                result = analyze_topic(topic, heat, category, platform)
                _cache_set(cache_key, result)
                self.send_json(result)
            except Exception as e:
                self.send_json({"error": str(e), "topic": topic}, 500)
            return

        # ── API: 抖音热点
        if path == "/api/douyin-trends":
            result = fetch_douyin_trends_api()
            self.send_json(result)
            return

        # ── API: 抖音视频文案生成
        if path == "/api/douyin-video-copy":
            topic = unquote(qs.get("topic", [""])[0])
            desc  = unquote(qs.get("desc", [""])[0])
            if not topic:
                self.send_json({"error": "缺少 topic 参数"}, 400); return
            cache_key = f"videocopy|{topic}"
            cached = _cache_get(cache_key)
            if cached:
                self.send_json({**cached, "_cached": True}); return
            result = gen_video_copy(topic, desc)
            if "error" not in result:
                _cache_set(cache_key, result)
            self.send_json(result)
            return

        # ── API: 帧功夫媒体文件服务（关键帧图片等）
        if path.startswith("/api/zgf/media/"):
            # /api/zgf/media/{video_id}/frames/frame_50.jpg
            rel_path = path[len("/api/zgf/media/"):]
            file_path = os.path.join(MEDIA_DIR, rel_path.replace("/", os.sep))
            if os.path.isfile(file_path):
                ext = os.path.splitext(file_path)[1].lower()
                ctype_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                             ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".wav": "audio/wav"}
                ct = ctype_map.get(ext, "application/octet-stream")
                with open(file_path, "rb") as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-Type", ct)
                self.send_header("Content-Length", len(data))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "public, max-age=86400")
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_response(404)
                self.end_headers()
            return

        # ── API: URL 文案提取
        if path == "/api/extract":
            url = unquote(qs.get("url", [""])[0])
            if not url:
                self.send_json({"error": "缺少 url 参数"}, 400); return
            try:
                text = extract_url_content(url)
                self.send_json({"text": text, "url": url, "length": len(text)})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
            return

        # ── 帧功夫: Sora 配置
        if path == "/api/zgf/sora-config":
            self.send_json(_load_sora_config())
            return

        # ── 帧功夫: 视频状态轮询
        if path == "/api/zgf/video-status":
            task_id = qs.get("task_id", [""])[0]
            if not task_id:
                self.send_json({"error": "缺少 task_id"}, 400); return
            self.send_json(zgf_video_status(task_id))
            return

        self.send_response(404); self.end_headers()

    def do_POST(self):
        p = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body   = json.loads(self.rfile.read(length)) if length else {}

        # ── API: 启动流水线
        if p.path == "/api/run":
            stages = body.get("stages")  # "1,2,3" or None
            mock   = body.get("mock", False)
            n      = int(body.get("n", 5))
            ok     = run_pipeline_async(stages, mock, n)
            self.send_json({"ok": ok, "msg": "已启动" if ok else "正在运行中，请稍候"})
            return

        # ── API: 单条脚本生成
        if p.path == "/api/gen_script":
            topic       = body.get("topic", "")
            heat        = body.get("heat", "")
            category    = body.get("category", "")
            platform    = body.get("platform", "抖音")
            style       = body.get("style", "")
            duration    = body.get("duration", "60秒")
            content     = body.get("content", "")
            user_prompt = body.get("user_prompt", "")
            if not topic:
                self.send_json({"error": "缺少 topic 参数"}, 400); return
            result = gen_script_api(topic, heat, category, platform, style, duration, content, user_prompt)
            self.send_json(result)
            return

        # ── 帧功夫: 文案提取
        if p.path == "/api/zgf/extract-copy":
            share_text = body.get("share_text", "")
            if not share_text:
                self.send_json({"error": "缺少 share_text 参数"}, 400); return
            result = zgf_extract_copy(share_text)
            self.send_json(result)
            return

        # ── 帧功夫: 文案仿写
        if p.path == "/api/zgf/rewrite-copy":
            original = body.get("original", "")
            if not original:
                self.send_json({"error": "缺少 original 参数"}, 400); return
            result = zgf_rewrite_copy(original)
            self.send_json(result)
            return

        # ── 帧功夫: 脚本生成
        if p.path == "/api/zgf/gen-script":
            original = body.get("original", "")
            style = body.get("style", "口播")
            duration = body.get("duration", "60秒")
            if not original:
                self.send_json({"error": "缺少 original 参数"}, 400); return
            result = zgf_gen_script(original, style, duration)
            self.send_json(result)
            return

        # ── 帧功夫: Sora 配置保存
        if p.path == "/api/zgf/sora-config":
            _save_sora_config(body)
            self.send_json({"ok": True})
            return

        # ── 帧功夫: 视频生成 (Sora)
        if p.path == "/api/zgf/gen-video":
            prompt = body.get("prompt", body.get("script", ""))
            duration = int(body.get("duration", 5))
            provider = body.get("provider", "")
            if not prompt:
                self.send_json({"error": "缺少 prompt"}, 400); return
            result = zgf_gen_video(prompt, duration, provider or None)
            self.send_json(result)
            return

        # ── 帧功夫: 矩阵发布文案生成
        if p.path == "/api/zgf/gen-publish":
            script = body.get("script", "")
            title = body.get("title", "")
            if not script:
                self.send_json({"error": "缺少 script 参数"}, 400); return
            result = zgf_gen_publish(script, title)
            self.send_json(result)
            return

        self.send_response(404); self.end_headers()

# ─── 帧功夫 API ──────────────────────────────────────────────────────────────
DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
MEDIA_DIR  = os.path.join(BASE_DIR, "data", "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
MIN_MEDIA_SIZE_BYTES = 200 * 1024
_whisper_model = None

def _clean_extract_text(text):
    normalized = (text or "").replace("\\n", "\n").replace("\r\n", "\n").replace("\r", "\n").replace("\u200b", "").strip()
    lines = [line.strip() for line in normalized.split("\n")]
    lines = [line for line in lines if line]
    deduped = []
    for line in lines:
        if not deduped or deduped[-1] != line:
            deduped.append(line)
    return "\n".join(deduped).strip()

def _load_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print("[zgf] 加载本地 Whisper small 模型...", file=sys.stderr)
        _whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
    return _whisper_model

def _parse_share_text(share_text):
    """解析分享文本，提取URL"""
    import re as _re
    urls = _re.findall(r'https?://[^\s<>"]+', share_text)
    desc = share_text
    for u in urls:
        desc = desc.replace(u, '')
    desc = _re.sub(r'\d+\.\d+\s*', '', desc)
    desc = _re.sub(r'[A-Za-z@:/]{2,8}', ' ', desc)
    desc = _re.sub(r'复制打开抖音.*?作品', '', desc)
    desc = _re.sub(r'复制此链接.*$', '', desc)
    desc = _re.sub(r'打开Dou音搜索.*$', '', desc)
    desc = _re.sub(r'复制打开快手.*$', '', desc)
    desc = _re.sub(r'\s+', ' ', desc).strip()
    return urls, desc

def _extract_video_id(url):
    """从 URL 中提取抖音视频 ID（支持多种格式）"""
    import re as _re
    for pattern in [r'/video/(\d+)', r'modal_id=(\d+)', r'group_id=(\d+)', r'aweme_id=(\d+)']:
        m = _re.search(pattern, url)
        if m:
            return m.group(1)
    return ""

def _resolve_short_url(short_url):
    """跟随重定向，获取最终URL和视频ID"""
    import urllib.request
    # 先检查输入本身是否包含视频ID
    video_id = _extract_video_id(short_url)
    if video_id:
        return f"https://www.douyin.com/video/{video_id}", video_id

    final_url = short_url
    try:
        req = urllib.request.Request(short_url, headers={'User-Agent': DESKTOP_UA}, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as resp:
            final_url = resp.url or short_url
    except Exception:
        try:
            req = urllib.request.Request(short_url, headers={'User-Agent': DESKTOP_UA})
            with urllib.request.urlopen(req, timeout=10) as resp:
                final_url = resp.url or short_url
        except Exception:
            pass
    video_id = _extract_video_id(final_url)
    if video_id:
        final_url = f"https://www.douyin.com/video/{video_id}"
    return final_url, video_id

def _extract_keyframes(media_path, task_dir):
    """用 FFmpeg 从视频中截取 0%/50%/90% 位置的关键帧"""
    frames_dir = os.path.join(task_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    try:
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", media_path],
            capture_output=True, text=True, timeout=10,
        )
        dur_str = probe.stdout.strip()
        if not dur_str or dur_str == "N/A":
            return []
        duration = float(dur_str)
    except Exception:
        return []

    frames = []
    for pct, suffix in [(0, "00"), (0.5, "50"), (0.9, "90")]:
        name = f"frame_{suffix}.jpg"
        path = os.path.join(frames_dir, name)
        try:
            subprocess.run(
                ["ffmpeg", "-v", "error", "-ss", str(duration * pct),
                 "-i", media_path, "-vframes", "1", "-q:v", "2", "-y", path],
                timeout=15, check=True, capture_output=True,
            )
            if os.path.exists(path) and os.path.getsize(path) > 100:
                frames.append(name)
        except Exception:
            pass
    return frames

def _playwright_extract(url):
    """用 Playwright 无头浏览器加载抖音页面，提取视频描述 + 拦截音频流
    增强: 解析 RENDER_DATA 获取更精准的视频描述
    """
    from playwright.sync_api import sync_playwright
    import re as _re
    import urllib.parse as _up

    result = {"title": "", "desc": "", "author": "", "media_url": "", "tags": []}
    candidate_media = []

    def handle_response(response):
        try:
            ctype = response.headers.get("content-type", "").lower()
            if "video" not in ctype and "audio" not in ctype:
                return
            clength = int(response.headers.get("content-length", "0"))
            if clength < 500_000:
                return
            resp_url = response.url
            if any(kw in resp_url for kw in ("ads", "pre-roll", "commercial", "p1-")):
                return
            if not any(c["url"] == resp_url for c in candidate_media):
                candidate_media.append({"url": resp_url, "size": clength})
        except Exception:
            pass

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled",
                       "--no-sandbox", "--disable-dev-shm-usage"],
            )
            context = browser.new_context(
                user_agent=DESKTOP_UA,
                viewport={"width": 1280, "height": 720},
                locale="zh-CN",
            )
            page = context.new_page()
            page.on("response", handle_response)
            page.goto(url, wait_until="domcontentloaded", timeout=30000)

            try:
                page.keyboard.press("Escape")
            except Exception:
                pass
            page.wait_for_timeout(5000)

            # 1. 基础提取: 标题 + h1 + meta
            result["title"] = (page.title() or "").replace(" - 抖音", "").strip()

            h1 = page.query_selector("h1")
            if h1:
                result["desc"] = (h1.inner_text() or "").strip()

            # meta 标签补充
            for sel, attr in [('meta[property="og:title"]', "content"), ('meta[name="description"]', "content")]:
                if not result["desc"]:
                    try:
                        val = page.get_attribute(sel, attr)
                        if val and val.strip() and val.strip() != "抖音":
                            result["desc"] = val.strip()
                    except Exception:
                        pass

            # 2. 深度提取: RENDER_DATA (抖音页面内嵌的视频详情 JSON)
            try:
                render_raw = page.evaluate(
                    "() => { const n = document.querySelector('#RENDER_DATA'); return n ? n.textContent || '' : ''; }"
                )
                if render_raw:
                    decoded = _up.unquote(render_raw)
                    parsed = json.loads(decoded)
                    if isinstance(parsed, dict):
                        for _k, val in parsed.items():
                            if not isinstance(val, dict):
                                continue
                            # 查找 awemeDetail 或 aweme.detail
                            aweme = val.get("awemeDetail") or (val.get("aweme", {}) or {}).get("detail")
                            if isinstance(aweme, dict):
                                desc_rd = aweme.get("desc", "")
                                if desc_rd and len(desc_rd) > len(result.get("desc", "")):
                                    result["desc"] = desc_rd.strip()
                                # 提取标签
                                text_extra = aweme.get("textExtra", [])
                                if isinstance(text_extra, list):
                                    result["tags"] = [f"#{t.get('hashtagName', '')}" for t in text_extra if t.get("hashtagName")]
                                break
            except Exception:
                pass

            # 3. 提取作者
            for sel in ['[data-e2e="video-author-uniqueid"]', '[data-e2e="video-author-nickname"]']:
                el = page.query_selector(sel)
                if el:
                    result["author"] = (el.inner_text() or "").strip()
                    if result["author"]:
                        break

            # 4. 等待更多媒体流
            if not candidate_media:
                page.wait_for_timeout(3000)

            # 选最大的媒体文件
            if candidate_media:
                best = max(candidate_media, key=lambda x: x["size"])
                result["media_url"] = best["url"]
                print(f"[playwright] 捕获媒体: {best['size']/1024/1024:.2f}MB", file=sys.stderr)

            browser.close()
    except Exception as e:
        print(f"[playwright] 错误: {e}", file=sys.stderr)

    return result

def _download_media(media_url, video_id):
    """下载视频/音频文件"""
    import urllib.request
    task_dir = os.path.join(MEDIA_DIR, video_id or str(int(time.time())))
    os.makedirs(task_dir, exist_ok=True)
    media_path = os.path.join(task_dir, "media.m4a")
    try:
        req = urllib.request.Request(media_url, headers={
            'User-Agent': DESKTOP_UA,
            'Referer': 'https://www.douyin.com/',
        })
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(media_path, "wb") as f:
                f.write(resp.read())
        return media_path, task_dir
    except Exception as e:
        print(f"[download] 错误: {e}", file=sys.stderr)
        return None, task_dir

def _split_audio(media_path, task_dir):
    """用 FFmpeg 将音频分成30秒片段，转为16kHz mono mp3"""
    chunk_pattern = os.path.join(task_dir, "chunk_%03d.mp3")
    cmd = [
        "ffmpeg", "-v", "error", "-i", media_path,
        "-f", "segment", "-segment_time", "30",
        "-ac", "1", "-ar", "16000",
        "-c:a", "libmp3lame", "-q:a", "4",
        "-reset_timestamps", "1",
        chunk_pattern
    ]
    try:
        subprocess.run(cmd, timeout=60, check=True, capture_output=True)
    except Exception as e:
        print(f"[ffmpeg] 分片错误: {e}", file=sys.stderr)
        return []
    import glob
    chunks = sorted(glob.glob(os.path.join(task_dir, "chunk_*.mp3")))
    return chunks

def _asr_with_doubao(chunks):
    """用豆包 API 做语音转文字（将音频 base64 发给 LLM 描述）"""
    # 豆包标准 API 不支持直接 ASR，改用千问 Paraformer 或用 LLM 文本方式
    # 这里用分片 → base64 → 调用阿里 Paraformer ASR
    import base64, urllib.request, urllib.error
    full_text = []
    for chunk_path in chunks:
        with open(chunk_path, "rb") as f:
            audio_data = f.read()
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")
        # 调用阿里 Paraformer ASR (DashScope)
        body = json.dumps({
            "model": "paraformer-v2",
            "input": {
                "audio": f"data:audio/mp3;base64,{audio_b64}"
            },
            "parameters": {"language_hints": ["zh"]}
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {QWEN_API_KEY}",
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data.get("output", {}).get("text", "")
                if text:
                    full_text.append(text)
        except Exception as e:
            print(f"[asr] 片段转写失败: {e}", file=sys.stderr)
    return " ".join(full_text)

def _asr_with_edge(media_path, task_dir):
    """备用ASR: 用阿里 SenseVoice (通过 DashScope file API)"""
    import base64, urllib.request, urllib.error
    # 先提取纯音频 (确保格式兼容)
    audio_path = os.path.join(task_dir, "audio.wav")
    cmd = ["ffmpeg", "-v", "error", "-i", media_path, "-ac", "1", "-ar", "16000",
           "-c:a", "pcm_s16le", "-y", audio_path]
    try:
        subprocess.run(cmd, timeout=60, check=True, capture_output=True)
    except Exception:
        return ""
    if not os.path.exists(audio_path) or os.path.getsize(audio_path) < 1000:
        return ""

    # 直接用 DashScope Paraformer 实时识别 (同步模式，文件<25MB)
    with open(audio_path, "rb") as f:
        audio_data = f.read()
    if len(audio_data) > 25 * 1024 * 1024:
        return ""

    audio_b64 = base64.b64encode(audio_data).decode("utf-8")
    body = json.dumps({
        "model": "sensevoice-v1",
        "input": {
            "audio_data": audio_b64,
            "format": "wav",
            "sample_rate": 16000,
        },
        "parameters": {"language_hints": ["zh"]}
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/recognition",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {QWEN_API_KEY}",
            "X-DashScope-DataInspection": "enable",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            # SenseVoice 返回格式
            sentences = data.get("output", {}).get("sentence", [])
            if sentences:
                return " ".join(s.get("text", "") for s in sentences)
            return data.get("output", {}).get("text", "")
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")[:300]
        print(f"[asr-sensevoice] HTTP {e.code}: {err}", file=sys.stderr)
    except Exception as e:
        print(f"[asr-sensevoice] 错误: {e}", file=sys.stderr)
    return ""

def _playwright_extract_full(url):
    from playwright.sync_api import sync_playwright
    import re as _re
    import urllib.parse as _up

    result = {"title": "", "desc": "", "author": "", "media_url": "", "tags": []}
    media_candidates = []

    def on_response(response):
        try:
            ctype = (response.headers.get("content-type") or "").lower()
            if "video" not in ctype and "audio" not in ctype:
                return
            size = int(response.headers.get("content-length", "0") or "0")
            if size < MIN_MEDIA_SIZE_BYTES:
                return
            if not any(item["url"] == response.url for item in media_candidates):
                media_candidates.append({"url": response.url, "size": size})
        except Exception:
            pass

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(
                headless=True,
                channel="chrome",
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage"],
            )
        except Exception:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage"],
            )
        context = browser.new_context(
            user_agent=DESKTOP_UA,
            viewport={"width": 1280, "height": 720},
            locale="zh-CN",
        )
        page = context.new_page()
        page.on("response", on_response)
        page.goto(url, wait_until="domcontentloaded", timeout=60000)

        try:
            page.keyboard.press("Escape")
        except Exception:
            pass
        page.wait_for_timeout(8000)

        title_candidates = []
        for selector in ["h1", 'meta[property="og:title"]', 'meta[name="description"]']:
            try:
                if selector.startswith("meta"):
                    content = page.get_attribute(selector, "content")
                    if content:
                        title_candidates.append(content.strip())
                else:
                    element = page.query_selector(selector)
                    if element:
                        text = (element.inner_text() or "").strip()
                        if text:
                            title_candidates.append(text)
            except Exception:
                pass

        try:
            page_title = (page.title() or "").replace(" - 抖音", "").strip()
            if page_title:
                title_candidates.append(page_title)
        except Exception:
            pass

        render_data_text = page.evaluate(
            "() => { const node = document.querySelector('#RENDER_DATA'); return node ? node.textContent || '' : ''; }"
        )
        if render_data_text:
            try:
                decoded = _up.unquote(render_data_text)
                parsed = json.loads(decoded)
                if isinstance(parsed, dict):
                    for value in parsed.values():
                        if not isinstance(value, dict):
                            continue
                        aweme = value.get("awemeDetail") or (value.get("aweme", {}) or {}).get("detail")
                        if not isinstance(aweme, dict):
                            continue
                        desc = (aweme.get("desc") or "").strip()
                        if desc:
                            title_candidates.insert(0, desc)
                        text_extra = aweme.get("textExtra", [])
                        if isinstance(text_extra, list):
                            result["tags"] = [f"#{item.get('hashtagName', '').strip()}" for item in text_extra if item.get("hashtagName")]
                        author_info = aweme.get("author", {})
                        if isinstance(author_info, dict):
                            result["author"] = (author_info.get("nickname") or author_info.get("unique_id") or "").strip()
                        break
            except Exception:
                pass

        for selector in ['[data-e2e="video-author-uniqueid"]', '[data-e2e="video-author-nickname"]']:
            if result["author"]:
                break
            try:
                element = page.query_selector(selector)
                if element:
                    result["author"] = (element.inner_text() or "").strip()
            except Exception:
                pass

        page.wait_for_timeout(6000)
        if media_candidates:
            best = max(media_candidates, key=lambda item: item["size"])
            result["media_url"] = best["url"]

        browser.close()

    cleaned = ""
    for candidate in title_candidates:
        cleaned = _clean_extract_text(candidate)
        if cleaned and cleaned != "抖音":
            break
    result["desc"] = cleaned
    result["title"] = _clean_extract_text(_re.sub(r"#\S+", "", cleaned).strip()) or cleaned
    return result

def _download_media_full(media_url, video_id):
    import urllib.request
    import ssl
    task_dir = os.path.join(MEDIA_DIR, video_id or str(int(time.time())))
    os.makedirs(task_dir, exist_ok=True)
    media_path = os.path.join(task_dir, "media.mp4")
    ssl_ctx = ssl._create_unverified_context()
    req = urllib.request.Request(media_url, headers={
        "User-Agent": DESKTOP_UA,
        "Referer": "https://www.douyin.com/",
    })
    with urllib.request.urlopen(req, timeout=180, context=ssl_ctx) as resp:
        with open(media_path, "wb") as f:
            f.write(resp.read())
    return media_path, task_dir

def _transcribe_with_whisper(media_path):
    model = _load_whisper_model()
    segments, info = model.transcribe(media_path, language="zh", vad_filter=True, beam_size=5)
    print(f"[zgf] Whisper language={info.language}", file=sys.stderr)
    texts = [segment.text.strip() for segment in segments if getattr(segment, "text", "").strip()]
    return _clean_extract_text("\n".join(texts))

def zgf_extract_copy(share_text):
    import re as _re

    urls, _ = _parse_share_text(share_text)
    if not urls:
        return {"error": "未找到有效链接，请粘贴包含链接的分享文本"}

    raw_url = urls[0].rstrip("/")
    try:
        final_url, video_id = _resolve_short_url(raw_url)
        print(f"[zgf] URL: {final_url}, video_id: {video_id}", file=sys.stderr)

        pw_data = _playwright_extract_full(final_url)
        print(
            f"[zgf] playwright: title={pw_data.get('title', '')[:50]}, "
            f"desc={pw_data.get('desc', '')[:80]}, "
            f"author={pw_data.get('author', '')}, "
            f"tags={pw_data.get('tags', [])}, "
            f"media={'YES' if pw_data.get('media_url') else 'NO'}",
            file=sys.stderr,
        )

        extra_info = {
            "url": final_url,
            "video_id": video_id,
            "author": pw_data.get("author", ""),
            "title": pw_data.get("title", ""),
            "desc": pw_data.get("desc", ""),
            "tags": pw_data.get("tags", []),
            "frames": [],
        }

        if pw_data.get("media_url"):
            media_path, task_dir = _download_media_full(pw_data["media_url"], video_id)
            if os.path.exists(media_path) and os.path.getsize(media_path) > 10000:
                try:
                    frames = _extract_keyframes(media_path, task_dir)
                    if frames:
                        extra_info["frames"] = [f"/api/zgf/media/{video_id}/frames/{name}" for name in frames]
                except Exception as frame_error:
                    print(f"[zgf] 关键帧提取失败: {frame_error}", file=sys.stderr)

                whisper_text = _transcribe_with_whisper(media_path)
                if whisper_text:
                    whisper_text = _re.sub(r"<think>.*?</think>", "", whisper_text, flags=_re.DOTALL).strip()
                    return {"text": whisper_text, "method": "local-whisper", **extra_info}

        page_text = _clean_extract_text(pw_data.get("desc", ""))
        if page_text:
            page_text = _re.sub(r"<think>.*?</think>", "", page_text, flags=_re.DOTALL).strip()
            return {"text": page_text, "method": "page-desc", **extra_info}

        return {"error": "未提取到有效文案"}
    except Exception as e:
        return {"error": f"文案提取失败: {e}"}

def zgf_rewrite_copy(original):
    """仿写文案"""
    import re as _re
    try:
        result = _call_qwen([
            {"role": "system", "content": "你是专业短视频文案写手，擅长仿写爆款文案。只返回仿写后的文案，不要任何说明。"},
            {"role": "user", "content": f"""请仿写以下短视频文案，保持相似的风格、语气和结构，但内容要有所不同。
要求：
1. 保持原文的情感基调和节奏
2. 保持类似的句式结构
3. 内容必须原创，不能直接复制
4. 字数与原文相近

原文案：
{original}

请直接返回仿写后的文案，不要添加任何说明文字。"""}
        ], temperature=0.85, max_tokens=2000)
        text = result.strip()
        text = _re.sub(r'<think>.*?</think>', '', text, flags=_re.DOTALL).strip()
        return {"text": text}
    except Exception as e:
        return {"error": f"仿写失败: {e}"}

def zgf_gen_script(original, style="口播", duration="60秒"):
    """根据提取的文案生成AI视频分镜脚本（Sora/Kling/Runway可用）"""
    prompt = f"""你是一名世界级短视频趋势分析专家、内容策略师、电影导演和AI视频提示词工程师。

你的任务是：根据短视频平台传播规律（抖音、小红书、TikTok），设计适合AI视频生成模型（如 Sora、Kling、Runway、Pika、即梦）的爆款短视频创意，并生成完整的分镜脚本与AI视频生成Prompt。

你的目标：生成具有强视觉冲击力、易传播、适合AI生成、可批量生产、并能够融合营销内容实现引流和转化的短视频内容。

【原始素材/灵感来源】
{original[:3000]}

【用户指定风格】{style}

请完成以下9个步骤：

第一步：趋势判断 — 从以下视觉类型中选择最适合的：视觉奇观、微型世界、AI生成世界、超现实画面、科幻未来、视觉反转、创意转场、情绪治愈、AI创造现实、世界生成。优先选择能在3秒内产生视觉冲击的创意。

第二步：AI生成可行性检查 — 确保画面可通过AI视频生成模型实现。优先使用：微缩世界生成、现实世界变化、物体变形、世界生成、数据生成场景、现实与虚拟融合、城市/自然景观生成。避免复杂剧情和多人对话。

第三步：传播机制设计 — 每个视频至少具备两个传播驱动力：强视觉奇观、好奇心驱动、情绪共鸣、惊讶、治愈、视觉反转、超现实画面。

第四步：营销融合设计 — 自然融入营销元素（产品出现在场景中、品牌元素作为视觉物体生成、使用产品解决问题、视频结尾展示产品）。营销必须自然，不要像广告。

第五步：短视频节奏设计 — Hook(开头3秒强视觉冲击) → Development(画面变化和故事推进) → Climax(视觉高潮或惊喜) → Payoff(留下记忆点或反转)。

第六步：生成分镜脚本 — 根据视频时长生成4-8个镜头的分镜脚本。

第七步：生成AI视频Prompt — 为整个视频生成一个可以直接用于Sora/Kling等AI视频生成模型的Prompt。

第八步：生成引流结构 — 至少包含一种引流方式（评论区互动、系列视频、悬念结尾、关注提示、私域引导）。

第九步：输出

严格返回以下JSON格式（不要markdown代码块和任何其他文字）：
{{
  "title": "视频标题（15字以内）",
  "video_type": "视频类型（如：视觉奇观/微型世界/超现实画面等）",
  "video_duration": "视频时长（如：15秒/30秒/60秒）",
  "spread_drivers": ["传播驱动力1", "传播驱动力2"],
  "marketing_fusion": "营销融合方式描述",
  "hook": "前3秒开场钩子描述",
  "full_script": "完整脚本旁白（可直接使用，200-500字）",
  "segments": [
    {{
      "shot": 1,
      "time": "0-3s",
      "scene": "画面描述",
      "camera_move": "镜头运动（如：缓慢推进/环绕/俯冲/固定等）",
      "visual_change": "视觉变化描述",
      "sound": "音效描述",
      "text": "旁白/字幕"
    }},
    {{
      "shot": 2,
      "time": "3-8s",
      "scene": "画面描述",
      "camera_move": "镜头运动",
      "visual_change": "视觉变化描述",
      "sound": "音效描述",
      "text": "旁白/字幕"
    }}
  ],
  "ai_video_prompt": "完整的AI视频生成Prompt（英文，包含Time Code/Camera Move/Scene/Format & Look/Lens/Lighting/Color Grade/Location/Props/Sound/Shot Description/Poster Frame，可以直接粘贴到Sora/Kling使用）",
  "drainage_design": "引流设计描述",
  "suitable_platforms": ["抖音", "小红书", "TikTok"],
  "ai_difficulty": "低/中/高",
  "viral_score": 8,
  "hashtags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"],
  "bgm_style": "推荐背景音乐风格",
  "tips": "拍摄/制作建议（50字以内）"
}}"""
    try:
        raw = _call_doubao([
            {"role": "system", "content": "你是世界级短视频趋势分析专家、电影导演和AI视频提示词工程师。擅长为Sora/Kling/Runway等AI视频生成模型设计爆款短视频创意和分镜脚本。只返回纯JSON，不要markdown代码块。"},
            {"role": "user", "content": prompt}
        ], temperature=0.85, max_tokens=6000)
        result = _parse_json(raw, "{")
        if isinstance(result, dict):
            result["generate_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return result
    except Exception as e1:
        try:
            raw = _call_qwen([
                {"role": "system", "content": "你是世界级短视频趋势分析专家、电影导演和AI视频提示词工程师。只返回纯JSON，不要markdown代码块。"},
                {"role": "user", "content": prompt}
            ], temperature=0.85, max_tokens=6000)
            result = _parse_json(raw, "{")
            if isinstance(result, dict):
                result["generate_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                return result
        except Exception as e2:
            return {"error": f"脚本生成失败: {e1} / {e2}"}
    return {"error": "脚本生成失败，请重试"}

def zgf_gen_video(prompt, duration=5, provider_key=None):
    """调用 Sora API 生成视频"""
    import urllib.request, urllib.error, ssl
    config = _load_sora_config()
    pk = provider_key or config.get("provider", "grsai")
    providers = config.get("providers", SORA_DEFAULT_PROVIDERS)
    p = providers.get(pk) or providers.get("grsai") or list(providers.values())[0]

    host = p["host"].rstrip("/")
    api_key = p["apiKey"]

    # SSL 兼容
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    body = json.dumps({
        "model": "sora-2",
        "prompt": prompt,
        "duration": min(duration, 30),
        "size": "720x1280",  # 竖屏 9:16
        "n": 1,
    }).encode("utf-8")

    endpoints_to_try = [
        "/v1/video/generations",
        "/v1/videos/generations",
        "/v1/videos",
        "/v1/generate/video",
        "/v1/sora/generate",
    ]
    errors_log = []
    for ep in endpoints_to_try:
        url = f"{host}{ep}"
        try:
            req = urllib.request.Request(url, data=body, headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }, method="POST")
            with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)

            # 如果 API 返回业务层错误
            if data.get("code") and data.get("code") != 0 and data.get("msg"):
                errors_log.append(f"{ep}: {data['msg']}")
                continue

            # 提取 task_id（兼容多种返回格式）
            task_id = (data.get("id") or data.get("task_id")
                       or (data.get("data") or {}).get("id")
                       or (data.get("data") or {}).get("task_id"))

            # 提取 video_url（部分 API 同步返回）
            video_url = (data.get("video_url") or data.get("url")
                         or (data.get("data") or {}).get("video_url")
                         or (data.get("data") or {}).get("url")
                         or (data.get("output") or {}).get("video_url")
                         or (data.get("video") or {}).get("url"))

            status = data.get("status", "processing")
            if status in ("completed", "succeeded", "success", "done"):
                status = "completed"
            elif status in ("failed", "error"):
                status = "failed"

            tid = str(task_id or f"sora2_{pk}_{int(time.time())}")
            _sora_tasks[tid] = {
                "host": host, "apiKey": api_key, "endpoint": ep,
                "status": status, "created": time.time(),
                "video_url": video_url or "",
                "provider": p.get("name", pk),
                "prompt": prompt,
                "duration": duration,
            }
            return {
                "task_id": tid,
                "status": status,
                "video_url": video_url or "",
                "provider": p.get("name", pk),
            }
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="replace")[:200]
            code = he.code
            if code == 404:
                continue  # 跳过不存在的 endpoint
            errors_log.append(f"{ep}: HTTP {code} - {err_body}")
            if code in (401, 403):
                break  # 认证问题不再尝试其他 endpoint
        except Exception as e:
            errors_log.append(f"{ep}: {e}")

    err_msg = "; ".join(errors_log) if errors_log else "所有 endpoint 均返回 404"
    return {
        "error": f"视频生成失败 ({p.get('name', pk)}): {err_msg}",
        "task_id": "", "status": "failed",
        "provider": p.get("name", pk),
    }


def zgf_video_status(task_id):
    """
    轮询 Sora2 视频生成状态

    由于没有回调接口，每次调用都会向 API 服务商查询最新状态。
    建议前端每 5-10 秒轮询一次，最多轮询 5-10 分钟。
    """
    import urllib.request, ssl
    task = _sora_tasks.get(task_id)
    if not task:
        return {"task_id": task_id, "status": "unknown", "error": "未找到该任务", "video_url": ""}

    # 已完成直接返回
    if task.get("status") == "completed" and task.get("video_url"):
        return {"task_id": task_id, "status": "completed", "video_url": task["video_url"], "progress": 100}

    # 已失败直接返回
    if task.get("status") == "failed":
        return {"task_id": task_id, "status": "failed", "error": task.get("error", "生成失败"), "video_url": ""}

    host = task["host"]
    api_key = task["apiKey"]
    ep = task["endpoint"]

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        # 尝试多种可能的状态查询 endpoint
        for status_ep in [ep, f"{ep}/status", f"{ep}/result"]:
            url = f"{host}{status_ep}/{task_id}"
            req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {api_key}",
            }, method="GET")
            try:
                with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                break
            except urllib.error.HTTPError as he:
                if he.code == 404:
                    continue
                raise
        else:
            # 所有 endpoint 都 404，返回处理中
            return {"task_id": task_id, "status": "processing", "video_url": "", "progress": task.get("progress", 0)}

        # 提取状态（兼容多种格式）
        status = data.get("status", data.get("state", data.get("task_status", "processing")))
        status_lower = str(status).lower()

        if status_lower in ["completed", "succeeded", "success", "done", "finished"]:
            status = "completed"
        elif status_lower in ["failed", "error", "failure"]:
            status = "failed"
        elif status_lower in ["processing", "running", "queued", "pending", "generating"]:
            status = "processing"

        # 提取视频 URL（兼容多种格式）
        video_url = (data.get("video_url") or data.get("url")
                     or (data.get("data") or {}).get("video_url")
                     or (data.get("data") or {}).get("url")
                     or (data.get("output") or {}).get("video_url")
                     or (data.get("video") or {}).get("url")
                     or (data.get("result") or {}).get("url") or "")

        # 提取进度
        progress = data.get("progress", data.get("percent", data.get("completion", 0)))
        try:
            progress = int(progress)
        except (ValueError, TypeError):
            progress = 0

        # 更新任务状态
        task["status"] = status
        if video_url:
            task["video_url"] = video_url
            task["status"] = "completed"
        task["progress"] = progress

        result = {
            "task_id": task_id,
            "status": status,
            "video_url": video_url,
            "progress": progress,
        }
        if status == "failed":
            result["error"] = data.get("error", {}).get("message", data.get("message", "生成失败"))

        return result

    except Exception as e:
        # 查询失败，返回处理中状态
        return {"task_id": task_id, "status": "processing", "video_url": "", "progress": task.get("progress", 0), "error": str(e)}

def zgf_gen_publish(script, title=""):
    """为矩阵发布生成多平台标题和文案"""
    import re as _re
    prompt = f"""请根据以下短视频脚本，为多个平台生成适合发布的标题和文案。

【视频脚本】
{script[:2000]}

{f'【参考标题】{title}' if title else ''}

请为以下5个平台各生成1组标题和文案，严格返回JSON数组（不要markdown代码块）：
[
  {{
    "platform": "douyin",
    "platform_name": "抖音",
    "title": "标题（20字以内，带emoji）",
    "copy": "发布文案（50-100字，带标签）",
    "hashtags": ["#标签1", "#标签2", "#标签3"]
  }},
  {{
    "platform": "kuaishou",
    "platform_name": "快手",
    "title": "标题",
    "copy": "发布文案",
    "hashtags": ["#标签1", "#标签2"]
  }},
  {{
    "platform": "xiaohongshu",
    "platform_name": "小红书",
    "title": "标题（小红书风格，有emoji）",
    "copy": "笔记文案（小红书种草风格，分段落，带emoji）",
    "hashtags": ["#标签1", "#标签2", "#标签3"]
  }},
  {{
    "platform": "shipinhao",
    "platform_name": "视频号",
    "title": "标题",
    "copy": "简短发布文案",
    "hashtags": ["#标签1", "#标签2"]
  }},
  {{
    "platform": "bilibili",
    "platform_name": "B站",
    "title": "标题（B站风格）",
    "copy": "视频简介文案",
    "hashtags": ["#标签1", "#标签2"]
  }}
]"""
    try:
        raw = _call_doubao([
            {"role": "system", "content": "你是全平台内容运营专家，擅长为不同平台定制发布文案。只返回纯JSON数组，不要markdown代码块。"},
            {"role": "user", "content": prompt}
        ], temperature=0.8, max_tokens=3000)
        result = _parse_json(raw, "[")
        if isinstance(result, list):
            return {"platforms": result, "generate_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    except Exception as e1:
        try:
            raw = _call_qwen([
                {"role": "system", "content": "你是全平台内容运营专家。只返回纯JSON数组，不要markdown代码块。"},
                {"role": "user", "content": prompt}
            ], temperature=0.8, max_tokens=3000)
            result = _parse_json(raw, "[")
            if isinstance(result, list):
                return {"platforms": result, "generate_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        except Exception as e2:
            return {"error": f"发布文案生成失败: {e1} / {e2}"}
    return {"error": "发布文案生成失败，请重试"}

def main():
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    # 加载之前保存的任务
    _load_sora_tasks()
    print(f"[Sora2] 已加载 {len(_sora_tasks)} 个任务")

    # 启动后台轮询线程
    _start_sora_poll()

    port = 8899
    httpd = HTTPServer(("", port), Handler)
    print(f"\n{'='*50}")
    print(f"  AutoPipeline API Server 已启动")
    print(f"  API: http://localhost:{port}/api/")
    print(f"  Sora2: 支持 grsai/poloai/n1n/wuyin 服务商")
    print(f"{'='*50}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹ 服务器已停止")

if __name__ == "__main__":
    main()
