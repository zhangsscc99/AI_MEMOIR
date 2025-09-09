# 岁月镜像 EchoLens - 后端API

这是岁月镜像 AI 回忆录应用的后端服务，基于 Node.js + Express.js + Sequelize 构建。

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装和启动

1. **安装依赖**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

或使用启动脚本：
```bash
./start.sh
```

3. **启动生产服务器**
```bash
npm start
```

### 访问地址

- 开发环境: http://localhost:3001
- 健康检查: http://localhost:3001/health

## 📁 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库配置
│   ├── controllers/
│   │   └── authController.js    # 认证控制器
│   ├── middleware/
│   │   ├── auth.js             # 认证中间件
│   │   └── validation.js       # 数据验证中间件
│   ├── models/
│   │   ├── User.js             # 用户模型
│   │   ├── Memoir.js           # 回忆录模型
│   │   ├── Question.js         # 问题模型
│   │   ├── Answer.js           # 答案模型
│   │   ├── Diary.js            # 日记模型
│   │   └── index.js            # 模型关联和初始化
│   ├── routes/
│   │   └── auth.js             # 认证路由
│   ├── utils/
│   │   └── jwt.js              # JWT 工具函数
│   └── app.js                  # 主应用文件
├── uploads/                     # 文件上传目录
├── database.sqlite             # SQLite 数据库文件
├── package.json
├── start.sh                    # 启动脚本
└── README.md
```

## 🔧 技术栈

- **框架**: Express.js
- **数据库**: SQLite + Sequelize ORM
- **认证**: JWT (JSON Web Tokens)
- **安全**: Helmet, CORS, bcrypt
- **验证**: express-validator
- **开发工具**: nodemon

## 📋 API 端点

### 🔐 认证相关

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/login` | 用户登录 | 公开 |
| GET | `/api/auth/me` | 获取当前用户信息 | 需要认证 |
| PUT | `/api/auth/profile` | 更新用户资料 | 需要认证 |
| PUT | `/api/auth/change-password` | 修改密码 | 需要认证 |
| POST | `/api/auth/logout` | 注销登录 | 需要认证 |
| GET | `/api/auth/check` | 检查Token有效性 | 需要认证 |

### 🏥 系统相关

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | `/health` | 服务健康检查 | 公开 |

## 📊 数据库模型

### User (用户)
- `id` - UUID 主键
- `username` - 用户名 (唯一)
- `email` - 邮箱 (唯一)
- `password` - 密码 (加密存储)
- `avatar` - 头像URL
- `nickname` - 昵称
- `phone` - 手机号
- `birth_date` - 生日
- `gender` - 性别
- `location` - 地址
- `bio` - 个人简介
- `is_active` - 是否激活
- `is_vip` - 是否VIP
- `vip_expires_at` - VIP过期时间
- `last_login_at` - 最后登录时间
- `login_count` - 登录次数

### Memoir (回忆录)
- `id` - UUID 主键
- `user_id` - 用户ID (外键)
- `title` - 标题
- `description` - 描述
- `cover_image` - 封面图片
- `status` - 状态 (draft/in_progress/completed/published)
- `total_questions` - 总问题数
- `answered_questions` - 已回答问题数
- `progress_percentage` - 完成百分比
- `is_public` - 是否公开
- `completed_at` - 完成时间
- `published_at` - 发布时间

### Question (问题)
- `id` - UUID 主键
- `category` - 问题分类
- `question_text` - 问题内容
- `question_type` - 问题类型 (text/choice/date/number/file)
- `options` - 选择题选项 (JSON)
- `order_index` - 排序索引
- `is_required` - 是否必答
- `is_active` - 是否启用

### Answer (答案)
- `id` - UUID 主键
- `user_id` - 用户ID (外键)
- `memoir_id` - 回忆录ID (外键)
- `question_id` - 问题ID (外键)
- `answer_text` - 答案文本
- `answer_data` - 答案数据 (JSON)
- `attachments` - 附件 (JSON数组)
- `is_complete` - 是否完成
- `answered_at` - 回答时间

### Diary (日记)
- `id` - UUID 主键
- `user_id` - 用户ID (外键)
- `title` - 标题
- `content` - 内容
- `images` - 图片 (JSON数组)
- `mood` - 心情
- `weather` - 天气
- `location` - 地点
- `tags` - 标签 (JSON数组)
- `is_private` - 是否私密
- `diary_date` - 日记日期

## 🔒 认证机制

### JWT Token
- 使用 JWT 进行无状态认证
- Token 有效期：7天（可配置）
- Token 包含用户基本信息：id, username, email, is_vip

### 请求头格式
```
Authorization: Bearer <your-jwt-token>
```

## 🛡️ 安全特性

- **密码加密**: 使用 bcrypt 进行密码哈希
- **CORS 保护**: 配置跨域访问权限
- **Helmet**: 设置安全的 HTTP 头
- **数据验证**: 使用 express-validator 验证输入
- **SQL 注入防护**: Sequelize ORM 自动防护

## 🗄️ 数据库

### 自动初始化
- 服务启动时自动创建数据库表
- 自动插入36个默认问题
- 无需手动运行SQL文件

### 默认问题分类
- 基本信息、童年记忆、家庭背景
- 教育经历、职业生涯、人生转折点
- 爱好兴趣、人际关系、挑战与困难
- 成就与骄傲、价值观、人生感悟
- 未来展望、智慧分享、感恩之心等

## 🔧 开发指南

### 环境变量
可以通过环境变量配置以下参数：
- `PORT` - 服务端口 (默认: 3001)
- `NODE_ENV` - 运行环境 (development/production)
- `JWT_SECRET` - JWT 密钥
- `JWT_EXPIRES_IN` - JWT 过期时间

### 日志
- 开发环境显示详细的SQL日志
- 生产环境关闭SQL日志
- 所有请求都有时间戳日志

### 错误处理
- 统一的错误响应格式
- 详细的错误码和消息
- 开发环境显示错误堆栈

## 🤝 与前端集成

### CORS 配置
已配置允许前端开发服务器访问：
- http://localhost:5173 (Vite 默认端口)
- http://localhost:3000 (备用端口)

### API 响应格式
```json
{
  "success": true|false,
  "message": "响应消息",
  "data": {}, // 响应数据
  "code": "错误码", // 仅在错误时
  "errors": [] // 仅在验证错误时
}
```

## 📝 使用示例

### 用户注册
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

### 用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "Password123"
  }'
```

### 获取用户信息
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🚀 部署说明

1. 设置生产环境变量
2. 运行 `npm install --production`
3. 运行 `npm start`
4. 确保端口 3001 可访问
5. 配置反向代理（推荐使用 nginx）

---

© 2024 岁月镜像 EchoLens - AI 回忆录应用



npm start -> backend
npm run dev:h5 -> frontend



git fetch origin
git reset --hard origin/main


npm run build:serve

# 2. 上传构建产物到服务器
# 构建产物通常在 dist/build/h5 目录
scp -r dist/build/h5/* /var/www/MEMOIR/
