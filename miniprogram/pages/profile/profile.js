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

  changeAvatar() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' })
        try {
          const fileName = `avatars/${this.data.userInfo._id}/${Date.now()}.jpg`
          const uploadRes = await wx.cloud.uploadFile({ cloudPath: fileName, filePath: res.tempFiles[0].tempFilePath })
          const db = wx.cloud.database()
          await db.collection('users').doc(this.data.userInfo._id).update({ data: { avatar: uploadRes.fileID } })
          const updatedUser = { ...this.data.userInfo, avatar: uploadRes.fileID }
          app.setUserInfo(updatedUser)
          this.setData({ userInfo: updatedUser })
          wx.showToast({ title: '头像已更新', icon: 'success' })
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'error' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },

  goShopping() { wx.showToast({ title: '功能开发中', icon: 'none' }) },
  goOrders() { wx.showToast({ title: '功能开发中', icon: 'none' }) },
  goSupport() { wx.showToast({ title: '功能开发中', icon: 'none' }) },
  goFeedback() { wx.showToast({ title: '功能开发中', icon: 'none' }) },
  goShare() {
    wx.showShareMenu({ withShareTicket: true })
    wx.showToast({ title: '请点击右上角分享', icon: 'none' })
  },
  goBusiness() { wx.showToast({ title: '功能开发中', icon: 'none' }) },

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
