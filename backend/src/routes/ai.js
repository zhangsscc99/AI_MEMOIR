const express = require('express');
const router = express.Router();

// 导入控制器
const { 
  chatWithAI, 
  getConversationHistory, 
  clearConversationHistory, 
  getUserMemories 
} = require('../controllers/aiController');

// 导入中间件
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/ai/chat
 * @desc    AI聊天接口（支持流式输出和多轮对话）
 * @access  Private
 */
router.post('/chat', authenticateToken, chatWithAI);

/**
 * @route   GET /api/ai/history
 * @desc    获取对话历史
 * @access  Private
 */
router.get('/history', authenticateToken, getConversationHistory);

/**
 * @route   DELETE /api/ai/history
 * @desc    清空对话历史
 * @access  Private
 */
router.delete('/history', authenticateToken, clearConversationHistory);

/**
 * @route   GET /api/ai/memories
 * @desc    获取用户记忆（回忆录内容）
 * @access  Private
 */
router.get('/memories', authenticateToken, getUserMemories);

module.exports = router;
