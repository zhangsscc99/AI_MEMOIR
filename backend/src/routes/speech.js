const express = require('express');
const router = express.Router();

// 导入控制器
const {
  getSpeechToken,
  uploadAudio,
  deleteAudio,
  transcribeAudio,
  clearTokenCache
} = require('../controllers/speechController');

// 导入中间件
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/speech/token
 * @desc    获取阿里云语音识别Token
 * @access  Private
 */
router.get('/token', authenticateToken, getSpeechToken);

/**
 * @route   POST /api/speech/upload
 * @desc    上传音频文件
 * @access  Private
 */
router.post('/upload', authenticateToken, uploadAudio);

/**
 * @route   DELETE /api/speech/audio/:filename
 * @desc    删除音频文件
 * @access  Private
 */
router.delete('/audio/:filename', authenticateToken, deleteAudio);

/**
 * @route   POST /api/speech/transcribe
 * @desc    转写音频文件
 * @access  Private
 */
router.post('/transcribe', authenticateToken, transcribeAudio);

/**
 * @route   POST /api/speech/clear-token
 * @desc    清除Token缓存（调试用）
 * @access  Private
 */
router.post('/clear-token', authenticateToken, clearTokenCache);

module.exports = router;
