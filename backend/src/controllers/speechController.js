const aliyunTokenService = require('../utils/aliyunToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: function (req, file, cb) {
    // 允许的音频格式
    const allowedTypes = /wav|mp3|m4a|aac|flac|opus/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持音频文件格式: wav, mp3, m4a, aac, flac, opus'));
    }
  }
});

/**
 * @desc 获取阿里云语音识别Token
 * @route GET /api/speech/token
 * @access Private
 */
const getSpeechToken = async (req, res) => {
  try {
    const token = await aliyunTokenService.getToken();
    
    res.status(200).json({
      success: true,
      message: '获取语音识别Token成功',
      data: {
        token: token,
        // 出于安全考虑，不返回具体过期时间，只返回是否有效
        isValid: aliyunTokenService.isTokenValid()
      }
    });

  } catch (error) {
    console.error('获取语音Token错误:', error);
    res.status(500).json({
      success: false,
      message: '获取语音识别Token失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 上传音频文件用于语音识别
 * @route POST /api/speech/upload
 * @access Private
 */
const uploadAudio = (req, res) => {
  // 使用multer中间件处理文件上传
  upload.single('audio')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: '文件大小超过限制(10MB)',
          code: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        success: false,
        message: '文件上传错误: ' + err.message,
        code: 'UPLOAD_ERROR'
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // 文件上传成功
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未检测到音频文件',
        code: 'NO_FILE'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      uploadTime: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: '音频文件上传成功',
      data: {
        file: fileInfo,
        // 返回文件访问URL
        fileUrl: `/uploads/audio/${req.file.filename}`
      }
    });
  });
};

/**
 * @desc 删除上传的音频文件
 * @route DELETE /api/speech/audio/:filename
 * @access Private
 */
const deleteAudio = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/audio', filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '音频文件不存在',
        code: 'FILE_NOT_FOUND'
      });
    }

    // 删除文件
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: '音频文件删除成功'
    });

  } catch (error) {
    console.error('删除音频文件错误:', error);
    res.status(500).json({
      success: false,
      message: '删除音频文件失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 清除Token缓存（用于调试）
 * @route POST /api/speech/clear-token
 * @access Private
 */
const clearTokenCache = async (req, res) => {
  try {
    aliyunTokenService.clearTokenCache();
    
    res.status(200).json({
      success: true,
      message: 'Token缓存已清除'
    });

  } catch (error) {
    console.error('清除Token缓存错误:', error);
    res.status(500).json({
      success: false,
      message: '清除Token缓存失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSpeechToken,
  uploadAudio,
  deleteAudio,
  clearTokenCache
};
