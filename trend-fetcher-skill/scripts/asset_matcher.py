#!/usr/bin/env python3
"""
③ 素材匹配 - 基于脚本关键词匹配素材库
用法:
  python asset_matcher.py                          # 从 data/latest_scripts.json 读取脚本
  python asset_matcher.py -i scripts.json          # 指定脚本文件
  python asset_matcher.py --mock                   # 模拟模式
  python asset_matcher.py -o matched.json          # 输出文件
"""
import json, re, os, sys, argparse, time
from datetime import datetime

TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
TODAY     = datetime.now().strftime("%Y年%m月%d日")

# ─── 模拟素材库（真实项目可替换为 Milvus/Pinecone 等向量库）────────────────
# 素材类型: video/music/image/effect/template
ASSET_LIBRARY = {
    # ── 视频素材 ──
    "v001": {"id":"v001","type":"video","name":"城市夜景延时摄影","duration":15,"tags":["城市","夜景","科技","繁华"],"resolution":"4K","size_mb":280},
    "v002": {"id":"v002","type":"video","name":"手机操作特写镜头","duration":8, "tags":["手机","科技","操作","APP","微信"],"resolution":"1080P","size_mb":120},
    "v003": {"id":"v003","type":"video","name":"K线图金融数据动画","duration":10,"tags":["金融","财经","数据","股票","黄金","基金"],"resolution":"1080P","size_mb":95},
    "v004": {"id":"v004","type":"video","name":"超市购物货架","duration":12,"tags":["购物","消费","超市","生活","315"],"resolution":"4K","size_mb":210},
    "v005": {"id":"v005","type":"video","name":"汽车驾驶风景","duration":20,"tags":["汽车","驾驶","公路","风景","新能源"],"resolution":"4K","size_mb":380},
    "v006": {"id":"v006","type":"video","name":"办公室工作场景","duration":15,"tags":["办公","工作","职场","电脑","程序员"],"resolution":"1080P","size_mb":175},
    "v007": {"id":"v007","type":"video","name":"体育赛场观众热情","duration":10,"tags":["体育","赛场","观众","运动","乒乓球","F1"],"resolution":"4K","size_mb":265},
    "v008": {"id":"v008","type":"video","name":"食材烹饪特写","duration":12,"tags":["美食","烹饪","食材","生活","vlog"],"resolution":"4K","size_mb":195},
    "v009": {"id":"v009","type":"video","name":"新闻播报背景","duration":8, "tags":["新闻","资讯","媒体","播报","社会"],"resolution":"1080P","size_mb":88},
    "v010": {"id":"v010","type":"video","name":"AI机器人动画","duration":15,"tags":["AI","人工智能","科技","未来","机器人"],"resolution":"1080P","size_mb":145},
    "v011": {"id":"v011","type":"video","name":"黄金首饰特写","duration":8, "tags":["黄金","首饰","投资","财富","珠宝"],"resolution":"4K","size_mb":110},
    "v012": {"id":"v012","type":"video","name":"海鲜水产养殖","duration":12,"tags":["虾","海鲜","养殖","水产","农业"],"resolution":"1080P","size_mb":155},
    "v013": {"id":"v013","type":"video","name":"国际政治地图动画","duration":10,"tags":["国际","政治","地图","军事","外交"],"resolution":"1080P","size_mb":92},
    "v014": {"id":"v014","type":"video","name":"校园学习场景","duration":15,"tags":["教育","学习","校园","考试","学生"],"resolution":"1080P","size_mb":168},
    "v015": {"id":"v015","type":"video","name":"穿搭展示走秀","duration":20,"tags":["穿搭","时尚","美妆","生活","小红书"],"resolution":"4K","size_mb":285},
    "v016": {"id":"v016","type":"video","name":"数据中心服务器","duration":12,"tags":["科技","服务器","数据","云计算","AI"],"resolution":"4K","size_mb":198},
    "v017": {"id":"v017","type":"video","name":"人群街头采访","duration":15,"tags":["社会","采访","人群","街头","民生"],"resolution":"1080P","size_mb":162},
    "v018": {"id":"v018","type":"video","name":"赛车极速行驶","duration":8, "tags":["F1","赛车","速度","体育","竞技"],"resolution":"4K","size_mb":220},
    # ── 音乐素材 ──
    "m001": {"id":"m001","type":"music","name":"震撼史诗开场","duration":180,"tags":["震撼","大气","激昂","开场","磅礴"],"bpm":128,"mood":"激昂"},
    "m002": {"id":"m002","type":"music","name":"轻快科技节拍","duration":180,"tags":["科技","轻快","现代","数字","节奏"],"bpm":120,"mood":"活泼"},
    "m003": {"id":"m003","type":"music","name":"紧张悬疑背景","duration":120,"tags":["悬疑","紧张","神秘","钩子","冲突"],"bpm":90,"mood":"悬疑"},
    "m004": {"id":"m004","type":"music","name":"温暖治愈钢琴","duration":180,"tags":["治愈","温暖","情感","生活","vlog"],"bpm":75,"mood":"治愈"},
    "m005": {"id":"m005","type":"music","name":"搞笑卡通音效","duration":60, "tags":["搞笑","幽默","可爱","娱乐","卡通"],"bpm":140,"mood":"搞笑"},
    "m006": {"id":"m006","type":"music","name":"金融财经节拍","duration":120,"tags":["财经","金融","商务","数据","专业"],"bpm":100,"mood":"专业"},
    "m007": {"id":"m007","type":"music","name":"体育励志鼓点","duration":180,"tags":["体育","运动","励志","激情","竞技"],"bpm":135,"mood":"激励"},
    "m008": {"id":"m008","type":"music","name":"新闻播报音效","duration":30, "tags":["新闻","资讯","正式","播报","媒体"],"bpm":80,"mood":"正式"},
    # ── 图片素材 ──
    "i001": {"id":"i001","type":"image","name":"数据可视化模板","tags":["数据","图表","分析","统计","信息图"],"format":"PNG","size_mb":5},
    "i002": {"id":"i002","type":"image","name":"社交媒体图标集","tags":["微博","抖音","微信","社交","平台","APP"],"format":"PNG","size_mb":3},
    "i003": {"id":"i003","type":"image","name":"黄金价格走势图","tags":["黄金","价格","走势","投资","财经"],"format":"PNG","size_mb":4},
    "i004": {"id":"i004","type":"image","name":"315消费者标志","tags":["315","消费","权益","维权","社会"],"format":"PNG","size_mb":2},
    "i005": {"id":"i005","type":"image","name":"AI芯片概念图","tags":["AI","芯片","科技","智能","未来"],"format":"PNG","size_mb":6},
    "i006": {"id":"i006","type":"image","name":"汽车品牌对比表","tags":["汽车","对比","品牌","新能源","理想"],"format":"PNG","size_mb":4},
    # ── 特效素材 ──
    "e001": {"id":"e001","type":"effect","name":"数字粒子爆炸","duration":3,"tags":["科技","科幻","粒子","转场","震撼"]},
    "e002": {"id":"e002","type":"effect","name":"金币飞溅特效","duration":2,"tags":["金融","财富","黄金","金钱","财经"]},
    "e003": {"id":"e003","type":"effect","name":"弹幕飞过动画","duration":5,"tags":["弹幕","互动","B站","评论","娱乐"]},
    "e004": {"id":"e004","type":"effect","name":"红色预警闪烁","duration":2,"tags":["预警","危险","紧急","新闻","社会"]},
    "e005": {"id":"e005","type":"effect","name":"点赞收藏动画","duration":3,"tags":["CTA","关注","点赞","互动","收藏"]},
    "e006": {"id":"e006","type":"effect","name":"数字计数器","duration":4,"tags":["数据","统计","计数","增长","数字"]},
    # ── 模板素材 ──
    "t001": {"id":"t001","type":"template","name":"热榜话题封面模板","tags":["热搜","热榜","封面","标题","排行"]},
    "t002": {"id":"t002","type":"template","name":"干货知识分享模板","tags":["干货","教程","知识","分享","科普"]},
    "t003": {"id":"t003","type":"template","name":"新闻资讯播报模板","tags":["新闻","资讯","播报","时事","热点"]},
    "t004": {"id":"t004","type":"template","name":"产品测评对比模板","tags":["测评","对比","产品","推荐","避坑"]},
    "t005": {"id":"t005","type":"template","name":"情感故事竖版模板","tags":["情感","故事","共鸣","vlog","生活"]},
}

