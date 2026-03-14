// pages/ai-chat/ai-chat.js
const app = getApp()

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    userInfo: null,
    characterName: '小忆',
    characterDesc: '我是小忆，你的AI回忆录助手。我可以帮你梳理已经记录的章节、整理随记内容，还能陪你聊天，继续探索新的故事。',
    editingName: false,
    editNameInput: '',
    scrollToView: ''
  },

  onLoad: function() {
    var userInfo = app.getUserInfo()
    this.setData({ userInfo: userInfo })
    this.addMessage('assistant', '你好！我是小忆，你的AI回忆录助手。我可以帮你梳理已经记录的章节、整理随记内容，还能陪你聊天，继续探索新的故事。如果你已经准备好开始记录或提问，随时告诉我。')
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
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
    var name = this.data.editNameInput.trim() || '小忆'
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
        self.setData({ messages: [] })
        self.addMessage('assistant', '对话已清空，我们重新开始吧')
      }
    })
  }
})
