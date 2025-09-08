const express = require('express');
const router = express.Router();

// 导入控制器
const {
  saveChapter,
  getUserChapters,
  getChapter,
  deleteChapter
} = require('../controllers/chapterController');

// 导入中间件
const { authenticateToken } = require('../middleware/auth');
const { validateChapter } = require('../middleware/validation');

/**
 * @route   POST /api/chapters/save
 * @desc    保存章节内容
 * @access  Private
 */
router.post('/save', authenticateToken, validateChapter, saveChapter);

/**
 * @route   GET /api/chapters
 * @desc    获取用户的章节列表
 * @access  Private
 */
router.get('/', authenticateToken, getUserChapters);

/**
 * @route   GET /api/chapters/:chapterId
 * @desc    获取单个章节详情
 * @access  Private
 */
router.get('/:chapterId', authenticateToken, getChapter);

/**
 * @route   DELETE /api/chapters/:chapterId
 * @desc    删除章节
 * @access  Private
 */
router.delete('/:chapterId', authenticateToken, deleteChapter);

module.exports = router;
