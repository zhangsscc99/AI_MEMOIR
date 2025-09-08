const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { User } = require('../models');

/**
 * 验证用户身份认证中间件
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
const authenticateToken = async (req, res, next) => {
  try {
    // 从请求头中提取 token
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请提供有效的访问令牌',
        code: 'NO_TOKEN'
      });
    }
    
    // 验证 token
    const decoded = verifyToken(token);
    
    // 从数据库中获取用户信息
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: '用户账户已被禁用',
        code: 'USER_DISABLED'
      });
    }
    
    // 将用户信息添加到请求对象中
    req.user = user;
    req.userId = user.id;
    
    next();
    
  } catch (error) {
    console.error('身份认证失败:', error);
    
    return res.status(401).json({
      success: false,
      message: error.message || '身份认证失败',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * 可选的身份认证中间件（即使没有 token 也可以继续）
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id);
      
      if (user && user.is_active) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
    
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    console.warn('可选身份认证失败:', error.message);
    next();
  }
};

/**
 * 检查用户是否为 VIP 中间件
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
const requireVIP = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.is_vip) {
    return res.status(403).json({
      success: false,
      message: '此功能仅限 VIP 用户使用',
      code: 'VIP_REQUIRED'
    });
  }
  
  // 检查 VIP 是否过期
  if (req.user.vip_expires_at && new Date() > req.user.vip_expires_at) {
    return res.status(403).json({
      success: false,
      message: 'VIP 会员已过期，请续费',
      code: 'VIP_EXPIRED'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVIP
};
