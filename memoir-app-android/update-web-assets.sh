#!/bin/bash

# 更新 Web 资源脚本
# 此脚本用于将 memoir-app 的构建结果同步到 Android 项目

echo "🔄 更新 Android 应用的 Web 资源..."

# 检查 memoir-app 目录
if [ ! -d "../memoir-app" ]; then
    echo "❌ 未找到 memoir-app 目录"
    exit 1
fi

# 进入 memoir-app 目录
cd ../memoir-app

echo "📦 构建 Web 应用..."
npm run build:h5

if [ $? -ne 0 ]; then
    echo "❌ Web 应用构建失败"
    exit 1
fi

echo "🔄 同步到 Android 项目..."
npx cap sync android

if [ $? -eq 0 ]; then
    echo "✅ Web 资源更新成功！"
    echo ""
    echo "📋 下一步："
    echo "   1. 运行 ./build.sh 构建 APK"
    echo "   2. 或使用 Android Studio 打开 android 项目"
else
    echo "❌ 同步失败"
    exit 1
fi
