const express = require('express');
const router = express.Router();

// 导入控制器
const {
  generateMemoir,
  getPdfJobStatus,
  getPdfList,
  deletePdf
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

/**
 * @route   DELETE /api/pdf/file/:fileName
 * @desc    删除指定的PDF
 * @access  Private
 */
router.delete('/file/:fileName', authenticateToken, deletePdf);

/**
 * @route   GET /api/pdf/status/:jobId
 * @desc    查询PDF生成任务状态
 * @access  Private
 */
router.get('/status/:jobId', authenticateToken, getPdfJobStatus);

module.exports = router;
