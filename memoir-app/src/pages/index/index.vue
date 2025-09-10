<template>
  <view class="container">
    <!-- 回忆录工坊卡片 -->
    <view class="memoir-card" @click="goToMemoir">
      <view class="memoir-card-left">
        <image 
          :src="getOptimalImagePath('/src/images/memoirbook.png')" 
          class="book-cover" 
          mode="aspectFit"
        />
      </view>
      <view class="memoir-card-right">
        <view class="memoir-content">
          <view class="memoir-title">回忆录</view>
          <view class="memoir-subtitle">记录您的人生故事</view>
          <view class="memoir-progress">
            <text class="progress-text">0/36</text>
            <text class="progress-label">已录制</text>
          </view>
          <view class="progress-bar">
            <view class="progress-fill" :style="{width: progressPercent + '%'}"></view>
          </view>
        </view>
        <button class="start-btn" @click="goToChapters">开始录制</button>
      </view>
    </view>

    <!-- 随记卡片 -->
    <view class="diary-card" @click="goToDiary">
      <image 
        :src="getOptimalImagePath('/src/images/winter.png')" 
        class="diary-bg" 
        mode="aspectFill"
      />
      <view class="diary-overlay">
        <view class="diary-title">随记</view>
        <view class="diary-subtitle">记录照片里的故事，随手写下生活点滴<br/>轻松导入回忆录</view>
      </view>
    </view>

    <!-- 章节预览 -->
    <view class="section-preview">
      <view class="section-title">章节预览</view>
      
      <!-- 章节滚动卡片 -->
      <scroll-view 
        class="chapters-scroll"
        scroll-x="true"
        show-scrollbar="false"
        enable-flex="true"
      >
        <view class="chapters-container">
          <view 
            v-for="(chapter, index) in allChapters" 
            :key="chapter.id"
            class="chapter-preview-card"
            :class="{ 
              'completed': chapter.completed,
              'first': index === 0,
              'last': index === allChapters.length - 1
            }"
            @click="goToChapter(chapter)"
          >
            <!-- 背景图片 -->
            <view class="card-bg">
              <image 
                :src="getOptimalImagePath(chapter.backgroundImage)" 
                class="bg-image"
                mode="aspectFill"
              ></image>
              <view class="bg-overlay"></view>
            </view>
            
            <!-- 章节内容 -->
            <view class="card-content">
              <view class="chapter-number">第{{ getChapterNumber(index) }}章</view>
              <view class="chapter-title">{{ chapter.title }}</view>
              <view class="chapter-subtitle">{{ chapter.description }}</view>
              
              <!-- 状态标记 -->
              <view class="completion-status" v-if="chapter.completed">
                <view class="status-icon">✓</view>
                <text class="status-text">已完成</text>
              </view>
              <view class="completion-status not-started" v-else>
                <view class="status-icon">◯</view>
                <text class="status-text">未开始</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      
      <!-- 提示文字 -->
      <view class="scroll-tip">
        <text class="tip-text">左右滑动浏览章节</text>
      </view>
    </view>
  </view>
</template>

<script>
// 导入 API 配置工具
import { apiUrl } from '@/utils/apiConfig.js';

