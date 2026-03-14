// pages/memoir/memoir.js
const app = getApp()

Page({
  data: {},

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  goChapters() {
    wx.navigateTo({ url: '/pages/chapters/chapters' })
  }
})
