#!/usr/bin/env python3
"""
🔍 热点深度分析 - 豆包 API
点击热点后调用豆包生成：背景/内容方向/受众/钩子/变现方式
"""
import json, re, sys, time, os, urllib.request, urllib.error
from datetime import datetime

# 千问（主力，默认）
QWEN_API_KEY  = "sk-sp-432aa1b7751a4fea8e6425131ed89eb4"
QWEN_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
QWEN_MODEL    = "qwen3-coder-plus"

# 豆包（备用）
DOUBAO_API_KEY     = os.environ.get("DOUBAO_API_KEY", "api-key-20250402164055")
DOUBAO_BASE_URL    = "https://ark.cn-beijing.volces.com/api/v3"
DOUBAO_ENDPOINT_ID = "6f876e44-60d3-4a87-8669-44d2f809b12e"   # 推理接入点 ID
DOUBAO_MODELS      = [DOUBAO_ENDPOINT_ID, "doubao-pro-32k", "doubao-1-5-pro-32k"]

TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# ─── 找到可用模型 ─────────────────────────────────────────────────────────────
_active_model = None

def _find_model():
    global _active_model
    if _active_model:
        return _active_model
    for model in DOUBAO_MODELS:
        body = json.dumps({"model": model,
                           "messages": [{"role": "user", "content": "hi"}],
                           "max_tokens": 5}).encode()
        req = urllib.request.Request(
            f"{DOUBAO_BASE_URL}/chat/completions", data=body,
            headers={"Content-Type": "application/json",
                     "Authorization": f"Bearer {DOUBAO_API_KEY}"},
            method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                _active_model = model
                return model
        except urllib.error.HTTPError as e:
            err = e.read().decode()[:100]
            if "not found" in err.lower() or "model" in err.lower():
                continue
            # 其他错误（如鉴权问题）直接返回第一个
            _active_model = model
            return model
        except Exception:
            continue
    _active_model = DOUBAO_MODELS[0]
    return _active_model

# ─── 调用豆包 ─────────────────────────────────────────────────────────────────
def _http_llm(base_url, api_key, model, prompt, max_tokens, extra=None):
    payload = {"model": model, "messages": [
        {"role": "system", "content": "你是资深短视频内容策划，专注抖音小红书爆款内容研究。只返回纯JSON，不要markdown代码块。"},
        {"role": "user",   "content": prompt}
    ], "temperature": 0.8, "max_tokens": max_tokens}
    if extra:
        payload.update(extra)
    body = json.dumps(payload).encode()
    req = urllib.request.Request(f"{base_url}/chat/completions", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, method="POST")
    with urllib.request.urlopen(req, timeout=90) as r:
        resp = json.loads(r.read())
        return resp["choices"][0]["message"]["content"]

def call_llm(prompt, max_tokens=3000):
    """优先千问，失败降级豆包"""
    global _active_model
    # 主力：千问（关闭思考模式，避免超时）
    try:
        result = _http_llm(QWEN_BASE_URL, QWEN_API_KEY, QWEN_MODEL, prompt, max_tokens,
                           extra={"enable_thinking": False})
        _active_model = QWEN_MODEL
        return result
    except Exception as ex:
        print(f"  [Qwen] {ex}, 切换豆包...", file=sys.stderr)
    # 备用：豆包（使用推理接入点 ID）
    try:
        result = _http_llm(DOUBAO_BASE_URL, DOUBAO_API_KEY, DOUBAO_ENDPOINT_ID, prompt, max_tokens)
        _active_model = DOUBAO_ENDPOINT_ID
        return result
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:200]
        print(f"  [Doubao] HTTP {e.code} ({err[:80]})", file=sys.stderr)
    except Exception as ex:
        print(f"  [Doubao] {ex}", file=sys.stderr)
    return None

# 兼容旧调用名
def call_doubao(prompt, max_tokens=3000):
    return call_llm(prompt, max_tokens)

def parse_json(text):
    if not text: return None
    c = re.sub(r'```(?:json)?\s*', '', text.strip()).strip()
    for ch_s, ch_e in [('{', '}'), ('[', ']')]:
        s, e = c.find(ch_s), c.rfind(ch_e)
        if s >= 0 and e > s:
            try: return json.loads(c[s:e+1])
            except: pass
    return None

