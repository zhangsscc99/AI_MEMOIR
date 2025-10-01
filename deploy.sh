#!/bin/bash

# 部署脚本
SERVER_IP="103.146.125.208"
SERVER_USER="root"
FRONTEND_DIR="/var/www/MEMOIR"
BACKEND_DIR="/srv/memoir"

echo "🚀 开始部署 MEMOIR 应用..."

# 1. 构建前端
echo "📦 构建前端..."
cd memoir-app
npm run build:serve
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

# 2. 创建服务器目录
echo "📁 创建服务器目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $FRONTEND_DIR && chown -R www-data:www-data $FRONTEND_DIR && chmod -R 755 $FRONTEND_DIR"

# 3. 上传前端文件
echo "📤 上传前端文件..."
scp -r dist/build/h5/* $SERVER_USER@$SERVER_IP:$FRONTEND_DIR/

# 4. 上传后端文件
echo "📤 上传后端文件..."
scp -r ../backend $SERVER_USER@$SERVER_IP:/srv/memoir/

# 5. 部署后端
echo "🔧 部署后端..."
ssh $SERVER_USER@$SERVER_IP "cd $BACKEND_DIR/backend && npm ci && pm2 restart memoir-api || pm2 start 'node src/app.js' --name memoir-api"

# 6. 配置Nginx
echo "⚙️ 配置Nginx..."
scp ../nginx-memoir.conf $SERVER_USER@$SERVER_IP:/etc/nginx/sites-available/memoir
ssh $SERVER_USER@$SERVER_IP "ln -sf /etc/nginx/sites-available/memoir /etc/nginx/sites-enabled/memoir && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx"

echo "✅ 部署完成！"
echo "🌐 访问地址: http://$SERVER_IP"
