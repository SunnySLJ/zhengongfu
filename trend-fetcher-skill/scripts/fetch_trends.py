#!/usr/bin/env python3
"""
全网热点实时采集 - 通过通义千问API采集6大平台Top20热搜
用法:
  python fetch_trends.py                    # 真实采集
  python fetch_trends.py --mock             # 模拟模式
  python fetch_trends.py -p weibo           # 只采微博
  python fetch_trends.py -o data.json --html report.html
"""
import json, time, re, argparse, sys, os
from datetime import datetime
from typing import Optional

QWEN_API_KEY = "sk-sp-432aa1b7751a4fea8e6425131ed89eb4"
QWEN_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
QWEN_MODEL = "qwen3-coder-plus"

def _search_url(platform_id, title):
    import urllib.parse
    q = urllib.parse.quote(title.replace('#','').strip())
    return {
        'weibo':       f'https://s.weibo.com/weibo?q={q}',
        'douyin':      f'https://www.douyin.com/search/{q}',
        'bilibili':    f'https://search.bilibili.com/all?keyword={q}',
        'xiaohongshu': f'https://www.xiaohongshu.com/search_result/?keyword={q}',
        'zhihu':       f'https://www.zhihu.com/search?q={q}',
        'baidu':       f'https://www.baidu.com/s?wd={q}',
    }.get(platform_id, f'https://www.baidu.com/s?wd={q}')

PLATFORMS = [
    {"id":"weibo","name":"微博","icon":"◆","color":"#FF8200"},
    {"id":"douyin","name":"抖音","icon":"♪","color":"#FE2C55"},
    {"id":"xiaohongshu","name":"小红书","icon":"📕","color":"#FF2442"},
    {"id":"bilibili","name":"B站","icon":"▶","color":"#00A1D6"},
    {"id":"zhihu","name":"知乎","icon":"知","color":"#0066FF"},
    {"id":"baidu","name":"百度","icon":"BD","color":"#3388FF"},
]

TODAY = datetime.now().strftime("%Y年%m月%d日")
TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def call_qwen(prompt):
    import urllib.request, urllib.error
    url = f"{QWEN_BASE_URL}/chat/completions"
    body = json.dumps({
        "model": QWEN_MODEL,
        "messages": [
            {"role":"system","content":"你是热点数据分析师。只返回纯JSON数组，不要markdown代码块和任何其他文字。"},
            {"role":"user","content":prompt}
        ],
        "temperature": 0.7, "max_tokens": 4000,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type":"application/json",
        "Authorization":f"Bearer {QWEN_API_KEY}",
    }, method="POST")
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

def parse_json_array(text):
    if not text: return None
    c = re.sub(r'```(?:json)?\s*','',text.strip()).strip()
    s, e = c.find("["), c.rfind("]")
    if s<0 or e<=s: return None
    try:
        a = json.loads(c[s:e+1])
        return a if isinstance(a, list) else None
    except: return None

def fetch_platform_real(plat):
    pid, pn = plat["id"], plat["name"]
    print(f"  📡 {pn}...", end=" ", flush=True)
    prompt = (f"列出{pn}今天({TODAY})热搜前20条。直接返回JSON数组:\n"
              f'[{{"rank":1,"title":"标题","heat":"热度","category":"分类"}},...]\n'
              f"category: 科技/娱乐/社会/财经/体育/政策/生活/教育/国际/其他。只返回JSON。")
    t0 = time.time()
    raw = call_qwen(prompt)
    dt = time.time()-t0
    base = {"platform":pid,"name":pn,"icon":plat["icon"],"color":plat["color"],"fetch_time":TIMESTAMP}
    if not raw:
        print(f"✗ ({dt:.1f}s)"); return {**base,"status":"error","trends":[]}
    arr = parse_json_array(raw)
    if arr:
        trends = [{"rank":it.get("rank",i+1),"title":str(it.get("title",""))[:100],
                    "heat":str(it.get("heat","")),"category":it.get("category","其他"),
                    "url":_search_url(pid, str(it.get("title","")))} for i,it in enumerate(arr[:20])]
        print(f"✓ {len(trends)}条 ({dt:.1f}s)"); return {**base,"status":"ok","trends":trends}
    # fallback
    fb = []
    for ln in raw.split("\n"):
        cl = re.sub(r'^\d+[\.\)、:\-]\s*','',ln.strip()); cl = re.sub(r'^[#*]\s*','',cl).strip()
        if 3<len(cl)<100: fb.append({"rank":len(fb)+1,"title":cl,"heat":"","category":"热搜"})
        if len(fb)>=20: break
    if len(fb)>=3:
        print(f"⚠ {len(fb)}条 ({dt:.1f}s)"); return {**base,"status":"partial","trends":fb}
    print(f"✗ 解析失败 ({dt:.1f}s)"); return {**base,"status":"error","trends":[]}

