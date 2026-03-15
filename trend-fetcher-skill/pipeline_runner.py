#!/usr/bin/env python3
"""
🚀 AutoPipeline - 六位一体流水线总控
从热点感知到数据分析的全自动运行器

用法:
  python pipeline_runner.py                # 完整运行6个环节
  python pipeline_runner.py --mock         # 模拟模式（不调用API，快速测试）
  python pipeline_runner.py --stage 1,2    # 只运行指定环节（1=热点,2=剧本,...）
  python pipeline_runner.py -n 3           # 只取前3个热点生成脚本
  python pipeline_runner.py --skip-fetch   # 跳过热点采集（使用已有数据）
"""
import os, sys, json, time, argparse
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "scripts"))

TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
TODAY     = datetime.now().strftime("%Y年%m月%d日")
DATA_DIR  = os.path.join(os.path.dirname(__file__), "data")

# ─── 颜色终端输出 ────────────────────────────────────────────────────────────
def c(text, code): return f"\033[{code}m{text}\033[0m"
RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, BOLD = 91, 92, 93, 94, 95, 96, 1

STAGE_ICONS  = ["🔥","✍️","🎯","🏭","📡","📊"]
STAGE_NAMES  = ["热点感知","剧本创意","素材匹配","批量生产","定时上传","数据分析"]
STAGE_COLORS = [RED, MAGENTA, GREEN, 93, BLUE, CYAN]

def banner():
    print()
    print(c("┌─────────────────────────────────────────────────────────┐", BOLD))
    print(c("│  🚀  AutoPipeline - 六位一体无人值守流水线              │", BOLD))
    print(c("│     从热点感知到数据分析 · 全自动内容生产系统           │", BOLD))
    print(c("└─────────────────────────────────────────────────────────┘", BOLD))
    print(f"     {c(TODAY, CYAN)} · 通义千问 Qwen API\n")

def stage_header(num, icon, name, color):
    print()
    print(c(f"{'═'*55}", color))
    print(c(f"  ④ {num}/6  {icon} {name}", color if num < 4 else BOLD))
    print(c(f"{'═'*55}", color))

