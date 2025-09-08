<template>
  <view class="container">
    <!-- 回忆录工坊卡片 -->
    <view class="memoir-card" @click="goToWelcome">
      <view class="memoir-card-left">
        <image src="/static/images/book-cover.png" class="book-cover" mode="aspectFit"></image>
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
  background: linear-gradient(135deg, #f5f3f0 0%, #e8e4df 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.memoir-card-left {
  flex-shrink: 0;
  margin-right: 20px;
}

.book-cover {
  width: 80px;
  height: 100px;
  border-radius: 8px;
}

.memoir-card-right {
  flex: 1;
}

.memoir-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.memoir-progress {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
}

.progress-text {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-right: 8px;
}

.progress-label {
  font-size: 14px;
  color: #666;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin-bottom: 16px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B47 0%, #FF8A65 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.start-btn {
  background: linear-gradient(135deg, #FF6B47 0%, #FF8A65 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  width: fit-content;
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