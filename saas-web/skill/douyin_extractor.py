"""
抖音视频文案提取工具 - 独立测试脚本

功能：
1. 解析抖音链接（短链接/分享链接/标准链接）
2. 使用 Playwright 打开页面提取页面文案
3. 下载视频并使用 Whisper 进行语音转写

用法：
    python douyin_extractor.py <抖音链接>
    python douyin_extractor.py  # 不带参数则使用默认测试链接
"""

import asyncio
import json
import os
import re
import sys
import urllib.parse
from datetime import datetime
from pathlib import Path

# 设置 UTF-8 编码（Windows 环境下需要）
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, "strict")

import httpx
from playwright.async_api import async_playwright

# 尝试导入 Whisper，如果失败则使用备用方案
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("[WARN] faster-whisper 未安装，将仅使用页面文案")


# ==================== 配置区 ====================
DESKTOP_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

MIN_MEDIA_SIZE_BYTES = 200 * 1024  # 最小媒体文件大小

# 输出目录
OUTPUT_DIR = Path(__file__).parent / "temp_test"
# ==================== 配置区结束 ====================


def log_step(message: str):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"\n[步骤 {ts}] {message}")


def log_success(message: str):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[完成 {ts}] {message}")


def log_error(message: str):
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[错误 {ts}] {message}")


def clean_text(text: str) -> str:
    """清理文本：去除多余空白和特殊字符"""
    if not text:
        return ""
    normalized = (
        text.replace("\\n", "\n")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\u200b", "")
        .strip()
    )
    lines = [line.strip() for line in normalized.split("\n")]
    lines = [line for line in lines if line]

    # 去重相邻重复行
    deduped = []
    for line in lines:
        if not deduped or deduped[-1] != line:
            deduped.append(line)

    return "\n".join(deduped).strip()


def extract_video_id(url: str) -> str | None:
    """从 URL 中提取视频 ID"""
    patterns = [r"/video/(\d+)", r"modal_id=(\d+)", r"group_id=(\d+)", r"aweme_id=(\d+)"]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def split_title_and_tags(text: str) -> tuple[str, list[str]]:
    """分离标题和标签"""
    tags = re.findall(r"#\S+", text)
    title = re.sub(r"#\S+", "", text).strip()
    return title, tags


async def resolve_input_url(raw_url: str) -> tuple[str, str]:
    """解析输入的 URL，返回标准视频页 URL 和视频 ID"""
    if not raw_url or not raw_url.strip().startswith("http"):
        raise ValueError("请输入有效的抖音链接或分享链接")

    url = raw_url.strip()
    video_id = extract_video_id(url)
    if video_id:
        return f"https://www.douyin.com/video/{video_id}", video_id

    # 解析短链接
    async with httpx.AsyncClient(
        follow_redirects=True,
        headers={"User-Agent": DESKTOP_USER_AGENT},
        verify=False,
        timeout=30.0,
    ) as client:
        response = await client.get(url)
        resolved_url = str(response.url)

    video_id = extract_video_id(resolved_url)
    if not video_id:
        raise ValueError("未能从分享链接中识别视频 ID")

    return f"https://www.douyin.com/video/{video_id}", video_id


async def extract_page_content(page, final_url: str) -> tuple[dict, str]:
    """从抖音页面提取标题、描述等文案"""
    await page.goto(final_url, timeout=60000, wait_until="domcontentloaded")
    await page.wait_for_timeout(8000)

    title_candidates = []

    # 尝试多种选择器获取标题
    for selector in ["h1", 'meta[property="og:title"]', 'meta[name="description"]']:
        try:
            if selector.startswith("meta"):
                content = await page.get_attribute(selector, "content")
                if content:
                    title_candidates.append(content.strip())
            else:
                element = await page.query_selector(selector)
                if element:
                    text = (await element.inner_text()).strip()
                    if text:
                        title_candidates.append(text)
        except Exception:
            pass

    # 获取页面标题
    try:
        page_title = (await page.title()).replace(" - 抖音", "").strip()
        if page_title:
            title_candidates.append(page_title)
    except Exception:
        pass

    # 从 HTML 中提取标题
    html = await page.content()
    html_title_match = re.search(r"<title>(.*?)</title>", html, re.S | re.I)
    if html_title_match:
        title_candidates.append(html_title_match.group(1).replace(" - 抖音", "").strip())

    # 选择最佳标题
    title_text = ""
    for candidate in title_candidates:
        cleaned_candidate = clean_text(candidate)
        if cleaned_candidate and cleaned_candidate != "抖音":
            title_text = cleaned_candidate
            break

    # 尝试从 RENDER_DATA 获取更详细的描述
    render_data_text = await page.evaluate(
        """() => {
            const node = document.querySelector('#RENDER_DATA');
            return node ? node.textContent || '' : '';
        }"""
    )

    description = title_text
    if render_data_text:
        try:
            decoded = urllib.parse.unquote(render_data_text)
            parsed = json.loads(decoded)
            if isinstance(parsed, dict):
                app_data = parsed.get("app", {})
                if isinstance(app_data, dict) and app_data.get("pathname"):
                    description = title_text
        except Exception:
            pass

    # 回退：获取整个页面的文本
    if not description:
        body_text = await page.evaluate("""() => document.body ? document.body.innerText || '' : ''""")
        description = clean_text(body_text)

    cleaned = clean_text(description or title_text)
    title, tags = split_title_and_tags(cleaned)

    metadata = {
        "title": title or cleaned or "未命名视频",
        "description": cleaned,
        "source_url": final_url,
        "tags": tags,
    }
    return metadata, cleaned