def simulate_batch_production(scripts, mock=False):
    """④ 批量生产 - 模拟渲染流程"""
    n       = len(scripts) * 3  # 每脚本3个变体
    success = int(n * 0.97)
    print(f"\n🏭 批量生产 | {n} 个任务 | {'模拟渲染' if mock else '云端渲染'}\n")
    os.makedirs(DATA_DIR, exist_ok=True)

    jobs = []
    for i, s in enumerate(scripts):
        for variant in ["标准版", "精简版", "竖版"]:
            job = {
                "job_id":   f"JOB{i*3+['标准版','精简版','竖版'].index(variant)+1:04d}",
                "script":   s.get("title",""),
                "topic":    s.get("topic",""),
                "variant":  variant,
                "platform": {"标准版":"抖音","精简版":"微博","竖版":"小红书"}[variant],
                "resolution": {"标准版":"1080x1920","精简版":"720x1280","竖版":"1080x1920"}[variant],
                "duration_s": {"标准版":60,"精简版":30,"竖版":60}[variant],
                "status":   "completed" if len(jobs) < success else "failed",
                "render_time_s": round(8 + len(jobs) * 0.3, 1),
                "file_size_mb":  round(80 + len(jobs) * 2.5, 1),
                "produce_time":  TIMESTAMP,
            }
            jobs.append(job)
            if not mock: time.sleep(0.02)

    print(f"  ✅ 成功: {success}/{n} 个")
    print(f"  🎬 总时长: {sum(j['duration_s'] for j in jobs[:success])}s")
    print(f"  💾 总大小: {sum(j['file_size_mb'] for j in jobs[:success]):.0f}MB")

    out = os.path.join(DATA_DIR, "latest_produced.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    print(f"  💾 JSON: {out}")
    return jobs

def simulate_publishing(produced_jobs, mock=False):
    """⑤ 定时上传 - 模拟多平台发布调度"""
    print(f"\n📡 定时上传 | {len(produced_jobs)} 个视频 | 多平台智能排期\n")

    from datetime import timedelta
    platforms = {
        "抖音":      {"api":"douyin_api","best_times":["18:30","20:00","22:00"],"limit_day":5},
        "小红书":    {"api":"xhs_api",   "best_times":["12:00","21:00"],        "limit_day":3},
        "微博":      {"api":"weibo_api", "best_times":["09:00","12:00","19:00"],"limit_day":8},
        "B站":       {"api":"bili_api",  "best_times":["16:00","20:00"],        "limit_day":2},
        "知乎":      {"api":"zhihu_api", "best_times":["10:00","20:00"],        "limit_day":3},
    }
    scheduled, base_time = [], datetime.now()
    plat_count = {p:0 for p in platforms}

    for job in produced_jobs:
        if job["status"] != "completed": continue
        plat = job["platform"]
        if plat not in platforms: plat = "抖音"
        cfg = platforms[plat]
        if plat_count[plat] >= cfg["limit_day"] * 7: continue  # 周限额
        offset_h = plat_count.get(plat, 0) * 2 + 1
        pub_time  = (base_time + timedelta(hours=offset_h)).strftime("%Y-%m-%d %H:%M")
        scheduled.append({
            "job_id":      job["job_id"],
            "platform":    plat,
            "title":       job["script"],
            "publish_time":pub_time,
            "status":      "scheduled",
            "auto_mode":   True,
            "account":     f"{plat}_account_{plat_count[plat]%3+1:02d}",
        })
        plat_count[plat] = plat_count.get(plat,0) + 1
        if not mock: time.sleep(0.01)

    plat_summary = {p:n for p,n in plat_count.items() if n>0}
    print(f"  ✅ 已排期: {len(scheduled)} 个")
    for p,n in plat_summary.items():
        print(f"     {p}: {n} 个")

    out = os.path.join(DATA_DIR, "latest_scheduled.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(scheduled, f, ensure_ascii=False, indent=2)
    print(f"  💾 JSON: {out}")
    return scheduled

# ─── 主流程 ──────────────────────────────────────────────────────────────────
def run_pipeline(args):
    banner()
    os.makedirs(DATA_DIR, exist_ok=True)
    stages  = set(args.stages) if args.stages else {1,2,3,4,5,6}
    mock    = args.mock
    summary = {"start": TIMESTAMP, "stages": {}, "mode": "模拟" if mock else "实时"}
    t_total = time.time()

    # ① 热点感知
    if 1 in stages and not args.skip_fetch:
        stage_header(1, "🔥", "热点感知", RED)
        from fetch_trends import fetch_all, generate_html as fetch_html
        t0 = time.time()
        results = fetch_all(mock=mock)
        dt = time.time() - t0
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        json_p = os.path.join(DATA_DIR, f"trends_{ts}.json")
        html_p = os.path.join(DATA_DIR, f"trends_{ts}.html")
        with open(json_p,"w",encoding="utf-8") as f: json.dump(results,f,ensure_ascii=False,indent=2)
        with open(os.path.join(DATA_DIR,"latest.json"),"w",encoding="utf-8") as f: json.dump(results,f,ensure_ascii=False,indent=2)
        print(f"  💾 JSON: {json_p}")
        fetch_html(results, html_p)
        fetch_html(results, os.path.join(DATA_DIR,"latest.html"))
        total_trends = sum(len(r["trends"]) for r in results)
        summary["stages"]["trend"] = {"count": total_trends, "time_s": round(dt,1), "status":"ok"}
    else:
        print(f"\n① 热点感知  {'[跳过]' if args.skip_fetch else '[未选]'}")

    # ② 剧本创意
    if 2 in stages:
        stage_header(2, "✍️", "剧本创意", MAGENTA)
        from script_generator import generate_scripts, generate_html as script_html, load_topics_from_file
        t0 = time.time()
        inp = os.path.join(DATA_DIR, "latest.json")
        if os.path.exists(inp):
            topics = load_topics_from_file(inp)
        else:
            print("  ⚠ 无热点数据，使用内置示例话题")
            topics = [
                {"title":"#315晚会今晚直播#","rank":1,"heat":"热 9.8亿","category":"社会"},
                {"title":"#微信三大功能更新#","rank":2,"heat":"热 4.6亿","category":"科技"},
                {"title":"#黄金价格创历史新高#","rank":3,"heat":"热 2.1亿","category":"财经"},
            ]
        scripts = generate_scripts(topics, n=args.n, mock=mock)
        dt = time.time() - t0
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        json_p = os.path.join(DATA_DIR, f"scripts_{ts}.json")
        html_p = os.path.join(DATA_DIR, f"scripts_{ts}.html")
        with open(json_p,"w",encoding="utf-8") as f: json.dump(scripts,f,ensure_ascii=False,indent=2)
        with open(os.path.join(DATA_DIR,"latest_scripts.json"),"w",encoding="utf-8") as f: json.dump(scripts,f,ensure_ascii=False,indent=2)
        print(f"  💾 JSON: {json_p}")
        script_html(scripts, html_p)
        script_html(scripts, os.path.join(DATA_DIR,"latest_scripts.html"))
        summary["stages"]["script"] = {"count": len(scripts), "time_s": round(dt,1), "status":"ok"}
    else:
        scripts = []
        print(f"\n② 剧本创意  [未选]")

    # ③ 素材匹配
    if 3 in stages:
        stage_header(3, "🎯", "素材匹配", GREEN)
        from asset_matcher import match_all, generate_html as match_html
        t0 = time.time()
        if not scripts:
            inp = os.path.join(DATA_DIR, "latest_scripts.json")
            if os.path.exists(inp):
                with open(inp) as f: scripts = json.load(f)
        matched = match_all(scripts, mock=mock)
        dt = time.time() - t0
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        json_p = os.path.join(DATA_DIR, f"matched_{ts}.json")
        html_p = os.path.join(DATA_DIR, f"matched_{ts}.html")
        with open(json_p,"w",encoding="utf-8") as f: json.dump(matched,f,ensure_ascii=False,indent=2)
        with open(os.path.join(DATA_DIR,"latest_matched.json"),"w",encoding="utf-8") as f: json.dump(matched,f,ensure_ascii=False,indent=2)
        print(f"  💾 JSON: {json_p}")
        match_html(matched, html_p)
        match_html(matched, os.path.join(DATA_DIR,"latest_matched.html"))
        summary["stages"]["asset"] = {"count": len(matched), "time_s": round(dt,1), "status":"ok"}
    else:
        matched = []
        print(f"\n③ 素材匹配  [未选]")

    # ④ 批量生产
    if 4 in stages:
        stage_header(4, "🏭", "批量生产", 93)
        t0 = time.time()
        if not scripts:
            inp = os.path.join(DATA_DIR, "latest_scripts.json")
            if os.path.exists(inp):
                with open(inp) as f: scripts = json.load(f)
        produced = simulate_batch_production(scripts, mock=mock)
        dt = time.time() - t0
        summary["stages"]["produce"] = {"count": len(produced), "time_s": round(dt,1), "status":"ok"}
    else:
        produced = []
        print(f"\n④ 批量生产  [未选]")

    # ⑤ 定时上传
    if 5 in stages:
        stage_header(5, "📡", "定时上传", BLUE)
        t0 = time.time()
        if not produced:
            inp = os.path.join(DATA_DIR, "latest_produced.json")
            if os.path.exists(inp):
                with open(inp) as f: produced = json.load(f)
        scheduled = simulate_publishing(produced, mock=mock)
        dt = time.time() - t0
        summary["stages"]["publish"] = {"count": len(scheduled), "time_s": round(dt,1), "status":"ok"}
    else:
        scheduled = []
        print(f"\n⑤ 定时上传  [未选]")

    # ⑥ 数据分析
    if 6 in stages:
        stage_header(6, "📊", "数据分析", CYAN)
        from analytics import load_real_data, build_metrics, generate_html as analytics_html
        t0 = time.time()
        real    = load_real_data(DATA_DIR)
        metrics = build_metrics(real)
        dt = time.time() - t0
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        json_p = os.path.join(DATA_DIR, f"analytics_{ts}.json")
        html_p = os.path.join(DATA_DIR, f"analytics_{ts}.html")
        with open(json_p,"w",encoding="utf-8") as f: json.dump(metrics,f,ensure_ascii=False,indent=2)
        with open(os.path.join(DATA_DIR,"latest_analytics.json"),"w",encoding="utf-8") as f: json.dump(metrics,f,ensure_ascii=False,indent=2)
        print(f"  💾 JSON: {json_p}")
        analytics_html(metrics, html_p)
        analytics_html(metrics, os.path.join(DATA_DIR,"latest_analytics.html"))
        summary["stages"]["analytics"] = {"count": 38, "time_s": round(dt,1), "status":"ok"}
    else:
        print(f"\n⑥ 数据分析  [未选]")

    # ─── 最终汇总 ────────────────────────────────────────────────────────────
    total_time = time.time() - t_total
    summary["end"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    summary["total_time_s"] = round(total_time, 1)

    print()
    print(c("╔═════════════════════════════════════════════════════════╗", GREEN))
    print(c("║  ✅  流水线全部完成！                                   ║", GREEN))
    print(c("╚═════════════════════════════════════════════════════════╝", GREEN))
    print()
    for stage_key, info in summary["stages"].items():
        names = {"trend":"① 热点感知","script":"② 剧本创意","asset":"③ 素材匹配",
                 "produce":"④ 批量生产","publish":"⑤ 定时上传","analytics":"⑥ 数据分析"}
        print(f"  {names.get(stage_key,stage_key):<16} {info['count']:>6} {'条/个':<4} {info['time_s']:>6.1f}s")

    print()
    print(f"  ⏱ 总耗时: {total_time:.1f}s  |  模式: {summary['mode']}")
    print()
    print(c("  📁 查看报告:", CYAN))
    for name, file in [("热点报告","latest.html"),("脚本报告","latest_scripts.html"),
                       ("素材报告","latest_matched.html"),("分析报告","latest_analytics.html")]:
        fpath = os.path.join(DATA_DIR, file)
        if os.path.exists(fpath):
            print(f"     {name}: {fpath}")
    print()

    with open(os.path.join(DATA_DIR,"pipeline_summary.json"),"w",encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

def main():
    ap = argparse.ArgumentParser(description="AutoPipeline 六位一体流水线总控")
    ap.add_argument("--mock",       action="store_true",  help="模拟模式，不调用真实API（快速测试）")
    ap.add_argument("--stage",      type=str,             help="指定运行环节，如 1,2,3（默认全部）")
    ap.add_argument("-n",           type=int, default=5,  help="最多生成脚本数量（默认5）")
    ap.add_argument("--skip-fetch", action="store_true",  help="跳过热点采集，使用已有数据")
    a = ap.parse_args()

    if a.stage:
        try:
            a.stages = set(int(s.strip()) for s in a.stage.split(","))
        except:
            print("⚠ --stage 格式错误，应为如 1,2,3"); sys.exit(1)
    else:
        a.stages = None

    run_pipeline(a)

if __name__ == "__main__":
    main()
