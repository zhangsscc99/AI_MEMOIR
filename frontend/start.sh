#!/bin/bash

echo "🚀 启动岁月镜像前端项目"
echo "=============================="

# 检查Node.js版本
node_version=$(node -v 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ 未检测到Node.js，请先安装Node.js (建议版本 >= 16)"
    exit 1
fi

echo "✅ Node.js版本: $node_version"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi

echo ""
echo "🎯 选择运行模式:"
echo "1) Web端开发 (H5)"
echo "2) 微信小程序开发"
echo "3) 构建生产版本"
echo ""
read -p "请选择 (1-3): " choice

case $choice in
    1)
        echo "🌐 启动Web端开发服务器..."
        npm run dev:h5
        ;;
    2)
        echo "📱 启动微信小程序开发..."
        npm run dev:mp-weixin
        ;;
    3)
        echo "🏗️  构建生产版本..."
        npm run build
        ;;
    *)
        echo "❌ 无效选择，默认启动Web端"
        npm run dev:h5
        ;;
esac
