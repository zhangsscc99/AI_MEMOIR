// pages/memoir/memoir.js
const app = getApp()

const CHAPTER_META = [
  { id: 'background',    title: '家庭背景',  num: '第一章',  desc: '记录您的出生地、家庭环境和祖辈故事', image: 'story1.png' },
  { id: 'childhood',     title: '童年时光',  num: '第二章',  desc: '分享童年的美好回忆和成长经历',       image: 'story2.png' },
  { id: 'education',     title: '求学之路',  num: '第三章',  desc: '记录您的求学历程与校园生活',         image: 'story3.png' },
  { id: 'career',        title: '职业生涯',  num: '第四章',  desc: '记录您的工作历程与职业成就',         image: 'story4.png' },
  { id: 'love',          title: '爱情故事',  num: '第五章',  desc: '记录您的爱情与婚姻故事',             image: 'story5.png' },
  { id: 'family',        title: '家庭生活',  num: '第六章',  desc: '记录家庭的温馨时光',                 image: 'story6.png' },
  { id: 'travel',        title: '旅途记忆',  num: '第七章',  desc: '记录旅行中的风景与故事',             image: 'story7.png' },
  { id: 'relationships', title: '人际关系',  num: '第八章',  desc: '记录重要的人际故事',                 image: 'story8.png' },
  { id: 'laterlife',     title: '晚年时光',  num: '第九章',  desc: '记录晚年的生活感悟',                 image: 'story9.png' },
  { id: 'wisdom',        title: '人生智慧',  num: '第十章',  desc: '分享您的人生感悟与智慧',             image: 'story10.png' }
]

const COLORS = ['#8B7355','#6B8E5E','#7B8EA0','#A07855','#8E6B7B','#5E7B8E','#8E8E5E','#7B6B8E','#6B8E8E','#8E7B6B']

Page({
  data: {
    chapterList: [],
    completedCount: 0,
    loading: true,
    showChapters: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    this.loadChapters()
  },

  toggleChapters() {
    this.setData({ showChapters: !this.data.showChapters })
  },

  async loadChapters() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'chapter', data: { action: 'getList' } })
      const saved = res.result?.data?.chapters || []
      const savedMap = {}
      saved.forEach(c => { savedMap[c.chapterId] = c })

      const chapterList = CHAPTER_META.map((meta, i) => ({
        ...meta,
        color: COLORS[i],
        wordCount: savedMap[meta.id]?.wordCount || 0,
        status: savedMap[meta.id]?.status || 'draft',
        hasContent: !!(savedMap[meta.id]?.content || savedMap[meta.id]?.recordingCount)
      }))

      const completedCount = chapterList.filter(c => c.hasContent).length
      this.setData({ chapterList, completedCount, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  goChapter(e) {
    const { id, title } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/chapter-edit/chapter-edit?chapterId=${id}&title=${encodeURIComponent(title)}` })
  },

  onPullDownRefresh() {
    this.loadChapters().then(() => wx.stopPullDownRefresh())
  }
})
