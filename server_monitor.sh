#!/bin/bash

# 服务器监控脚本
SERVER_IP="103.146.125.208"
SERVER_PASSWORD="bmk733kd"

# 监控函数
monitor_server() {
    echo "=== 服务器监控报告 ==="
    echo "时间: $(date)"
    echo "服务器: $SERVER_IP"
    echo ""
    
    # 连接测试
    echo "1. 连接测试:"
    if sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' root@$SERVER_IP "echo '连接正常'"; then
        echo "✅ 服务器连接正常"
    else
        echo "❌ 服务器连接失败"
        return 1
    fi
    echo ""
    
    # 系统状态
    echo "2. 系统状态:"
    sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' root@$SERVER_IP "
        echo 'CPU负载:'
        uptime
        echo ''
        echo '内存使用:'
        free -h
        echo ''
        echo '磁盘使用:'
        df -h | grep -E '(Filesystem|/dev/)'
        echo ''
        echo '网络连接:'
        netstat -tuln | grep -E ':(3001|80|443)'
    "
    echo ""
    
    # 服务状态
    echo "3. 服务状态:"
    sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' root@$SERVER_IP "
        echo 'PM2进程:'
        pm2 list 2>/dev/null || echo 'PM2未安装或未运行'
        echo ''
        echo 'Node.js进程:'
        ps aux | grep node | grep -v grep
        echo ''
        echo 'Nginx状态:'
        systemctl status nginx 2>/dev/null | head -5 || echo 'Nginx未运行'
    "
    echo ""
    
    # 日志检查
    echo "4. 最近错误日志:"
    sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' root@$SERVER_IP "
        echo '系统日志 (最近10行):'
        tail -10 /var/log/syslog 2>/dev/null || echo '无法读取系统日志'
        echo ''
        echo 'PM2日志:'
        pm2 logs --lines 5 2>/dev/null || echo '无法读取PM2日志'
    "
}

# 自动修复函数
auto_fix() {
    echo "=== 自动修复尝试 ==="
    
    # 重启PM2服务
    echo "1. 重启PM2服务..."
    sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' root@$SERVER_IP "
        cd /opt/AI_MEMOIR/backend
        pm2 restart all || pm2 start app.js --name 'memoir-backend'
        pm2 save
    "
    
    # 重启Nginx
    echo "2. 重启Nginx..."
    sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' root@$SERVER_IP "
        systemctl restart nginx
        systemctl status nginx
    "
    
    # 清理系统资源
    echo "3. 清理系统资源..."
    sshpass -p "$SERVER_PASSWORD" ssh -o 'StrictHostKeyChecking=no' root@$SERVER_IP "
        # 清理临时文件
        find /tmp -type f -atime +7 -delete 2>/dev/null
        # 清理日志文件
        find /var/log -name '*.log' -type f -size +100M -exec truncate -s 0 {} \; 2>/dev/null
    "
}

# 主函数
case "$1" in
    "monitor")
        monitor_server
        ;;
    "fix")
        auto_fix
        ;;
    "full")
        monitor_server
        echo ""
        auto_fix
        echo ""
        echo "修复后状态:"
        monitor_server
        ;;
    *)
        echo "用法: $0 {monitor|fix|full}"
        echo "  monitor - 监控服务器状态"
        echo "  fix     - 自动修复常见问题"
        echo "  full    - 监控+修复+再次监控"
        ;;
esac
