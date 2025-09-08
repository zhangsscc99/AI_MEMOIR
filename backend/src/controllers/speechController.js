const aliyunTokenService = require('../utils/aliyunToken');
const aliyunSpeechService = require('../utils/aliyunSpeechService');
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
 * @desc 转写音频文件
 * @route POST /api/speech/transcribe
 * @access Private
 */
const transcribeAudio = async (req, res) => {
  try {
    const { filename, testMode } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '缺少音频文件名',
        code: 'MISSING_FILENAME'
      });
    }

    // 检查是否为测试模式
    if (testMode === true || filename === 'test_mode') {
      console.log('🧪 测试模式: 模拟阿里云API调用...');
      
      // 检查环境变量配置
      const hasValidConfig = process.env.ALIYUN_AK_ID && 
                            process.env.ALIYUN_AK_SECRET && 
                            process.env.ALIYUN_APP_KEY && 
                            process.env.ALIYUN_APP_KEY !== 'your_app_key_here';
      
      if (!hasValidConfig) {
        return res.status(500).json({
          success: false,
          message: '阿里云配置不完整',
          details: '请检查 ALIYUN_AK_ID, ALIYUN_AK_SECRET, ALIYUN_APP_KEY 环境变量',
          testMode: true
        });
      }
      
      try {
        // 使用新的阿里云语音服务进行测试
        const transcript = await aliyunSpeechService.testSpeechRecognition('阿里云语音识别测试');
        
        res.status(200).json({
          success: true,
          message: '阿里云语音识别配置验证成功',
          data: {
            filename: 'test_mode',
            transcript: transcript,
            transcribedAt: new Date().toISOString(),
            testMode: true,
            config: {
              hasAccessKey: !!process.env.ALIYUN_AK_ID,
              hasSecret: !!process.env.ALIYUN_AK_SECRET,
              hasAppKey: !!process.env.ALIYUN_APP_KEY,
              appKey: process.env.ALIYUN_APP_KEY.substring(0, 8) + '...'
            }
          }
        });
        
      } catch (testError) {
        console.error('❌ 阿里云语音识别测试失败:', testError);
        res.status(500).json({
          success: false,
          message: '阿里云语音识别测试失败',
          error: testError.message,
          details: `测试错误: ${testError.message}`,
          testMode: true
        });
      }
      
      return;
    }

    // 正常模式：处理真实音频文件
    const audioFilePath = path.join(__dirname, '../../uploads/audio', filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(audioFilePath)) {
      return res.status(404).json({
        success: false,
        message: '音频文件不存在',
        code: 'FILE_NOT_FOUND',
        requestedFile: filename
      });
    }

    // 构建文件的公网访问URL
    const publicFileUrl = `${req.protocol}://${req.get('host')}/uploads/audio/${filename}`;
    
    console.log('🎤 开始音频转写:', {
      filename,
      publicFileUrl,
      localPath: audioFilePath
    });

    // 读取音频文件并调用阿里云语音识别服务
    const audioBuffer = fs.readFileSync(audioFilePath);
    const transcript = await aliyunSpeechService.recognizeAudio(audioBuffer);

    res.status(200).json({
      success: true,
      message: '音频转写成功',
      data: {
        filename: filename,
        transcript: transcript,
        transcribedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('音频转写错误:', error);
    res.status(500).json({
      success: false,
      message: '音频转写失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '转写服务暂时不可用',
      details: error.message
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
  transcribeAudio,
  clearTokenCache
};
