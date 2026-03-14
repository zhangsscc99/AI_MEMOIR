// pages/diary/diary.js
const app = getApp()

Page({
  data: {
    diaries: [],
    loading: true,
    activeMenu: null  // 显示操作菜单的项目id
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.loadDiaries()
  },

  async loadDiaries() {
    this.setData({ loading: true })
    try {
      const db = wx.cloud.database()
      // 微信云 DB 自动按 _openid 过滤，直接查即可，无需手动 where(openid)
      const res = await db.collection('diaries')
        .orderBy('diary_date', 'desc')
        .limit(50)
        .get()
      const diaries = res.data.map(d => ({
        _id: d._id,
        title: d.title || '无标题',
        firstImage: (d.images || [])[0] || null,
        dateStr: formatDateStr(d.diary_date),
        content: d.content || ''
      }))

      // 始终在末尾追加示例条目
      diaries.push({
        _id: 'sample_1',
        title: '示例：春节福字的故事',
        firstImage: '/images/lion.png',
        dateStr: '2025/08/25',
        content: '',
        isSample: true
      })

      this.setData({ diaries })
    } catch (e) {
      // 加载失败也显示示例
      this.setData({
        diaries: [{
          _id: 'sample_1',
          title: '示例：春节福字的故事',
          firstImage: '/images/lion.png',
          dateStr: '2025/08/25',
          content: '',
          isSample: true
        }]
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  goNewDiary() {
    wx.navigateTo({ url: '/pages/diary-edit/diary-edit' })
  },

  openDiary(e) {
    const { id, sample } = e.currentTarget.dataset
    if (sample) {
      wx.navigateTo({ url: `/pages/diary-edit/diary-edit?id=sample_1&sample=1` })
      return
    }
    wx.navigateTo({ url: `/pages/diary-edit/diary-edit?id=${id}` })
  },

  editDiary(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ activeMenu: null })
    wx.navigateTo({ url: `/pages/diary-edit/diary-edit?id=${id}` })
  },

  toggleMenu(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ activeMenu: this.data.activeMenu === id ? null : id })
  },

  deleteDiary(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ activeMenu: null })
    wx.showModal({
      title: '删除随记',
      content: '确定要删除这篇随记吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await wx.cloud.database().collection('diaries').doc(id).remove()
          this.setData({ diaries: this.data.diaries.filter(d => d._id !== id) })
          wx.showToast({ title: '已删除', icon: 'success' })
        } catch (e) {
          wx.showToast({ title: '删除失败', icon: 'error' })
        }
      }
    })
  },

  hideMenu() {
    if (this.data.activeMenu) this.setData({ activeMenu: null })
  },

  onPullDownRefresh() {
    this.loadDiaries().then(() => wx.stopPullDownRefresh())
  }
})

function formatDateStr(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}
