const express = require('express');
const router = express.Router();

// 导入控制器
const { aiChat } = require('../controllers/aiController');

// 导入中间件
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/ai/chat
 * @desc    AI聊天接口
 * @access  Private
 */
router.post('/chat', authenticateToken, aiChat);

module.exports = router;
