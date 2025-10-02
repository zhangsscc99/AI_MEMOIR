#!/bin/bash

# 岁月镜像 Memoir APK 一键构建脚本
# 作者: AI Assistant
# 版本: 1.0
# 描述: 自动构建memoir.apk文件

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
ANDROID_DIR="$MEMOIR_APP_DIR/android"
APK_OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/apk/debug"
APK_FILE="$APK_OUTPUT_DIR/memoir.apk"

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

# 清理旧的构建文件
clean_build() {
    print_message $YELLOW "🧹 清理旧的构建文件..."
    if [ -f "$APK_FILE" ]; then
        rm -f "$APK_FILE"
        print_message $GREEN "✅ 已删除旧的APK文件"
    fi
    
    if [ -d "$MEMOIR_APP_DIR/dist" ]; then
        rm -rf "$MEMOIR_APP_DIR/dist"
        print_message $GREEN "✅ 已清理dist目录"
    fi
}

# 主函数
main() {
    print_title "🚀 岁月镜像 Memoir APK 构建工具"
    
    # 显示构建信息
    print_message $BLUE "📋 构建信息:"
    print_message $BLUE "   项目路径: $PROJECT_ROOT"
    print_message $BLUE "   应用目录: $MEMOIR_APP_DIR"
    print_message $BLUE "   输出路径: $APK_FILE"
    echo ""
    
    # 检查必要的命令
    print_message $YELLOW "🔍 检查构建环境..."
    check_command "npm" "Node.js 和 npm"
    check_command "npx" "Node.js 和 npx"
    check_command "java" "Java JDK"
    print_message $GREEN "✅ 构建环境检查通过"
    
    # 检查必要的目录
    print_message $YELLOW "📁 检查项目目录..."
    check_directory "$PROJECT_ROOT"
    check_directory "$MEMOIR_APP_DIR"
    check_directory "$ANDROID_DIR"
    print_message $GREEN "✅ 项目目录检查通过"
    
    # 询问是否清理旧文件
    echo ""
    read -p "🗑️  是否清理旧的构建文件? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        clean_build
    fi
    
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
    
    # 步骤2: 同步到Android
    print_title "🔄 步骤2: 同步到Android平台"
    print_message $YELLOW "🔄 正在同步Web资源到Android..."
    
    if npx cap sync android; then
        print_message $GREEN "✅ Android同步成功"
    else
        print_message $RED "❌ Android同步失败"
        exit 1
    fi
    
    # 步骤3: 构建APK
    print_title "📱 步骤3: 构建Android APK"
    cd "$ANDROID_DIR"
    print_message $YELLOW "🔨 正在构建APK文件..."
    
    if ./gradlew assembleDebug; then
        print_message $GREEN "✅ APK构建成功"
    else
        print_message $RED "❌ APK构建失败"
        exit 1
    fi
    
    # 验证APK文件
    print_title "🎯 构建完成"
    if [ -f "$APK_FILE" ]; then
        APK_SIZE=$(ls -lh "$APK_FILE" | awk '{print $5}')
        print_message $GREEN "🎉 构建成功！"
        print_message $GREEN "📱 APK文件: $APK_FILE"
        print_message $GREEN "📦 文件大小: $APK_SIZE"
        
        # 显示安装命令
        echo ""
        print_message $CYAN "📲 安装到手机:"
        print_message $BLUE "   adb install \"$APK_FILE\""
        
        # 显示复制到桌面的选项
        echo ""
        read -p "📋 是否复制APK到桌面? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp "$APK_FILE" "$HOME/Desktop/memoir.apk"
            print_message $GREEN "✅ APK已复制到桌面: ~/Desktop/memoir.apk"
        fi
        
    else
        print_message $RED "❌ 错误: APK文件未找到"
        exit 1
    fi
    
    print_title "✨ 构建流程完成"
}

# 捕获中断信号
trap 'print_message $RED "\n❌ 构建被中断"; exit 1' INT

# 运行主函数
main "$@"