# ─── 核心：生成热点详细分析 ───────────────────────────────────────────────────
def analyze_topic(title: str, heat: str = "", category: str = "", platform: str = "") -> dict:
    """调用豆包对单条热点做深度分析"""
    today = datetime.now().strftime("%Y年%m月%d日")
    prompt = f"""请对以下热点话题做深度内容策划分析，今天是{today}。

热点话题：{title}
热度数据：{heat}
内容分类：{category}
来源平台：{platform}

严格返回以下JSON（只返回JSON，不要任何其他文字）：
{{
  "topic": "{title}",
  "background": "话题背景介绍（100字以内，说明为什么火、事件起因）",
  "heat_reason": "为什么会上热搜？核心原因（50字以内）",
  "content_angles": [
    {{"angle": "内容方向名称", "desc": "具体做什么内容（30字）", "difficulty": "低|中|高", "viral_potential": "低|中|高"}},
    {{"angle": "内容方向名称", "desc": "具体做什么内容（30字）", "difficulty": "低|中|高", "viral_potential": "低|中|高"}},
    {{"angle": "内容方向名称", "desc": "具体做什么内容（30字）", "difficulty": "低|中|高", "viral_potential": "低|中|高"}},
    {{"angle": "内容方向名称", "desc": "具体做什么内容（30字）", "difficulty": "低|中|高", "viral_potential": "低|中|高"}}
  ],
  "target_audience": "目标受众画像（年龄/性别/关注点，40字）",
  "best_platforms": ["平台1", "平台2", "平台3"],
  "hook_sentences": [
    "开场钩子句1（15字以内，制造好奇/冲突/共鸣）",
    "开场钩子句2",
    "开场钩子句3"
  ],
  "monetization": [
    {{"method": "变现方式", "desc": "具体操作（25字）"}},
    {{"method": "变现方式", "desc": "具体操作（25字）"}}
  ],
  "best_post_time": "最佳发布时段（如：18:00-21:00）",
  "trend_duration": "热点持续预估（如：3天 / 1周 / 持续热点）",
  "risk_warning": "注意事项或风险提示（30字）",
  "urgency": "high|medium|low",
  "score": 85
}}"""

    t0  = time.time()
    raw = call_llm(prompt, max_tokens=2000)
    dt  = time.time() - t0
    obj = parse_json(raw)
    if obj and isinstance(obj, dict) and "content_angles" in obj:
        obj["_analyze_time_s"] = round(dt, 1)
        obj["_model"]          = _active_model or QWEN_MODEL
        obj["_timestamp"]      = TIMESTAMP
        return obj
    # fallback
    return _fallback_analysis(title, heat, category, dt)

def _fallback_analysis(title, heat, category, dt):
    """API失败时的降级数据"""
    return {
        "topic":           title,
        "background":      f"「{title[:30]}」正在全网热议，{heat}。",
        "heat_reason":     "话题与大众生活高度相关，引发广泛讨论。",
        "content_angles": [
            {"angle": "事件解说", "desc": "用通俗语言解释事件来龙去脉", "difficulty": "低", "viral_potential": "高"},
            {"angle": "观点评论", "desc": "表达独特见解引发共鸣讨论",   "difficulty": "低", "viral_potential": "中"},
            {"angle": "科普延伸", "desc": "以此话题延伸相关知识干货",   "difficulty": "中", "viral_potential": "中"},
            {"angle": "情感共鸣", "desc": "结合个人经历引发情感共鸣",   "difficulty": "低", "viral_potential": "高"},
        ],
        "target_audience": "18-35岁，关注热点资讯的活跃网友",
        "best_platforms":  ["抖音", "微博", "B站"],
        "hook_sentences":  [f"关于「{title[:15]}」你知道真相吗？",
                            "这件事比你想的复杂得多！",
                            "看完这个，你的看法会改变..."],
        "monetization": [
            {"method": "流量变现", "desc": "借热点涨粉后接商业推广"},
            {"method": "直播带货", "desc": "结合话题开播引流转化"},
        ],
        "best_post_time":  "18:00-22:00",
        "trend_duration":  "2-3天",
        "risk_warning":    "注意话题敏感性，避免主观评价引发争议",
        "urgency":         "high",
        "score":           78,
        "_analyze_time_s": round(dt, 1),
        "_model":          "fallback",
        "_timestamp":      TIMESTAMP,
        "_fallback":       True,
    }

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic",    type=str, default="#315晚会今晚直播#")
    ap.add_argument("--heat",     type=str, default="热 9.8亿")
    ap.add_argument("--category", type=str, default="社会")
    a = ap.parse_args()
    print(f"分析话题: {a.topic}")
    result = analyze_topic(a.topic, a.heat, a.category)
    print(json.dumps(result, ensure_ascii=False, indent=2))