// 导入图片预加载工具
import imagePreloader from '@/utils/imagePreloader.js';
// 导入图片路径优化工具
import { getOptimalImagePath } from '@/utils/imageMapping.js';
export default {
  components: {
    LazyImage: () => import('@/components/LazyImage.vue')
  },
  data() {
    return {
      progressPercent: 0,
      totalChapters: 10,
      completedChapters: [],
      allChapters: [
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
  onLoad() {
    this.loadChapterData();
    this.loadUserChapters();
    // 预加载关键图片
    this.preloadCriticalImages();
  },
  onShow() {
    // 页面显示时重新加载章节数据
    this.loadChapterData();
    this.loadUserChapters();
  },
  methods: {
    // 暴露图片路径优化函数
    getOptimalImagePath,
    
    // 预加载关键图片
    preloadCriticalImages() {
      const criticalImages = [
        '/src/images/memoirbook.png',
        '/src/images/winter.png',
        '/src/images/lion.png'
      ];
      
      imagePreloader.preloadCritical(criticalImages)
        .then(() => {
          console.log('关键图片预加载完成');
        })
        .catch(error => {
          console.warn('关键图片预加载失败:', error);
        });
    },
    
    loadChapterData() {
      try {
        // 加载章节状态
        const savedStatus = uni.getStorageSync('chapter_status');
        if (savedStatus) {
          const statusMap = JSON.parse(savedStatus);
          let completedCount = 0;
          
          // 更新章节完成状态
          this.allChapters.forEach(chapter => {
            if (statusMap[chapter.id] && statusMap[chapter.id].completed) {
              chapter.completed = true;
              completedCount++;
            } else {
              chapter.completed = false;
            }
          });
          
          // 计算进度
          this.progressPercent = (completedCount / this.totalChapters) * 100;
        } else {
          // 重置所有章节状态
          this.allChapters.forEach(chapter => {
            chapter.completed = false;
          });
          this.progressPercent = 0;
        }
      } catch (error) {
        console.log('加载章节数据失败:', error);
        this.allChapters.forEach(chapter => {
          chapter.completed = false;
        });
        this.progressPercent = 0;
      }
    },

    // 加载用户创建的章节
    async loadUserChapters() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录，跳过加载用户章节');
          return;
        }

        const response = await uni.request({
          url: 'http://106.15.248.189:3001/api/chapters',
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          const responseData = response.data.data || {};
          const userChapters = responseData.chapters || [];
          console.log('📚 获取到用户章节:', userChapters);

          // 过滤出diary章节
          const diaryChapters = userChapters.filter(chapter => 
            chapter.chapterId && chapter.chapterId.startsWith('diary_')
          );

          console.log('📖 过滤出的diary章节:', diaryChapters);

          // 移除之前加载的diary章节，避免重复
          this.allChapters = this.allChapters.filter(chapter => !chapter.id.startsWith('diary_'));

          // 将diary章节转换为首页需要的格式并添加到列表
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

            this.allChapters.push(chapterData);
          });

          console.log('✅ 用户章节加载完成，当前章节总数:', this.allChapters.length);
        } else {
          console.log('❌ 获取用户章节失败:', response.data);
        }
      } catch (error) {
        console.error('❌ 加载用户章节出错:', error);
      }
    },

    getChapterNumber(index) {
      const numbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      return numbers[index] || (index + 1);
    },

    goToChapter(chapter) {
      // 如果是diary章节，跳转到编辑页面
      if (chapter.isDiary) {
        uni.navigateTo({
          url: `/pages/diary/edit?chapterId=${chapter.id}&title=${encodeURIComponent(chapter.title)}&mode=view`
        });
      } else {
        // 普通章节跳转到录制页面
        uni.navigateTo({
          url: `/pages/recording/index?chapterId=${chapter.id}&title=${encodeURIComponent(chapter.title)}`
        });
      }
    },
    
    getPreviewText(text) {
      if (!text) return '暂无内容';
      // 截取前50个字符作为预览
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    },
    
    viewChapter(chapter) {
      // 跳转到录制页面查看章节
      uni.navigateTo({
        url: `/pages/recording/index?chapterId=${chapter.id}&title=${encodeURIComponent(chapter.title)}`
      });
    },
    
    goToMemoir() {
      uni.switchTab({
        url: '/pages/memoir/index'
      });
    },
    
    goToDiary() {
      console.log('点击随记卡片，准备跳转到随记页面');
      uni.switchTab({
        url: '/pages/diary/index',
        success: function() {
          console.log('成功跳转到随记页面');
        },
        fail: function(err) {
          console.error('跳转到随记页面失败:', err);
          // 如果switchTab失败，尝试使用navigateTo
          uni.navigateTo({
            url: '/pages/diary/index'
          });
        }
      });
    },

    goToChapters() {
      console.log('点击开始录制按钮，准备跳转到回忆录工坊');
      uni.switchTab({
        url: '/pages/memoir/index'
      });
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
  padding-bottom: 20px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.memoir-card {
  background: linear-gradient(135deg, #f8f6f3 0%, #ede8e3 100%);
  border-radius: 20px;
  padding: 40px 32px;
  margin-bottom: 24px;
  display: flex;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  min-height: 300px;
}

.memoir-card-left {
  flex-shrink: 0;
  margin-right: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-cover {
  width: 160px;
  height: 210px;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  transform: perspective(400px) rotateY(-5deg);
  transition: transform 0.3s ease;
}

.memoir-card:hover .book-cover {
  transform: perspective(300px) rotateY(0deg);
}

.memoir-card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-left: 16px;
  min-width: 0;
}

.memoir-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.memoir-title {
  font-size: 28px;
  font-weight: 600;
  color: #2d2d2d;
  margin-bottom: 8px;
  letter-spacing: 1.5px;
}

.memoir-subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
  font-weight: 400;
}

.memoir-progress {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.progress-text {
  font-size: 36px;
  font-weight: 300;
  color: #1a1a1a;
  margin-right: 12px;
  font-family: 'Arial', sans-serif;
  line-height: 1;
}

.progress-label {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .memoir-card {
    padding: 32px 20px;
    min-height: 220px;
    border-radius: 16px;
  }
  
  .memoir-card-left {
    margin-right: 20px;
  }
  
  .book-cover {
    width: 120px;
    height: 160px;
  }
  
  .memoir-title {
    font-size: 22px;
    top: 32px;
    right: 24px;
    letter-spacing: 1px;
  }
  
  .progress-text {
    font-size: 28px;
    margin-right: 8px;
  }
  
  .progress-label {
    font-size: 12px;
  }
  
  .memoir-card-right {
    padding-left: 4px;
  }
}

@media (max-width: 360px) {
  .memoir-card {
    padding: 28px 16px;
    min-height: 200px;
  }
  
  .book-cover {
    width: 100px;
    height: 130px;
  }
  
  .memoir-title {
    font-size: 18px;
    top: 28px;
    right: 20px;
  }
  
  .progress-text {
    font-size: 24px;
  }
  
  .progress-label {
    font-size: 11px;
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  margin-bottom: 24px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B47 0%, #FF8A65 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.start-btn {
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  width: fit-content;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.start-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 按钮响应式设计 */
@media (max-width: 480px) {
  .start-btn {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 20px;
  }
}

@media (max-width: 360px) {
  .start-btn {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 18px;
  }
}

.diary-card {
  position: relative;
  border-radius: 16px;
  margin-bottom: 20px;
  overflow: hidden;
  height: 140px;
}

.diary-bg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.diary-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.diary-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
}

.diary-subtitle {
  font-size: 14px;
  color: white;
  line-height: 1.4;
  opacity: 0.9;
}

.section-preview {
  background: white;
  border-radius: 16px;
  padding: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

/* 章节滚动区域 */
.chapters-scroll {
  width: 100%;
  height: 220px;
  margin-bottom: 16px;
}

.chapters-container {
  display: flex;
  padding: 0 4px;
  gap: 16px;
  align-items: center;
}

/* 章节预览卡片 */
.chapter-preview-card {
  position: relative;
  width: 160px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.chapter-preview-card:active {
  transform: scale(0.95);
}

.chapter-preview-card.completed {
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
}

.chapter-preview-card.first {
  margin-left: 0;
}

.chapter-preview-card.last {
  margin-right: 4px;
}

/* 背景图片 */
.card-bg {
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
    rgba(0, 0, 0, 0.7) 100%
  );
}

/* 卡片内容 */
.card-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: white;
}

.chapter-number {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
}

.chapter-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin-bottom: 6px;
  font-family: "STKaiti", "KaiTi", "华文楷体", "FangSong", "仿宋", "LiSu", "隶书", "SimHei", "黑体", serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.chapter-subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.3;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 完成状态 */
.completion-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-icon {
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.completion-status.not-started .status-icon {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.status-text {
  font-size: 10px;
  color: white;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 提示文字 */
.scroll-tip {
  text-align: center;
  margin-top: 8px;
}

.tip-text {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

/* 隐藏滚动条 */
.chapters-scroll::-webkit-scrollbar {
  display: none;
}

.chapters-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.preview-placeholder {
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-book-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: #999;
  line-height: 1.4;
  max-width: 200px;
}

/* 章节列表样式 */
.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.chapter-item:active {
  background: #e9ecef;
  transform: scale(0.98);
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.chapter-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-status {
  margin-left: 12px;
  flex-shrink: 0;
}

.status-tag {
  background: #e8f5e8;
  color: #4CAF50;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
</style>