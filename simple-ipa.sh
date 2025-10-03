#!/bin/bash

# 简单的IPA生成脚本

set -e

echo "🍎 生成iOS IPA安装包..."

# 进入项目目录
cd memoir-app

echo "🔨 构建Web应用..."
npm run build:h5

echo "🔄 同步到iOS..."
npx cap sync ios

echo "📱 运行iOS应用 (这会生成.app文件)..."
npx cap run ios --target="F72A1F19-EE9C-4977-9558-7FBE01D218AB" --no-open

echo "📦 查找生成的.app文件..."
APP_PATH=$(find ios -name "App.app" -type d | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ 找不到App.app文件"
    echo "💡 尝试查找其他.app文件..."
    find ios -name "*.app" -type d
    exit 1
fi

echo "✅ 找到应用文件: $APP_PATH"

# 创建IPA目录
IPA_DIR="./ipa-build"
mkdir -p "$IPA_DIR/Payload"

echo "📦 复制应用文件..."
cp -R "$APP_PATH" "$IPA_DIR/Payload/"

echo "📦 创建IPA文件..."
cd "$IPA_DIR"
zip -r "../memoir.ipa" Payload/

cd ..

echo "🎉 IPA生成完成！"
echo "📱 文件位置: $(pwd)/memoir.ipa"
echo "📦 文件大小: $(ls -lh memoir.ipa | awk '{print $5}')"

# 复制到桌面
cp memoir.ipa ~/Desktop/memoir.ipa
echo "✅ IPA已复制到桌面: ~/Desktop/memoir.ipa"

echo ""
echo "📋 安装说明:"
echo "1. 将memoir.ipa文件发送给其他人"
echo "2. 使用iTunes或第三方工具安装"
echo "3. 或通过企业分发链接安装"
