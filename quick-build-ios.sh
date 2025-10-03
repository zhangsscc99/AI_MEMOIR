#!/bin/bash

# 岁月镜像 Memoir iOS 快速构建脚本
# 简化版本 - 无交互式操作

echo "🍎 开始构建 iOS 应用..."

# 进入memoir-app目录
cd /Users/Zhuanz1/Desktop/memoir/memoir-app

# 1. 构建Web应用
echo "📦 构建Web应用..."
npm run build:h5

# 2. 同步到iOS
echo "🔄 同步到iOS..."
npx cap sync ios

# 3. 安装依赖
echo "📦 安装iOS依赖..."
cd ios/App
pod install

# 4. 构建iOS应用
echo "🍎 构建iOS应用..."
xcodebuild -workspace App.xcworkspace -scheme App build

echo "✅ iOS构建完成！"
echo "🔧 打开Xcode: open /Users/Zhuanz1/Desktop/memoir/memoir-app/ios/App/App.xcworkspace"
