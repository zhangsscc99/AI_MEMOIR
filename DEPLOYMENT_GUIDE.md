# 部署指南 - Deployment Guide

本指南详细说明如何使用部署脚本来更新服务器上的前端和后端代码。

---

## 📚 目录

1. [脚本概述](#脚本概述)
2. [前端部署](#前端部署)
3. [后端部署](#后端部署)
4. [工作原理](#工作原理)
5. [常见问题](#常见问题)

---

## 🔧 脚本概述

项目中有两个独立的部署脚本：

| 脚本名称 | 用途 | 何时使用 |
|---------|------|---------|
| `deploy_frontend.sh` | 部署前端 | 修改了 `memoir-app/src` 下的前端代码 |
| `deploy_backend.sh` | 部署后端 | 修改了 `backend/src` 下的后端代码 |

**重要提示：**
- 如果只修改了前端，只需运行前端部署脚本
- 如果只修改了后端，只需运行后端部署脚本
- 如果两者都修改了，需要分别运行两个脚本

---

## 🎨 前端部署

### 使用场景
当你修改了以下文件时需要部署前端：
- `memoir-app/src/pages/**/*.vue` - 页面组件
- `memoir-app/src/components/**/*.vue` - 公共组件
- `memoir-app/src/utils/**/*.js` - 工具函数
- `memoir-app/src/App.vue` - 主应用
- `memoir-app/src/pages.json` - 页面配置

### 运行命令

```bash
# 在项目根目录 /Users/Zhuanz1/Desktop/memoir 下运行
./deploy_frontend.sh
```

### 部署流程

```
[1/5] 检查工具
  └─ 检查 sshpass 是否安装
  
[2/5] 进入前端目录
  └─ cd memoir-app
  
[3/5] 构建前端项目
  └─ npm run build:h5
  └─ 输出目录: dist/build/h5/
  
[4/5] 上传到服务器
  └─ rsync 同步文件到 /opt/AI_MEMOIR/frontend/
  └─ --delete 删除服务器上多余的文件
  
[5/5] 上传调试页面
  └─ debug_recording.html
  └─ test_aliyun_speech.html
```

### 预计耗时
- 构建时间：约 30-60 秒
- 上传时间：约 10-30 秒
- **总计：约 1-2 分钟**

### 部署后访问
- 主页面: https://103.146.125.208
- 调试页面: https://103.146.125.208/debug_recording.html

---

## ⚙️ 后端部署

### 使用场景
当你修改了以下文件时需要部署后端：
- `backend/src/app.js` - 主应用
- `backend/src/controllers/**/*.js` - 控制器
- `backend/src/routes/**/*.js` - 路由
- `backend/src/models/**/*.js` - 数据模型
- `backend/src/middleware/**/*.js` - 中间件
- `backend/src/utils/**/*.js` - 工具函数
- `backend/package.json` - 依赖配置

### 运行命令

```bash
# 在项目根目录 /Users/Zhuanz1/Desktop/memoir 下运行
./deploy_backend.sh
```

### 部署流程

```
[1/6] 检查工具
  └─ 检查 sshpass 是否安装
  
[2/6] 上传代码
  └─ rsync 同步 backend/ 到服务器
  └─ 排除: node_modules, database.sqlite, uploads
  
[3/6] 重新安装依赖
  └─ 在服务器上删除 node_modules
  └─ 运行 npm install
  └─ 确保 sqlite3 等原生模块正确编译
  
[4/6] 停止旧服务
  └─ pm2 stop memoir-backend
  └─ pm2 delete memoir-backend
  
[5/6] 启动新服务
  └─ pm2 start src/app.js --name memoir-backend
  └─ pm2 save (保存进程列表)
  
[6/6] 检查状态
  └─ pm2 list (显示进程状态)
  └─ pm2 logs (显示最近日志)
```

### 预计耗时
- 上传代码：约 5-10 秒
- 安装依赖：约 30-60 秒
- 重启服务：约 5-10 秒
- **总计：约 1-2 分钟**

### 部署后访问
- API基础地址: https://103.146.125.208/api
- 健康检查: https://103.146.125.208/api/health

---

## 🔍 工作原理

### 前端部署原理

```
本地开发机                     服务器
─────────────                 ─────────────
memoir-app/src/               /opt/AI_MEMOIR/frontend/
    ├── pages/                    ├── index.html
    ├── components/               ├── static/
    └── utils/                    ├── css/
         ↓                        └── js/
    npm run build:h5
         ↓
    dist/build/h5/
         ↓
    rsync 上传 ────────────────→ Nginx 服务
                                      ↓
                              用户访问 https://IP
```

**关键点：**
1. **构建步骤**：将 Vue 代码编译成静态 HTML/CSS/JS
2. **rsync 同步**：增量上传，只传输变化的文件
3. **Nginx 服务**：直接提供静态文件，无需重启
4. **--delete 参数**：确保服务器文件和本地构建一致

### 后端部署原理

```
本地开发机                     服务器
─────────────                 ─────────────
backend/src/                  /opt/AI_MEMOIR/backend/
    ├── app.js                    ├── src/
    ├── controllers/              ├── node_modules/ (重新安装)
    ├── models/                   └── package.json
    └── routes/                        ↓
         ↓                        npm install
    rsync 上传 ────────────→         ↓
                              PM2 重启服务
                                      ↓
                              Node.js 运行
                                      ↓
                              监听 3001 端口
                                      ↓
                              Nginx 反向代理 /api
                                      ↓
                              用户访问 https://IP/api
```

**关键点：**
1. **排除文件**：不上传 node_modules（在服务器重新安装）
2. **保留数据**：不覆盖 database.sqlite 和 uploads 目录
3. **重新安装依赖**：确保原生模块（如 sqlite3）正确编译
4. **PM2 管理**：自动重启，守护进程，崩溃自动恢复
5. **Nginx 代理**：/api 请求转发到 3001 端口

---

## 🏗️ 服务器架构

```
                    用户浏览器
                        ↓
                    (HTTPS)
                        ↓
            ┌───────────────────────┐
            │   Nginx (端口 443)    │
            │  SSL 证书处理         │
            └───────────────────────┘
                        ↓
         ┌──────────────┴──────────────┐
         ↓                              ↓
  /api 请求                        其他请求
         ↓                              ↓
┌─────────────────┐          ┌─────────────────┐
│ 反向代理到后端   │          │ 静态文件服务     │
│ localhost:3001  │          │ /opt/AI_MEMOIR/ │
└─────────────────┘          │     frontend/   │
         ↓                   └─────────────────┘
┌─────────────────┐
│ PM2 进程管理     │
│  memoir-backend │
└─────────────────┘
         ↓
┌─────────────────┐
│ Node.js 应用    │
│  Express + API  │
└─────────────────┘
         ↓
┌─────────────────┐
│ SQLite 数据库   │
│ database.sqlite │
└─────────────────┘
```

---

## 📖 详细技术说明

### rsync 命令解析

#### 前端部署中的 rsync
```bash
rsync -avz --delete \
    -e "sshpass -p PASSWORD ssh -o 'StrictHostKeyChecking=no'" \
    ./dist/build/h5/ \
    root@103.146.125.208:/opt/AI_MEMOIR/frontend/
```

**参数说明：**
- `-a`：归档模式，保留权限、时间戳等
- `-v`：详细输出
- `-z`：传输时压缩
- `--delete`：删除目标目录中源目录没有的文件
- `-e`：指定远程 shell（使用 sshpass 自动输入密码）

#### 后端部署中的 rsync
```bash
rsync -avz \
    --exclude 'node_modules' \
    --exclude 'database.sqlite' \
    --exclude 'uploads' \
    -e "sshpass -p PASSWORD ssh" \
    ./backend/ \
    root@103.146.125.208:/opt/AI_MEMOIR/backend/
```

**排除说明：**
- `node_modules`：在服务器上重新安装，确保原生模块兼容
- `database.sqlite`：保留服务器上的数据库，避免数据丢失
- `uploads`：保留用户上传的文件

### PM2 进程管理

**为什么使用 PM2？**
1. **守护进程**：后台运行，SSH 断开后继续运行
2. **自动重启**：崩溃后自动重启
3. **日志管理**：自动记录和轮转日志
4. **零停机重启**：使用 `pm2 reload` 可以实现零停机更新

**常用 PM2 命令：**
```bash
# 查看所有进程
pm2 list

# 查看实时日志
pm2 logs memoir-backend

# 重启服务
pm2 restart memoir-backend

# 停止服务
pm2 stop memoir-backend

# 删除服务
pm2 delete memoir-backend
```

### Nginx 配置说明

**前端静态文件配置：**
```nginx
location / {
    root /opt/AI_MEMOIR/frontend;
    try_files $uri $uri/ /index.html;
}
```
- 直接服务静态文件
- SPA 路由支持（所有路径都返回 index.html）

**后端 API 代理配置：**
```nginx
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
- 反向代理到 Node.js 应用
- 支持 WebSocket 升级
- 保留原始请求头

---

## ❓ 常见问题

### 1. sshpass 未安装

**错误信息：**
```
❌ 错误：sshpass 未安装
```

**解决方法：**
```bash
brew install sshpass
```

### 2. 前端构建失败

**错误信息：**
```
❌ 前端构建失败
```

**可能原因：**
- 代码语法错误
- 依赖未安装

**解决方法：**
```bash
cd memoir-app
npm install  # 重新安装依赖
npm run build:h5  # 单独测试构建
```

### 3. 后端依赖安装失败

**错误信息：**
```
❌ 依赖安装失败
```

**可能原因：**
- 服务器磁盘空间不足
- npm 仓库连接问题

**解决方法：**
```bash
# SSH 到服务器
ssh root@103.146.125.208

# 检查磁盘空间
df -h

# 清理 npm 缓存
npm cache clean --force

# 手动安装
cd /opt/AI_MEMOIR/backend
rm -rf node_modules package-lock.json
npm install
```

### 4. 后端服务启动失败

**错误信息：**
```
❌ 服务启动失败
```

**排查步骤：**
```bash
# SSH 到服务器
ssh root@103.146.125.208

# 查看 PM2 日志
pm2 logs memoir-backend

# 尝试手动启动（查看详细错误）
cd /opt/AI_MEMOIR/backend
node src/app.js
```

### 5. 部署后页面不更新

**可能原因：**
- 浏览器缓存

**解决方法：**
- 硬刷新：`Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)
- 清除浏览器缓存
- 使用无痕模式测试

### 6. API 请求失败

**排查步骤：**
```bash
# 1. 检查后端服务是否运行
ssh root@103.146.125.208
pm2 list

# 2. 检查后端日志
pm2 logs memoir-backend

# 3. 测试后端直接访问
curl http://localhost:3001/api/health

# 4. 检查 Nginx 配置
nginx -t
systemctl status nginx
```

---

## 🚀 快速参考

### 前端部署（1 分钟）
```bash
./deploy_frontend.sh
```
✅ 访问：https://103.146.125.208

### 后端部署（2 分钟）
```bash
./deploy_backend.sh
```
✅ 测试：https://103.146.125.208/api/health

### 完整部署（3 分钟）
```bash
./deploy_frontend.sh
./deploy_backend.sh
```

---

## 📝 注意事项

### ⚠️ 重要警告

1. **不要**在生产环境直接修改代码
   - 始终在本地修改，测试后再部署

2. **不要**手动删除服务器上的 `database.sqlite`
   - 会导致所有用户数据丢失

3. **不要**手动删除服务器上的 `uploads` 目录
   - 会导致所有上传文件丢失

4. **不要**在部署过程中中断脚本
   - 可能导致服务处于不一致状态

### ✅ 最佳实践

1. **部署前备份**
   ```bash
   ssh root@103.146.125.208
   cd /opt/AI_MEMOIR/backend
   cp database.sqlite database.sqlite.backup
   ```

2. **测试后再部署**
   - 在本地充分测试
   - 使用 `npm run dev` 确保功能正常

3. **查看部署日志**
   - 部署后检查 PM2 日志
   - 确认没有错误信息

4. **增量更新**
   - 小步快跑，频繁部署
   - 每次只改少量代码

---

## 🛠️ 脚本维护

如果需要修改服务器配置（IP、密码等），编辑脚本中的变量：

```bash
# 在脚本开头
SERVER_IP="103.146.125.208"
SERVER_USER="root"
SERVER_PASSWORD="bmk733kd"
BACKEND_PATH="/opt/AI_MEMOIR/backend"
FRONTEND_PATH="/opt/AI_MEMOIR/frontend"
```

---

## 📚 相关文档

- [后端 API 文档](backend/README.md)
- [服务器配置指南](setup_server.sh)
- [HTTPS 配置指南](setup_https.sh)
- [服务器监控脚本](server_monitor.sh)

---

**最后更新：** 2025-10-01  
**维护者：** AI Assistant


