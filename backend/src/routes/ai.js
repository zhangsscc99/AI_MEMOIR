const express = require('express');
const router = express.Router();

// 导入控制器
const { 
  chatWithAI,
  guestChatWithAI,
  getConversationHistory, 
  clearConversationHistory, 
  getUserMemories,
  prebuildCharacter,
  refreshCharacter,
  completeText
} = require('../controllers/aiController');

// 导入中间件
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/ai/guest-chat
 * @desc    未登录用户AI聊天接口
 * @access  Public
 */
router.post('/guest-chat', guestChatWithAI);

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

/**
 * @route   POST /api/ai/prebuild
 * @desc    预构建用户角色
 * @access  Private
 */
router.post('/prebuild', authenticateToken, prebuildCharacter);

/**
 * @route   POST /api/ai/refresh
 * @desc    刷新用户角色缓存
 * @access  Private
 */
router.post('/refresh', authenticateToken, refreshCharacter);

/**
 * @route   POST /api/ai/complete-text
 * @desc    AI文本补全接口
 * @access  Private
 */
router.post('/complete-text', authenticateToken, completeText);

module.exports = router;
