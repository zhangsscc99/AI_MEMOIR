const Chapter = require('../models/Chapter');
const User = require('../models/User');

const normalizeImageAnalyses = (value, images) => {
  if (!Array.isArray(value)) return [];

  const allowedImages = new Set(images);
  return value
    .filter(item => item && allowedImages.has(item.imageUrl) && typeof item.text === 'string' && item.text.trim())
    .slice(0, 9)
    .map(item => ({
      imageUrl: item.imageUrl,
      text: item.text.trim().slice(0, 5000),
      generatedAt: item.generatedAt || new Date().toISOString(),
      addedToContentAt: item.addedToContentAt || null
    }));
};

const formatImageAnalyses = chapter => Array.isArray(chapter.image_analyses)
  ? chapter.image_analyses
  : [];

/**
 * @desc 保存章节内容
 * @route POST /api/chapters/save
 * @access Private
 */
const saveChapter = async (req, res) => {
  try {
    console.log('📥 收到保存章节请求');
    console.log('📋 请求体:', req.body);
    console.log('👤 用户ID:', req.user?.id);
    
    const { chapterId, title, content, recordings, backgroundImage, images, imageAnalyses } = req.body;
    const userId = req.user.id;

    const normalizedImages = Array.isArray(images)
      ? images.filter(image => typeof image === 'string' && image.trim()).slice(0, 9)
      : backgroundImage
        ? [backgroundImage]
        : [];
    const coverImage = normalizedImages[0] || backgroundImage || null;
    const normalizedImageAnalyses = normalizeImageAnalyses(imageAnalyses, normalizedImages);

    // 验证章节ID（支持固定章节和自定义随记章节）
    const validChapterIds = ['background', 'childhood', 'education', 'career', 'love', 'family', 'travel', 'relationships', 'laterlife', 'wisdom'];
    const isCustomDiary = chapterId.startsWith('diary_');
    
    if (!validChapterIds.includes(chapterId) && !isCustomDiary) {
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

    if (images !== undefined || backgroundImage !== undefined) {
      chapter.images = normalizedImages;
      chapter.background_image = coverImage;
    }
    if (imageAnalyses !== undefined) {
      chapter.image_analyses = normalizedImageAnalyses;
    }
      await chapter.updateStatus();
    } else {
      // 创建新章节
      chapter = await Chapter.create({
        user_id: userId,
        chapter_id: chapterId,
        title: title || '未命名章节',
        content: content || '',
        recordings: recordings || [],
        background_image: coverImage,
        images: normalizedImages,
        image_analyses: normalizedImageAnalyses
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
          backgroundImage: chapter.background_image,
          images: Array.isArray(chapter.images) ? chapter.images : (chapter.background_image ? [chapter.background_image] : []),
          imageAnalyses: formatImageAnalyses(chapter),
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
      backgroundImage: chapter.background_image,
      images: Array.isArray(chapter.images) ? chapter.images : (chapter.background_image ? [chapter.background_image] : []),
      imageAnalyses: formatImageAnalyses(chapter),
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

    // 首先尝试通过主键ID查找
    let chapter = await Chapter.findOne({
      where: {
        id: chapterId,
        user_id: userId
      }
    });

    // 如果通过主键没找到，尝试通过chapter_id查找（向后兼容）
    if (!chapter) {
      chapter = await Chapter.findOne({
        where: {
          chapter_id: chapterId,
          user_id: userId
        }
      });
    }

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
          backgroundImage: chapter.background_image,
          images: Array.isArray(chapter.images) ? chapter.images : (chapter.background_image ? [chapter.background_image] : []),
          imageAnalyses: formatImageAnalyses(chapter),
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

    // 首先尝试通过主键ID查找
    let chapter = await Chapter.findOne({
      where: {
        id: chapterId,
        user_id: userId
      }
    });

    // 如果通过主键没找到，尝试通过chapter_id查找（向后兼容）
    if (!chapter) {
      chapter = await Chapter.findOne({
        where: {
          chapter_id: chapterId,
          user_id: userId
        }
      });
    }

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
