const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/images');
const webpDir = path.join(__dirname, '../../uploads/images_webp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(webpDir)) {
  fs.mkdirSync(webpDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

// 单文件上传中间件
const uploadSingle = upload.single('image');

/**
 * @desc 上传图片
 * @route POST /api/upload/image
 * @access Private
 */
const uploadImage = (req, res) => {
  uploadSingle(req, res, async (err) => {
    try {
      if (err) {
        console.error('图片上传错误:', err);
        return res.status(400).json({
          success: false,
          message: err.message || '图片上传失败',
          code: 'UPLOAD_ERROR'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片',
          code: 'NO_FILE'
        });
      }

      // 生成WebP版本
      const originalPath = req.file.path;
      const webpFilename = req.file.filename.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const webpPath = path.join(webpDir, webpFilename);
      
      // 使用sharp转换为WebP
      await sharp(originalPath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      
      // 生成可访问的URL（优先返回WebP）
      const imageUrl = `http://localhost:3001/uploads/images_webp/${webpFilename}`;
      const originalUrl = `http://localhost:3001/uploads/images/${req.file.filename}`;
      
      console.log('✅ 图片上传成功:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        webpFilename: webpFilename,
        originalSize: req.file.size,
        webpSize: fs.statSync(webpPath).size,
        url: imageUrl
      });

      res.status(200).json({
        success: true,
        message: '图片上传成功',
        data: {
          filename: req.file.filename,
          webpFilename: webpFilename,
          originalname: req.file.originalname,
          originalSize: req.file.size,
          webpSize: fs.statSync(webpPath).size,
          url: imageUrl, // 优先返回WebP URL
          originalUrl: originalUrl // 保留原图URL作为备选
        }
      });

    } catch (error) {
      console.error('处理上传结果错误:', error);
      res.status(500).json({
        success: false,
        message: '处理上传结果失败',
        code: 'PROCESS_ERROR'
      });
    }
  });
};

module.exports = {
  uploadImage
};
