// pages/index/index.js
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

// 章节配色（模拟原版背景图效果）
const CHAPTER_COLORS = [
  '#8B7355', '#6B8E5E', '#7B8EA0', '#A07855',
  '#8E6B7B', '#5E7B8E', '#8E8E5E', '#7B6B8E',
  '#6B8E8E', '#8E7B6B'
]

Page({
  data: {
    userInfo: null,
    chapters: [],
    chapterList: CHAPTER_META,
    chapterColors: CHAPTER_COLORS,
    totalAnswered: 0,
    loading: true,
    diaries: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.loadData()
  },

  async loadData() {
    try {
      // 并行加载章节和随记
      const [chapterRes, diaryRes] = await Promise.all([
        wx.cloud.callFunction({ name: 'chapter', data: { action: 'getList' } }),
        wx.cloud.database().collection('diaries')
          .where({ openid: this.data.userInfo._id })
          .orderBy('diary_date', 'desc').limit(3).get()
          .catch(() => ({ data: [] }))
      ])

      const saved = chapterRes.result?.data?.chapters || []
      const savedMap = {}
      saved.forEach(c => { savedMap[c.chapterId] = c })

      const chapterList = CHAPTER_META.map((meta, idx) => ({
        ...meta,
        color: CHAPTER_COLORS[idx],
        wordCount: savedMap[meta.id]?.wordCount || 0,
        status: savedMap[meta.id]?.status || 'draft',
        hasContent: !!(savedMap[meta.id]?.content || savedMap[meta.id]?.recordingCount)
      }))

      const totalAnswered = chapterList.filter(c => c.hasContent).length
      const diaries = diaryRes.data || []

      this.setData({ chapterList, totalAnswered, diaries, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  goStartRecord() {
    wx.switchTab({ url: '/pages/memoir/memoir' })
  },

  goNewDiary() {
    wx.navigateTo({ url: '/pages/diary-edit/diary-edit' })
  },

  goDiary() {
    wx.switchTab({ url: '/pages/diary/diary' })
  },

  goChapter(e) {
    const { id, title } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/chapter-edit/chapter-edit?chapterId=${id}&title=${encodeURIComponent(title)}`
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh())
  }
})
