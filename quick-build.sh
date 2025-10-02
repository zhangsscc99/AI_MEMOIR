#!/bin/bash

# 岁月镜像 Memoir APK 快速构建脚本
# 简化版本 - 无交互式操作

echo "🚀 开始构建 memoir.apk..."

# 进入memoir-app目录
cd /Users/Zhuanz1/Desktop/memoir/memoir-app

# 1. 构建Web应用
echo "📦 构建Web应用..."
npm run build:h5

# 2. 同步到Android
echo "🔄 同步到Android..."
npx cap sync android

# 3. 构建APK
echo "📱 构建APK..."
cd android
./gradlew assembleDebug

# 检查结果
APK_FILE="app/build/outputs/apk/debug/memoir.apk"
if [ -f "$APK_FILE" ]; then
    echo "✅ 构建成功！"
    echo "📱 APK位置: $(pwd)/$APK_FILE"
    echo "📦 文件大小: $(ls -lh $APK_FILE | awk '{print $5}')"
    echo ""
    echo "📲 安装命令: adb install $(pwd)/$APK_FILE"
else
    echo "❌ 构建失败！APK文件未找到"
    exit 1
fi
