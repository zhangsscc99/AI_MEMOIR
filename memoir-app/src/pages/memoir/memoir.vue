<template>
  <view class="container">
    <!-- 书本图片 -->
    <view class="book-section">
      <image src="/src/images/memoirbook.png" class="book-image" mode="aspectFit"></image>
    </view>

    <!-- 欢迎文案 -->
    <view class="welcome-section">
      <view class="welcome-title">欢迎来到回忆录工坊！</view>
      <view class="welcome-description">
        <text>我们将通过 </text>
        <text class="highlight-number">36</text>
        <text> 个互动 </text>
        <text class="highlight-text">采访</text>
        <text> 问答，</text>
        <text class="description-line">了解您的人生故事，</text>
        <text class="description-final">生成电子版或精美纸质版的专属于您的</text>
      </view>
      
      <!-- 回忆录标题 -->
      <view class="memoir-title-section">
        <text class="quote-left">"</text>
        <text class="memoir-title-text">回忆录</text>
        <text class="quote-right">"</text>
      </view>
    </view>

    <!-- 开始按钮 -->
    <view class="start-section">
      <button class="start-journey-btn" @click="startJourney">
        开启回忆之旅
      </button>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    startJourney() {
      uni.showToast({
        title: '开始创建回忆录！',
        icon: 'success'
      });
      // TODO: 跳转到问答流程
    }
  }
}
</script>

<style scoped>
.container {
  padding: 40px 20px 20px;
  background-color: #f8f6f3;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.book-section {
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
}

.book-image {
  width: 200px;
  height: 260px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 60px;
  max-width: 320px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #2d2d2d;
  margin-bottom: 24px;
  letter-spacing: 1px;
}

.welcome-description {
  font-size: 16px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 32px;
}

.highlight-number {
  color: #FF6B47;
  font-weight: bold;
  font-size: 18px;
}

.highlight-text {
  color: #FF6B47;
  font-weight: 500;
}

.description-line {
  display: block;
  margin: 8px 0;
}

.description-final {
  display: block;
  margin-top: 8px;
}

.memoir-title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.quote-left,
.quote-right {
  font-size: 32px;
  color: #FF6B47;
  font-weight: 300;
  opacity: 0.8;
}

.memoir-title-text {
  font-size: 36px;
  font-weight: bold;
  color: #FF6B47;
  margin: 0 8px;
  letter-spacing: 2px;
}

.start-section {
  margin-top: auto;
  margin-bottom: 40px;
  width: 100%;
  max-width: 280px;
}

.start-journey-btn {
  width: 100%;
  background: linear-gradient(135deg, #FF6B47 0%, #FF8A65 100%);
  color: white;
  border: none;
  border-radius: 28px;
  padding: 18px 32px;
  font-size: 18px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(255, 107, 71, 0.3);
  transition: all 0.3s ease;
}

.start-journey-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(255, 107, 71, 0.4);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .container {
    padding: 30px 16px 16px;
  }
  
  .book-image {
    width: 160px;
    height: 210px;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .welcome-description {
    font-size: 15px;
  }
  
  .memoir-title-text {
    font-size: 28px;
  }
  
  .quote-left,
  .quote-right {
    font-size: 24px;
  }
}

@media (max-width: 360px) {
  .book-image {
    width: 140px;
    height: 180px;
  }
  
  .welcome-title {
    font-size: 18px;
  }
  
  .welcome-description {
    font-size: 14px;
  }
  
  .memoir-title-text {
    font-size: 24px;
  }
  
  .start-journey-btn {
    font-size: 16px;
    padding: 16px 28px;
  }
}
</style>