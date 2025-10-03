const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Chapter = require('../models/Chapter');
const User = require('../models/User');

/**
 * @desc 生成回忆录PDF
 * @route POST /api/pdf/generate
 * @access Private
 */
const generateMemoir = async (req, res) => {
  try {
    console.log('📚 开始生成回忆录PDF...');
    const userId = req.user.id;

    // 获取用户信息
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取所有章节（包括空的）
    const fixedChapterIds = [
      'background', 'childhood', 'education', 'career', 'love', 
      'family', 'travel', 'relationships', 'laterlife', 'wisdom'
    ];
    
    const chapterTitles = {
      'background': '家庭背景',
      'childhood': '童年时光',
      'education': '求学生涯',
      'career': '职业发展',
      'love': '爱情婚姻',
      'family': '为人父母',
      'travel': '旅行见闻',
      'relationships': '人缘际遇',
      'laterlife': '晚年生活',
      'wisdom': '人生感悟'
    };

    // 获取用户已保存的章节
    const savedChapters = await Chapter.findAll({
      where: {
        user_id: userId,
        chapter_id: fixedChapterIds
      }
    });

    // 创建章节映射
    const chaptersMap = {};
    savedChapters.forEach(chapter => {
      chaptersMap[chapter.chapter_id] = chapter;
    });

    // 构建完整的章节列表（包括空章节）
    const allChapters = fixedChapterIds.map((chapterId, index) => {
      const savedChapter = chaptersMap[chapterId];
      return {
        number: index + 1,
        id: chapterId,
        title: chapterTitles[chapterId],
        content: savedChapter?.content || '',
        isEmpty: !savedChapter || !savedChapter.content || savedChapter.content.trim() === ''
      };
    });

    // 创建PDF目录
    const pdfDir = path.join(__dirname, '../../uploads/pdf');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // 生成PDF文件名
    const timestamp = Date.now();
    const pdfFileName = `memoir_${userId}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);

    // 创建PDF文档
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // 创建写入流
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // 注册中文字体（使用系统字体）
    const fontPath = '/System/Library/Fonts/STHeiti Light.ttc';
    if (fs.existsSync(fontPath)) {
      doc.registerFont('Chinese', fontPath);
      doc.font('Chinese');
    } else {
      console.warn('⚠️ 未找到中文字体，使用默认字体');
    }

    // 添加封面
    await addCoverPage(doc);

    // 添加目录
    addTableOfContents(doc, allChapters);

    // 添加章节内容
    allChapters.forEach((chapter, index) => {
      addChapterPage(doc, chapter, index === allChapters.length - 1);
    });

    // 完成PDF
    doc.end();

    // 等待文件写入完成
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    console.log('✅ PDF生成成功:', pdfFileName);

    // 返回PDF URL
    const pdfUrl = `/uploads/pdf/${pdfFileName}`;
    
    res.status(200).json({
      success: true,
      message: 'PDF生成成功',
      data: {
        pdfUrl: pdfUrl,
        fileName: pdfFileName
      }
    });

  } catch (error) {
    console.error('❌ 生成PDF失败:', error);
    res.status(500).json({
      success: false,
      message: '生成PDF失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 添加封面页
 */
async function addCoverPage(doc) {
  // 添加封面图片 - 尝试多个可能的路径
  const possiblePaths = [
    path.join(__dirname, '../../../memoir-app/src/images/memoirbook.png'),
    path.join(__dirname, '../../../memoir-app/ios/App/App/public/images/memoirbook.png')
  ];
  
  let coverImagePath = null;
  for (const imagePath of possiblePaths) {
    if (fs.existsSync(imagePath)) {
      coverImagePath = imagePath;
      break;
    }
  }
  
  if (coverImagePath && fs.existsSync(coverImagePath)) {
    // 计算图片居中位置
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const imageWidth = 200;
    const imageHeight = 260;
    const x = (pageWidth - imageWidth) / 2;
    const y = 100;

    doc.image(coverImagePath, x, y, {
      width: imageWidth,
      height: imageHeight
    });
  } else {
    console.warn('⚠️ 封面图片不存在，跳过添加封面图');
  }

  // 添加标题
  doc.fontSize(36)
     .text('回忆录', 0, 400, { align: 'center' });

  doc.fontSize(16)
     .text('记录您的人生故事', 0, 450, { align: 'center' });

  // 添加日期
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  doc.fontSize(12)
     .text(dateStr, 0, 700, { align: 'center' });

  // 新建一页
  doc.addPage();
}

/**
 * 添加目录
 */
function addTableOfContents(doc, chapters) {
  doc.fontSize(24)
     .text('目录', { align: 'center' });

  doc.moveDown(2);

  chapters.forEach((chapter, index) => {
    const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const chapterNumber = chineseNumbers[index] || (index + 1);
    
    doc.fontSize(14)
       .text(`第${chapterNumber}章  ${chapter.title}`, {
         continued: true
       })
       .text('', { align: 'right' });

    doc.moveDown(0.5);
  });

  doc.addPage();
}

/**
 * 添加章节页
 */
function addChapterPage(doc, chapter, isLast) {
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const chapterNumber = chineseNumbers[chapter.number - 1] || chapter.number;

  // 章节标题
  doc.fontSize(20)
     .text(`第${chapterNumber}章  ${chapter.title}`, { align: 'center' });

  doc.moveDown(2);

  // 章节内容
  if (chapter.isEmpty) {
    doc.fontSize(12)
       .fillColor('#999999')
       .text('此章节暂无内容', { align: 'center', italic: true });
  } else {
    doc.fontSize(12)
       .fillColor('#000000')
       .text(chapter.content, {
         align: 'justify',
         lineGap: 5
       });
  }

  // 如果不是最后一章，添加新页
  if (!isLast) {
    doc.addPage();
  }
}

/**
 * @desc 获取PDF列表
 * @route GET /api/pdf/list
 * @access Private
 */
const getPdfList = async (req, res) => {
  try {
    const userId = req.user.id;
    const pdfDir = path.join(__dirname, '../../uploads/pdf');

    if (!fs.existsSync(pdfDir)) {
      return res.status(200).json({
        success: true,
        data: {
          pdfs: []
        }
      });
    }

    // 读取用户的PDF文件
    const files = fs.readdirSync(pdfDir);
    const userPdfs = files
      .filter(file => file.startsWith(`memoir_${userId}_`) && file.endsWith('.pdf'))
      .map(file => {
        const filePath = path.join(pdfDir, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          url: `/uploads/pdf/${file}`,
          createdAt: stats.birthtime.toISOString(),
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: {
        pdfs: userPdfs
      }
    });

  } catch (error) {
    console.error('❌ 获取PDF列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取PDF列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  generateMemoir,
  getPdfList
};

