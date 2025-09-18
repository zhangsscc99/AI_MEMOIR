#!/bin/bash

# 岁月镜像 Android 应用构建脚本
# 此脚本用于构建 Android APK

echo "🚀 开始构建岁月镜像 Android 应用..."

# 检查环境
echo "📋 检查构建环境..."

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "❌ Java 未安装，请先安装 Java 8+"
    exit 1
fi

# 检查 Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️  警告: 未设置 ANDROID_HOME 或 ANDROID_SDK_ROOT 环境变量"
    echo "请设置 Android SDK 路径，例如："
    echo "export ANDROID_HOME=/path/to/android/sdk"
    echo "export ANDROID_SDK_ROOT=/path/to/android/sdk"
    echo ""
    echo "继续构建..."
fi

# 进入 Android 项目目录
cd android

echo "📦 清理项目..."
./gradlew clean

echo "🔨 构建 Debug APK..."
./gradlew assembleDebug

# 检查构建结果
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
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
