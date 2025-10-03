#!/bin/bash

# 生成iOS IPA安装包脚本

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
    print_title "📱 生成iOS IPA安装包"
    
    # 进入项目目录
    cd /Users/Zhuanz1/Desktop/memoir/memoir-app
    
    print_message $YELLOW "🔨 构建Web应用..."
    npm run build:h5
    
    print_message $YELLOW "🔄 同步到iOS..."
    npx cap sync ios
    
    print_message $YELLOW "📱 构建iOS应用..."
    cd ios/App
    
    # 构建Archive
    print_message $BLUE "📦 创建Archive..."
    xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -archivePath ./build/App.xcarchive archive
    
    # 导出IPA
    print_message $BLUE "📦 导出IPA文件..."
    
    # 创建ExportOptions.plist
    cat > ExportOptions.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>ad-hoc</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>compileBitcode</key>
    <false/>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF
    
    # 导出IPA
    xcodebuild -exportArchive -archivePath ./build/App.xcarchive -exportPath ./build/ipa -exportOptionsPlist ExportOptions.plist
    
    print_title "🎉 IPA生成完成"
    
    if [ -f "./build/ipa/App.ipa" ]; then
        print_message $GREEN "✅ IPA文件已生成:"
        print_message $BLUE "📱 文件位置: $(pwd)/build/ipa/App.ipa"
        print_message $BLUE "📦 文件大小: $(ls -lh ./build/ipa/App.ipa | awk '{print $5}')"
        
        # 复制到桌面
        cp ./build/ipa/App.ipa ~/Desktop/memoir.ipa
        print_message $GREEN "✅ IPA已复制到桌面: ~/Desktop/memoir.ipa"
        
        print_message $CYAN "📋 安装说明:"
        print_message $CYAN "1. 将IPA文件发送给其他人"
        print_message $CYAN "2. 使用iTunes或第三方工具安装"
        print_message $CYAN "3. 或通过企业分发链接安装"
        
    else
        print_message $RED "❌ IPA生成失败"
        print_message $YELLOW "💡 请检查开发者证书配置"
    fi
}

main "$@"
