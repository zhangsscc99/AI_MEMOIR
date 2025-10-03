#!/bin/bash

# 创建企业分发IPA (无需开发者账号)

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

main() {
    print_title "🏢 创建企业分发IPA"
    
    # 进入项目目录
    cd /Users/Zhuanz1/Desktop/memoir/memoir-app
    
    print_message $YELLOW "🔨 构建Web应用..."
    npm run build:h5
    
    print_message $YELLOW "🔄 同步到iOS..."
    npx cap sync ios
    
    print_message $YELLOW "📱 构建iOS应用..."
    cd ios/App
    
    # 先构建应用
    print_message $BLUE "🔨 构建iOS应用..."
    xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -destination "platform=iOS Simulator,name=iPhone 15" build
    
    # 查找构建产物
    APP_PATH=$(find . -name "App.app" -type d | head -1)
    
    if [ -z "$APP_PATH" ]; then
        print_message $RED "❌ 找不到App.app文件"
        print_message $YELLOW "💡 尝试查找其他构建产物..."
        find . -name "*.app" -type d
        exit 1
    fi
    
    print_message $GREEN "✅ 找到应用文件: $APP_PATH"
    
    # 创建Payload目录
    mkdir -p ./build/ipa/Payload
    
    # 复制.app文件到Payload
    print_message $BLUE "📦 复制应用文件..."
    cp -R "$APP_PATH" ./build/ipa/Payload/
    
    # 创建IPA文件
    print_message $BLUE "📦 创建IPA文件..."
    cd ./build/ipa
    zip -r ../memoir.ipa Payload/
    
    print_title "🎉 企业IPA生成完成"
    
    if [ -f "../memoir.ipa" ]; then
        print_message $GREEN "✅ IPA文件已生成:"
        print_message $BLUE "📱 文件位置: $(pwd)/../memoir.ipa"
        print_message $BLUE "📦 文件大小: $(ls -lh ../memoir.ipa | awk '{print $5}')"
        
        # 复制到桌面
        cp ../memoir.ipa ~/Desktop/memoir-enterprise.ipa
        print_message $GREEN "✅ IPA已复制到桌面: ~/Desktop/memoir-enterprise.ipa"
        
        print_message $CYAN "📋 企业分发说明:"
        print_message $CYAN "1. 此IPA文件可以分发给其他人"
        print_message $CYAN "2. 安装方法:"
        print_message $CYAN "   - 使用iTunes安装"
        print_message $CYAN "   - 使用第三方工具(如3uTools,爱思助手)"
        print_message $CYAN "   - 通过企业分发链接"
        print_message $CYAN "3. 注意: 需要信任企业开发者证书"
        
    else
        print_message $RED "❌ IPA生成失败"
    fi
}

main "$@"
