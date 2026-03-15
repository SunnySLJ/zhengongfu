#!/usr/bin/env python3
"""
⑤ 自动发布 - 多平台视频自动上传发布
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
各平台开通状态：
  ✅ 抖音  - 官方开放平台，需注册开发者应用获取 client_key / access_token
  ✅ B站   - 半官方 API，需 SESSDATA cookie
  ⚠️ 小红书 - 官方平台，需通过企业认证审核
  ❌ 微博  - 仅对机构开放，个人无法申请
  ✅ 模拟  - 任何平台均可用 --mock 模式预演

用法:
  python3 publisher.py --mock                    # 模拟发布所有平台（不需要任何key）
  python3 publisher.py --platform douyin --mock  # 只模拟抖音
  python3 publisher.py --check                   # 查看各平台配置状态
  python3 publisher.py --platform douyin         # 真实发布到抖音（需配置 access_token）
"""
import json, os, sys, time, argparse, re
from datetime import datetime, timedelta

TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
DATA_DIR  = os.path.join(os.path.dirname(__file__), "..", "data")

# ─── 平台配置（从环境变量读取，也可直接填入）─────────────────────────────────
PLATFORM_CONFIGS = {
    "douyin": {
        "name":        "抖音",
        "icon":        "🎵",
        "color":       "#FE2C55",
        "available":   True,
        "doc_url":     "https://open.douyin.com/",
        "client_key":  os.environ.get("DOUYIN_CLIENT_KEY",  ""),
        "access_token":os.environ.get("DOUYIN_ACCESS_TOKEN",""),
        "open_id":     os.environ.get("DOUYIN_OPEN_ID",     ""),
        "note":        "需在 open.douyin.com 创建应用，OAuth 授权后获取 access_token",
        "setup_steps": [
            "1. 访问 https://open.douyin.com/ 注册开发者",
            "2. 创建「移动/网页应用」，填写基本信息",
            "3. 申请「视频管理」权限",
            "4. 引导用户 OAuth 授权，获取 access_token 和 open_id",
            "5. 设置环境变量: export DOUYIN_ACCESS_TOKEN=xxx DOUYIN_OPEN_ID=xxx",
        ],
    },
    "bilibili": {
        "name":        "B站",
        "icon":        "📺",
        "color":       "#00A1D6",
        "available":   True,
        "doc_url":     "https://openhome.bilibili.com/doc",
        "sessdata":    os.environ.get("BILIBILI_SESSDATA", ""),
        "bili_jct":    os.environ.get("BILIBILI_BILI_JCT", ""),
        "note":        "需要账号登录 Cookie（SESSDATA + bili_jct）",
        "setup_steps": [
            "1. 浏览器登录 bilibili.com",
            "2. F12 → Application → Cookies → 复制 SESSDATA 和 bili_jct",
            "3. 设置环境变量: export BILIBILI_SESSDATA=xxx BILIBILI_BILI_JCT=xxx",
        ],
    },
    "xiaohongshu": {
        "name":        "小红书",
        "icon":        "📕",
        "color":       "#FF2442",
        "available":   False,
        "doc_url":     "https://open.xiaohongshu.com/",
        "note":        "需企业认证，个人开发者暂不支持视频投稿API",
        "setup_steps": [
            "1. 访问 https://open.xiaohongshu.com/ 申请企业开发者",
            "2. 完成企业资质认证（需营业执照）",
            "3. 申请视频发布权限（审核周期较长）",
        ],
    },
    "weibo": {
        "name":        "微博",
        "icon":        "🟠",
        "color":       "#FF8200",
        "available":   False,
        "doc_url":     "https://open.weibo.com/",
        "note":        "视频API仅对政府/媒体/机构开放，个人不可申请",
        "setup_steps": ["目前对个人开发者不开放，需通过微博商务渠道申请"],
    },
}

# ─── 抖音发布实现 ─────────────────────────────────────────────────────────────
DOUYIN_API = "https://open.douyin.com/api/douyin/v1/video"

