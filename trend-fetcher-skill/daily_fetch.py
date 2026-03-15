#!/usr/bin/env python3
"""
每日一键采集 - 采集全部6平台热点，保存JSON + HTML
用法: python daily_fetch.py
"""
import os, sys, json
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "scripts"))
from fetch_trends import fetch_all, generate_html

def main():
    today = datetime.now().strftime("%Y%m%d")
    time_str = datetime.now().strftime("%H%M")
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)

    json_path = os.path.join(output_dir, f"trends_{today}_{time_str}.json")
    html_path = os.path.join(output_dir, f"trends_{today}_{time_str}.html")
    latest_json = os.path.join(output_dir, "latest.json")
    latest_html = os.path.join(output_dir, "latest.html")

    print("=" * 50)
    print("🔥 每日全网热点采集")
    print("=" * 50)
    print()

    results = fetch_all()

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    with open(latest_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"💾 JSON: {json_path}")

    generate_html(results, html_path)
    generate_html(results, latest_html)

    print()
    print("=" * 50)
    total = sum(len(r["trends"]) for r in results)
    print(f"📊 本次共采集 {total} 条热点")
    for r in results:
        status = "✓" if r["status"] == "ok" else "⚠" if r["status"] == "partial" else "✗"
        print(f"   {r['icon']} {r['name']}: {status} {len(r['trends'])} 条")
    print(f"\n📁 打开 {latest_html} 查看报告")
    print("=" * 50)

if __name__ == "__main__":
    main()
