// pages/chapter-edit/chapter-edit.js - 章节编辑页
const app = getApp()
const { callMiniMax } = require('../../utils/minimax')
const { IMAGE_BASE } = require('../../config/index')

const PROMPTS_MAP = {
  background:    ['您出生在哪里？那是一个什么样的地方？', '您的父母是做什么工作的？', '家里有哪些亲人？他们各自有什么特点？'],
  childhood:     ['您最难忘的童年记忆是什么？', '小时候最喜欢玩什么游戏？', '有没有特别要好的童年伙伴？'],
  education:     ['您的求学经历是怎样的？', '有没有对您影响深刻的老师？', '学生时代最难忘的经历是什么？'],
  career:        ['您的第一份工作是什么？', '职业生涯中最大的成就是什么？', '工作中遇到过什么挑战？'],
  love:          ['您是如何遇到另一半的？', '印象最深刻的约会经历是什么？', '婚礼是什么样的？'],
  family:        ['成为父母后的感受如何？', '孩子给您带来了什么变化？', '家庭生活中最温馨的时刻是什么？'],
  travel:        ['您去过哪些地方旅行？', '最难忘的旅行经历是什么？', '旅行中遇到过什么有趣的人或事？'],
  relationships: ['您生命中最重要的朋友是谁？', '有没有改变您人生轨迹的重要遇见？', '您如何维系长久的友谊？'],
  laterlife:     ['退休后的生活是什么样的？', '晚年最大的快乐来源是什么？', '对于衰老您有什么感受？'],
  wisdom:        ['人生中最重要的感悟是什么？', '如果重新来过，您会做出不同的选择吗？', '您希望给年轻人什么建议？']
}

