<template>
  <view class="container">
    <!-- 回忆录工坊卡片 -->
    <view class="memoir-card" @click="goToWelcome">
      <view class="memoir-card-left">
        <image src="/src/images/memoirbook.png" class="book-cover" mode="aspectFit"></image>
      </view>
      <view class="memoir-card-right">
        <view class="memoir-title">回忆录</view>
        <view class="memoir-progress">
          <text class="progress-text">0/36</text>
          <text class="progress-label">已录制</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{width: progressPercent + '%'}"></view>
        </view>
        <button class="start-btn">开始录制</button>
      </view>
    </view>

    <!-- 随记卡片 -->
    <view class="diary-card" @click="goToDiary">
      <image src="/static/images/diary-bg.jpg" class="diary-bg" mode="aspectFill"></image>
      <view class="diary-overlay">
        <view class="diary-title">随记</view>
        <view class="diary-subtitle">记录照片里的故事，随手写下生活点滴<br/>轻松导入回忆录</view>
      </view>
    </view>

    <!-- 章节预览 -->
    <view class="section-preview">
      <view class="section-title">章节预览</view>
      <view class="preview-placeholder">
        <image src="/static/images/preview-placeholder.png" class="placeholder-img" mode="aspectFit"></image>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      progressPercent: 0,
      totalQuestions: 36,
      completedQuestions: 0
    }
  },
  onLoad() {
    // 计算进度
    this.progressPercent = (this.completedQuestions / this.totalQuestions) * 100;
  },
  methods: {
    goToWelcome() {
      uni.navigateTo({
        url: '/pages/welcome/welcome'
      });
    },
    goToDiary() {
      uni.switchTab({
        url: '/pages/diary/diary'
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
  justify-content: center;
  padding-left: 16px;
  min-width: 0;
}

.memoir-title {
  font-size: 28px;
  font-weight: 600;
  color: #2d2d2d;
  margin-bottom: 20px;
  letter-spacing: 1.5px;
  position: absolute;
  top: 40px;
  right: 40px;
  white-space: nowrap;
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

.preview-placeholder {
  text-align: center;
  padding: 40px 20px;
}

.placeholder-img {
  width: 120px;
  height: 80px;
  opacity: 0.3;
}
</style>