ASSET_LIST = list(ASSET_LIBRARY.values())

# ─── 关键词匹配 ──────────────────────────────────────────────────────────────
def score_asset(asset, keywords):
    """计算素材与关键词列表的匹配分数"""
    tags = set(t.lower() for t in asset.get("tags", []))
    score = 0
    for kw in keywords:
        kw_l = kw.lower()
        if kw_l in tags:
            score += 3  # 精确匹配
        else:
            for tag in tags:
                if kw_l in tag or tag in kw_l:
                    score += 1  # 部分匹配
    return score

def extract_keywords(script):
    """从脚本中提取关键词"""
    kws = []
    # 从 topic
    topic = re.sub(r'#|\s', '', script.get("topic", ""))
    kws.extend(re.findall(r'[\u4e00-\u9fa5]{2,5}', topic))
    # 从 category
    cat = script.get("category", "")
    if cat: kws.append(cat)
    # 从 style
    style = script.get("style", "")
    if style: kws.append(style)
    # 从 hashtags
    for ht in script.get("hashtags", []):
        kws.extend(re.findall(r'[\u4e00-\u9fa5A-Za-z0-9]{2,}', ht.replace("#","")))
    # 从 bgm_style
    bgm = script.get("bgm_style", "")
    if bgm: kws.append(bgm)
    # 从 conversion_goal
    goal = script.get("conversion_goal", "")
    if goal: kws.append(goal)
    # 从 segments
    for seg in script.get("segments", []):
        text = seg.get("text", "")
        kws.extend(re.findall(r'[\u4e00-\u9fa5]{2,4}', text)[:5])
    return list(set(kws))

