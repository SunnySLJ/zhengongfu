#!/usr/bin/env python3
"""抖音开放平台视频上传脚本。

这个脚本用于实现“代替用户把视频发布到其抖音号”的服务端流程，主要包含 4 步：
1. 生成 OAuth 授权链接，让用户确认授权。
2. 用户授权后，使用回调里的 code 换取 access_token 和 open_id。
3. 调用抖音开放平台上传视频文件。
4. 调用发布接口，把视频真正发到用户的抖音账号。

当前按照“应用能力和权限已经申请通过”的前提开发：
- 权限 scope 默认按 `video.create.bind` 处理。
- 真实的 client_key、client_secret、redirect_uri、token 等配置后续再接入。

本脚本对应的官方接口文档包括：
- 用户授权链接: https://open.douyin.com/platform/oauth/connect/
- code 换 token: https://open.douyin.com/oauth/access_token/
- 刷新 token: https://open.douyin.com/oauth/refresh_token/
- 小文件直传: https://open.douyin.com/api/douyin/v1/video/upload_video/
- 分片上传初始化: https://open.douyin.com/api/douyin/v1/video/init_video_part_upload/
- 分片上传分片: https://open.douyin.com/api/douyin/v1/video/upload_video_part/
- 分片上传完成: https://open.douyin.com/api/douyin/v1/video/complete_video_part_upload/
- 创建视频作品: https://open.douyin.com/api/douyin/v1/video/create_video/
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, Optional
from urllib import error, parse, request


AUTH_BASE_URL = "https://open.douyin.com/platform/oauth/connect/"
TOKEN_URL = "https://open.douyin.com/oauth/access_token/"
REFRESH_TOKEN_URL = "https://open.douyin.com/oauth/refresh_token/"
UPLOAD_VIDEO_URL = "https://open.douyin.com/api/douyin/v1/video/upload_video/"
INIT_PART_UPLOAD_URL = "https://open.douyin.com/api/douyin/v1/video/init_video_part_upload/"
UPLOAD_VIDEO_PART_URL = "https://open.douyin.com/api/douyin/v1/video/upload_video_part/"
COMPLETE_PART_UPLOAD_URL = "https://open.douyin.com/api/douyin/v1/video/complete_video_part_upload/"
CREATE_VIDEO_URL = "https://open.douyin.com/api/douyin/v1/video/create_video/"

DEFAULT_SCOPE = "video.create.bind"
DEFAULT_CHUNK_SIZE = 20 * 1024 * 1024
RECOMMENDED_PART_UPLOAD_THRESHOLD = 50 * 1024 * 1024
MANDATORY_PART_UPLOAD_THRESHOLD = 300 * 1024 * 1024


def load_json_file(path: Optional[str]) -> Dict[str, Any]:
    """读取额外参数 JSON 文件。

    主要用于给 create_video 接口补充扩展字段，例如 POI、小程序等业务字段。
    """
    if not path:
        return {}
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"JSON file not found: {file_path}")
    with file_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def dump_json(data: Dict[str, Any], output_path: Optional[str]) -> None:
    """输出结果到控制台或保存到文件。"""
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    if output_path:
        Path(output_path).write_text(payload + "\n", encoding="utf-8")
        print(f"saved to {output_path}")
        return
    print(payload)


def build_query_url(base_url: str, params: Dict[str, Any]) -> str:
    """拼接 URL 查询参数，自动忽略空值。"""
    filtered = {key: value for key, value in params.items() if value is not None and value != ""}
    return f"{base_url}?{parse.urlencode(filtered)}"


def build_multipart_form(field_name: str, filename: str, content: bytes, content_type: str) -> tuple[bytes, str]:
    """手动构造 multipart/form-data 请求体。

    这里不依赖第三方库，方便直接用标准库完成视频文件上传。
    """
    boundary = f"----CodexDouyin{uuid.uuid4().hex}"
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8")
    )
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(content)
    body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    return bytes(body), f"multipart/form-data; boundary={boundary}"


def parse_api_response(raw_body: bytes) -> Dict[str, Any]:
    """解析抖音接口响应，并统一提取业务错误。

    抖音开放平台部分接口 HTTP 状态码是 200，但真实错误会放在 data/extra 里，
    所以这里做一次统一判断，避免上层误判为成功。
    """
    payload = json.loads(raw_body.decode("utf-8"))
    if isinstance(payload, dict):
        data_error_code = payload.get("data", {}).get("error_code")
        extra_error_code = payload.get("extra", {}).get("error_code")
        message = (
            payload.get("data", {}).get("description")
            or payload.get("extra", {}).get("description")
            or payload.get("message")
            or ""
        )
        error_code = extra_error_code if extra_error_code not in (None, 0) else data_error_code
        if error_code not in (None, 0):
            raise RuntimeError(f"Douyin API error {error_code}: {message or 'unknown error'}")
    return payload


def http_request(
    url: str,
    *,
    method: str = "GET",
    headers: Optional[Dict[str, str]] = None,
    data: Optional[bytes] = None,
    timeout: int = 120,
) -> Dict[str, Any]:
    """统一发送 HTTP 请求。

    功能：
    - 发送 GET/POST 请求
    - 统一处理 HTTP 异常
    - 统一解析抖音返回结构
    """
    req = request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            return parse_api_response(resp.read())
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} {exc.reason}: {body}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"network error: {exc.reason}") from exc


def get_required_value(name: str, cli_value: Optional[str], env_name: str, allow_empty: bool = False) -> str:
    """优先读取命令行参数，其次读取环境变量。"""
    value = cli_value if cli_value is not None else os.getenv(env_name, "")
    if value or allow_empty:
        return value
    raise ValueError(f"missing {name}. Provide --{name.replace('_', '-')} or set {env_name}.")


def build_authorize_url(
    client_key: str,
    redirect_uri: str,
    scope: str = DEFAULT_SCOPE,
    state: Optional[str] = None,
    optional_scope: Optional[str] = None,
) -> str:
    """生成抖音 OAuth 授权地址。

    用途：
    - 用户需要先打开这个链接完成授权
    - 授权完成后，抖音会把 code 回调到 redirect_uri
    - 服务端再用 code 去换 access_token/open_id
    """
    return build_query_url(
        AUTH_BASE_URL,
        {
            "client_key": client_key,
            "response_type": "code",
            "scope": scope,
            "optionalScope": optional_scope,
            "redirect_uri": redirect_uri,
            "state": state,
        },
    )


def exchange_code_for_token(client_key: str, client_secret: str, code: str) -> Dict[str, Any]:
    """使用授权回调得到的 code 换取用户 access_token。"""
    form = parse.urlencode(
        {
            "client_key": client_key,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
        }
    ).encode("utf-8")
    return http_request(
        TOKEN_URL,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data=form,
        timeout=30,
    )


def refresh_access_token(client_key: str, refresh_token: str) -> Dict[str, Any]:
    """使用 refresh_token 刷新用户 access_token。"""
    form = parse.urlencode(
        {
            "client_key": client_key,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
    ).encode("utf-8")
    return http_request(
        REFRESH_TOKEN_URL,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data=form,
        timeout=30,
    )


def upload_video_simple(access_token: str, open_id: str, video_path: Path) -> Dict[str, Any]:
    """小文件直传。

    适用于文件不大时直接一次性上传，调用的是 upload_video 接口。
    """
    content = video_path.read_bytes()
    content_type = mimetypes.guess_type(video_path.name)[0] or "application/octet-stream"
    body, multipart_content_type = build_multipart_form("video", video_path.name, content, content_type)
    url = build_query_url(UPLOAD_VIDEO_URL, {"open_id": open_id})
    return http_request(
        url,
        method="POST",
        headers={
            "access-token": access_token,
            "Content-Type": multipart_content_type,
        },
        data=body,
        timeout=300,
    )


def init_part_upload(access_token: str, open_id: str) -> Dict[str, Any]:
    """初始化分片上传，拿到 upload_id。"""
    url = build_query_url(INIT_PART_UPLOAD_URL, {"open_id": open_id})
    return http_request(
        url,
        method="POST",
        headers={
            "access-token": access_token,
            "Content-Type": "application/json",
        },
        data=b"",
        timeout=60,
    )


def upload_video_part(
    access_token: str,
    open_id: str,
    upload_id: str,
    part_number: int,
    chunk: bytes,
    filename: str,
) -> Dict[str, Any]:
    """上传单个视频分片。"""
    body, multipart_content_type = build_multipart_form(
        "video",
        filename,
        chunk,
        "application/octet-stream",
    )
    url = build_query_url(
        UPLOAD_VIDEO_PART_URL,
        {
            "open_id": open_id,
            "upload_id": upload_id,
            "part_number": part_number,
        },
    )
    return http_request(
        url,
        method="POST",
        headers={
            "access-token": access_token,
            "Content-Type": multipart_content_type,
        },
        data=body,
        timeout=300,
    )


def complete_part_upload(access_token: str, open_id: str, upload_id: str) -> Dict[str, Any]:
    """通知抖音分片上传完成，合并得到最终 video_id。"""
    url = build_query_url(COMPLETE_PART_UPLOAD_URL, {"open_id": open_id, "upload_id": upload_id})
    return http_request(
        url,
        method="POST",
        headers={
            "access-token": access_token,
            "Content-Type": "application/json",
        },
        data=b"",
        timeout=60,
    )


def upload_video(access_token: str, open_id: str, video_path: Path, force_part: bool = False) -> Dict[str, Any]:
    """上传视频文件，并返回抖音侧视频信息。

    逻辑说明：
    - 小文件默认走直传接口
    - 大于推荐阈值时自动走分片上传
    - 大于强制阈值时必须走分片上传
    """
    file_size = video_path.stat().st_size

    # 按文件大小决定上传策略，避免超大文件直传失败。
    if file_size > MANDATORY_PART_UPLOAD_THRESHOLD:
        use_part_upload = True
    elif file_size > RECOMMENDED_PART_UPLOAD_THRESHOLD:
        use_part_upload = True
    else:
        use_part_upload = force_part

    if not use_part_upload:
        # 小文件直接上传，流程更简单。
        response = upload_video_simple(access_token, open_id, video_path)
        return response["data"]["video"]

    # 分片上传第一步：先初始化，拿到 upload_id。
    init_response = init_part_upload(access_token, open_id)
    upload_id = init_response["data"]["upload_id"]

    # 分片上传第二步：按固定块大小循环上传每个分片。
    with video_path.open("rb") as handle:
        part_number = 1
        while True:
            chunk = handle.read(DEFAULT_CHUNK_SIZE)
            if not chunk:
                break
            upload_video_part(
                access_token=access_token,
                open_id=open_id,
                upload_id=upload_id,
                part_number=part_number,
                chunk=chunk,
                filename=video_path.name,
            )
            part_number += 1

    # 分片上传第三步：通知抖音全部上传完成，并拿回 video_id。
    complete_response = complete_part_upload(access_token, open_id, upload_id)
    return complete_response["data"]["video"]


def create_video(
    access_token: str,
    open_id: str,
    video_id: str,
    text: str,
    *,
    private_status: int = 0,
    cover_tsp: Optional[float] = None,
    download_type: Optional[int] = None,
    at_users: Optional[list[str]] = None,
    custom_cover_image_url: Optional[str] = None,
    extra_payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """创建视频作品，把已上传的视频真正发布到用户抖音号。

    参数说明：
    - video_id: 上传视频后拿到的抖音视频 ID
    - text: 发布文案
    - private_status: 可见性配置
    - extra_payload: 预留给后续业务扩展字段
    """
    payload: Dict[str, Any] = {
        "video_id": video_id,
        "text": text,
        "private_status": private_status,
    }
    if cover_tsp is not None:
        payload["cover_tsp"] = cover_tsp
    if download_type is not None:
        payload["download_type"] = download_type
    if at_users:
        payload["at_users"] = at_users
    if custom_cover_image_url:
        payload["custom_cover_image_url"] = custom_cover_image_url
    if extra_payload:
        payload.update(extra_payload)

    url = build_query_url(CREATE_VIDEO_URL, {"open_id": open_id})
    response = http_request(
        url,
        method="POST",
        headers={
            "access-token": access_token,
            "Content-Type": "application/json",
        },
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        timeout=120,
    )
    return response["data"]


def publish_video(args: argparse.Namespace) -> Dict[str, Any]:
    """完整发布流程。

    这个函数是“代用户发抖音”的主流程入口：
    1. 检查 access_token/open_id
    2. 上传本地视频文件
    3. 调用发布接口生成抖音作品
    """
    access_token = get_required_value("access_token", args.access_token, "DOUYIN_ACCESS_TOKEN")
    open_id = get_required_value("open_id", args.open_id, "DOUYIN_OPEN_ID")

    video_path = Path(args.video).expanduser().resolve()
    if not video_path.exists():
        raise FileNotFoundError(f"video file not found: {video_path}")
    if not video_path.is_file():
        raise ValueError(f"video path is not a file: {video_path}")

    # 可选扩展参数，后续你补权限或业务字段时可以直接塞进来。
    extra_payload = load_json_file(args.extra_payload)

    # 先上传视频，拿到抖音 video_id。
    video_info = upload_video(
        access_token=access_token,
        open_id=open_id,
        video_path=video_path,
        force_part=args.force_part_upload,
    )

    # 再基于 video_id 创建作品，正式发到用户账号。
    publish_info = create_video(
        access_token=access_token,
        open_id=open_id,
        video_id=video_info["video_id"],
        text=args.text,
        private_status=args.private_status,
        cover_tsp=args.cover_tsp,
        download_type=args.download_type,
        at_users=args.at_users,
        custom_cover_image_url=args.custom_cover_image_url,
        extra_payload=extra_payload,
    )
    return {
        "video_upload": video_info,
        "video_publish": publish_info,
    }


def build_parser() -> argparse.ArgumentParser:
    """构建命令行参数。

    子命令说明：
    - authorize-url: 生成用户授权链接
    - exchange-token: 用 code 换 token
    - refresh-token: 刷新 token
    - publish: 上传并发布视频
    """
    parser = argparse.ArgumentParser(
        description="通过抖音开放平台上传并发布视频到用户的抖音账号。"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    auth_parser = subparsers.add_parser("authorize-url", help="生成给用户打开的抖音授权链接。")
    auth_parser.add_argument("--client-key", default=os.getenv("DOUYIN_CLIENT_KEY", ""))
    auth_parser.add_argument("--redirect-uri", default=os.getenv("DOUYIN_REDIRECT_URI", ""))
    auth_parser.add_argument("--scope", default=os.getenv("DOUYIN_SCOPE", DEFAULT_SCOPE))
    auth_parser.add_argument("--state", default=os.getenv("DOUYIN_STATE", ""))
    auth_parser.add_argument("--optional-scope", default=os.getenv("DOUYIN_OPTIONAL_SCOPE", ""))
    auth_parser.add_argument("--output", help="可选，保存输出结果到 JSON 文件。")

    exchange_parser = subparsers.add_parser("exchange-token", help="用授权回调 code 换取 access_token/open_id。")
    exchange_parser.add_argument("--client-key", default=os.getenv("DOUYIN_CLIENT_KEY", ""))
    exchange_parser.add_argument("--client-secret", default=os.getenv("DOUYIN_CLIENT_SECRET", ""))
    exchange_parser.add_argument("--code", required=True)
    exchange_parser.add_argument("--output", help="可选，保存 token 结果到 JSON 文件。")

    refresh_parser = subparsers.add_parser("refresh-token", help="刷新抖音用户 access_token。")
    refresh_parser.add_argument("--client-key", default=os.getenv("DOUYIN_CLIENT_KEY", ""))
    refresh_parser.add_argument("--refresh-token", default=os.getenv("DOUYIN_REFRESH_TOKEN", ""))
    refresh_parser.add_argument("--output", help="可选，保存刷新后的 token 到 JSON 文件。")

    publish_parser = subparsers.add_parser("publish", help="上传视频并发布到抖音。")
    publish_parser.add_argument("--access-token", default=os.getenv("DOUYIN_ACCESS_TOKEN", ""))
    publish_parser.add_argument("--open-id", default=os.getenv("DOUYIN_OPEN_ID", ""))
    publish_parser.add_argument("--video", required=True, help="本地视频文件路径。")
    publish_parser.add_argument("--text", required=True, help="视频标题或文案，可以包含话题和 @昵称。")
    publish_parser.add_argument("--private-status", type=int, default=0, choices=[0, 1, 2])
    publish_parser.add_argument("--cover-tsp", type=float, help="封面截帧时间点，单位秒。")
    publish_parser.add_argument("--download-type", type=int, choices=[0, 1], help="0 允许下载，1 不允许下载。")
    publish_parser.add_argument("--custom-cover-image-url", help="自定义封面图，填抖音图片上传后返回的图片标识。")
    publish_parser.add_argument(
        "--at-users",
        nargs="*",
        default=None,
        help="与文案里 @昵称 对应的 open_id 列表。",
    )
    publish_parser.add_argument(
        "--extra-payload",
        help="可选 JSON 文件，会合并进 create_video 请求体，便于补充业务字段。",
    )
    publish_parser.add_argument(
        "--force-part-upload",
        action="store_true",
        help="即使是小文件也强制走分片上传。",
    )
    publish_parser.add_argument("--output", help="可选，保存发布结果到 JSON 文件。")

    return parser


def main() -> int:
    """命令行主入口。"""
    parser = build_parser()
    args = parser.parse_args()

    try:
        if args.command == "authorize-url":
            # 生成给前端或浏览器使用的抖音授权链接。
            client_key = get_required_value("client_key", args.client_key, "DOUYIN_CLIENT_KEY")
            redirect_uri = get_required_value("redirect_uri", args.redirect_uri, "DOUYIN_REDIRECT_URI")
            result = {
                "authorize_url": build_authorize_url(
                    client_key=client_key,
                    redirect_uri=redirect_uri,
                    scope=args.scope,
                    state=args.state or None,
                    optional_scope=args.optional_scope or None,
                ),
                "scope": args.scope,
                "note": "当前按应用能力已开通处理，后续把真实 client_key 和 redirect_uri 配进来即可。",
            }
        elif args.command == "exchange-token":
            # 用户授权成功后，服务端通过 code 换取 access_token/open_id。
            client_key = get_required_value("client_key", args.client_key, "DOUYIN_CLIENT_KEY")
            client_secret = get_required_value("client_secret", args.client_secret, "DOUYIN_CLIENT_SECRET")
            result = exchange_code_for_token(client_key, client_secret, args.code)
        elif args.command == "refresh-token":
            # access_token 过期后，通过 refresh_token 换新 token。
            client_key = get_required_value("client_key", args.client_key, "DOUYIN_CLIENT_KEY")
            refresh_token_value = get_required_value(
                "refresh_token",
                args.refresh_token,
                "DOUYIN_REFRESH_TOKEN",
            )
            result = refresh_access_token(client_key, refresh_token_value)
        elif args.command == "publish":
            # 执行完整的视频上传 + 发布流程。
            result = publish_video(args)
        else:
            parser.error(f"unsupported command: {args.command}")
            return 2

        dump_json(result, getattr(args, "output", None))
        return 0
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
