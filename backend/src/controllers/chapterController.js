const Chapter = require('../models/Chapter');
const User = require('../models/User');

/**
 * @desc 保存章节内容
 * @route POST /api/chapters/save
 * @access Private
 */
const saveChapter = async (req, res) => {
  try {
    const { chapterId, title, content, recordings } = req.body;
    const userId = req.user.id;

    // 验证章节ID
    const validChapterIds = ['background', 'childhood', 'education', 'career', 'love', 'family', 'travel', 'relationships', 'laterlife', 'wisdom'];
    if (!validChapterIds.includes(chapterId)) {
      return res.status(400).json({
        success: false,
        message: '无效的章节ID'
      });
    }

    // 查找或创建章节
    let chapter = await Chapter.findOne({
      where: {
        user_id: userId,
        chapter_id: chapterId
      }
    });

    if (chapter) {
      // 更新现有章节
      chapter.title = title || chapter.title;
      chapter.content = content || '';
      chapter.recordings = recordings || [];
      await chapter.updateStatus();
    } else {
      // 创建新章节
      chapter = await Chapter.create({
        user_id: userId,
        chapter_id: chapterId,
        title: title || '未命名章节',
        content: content || '',
        recordings: recordings || []
      });
      await chapter.updateStatus();
    }

    res.status(200).json({
      success: true,
      message: '章节保存成功',
      data: {
        chapter: {
          id: chapter.id,
          chapterId: chapter.chapter_id,
          title: chapter.title,
          content: chapter.content,
          recordings: chapter.recordings,
          status: chapter.status,
          wordCount: chapter.word_count,
          recordingCount: chapter.recording_count,
          updatedAt: chapter.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('保存章节错误:', error);
    res.status(500).json({
      success: false,
      message: '保存失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 获取用户的章节列表
 * @route GET /api/chapters
 * @access Private
 */
const getUserChapters = async (req, res) => {
  try {
    const userId = req.user.id;

    const chapters = await Chapter.findAll({
      where: {
        user_id: userId
      },
      order: [['updatedAt', 'DESC']]
    });

    const formattedChapters = chapters.map(chapter => ({
      id: chapter.id,
      chapterId: chapter.chapter_id,
      title: chapter.title,
      content: chapter.content,
      recordings: chapter.recordings,
      status: chapter.status,
      wordCount: chapter.word_count,
      recordingCount: chapter.recording_count,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: '获取章节列表成功',
      data: {
        chapters: formattedChapters,
        total: formattedChapters.length
      }
    });

  } catch (error) {
    console.error('获取章节列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取章节列表失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 获取单个章节详情
 * @route GET /api/chapters/:chapterId
 * @access Private
 */
const getChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    const chapter = await Chapter.findOne({
      where: {
        user_id: userId,
        chapter_id: chapterId
      }
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '获取章节详情成功',
      data: {
        chapter: {
          id: chapter.id,
          chapterId: chapter.chapter_id,
          title: chapter.title,
          content: chapter.content,
          recordings: chapter.recordings,
          status: chapter.status,
          wordCount: chapter.word_count,
          recordingCount: chapter.recording_count,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('获取章节详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取章节详情失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 删除章节
 * @route DELETE /api/chapters/:chapterId
 * @access Private
 */
const deleteChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    const chapter = await Chapter.findOne({
      where: {
        user_id: userId,
        chapter_id: chapterId
      }
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    await chapter.destroy();

    res.status(200).json({
      success: true,
      message: '章节删除成功'
    });

  } catch (error) {
    console.error('删除章节错误:', error);
    res.status(500).json({
      success: false,
      message: '删除章节失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  saveChapter,
  getUserChapters,
  getChapter,
  deleteChapter
};