def match_assets_for_script(script, top_n=6):
    """为单个脚本匹配最合适的素材"""
    keywords = extract_keywords(script)
    scored   = []
    for asset in ASSET_LIST:
        s = score_asset(asset, keywords)
        if s > 0:
            scored.append((s, asset))
    scored.sort(key=lambda x: -x[0])

    # 按类型分配：2视频 + 1音乐 + 1图片 + 1特效 + 1模板
    type_quota = {"video":2,"music":1,"image":1,"effect":1,"template":1}
    type_count = {t:0 for t in type_quota}
    matched = []
    for score, asset in scored:
        t = asset["type"]
        if type_count.get(t,0) < type_quota.get(t,0):
            matched.append({**asset, "match_score": score, "match_keywords": keywords[:5]})
            type_count[t] = type_count.get(t,0) + 1
        if len(matched) >= top_n: break

    # 补充不足的类型（用分数最低的也加进来）
    if len(matched) < top_n:
        for _, asset in scored:
            if len(matched) >= top_n: break
            if not any(m["id"]==asset["id"] for m in matched):
                matched.append({**asset, "match_score": 1, "match_keywords": keywords[:3]})

    return {"script_title": script.get("title",""), "topic": script.get("topic",""),
            "keywords_used": keywords, "matched_assets": matched,
            "match_time_ms": round(20 + len(keywords)*3, 0), "match_time": TIMESTAMP}

def match_all(scripts, mock=False):
    mode = "模拟" if mock else "关键词匹配"
    print(f"\n🎯 素材匹配 | 模式: {mode} | 素材库: {len(ASSET_LIST)} 件\n")
    results = []
    for i, script in enumerate(scripts, 1):
        title = script.get("title", "")[:20]
        print(f"  [{i:02d}/{len(scripts)}] 🎯 {title}...", end=" ", flush=True)
        t0 = time.time()
        r  = match_assets_for_script(script)
        dt = time.time() - t0
        if mock: time.sleep(0.05)
        n = len(r["matched_assets"])
        print(f"✓ {n}件素材 ({int(dt*1000)}ms)")
        results.append(r)
    print(f"\n📊 完成: {len(results)} 个脚本已匹配素材")
    return results

# ─── HTML 报告 ───────────────────────────────────────────────────────────────
TYPE_ICON  = {"video":"🎬","music":"🎵","image":"🖼️","effect":"✨","template":"📋"}
TYPE_COLOR = {"video":"#FF6B35","music":"#7B61FF","image":"#00C9A7","effect":"#FFB300","template":"#FF4081"}

