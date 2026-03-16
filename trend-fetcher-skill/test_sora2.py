#!/usr/bin/env python3
"""
Sora2 视频生成测试脚本

测试各个 API 服务商的连接性和视频生成能力。

用法:
  python3 test_sora2.py --all           # 测试所有服务商
  python3 test_sora2.py --provider grsai  # 测试单个服务商
  python3 test_sora2.py --help          # 查看帮助
"""
import json, sys, os, time
sys.path.insert(0, os.path.dirname(__file__))

from scripts.sora2_generator import (
    _load_sora_config, SORA_DEFAULT_PROVIDERS, PROVIDERS,
    sora2_generate, sora2_poll_status, show_status
)

TEST_PROMPT = "A cute cat playing with a ball of yarn, sunny day, realistic style"

def test_provider(provider_key: str, mock: bool = False) -> dict:
    """测试单个服务商"""
    print(f"\n{'='*50}")
    print(f"测试服务商：{provider_key}")
    print(f"{'='*50}\n")

    config = _load_sora_config()
    providers = config.get("providers", SORA_DEFAULT_PROVIDERS)

    if provider_key not in providers:
        print(f"❌ 未知的服务商：{provider_key}")
        return {"provider": provider_key, "status": "error", "error": "未知服务商"}

    p = providers[provider_key]
    pinfo = PROVIDERS.get(provider_key, {})

    print(f"  名称：{pinfo.get('name', p.get('name', provider_key))}")
    print(f"  Host: {p['host']}")
    print(f"  Key:  {p['apiKey'][:8]}...{p['apiKey'][-4:]}")
    print()

    if mock:
        print("  [模拟模式] 跳过实际 API 调用")
        return {"provider": provider_key, "status": "mock", "note": "模拟测试"}

    # 步骤 1: 提交生成任务
    print("  📤 提交生成任务...")
    result = sora2_generate(
        prompt=TEST_PROMPT,
        provider_key=provider_key,
        duration=3,
    )

    print(f"    状态：{result.get('status')}")

    if result.get("status") == "error":
        print(f"    ❌ 错误：{result.get('error')}")
        return {**result, "provider": provider_key}

    if result.get("status") == "completed":
        print(f"    ✅ 同步完成!")
        print(f"    🎬 视频：{result.get('video_url')}")
        return {**result, "provider": provider_key}

    task_id = result.get("task_id")
    print(f"    📋 task_id: {task_id[:30]}...")

    # 步骤 2: 轮询状态（最多 3 次，快速测试）
    print("\n  ⏳ 轮询状态（最多 3 次）...")
    for i in range(3):
        time.sleep(2)
        poll_result = sora2_poll_status(task_id, timeout=10, interval=2)
        print(f"    第{i+1}次：{poll_result.get('status')} {poll_result.get('progress', 0)}%")

        if poll_result.get("status") == "completed":
            print(f"    ✅ 生成完成!")
            print(f"    🎬 视频：{poll_result.get('video_url')}")
            return {"provider": provider_key, **result, **poll_result}
        elif poll_result.get("status") == "failed":
            print(f"    ❌ 生成失败：{poll_result.get('error')}")
            return {"provider": provider_key, **result, **poll_result}

    # 超时未完成
    print(f"    ⏱️  测试超时（任务仍在进行中，可继续轮询）")
    return {"provider": provider_key, **result, "test_status": "timeout"}

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Sora2 视频生成测试")
    parser.add_argument("--all", action="store_true", help="测试所有服务商")
    parser.add_argument("--provider", type=str, help="测试指定服务商")
    parser.add_argument("--mock", action="store_true", help="模拟模式")
    parser.add_argument("--status", action="store_true", help="显示配置状态")
    args = parser.parse_args()

    if args.status:
        show_status()
        return

    config = _load_sora_config()
    providers = config.get("providers", SORA_DEFAULT_PROVIDERS)

    if args.all:
        # 测试所有服务商
        results = []
        for pk in providers.keys():
            result = test_provider(pk, mock=args.mock)
            results.append(result)

        # 汇总结果
        print(f"\n{'='*50}")
        print("测试结果汇总")
        print(f"{'='*50}\n")

        success = sum(1 for r in results if r.get("status") == "completed")
        error = sum(1 for r in results if r.get("status") == "error")
        timeout = sum(1 for r in results if r.get("test_status") == "timeout")

        print(f"  ✅ 成功：{success}")
        print(f"  ❌ 失败：{error}")
        print(f"  ⏱️  超时：{timeout}")

        # 保存结果
        out_file = "sora2_test_result.json"
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\n💾 结果已保存：{out_file}")

    elif args.provider:
        # 测试单个服务商
        result = test_provider(args.provider, mock=args.mock)
        print(f"\n测试结果：{json.dumps(result, ensure_ascii=False, indent=2)}")

    else:
        print("请使用 --all 测试所有服务商，或 --provider <name> 测试单个服务商")
        print("使用 --mock 进行模拟测试（不调用 API）")

if __name__ == "__main__":
    main()
