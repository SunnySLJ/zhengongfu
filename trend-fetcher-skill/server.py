#!/usr/bin/env python3
"""
AutoPipeline Web Server
用法: python3 server.py
然后浏览器打开 http://localhost:8080
"""
import json, os, sys, subprocess, threading, time, queue
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from datetime import datetime
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts"))

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, "data")
WEB_DIR   = os.path.join(BASE_DIR, "web")
os.makedirs(DATA_DIR, exist_ok=True)

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
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path, ctype="text/html; charset=utf-8"):
        if not os.path.exists(path):
            self.send_response(404); self.end_headers(); return
        with open(path, "rb") as f: body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.end_headers()

    def do_GET(self):
        p = urlparse(self.path)
        path = p.path
        qs   = parse_qs(p.query)

        # ── 静态页面
        if path in ("/", "/index.html"):
            self.send_file(os.path.join(WEB_DIR, "index.html"))
            return

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

        # ── HTML 报告文件
        if path.startswith("/reports/"):
            fname = path[9:]
            self.send_file(os.path.join(DATA_DIR, fname), "text/html; charset=utf-8")
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

        self.send_response(404); self.end_headers()

def main():
    port = 8080
    httpd = HTTPServer(("", port), Handler)
    print(f"\n{'='*50}")
    print(f"  🚀 AutoPipeline Web Server 已启动")
    print(f"  🌐 浏览器打开: http://localhost:{port}")
    print(f"{'='*50}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹ 服务器已停止")

if __name__ == "__main__":
    main()
