#!/bin/bash

# 岁月镜像 Android 应用快速启动脚本
# 此脚本用于快速设置和构建 Android 应用

echo "🚀 岁月镜像 Android 应用快速启动"
echo "=================================="

# 检查是否安装了 Android Studio
if ! command -v android-studio &> /dev/null && [ ! -d "/Applications/Android Studio.app" ]; then
    echo "⚠️  未检测到 Android Studio"
    echo "请先安装 Android Studio: https://developer.android.com/studio"
    echo ""
fi

# 检查 Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  未设置 ANDROID_HOME 环境变量"
    echo "请设置 Android SDK 路径："
    echo "export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo ""
fi

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "❌ 未检测到 Java"
    echo "请先安装 Java 8 或更高版本"
    exit 1
fi

echo "📋 选择操作："
echo "1. 构建 APK"
echo "2. 更新 Web 资源"
echo "3. 打开 Android Studio"
echo "4. 安装到设备"
echo "5. 查看帮助"
echo ""

read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo "🔨 开始构建 APK..."
        ./build.sh
        ;;
    2)
        echo "🔄 更新 Web 资源..."
        ./update-web-assets.sh
        ;;
    3)
        echo "📱 打开 Android Studio..."
        if [ -d "/Applications/Android Studio.app" ]; then
            open -a "Android Studio" android/
        else
            echo "❌ 未找到 Android Studio"
            echo "请手动打开 Android Studio 并选择 android 文件夹"
        fi
        ;;
    4)
        echo "📲 安装到设备..."
        if command -v adb &> /dev/null; then
            adb install android/app/build/outputs/apk/debug/app-debug.apk
        else
            echo "❌ 未找到 adb 命令"
            echo "请确保 Android SDK platform-tools 在 PATH 中"
        fi
        ;;
    5)
        echo "📖 查看帮助文档..."
        echo ""
        echo "📚 文档位置："
        echo "  - README.md: 项目说明"
        echo "  - INSTALLATION_GUIDE.md: 详细安装指南"
        echo ""
        echo "🔧 常用命令："
        echo "  - ./build.sh: 构建 APK"
        echo "  - ./update-web-assets.sh: 更新 Web 资源"
        echo "  - adb install app-debug.apk: 安装 APK"
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "✅ 操作完成！"