# ─── 模拟数据(2026年3月15日真实热搜) ───
MOCK = {
"weibo":[
{"rank":1,"title":"#315晚会今晚直播#","heat":"热 9.8亿","category":"社会"},
{"rank":2,"title":"#AI养虾装虾499卸载299#","heat":"热 5.2亿","category":"科技"},
{"rank":3,"title":"#理想官宣下半年推出理想i9#","heat":"热 3.1亿","category":"财经"},
{"rank":4,"title":"#微信三大功能更新#","heat":"热 4.6亿","category":"科技"},
{"rank":5,"title":"#西安不倒翁小姐姐宣布离职#","heat":"热 2.1亿","category":"娱乐"},
{"rank":6,"title":"#宁德时代曾毓群分红81亿#","heat":"热 1.8亿","category":"财经"},
{"rank":7,"title":"#伊朗30枚导弹袭击以色列#","heat":"热 1.9亿","category":"国际"},
{"rank":8,"title":"#WTT重庆孙颖莎不敌蒯曼#","heat":"热 1.7亿","category":"体育"},
{"rank":9,"title":"#理想现金储备超1000亿#","heat":"热 1.5亿","category":"财经"},
{"rank":10,"title":"#白玉兰奖预测#","heat":"热 1.3亿","category":"娱乐"},
{"rank":11,"title":"#OpenClaw安全漏洞#","heat":"热 1.2亿","category":"科技"},
{"rank":12,"title":"#妈妈囤黄金3年赚40万#","heat":"热 1.1亿","category":"生活"},
{"rank":13,"title":"#腾讯推出WorkBuddy#","heat":"热 9800万","category":"科技"},
{"rank":14,"title":"#人社部加大就业扶持#","heat":"热 9200万","category":"政策"},
{"rank":15,"title":"#F1中国大奖赛23万人#","heat":"热 8700万","category":"体育"},
{"rank":16,"title":"#十五五规划纲要发布#","heat":"热 8500万","category":"政策"},
{"rank":17,"title":"#豆包月活1.72亿#","heat":"热 7900万","category":"科技"},
{"rank":18,"title":"#字节上线ArkClaw#","heat":"热 7500万","category":"科技"},
{"rank":19,"title":"#5岁男童腿疼确诊白血病#","heat":"热 7200万","category":"社会"},
{"rank":20,"title":"#格力AWE发布新品#","heat":"热 6800万","category":"科技"}],
"douyin":[
{"rank":1,"title":"315晚会曝光清单","heat":"4523万播放","category":"社会"},
{"rank":2,"title":"豆包AI爆改穿搭","heat":"3891万播放","category":"科技"},
{"rank":3,"title":"微信忽略功能社恐福音","heat":"3244万播放","category":"科技"},
{"rank":4,"title":"装虾翻车现场","heat":"2987万播放","category":"科技"},
{"rank":5,"title":"春天第一杯奶茶","heat":"2756万播放","category":"生活"},
{"rank":6,"title":"不倒翁小姐姐最后一舞","heat":"2534万播放","category":"娱乐"},
{"rank":7,"title":"理想i9渲染图曝光","heat":"2198万播放","category":"科技"},
{"rank":8,"title":"黄金暴涨避坑指南","heat":"1987万播放","category":"财经"},
{"rank":9,"title":"帕梅拉春季新课挑战","heat":"1876万播放","category":"生活"},
{"rank":10,"title":"孙颖莎赛后采访","heat":"1754万播放","category":"体育"},
{"rank":11,"title":"程序员AI养虾日赚万元","heat":"1632万播放","category":"科技"},
{"rank":12,"title":"三月穿搭公式","heat":"1521万播放","category":"生活"},
{"rank":13,"title":"消费者维权故事","heat":"1445万播放","category":"社会"},
{"rank":14,"title":"一人食晚餐vlog","heat":"1387万播放","category":"生活"},
{"rank":15,"title":"F1上海站现场","heat":"1256万播放","category":"体育"},
{"rank":16,"title":"AI同声传译实测","heat":"1198万播放","category":"科技"},
{"rank":17,"title":"办公室减脂餐","heat":"1087万播放","category":"生活"},
{"rank":18,"title":"搞笑配音名场面","heat":"987万播放","category":"娱乐"},
{"rank":19,"title":"回村创业vlog","heat":"923万播放","category":"生活"},
{"rank":20,"title":"伊朗局势进展","heat":"876万播放","category":"国际"}],
"xiaohongshu":[
{"rank":1,"title":"珠圆玉润妆淡颜天菜","heat":"127万浏览","category":"生活"},
{"rank":2,"title":"碎钻美甲细碎星光","heat":"98万浏览","category":"生活"},
{"rank":3,"title":"笔墨重现课本诗意","heat":"87万浏览","category":"教育"},
{"rank":4,"title":"春日穿搭颜色猎手","heat":"82万浏览","category":"生活"},
{"rank":5,"title":"315品牌避坑清单","heat":"76万浏览","category":"社会"},
{"rank":6,"title":"洱海丁达尔效应","heat":"71万浏览","category":"生活"},
{"rank":7,"title":"黄金首饰避坑经历","heat":"68万浏览","category":"财经"},
{"rank":8,"title":"一口价黄金千万别买","heat":"64万浏览","category":"财经"},
{"rank":9,"title":"豆包穿搭翻车合集","heat":"59万浏览","category":"娱乐"},
{"rank":10,"title":"胶囊衣橱30件搞定全年","heat":"55万浏览","category":"生活"},
{"rank":11,"title":"三月樱花季赏花攻略","heat":"52万浏览","category":"生活"},
{"rank":12,"title":"露营装备平替合集","heat":"48万浏览","category":"生活"},
{"rank":13,"title":"F1观赛穿什么","heat":"45万浏览","category":"生活"},
{"rank":14,"title":"减脂期外卖怎么点","heat":"43万浏览","category":"生活"},
{"rank":15,"title":"通勤妆5分钟出门","heat":"41万浏览","category":"生活"},
{"rank":16,"title":"新能源车险怎么买","heat":"38万浏览","category":"财经"},
{"rank":17,"title":"AI工具推荐2026版","heat":"36万浏览","category":"科技"},
{"rank":18,"title":"理想i8车主体验","heat":"34万浏览","category":"生活"},
{"rank":19,"title":"春季过敏自救指南","heat":"31万浏览","category":"生活"},
{"rank":20,"title":"职场反PUA话术","heat":"29万浏览","category":"教育"}],
"bilibili":[
{"rank":1,"title":"315特别节目消费陷阱","heat":"632万播放","category":"社会"},
{"rank":2,"title":"OpenClaw深度测评","heat":"487万播放","category":"科技"},
{"rank":3,"title":"美伊冲突局势全解析","heat":"423万播放","category":"国际"},
{"rank":4,"title":"RTX5070实测对比4090","heat":"398万播放","category":"科技"},
{"rank":5,"title":"理想i9曝光50万纯电SUV","heat":"356万播放","category":"科技"},
{"rank":6,"title":"帕梅拉7天打卡记录","heat":"312万播放","category":"生活"},
{"rank":7,"title":"2026.3显卡选购指南","heat":"287万播放","category":"科技"},
{"rank":8,"title":"WTT重庆站精彩集锦","heat":"265万播放","category":"体育"},
{"rank":9,"title":"AI龙虾大厂横评","heat":"243万播放","category":"科技"},
{"rank":10,"title":"RX9070XT vs RTX5070","heat":"221万播放","category":"科技"},
{"rank":11,"title":"十五五规划与年轻人","heat":"198万播放","category":"政策"},
{"rank":12,"title":"东北话配日漫第三弹","heat":"187万播放","category":"娱乐"},
{"rank":13,"title":"微信同声传译实测","heat":"176万播放","category":"科技"},
{"rank":14,"title":"一人食治愈料理","heat":"165万播放","category":"生活"},
{"rank":15,"title":"DeepSeek vs 豆包对比","heat":"154万播放","category":"科技"},
{"rank":16,"title":"F1 2026车队实力分析","heat":"143万播放","category":"体育"},
{"rank":17,"title":"曼联vs维拉前瞻","heat":"132万播放","category":"体育"},
{"rank":18,"title":"Kimi估值180亿美元","heat":"121万播放","category":"财经"},
{"rank":19,"title":"Meta裁员20%投AI","heat":"112万播放","category":"科技"},
{"rank":20,"title":"春季开学装备推荐","heat":"98万播放","category":"教育"}],
"zhihu":[
{"rank":1,"title":"十五五规划纲要有哪些要点值得关注？","heat":"243万热度","category":"政策"},
{"rank":2,"title":"政协委员王亚平透露航天员中心研究地外生存","heat":"438万热度","category":"科技"},
{"rank":3,"title":"2026省考笔试结束你的心情怎样？","heat":"339万热度","category":"教育"},
{"rank":4,"title":"西安不倒翁小姐姐离职如何看待？","heat":"204万热度","category":"娱乐"},
{"rank":5,"title":"伊朗30枚导弹袭击以色列意味着什么？","heat":"184万热度","category":"国际"},
{"rank":6,"title":"孙颖莎不敌蒯曼如何评价？","heat":"169万热度","category":"体育"},
{"rank":7,"title":"F1中国大奖赛为何越来越火？","heat":"122万热度","category":"体育"},
{"rank":8,"title":"AI龙虾OpenClaw安全漏洞怎么看？","heat":"98万热度","category":"科技"},
{"rank":9,"title":"315晚会今年会曝光哪些行业？","heat":"89万热度","category":"社会"},
{"rank":10,"title":"Anthropic一人撑起营销团队十个月","heat":"87万热度","category":"科技"},
{"rank":11,"title":"理想要完成具身智能企业转型","heat":"76万热度","category":"科技"},
{"rank":12,"title":"曾毓群分红81亿超10家车企利润合理吗","heat":"74万热度","category":"财经"},
{"rank":13,"title":"微信忽略来电功能你怎么看","heat":"67万热度","category":"科技"},
{"rank":14,"title":"在家做凉菜如何做出饭店口味","heat":"54万热度","category":"生活"},
{"rank":15,"title":"格力2026 AWE新品值得关注什么","heat":"54万热度","category":"科技"},
{"rank":16,"title":"博德闪耀是今年欧冠最大黑马吗","heat":"54万热度","category":"体育"},
{"rank":17,"title":"Kimi估值180亿美元说明了什么","heat":"52万热度","category":"科技"},
{"rank":18,"title":"Meta裁员20%投AI如何评价","heat":"48万热度","category":"科技"},
{"rank":19,"title":"电池厂吃肉车企喝汤如何破解","heat":"45万热度","category":"财经"},
{"rank":20,"title":"中年人第一辆车选油车纯电还是混动","heat":"54万热度","category":"生活"}],
"baidu":[
{"rank":1,"title":"央视315晚会直播","heat":"极热","category":"社会"},
{"rank":2,"title":"微信忽略来电功能上线","heat":"极热","category":"科技"},
{"rank":3,"title":"理想汽车发布i9纯电SUV","heat":"极热","category":"财经"},
{"rank":4,"title":"伊朗导弹袭击以色列","heat":"极热","category":"国际"},
{"rank":5,"title":"十五五规划纲要发布","heat":"热","category":"政策"},
{"rank":6,"title":"OpenClaw安全问题","heat":"热","category":"科技"},
{"rank":7,"title":"宁德时代曾毓群分红81亿","heat":"热","category":"财经"},
{"rank":8,"title":"黄金价格创历史新高","heat":"热","category":"财经"},
{"rank":9,"title":"孙颖莎WTT止步四强","heat":"热","category":"体育"},
{"rank":10,"title":"西安不倒翁小姐姐离职","heat":"热","category":"娱乐"},
{"rank":11,"title":"豆包AI月活超1.7亿","heat":"热","category":"科技"},
{"rank":12,"title":"F1中国大奖赛创纪录","heat":"热","category":"体育"},
{"rank":13,"title":"腾讯推出WorkBuddy","heat":"热","category":"科技"},
{"rank":14,"title":"曼联vs维拉争四大战","heat":"热","category":"体育"},
{"rank":15,"title":"315消费者维权指南","heat":"热","category":"社会"},
{"rank":16,"title":"RTX5070显卡价格","heat":"热","category":"科技"},
{"rank":17,"title":"小米miclaw发布","heat":"热","category":"科技"},
{"rank":18,"title":"春季流感预防指南","heat":"热","category":"生活"},
{"rank":19,"title":"2026省考成绩查询","heat":"热","category":"教育"},
{"rank":20,"title":"阿里发布CoPaw","heat":"热","category":"科技"}],
}

