const express = require('express');
const router = express.Router();

// 导入控制器
const {
  register,
  login,
  getCurrentUser,
  changePassword,
  updateProfile,
  logout
} = require('../controllers/authController');

// 导入中间件
const { authenticateToken } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   PUT /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);

/**
 * @route   PUT /api/auth/profile
 * @desc    更新用户资料
 * @access  Private
 */
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    注销登录
 * @access  Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   GET /api/auth/check
 * @desc    检查token有效性
 * @access  Private
 */
router.get('/check', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token 有效',
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

module.exports = router;
