const express = require('express');
const router = express.Router();

// 导入控制器
const {
  generateMemoir,
  getPdfList
} = require('../controllers/pdfController');

// 导入中间件
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/pdf/generate
 * @desc    生成回忆录PDF
 * @access  Private
 */
router.post('/generate', authenticateToken, generateMemoir);

/**
 * @route   GET /api/pdf/list
 * @desc    获取PDF列表
 * @access  Private
 */
router.get('/list', authenticateToken, getPdfList);

module.exports = router;