def fetch_platform_mock(plat):
    pid, pn = plat["id"], plat["name"]
    print(f"  📡 {pn}...", end=" ", flush=True)
    time.sleep(0.2)
    trends = [dict(t, url=_search_url(pid, t["title"])) for t in MOCK.get(pid,[])]
    print(f"✓ {len(trends)}条 (mock)")
    return {"platform":pid,"name":pn,"icon":plat["icon"],"color":plat["color"],
            "fetch_time":TIMESTAMP,"status":"ok","trends":trends}

def fetch_all(platform_filter=None, mock=False):
    from concurrent.futures import ThreadPoolExecutor, as_completed
    targets = PLATFORMS
    if platform_filter:
        targets = [p for p in PLATFORMS if p["id"]==platform_filter]
        if not targets:
            print(f"未知平台: {platform_filter}"); sys.exit(1)
    print(f"🔥 全网热点采集 - {TODAY}")
    print(f"   模式: {'模拟' if mock else '千问API'} | 平台: {', '.join(p['name'] for p in targets)}\n")
    fetch_fn = fetch_platform_mock if mock else fetch_platform_real
    # 并行采集所有平台，按原顺序返回
    with ThreadPoolExecutor(max_workers=len(targets)) as pool:
        future_to_idx = {pool.submit(fetch_fn, p): i for i, p in enumerate(targets)}
        results = [None] * len(targets)
        for fut in as_completed(future_to_idx):
            results[future_to_idx[fut]] = fut.result()
    total = sum(len(r["trends"]) for r in results)
    ok = sum(1 for r in results if r["status"]=="ok")
    print(f"\n📊 完成: {total}条 / {ok}/{len(targets)}平台成功")
    return results


