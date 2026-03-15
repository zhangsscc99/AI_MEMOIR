// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', splitLabel: ['首', '页'], icon: '/images/tab/home.png', iconActive: '/images/tab/home_active.png', iconClass: 'tab-icon-home' },
      { pagePath: '/pages/memoir/memoir', text: '回忆录', icon: '/images/tab/book.png', iconActive: '/images/tab/book_active.png', iconClass: '' },
      { pagePath: '/pages/ai-chat/ai-chat', text: 'AI聊天', icon: '/images/tab/chat.png', iconActive: '/images/tab/chat_active.png', iconClass: '' },
      { pagePath: '/pages/diary/diary', text: '随记', splitLabel: ['随', '记'], icon: '/images/tab/pencil.png', iconActive: '/images/tab/pencil_active.png', iconClass: 'tab-icon-pencil' },
      { pagePath: '/pages/profile/profile', text: '我的', splitLabel: ['我', '的'], icon: '/images/tab/person.png', iconActive: '/images/tab/person_active.png', iconClass: 'tab-icon-profile' }
    ]
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      this.setData({ selected: index })
      wx.switchTab({ url: path })
    }
  }
})
