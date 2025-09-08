const { Sequelize } = require('sequelize');
const path = require('path');

// 数据库配置
const config = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: console.log, // 开发环境显示SQL日志
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  },
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false, // 生产环境不显示SQL日志
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};