function getDateStr() {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

Page({
  data: {
    chapterId: '',
    chapterTitle: '',
    content: '',
    recordings: [],
    backgroundImage: null,
    status: 'draft',
    loading: false,
    saving: false,
    isRecording: false,
    recordingDuration: 0,
    recordingTimer: null,
    aiPolishing: false,
    uploadingImage: false,
    prompts: [],
    dateStr: '',
    statusBarHeight: 0,
    imageBase: IMAGE_BASE
  },

  onLoad(options) {
    const { chapterId, title } = options
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      chapterId,
      chapterTitle: decodeURIComponent(title || '章节'),
      prompts: PROMPTS_MAP[chapterId] || [],
      dateStr: getDateStr(),
      statusBarHeight: sysInfo.statusBarHeight
    })
    this.recorderManager = wx.getRecorderManager()
    this.setupRecorder()
    this.loadChapter()
  },

  goBack() {
    wx.navigateBack()
  },

  onUnload() {
    // 如果录音中则停止
    if (this.data.isRecording) {
      this.recorderManager.stop()
    }
    if (this.data.recordingTimer) {
      clearInterval(this.data.recordingTimer)
    }
  },

  // 加载章节
  async loadChapter() {
    this.setData({ loading: true })
    try {
      const result = await wx.cloud.callFunction({
        name: 'chapter',
        data: { action: 'getOne', chapterId: this.data.chapterId }
      })

      const { success, data } = result.result
      if (success && data?.chapter) {
        const { content, recordings, backgroundImage, status } = data.chapter
        this.setData({
          content: content || '',
          recordings: recordings || [],
          backgroundImage: backgroundImage || null,
          status: status || 'draft'
        })
      }
    } catch (err) {
      console.error('加载章节失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 保存章节
  async saveChapter() {
    if (this.data.saving) return
    this.setData({ saving: true })

    try {
      const result = await wx.cloud.callFunction({
        name: 'chapter',
        data: {
          action: 'save',
          chapterId: this.data.chapterId,
          title: this.data.chapterTitle,
          content: this.data.content,
          recordings: this.data.recordings,
          backgroundImage: this.data.backgroundImage
        }
      })

      const { success, error } = result.result
      if (!success) throw new Error(error || '保存失败')

      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      console.error('保存失败:', err)
      wx.showToast({ title: err.message || '保存失败', icon: 'error' })
    } finally {
      this.setData({ saving: false })
    }
  },

  // 内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // ===== 录音功能 =====

  // 初始化录音管理器
  setupRecorder() {
    const rm = this.recorderManager

    rm.onStart(() => {
      console.log('录音开始')
      // 开始计时
      let duration = 0
      const timer = setInterval(() => {
        duration++
        this.setData({ recordingDuration: duration })
        if (duration >= 120) { // 最长2分钟
          this.stopRecording()
        }
      }, 1000)
      this.setData({ recordingTimer: timer })
    })

    rm.onStop(async (res) => {
      clearInterval(this.data.recordingTimer)
      this.setData({ isRecording: false, recordingDuration: 0, recordingTimer: null })

      if (res.tempFilePath) {
        await this.uploadRecording(res.tempFilePath, res.duration)
      }
    })

    rm.onError((err) => {
      clearInterval(this.data.recordingTimer)
      this.setData({ isRecording: false, recordingDuration: 0 })
      console.error('录音错误:', err)
      wx.showToast({ title: '录音失败', icon: 'error' })
    })
  },

  // 开始录音
  startRecording() {
    // 检查权限
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.recorderManager.start({
          duration: 120000,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 96000,
          format: 'mp3'
        })
        this.setData({ isRecording: true })
      },
      fail: () => {
        wx.showModal({
          title: '需要录音权限',
          content: '请在设置中允许使用麦克风',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) wx.openSetting()
          }
        })
      }
    })
  },

  // 停止录音
  stopRecording() {
    if (this.data.isRecording) {
      this.recorderManager.stop()
    }
  },

  // 切换录音状态
  toggleRecording() {
    if (this.data.isRecording) {
      this.stopRecording()
    } else {
      this.startRecording()
    }
  },

  // 上传录音到云存储
  async uploadRecording(tempFilePath, duration) {
    wx.showLoading({ title: '上传录音...' })
    try {
      const openid = app.getUserInfo()?._id || 'unknown'
      const fileName = `recordings/${openid}/${this.data.chapterId}/${Date.now()}.mp3`

      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: tempFilePath
      })

      const recording = {
        fileID: uploadRes.fileID,
        duration: duration || 0,
        createdAt: new Date().toISOString()
      }

      const recordings = [...this.data.recordings, recording]
      this.setData({ recordings })

      // 自动保存
      await this.saveChapter()

      // 询问是否进行AI转文字
      this.promptTranscribe(uploadRes.fileID, recordings.length - 1)
    } catch (err) {
      console.error('上传录音失败:', err)
      wx.showToast({ title: '录音上传失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  },

  // 询问是否转文字
  promptTranscribe(fileID, index) {
    wx.showModal({
      title: '录音已保存',
      content: '是否将录音转为文字并添加到章节内容？',
      confirmText: '转文字',
      cancelText: '暂不',
      success: (res) => {
        if (res.confirm) {
          this.transcribeRecording(fileID, index)
        }
      }
    })
  },

  // 语音转文字（Web 端使用阿里云实时识别）
  async transcribeRecording(fileID, index) {
    wx.showToast({ title: '请使用网页端录音转写', icon: 'none' })
  },

  // 删除录音
  deleteRecording(e) {
    const { index } = e.currentTarget.dataset
    wx.showModal({
      title: '删除录音',
      content: '确定要删除这段录音吗？',
      success: async (res) => {
        if (res.confirm) {
          const fileID = this.data.recordings[index]?.fileID
          const recordings = this.data.recordings.filter((_, i) => i !== index)
          this.setData({ recordings })
          // 删除云存储文件
          if (fileID) {
            try {
              await wx.cloud.deleteFile({ fileList: [fileID] })
            } catch (err) {
              console.error('删除云存储文件失败:', err)
            }
          }
          this.saveChapter()
        }
      }
    })
  },

  // 播放录音
  playRecording(e) {
    const { fileid } = e.currentTarget.dataset
    wx.cloud.getTempFileURL({
      fileList: [fileid],
      success: (res) => {
        const url = res.fileList[0]?.tempFileURL
        if (url) {
          const audio = wx.createInnerAudioContext()
          audio.src = url
          audio.play()
          wx.showToast({ title: '播放中...', icon: 'none' })
        }
      }
    })
  },

  // ===== 图片功能 =====

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempFilePath)
      }
    })
  },

  // 上传图片到云存储
  async uploadImage(tempFilePath) {
    this.setData({ uploadingImage: true })
    wx.showLoading({ title: '上传图片...' })
    try {
      const openid = app.getUserInfo()?._id || 'unknown'
      const fileName = `images/${openid}/${this.data.chapterId}/${Date.now()}.jpg`

      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: tempFilePath
      })

      this.setData({ backgroundImage: uploadRes.fileID })
      await this.saveChapter()
      wx.showToast({ title: '图片已设置', icon: 'success' })
    } catch (err) {
      console.error('上传图片失败:', err)
      wx.showToast({ title: '图片上传失败', icon: 'error' })
    } finally {
      this.setData({ uploadingImage: false })
      wx.hideLoading()
    }
  },

  // ===== AI 功能 =====

  // AI文本润色
  async aiPolish() {
    if (!this.data.content || this.data.aiPolishing) return
    this.setData({ aiPolishing: true })
    wx.showLoading({ title: 'AI润色中...' })
    try {
      const result = await wx.cloud.callFunction({
        name: 'ai',
        data: { action: 'completeText', text: this.data.content, chapterTitle: this.data.chapterTitle }
      })
      const { success, data, error } = result.result
      if (!success) throw new Error(error || 'AI润色失败')
      const completedText = data.completedText

      // 显示对比，让用户确认
      wx.showModal({
        title: 'AI润色结果',
        content: completedText,
        confirmText: '使用',
        cancelText: '保留原文',
        success: (res) => {
          if (res.confirm) {
            this.setData({ content: completedText })
          }
        }
      })
    } catch (err) {
      console.error('AI润色失败:', err)
      wx.showToast({ title: err.message || 'AI润色失败', icon: 'error' })
    } finally {
      this.setData({ aiPolishing: false })
      wx.hideLoading()
    }
  },

  // 格式化录音时长
  formatDuration(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  },

  // 返回前自动保存
  onUnload() {
    if (this.data.content || this.data.recordings.length > 0) {
      this.saveChapter()
    }
  }
})
