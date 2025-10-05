#!/bin/bash

###############################################################################
# 后端部署脚本 - deploy_backend.sh
# 功能：上传后端代码到服务器并重启服务
# 用途：当修改了 backend/src 目录下的后端代码时使用
###############################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务器配置
SERVER_IP="103.146.125.208"
SERVER_USER="root"
SERVER_PASSWORD="bmk733kd"
BACKEND_PATH="/opt/AI_MEMOIR/backend"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     后端部署脚本 - Backend Deploy     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 步骤1：检查必要工具
echo -e "${YELLOW}[1/6] 检查必要工具...${NC}"
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ 错误：sshpass 未安装${NC}"
    echo -e "${YELLOW}请运行: brew install sshpass${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 工具检查完成${NC}"
echo ""

# 步骤2：上传后端代码到服务器
echo -e "${YELLOW}[2/6] 上传后端代码到服务器...${NC}"
echo -e "${BLUE}服务器: ${SERVER_USER}@${SERVER_IP}${NC}"
echo -e "${BLUE}目标路径: ${BACKEND_PATH}${NC}"
echo -e "${BLUE}排除: node_modules, database.sqlite, uploads${NC}"
echo ""

# 使用 rsync 同步后端代码
# --exclude 排除不需要上传的文件和目录
rsync -avz \
    --exclude 'node_modules' \
    --exclude 'database.sqlite' \
    --exclude 'uploads' \
    --exclude '.git' \
    --exclude '*.log' \
    -e "sshpass -p ${SERVER_PASSWORD} ssh -o 'StrictHostKeyChecking=no'" \
    ./backend/ \
    ${SERVER_USER}@${SERVER_IP}:${BACKEND_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 代码上传失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 代码上传完成${NC}"
echo ""

# 步骤3：在服务器上重新安装依赖
echo -e "${YELLOW}[3/6] 在服务器上重新安装依赖...${NC}"
echo -e "${BLUE}原因：确保所有依赖（特别是 sqlite3）在服务器环境正确编译${NC}"

sshpass -p ${SERVER_PASSWORD} ssh -o 'StrictHostKeyChecking=no' \
    ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/AI_MEMOIR/backend
echo "当前目录: $(pwd)"
echo "删除旧的依赖..."
rm -rf node_modules package-lock.json
echo "重新安装依赖..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo ""

# 步骤4：停止旧的后端服务
echo -e "${YELLOW}[4/6] 停止旧的后端服务...${NC}"
sshpass -p ${SERVER_PASSWORD} ssh -o 'StrictHostKeyChecking=no' \
    ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
pm2 stop memoir-backend 2>/dev/null || echo "服务未运行"
pm2 delete memoir-backend 2>/dev/null || echo "服务不存在"
echo "✅ 旧服务已清理"
ENDSSH

echo -e "${GREEN}✅ 旧服务已停止${NC}"
echo ""

# 步骤5：启动新的后端服务
echo -e "${YELLOW}[5/6] 启动新的后端服务...${NC}"
sshpass -p ${SERVER_PASSWORD} ssh -o 'StrictHostKeyChecking=no' \
    ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/AI_MEMOIR/backend
pm2 start src/app.js --name "memoir-backend"
pm2 save
echo "✅ 服务已启动"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 服务启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 服务启动完成${NC}"
echo ""

# 步骤6：检查服务状态
echo -e "${YELLOW}[6/6] 检查服务状态...${NC}"
sshpass -p ${SERVER_PASSWORD} ssh -o 'StrictHostKeyChecking=no' \
    ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
echo "PM2 进程列表："
pm2 list
echo ""
echo "后端服务日志（最后20行）："
pm2 logs memoir-backend --lines 20 --nostream
ENDSSH

echo ""

# 完成
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ 后端部署完成！                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}访问地址：${NC}"
echo -e "  - API基础地址: ${YELLOW}https://${SERVER_IP}/api${NC}"
echo -e "  - 健康检查: ${YELLOW}https://${SERVER_IP}/api/health${NC}"
echo ""
echo -e "${BLUE}查看日志：${NC}"
echo -e "  ${YELLOW}ssh root@${SERVER_IP}${NC}"
echo -e "  ${YELLOW}pm2 logs memoir-backend${NC}"
echo ""
echo -e "${BLUE}说明：${NC}"
echo -e "  1. PM2 已重新启动后端服务"
echo -e "  2. Nginx 自动将 /api 请求转发到后端"
echo -e "  3. 数据库和上传文件已保留"
echo ""


