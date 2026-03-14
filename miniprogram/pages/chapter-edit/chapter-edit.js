// pages/chapter-edit/chapter-edit.js - 章节编辑页
const app = getApp()

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
    // 录音相关
    isRecording: false,
    recordingDuration: 0,
    recordingTimer: null,
    // AI相关
    aiPolishing: false,
    // 图片上传
    uploadingImage: false
  },

  onLoad(options) {
    const { chapterId, title } = options
    this.setData({
      chapterId,
      chapterTitle: decodeURIComponent(title || '章节')
    })
    // 初始化录音管理器
    this.recorderManager = wx.getRecorderManager()
    this.setupRecorder()
    // 加载已有内容
    this.loadChapter()
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

  // 语音转文字
  async transcribeRecording(fileID, index) {
    wx.showLoading({ title: 'AI转文字中...' })
    try {
      // 获取临时下载链接
      const fileRes = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      })

      const audioUrl = fileRes.fileList[0]?.tempFileURL
      if (!audioUrl) throw new Error('获取音频链接失败')

      // 下载音频文件转base64（小程序环境下）
      const downloadRes = await new Promise((resolve, reject) => {
        wx.downloadFile({
          url: audioUrl,
          success: resolve,
          fail: reject
        })
      })

      // 读取文件为base64
      const fs = wx.getFileSystemManager()
      const audioBase64 = fs.readFileSync(downloadRes.tempFilePath, 'base64')

      // 调用speech云函数
      const result = await wx.cloud.callFunction({
        name: 'speech',
        data: {
          action: 'transcribeBaidu',
          audioBase64,
          format: 'mp3',
          rate: 16000
        }
      })

      const { success, data, error } = result.result
      if (!success) throw new Error(error || '转文字失败')

      const transcribedText = data.text
      if (transcribedText) {
        // 追加到内容
        const newContent = this.data.content
          ? this.data.content + '\n\n' + transcribedText
          : transcribedText

        this.setData({ content: newContent })
        wx.showToast({ title: '转文字成功', icon: 'success' })
      }
    } catch (err) {
      console.error('转文字失败:', err)
      wx.showToast({ title: '转文字失败，请重试', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
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
        data: {
          action: 'completeText',
          text: this.data.content,
          chapterTitle: this.data.chapterTitle
        }
      })

      const { success, data, error } = result.result
      if (!success) throw new Error(error || 'AI润色失败')

      // 显示对比，让用户确认
      wx.showModal({
        title: 'AI润色结果',
        content: data.completedText,
        confirmText: '使用',
        cancelText: '保留原文',
        success: (res) => {
          if (res.confirm) {
            this.setData({ content: data.completedText })
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
