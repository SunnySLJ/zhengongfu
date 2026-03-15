#!/usr/bin/env python3
"""
② 剧本创意生成 - 基于热点自动生成短视频脚本
用法:
  python script_generator.py                     # 从 data/latest.json 读取热点
  python script_generator.py -i trends.json       # 指定热点文件
  python script_generator.py --topic "315晚会"    # 单个话题
  python script_generator.py --mock               # 模拟模式（不调用API）
  python script_generator.py -n 5                 # 只取前N个热点生成脚本
  python script_generator.py -o scripts.json      # 输出到文件
"""
import json, time, re, argparse, sys, os
from datetime import datetime

# ─── 配置 ───────────────────────────────────────────────────────────────────
QWEN_API_KEY = "sk-sp-432aa1b7751a4fea8e6425131ed89eb4"
QWEN_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
QWEN_MODEL    = "qwen3-coder-plus"
TIMESTAMP     = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
TODAY         = datetime.now().strftime("%Y年%m月%d日")

# ─── Qwen API 调用 ───────────────────────────────────────────────────────────
def call_qwen(prompt, max_tokens=3000):
    import urllib.request, urllib.error
    body = json.dumps({
        "model": QWEN_MODEL,
        "messages": [
            {"role": "system", "content": "你是专业短视频脚本策划师，擅长抖音、小红书爆款内容创作。只返回纯JSON，不要markdown代码块。"},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.85, "max_tokens": max_tokens,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{QWEN_BASE_URL}/chat/completions", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {QWEN_API_KEY}"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if "choices" in data and data["choices"]:
                return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        print(f"  ✗ HTTP {e.code}: {(e.read().decode()[:200] if e.fp else '')}", file=sys.stderr)
    except Exception as e:
        print(f"  ✗ {e}", file=sys.stderr)
    return None

def parse_json(text):
    if not text: return None
    c = re.sub(r'```(?:json)?\s*', '', text.strip()).strip()
    # 尝试对象
    s, e = c.find("{"), c.rfind("}")
    if s >= 0 and e > s:
        try: return json.loads(c[s:e+1])
        except: pass
    # 尝试数组
    s, e = c.find("["), c.rfind("]")
    if s >= 0 and e > s:
        try: return json.loads(c[s:e+1])
        except: pass
    return None

# ─── 脚本生成（单条热点）────────────────────────────────────────────────────
STYLE_MAP = {
    "科技": "干货知识", "财经": "干货知识", "政策": "新闻资讯",
    "国际": "新闻资讯", "社会": "情感共鸣", "娱乐": "娱乐搞笑",
    "体育": "激情励志", "生活": "生活vlog", "教育": "干货知识", "其他": "情感共鸣",
}
PLATFORM_MAP = {
    "科技": "B站", "财经": "抖音", "政策": "微博", "国际": "微博",
    "社会": "抖音", "娱乐": "抖音", "体育": "抖音", "生活": "小红书",
    "教育": "B站", "其他": "抖音",
}

def generate_script_real(topic_item):
    topic   = topic_item.get("title", "")
    cat     = topic_item.get("category", "其他")
    heat    = topic_item.get("heat", "")
    style   = STYLE_MAP.get(cat, "情感共鸣")
    plat    = PLATFORM_MAP.get(cat, "抖音")

    print(f"  ✍️  {topic[:30]}...", end=" ", flush=True)
    prompt = f"""为以下热点话题创作一个60秒短视频脚本，目标平台：{plat}，风格：{style}。

热点话题：{topic}
热度：{heat}
分类：{cat}
日期：{TODAY}

严格返回以下JSON结构（只返回JSON，不要任何其他文字）：
{{
  "topic": "{topic}",
  "category": "{cat}",
  "platform_target": "{plat}",
  "style": "{style}",
  "title": "吸引人的视频标题（15字以内）",
  "hook": "前3秒开场钩子（制造悬念/冲突/好奇心，20字以内）",
  "segments": [
    {{"time": "0-3s",  "type": "hook",     "text": "开场钩子文案", "visual": "画面描述"}},
    {{"time": "3-15s", "type": "conflict", "text": "冲突/痛点文案", "visual": "画面描述"}},
    {{"time": "15-45s","type": "content",  "text": "核心内容文案（100字以内）", "visual": "画面描述"}},
    {{"time": "45-60s","type": "cta",      "text": "行动号召文案（20字以内）", "visual": "画面描述"}}
  ],
  "hashtags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"],
  "bgm_style": "背景音乐风格（如：激昂/轻松/悬疑/治愈）",
  "conversion_goal": "涨粉|带货|品牌|流量",
  "difficulty": "低|中|高",
  "estimated_views": "预估播放量（如：10万-50万）"
}}"""

    t0  = time.time()
    raw = call_qwen(prompt)
    dt  = time.time() - t0
    if not raw:
        print(f"✗ ({dt:.1f}s)")
        return None
    obj = parse_json(raw)
    if obj and isinstance(obj, dict) and "title" in obj:
        obj["generate_time"] = TIMESTAMP
        obj["raw_rank"]      = topic_item.get("rank", 0)
        obj["raw_heat"]      = heat
        print(f"✓ 《{obj['title'][:20]}》({dt:.1f}s)")
        return obj
    print(f"⚠ 解析失败 ({dt:.1f}s)")
    return None

# ─── 模拟脚本数据 ────────────────────────────────────────────────────────────
MOCK_SCRIPTS = [
  {
    "topic": "#315晚会今晚直播#", "category": "社会", "platform_target": "抖音",
    "style": "情感共鸣", "title": "315晚会这次会曝光谁？",
    "hook": "你上次被坑过吗？今晚可能有答案！",
    "segments": [
      {"time": "0-3s",  "type": "hook",     "text": "年年315，哪次让你最心痛？", "visual": "315晚会历年截图快速闪过"},
      {"time": "3-15s", "type": "conflict", "text": "你用过的品牌，今晚可能上榜！", "visual": "超市商品货架扫描镜头"},
      {"time": "15-45s","type": "content",  "text": "今晚直播间315晚会，历年曝光行业：食品安全83次、医疗美容47次、金融理财32次。今年新增关注：AI应用安全、外卖食品……", "visual": "数据可视化动画"},
      {"time": "45-60s","type": "cta",      "text": "关注我，今晚直播间一起守护权益！", "visual": "直播间引导界面"}
    ],
    "hashtags": ["#315晚会", "#消费者权益", "#避坑指南", "#今晚直播", "#315曝光"],
    "bgm_style": "紧张悬疑", "conversion_goal": "涨粉",
    "difficulty": "低", "estimated_views": "50万-200万",
    "generate_time": TIMESTAMP, "raw_rank": 1, "raw_heat": "热 9.8亿"
  },
  {
    "topic": "#微信三大功能更新#", "category": "科技", "platform_target": "B站",
    "style": "干货知识", "title": "微信悄悄更新，你发现了吗？",
    "hook": "10亿人用的App，这3个功能你不知道？",
    "segments": [
      {"time": "0-3s",  "type": "hook",     "text": "微信刚更新，90%的人不知道这个功能！", "visual": "手机屏幕微信界面特写"},
      {"time": "3-15s", "type": "conflict", "text": "被领导拉群、深夜骚扰电话……你有没有这种困扰？", "visual": "情景再现：深夜手机来电"},
      {"time": "15-45s","type": "content",  "text": "功能①忽略来电：静音但不拒接，对方不知道。功能②长文转发：原格式不变形。功能③…", "visual": "手机操作实录演示"},
      {"time": "45-60s","type": "cta",      "text": "三连收藏，下次用得到！", "visual": "点赞收藏动画"}
    ],
    "hashtags": ["#微信新功能", "#微信技巧", "#手机技巧", "#科技分享", "#数码"],
    "bgm_style": "轻快活泼", "conversion_goal": "涨粉",
    "difficulty": "低", "estimated_views": "20万-100万",
    "generate_time": TIMESTAMP, "raw_rank": 4, "raw_heat": "热 4.6亿"
  },
  {
    "topic": "#理想官宣下半年推出理想i9#", "category": "财经", "platform_target": "抖音",
    "style": "干货知识", "title": "理想i9定价50万+，值吗？",
    "hook": "理想要出50万的车！买还是不买？",
    "segments": [
      {"time": "0-3s",  "type": "hook",     "text": "理想i9即将上市，你猜多少钱？", "visual": "理想i9渲染图动态展示"},
      {"time": "3-15s", "type": "conflict", "text": "50万买理想，还是BBA？你会怎么选？", "visual": "分屏对比：i9 vs 奔驰GLS vs 宝马X7"},
      {"time": "15-45s","type": "content",  "text": "理想i9：6座纯电旗舰SUV，预计续航800km+，大五座空间，华为智驾合作……同价位对手竟然是劳斯莱斯！", "visual": "参数对比动画"},
      {"time": "45-60s","type": "cta",      "text": "你会买吗？评论区告诉我！", "visual": "评论区互动引导"}
    ],
    "hashtags": ["#理想i9", "#理想汽车", "#新能源SUV", "#50万买什么车", "#汽车测评"],
    "bgm_style": "大气磅礴", "conversion_goal": "流量",
    "difficulty": "中", "estimated_views": "30万-150万",
    "generate_time": TIMESTAMP, "raw_rank": 3, "raw_heat": "热 3.1亿"
  },
  {
    "topic": "#黄金价格创历史新高#", "category": "财经", "platform_target": "抖音",
    "style": "干货知识", "title": "黄金暴涨！现在还能买吗？",
    "hook": "你妈囤的黄金涨了多少？我算了一下…",
    "segments": [
      {"time": "0-3s",  "type": "hook",     "text": "黄金又创新高！你妈已经赚了多少钱？", "visual": "金价K线图向上突破动画"},
      {"time": "3-15s", "type": "conflict", "text": "你说买买买，她说等等等，结果……", "visual": "情景对话漫画"},
      {"time": "15-45s","type": "content",  "text": "3年前580/克，现在已超过780/克。10克金条：涨了2000元。一条金链100克：涨了2万！但分析师说：仍有上涨空间……", "visual": "计算器动画+数字对比"},
      {"time": "45-60s","type": "cta",      "text": "想知道黄金投资攻略？关注我！", "visual": "引导关注界面"}
    ],
    "hashtags": ["#黄金价格", "#黄金投资", "#黄金涨价", "#理财", "#投资"],
    "bgm_style": "紧张上升", "conversion_goal": "涨粉",
    "difficulty": "低", "estimated_views": "80万-300万",
    "generate_time": TIMESTAMP, "raw_rank": 8, "raw_heat": "热 1.8亿"
  },
  {
    "topic": "#AI养虾装虾499卸载299#", "category": "科技", "platform_target": "B站",
    "style": "娱乐搞笑", "title": "AI养虾翻车现场，我没忍住笑了",
    "hook": "程序员用AI养虾，结果虾死了，AI没死",
    "segments": [
      {"time": "0-3s",  "type": "hook",     "text": "程序员花1000块让AI养虾，出大事了！", "visual": "虾缸+代码界面分屏特写"},
      {"time": "3-15s", "type": "conflict", "text": "499买AI养虾系统，还要299卸载费？虾死了他哭了", "visual": "截图+弹幕刷屏动画"},
      {"time": "15-45s","type": "content",  "text": "事情经过：某程序员花499元购买AI虾苗监控系统，AI过度投喂，虾全死。联系客服：卸载需另付299元。帖子发出……一夜3000条评论", "visual": "事件时间线动画"},
      {"time": "45-60s","type": "cta",      "text": "AI消费陷阱，你踩过吗？评论区说！", "visual": "评论区弹幕飞过"}
    ],
    "hashtags": ["#AI养虾", "#科技翻车", "#消费维权", "#315", "#AI应用"],
    "bgm_style": "轻松搞笑", "conversion_goal": "流量",
    "difficulty": "低", "estimated_views": "100万-500万",
    "generate_time": TIMESTAMP, "raw_rank": 2, "raw_heat": "热 5.2亿"
  },
]

def generate_script_mock(topic_item):
    topic = topic_item.get("title", "")
    print(f"  ✍️  {topic[:30]}...", end=" ", flush=True)
    time.sleep(0.1)
    # 找最近似的mock
    for m in MOCK_SCRIPTS:
        if any(w in topic for w in m["topic"].replace("#","").split()):
            print(f"✓ 《{m['title']}》(mock)")
            return dict(m, topic=topic, raw_rank=topic_item.get("rank",0), raw_heat=topic_item.get("heat",""))
    # fallback：返回第一个
    m = MOCK_SCRIPTS[0]
    print(f"✓ 《{m['title']}》(mock-fallback)")
    return dict(m, topic=topic, raw_rank=topic_item.get("rank",0), raw_heat=topic_item.get("heat",""))

# ─── 批量生成 ────────────────────────────────────────────────────────────────
def generate_scripts(topics, n=10, mock=False):
    """从话题列表生成脚本，n 为最多数量"""
    targets = topics[:n]
    mode    = "模拟" if mock else "千问API"
    print(f"\n✍️  剧本创意生成 | 模式: {mode} | 数量: {len(targets)} 个话题\n")
    results, failed = [], 0
    for i, topic in enumerate(targets, 1):
        print(f"  [{i:02d}/{len(targets)}]", end=" ")
        fn = generate_script_mock if mock else generate_script_real
        s  = fn(topic)
        if s:
            results.append(s)
        else:
            failed += 1
        if not mock:
            time.sleep(1.5)
    print(f"\n📊 完成: {len(results)} 个脚本 / {failed} 个失败")
    return results

def load_topics_from_file(path):
    """从 JSON 文件中加载热点话题"""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    topics = []
    if isinstance(data, list):
        for plat in data:
            if isinstance(plat, dict) and "trends" in plat:
                topics.extend(plat["trends"])
            elif isinstance(plat, dict) and "title" in plat:
                topics.append(plat)
    return topics

# ─── HTML 报告 ───────────────────────────────────────────────────────────────
CONV_COLORS = {"涨粉":"#7B61FF","带货":"#FF6B35","品牌":"#00C9A7","流量":"#FFB300"}
DIFF_COLORS = {"低":"#4ADE80","中":"#FFB300","高":"#FF4081"}

def generate_html(scripts, path):
    cards = ""
    for s in scripts:
        segs = "".join(
            f'<div style="display:flex;gap:10px;margin-bottom:8px">'
            f'<span style="min-width:52px;font-size:10px;color:#8A94A6;font-family:monospace;padding-top:2px">{sg["time"]}</span>'
            f'<div><div style="font-size:12px;font-weight:600;color:#C5CDD8;margin-bottom:2px">{sg["text"]}</div>'
            f'<div style="font-size:11px;color:#4A5568">📷 {sg.get("visual","")}</div></div></div>'
            for sg in s.get("segments", [])
        )
        tags = " ".join(f'<span style="font-size:10px;color:#7B61FF;background:rgba(123,97,255,0.1);padding:2px 7px;border-radius:4px;border:1px solid rgba(123,97,255,0.2)">{t}</span>' for t in s.get("hashtags",[]))
        cc = CONV_COLORS.get(s.get("conversion_goal",""),"#8A94A6")
        dc = DIFF_COLORS.get(s.get("difficulty",""),"#8A94A6")
        cards += f'''
<div style="background:#0C1119;border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:20px;overflow:hidden">
  <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.05);border-left:4px solid #7B61FF">
    <span style="font-size:22px">✍️</span>
    <div style="flex:1">
      <div style="font-size:16px;font-weight:700">{s.get("title","")}</div>
      <div style="font-size:11px;color:#8A94A6;margin-top:2px">{s.get("topic","")[:40]} · {s.get("platform_target","")} · {s.get("style","")}</div>
    </div>
    <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:5px;color:{cc};background:{cc}15;border:1px solid {cc}30">{s.get("conversion_goal","")}</span>
    <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:5px;color:{dc};background:{dc}15;border:1px solid {dc}30">难度:{s.get("difficulty","")}</span>
  </div>
  <div style="padding:16px 18px">
    <div style="font-size:13px;font-weight:700;color:#FF6B35;margin-bottom:10px;padding:8px 12px;background:rgba(255,107,53,0.08);border-radius:8px;border-left:3px solid #FF6B35">
      🎣 开场钩子：{s.get("hook","")}
    </div>
    <div style="margin-bottom:12px">{segs}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">{tags}</div>
    <div style="display:flex;gap:12px;font-size:11px;color:#4A5568">
      <span>🎵 BGM: {s.get("bgm_style","")}</span>
      <span>📈 预估: {s.get("estimated_views","")}</span>
      <span>⏱ 热度: {s.get("raw_heat","")}</span>
    </div>
  </div>
</div>'''
    html = f'''<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>剧本创意 {TODAY}</title>
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:"PingFang SC",sans-serif;background:#06090F;color:#EDF0F5;padding:0}}</style>
</head><body>
<div style="text-align:center;padding:32px 20px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
  <h1 style="font-size:26px;font-weight:900;margin-bottom:6px">✍️ 剧本创意中心</h1>
  <div style="font-size:13px;color:#4A5568;margin-bottom:10px">{TODAY} · 通义千问 · {len(scripts)} 个脚本</div>
</div>
<div style="max-width:900px;margin:0 auto;padding:20px">{cards}</div>
<div style="text-align:center;padding:20px;font-size:11px;color:#3F4E63">AutoPipeline · {TIMESTAMP}</div>
</body></html>'''
    with open(path, "w", encoding="utf-8") as f: f.write(html)
    print(f"📄 HTML: {path}")

# ─── main ────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="剧本创意生成")
    ap.add_argument("-i", "--input",   type=str, help="热点JSON文件路径（默认 data/latest.json）")
    ap.add_argument("--topic",         type=str, help="直接输入话题文字")
    ap.add_argument("-n",              type=int, default=5, help="最多生成脚本数量（默认5）")
    ap.add_argument("-o", "--output",  type=str, help="输出JSON路径")
    ap.add_argument("--html",          type=str, help="输出HTML报告路径")
    ap.add_argument("--mock", action="store_true", help="模拟模式（不调用API）")
    a = ap.parse_args()

    if a.topic:
        topics = [{"title": a.topic, "rank": 1, "heat": "", "category": "其他"}]
    else:
        inp = a.input or os.path.join(os.path.dirname(__file__), "..", "data", "latest.json")
        if not os.path.exists(inp):
            print(f"⚠ 找不到热点数据文件: {inp}")
            print("  请先运行 python daily_fetch.py 采集热点，或使用 --mock 模式")
            sys.exit(1)
        topics = load_topics_from_file(inp)
        print(f"📥 从 {inp} 加载了 {len(topics)} 个热点")

    scripts = generate_scripts(topics, n=a.n, mock=a.mock)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M")
    out_json = a.output or os.path.join(out_dir, f"scripts_{ts}.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(scripts, f, ensure_ascii=False, indent=2)
    # 更新 latest
    with open(os.path.join(out_dir, "latest_scripts.json"), "w", encoding="utf-8") as f:
        json.dump(scripts, f, ensure_ascii=False, indent=2)
    print(f"💾 JSON: {out_json}")

    out_html = a.html or os.path.join(out_dir, f"scripts_{ts}.html")
    generate_html(scripts, out_html)
    with open(os.path.join(out_dir, "latest_scripts.html"), "w", encoding="utf-8") as f2:
        pass  # 再调一次
    generate_html(scripts, os.path.join(out_dir, "latest_scripts.html"))

if __name__ == "__main__":
    main()
