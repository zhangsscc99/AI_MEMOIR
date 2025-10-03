#!/bin/bash

# 岁月镜像 Memoir iOS 应用运行脚本
# 通过命令行直接运行iOS应用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 项目路径
PROJECT_ROOT="/Users/Zhuanz1/Desktop/memoir"
MEMOIR_APP_DIR="$PROJECT_ROOT/memoir-app"
IOS_DIR="$MEMOIR_APP_DIR/ios/App"
XCODE_PROJECT="$IOS_DIR/App.xcworkspace"

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

# 检查并创建模拟器
setup_simulator() {
    print_title "📱 设置iOS模拟器"
    
    # 检查是否有可用的模拟器
    local simulators=$(xcrun simctl list devices available | grep iPhone | head -1)
    
    if [ -z "$simulators" ]; then
        print_message $YELLOW "⚠️  没有找到可用的iOS模拟器"
        print_message $BLUE "💡 请先安装Xcode并配置模拟器："
        print_message $BLUE "   1. 打开Xcode"
        print_message $BLUE "   2. 选择 Window → Devices and Simulators"
        print_message $BLUE "   3. 点击 + 添加新的模拟器"
        print_message $BLUE "   4. 选择iPhone型号和iOS版本"
        echo ""
        
        # 尝试打开Xcode
        read -p "🔧 是否打开Xcode来配置模拟器? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open -a Xcode
            print_message $GREEN "✅ Xcode已打开，请配置模拟器后重新运行此脚本"
            exit 0
        else
            print_message $YELLOW "⚠️  无法继续，需要先配置iOS模拟器"
            exit 1
        fi
    else
        print_message $GREEN "✅ 找到可用的模拟器"
        echo "$simulators"
    fi
}

# 方法1: 使用xcodebuild直接运行
run_with_xcodebuild() {
    print_title "🚀 方法1: 使用xcodebuild运行"
    
    # 获取第一个可用的iPhone模拟器
    local simulator_id=$(xcrun simctl list devices available | grep iPhone | head -1 | grep -o '\[.*\]' | tr -d '[]' || echo "")
    
    if [ -z "$simulator_id" ]; then
        print_message $RED "❌ 没有找到可用的模拟器ID"
        return 1
    fi
    
    print_message $BLUE "📱 使用模拟器: $simulator_id"
    
    cd "$IOS_DIR"
    
    # 构建并运行
    print_message $YELLOW "🔨 正在构建并运行应用..."
    if xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,id=$simulator_id" build install; then
        print_message $GREEN "✅ 应用已成功运行到模拟器"
        
        # 启动模拟器
        xcrun simctl boot "$simulator_id" 2>/dev/null || true
        open -a Simulator
        
        print_message $GREEN "🎉 模拟器已启动，应用正在运行！"
    else
        print_message $RED "❌ 运行失败"
        return 1
    fi
}

# 方法2: 使用Capacitor CLI运行
run_with_capacitor() {
    print_title "🚀 方法2: 使用Capacitor CLI运行"
    
    cd "$MEMOIR_APP_DIR"
    
    print_message $YELLOW "🔄 同步到iOS..."
    npx cap sync ios
    
    print_message $YELLOW "🚀 运行到iOS模拟器..."
    if npx cap run ios; then
        print_message $GREEN "✅ 应用已成功运行"
    else
        print_message $RED "❌ 运行失败"
        return 1
    fi
}

# 方法3: 使用Xcode命令行工具
run_with_xcode() {
    print_title "🚀 方法3: 使用Xcode命令行工具"
    
    cd "$IOS_DIR"
    
    # 获取模拟器ID
    local simulator_id=$(xcrun simctl list devices available | grep iPhone | head -1 | grep -o '\[.*\]' | tr -d '[]' || echo "")
    
    if [ -z "$simulator_id" ]; then
        print_message $RED "❌ 没有找到可用的模拟器"
        return 1
    fi
    
    print_message $BLUE "📱 使用模拟器: $simulator_id"
    
    # 启动模拟器
    xcrun simctl boot "$simulator_id" 2>/dev/null || true
    open -a Simulator
    
    # 构建并安装
    print_message $YELLOW "🔨 正在构建应用..."
    xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,id=$simulator_id" build
    
    # 安装应用
    print_message $YELLOW "📱 正在安装应用..."
    xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,id=$simulator_id" -derivedDataPath ./build install
    
    print_message $GREEN "✅ 应用已安装到模拟器"
}

# 主菜单
show_menu() {
    print_title "🍎 Memoir iOS 应用运行工具"
    
    print_message $BLUE "📋 选择运行方式:"
    echo "1. 使用 xcodebuild 直接运行 (推荐)"
    echo "2. 使用 Capacitor CLI 运行"
    echo "3. 使用 Xcode 命令行工具"
    echo "4. 仅打开 Xcode 项目"
    echo "5. 检查模拟器状态"
    echo "6. 退出"
    echo ""
    
    read -p "请输入选项 (1-6): " choice
    
    case $choice in
        1)
            setup_simulator
            run_with_xcodebuild
            ;;
        2)
            setup_simulator
            run_with_capacitor
            ;;
        3)
            setup_simulator
            run_with_xcode
            ;;
        4)
            print_message $YELLOW "🔧 打开Xcode项目..."
            open "$XCODE_PROJECT"
            print_message $GREEN "✅ Xcode已打开"
            ;;
        5)
            print_title "📱 模拟器状态"
            xcrun simctl list devices available | grep iPhone || print_message $YELLOW "没有找到可用的iPhone模拟器"
            ;;
        6)
            print_message $GREEN "👋 再见！"
            exit 0
            ;;
        *)
            print_message $RED "❌ 无效选项"
            show_menu
            ;;
    esac
}

# 快速运行模式
quick_run() {
    print_title "⚡ 快速运行模式"
    
    setup_simulator
    
    # 尝试使用Capacitor CLI
    print_message $YELLOW "🚀 尝试快速运行..."
    cd "$MEMOIR_APP_DIR"
    
    if npx cap run ios --target="iPhone 15"; then
        print_message $GREEN "✅ 应用已成功运行"
    else
        print_message $YELLOW "⚠️  Capacitor运行失败，尝试其他方法..."
        run_with_xcodebuild
    fi
}

# 主函数
main() {
    # 检查参数
    if [ "$1" = "--quick" ] || [ "$1" = "-q" ]; then
        quick_run
    elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        print_message $BLUE "用法:"
        print_message $BLUE "  $0           # 显示菜单"
        print_message $BLUE "  $0 --quick   # 快速运行"
        print_message $BLUE "  $0 --help    # 显示帮助"
        exit 0
    else
        show_menu
    fi
}

# 捕获中断信号
trap 'print_message $RED "\n❌ 运行被中断"; exit 1' INT

# 运行主函数
main "$@"
