#!/usr/bin/env python3
"""API连通性测试 - 测试千问API是否正常"""
import json, urllib.request, urllib.error

API_KEY = "sk-sp-432aa1b7751a4fea8e6425131ed89eb4"
BASE_URL = "https://coding.dashscope.aliyuncs.com/v1"
MODEL = "qwen3-coder-plus"

def test():
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    print("🔧 通义千问API连通性测试")
    print(f"   Base URL: {BASE_URL}")
    print(f"   Model: {MODEL}")
    print(f"   API Key: {API_KEY[:10]}...{API_KEY[-4:]}")
    print()

    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": "返回JSON数组，3条今日热搜：[{\"title\":\"话题\",\"heat\":\"热度\"}]，只返回JSON"}],
        "temperature": 0.7, "max_tokens": 500,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
        method="POST"
    )

    try:
        print("📡 发送测试请求...")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"✓ HTTP {resp.status} · 模型: {data.get('model','N/A')}")
            content = data.get("choices",[{}])[0].get("message",{}).get("content","")
            print(f"✓ 返回 {len(content)} 字符")
            print(f"\n─── 返回内容 ───\n{content}\n─── 结束 ───")
            print("\n✅ API连通正常！运行 python daily_fetch.py 开始采集")
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8") if e.fp else ""
        print(f"✗ HTTP {e.code}: {err[:300]}")
        if e.code == 401: print("⚠ API Key无效")
    except urllib.error.URLError as e:
        print(f"✗ 网络错误: {e.reason}\n⚠ 请检查网络")
    except Exception as e:
        print(f"✗ 异常: {e}")

if __name__ == "__main__":
    test()
