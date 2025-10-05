const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { User, Chapter } = require('../models');
const { CHAPTER_ORDER, CHAPTER_TITLES, generateMemoirPdf } = require('../utils/pdfBuilder');

const jobStore = new Map();
const processingQueue = [];
let isProcessing = false;

const JOB_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function cleanupExpiredJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobStore.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobStore.delete(jobId);
    }
  }
}

setInterval(cleanupExpiredJobs, 1000 * 60 * 30).unref();

function serializeJob(job) {
  return {
    id: job.id,
    userId: job.userId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    error: job.error,
    result: job.result,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

async function fetchChaptersForUser(userId) {
  const savedChapters = await Chapter.findAll({
    where: {
      user_id: userId,
      chapter_id: { [Op.in]: CHAPTER_ORDER }
    }
  });

  const chapterMap = savedChapters.reduce((acc, chapter) => {
    acc[chapter.chapter_id] = chapter;
    return acc;
  }, {});

  return CHAPTER_ORDER.map((chapterId, index) => {
    const savedChapter = chapterMap[chapterId];
    const content = savedChapter?.content || '';
    return {
      number: index + 1,
      id: chapterId,
      title: CHAPTER_TITLES[chapterId] || chapterId,
      content,
      isEmpty: !content || !content.trim()
    };
  });
}

async function processQueue() {
  if (isProcessing) return;
  if (processingQueue.length === 0) return;

  isProcessing = true;

  while (processingQueue.length > 0) {
    const job = processingQueue.shift();
    job.status = 'processing';
    job.progress = 5;
    job.message = '正在准备生成所需内容';
    job.updatedAt = Date.now();

    try {
      const user = await User.findByPk(job.userId);

      if (!user) {
        throw new Error('用户不存在或已被删除');
      }

      job.progress = 15;
      job.message = '正在收集章节内容';
      job.updatedAt = Date.now();

      const chapters = await fetchChaptersForUser(job.userId);

      job.progress = 45;
      job.message = '正在排版章节内容';
      job.updatedAt = Date.now();

      const { pdfFileName, pdfUrl } = await generateMemoirPdf({ user, chapters });

      job.progress = 100;
      job.status = 'completed';
      job.message = 'PDF 生成完成';
      job.result = {
        pdfUrl,
        fileName: pdfFileName
      };
      job.updatedAt = Date.now();
    } catch (error) {
      job.status = 'failed';
      job.error = error.message || '生成失败';
      job.message = '生成失败';
      job.updatedAt = Date.now();
      console.error('❌ PDF生成任务失败:', error);
    }
  }

  isProcessing = false;
}

function enqueueMemoirJob(userId) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    userId,
    status: 'queued',
    progress: 0,
    message: '任务已创建，等待处理',
    error: null,
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  jobStore.set(jobId, job);
  processingQueue.push(job);
  process.nextTick(processQueue);

  return serializeJob(job);
}

function getJobForUser(jobId, userId) {
  const job = jobStore.get(jobId);
  if (!job) return null;
  if (job.userId !== userId) {
    return {
      id: jobId,
      status: 'not_found',
      message: '未找到该任务'
    };
  }
  return serializeJob(job);
}

module.exports = {
  enqueueMemoirJob,
  getJobForUser
};

