#!/bin/bash

# 岁月镜像 Memoir iOS 应用调试脚本
# 启用Live Reload和调试功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_title() {
    echo ""
    print_message $CYAN "=================================="
    print_message $CYAN "$1"
    print_message $CYAN "=================================="
    echo ""
}

# 获取本机IP地址
get_local_ip() {
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
}

main() {
    print_title "🔍 Memoir iOS 应用调试工具"
    
    # 获取本机IP
    LOCAL_IP=$(get_local_ip)
    print_message $BLUE "📱 本机IP地址: $LOCAL_IP"
    
    # 进入项目目录
    cd /Users/Zhuanz1/Desktop/memoir/memoir-app
    
    print_message $YELLOW "🚀 启动开发服务器..."
    
    # 启动开发服务器
    npm run dev:h5 &
    DEV_SERVER_PID=$!
    
    # 等待服务器启动
    sleep 5
    
    print_message $GREEN "✅ 开发服务器已启动"
    print_message $BLUE "🌐 本地地址: http://localhost:8080"
    print_message $BLUE "🌐 网络地址: http://$LOCAL_IP:8080"
    
    print_title "📱 运行iOS应用 (Live Reload)"
    
    # 运行iOS应用并启用Live Reload
    print_message $YELLOW "🔨 正在运行iOS应用..."
    
    if npx cap run ios --target="F72A1F19-EE9C-4977-9558-7FBE01D218AB" --live-reload --host="$LOCAL_IP" --port=8080; then
        print_message $GREEN "✅ iOS应用已启动 (Live Reload已启用)"
    else
        print_message $RED "❌ 运行失败"
        kill $DEV_SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    print_title "🔍 调试方法"
    print_message $BLUE "1. Safari Web Inspector:"
    print_message $BLUE "   - 打开Safari"
    print_message $BLUE "   - 开发 → iPhone 15 Simulator → localhost → Memoir"
    print_message $BLUE ""
    print_message $BLUE "2. Xcode控制台:"
    print_message $BLUE "   - 在Xcode底部查看控制台输出"
    print_message $BLUE ""
    print_message $BLUE "3. Live Reload:"
    print_message $BLUE "   - 修改代码后自动刷新应用"
    print_message $BLUE "   - 无需重新构建"
    
    print_title "🎯 调试完成"
    print_message $GREEN "🎉 现在可以调试iOS应用了！"
    print_message $YELLOW "💡 提示: 按 Ctrl+C 停止调试"
    
    # 等待用户中断
    trap 'print_message $YELLOW "\n🛑 停止调试..."; kill $DEV_SERVER_PID 2>/dev/null || true; exit 0' INT
    
    # 保持脚本运行
    while true; do
        sleep 1
    done
}

main "$@"
