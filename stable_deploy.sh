#!/bin/bash

# 稳定的部署脚本
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

# 重试函数
retry_command() {
    local max_attempts=3
    local attempt=1
    local command="$1"
    
    while [ $attempt -le $max_attempts ]; do
        log_info "尝试执行命令 (第 $attempt 次): $command"
        
        if sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' -o 'ServerAliveInterval=60' -o 'ServerAliveCountMax=3' root@$SERVER_IP "$command"; then
            log_info "命令执行成功"
            return 0
        else
            log_warn "命令执行失败，等待5秒后重试..."
            sleep 5
            ((attempt++))
        fi
    done
    
    log_error "命令执行失败，已达到最大重试次数"
    return 1
}

# 检查服务器连接
check_connection() {
    log_info "检查服务器连接..."
    if retry_command "echo '连接测试成功'"; then
        log_info "服务器连接正常"
        return 0
    else
        log_error "无法连接到服务器"
        return 1
    fi
}

# 检查服务器状态
check_server_status() {
    log_info "检查服务器状态..."
    
    # 检查磁盘空间
    retry_command "df -h"
    
    # 检查内存使用
    retry_command "free -h"
    
    # 检查CPU负载
    retry_command "uptime"
    
    # 检查网络连接
    retry_command "netstat -tuln | grep :3001"
}

# 部署后端
deploy_backend() {
    log_info "开始部署后端..."
    
    # 上传后端文件
    log_info "上传后端文件..."
    if rsync -avz --progress -e "sshpass -p '$SERVER_PASSWORD' ssh -o 'StrictHostKeyChecking=no'" ./backend/ root@$SERVER_IP:$PROJECT_PATH/backend/; then
        log_info "后端文件上传成功"
    else
        log_error "后端文件上传失败"
        return 1
    fi
    
    # 安装依赖
    log_info "安装后端依赖..."
    retry_command "cd $PROJECT_PATH/backend && npm install"
    
    # 重启服务
    log_info "重启后端服务..."
    retry_command "cd $PROJECT_PATH/backend && pm2 restart all || pm2 start app.js --name 'memoir-backend'"
    
    # 检查服务状态
    retry_command "pm2 list"
}

# 部署前端
deploy_frontend() {
    log_info "开始部署前端..."
    
    # 构建前端
    log_info "构建前端项目..."
    cd ./memoir-app
    npm run build:h5
    
    # 上传前端文件
    log_info "上传前端文件..."
    if rsync -avz --progress -e "sshpass -p '$SERVER_PASSWORD' ssh -o 'StrictHostKeyChecking=no'" ./dist/build/h5/ root@$SERVER_IP:$PROJECT_PATH/frontend/; then
        log_info "前端文件上传成功"
    else
        log_error "前端文件上传失败"
        return 1
    fi
    
    cd ..
}

# 主函数
main() {
    log_info "开始部署流程..."
    
    # 检查连接
    if ! check_connection; then
        exit 1
    fi
    
    # 检查服务器状态
    check_server_status
    
    # 部署后端
    if ! deploy_backend; then
        log_error "后端部署失败"
        exit 1
    fi
    
    # 部署前端
    if ! deploy_frontend; then
        log_error "前端部署失败"
        exit 1
    fi
    
    log_info "部署完成！"
    
    # 最终检查
    log_info "检查服务状态..."
    retry_command "pm2 list"
    retry_command "netstat -tuln | grep :3001"
}

# 执行主函数
main "$@"