def generate_html(results, path):
    cards = ""
    for r in results:
        assets_html = "".join(
            f'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;'
            f'background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:6px">'
            f'<span style="font-size:14px">{TYPE_ICON.get(a["type"],"📁")}</span>'
            f'<div style="flex:1">'
            f'<div style="font-size:12px;font-weight:600">{a["name"]}</div>'
            f'<div style="font-size:10px;color:#4A5568">{" ".join(a.get("tags",[])[:4])}</div></div>'
            f'<span style="font-size:10px;padding:2px 7px;border-radius:4px;'
            f'color:{TYPE_COLOR.get(a["type"],"#8A94A6")};background:{TYPE_COLOR.get(a["type"],"#8A94A6")}15;'
            f'border:1px solid {TYPE_COLOR.get(a["type"],"#8A94A6")}30">{a["type"]}</span>'
            f'<span style="font-size:10px;color:#4A5568;min-width:24px;text-align:right">⭐{a["match_score"]}</span></div>'
            for a in r.get("matched_assets", [])
        )
        kws = " ".join(f'<span style="font-size:10px;color:#00C9A7;background:rgba(0,201,167,0.08);padding:2px 6px;border-radius:4px">{k}</span>' for k in r.get("keywords_used",[])[:8])
        cards += f'''
<div style="background:#0C1119;border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:16px;overflow:hidden">
  <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.05);border-left:4px solid #00C9A7">
    <span style="font-size:20px">🎯</span>
    <div style="flex:1">
      <div style="font-size:15px;font-weight:700">{r.get("script_title","")}</div>
      <div style="font-size:11px;color:#8A94A6;margin-top:2px">{r.get("topic","")[:50]}</div>
    </div>
    <span style="font-size:11px;color:#8A94A6;font-family:monospace">⚡ {r.get("match_time_ms",0)}ms · {len(r.get("matched_assets",[]))}件</span>
  </div>
  <div style="padding:14px 18px">
    <div style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap">{kws}</div>
    {assets_html}
  </div>
</div>'''
    html = f'''<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>素材匹配 {TODAY}</title>
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:"PingFang SC",sans-serif;background:#06090F;color:#EDF0F5}}</style>
</head><body>
<div style="text-align:center;padding:32px 20px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
  <h1 style="font-size:26px;font-weight:900;margin-bottom:6px">🎯 素材匹配中心</h1>
  <div style="font-size:13px;color:#4A5568">{TODAY} · 素材库 {len(ASSET_LIST)} 件 · {len(results)} 个脚本已匹配</div>
</div>
<div style="max-width:900px;margin:0 auto;padding:20px">{cards}</div>
<div style="text-align:center;padding:20px;font-size:11px;color:#3F4E63">AutoPipeline · {TIMESTAMP}</div>
</body></html>'''
    with open(path, "w", encoding="utf-8") as f: f.write(html)
    print(f"📄 HTML: {path}")

# ─── main ────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="素材匹配")
    ap.add_argument("-i", "--input", type=str)
    ap.add_argument("-o", "--output", type=str)
    ap.add_argument("--html", type=str)
    ap.add_argument("--mock", action="store_true")
    a = ap.parse_args()

    inp = a.input or os.path.join(os.path.dirname(__file__), "..", "data", "latest_scripts.json")
    if not os.path.exists(inp):
        print(f"⚠ 找不到脚本文件: {inp}")
        print("  请先运行 python script_generator.py 生成脚本，或使用 --mock 模式")
        sys.exit(1)
    with open(inp, "r", encoding="utf-8") as f:
        scripts = json.load(f)
    print(f"📥 加载 {len(scripts)} 个脚本")

    results = match_all(scripts, mock=a.mock)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M")

    out_json = a.output or os.path.join(out_dir, f"matched_{ts}.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    with open(os.path.join(out_dir, "latest_matched.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"💾 JSON: {out_json}")

    out_html = a.html or os.path.join(out_dir, f"matched_{ts}.html")
    generate_html(results, out_html)
    generate_html(results, os.path.join(out_dir, "latest_matched.html"))

if __name__ == "__main__":
    main()
