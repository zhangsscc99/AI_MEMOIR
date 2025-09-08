const jwt = require('jsonwebtoken');

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'memoir_jwt_secret_key_2024_very_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成 JWT Token
 * @param {Object} payload - 要编码的数据
 * @returns {String} JWT Token
 */
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'memoir-app'
    });
  } catch (error) {
    throw new Error('Token 生成失败');
  }
};

/**
 * 验证 JWT Token
 * @param {String} token - JWT Token
 * @returns {Object} 解码后的数据
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token 已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token 无效');
    } else {
      throw new Error('Token 验证失败');
    }
  }
};

/**
 * 从请求头中提取 Token
 * @param {Object} req - Express 请求对象
 * @returns {String|null} Token 或 null
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // 移除 'Bearer ' 前缀
  }
  
  return null;
};

/**
 * 生成用户 Token 数据
 * @param {Object} user - 用户对象
 * @returns {Object} Token 数据
 */
const generateUserTokenData = (user) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    is_vip: user.is_vip
  };
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  generateUserTokenData
};
