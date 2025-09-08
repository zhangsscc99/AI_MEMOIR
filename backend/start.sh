#!/bin/bash

echo "🚀 启动岁月镜像后端服务..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 进入后端目录
cd "$(dirname "$0")"

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "❌ package.json 文件不存在"
    exit 1
fi

# 安装依赖（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 创建上传目录
mkdir -p uploads

# 设置环境变量
export NODE_ENV=development
export PORT=3001

echo "✅ 环境准备完成"
echo "🔧 当前配置:"
echo "   - 运行环境: $NODE_ENV"
echo "   - 监听端口: $PORT"
echo "   - 数据库: SQLite (./database.sqlite)"
echo ""

# 启动开发服务器
echo "🎯 启动开发服务器..."
npm run dev
