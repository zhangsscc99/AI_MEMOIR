// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index',     text: '首页',   icon: '/images/tab/home.png',    iconActive: '/images/tab/home_active.png' },
      { pagePath: '/pages/memoir/memoir',   text: '回忆录', icon: '/images/tab/book.png',    iconActive: '/images/tab/book_active.png' },
      { pagePath: '/pages/ai-chat/ai-chat', text: 'AI聊天', icon: '/images/tab/chat.png',    iconActive: '/images/tab/chat_active.png' },
      { pagePath: '/pages/diary/diary',     text: '随记',   icon: '/images/tab/pencil.png',  iconActive: '/images/tab/pencil_active.png' },
      { pagePath: '/pages/profile/profile', text: '我的',   icon: '/images/tab/person.png',  iconActive: '/images/tab/person_active.png' }
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
