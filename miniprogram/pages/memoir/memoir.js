// pages/memoir/memoir.js
const app = getApp()
const { IMAGE_BASE } = require('../../config/index')

Page({
  data: {
    imageBase: IMAGE_BASE
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  goChapters() {
    wx.navigateTo({ url: '/pages/chapters/chapters' })
  }
})
