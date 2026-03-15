// app.js - 小程序全局入口
App({
  onLaunch() {
    // 初始化微信云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // 填入你的云开发环境ID，在微信开发者工具 > 云开发控制台中查看
        env: 'cloud1-9gbxfuqjd1864b3c',
        traceUser: true
      })
    }

    this.globalData = {}

    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  },

  // 全局方法：获取当前用户信息
  getUserInfo() {
    return this.globalData.userInfo || null
  },

  // 全局方法：保存用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  // 静默登录，补齐本地 userInfo 缓存
  async ensureUserInfo(forceRefresh = false) {
    if (!wx.cloud) return null

    const cached = this.getUserInfo()
    if (!forceRefresh && cached && cached._id) {
      return cached
    }

    if (this.loginPromise) {
      return this.loginPromise
    }

    this.loginPromise = wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then((res) => {
      const result = res && res.result
      const user = result && result.user
      if (result && result.success && user && user._id) {
        this.setUserInfo(user)
        return user
      }
      return null
    }).catch((err) => {
      console.warn('Silent login failed:', err)
      return null
    }).finally(() => {
      this.loginPromise = null
    })

    return this.loginPromise
  },

  // 全局方法：清除用户信息（退出登录）
  clearUserInfo() {
    this.globalData.userInfo = null
    this.loginPromise = null
    wx.removeStorageSync('userInfo')
  },

  globalData: {
    userInfo: null
  }
})
