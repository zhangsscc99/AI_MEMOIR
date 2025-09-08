<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">选择章节</view>
    </view>

    <!-- 页面内容 -->
    <view class="content">
      <view class="intro-section">
        <image src="/src/images/memoirbook.png" class="book-image"></image>
        <view class="intro-text">
          <text class="main-text">开始您的回忆之旅</text>
          <text class="sub-text">选择一个章节开始记录人生故事</text>
        </view>
      </view>

      <!-- 章节列表 -->
      <view class="chapters-section">
        <view class="section-title">人生章节</view>
        
        <view class="chapters-grid">
          <view 
            v-for="chapter in chapters" 
            :key="chapter.id"
            class="chapter-card"
            :class="{ 'completed': chapter.completed }"
            @click="selectChapter(chapter)"
          >
            <view class="chapter-icon">
              <image :src="chapter.icon" class="icon-image"></image>
            </view>
            <view class="chapter-info">
              <text class="chapter-title">{{ chapter.title }}</text>
              <text class="chapter-desc">{{ chapter.description }}</text>
              <view class="chapter-status">
                <text v-if="chapter.completed" class="status-text completed">已完成</text>
                <text v-else class="status-text">待录制</text>
              </view>
            </view>
            <view class="chapter-arrow">
              <text class="arrow-icon">→</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="stats-section">
        <view class="stats-card">
          <view class="stat-item">
            <text class="stat-number">{{ completedCount }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-number">{{ totalChapters }}</text>
            <text class="stat-label">总章节</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      chapters: [
        {
          id: 'background',
          title: '家庭背景',
          description: '记录您的出生地、家庭环境和祖辈故事',
          icon: '/static/icons/home.svg',
          completed: false
        },
        {
          id: 'childhood',
          title: '童年时光',
          description: '分享童年的美好回忆和成长经历',
          icon: '/static/icons/child.svg',
          completed: false
        },
        {
          id: 'education',
          title: '求学生涯',
          description: '记录学习历程和校园生活',
          icon: '/static/icons/education.svg',
          completed: false
        },
        {
          id: 'career',
          title: '职业发展',
          description: '分享工作经历和职业成就',
          icon: '/static/icons/career.svg',
          completed: false
        },
        {
          id: 'love',
          title: '爱情婚姻',
          description: '记录爱情故事和婚姻生活',
          icon: '/static/icons/love.svg',
          completed: false
        },
        {
          id: 'family',
          title: '为人父母',
          description: '分享育儿经历和家庭生活',
          icon: '/static/icons/family.svg',
          completed: false
        },
        {
          id: 'travel',
          title: '旅行见闻',
          description: '记录旅行经历和见闻感悟',
          icon: '/static/icons/travel.svg',
          completed: false
        },
        {
          id: 'relationships',
          title: '人缘际遇',
          description: '记录重要的人际关系和人生际遇',
          icon: '/static/icons/relationships.svg',
          completed: false
        },
        {
          id: 'laterlife',
          title: '晚年生活',
          description: '分享退休后的生活和晚年感悟',
          icon: '/static/icons/laterlife.svg',
          completed: false
        },
        {
          id: 'wisdom',
          title: '人生感悟',
          description: '分享人生智慧和生活哲理',
          icon: '/static/icons/wisdom.svg',
          completed: false
        }
      ]
    }
  },
  computed: {
    completedCount() {
      return this.chapters.filter(chapter => chapter.completed).length;
    },
    totalChapters() {
      return this.chapters.length;
    }
  },
  onLoad() {
    // 从本地存储加载章节完成状态
    this.loadChapterStatus();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    selectChapter(chapter) {
      // 跳转到录制页面
      uni.navigateTo({
        url: `/pages/recording/index?chapterId=${chapter.id}&title=${encodeURIComponent(chapter.title)}`
      });
    },
    
    loadChapterStatus() {
      try {
        const savedStatus = uni.getStorageSync('chapter_status');
        if (savedStatus) {
          const statusMap = JSON.parse(savedStatus);
          this.chapters.forEach(chapter => {
            if (statusMap[chapter.id]) {
              chapter.completed = statusMap[chapter.id].completed || false;
            }
          });
        }
      } catch (error) {
        console.log('加载章节状态失败:', error);
      }
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.nav-header {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-btn {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.back-btn:active {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}

.back-icon {
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.content {
  padding: 0 20px;
}

.intro-section {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  margin: 20px 0;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.book-image {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.main-text {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 2px;
}

.sub-text {
  display: block;
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 1px;
}

.chapters-section {
  margin: 20px 0;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-left: 4px;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 2px;
}

.chapters-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.chapter-card:active {
  transform: scale(0.98);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.chapter-card.completed {
  border: 2px solid #4CAF50;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
}

.chapter-icon {
  width: 50px;
  height: 50px;
  background: #f0f0f0;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.icon-image {
  width: 24px;
  height: 24px;
}

.chapter-info {
  flex: 1;
}

.chapter-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 1px;
}

.chapter-desc {
  display: block;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8px;
}

.chapter-status {
  margin-top: 8px;
}

.status-text {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #666;
}

.status-text.completed {
  background: #e8f5e8;
  color: #4CAF50;
}

.chapter-arrow {
  margin-left: 16px;
}

.arrow-icon {
  font-size: 18px;
  color: #ccc;
}

.stats-section {
  margin: 20px 0 40px 0;
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
  font-family: "SF Pro Display", "Helvetica Neue", "Segoe UI", "Roboto", "Inter", "system-ui", -apple-system, sans-serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 1px;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e0e0e0;
  margin: 0 20px;
}

/* 移动端适配 */
@media (max-width: 375px) {
  .nav-header {
    padding: 15px;
  }
  
  .content {
    padding: 0 15px;
  }
  
  .intro-section {
    padding: 25px 15px;
  }
  
  .chapter-card {
    padding: 16px;
  }
  
  .chapter-icon {
    width: 44px;
    height: 44px;
    margin-right: 12px;
  }
  
  .icon-image {
    width: 20px;
    height: 20px;
  }
}
</style>