CAT_COLORS = {"科技":"#7B61FF","娱乐":"#FF4081","社会":"#FF6B35","财经":"#FFB300",
    "体育":"#00C9A7","政策":"#448AFF","生活":"#FF8F5E","教育":"#4ADE80",
    "国际":"#E040FB","其他":"#78909C","热搜":"#FF6B35"}

def generate_html(results, path):
    total = sum(len(r["trends"]) for r in results)
    cc = {}
    for r in results:
        for t in r["trends"]:
            c=t.get("category","其他"); cc[c]=cc.get(c,0)+1
    cat_h = "".join(f'<span style="padding:3px 10px;border-radius:5px;font-size:11px;font-weight:600;'
                    f'color:{CAT_COLORS.get(c,"#78909C")};background:{CAT_COLORS.get(c,"#78909C")}12;'
                    f'border:1px solid {CAT_COLORS.get(c,"#78909C")}30">{c} {n}</span> '
                    for c,n in sorted(cc.items(),key=lambda x:-x[1]))
    plat_h = ""
    for r in results:
        st = "✓" if r["status"]=="ok" else "⚠" if r["status"]=="partial" else "✗"
        rows = ""
        for t in r["trends"]:
            tc = CAT_COLORS.get(t.get("category",""),"#78909C")
            rk_s = f'color:{r["color"]};font-weight:900' if t["rank"]<=3 else 'color:#3F4E63'
            rows += (f'<div style="display:flex;align-items:center;gap:10px;padding:8px 18px;'
                     f'border-bottom:1px solid rgba(255,255,255,0.025)">'
                     f'<span style="font-family:monospace;font-size:14px;min-width:28px;text-align:center;{rk_s}">{str(t["rank"]).zfill(2)}</span>'
                     f'<span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t["title"]}</span>'
                     f'<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;color:{tc};background:{tc}15;border:1px solid {tc}30">{t.get("category","")}</span>'
                     f'<span style="font-size:10px;color:#4A5568;font-family:monospace;max-width:100px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{t.get("heat","")}</span>'
                     f'</div>')
        plat_h += (f'<div style="background:#0C1119;border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:16px;overflow:hidden">'
                   f'<div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.05);border-left:4px solid {r["color"]}">'
                   f'<span style="color:{r["color"]};font-size:18px;font-weight:700">{r["icon"]}</span>'
                   f'<span style="font-size:17px;font-weight:700;flex:1">{r["name"]}</span>'
                   f'<span style="font-size:12px;color:#8A94A6;font-family:monospace">{st} {len(r["trends"])}条</span></div>'
                   f'{rows}</div>')
    html = (f'<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>热点采集 {TODAY}</title>'
            f'<style>*{{margin:0;padding:0;box-sizing:border-box}}'
            f'body{{font-family:"Noto Sans SC","PingFang SC",sans-serif;background:#06090F;color:#EDF0F5;padding:0}}</style></head><body>'
            f'<div style="text-align:center;padding:32px 20px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">'
            f'<h1 style="font-size:26px;font-weight:900;margin-bottom:6px">🔥 全网热点采集报告</h1>'
            f'<div style="font-size:13px;color:#4A5568;margin-bottom:14px">{TODAY} · 通义千问API · 6平台Top20</div>'
            f'<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px">'
            f'<span style="padding:4px 12px;border-radius:6px;background:#0C1119;border:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8A94A6">📊 共 <b style="color:#FF6B35">{total}</b> 条</span>'
            f'<span style="padding:4px 12px;border-radius:6px;background:#0C1119;border:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8A94A6">📡 <b style="color:#FF6B35">{len(results)}</b> 平台</span>'
            f'<span style="padding:4px 12px;border-radius:6px;background:#0C1119;border:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8A94A6">🕐 {TIMESTAMP}</span></div>'
            f'<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">{cat_h}</div></div>'
            f'<div style="max-width:900px;margin:0 auto;padding:20px">{plat_h}</div>'
            f'<div style="text-align:center;padding:20px;font-size:11px;color:#3F4E63">数据来源：通义千问 · {TIMESTAMP}</div>'
            f'</body></html>')
    with open(path,"w",encoding="utf-8") as f: f.write(html)
    print(f"📄 HTML: {path}")

def main():
    ap = argparse.ArgumentParser(description="全网热点采集")
    ap.add_argument("-p","--platform",type=str)
    ap.add_argument("-o","--output",type=str)
    ap.add_argument("--html",type=str)
    ap.add_argument("--mock",action="store_true",help="模拟模式")
    ap.add_argument("--pretty",action="store_true")
    a = ap.parse_args()
    results = fetch_all(a.platform, mock=a.mock)
    if a.output:
        with open(a.output,"w",encoding="utf-8") as f:
            json.dump(results,f,ensure_ascii=False,indent=2 if a.pretty else None)
        print(f"💾 JSON: {a.output}")
    elif not a.html:
        print("\n"+json.dumps(results,ensure_ascii=False,indent=2))
    if a.html:
        generate_html(results, a.html)

if __name__=="__main__": main()