def publish_douyin(video_path: str, title: str, tags: list, cfg: dict) -> dict:
    """抖音视频发布（需要 access_token 和 open_id）"""
    import urllib.request, urllib.error

    access_token = cfg.get("access_token", "")
    open_id      = cfg.get("open_id", "")
    if not access_token or not open_id:
        return {"status": "error", "error": "缺少 access_token 或 open_id，请先完成 OAuth 授权"}

    headers = {
        "access-token": access_token,
        "Content-Type": "application/json",
    }

    # Step 1: 申请上传地址
    init_body = json.dumps({
        "open_id": open_id,
        "source_info": {"source": "FILE_UPLOAD", "video_size": os.path.getsize(video_path) if os.path.exists(video_path) else 10*1024*1024}
    }).encode()
    try:
        req = urllib.request.Request(f"{DOUYIN_API}/upload/", data=init_body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as r:
            resp = json.loads(r.read())
            upload_url = resp.get("data", {}).get("upload_url", "")
            video_id   = resp.get("data", {}).get("video_id", "")
    except urllib.error.HTTPError as e:
        return {"status": "error", "error": f"HTTP {e.code}: {e.read().decode()[:200]}"}
    except Exception as ex:
        return {"status": "error", "error": str(ex)}

    if not upload_url:
        return {"status": "error", "error": "未获取到上传地址"}

    # Step 2: 上传视频文件
    try:
        with open(video_path, "rb") as f:
            video_data = f.read()
        upload_req = urllib.request.Request(upload_url, data=video_data,
            headers={"Content-Type": "video/mp4"}, method="PUT")
        urllib.request.urlopen(upload_req, timeout=120)
    except Exception as ex:
        return {"status": "error", "error": f"上传失败: {ex}"}

    # Step 3: 发布视频
    publish_body = json.dumps({
        "open_id": open_id,
        "video_id": video_id,
        "text": title + " " + " ".join(tags[:5]),
        "micro_app_info": []
    }).encode()
    try:
        req = urllib.request.Request(f"{DOUYIN_API}/create/", data=publish_body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as r:
            resp = json.loads(r.read())
            item_id = resp.get("data", {}).get("item_id", "")
            return {"status": "published", "item_id": item_id, "video_id": video_id}
    except urllib.error.HTTPError as e:
        return {"status": "error", "error": f"发布失败 HTTP {e.code}: {e.read().decode()[:200]}"}
    except Exception as ex:
        return {"status": "error", "error": f"发布异常: {ex}"}

# ─── B站发布实现 ──────────────────────────────────────────────────────────────
BILI_PREUPLOAD = "https://member.bilibili.com/preupload"
BILI_SUBMIT    = "https://member.bilibili.com/x/vu/web/add/v3"

def publish_bilibili(video_path: str, title: str, tags: list, cfg: dict) -> dict:
    """B站视频投稿（需要 SESSDATA + bili_jct Cookie）"""
    import urllib.request, urllib.error

    sessdata = cfg.get("sessdata", "")
    bili_jct = cfg.get("bili_jct", "")
    if not sessdata or not bili_jct:
        return {"status": "error", "error": "缺少 SESSDATA 或 bili_jct Cookie"}

    cookie = f"SESSDATA={sessdata}; bili_jct={bili_jct}"
    headers = {
        "Cookie":     cookie,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Referer":    "https://member.bilibili.com/",
    }
    fname = os.path.basename(video_path)
    fsize = os.path.getsize(video_path) if os.path.exists(video_path) else 10*1024*1024

    # Step 1: 预上传
    try:
        url = f"{BILI_PREUPLOAD}?name={fname}&size={fsize}&r=upos&profile=ugcupos%2Fyouth&ssl=0&version=2.14.0&build=2140000"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as r:
            resp = json.loads(r.read())
            upos_uri  = resp.get("upos_uri", "").replace("upos://", "https://upos-sz-upcdnbda2.bilivideo.com/")
            upload_id = resp.get("upload_id", "")
            chunk_size= resp.get("chunk_size", 10 * 1024 * 1024)
    except Exception as ex:
        return {"status": "error", "error": f"预上传失败: {ex}"}

    # Step 2: 分块上传（简化版，只上传一块）
    try:
        with open(video_path, "rb") as f: video_data = f.read()
        url = f"{upos_uri}?partNumber=1&uploadId={upload_id}&chunk=0&chunks=1&size={fsize}&start=0&end={fsize}&total={fsize}"
        req = urllib.request.Request(url, data=video_data, method="PUT",
            headers={**headers, "Content-Type": "application/octet-stream"})
        urllib.request.urlopen(req, timeout=300)
    except Exception as ex:
        return {"status": "error", "error": f"上传视频失败: {ex}"}

    # Step 3: 提交稿件
    submit_data = json.dumps({
        "copyright": 1,
        "videos": [{"filename": fname.replace(".mp4",""), "title": title, "desc": ""}],
        "source": "",
        "desc": " ".join(tags[:3]),
        "title": title,
        "tag": ",".join(t.replace("#","") for t in tags[:10]),
        "tid": 17,   # 17=游戏 / 可根据内容改 tid
        "cover": "",
        "csrf": bili_jct,
    }).encode()
    try:
        req = urllib.request.Request(f"{BILI_SUBMIT}?csrf={bili_jct}", data=submit_data,
            headers={**headers, "Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=15) as r:
            resp = json.loads(r.read())
            bvid = resp.get("data", {}).get("bvid", "")
            return {"status": "published", "bvid": bvid, "url": f"https://www.bilibili.com/video/{bvid}"}
    except Exception as ex:
        return {"status": "error", "error": f"提交稿件失败: {ex}"}

# ─── 模拟发布 ─────────────────────────────────────────────────────────────────
def publish_mock(video: dict, platform_key: str) -> dict:
    time.sleep(0.15)
    plat = PLATFORM_CONFIGS.get(platform_key, {})
    now  = datetime.now()
    # 智能排期：错峰发布
    offsets = {"douyin":1,"bilibili":3,"xiaohongshu":5,"weibo":7}
    pub_time = (now + timedelta(hours=offsets.get(platform_key, 2))).strftime("%Y-%m-%d %H:%M")
    return {
        "status":      "scheduled",
        "platform":    platform_key,
        "name":        plat.get("name",""),
        "video_title": video.get("script_title", ""),
        "publish_time":pub_time,
        "mock_url":    f"https://{platform_key}.example.com/video/mock_{int(time.time())}",
        "account":     f"{plat.get('name','')}账号_01",
        "note":        "模拟排期，未实际发布",
    }

# ─── 批量发布 ─────────────────────────────────────────────────────────────────
DISPATCH = {"douyin": publish_douyin, "bilibili": publish_bilibili}

def publish_all(videos: list, platforms: list, mock: bool = False) -> list:
    print(f"\n📡 自动发布 | {'模拟模式' if mock else '真实发布'} | 平台: {', '.join(platforms)}\n")
    results = []
    for v in videos:
        title   = v.get("script_title", "")
        tags    = v.get("tags", []) or ["#热门", "#内容创作"]
        path    = v.get("local_path", "")
        print(f"  🎬 《{title[:25]}》")
        for pk in platforms:
            cfg  = PLATFORM_CONFIGS.get(pk, {})
            name = cfg.get("name", pk)
            icon = cfg.get("icon", "")
            print(f"     {icon} {name}...", end=" ", flush=True)
            if mock:
                r = publish_mock(v, pk)
                print(f"✓ 模拟排期 → {r['publish_time']}")
            elif not cfg.get("available", False):
                r = {"status":"unavailable","platform":pk,"reason":cfg.get("note","")}
                print(f"⚠ 不可用: {cfg.get('note','')}")
            elif not path or not os.path.exists(path):
                r = {"status":"error","platform":pk,"error":"视频文件不存在，请先运行视频生成并 --download"}
                print(f"✗ 视频文件不存在")
            else:
                fn = DISPATCH.get(pk)
                if fn:
                    r = fn(path, title, tags, cfg)
                    if r.get("status") == "published":
                        print(f"✓ 发布成功! {r.get('item_id') or r.get('bvid','')}")
                    else:
                        print(f"✗ {r.get('error','失败')}")
                else:
                    r = {"status":"not_implemented","platform":pk}
                    print("⚠ 未实现")
            r.update({"video_title":title,"platform_name":name,"publish_time":TIMESTAMP})
            results.append(r)
    ok = sum(1 for r in results if r["status"] in ("published","scheduled"))
    print(f"\n📊 完成: {ok}/{len(results)} 个任务成功")
    return results

# ─── 配置检查 ─────────────────────────────────────────────────────────────────
def check_config():
    print("\n📋 各平台配置检查\n")
    for pk, cfg in PLATFORM_CONFIGS.items():
        icon  = cfg["icon"]
        name  = cfg["name"]
        color_tag = "✅" if cfg["available"] else "❌"
        print(f"  {color_tag} {icon} {name}")
        print(f"     状态: {'可用（需配置凭证）' if cfg['available'] else '不可用'}")
        print(f"     说明: {cfg['note']}")

        if cfg["available"]:
            # 检查凭证
            if pk == "douyin":
                at = cfg.get("access_token","")
                oi = cfg.get("open_id","")
                print(f"     凭证: access_token={'已配置✓' if at else '❌未设置'} | open_id={'已配置✓' if oi else '❌未设置'}")
                if not at:
                    print(f"     设置: export DOUYIN_ACCESS_TOKEN=<你的token> DOUYIN_OPEN_ID=<你的open_id>")
            elif pk == "bilibili":
                sd = cfg.get("sessdata","")
                bj = cfg.get("bili_jct","")
                print(f"     凭证: SESSDATA={'已配置✓' if sd else '❌未设置'} | bili_jct={'已配置✓' if bj else '❌未设置'}")
                if not sd:
                    print(f"     设置: export BILIBILI_SESSDATA=<你的sessdata> BILIBILI_BILI_JCT=<你的bili_jct>")

        if cfg.get("setup_steps"):
            print(f"     开通步骤:")
            for step in cfg["setup_steps"]:
                print(f"       {step}")
        print()

# ─── main ─────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="自动发布到多平台")
    ap.add_argument("-i","--input",    type=str, help="视频任务JSON（默认 data/latest_videos.json）")
    ap.add_argument("--platform",      type=str, help="指定平台: douyin,bilibili,xiaohongshu（逗号分隔，默认全部）")
    ap.add_argument("--mock",          action="store_true", help="模拟发布（不需要任何凭证）")
    ap.add_argument("--check",         action="store_true", help="查看各平台配置状态")
    ap.add_argument("-o","--output",   type=str, help="输出JSON路径")
    a = ap.parse_args()

    if a.check:
        check_config(); return

    os.makedirs(DATA_DIR, exist_ok=True)
    inp = a.input or os.path.join(DATA_DIR, "latest_videos.json")

    # 如果没有视频数据，用脚本数据模拟
    if not os.path.exists(inp):
        scripts_path = os.path.join(DATA_DIR, "latest_scripts.json")
        if os.path.exists(scripts_path):
            with open(scripts_path, encoding="utf-8") as f:
                scripts = json.load(f)
            videos = [{"script_title": s.get("title",""), "local_path": "", "tags": s.get("hashtags",[])} for s in scripts]
            print(f"⚠ 无视频文件，使用脚本数据模拟发布")
        else:
            print(f"⚠ 找不到数据文件，请先运行 pipeline_runner.py --mock"); sys.exit(1)
    else:
        with open(inp, encoding="utf-8") as f:
            videos = json.load(f)
    print(f"📥 加载 {len(videos)} 个视频任务")

    platforms = [p.strip() for p in a.platform.split(",")] if a.platform else ["douyin","bilibili","xiaohongshu"]
    results   = publish_all(videos, platforms, mock=a.mock)

    ts  = datetime.now().strftime("%Y%m%d_%H%M")
    out = a.output or os.path.join(DATA_DIR, f"published_{ts}.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    with open(os.path.join(DATA_DIR, "latest_published.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"💾 JSON: {out}")

if __name__ == "__main__":
    main()
