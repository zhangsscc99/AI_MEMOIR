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
      
      <!-- 开启回忆之旅按钮 -->
      <view class="journey-btn-section">
        <button class="journey-btn" @click="startJourney">
          开启回忆之旅
        </button>
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
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 25%, #FDB931 50%, #D4AF37 75%, #B8860B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 18px;
}

.highlight-text {
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 25%, #FDB931 50%, #D4AF37 75%, #B8860B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
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
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 25%, #FDB931 50%, #D4AF37 75%, #B8860B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 300;
  opacity: 0.9;
}

.memoir-title-text {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #D4AF37 0%, #FFD700 25%, #FDB931 50%, #D4AF37 75%, #B8860B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 8px;
  letter-spacing: 2px;
}

.start-section {
  margin-top: auto;
  margin-bottom: 40px;
  width: 100%;
  max-width: 280px;
}

.journey-btn-section {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.journey-btn {
  background: rgba(255, 255, 255, 0.85);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 30px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 1px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  font-family: "PingFang SC", "苹方", "Source Han Sans CN", "思源黑体", sans-serif;
}

.journey-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: rgba(255, 255, 255, 0.9);
}

.start-journey-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 28px;
  padding: 18px 32px;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 1px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  font-family: "PingFang SC", "苹方", "Source Han Sans CN", "思源黑体", sans-serif;
}

.start-journey-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: rgba(255, 255, 255, 0.9);
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