#!/bin/bash

# 岁月镜像 Memoir iOS 应用构建脚本
# 作者: AI Assistant
# 版本: 1.0
# 描述: 自动构建iOS应用

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/Users/Zhuanz1/Desktop/memoir"
MEMOIR_APP_DIR="$PROJECT_ROOT/memoir-app"
IOS_DIR="$MEMOIR_APP_DIR/ios"
XCODE_PROJECT="$IOS_DIR/App/App.xcworkspace"

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 打印标题
print_title() {
    echo ""
    print_message $CYAN "=================================="
    print_message $CYAN "$1"
    print_message $CYAN "=================================="
    echo ""
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_message $RED "❌ 错误: $1 命令未找到"
        print_message $YELLOW "请确保已安装 $2"
        exit 1
    fi
}

# 检查目录是否存在
check_directory() {
    if [ ! -d "$1" ]; then
        print_message $RED "❌ 错误: 目录不存在 $1"
        exit 1
    fi
}

# 主函数
main() {
    print_title "🍎 岁月镜像 Memoir iOS 构建工具"
    
    # 显示构建信息
    print_message $BLUE "📋 构建信息:"
    print_message $BLUE "   项目路径: $PROJECT_ROOT"
    print_message $BLUE "   应用目录: $MEMOIR_APP_DIR"
    print_message $BLUE "   iOS项目: $IOS_DIR"
    print_message $BLUE "   Xcode项目: $XCODE_PROJECT"
    echo ""
    
    # 检查必要的命令
    print_message $YELLOW "🔍 检查构建环境..."
    check_command "npm" "Node.js 和 npm"
    check_command "npx" "Node.js 和 npx"
    check_command "xcodebuild" "Xcode Command Line Tools"
    check_command "pod" "CocoaPods"
    print_message $GREEN "✅ 构建环境检查通过"
    
    # 检查必要的目录
    print_message $YELLOW "📁 检查项目目录..."
    check_directory "$PROJECT_ROOT"
    check_directory "$MEMOIR_APP_DIR"
    check_directory "$IOS_DIR"
    print_message $GREEN "✅ 项目目录检查通过"
    
    # 步骤1: 构建Web应用
    print_title "📦 步骤1: 构建Web应用"
    cd "$MEMOIR_APP_DIR"
    print_message $YELLOW "🔨 正在构建Web应用..."
    
    if npm run build:h5; then
        print_message $GREEN "✅ Web应用构建成功"
    else
        print_message $RED "❌ Web应用构建失败"
        exit 1
    fi
    
    # 步骤2: 同步到iOS
    print_title "🔄 步骤2: 同步到iOS平台"
    print_message $YELLOW "🔄 正在同步Web资源到iOS..."
    
    if npx cap sync ios; then
        print_message $GREEN "✅ iOS同步成功"
    else
        print_message $RED "❌ iOS同步失败"
        exit 1
    fi
    
    # 步骤3: 安装CocoaPods依赖
    print_title "📱 步骤3: 安装iOS依赖"
    cd "$IOS_DIR/App"
    print_message $YELLOW "📦 正在安装CocoaPods依赖..."
    
    if pod install; then
        print_message $GREEN "✅ CocoaPods依赖安装成功"
    else
        print_message $RED "❌ CocoaPods依赖安装失败"
        exit 1
    fi
    
    # 步骤4: 构建iOS应用
    print_title "🍎 步骤4: 构建iOS应用"
    print_message $YELLOW "🔨 正在构建iOS应用..."
    
    # 检查是否有可用的模拟器
    SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -o '\[.*\]' | tr -d '[]' || echo "")
    
    if [ -n "$SIMULATOR_ID" ]; then
        print_message $BLUE "📱 找到模拟器: $SIMULATOR_ID"
        
        # 构建并运行到模拟器
        if xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,id=$SIMULATOR_ID" build; then
            print_message $GREEN "✅ iOS应用构建成功"
            
            # 询问是否安装到模拟器
            echo ""
            read -p "📱 是否安装到模拟器? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_message $YELLOW "🚀 正在安装到模拟器..."
                if xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,id=$SIMULATOR_ID" -derivedDataPath ./build install; then
                    print_message $GREEN "✅ 应用已安装到模拟器"
                else
                    print_message $YELLOW "⚠️  安装到模拟器失败，但构建成功"
                fi
            fi
        else
            print_message $RED "❌ iOS应用构建失败"
            exit 1
        fi
    else
        print_message $YELLOW "⚠️  未找到可用的iOS模拟器"
        print_message $BLUE "💡 建议: 打开Xcode并创建模拟器，或连接真机设备"
        
        # 只构建，不运行
        if xcodebuild -workspace App.xcworkspace -scheme App build; then
            print_message $GREEN "✅ iOS应用构建成功"
        else
            print_message $RED "❌ iOS应用构建失败"
            exit 1
        fi
    fi
    
    # 显示结果
    print_title "🎯 构建完成"
    print_message $GREEN "🎉 iOS应用构建成功！"
    print_message $BLUE "📱 项目位置: $XCODE_PROJECT"
    print_message $BLUE "🔧 使用Xcode打开: open \"$XCODE_PROJECT\""
    
    # 询问是否打开Xcode
    echo ""
    read -p "🔧 是否打开Xcode项目? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$XCODE_PROJECT"
        print_message $GREEN "✅ Xcode已打开"
    fi
    
    print_title "✨ iOS构建流程完成"
    print_message $CYAN "📖 下一步:"
    print_message $CYAN "   1. 在Xcode中配置开发者账号"
    print_message $CYAN "   2. 选择目标设备或模拟器"
    print_message $CYAN "   3. 点击运行按钮或按 Cmd+R"
    print_message $CYAN "   4. 如需发布，选择 Product → Archive"
}

# 捕获中断信号
trap 'print_message $RED "\n❌ 构建被中断"; exit 1' INT

# 运行主函数
main "$@"
