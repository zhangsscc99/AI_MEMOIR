import { apiUrl } from '@/utils/api.js';
<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">人生章节</view>
    </view>

    <!-- 页面内容 -->
    <view class="content">
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

      <!-- 章节滚动列表 -->
      <view class="chapters-section">
        <scroll-view 
          class="chapters-scroll"
          scroll-x="true"
          show-scrollbar="false"
          enable-flex="true"
        >
          <view class="chapters-container">
            <view 
              v-for="(chapter, index) in chapters" 
              :key="chapter.id"
              class="chapter-card"
              :class="{ 
                'completed': chapter.completed,
                'first': index === 0,
                'last': index === chapters.length - 1
              }"
              @click="selectChapter(chapter)"
            >
              <!-- 背景图片 -->
              <view class="chapter-bg">
                <image 
                  :src="chapter.backgroundImage" 
                  class="bg-image"
                  mode="aspectFill"
                ></image>
                <view class="bg-overlay"></view>
              </view>
              
              <!-- 章节内容 -->
              <view class="chapter-content">
                <view class="chapter-number">第{{ getChapterNumber(index) }}章</view>
                <view class="chapter-title">{{ chapter.title }}</view>
                <view class="chapter-desc">{{ chapter.description }}</view>
                
                <!-- 状态标记 -->
                <view class="chapter-status" v-if="chapter.completed">
                  <view class="status-icon">✓</view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 提示文字 -->
      <view class="tip-section">
        <text class="tip-text">左右滑动浏览章节，点击开始录制</text>
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
          backgroundImage: '/src/images/story1.png',
          completed: false
        },
        {
          id: 'childhood',
          title: '童年时光',
          description: '分享童年的美好回忆和成长经历',
          backgroundImage: '/src/images/story2.png',
          completed: false
        },
        {
          id: 'education',
          title: '求学生涯',
          description: '记录学习历程和校园生活',
          backgroundImage: '/src/images/story3.png',
          completed: false
        },
        {
          id: 'career',
          title: '职业发展',
          description: '分享工作经历和职业成就',
          backgroundImage: '/src/images/story4.png',
          completed: false
        },
        {
          id: 'love',
          title: '爱情婚姻',
          description: '记录爱情故事和婚姻生活',
          backgroundImage: '/src/images/story5.png',
          completed: false
        },
        {
          id: 'family',
          title: '为人父母',
          description: '分享育儿经历和家庭生活',
          backgroundImage: '/src/images/story6.png',
          completed: false
        },
        {
          id: 'travel',
          title: '旅行见闻',
          description: '记录旅行经历和见闻感悟',
          backgroundImage: '/src/images/story7.png',
          completed: false
        },
        {
          id: 'relationships',
          title: '人缘际遇',
          description: '记录重要的人际关系和人生际遇',
          backgroundImage: '/src/images/story8.png',
          completed: false
        },
        {
          id: 'laterlife',
          title: '晚年生活',
          description: '分享退休后的生活和晚年感悟',
          backgroundImage: '/src/images/story9.png',
          completed: false
        },
        {
          id: 'wisdom',
          title: '人生感悟',
          description: '分享人生智慧和生活哲理',
          backgroundImage: '/src/images/story10.png',
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
    // 加载用户自定义章节（diary）
    this.loadUserChapters();
  },
  onShow() {
    // 每次显示页面时重新加载用户章节，以防有新增的
    this.loadUserChapters();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    
    selectChapter(chapter) {
      if (chapter.isDiary) {
        // 如果是diary章节，跳转到diary编辑页面
        uni.navigateTo({
          url: `/pages/diary/edit?chapterId=${chapter.id}&title=${encodeURIComponent(chapter.title)}&mode=edit`
        });
      } else {
        // 如果是固定章节，跳转到录制页面
        uni.navigateTo({
          url: `/pages/recording/index?chapterId=${chapter.id}&title=${encodeURIComponent(chapter.title)}`
        });
      }
    },
    
    getChapterNumber(index) {
      const numbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      return numbers[index] || (index + 1);
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
    },
    
    async loadUserChapters() {
      try {
        console.log('🔄 开始加载用户章节...');
        
        // 检查用户登录状态
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('❌ 未登录，跳过加载用户章节');
          return;
        }
        
        // 从后端获取用户章节
        const response = await uni.request({
          url: apiUrl('/chapters'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 用户章节响应:', response);
        
        if (response.statusCode === 200 && response.data.success) {
          const responseData = response.data.data || {};
          const userChapters = responseData.chapters || [];
          console.log('📚 获取到用户章节:', userChapters);
          
          // 过滤出diary章节
          const diaryChapters = userChapters.filter(chapter => 
            chapter.chapterId && chapter.chapterId.startsWith('diary_')
          );
          
          console.log('📖 过滤出的diary章节:', diaryChapters);
          
          // 移除之前加载的diary章节（避免重复）
          this.chapters = this.chapters.filter(chapter => 
            !chapter.id.startsWith('diary_')
          );
          
          // 将diary章节转换为章节页面需要的格式并添加到列表
          diaryChapters.forEach(diaryChapter => {
            const chapterData = {
              id: diaryChapter.chapterId,
              title: diaryChapter.title || '随记',
              description: diaryChapter.content ? 
                (diaryChapter.content.length > 20 ? 
                  diaryChapter.content.substring(0, 20) + '...' : 
                  diaryChapter.content) : '暂无内容',
              backgroundImage: diaryChapter.backgroundImage && !diaryChapter.backgroundImage.startsWith('blob:') ? diaryChapter.backgroundImage : '/src/images/default-diary.svg',
              completed: diaryChapter.status === 'completed',
              isDiary: true // 标记为diary章节
            };
            
            this.chapters.push(chapterData);
          });
          
          console.log('✅ 用户章节加载完成，当前章节总数:', this.chapters.length);
        } else {
          console.log('❌ 获取用户章节失败:', response.data);
        }
      } catch (error) {
        console.error('❌ 加载用户章节出错:', error);
      }
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.nav-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 20px;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
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
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 2px;
}

.content {
  padding: 20px 0;
}

/* 统计信息 */
.stats-section {
  margin: 0 20px 30px 20px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
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

/* 章节滚动区域 */
.chapters-section {
  margin-bottom: 30px;
}

.chapters-scroll {
  width: 100%;
  height: 400px;
}

.chapters-container {
  display: flex;
  padding: 0 20px;
  gap: 20px;
  align-items: center;
}

/* 章节卡片 */
.chapter-card {
  position: relative;
  width: 280px;
  height: 360px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  flex-shrink: 0;
}

.chapter-card:active {
  transform: scale(0.95);
}

.chapter-card.completed {
  box-shadow: 0 15px 35px rgba(76, 175, 80, 0.3);
}

.chapter-card.first {
  margin-left: 0;
}

.chapter-card.last {
  margin-right: 20px;
}

/* 背景图片 */
.chapter-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.1) 40%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

/* 章节内容 */
.chapter-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: white;
}

.chapter-number {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 1px;
}

.chapter-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.chapter-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 完成状态标记 */
.chapter-status {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 3;
}

.status-icon {
  width: 36px;
  height: 36px;
  background: #4CAF50;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

/* 提示文字 */
.tip-section {
  text-align: center;
  padding: 0 20px;
  margin-bottom: 40px;
}

.tip-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  font-family: system-ui, -apple-system, sans-serif;
}

/* 移动端适配 */
@media (max-width: 375px) {
  .nav-header {
    padding: 15px;
  }
  
  .stats-section {
    margin: 0 15px 25px 15px;
  }
  
  .stats-card {
    padding: 20px;
  }
  
  .chapters-container {
    padding: 0 15px;
    gap: 15px;
  }
  
  .chapter-card {
    width: 250px;
    height: 320px;
  }
  
  .chapter-content {
    padding: 20px 16px;
  }
  
  .chapter-title {
    font-size: 20px;
  }
  
  .tip-section {
    padding: 0 15px;
  }
}

/* 滚动条隐藏 */
.chapters-scroll::-webkit-scrollbar {
  display: none;
}

.chapters-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>
