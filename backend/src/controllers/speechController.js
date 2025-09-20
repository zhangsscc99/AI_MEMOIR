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
    console.log('📄 检查上传文件:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // 允许的音频格式扩展名
    const allowedExtensions = /wav|mp3|m4a|aac|flac|opus|webm|ogg/;
    // 允许的MIME类型
    const allowedMimeTypes = /audio\/(wav|mpeg|mp4|aac|flac|opus|webm|ogg|x-wav|x-m4a)/;
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const hasValidExtension = allowedExtensions.test(fileExtension);
    const hasValidMimeType = allowedMimeTypes.test(file.mimetype);
    
    console.log('🔍 文件验证:', {
      fileExtension,
      hasValidExtension,
      hasValidMimeType,
      mimetype: file.mimetype
    });
    
    // 对于浏览器录制的文件，可能没有扩展名但有正确的MIME类型
    if (hasValidMimeType || hasValidExtension) {
      return cb(null, true);
    } else {
      const errorMsg = `不支持的文件格式。文件: ${file.originalname}, MIME: ${file.mimetype}`;
      console.error('❌ 文件格式不支持:', errorMsg);
      cb(new Error(errorMsg));
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
    console.log('🔑 ===== 获取语音识别Token API调用开始 =====');
    console.log('👤 用户ID:', req.user?.id);
    console.log('⏰ 请求时间:', new Date().toISOString());
    
    const token = await aliyunTokenService.getToken();
    
    console.log('✅ Token获取成功:', {
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'null',
      isValid: aliyunTokenService.isTokenValid()
    });
    
    res.status(200).json({
      success: true,
      message: '获取语音识别Token成功',
      data: {
        token: token,
        appkey: process.env.ALIYUN_SPEECH_APPKEY,
        // 出于安全考虑，不返回具体过期时间，只返回是否有效
        isValid: aliyunTokenService.isTokenValid()
      }
    });

    console.log('✅ ===== 获取语音识别Token API调用完成 =====');

  } catch (error) {
    console.error('❌ ===== 获取语音识别Token API调用失败 =====');
    console.error('❌ 错误详情:', {
      message: error.message,
      stack: error.stack
    });
    
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
  console.log('📤 ===== 音频上传API调用开始 =====');
  console.log('👤 用户ID:', req.user?.id);
  console.log('⏰ 请求时间:', new Date().toISOString());
  console.log('📋 请求头:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });
  
  // 使用multer中间件处理文件上传
  upload.single('audio')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log('❌ Multer错误:', err.code, err.message);
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
      console.log('❌ 文件验证错误:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // 文件上传成功
    if (!req.file) {
      console.log('❌ 未检测到音频文件');
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

    console.log('✅ 音频文件上传成功:', {
      filename: fileInfo.filename,
      originalName: fileInfo.originalName,
      size: fileInfo.size,
      mimetype: fileInfo.mimetype,
      path: fileInfo.path
    });

    res.status(200).json({
      success: true,
      message: '音频文件上传成功',
      data: {
        file: fileInfo,
        // 返回文件访问URL
        fileUrl: `/uploads/audio/${req.file.filename}`
      }
    });

    console.log('✅ ===== 音频上传API调用完成 =====');
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
    const { filename, testMode, realtime } = req.body;
    
    console.log('🎤 ===== 语音识别API调用开始 =====');
    console.log('📁 请求参数:', { filename, testMode, realtime });
    console.log('👤 用户ID:', req.user?.id);
    console.log('⏰ 请求时间:', new Date().toISOString());
    
    if (!filename) {
      console.log('❌ 缺少音频文件名');
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
    
    console.log('📂 检查音频文件路径:', audioFilePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(audioFilePath)) {
      console.log('❌ 音频文件不存在:', audioFilePath);
      return res.status(404).json({
        success: false,
        message: '音频文件不存在',
        code: 'FILE_NOT_FOUND',
        requestedFile: filename
      });
    }

    // 获取文件信息
    const fileStats = fs.statSync(audioFilePath);
    console.log('📊 音频文件信息:', {
      size: fileStats.size,
      created: fileStats.birthtime,
      modified: fileStats.mtime
    });

    // 构建文件的公网访问URL
    const publicFileUrl = `${req.protocol}://${req.get('host')}/uploads/audio/${filename}`;
    
    console.log('🎤 开始音频转写:', {
      filename,
      publicFileUrl,
      localPath: audioFilePath,
      realtime: realtime || false,
      fileSize: fileStats.size
    });

    // 读取音频文件并调用阿里云语音识别服务
    console.log('📖 读取音频文件...');
    const audioBuffer = fs.readFileSync(audioFilePath);
    console.log('✅ 音频文件读取完成，大小:', audioBuffer.length, 'bytes');
    
    console.log('🚀 调用阿里云语音识别服务...');
    const transcript = await aliyunSpeechService.recognizeAudio(audioBuffer);
    console.log('✅ 阿里云语音识别完成，结果:', transcript);

    console.log('📤 返回识别结果:', {
      filename,
      transcriptLength: transcript ? transcript.length : 0,
      hasResult: !!transcript && transcript !== '识别完成但无结果'
    });

    res.status(200).json({
      success: true,
      message: '音频转写成功',
      data: {
        filename: filename,
        transcript: transcript,
        transcribedAt: new Date().toISOString()
      }
    });

    console.log('✅ ===== 语音识别API调用完成 =====');

  } catch (error) {
    console.error('❌ ===== 语音识别API调用失败 =====');
    console.error('❌ 错误详情:', {
      message: error.message,
      stack: error.stack,
      filename: filename
    });
    
    res.status(500).json({
      success: false,
      message: '音频转写失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '转写服务暂时不可用',
      details: error.message
    });
  }
};

/**
 * @desc WebSocket流式语音识别
 * @route POST /api/speech/streaming-recognize
 * @access Private
 */
const streamingRecognize = async (req, res) => {
  try {
    const { audioData, format, sampleRate, realtime } = req.body;
    
    console.log('🎤 ===== WebSocket流式语音识别API调用开始 =====');
    console.log('📊 请求参数:', { 
      audioDataLength: audioData ? audioData.length : 0, 
      format, 
      sampleRate, 
      realtime 
    });
    console.log('👤 用户ID:', req.user?.id);
    console.log('⏰ 请求时间:', new Date().toISOString());
    
    if (!audioData) {
      console.log('❌ 缺少音频数据');
      return res.status(400).json({
        success: false,
        message: '缺少音频数据',
        code: 'MISSING_AUDIO_DATA'
      });
    }

    // 将Base64音频数据转换为Buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    console.log('✅ 音频数据转换完成，大小:', audioBuffer.length, 'bytes');
    
    // 调用阿里云流式语音识别服务
    console.log('🚀 调用阿里云流式语音识别服务...');
    const transcript = await aliyunSpeechService.recognizeAudio(audioBuffer);
    console.log('✅ 阿里云流式语音识别完成，结果:', transcript);

    console.log('📤 返回流式识别结果:', {
      transcriptLength: transcript ? transcript.length : 0,
      hasResult: !!transcript && transcript !== '识别完成但无结果'
    });

    res.status(200).json({
      success: true,
      message: '流式语音识别成功',
      data: {
        transcript: transcript,
        recognizedAt: new Date().toISOString()
      }
    });

    console.log('✅ ===== WebSocket流式语音识别API调用完成 =====');

  } catch (error) {
    console.error('❌ ===== WebSocket流式语音识别API调用失败 =====');
    console.error('❌ 错误详情:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: '流式语音识别失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '识别服务暂时不可用',
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
  streamingRecognize,
  clearTokenCache
};
