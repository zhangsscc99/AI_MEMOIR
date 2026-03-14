// pages/ai-chat/ai-chat.js
const app = getApp()

const DEFAULT_NAME = '小忆'
const STORAGE_KEY_NAME = 'aiCharName'
const STORAGE_KEY_CUSTOM = 'aiCharNameCustom'

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    userInfo: null,
    characterName: DEFAULT_NAME,
    characterDesc: '我是小忆，你的AI回忆录助手。我可以帮你梳理已经记录的章节、整理随记内容，还能陪你聊天，继续探索新的故事。',
    editingName: false,
    editNameInput: '',
    scrollToView: '',
    historyLoaded: false
  },

  onLoad: async function() {
    var userInfo = app.getUserInfo()
    this.setData({ userInfo: userInfo })

    // 加载持久化的角色名
    var savedName = wx.getStorageSync(STORAGE_KEY_NAME)
    if (savedName) {
      this.setData({ characterName: savedName })
    }

    if (userInfo) {
      // 恢复历史对话
      await this.loadHistory()
      // 若无手动设置的名字，尝试从回忆录自动提取
      if (!wx.getStorageSync(STORAGE_KEY_CUSTOM)) {
        this.fetchCharacterName()
      }
    } else {
      if (!this.data.historyLoaded) {
        this.addMessage('assistant', '你好！我是小忆，你的AI回忆录助手。登录后我会基于你的回忆录内容与你深度交流。')
      }
    }
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  // 从云端恢复历史对话
  loadHistory: async function() {
    try {
      var result = await wx.cloud.callFunction({
        name: 'ai',
        data: { action: 'getHistory' }
      })
      var history = result.result?.data?.history || []

      if (history.length === 0) {
        // 无历史记录，显示欢迎语
        this.addMessage('assistant', '你好！我是' + this.data.characterName + '。我拥有你回忆录中记录的所有记忆，有什么想聊的吗？')
      } else {
        // 恢复历史消息（最近20条）
        var messages = history.map(function(h, i) {
          return {
            id: 'msg_' + i,
            role: h.role,
            content: h.content,
            time: '历史消息'
          }
        })
        var lastId = messages[messages.length - 1].id
        this.setData({ messages: messages, scrollToView: lastId })
      }
      this.setData({ historyLoaded: true })
    } catch (e) {
      this.addMessage('assistant', '你好！我是' + this.data.characterName + '。有什么想聊的吗？')
      this.setData({ historyLoaded: true })
    }
  },

  // 从回忆录自动提取角色名（不影响 UI 加载速度，静默执行）
  fetchCharacterName: async function() {
    try {
      var result = await wx.cloud.callFunction({
        name: 'ai',
        data: { action: 'getCharacterName' }
      })
      var name = result.result?.data?.name
      if (name && name !== DEFAULT_NAME && name.length <= 8) {
        wx.setStorageSync(STORAGE_KEY_NAME, name)
        this.setData({ characterName: name })
      }
    } catch (e) {}
  },

  onInput: function(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMessage: async function() {
    var message = this.data.inputText.trim()
    if (!message || this.data.loading) return

    this.setData({ inputText: '' })
    this.addMessage('user', message)
    this.setData({ loading: true })

    try {
      var userInfo = this.data.userInfo
      var result
      if (!userInfo) {
        result = await wx.cloud.callFunction({
          name: 'ai',
          data: { action: 'guestChat', message: message }
        })
      } else {
        result = await wx.cloud.callFunction({
          name: 'ai',
          data: { action: 'chat', message: message, characterName: this.data.characterName }
        })
      }

      var res = result.result
      if (!res.success) throw new Error(res.error)
      this.addMessage('assistant', res.data.response)
    } catch (err) {
      this.addMessage('assistant', '抱歉，我现在无法回复，请稍后再试。')
    } finally {
      this.setData({ loading: false })
    }
  },

  addMessage: function(role, content) {
    var now = new Date()
    var timeStr = this.formatTime(now)
    var id = 'msg_' + Date.now()
    var messages = this.data.messages.concat([{ id: id, role: role, content: content, time: timeStr }])
    this.setData({ messages: messages, scrollToView: id })
  },

  formatTime: function(d) {
    var now = new Date()
    var diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    return (d.getHours().toString().padStart(2, '0')) + ':' + (d.getMinutes().toString().padStart(2, '0'))
  },

  startEditName: function() {
    this.setData({ editingName: true, editNameInput: this.data.characterName })
  },

  onEditNameInput: function(e) {
    this.setData({ editNameInput: e.detail.value })
  },

  saveEditName: function() {
    var name = this.data.editNameInput.trim() || DEFAULT_NAME
    // 持久化到 storage，并标记为手动设置
    wx.setStorageSync(STORAGE_KEY_NAME, name)
    wx.setStorageSync(STORAGE_KEY_CUSTOM, true)
    this.setData({ characterName: name, editingName: false })
  },

  clearHistory: function() {
    var self = this
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: function(res) {
        if (!res.confirm) return
        if (self.data.userInfo) {
          wx.cloud.callFunction({ name: 'ai', data: { action: 'clearHistory' } })
        }
        self.setData({ messages: [], historyLoaded: false })
        self.addMessage('assistant', '对话已清空，我们重新开始吧')
      }
    })
  }
})
