require('dotenv').config(); // 加载环境变量
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// 导入数据库和模型
const { initDatabase } = require('./models');
const { testConnection } = require('./config/database');

// 导入路由
const authRoutes = require('./routes/auth');
const chapterRoutes = require('./routes/chapters');
const speechRoutes = require('./routes/speech');
const aiRoutes = require('./routes/ai');
const aliyunDebugRoutes = require('./routes/aliyunDebug');
const pdfRoutes = require('./routes/pdf');

// 导入控制器
const { uploadImage } = require('./controllers/uploadController');
const { authenticateToken } = require('./middleware/auth');

// 创建 Express 应用
const app = express();

// 基础配置
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_PORT = process.env.FRONTEND_PORT || 4100;
const frontendDevOrigins = [
  `http://localhost:${FRONTEND_PORT}`,
  `http://127.0.0.1:${FRONTEND_PORT}`
];

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 配置
app.use(cors({
  origin: [
    ...frontendDevOrigins,
    'http://localhost:5173',  // 前端开发服务器
    'http://localhost:3000',
    'http://localhost',       // Capacitor 默认地址
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1',      // Capacitor 默认地址
    `http://103.146.124.206:${FRONTEND_PORT}`,
    'http://103.146.124.206:3020',  // 服务器前端地址
    'http://103.146.124.206:5173',
    'http://103.146.124.206:3000',
    'http://103.146.124.206:8080',
    'http://103.146.124.206:8081',
    'capacitor://localhost',  // Capacitor 协议
    'ionic://localhost',      // Ionic 协议
    'http://localhost:8080',  // 其他可能端口
    'http://localhost:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '岁月镜像 API 服务正常运行',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/aliyun-speech', aliyunDebugRoutes);
app.use('/api/pdf', pdfRoutes);

// 图片上传路由
app.post('/api/upload/image', authenticateToken, uploadImage);

// 静态文件服务（用于文件上传）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// WebP文件静态服务
app.use('/uploads/images_webp', express.static(path.join(__dirname, '../uploads/images_webp')));
// PDF文件静态服务
app.use('/uploads/pdf', express.static(path.join(__dirname, '../uploads/pdf')));

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的接口不存在',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('🚨 服务器错误:', error);
  
  // 数据库错误
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors,
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: '数据已存在，请检查唯一性约束',
      code: 'UNIQUE_CONSTRAINT_ERROR'
    });
  }
  
  // 默认错误响应
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    code: error.code || 'INTERNAL_ERROR',
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    console.log('🚀 开始启动岁月镜像后端服务...');
    
    // 测试数据库连接
    await testConnection();
    
    // 初始化数据库
    await initDatabase();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log('🎉 服务器启动成功!');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🔧 运行环境: ${NODE_ENV}`);
      console.log(`💾 数据库: SQLite`);
      console.log('📋 可用的API端点:');
      console.log('   - GET  /health              - 健康检查');
      console.log('   - POST /api/auth/register   - 用户注册');
      console.log('   - POST /api/auth/login      - 用户登录');
      console.log('   - GET  /api/auth/me         - 获取用户信息');
      console.log('   - PUT  /api/auth/profile    - 更新用户资料');
      console.log('   - PUT  /api/auth/change-password - 修改密码');
      console.log('   - POST /api/auth/logout     - 注销登录');
      console.log('   - GET  /api/auth/check      - 检查token');
      console.log('   - POST /api/chapters/save   - 保存章节');
      console.log('   - GET  /api/chapters        - 获取章节列表');
      console.log('   - GET  /api/chapters/:id    - 获取章节详情');
      console.log('   - DELETE /api/chapters/:id  - 删除章节');
      console.log('   - GET  /api/speech/token    - 获取语音识别Token');
      console.log('   - POST /api/speech/upload   - 上传音频文件');
      console.log('   - POST /api/speech/transcribe - 转写音频文件');
      console.log('   - DELETE /api/speech/audio/:filename - 删除音频文件');
      console.log('');
      console.log(`🎯 前端访问地址: http://localhost:${FRONTEND_PORT}`);
      console.log('⚡ 准备接收请求...');
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，准备关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，准备关闭服务器...');
  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;
