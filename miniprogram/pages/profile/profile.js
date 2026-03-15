// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
    const userInfo = app.getUserInfo()
    this.setData({ userInfo })
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearUserInfo()
          wx.switchTab({ url: '/pages/index/index' })
        }
      }
    })
  }
})
