const { User } = require('../models');
const { generateToken, generateUserTokenData } = require('../utils/jwt');
const { Op } = require('sequelize');

/**
 * 用户注册
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username ? '用户名已被使用' : '邮箱已被注册',
        code: 'USER_EXISTS'
      });
    }
    
    // 创建新用户
    const newUser = await User.create({
      username,
      email,
      password, // 密码会在模型的钩子中自动加密
      nickname: username // 默认昵称为用户名
    });
    
    // 生成 JWT Token
    const tokenData = generateUserTokenData(newUser);
    const token = generateToken(tokenData);
    
    // 返回用户信息（不包含密码）
    const userProfile = newUser.getPublicProfile();
    
    console.log(`✅ 新用户注册成功: ${username} (${email})`);
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userProfile,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
    
  } catch (error) {
    console.error('用户注册失败:', error);
    
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
      code: 'REGISTER_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 用户登录
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // 查找用户（根据邮箱或用户名）
    const user = await User.findByEmailOrUsername(identifier);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或邮箱不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员',
        code: 'USER_DISABLED'
      });
    }
    
    // 验证密码
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '密码错误',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // 更新登录信息
    await user.updateLoginInfo();
    
    // 生成 JWT Token
    const tokenData = generateUserTokenData(user);
    const token = generateToken(tokenData);
    
    // 返回用户信息（不包含密码）
    const userProfile = user.getPublicProfile();
    
    console.log(`✅ 用户登录成功: ${user.username}`);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userProfile,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
    
  } catch (error) {
    console.error('用户登录失败:', error);
    
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      code: 'LOGIN_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取当前用户信息
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const getCurrentUser = async (req, res) => {
  try {
    // req.user 由 authenticateToken 中间件提供
    const userProfile = req.user.getPublicProfile();
    
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: {
        user: userProfile
      }
    });
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      code: 'GET_USER_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 修改密码
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    
    // 验证当前密码
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // 更新密码
    user.password = newPassword; // 密码会在模型的钩子中自动加密
    await user.save();
    
    console.log(`✅ 用户修改密码成功: ${user.username}`);
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
    
  } catch (error) {
    console.error('修改密码失败:', error);
    
    res.status(500).json({
      success: false,
      message: '修改密码失败，请稍后重试',
      code: 'CHANGE_PASSWORD_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 更新用户资料
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const allowedFields = ['nickname', 'phone', 'bio', 'location', 'gender', 'birth_date'];
    
    // 只更新允许的字段
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // 如果有手机号，检查是否已被其他用户使用
    if (updateData.phone) {
      const existingUser = await User.findOne({
        where: {
          phone: updateData.phone,
          id: { [Op.ne]: user.id }
        }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '手机号已被其他用户使用',
          code: 'PHONE_EXISTS'
        });
      }
    }
    
    // 更新用户信息
    await user.update(updateData);
    
    // 重新获取更新后的用户信息
    await user.reload();
    const userProfile = user.getPublicProfile();
    
    console.log(`✅ 用户资料更新成功: ${user.username}`);
    
    res.json({
      success: true,
      message: '用户资料更新成功',
      data: {
        user: userProfile
      }
    });
    
  } catch (error) {
    console.error('更新用户资料失败:', error);
    
    res.status(500).json({
      success: false,
      message: '更新用户资料失败，请稍后重试',
      code: 'UPDATE_PROFILE_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 注销登录（客户端删除 token）
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
const logout = async (req, res) => {
  try {
    // 由于使用的是无状态的 JWT，实际的注销由客户端处理（删除本地存储的 token）
    // 这里只是一个确认接口
    
    console.log(`✅ 用户注销登录: ${req.user.username}`);
    
    res.json({
      success: true,
      message: '注销成功'
    });
    
  } catch (error) {
    console.error('注销失败:', error);
    
    res.status(500).json({
      success: false,
      message: '注销失败，请稍后重试',
      code: 'LOGOUT_FAILED',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  changePassword,
  updateProfile,
  logout
};
