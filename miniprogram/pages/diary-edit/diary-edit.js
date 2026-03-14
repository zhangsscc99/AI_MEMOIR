// pages/diary-edit/diary-edit.js - 随记编辑页
const app = getApp()

const MOODS = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'sad', emoji: '😢', label: '难过' },
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'grateful', emoji: '🙏', label: '感恩' },
  { value: 'nostalgia', emoji: '🥹', label: '怀念' }
]

Page({
  data: {
    id: null,
    title: '',
    content: '',
    mood: 'calm',
    tags: [],
    images: [],
    tagInput: '',
    moods: MOODS,
    selectedMoodIdx: 1,
    saving: false,
    aiPolishing: false,
    isSample: false,
    isRecording: false,
    recordingDuration: 0,
    pageTitle: '新随记',
    statusBarHeight: 0
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    let pageTitle = '新随记'
    if (options.id === 'sample_1') {
      pageTitle = '示例随记'
    } else if (options.id) {
      pageTitle = '编辑随记'
    }
    this.setData({ statusBarHeight: sysInfo.statusBarHeight, pageTitle })

    if (options.id) {
      this.setData({ id: options.id })
      if (options.id === 'sample_1') {
        this.loadSampleDiary()
      } else {
        this.loadDiary(options.id)
      }
    }
    this.recorderManager = wx.getRecorderManager()
    this.setupRecorder()
  },

  goBack() {
    wx.navigateBack()
  },

  // 加载示例随记（只读展示）
  loadSampleDiary() {
    this.setData({
      title: '春节舞狮子',
      content: '舞狮子是中国传统民间艺术，在春节期间尤为盛行。狮子象征着威武和吉祥，舞狮表演寓意驱邪避害、祈求平安。表演者需要配合默契，通过精湛的技艺展现狮子的威武和灵动，为节日增添喜庆氛围。',
      images: ['/images/lion.png'],
      mood: 'happy',
      selectedMoodIdx: 0,
      isSample: true
    })
    wx.setNavigationBarTitle({ title: '示例随记' })
  },

  onUnload() {
    if (this.data.isRecording) this.recorderManager.stop()
  },

  // 加载已有随记
  async loadDiary(id) {
    wx.showLoading({ title: '加载中...' })
    try {
      const db = wx.cloud.database()
      const res = await db.collection('diaries').doc(id).get()
      const d = res.data

      const moodIdx = MOODS.findIndex(m => m.value === d.mood)
      this.setData({
        title: d.title || '',
        content: d.content || '',
        mood: d.mood || 'calm',
        tags: d.tags || [],
        images: d.images || [],
        selectedMoodIdx: moodIdx >= 0 ? moodIdx : 1
      })
    } catch (err) {
      console.error('加载随记失败:', err)
      wx.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }) },
  onContentInput(e) { this.setData({ content: e.detail.value }) },
  onTagInput(e) { this.setData({ tagInput: e.detail.value }) },

  // 选择心情
  selectMood(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({
      selectedMoodIdx: idx,
      mood: MOODS[idx].value
    })
  },

  // 添加标签
  addTag() {
    const tag = this.data.tagInput.trim()
    if (!tag || this.data.tags.length >= 5) return
    if (!this.data.tags.includes(tag)) {
      this.setData({
        tags: [...this.data.tags, tag],
        tagInput: ''
      })
    }
  },

  // 删除标签
  removeTag(e) {
    const idx = e.currentTarget.dataset.index
    const tags = this.data.tags.filter((_, i) => i !== idx)
    this.setData({ tags })
  },

  // 选择图片
  chooseImages() {
    const remaining = 9 - this.data.images.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多9张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' })
        try {
          const openid = app.getUserInfo()?._id || 'unknown'
          const uploadPromises = res.tempFiles.map(async (file) => {
            const fileName = `diary-images/${openid}/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.jpg`
            const uploadRes = await wx.cloud.uploadFile({
              cloudPath: fileName,
              filePath: file.tempFilePath
            })
            return uploadRes.fileID
          })

          const fileIDs = await Promise.all(uploadPromises)
          this.setData({ images: [...this.data.images, ...fileIDs] })
        } catch (err) {
          console.error('上传图片失败:', err)
          wx.showToast({ title: '图片上传失败', icon: 'error' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },

  // 删除图片
  removeImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== idx)
    this.setData({ images })
  },

  // 录音相关
  setupRecorder() {
    const rm = this.recorderManager

    rm.onStart(() => {
      let duration = 0
      const timer = setInterval(() => {
        duration++
        this.setData({ recordingDuration: duration })
        if (duration >= 120) this.stopRecording()
      }, 1000)
      this.recordingTimer = timer
    })

    rm.onStop(async (res) => {
      clearInterval(this.recordingTimer)
      this.setData({ isRecording: false, recordingDuration: 0 })

      if (res.tempFilePath) {
        await this.transcribeAndAppend(res.tempFilePath)
      }
    })

    rm.onError(() => {
      clearInterval(this.recordingTimer)
      this.setData({ isRecording: false, recordingDuration: 0 })
      wx.showToast({ title: '录音失败', icon: 'error' })
    })
  },

  toggleRecording() {
    if (this.data.isRecording) {
      this.recorderManager.stop()
    } else {
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          this.recorderManager.start({
            duration: 120000,
            sampleRate: 16000,
            numberOfChannels: 1,
            format: 'mp3'
          })
          this.setData({ isRecording: true })
        },
        fail: () => {
          wx.showModal({
            title: '需要录音权限',
            content: '请在设置中允许使用麦克风',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting() }
          })
        }
      })
    }
  },

  // 语音转文字后追加到内容
  async transcribeAndAppend(tempFilePath) {
    wx.showLoading({ title: 'AI转文字...' })
    try {
      const downloadRes = await new Promise((resolve, reject) => {
        wx.downloadFile({ url: tempFilePath, success: resolve, fail: reject })
      }).catch(() => ({ tempFilePath }))

      const fs = wx.getFileSystemManager()
      const audioBase64 = fs.readFileSync(downloadRes.tempFilePath || tempFilePath, 'base64')

      const result = await wx.cloud.callFunction({
        name: 'speech',
        data: { action: 'transcribeBaidu', audioBase64, format: 'mp3', rate: 16000 }
      })

      const { success, data } = result.result
      if (success && data?.text) {
        const newContent = this.data.content
          ? this.data.content + '\n' + data.text
          : data.text
        this.setData({ content: newContent })
        wx.showToast({ title: '转文字成功', icon: 'success' })
      } else {
        wx.showToast({ title: '转文字失败', icon: 'error' })
      }
    } catch (err) {
      console.error('语音转文字失败:', err)
      wx.showToast({ title: '转文字失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  },

  // AI润色
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
          chapterTitle: this.data.title || '随记'
        }
      })

      const { success, data, error } = result.result
      if (!success) throw new Error(error || 'AI润色失败')

      wx.showModal({
        title: 'AI润色结果',
        content: data.completedText,
        confirmText: '使用',
        cancelText: '保留原文',
        success: (res) => {
          if (res.confirm) this.setData({ content: data.completedText })
        }
      })
    } catch (err) {
      wx.showToast({ title: err.message || 'AI润色失败', icon: 'error' })
    } finally {
      this.setData({ aiPolishing: false })
      wx.hideLoading()
    }
  },

  // 保存随记
  async saveDiary() {
    if (this.data.isSample) {
      wx.showToast({ title: '这是示例随记，无法保存', icon: 'none' })
      return
    }
    if (this.data.saving) return
    if (!this.data.title && !this.data.content) {
      wx.showToast({ title: '请填写标题或内容', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      const db = wx.cloud.database()
      const openid = app.getUserInfo()?._id
      const diaryData = {
        openid,
        title: this.data.title || '无标题',
        content: this.data.content,
        mood: this.data.mood,
        tags: this.data.tags,
        images: this.data.images,
        diary_date: new Date().toISOString(),
        updated_at: db.serverDate()
      }

      if (this.data.id) {
        // 更新
        await db.collection('diaries').doc(this.data.id).update({ data: diaryData })
      } else {
        // 新建
        await db.collection('diaries').add({
          data: { ...diaryData, created_at: db.serverDate() }
        })
      }

      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      console.error('保存随记失败:', err)
      wx.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      this.setData({ saving: false })
    }
  },

  // 格式化录音时间
  formatDuration(s) {
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }
})
