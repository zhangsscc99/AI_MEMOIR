#!/bin/bash

# 服务器环境安装脚本
SERVER_IP="103.146.125.208"
SERVER_PASSWORD="bmk733kd"
PROJECT_PATH="/opt/AI_MEMOIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 执行远程命令
run_remote() {
    local command="$1"
    log_info "执行: $command"
    sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' root@$SERVER_IP "$command"
}

# 安装Node.js和npm
install_nodejs() {
    log_info "安装Node.js和npm..."
    run_remote "
        # 更新包列表
        apt update
        
        # 安装curl
        apt install -y curl
        
        # 安装Node.js 18.x
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
        
        # 验证安装
        node --version
        npm --version
    "
}

# 安装PM2
install_pm2() {
    log_info "安装PM2..."
    run_remote "
        # 全局安装PM2
        npm install -g pm2
        
        # 设置PM2开机自启
        pm2 startup
        pm2 save
        
        # 验证安装
        pm2 --version
    "
}

# 安装Nginx
install_nginx() {
    log_info "安装Nginx..."
    run_remote "
        # 安装Nginx
        apt install -y nginx
        
        # 启动并设置开机自启
        systemctl start nginx
        systemctl enable nginx
        
        # 检查状态
        systemctl status nginx --no-pager
    "
}

# 安装其他必要工具
install_tools() {
    log_info "安装其他必要工具..."
    run_remote "
        # 安装常用工具
        apt install -y net-tools htop vim git
        
        # 安装rsync
        apt install -y rsync
    "
}

# 创建项目目录
create_project_dir() {
    log_info "创建项目目录..."
    run_remote "
        # 创建项目目录
        mkdir -p $PROJECT_PATH
        mkdir -p $PROJECT_PATH/backend
        mkdir -p $PROJECT_PATH/frontend
        mkdir -p $PROJECT_PATH/logs
        
        # 设置权限
        chown -R root:root $PROJECT_PATH
        chmod -R 755 $PROJECT_PATH
    "
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    run_remote "
        # 备份原配置
        cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
        
        # 创建新的Nginx配置
        cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name 103.146.125.208;
    
    # 前端静态文件
    location / {
        root /opt/AI_MEMOIR/frontend;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /opt/AI_MEMOIR/frontend;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # 上传文件代理（PDF等）
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        
        # 测试配置
        nginx -t
        
        # 重启Nginx
        systemctl restart nginx
    "
}

# 部署应用
deploy_app() {
    log_info "部署应用..."
    
    # 上传后端文件
    log_info "上传后端文件..."
    rsync -avz --progress -e "sshpass -p '$SERVER_PASSWORD' ssh -o 'StrictHostKeyChecking=no'" ./backend/ root@$SERVER_IP:$PROJECT_PATH/backend/
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    run_remote "cd $PROJECT_PATH/backend && npm install"
    
    # 启动后端服务
    log_info "启动后端服务..."
    run_remote "
        cd $PROJECT_PATH/backend
        pm2 start app.js --name 'memoir-backend'
        pm2 save
    "
    
    # 构建并上传前端
    log_info "构建前端..."
    cd ./memoir-app
    npm run build:h5
    
    log_info "上传前端文件..."
    rsync -avz --progress -e "sshpass -p '$SERVER_PASSWORD' ssh -o 'StrictHostKeyChecking=no'" ./dist/build/h5/ root@$SERVER_IP:$PROJECT_PATH/frontend/
    
    cd ..
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    run_remote "
        echo '=== 服务状态检查 ==='
        echo 'PM2进程:'
        pm2 list
        echo ''
        echo 'Nginx状态:'
        systemctl status nginx --no-pager
        echo ''
        echo '端口监听:'
        netstat -tuln | grep -E ':(80|3001)'
        echo ''
        echo '项目文件:'
        ls -la $PROJECT_PATH/
        echo ''
        echo '后端文件:'
        ls -la $PROJECT_PATH/backend/
        echo ''
        echo '前端文件:'
        ls -la $PROJECT_PATH/frontend/
    "
}

# 主函数
main() {
    log_info "开始服务器环境安装..."
    
    # 安装基础环境
    install_tools
    install_nodejs
    install_pm2
    install_nginx
    
    # 配置环境
    create_project_dir
    configure_nginx
    
    # 部署应用
    deploy_app
    
    # 验证部署
    verify_deployment
    
    log_info "服务器环境安装完成！"
    log_info "访问地址: http://103.146.125.208"
}

# 执行主函数
main "$@"
