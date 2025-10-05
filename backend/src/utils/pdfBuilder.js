const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COVER_IMAGE_CANDIDATES = [
  path.join(__dirname, '../../../memoir-app/ios/App/public/images/memoirbook.png'),
  path.join(__dirname, '../../../memoir-app/ios/App/App/public/images/memoirbook.png'),
  path.join(__dirname, '../../../memoir-app/src/images/memoirbook.png'),
  path.join(__dirname, '../../assets/images/memoirbook.png')
];

const FONT_CANDIDATES = [
  '/System/Library/Fonts/PingFang.ttc',
  '/System/Library/Fonts/STHeiti Light.ttc',
  '/Library/Fonts/Songti.ttc',
  '/System/Library/Fonts/Hiragino Sans GB.ttc',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/truetype/noto/NotoSansSC-Regular.otf',
  '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
  '/usr/share/fonts/truetype/arphic/ukai.ttc'
];

const CHAPTER_ORDER = [
  'background',
  'childhood',
  'education',
  'career',
  'love',
  'family',
  'travel',
  'relationships',
  'laterlife',
  'wisdom'
];

const CHAPTER_TITLES = {
  background: '家庭背景',
  childhood: '童年时光',
  education: '求学生涯',
  career: '职业发展',
  love: '爱情婚姻',
  family: '为人父母',
  travel: '旅行见闻',
  relationships: '人缘际遇',
  laterlife: '晚年生活',
  wisdom: '人生感悟'
};

const CHINESE_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function resolveCoverImage() {
  for (const imagePath of COVER_IMAGE_CANDIDATES) {
    if (fs.existsSync(imagePath)) {
      return imagePath;
    }
  }
  return null;
}

function registerPreferredFont(doc) {
  for (const fontPath of FONT_CANDIDATES) {
    if (fs.existsSync(fontPath)) {
      try {
        doc.registerFont('MemoirChinese', fontPath);
        return true;
      } catch (error) {
        console.warn('⚠️ 注册字体失败:', fontPath, error.message);
      }
    }
  }
  console.warn('⚠️ 未找到可用的中文字体，使用默认字体');
  return false;
}

function useChineseFont(doc) {
  try {
    if (doc._fontFamilies && doc._fontFamilies.MemoirChinese) {
      doc.font('MemoirChinese');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ 切换中文字体失败:', error.message);
  }
  return false;
}

function ensurePdfDirectory() {
  const pdfDir = path.join(__dirname, '../../uploads/pdf');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  return pdfDir;
}

function formatParagraphs(content) {
  if (!content) return [];
  const normalized = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n');

  return normalized
    .split(/\n{2,}/)
    .map(paragraph => paragraph.replace(/\n/g, ' ').trim())
    .filter(paragraph => paragraph.length > 0);
}

function renderCoverPage(doc, userDisplayName) {
  const coverImagePath = resolveCoverImage();
  if (coverImagePath) {
    const pageWidth = doc.page.width;
    const imageWidth = 220;
    const imageHeight = 290;
    const x = (pageWidth - imageWidth) / 2;
    const y = 120;

    try {
      doc.image(coverImagePath, x, y, {
        width: imageWidth,
        height: imageHeight
      });
    } catch (error) {
      console.warn('⚠️ 加载封面图片失败:', coverImagePath, error.message);
    }
  } else {
    console.warn('⚠️ 封面图片不存在，跳过添加封面图');
  }

  useChineseFont(doc);
  doc.fontSize(36);
  doc.text('回忆录', 0, 440, { align: 'center' });

  if (userDisplayName) {
    useChineseFont(doc);
    doc.fontSize(18);
    doc.text(userDisplayName, { align: 'center' });
  }

  useChineseFont(doc);
  doc.fontSize(16);
  doc.text('记录您的人生故事', 0, 500, { align: 'center' });

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  useChineseFont(doc);
  doc.fontSize(12);
  doc.text(dateStr, 0, 720, { align: 'center' });
}

function renderTableOfContents(doc) {
  doc.addPage();

  useChineseFont(doc);
  doc.fontSize(26);
  doc.text('目录', { align: 'center' });

  doc.moveDown(2);

  CHAPTER_ORDER.forEach((chapterId, index) => {
    const chapterTitle = CHAPTER_TITLES[chapterId] || chapterId;
    const chapterNumber = CHINESE_NUMERALS[index] || index + 1;

    useChineseFont(doc);
    doc.fontSize(14);
    doc.text(`第${chapterNumber}章  ${chapterTitle}`, {
      align: 'left',
      lineGap: 6
    });

    doc.moveDown(0.4);
  });
}

function renderChapter(doc, chapter, isLast) {
  doc.addPage();

  const chapterNumber = CHINESE_NUMERALS[chapter.number - 1] || chapter.number;

  useChineseFont(doc);
  doc.fontSize(22);
  doc.text(`第${chapterNumber}章  ${chapter.title}`, { align: 'center' });

  doc.moveDown(2);

  const paragraphs = formatParagraphs(chapter.content);

  if (paragraphs.length === 0) {
    useChineseFont(doc);
    doc.fontSize(12);
    doc.fillColor('#999999');
    doc.text('此章节暂无内容', { align: 'center', oblique: true });
  } else {
    useChineseFont(doc);
    doc.fontSize(13);
    doc.fillColor('#000000');

    paragraphs.forEach((paragraph, idx) => {
      doc.text(paragraph, {
        align: 'justify',
        lineGap: 8,
        indent: 24,
        height: doc.page.height - 120
      });

      if (idx !== paragraphs.length - 1) {
        doc.moveDown(1.2);
      }
    });
  }

  doc.fillColor('#000000');

  if (!isLast) {
    const remainingSpace = doc.page.height - doc.y - doc.page.margins.bottom;
    if (remainingSpace < 120) {
      doc.addPage();
    }
  }
}

function resolveUserDisplayName(user) {
  if (!user) return '';
  const plainUser = typeof user.get === 'function' ? user.get({ plain: true }) : user;
  return plainUser.nickname || plainUser.username || plainUser.email || '';
}

async function generateMemoirPdf({ user, chapters }) {
  const pdfDir = ensurePdfDirectory();
  const timestamp = Date.now();
  const pdfFileName = `memoir_${user.id}_${timestamp}.pdf`;
  const pdfPath = path.join(pdfDir, pdfFileName);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 60, right: 60 }
    });

    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    registerPreferredFont(doc);

    doc.info.Title = '回忆录';
    doc.info.Author = resolveUserDisplayName(user) || '岁月镜像';
    doc.info.Subject = '个人回忆录';
    doc.info.Keywords = '回忆录, Memoir, 岁月镜像';

    renderCoverPage(doc, resolveUserDisplayName(user));
    renderTableOfContents(doc);

    chapters.forEach((chapter, index) => {
      renderChapter(doc, chapter, index === chapters.length - 1);
    });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return {
    pdfFileName,
    pdfPath,
    pdfUrl: `/uploads/pdf/${pdfFileName}`
  };
}

module.exports = {
  CHAPTER_ORDER,
  CHAPTER_TITLES,
  generateMemoirPdf
};
