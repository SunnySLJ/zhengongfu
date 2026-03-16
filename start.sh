#!/bin/bash
# AutoPipeline 一键启动脚本
# 启动 API 后端 + SaaS 前端

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$SCRIPT_DIR/trend-fetcher-skill"
APP_DIR="$SCRIPT_DIR/frontend/saas-app"

echo "=================================="
echo "  AutoPipeline 启动中..."
echo "=================================="

# 1. 启动 API 后端 (端口 8080)
echo "[1/2] 启动 API 服务..."
cd "$API_DIR"
PYTHONIOENCODING=utf-8 python server.py &
API_PID=$!
sleep 2

# 2. 启动前端 (Vite dev server)
echo "[2/2] 启动前端应用..."
cd "$APP_DIR"
npm run dev &
APP_PID=$!

echo ""
echo "=================================="
echo "  启动完成!"
echo "  前端: http://localhost:5173"
echo "  API:  http://localhost:8080"
echo "=================================="
echo "  按 Ctrl+C 停止所有服务"
echo "=================================="

# 捕获退出信号，停止所有进程
trap "echo '正在停止服务...'; kill $API_PID $APP_PID 2>/dev/null; exit" INT TERM
wait
