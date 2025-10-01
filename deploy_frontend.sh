#!/bin/bash

###############################################################################
# 前端部署脚本 - deploy_frontend.sh
# 功能：构建前端项目并上传到服务器
# 用途：当修改了 memoir-app/src 目录下的前端代码时使用
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
FRONTEND_PATH="/opt/AI_MEMOIR/frontend"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     前端部署脚本 - Frontend Deploy    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 步骤1：检查必要工具
echo -e "${YELLOW}[1/5] 检查必要工具...${NC}"
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ 错误：sshpass 未安装${NC}"
    echo -e "${YELLOW}请运行: brew install sshpass${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 工具检查完成${NC}"
echo ""

# 步骤2：进入前端项目目录
echo -e "${YELLOW}[2/5] 进入前端项目目录...${NC}"
cd memoir-app || {
    echo -e "${RED}❌ 错误：memoir-app 目录不存在${NC}"
    exit 1
}
echo -e "${GREEN}✅ 当前目录: $(pwd)${NC}"
echo ""

# 步骤3：构建前端项目
echo -e "${YELLOW}[3/5] 构建前端项目 (H5版本)...${NC}"
echo -e "${BLUE}执行命令: npm run build:h5${NC}"
npm run build:h5
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端构建完成${NC}"
echo ""

# 步骤4：上传前端文件到服务器
echo -e "${YELLOW}[4/5] 上传前端文件到服务器...${NC}"
echo -e "${BLUE}服务器: ${SERVER_USER}@${SERVER_IP}${NC}"
echo -e "${BLUE}目标路径: ${FRONTEND_PATH}${NC}"

# 使用 rsync 同步文件（自动删除服务器上多余的文件）
rsync -avz --delete \
    -e "sshpass -p ${SERVER_PASSWORD} ssh -o 'StrictHostKeyChecking=no'" \
    ./dist/build/h5/ \
    ${SERVER_USER}@${SERVER_IP}:${FRONTEND_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 文件上传失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 文件上传完成${NC}"
echo ""

# 步骤5：上传调试页面（如果存在）
echo -e "${YELLOW}[5/5] 上传调试页面...${NC}"
cd ..
if [ -f "debug_recording.html" ]; then
    sshpass -p ${SERVER_PASSWORD} scp -o 'StrictHostKeyChecking=no' \
        ./debug_recording.html ${SERVER_USER}@${SERVER_IP}:${FRONTEND_PATH}/
    echo -e "${GREEN}✅ debug_recording.html 已上传${NC}"
fi

if [ -f "test_aliyun_speech.html" ]; then
    sshpass -p ${SERVER_PASSWORD} scp -o 'StrictHostKeyChecking=no' \
        ./test_aliyun_speech.html ${SERVER_USER}@${SERVER_IP}:${FRONTEND_PATH}/
    echo -e "${GREEN}✅ test_aliyun_speech.html 已上传${NC}"
fi
echo ""

# 完成
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ 前端部署完成！                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}访问地址：${NC}"
echo -e "  - 主页面: ${YELLOW}https://${SERVER_IP}${NC}"
echo -e "  - 调试页面: ${YELLOW}https://${SERVER_IP}/debug_recording.html${NC}"
echo ""
echo -e "${BLUE}说明：${NC}"
echo -e "  前端已部署，Nginx会自动提供服务"
echo -e "  无需重启任何服务"
echo ""

