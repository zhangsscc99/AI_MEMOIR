<template>
  <view class="container">
    <view class="welcome-content">
      <view class="welcome-title">欢迎来到回忆录工坊！</view>
      <view class="welcome-description">
        我们将通过 <text class="highlight">36 个互动</text> <text class="highlight-orange">采访</text> 回答，<br/>
        了解您的人生故事，<br/><br/>
        生成电子版或精美纸质版的专属于您的
      </view>
      <view class="memoir-title">
        <text class="memoir-quote">"</text>
        <text class="memoir-text">回忆录</text>
        <text class="memoir-quote">"</text>
      </view>
    </view>
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
      uni.navigateTo({
        url: '/pages/question/question'
      });
    }
  }
}
</script>

<style scoped>
.container {
  background: linear-gradient(180deg, #f8f6f3 0%, #ffffff 100%);
  min-height: 100vh;
  padding: 40px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-content {
  text-align: center;
  margin-bottom: 60px;
  max-width: 300px;
}

.welcome-title {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
  line-height: 1.4;
}

.welcome-description {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.highlight {
  color: #333;
  font-weight: 600;
}

.highlight-orange {
  color: #FF6B47;
  font-weight: 600;
}

.memoir-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.memoir-quote {
  font-size: 48px;
  color: #FF6B47;
  font-weight: bold;
  line-height: 1;
}

.memoir-text {
  font-size: 36px;
  color: #FF6B47;
  font-weight: bold;
  margin: 0 8px;
}

.start-section {
  margin-top: auto;
  width: 100%;
  max-width: 300px;
}

.start-journey-btn {
  width: 100%;
  background: linear-gradient(135deg, #FF6B47 0%, #FF8A65 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 16px 24px;
  font-size: 18px;
  font-weight: 600;
}
</style>
