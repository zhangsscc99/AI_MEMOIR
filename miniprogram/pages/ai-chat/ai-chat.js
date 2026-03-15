// pages/ai-chat/ai-chat.js
const app = getApp()
const { callMiniMax } = require('../../utils/minimax')

const DEFAULT_NAME = '小忆'
const DEFAULT_DESC = '我是小忆，你的AI回忆录助手。'

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    userInfo: null,
    characterName: DEFAULT_NAME,
    characterDesc: DEFAULT_DESC,
    editingName: false,
    editNameInput: '',
    scrollToView: '',
    historyLoaded: false,
    historyLoading: false
  },

  onLoad: async function() {
    var userInfo = await app.ensureUserInfo()
    this.setData({ userInfo: userInfo })

    if (userInfo) {
      await this.refreshCharacterInfo()
      await this.loadHistory()
    } else {
      if (!this.data.historyLoaded) {
        this.addMessage('assistant', '你好！我是小忆，你的AI回忆录助手。登录后我会基于你的回忆录内容与你深度交流。')
      }
    }
  },

  onShow: async function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    // 每次导航到此页面都刷新角色信息
    var userInfo = this.data.userInfo || app.getUserInfo() || await app.ensureUserInfo()
    if (userInfo) {
      if (!this.data.userInfo) this.setData({ userInfo: userInfo })
      this.refreshCharacterInfo()
      if (!this.data.historyLoaded) this.loadHistory()
    }
  },

  // 从云端恢复历史对话
  loadHistory: async function() {
    if (this.data.historyLoading) return
    this.setData({ historyLoading: true })
    try {
      var result = await wx.cloud.callFunction({
        name: 'ai',
        data: { action: 'getHistory' }
      })
      var history = result.result?.data?.history || []

      if (history.length === 0) {
        this.addMessage('assistant', '你好！我是' + this.data.characterName + '。我拥有你回忆录中记录的所有记忆，有什么想聊的吗？')
      } else {
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
    } finally {
      this.setData({ historyLoading: false })
    }
  },

  // 每次进入页面刷新角色名 + 角色简介（基于最新回忆录内容）
  refreshCharacterInfo: async function() {
    try {
      var result = await wx.cloud.callFunction({
        name: 'ai',
        data: { action: 'getMemoirSummary' }
      })
      var data = result.result && result.result.data
      if (!data || !data.hasMemoir) return

      var messages = [{ role: 'user', content: data.summary }]
      var systemPrompt = `根据以下回忆录内容，请用JSON格式输出两个字段：
1. "name"：主人公的姓名或称谓（如"张秀英"、"爷爷"、"外婆"），不超过8个字，无法确定时用"小忆"
2. "desc"：以第一人称写一段自我介绍，基于回忆录的真实内容，体现主人公的经历和性格，50字以内，不要套话

只输出JSON，不要其他内容。示例：{"name":"张秀英","desc":"我是张秀英，生于1950年代的农村，经历了许多岁月变迁，最爱和家人一起过节。"}`

      var raw = await callMiniMax(systemPrompt, messages, 200)
      var match = raw.match(/\{[\s\S]*\}/)
      if (!match) return
      var parsed = JSON.parse(match[0])
      var updates = {}
      if (parsed.name) updates.characterName = parsed.name.trim().replace(/["""''《》【】]/g, '')
      if (parsed.desc) updates.characterDesc = parsed.desc.trim()
      if (Object.keys(updates).length > 0) {
        this.setData(updates)
        if (updates.characterName && this.data.messages.length === 1) {
          var first = this.data.messages[0]
          if (first.role === 'assistant' && first.content.indexOf('我拥有你回忆录中记录的所有记忆') > -1) {
            var msg = Object.assign({}, first, {
              content: '你好！我是' + updates.characterName + '。我拥有你回忆录中记录的所有记忆，有什么想聊的吗？'
            })
            this.setData({ messages: [msg] })
          }
        }
      }
    } catch (e) {
      console.warn('刷新角色信息失败:', e)
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
      var userInfo = this.data.userInfo || app.getUserInfo()
      if (!userInfo) {
        userInfo = await app.ensureUserInfo()
        if (userInfo) this.setData({ userInfo: userInfo })
      }

      var result
      if (!userInfo) {
        result = await wx.cloud.callFunction({ name: 'ai', data: { action: 'guestChat', message: message } })
      } else {
        result = await wx.cloud.callFunction({ name: 'ai', data: { action: 'chat', message: message, characterName: this.data.characterName } })
      }

      var res = result.result
      if (!res.success) throw new Error(res.error)
      this.addMessage('assistant', res.data.response)
    } catch (err) {
      console.error('[AI聊天] 错误详情:', err && (err.message || JSON.stringify(err)))
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
        if (self.data.userInfo) {
          self.refreshCharacterInfo()
          self.loadHistory()
        } else {
          self.addMessage('assistant', '对话已清空，我们重新开始吧')
        }
      }
    })
  }
})
