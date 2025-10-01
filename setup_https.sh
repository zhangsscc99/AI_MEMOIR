#!/bin/bash

# HTTPS配置脚本
SERVER_IP="103.146.125.208"
SERVER_PASSWORD="bmk733kd"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 安装Certbot
install_certbot() {
    log_info "安装Certbot..."
    sshpass -p "$SERVER_PASSWORD" ssh root@$SERVER_IP "
        apt update
        apt install -y certbot python3-certbot-nginx
    "
}

# 配置SSL证书
setup_ssl() {
    log_info "配置SSL证书..."
    sshpass -p "$SERVER_PASSWORD" ssh root@$SERVER_IP "
        # 停止Nginx
        systemctl stop nginx
        
        # 获取SSL证书（需要域名，这里用自签名证书作为示例）
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/ssl/private/nginx-selfsigned.key \
            -out /etc/ssl/certs/nginx-selfsigned.crt \
            -subj '/C=CN/ST=State/L=City/O=Organization/CN=$SERVER_IP'
    "
}

# 配置Nginx HTTPS
configure_nginx_https() {
    log_info "配置Nginx HTTPS..."
    sshpass -p "$SERVER_PASSWORD" ssh root@$SERVER_IP "
        cat > /etc/nginx/sites-available/default << 'EOF'
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name $SERVER_IP;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name $SERVER_IP;
    
    # SSL配置
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
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
}
EOF
        
        # 测试配置
        nginx -t
        
        # 启动Nginx
        systemctl start nginx
        systemctl enable nginx
    "
}

# 主函数
main() {
    log_info "开始配置HTTPS..."
    
    install_certbot
    setup_ssl
    configure_nginx_https
    
    log_info "HTTPS配置完成！"
    log_warn "注意：这是自签名证书，浏览器会显示安全警告"
    log_warn "在生产环境中，建议使用Let's Encrypt免费证书"
    log_info "访问地址: https://$SERVER_IP"
}

main "$@"