def pick_media_url(candidates: list[dict]) -> str:
    """从候选媒体URL中选择最佳的一个"""
    if not candidates:
        return ""
    best = max(candidates, key=lambda item: item["size"])
    return best["url"]


async def download_media(media_url: str, output_path: str):
    """下载媒体文件"""
    async with httpx.AsyncClient(
        headers={"User-Agent": DESKTOP_USER_AGENT, "Referer": "https://www.douyin.com/"},
        verify=False,
        timeout=180.0,
    ) as client:
        response = await client.get(media_url, follow_redirects=True)
        response.raise_for_status()
        with open(output_path, "wb") as file:
            file.write(response.content)


def transcribe_media(media_path: str) -> str:
    """使用 Whisper 转写音频"""
    if not WHISPER_AVAILABLE:
        log_error("Whisper 不可用，跳过语音转写")
        return ""

    log_step("加载 Whisper 模型...")
    model = WhisperModel("small", device="cpu", compute_type="int8")

    log_step("开始语音转写...")
    segments, info = model.transcribe(
        media_path,
        language="zh",
        vad_filter=True,
        beam_size=5,
    )
    log_success(f"Whisper 识别语言: {info.language}")

    texts = [segment.text.strip() for segment in segments if segment.text and segment.text.strip()]
    return clean_text("\n".join(texts))



async def run_extraction(video_url: str):
    """执行完整的抖音视频文案提取流程"""

    # 创建输出目录
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    task_dir = OUTPUT_DIR / timestamp
    task_dir.mkdir(parents=True, exist_ok=True)

    log_step(f"创建任务目录: {task_dir}")
    print(f"=" * 60)
    print(f"🎬 抖音视频文案提取工具")
    print(f"📹 输入链接: {video_url}")
    print(f"📂 输出目录: {task_dir}")
    print(f"=" * 60)

    try:
        # 1. 解析 URL
        log_step("解析抖音链接...")
        final_url, video_id = await resolve_input_url(video_url)
        log_success(f"识别到视频 ID: {video_id}")
        log_success(f"标准视频页: {final_url}")

        # 2. 使用 Playwright 打开页面
        log_step("打开抖音页面并提取文案...")
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(
                headless=True,
                channel="chrome",
                args=["--disable-blink-features=AutomationControlled"],
            )
            context = await browser.new_context(
                user_agent=DESKTOP_USER_AGENT,
                viewport={"width": 1280, "height": 720},
                locale="zh-CN",
            )
            page = await context.new_page()

            media_candidates = []

            async def on_response(response):
                try:
                    content_type = response.headers.get("content-type", "").lower()
                    if "video" not in content_type and "audio" not in content_type:
                        return

                    content_length = int(response.headers.get("content-length", 0))
                    if content_length < MIN_MEDIA_SIZE_BYTES:
                        return

                    if not any(item["url"] == response.url for item in media_candidates):
                        media_candidates.append({"url": response.url, "size": content_length})
                except Exception:
                    return

            page.on("response", on_response)

            metadata, page_script = await extract_page_content(page, final_url)

            # 尝试关闭弹窗
            try:
                await page.keyboard.press("Escape", delay=300)
            except Exception:
                pass
            await page.wait_for_timeout(6000)

            # 选择最佳媒体 URL
            media_url = pick_media_url(media_candidates)

            await page.close()
            await context.close()
            await browser.close()

        if not page_script:
            raise ValueError("页面已打开，但没有提取到有效文案")

        script_text = page_script
        metadata["video_id"] = video_id
        metadata["media_url"] = media_url

        # 3. 下载媒体并进行语音转写
        if media_url:
            media_path = str(task_dir / "media.mp4")
            log_step("下载视频文件...")
            await download_media(media_url, media_path)
            log_success(f"视频已保存: {media_path}")

            # Whisper 转写
            if WHISPER_AVAILABLE:
                whisper_script = transcribe_media(media_path)
                if whisper_script:
                    script_text = whisper_script
                    log_success("已使用 Whisper 完整口播脚本")
                else:
                    log_error("Whisper 未识别到有效文本，回退到页面文案")
        else:
            log_error("未抓到视频流，将使用页面文案")

        # 4. 保存结果
        metadata_path = task_dir / "metadata.json"
        script_path = task_dir / "script.txt"

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        with open(script_path, "w", encoding="utf-8") as f:
            f.write(script_text)

        log_success("原始文案已保存")

        # 5. 输出结果
        print("\n")
        print("=" * 60)
        print("📊 提取结果")
        print("=" * 60)

        print(f"\n【视频标题】\n{metadata.get('title', '未获取到')}")

        print(f"\n【视频描述】\n{metadata.get('description', '未获取到')[:500]}...")

        print(f"\n【提取脚本】（共 {len(script_text)} 字）\n{script_text[:1000]}")
        if len(script_text) > 1000:
            print("...")

        print("\n" + "=" * 60)
        print(f"✅ 任务完成！所有文件已保存到: {task_dir}")
        print("=" * 60)

        return {
            "title": metadata.get("title", ""),
            "description": metadata.get("description", ""),
            "script": script_text,
            "video_id": video_id,
            "source_url": final_url,
            "task_dir": str(task_dir),
        }

    except Exception as exc:
        log_error(f"提取失败: {exc}")
        raise


async def main():
    """主函数"""
    # 获取视频链接
    if len(sys.argv) > 1:
        video_url = sys.argv[1]
    else:
        # 默认测试链接
        video_url = "https://v.douyin.com/dgurcksJcrc/"
        print(f"[INFO] 未提供链接，使用默认测试链接: {video_url}")

    try:
        await run_extraction(video_url)
    except Exception as e:
        print(f"\n❌ 程序异常退出: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
