#!/bin/bash

# 简化的 APK 构建脚本
echo "🚀 开始构建 APK..."

# 设置环境变量
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk

# 进入 Android 项目目录
cd android

echo "📦 清理项目..."
./gradlew clean

echo "🔨 构建 APK..."
./gradlew assembleDebug --no-daemon

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo ""
    echo "📱 APK 文件位置："
    echo "   $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📋 安装命令："
    echo "   adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "🎉 构建完成！"
else
    echo "❌ 构建失败"
    exit 1
fi
