#!/bin/bash

# 岁月镜像 Memoir iOS 应用快速运行脚本
# 最简单的命令行运行方式

echo "🍎 快速运行 iOS 应用..."

# 进入memoir-app目录
cd /Users/Zhuanz1/Desktop/memoir/memoir-app

# 方法1: 使用Capacitor CLI (最简单)
echo "🚀 使用 Capacitor CLI 运行..."
if npx cap run ios; then
    echo "✅ 应用已成功运行到iOS模拟器"
    exit 0
fi

echo "⚠️  Capacitor运行失败，尝试其他方法..."

# 方法2: 使用xcodebuild
echo "🔨 使用 xcodebuild 运行..."
cd ios/App

# 获取第一个可用的iPhone模拟器
SIMULATOR_ID=$(xcrun simctl list devices available | grep iPhone | head -1 | grep -o '\[.*\]' | tr -d '[]' 2>/dev/null || echo "")

if [ -n "$SIMULATOR_ID" ]; then
    echo "📱 使用模拟器: $SIMULATOR_ID"
    
    # 启动模拟器
    xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
    open -a Simulator
    
    # 构建并运行
    xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,id=$SIMULATOR_ID" build install
    
    echo "✅ 应用已安装到模拟器"
else
    echo "❌ 没有找到可用的模拟器"
    echo "💡 请先安装Xcode并配置模拟器"
    echo "🔧 打开Xcode: open App.xcworkspace"
fi
