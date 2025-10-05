const fs = require('fs');
const path = require('path');
const { enqueueMemoirJob, getJobForUser } = require('../services/pdfJobService');

/**
 * @desc 生成回忆录PDF
 * @route POST /api/pdf/generate
 * @access Private
 */
const generateMemoir = async (req, res) => {
  try {
    console.log('📚 接收到生成回忆录PDF的请求...');
    const job = enqueueMemoirJob(req.user.id);

    res.status(202).json({
      success: true,
      message: '生成任务已创建，请稍候',
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message
      }
    });
  } catch (error) {
    console.error('❌ 创建PDF任务失败:', error);
    res.status(500).json({
      success: false,
      message: '创建PDF任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 获取PDF生成任务状态
 * @route GET /api/pdf/status/:jobId
 * @access Private
 */
const getPdfJobStatus = (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJobForUser(jobId, req.user.id);

    if (!job || job.status === 'not_found') {
      return res.status(404).json({
        success: false,
        message: '未找到对应的PDF生成任务'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        job
      }
    });
  } catch (error) {
    console.error('❌ 获取PDF任务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务状态失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

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
        const createdAtDate = stats.birthtime && !Number.isNaN(stats.birthtime.getTime()) && stats.birthtime.getTime() > 0
          ? stats.birthtime
          : stats.mtime;
        return {
          fileName: file,
          url: `/uploads/pdf/${file}`,
          createdAt: createdAtDate.toISOString(),
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

/**
 * @desc 删除指定的 PDF 文件
 * @route DELETE /api/pdf/file/:fileName
 * @access Private
 */
const deletePdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: '缺少文件名参数'
      });
    }

    const decodedFileName = decodeURIComponent(fileName);
    const expectedPrefix = `memoir_${userId}_`;

    if (!decodedFileName.startsWith(expectedPrefix) || !decodedFileName.endsWith('.pdf')) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的PDF文件'
      });
    }

    const pdfDir = path.join(__dirname, '../../uploads/pdf');
    const targetPath = path.join(pdfDir, decodedFileName);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF文件不存在或已删除'
      });
    }

    fs.unlinkSync(targetPath);

    return res.status(200).json({
      success: true,
      message: 'PDF已删除'
    });

  } catch (error) {
    console.error('❌ 删除PDF失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除PDF失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  generateMemoir,
  getPdfJobStatus,
  getPdfList,
  deletePdf
};
