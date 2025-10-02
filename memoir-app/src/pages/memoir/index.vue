<template>
  <view class="container">
    <!-- 书本图片 -->
    <view class="book-section">
      <LazyImage 
        src="/src/images/memoirbook.png" 
        class="book-image" 
        mode="aspectFit"
        width="200px"
        height="260px"
      />
    </view>

    <!-- 欢迎文案 -->
    <view class="welcome-section">
      <view class="welcome-title">欢迎来到岁月镜像！</view>
      <view class="welcome-description">
        <text>选择您想要记录的人生章节，</text>
        <text class="description-line">开始您的回忆之旅</text>
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
// 导入LazyImage组件
import LazyImage from '@/components/LazyImage.vue';

export default {
  components: {
    LazyImage
  },
  methods: {
    startJourney() {
      // 跳转到章节选择页面
      uni.navigateTo({
        url: '/pages/chapters/index'
      });
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px 20px 20px;
  background-color: #f8f6f3;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.book-section {
  margin-bottom: 25px;
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
  margin-bottom: 40px;
  max-width: 320px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #2d2d2d;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.welcome-description {
  font-size: 16px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 20px;
}

.description-line {
  display: block;
  margin: 8px 0;
}

.memoir-title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
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
  margin-top: 20px;
  margin-bottom: 40px;
  width: 100%;
  max-width: 280px;
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
    padding: 15px 16px 16px;
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
  
  .start-section {
    margin-top: 15px;
  }
  
  .start-journey-btn {
    font-size: 16px;
    padding: 16px 28px;
  }
}
</style>
