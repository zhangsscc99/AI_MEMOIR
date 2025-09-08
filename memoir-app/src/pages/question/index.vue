<template>
  <view class="container">
    <view class="progress-header">
      <view class="progress-bar-container">
        <view class="progress-bar">
          <view class="progress-fill" style="width: 3%"></view>
        </view>
        <view class="progress-text">1/36</view>
      </view>
    </view>

    <view class="ai-avatar">
      <view class="avatar-circle">
        <view class="avatar-dot dot1"></view>
        <view class="avatar-dot dot2"></view>
      </view>
    </view>

    <view class="question-section">
      <view class="question-number">问题1：</view>
      <view class="question-text">您的年龄？</view>
    </view>

    <view class="answer-section">
      <view class="answer-type">单选</view>
      <view class="options-container">
        <button 
          v-for="(option, index) in ['40岁以下', '40~50岁', '50~60岁', '60~70岁', '70岁以上']" 
          :key="index"
          class="option-btn"
          :class="{ selected: selectedOption === index }"
          @click="selectOption(index)"
        >
          {{ option }}
        </button>
      </view>
    </view>

    <view class="confirm-section">
      <button class="confirm-btn" @click="confirmAnswer" :disabled="selectedOption === null">
        确定
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      selectedOption: null
    }
  },
  methods: {
    selectOption(index) {
      this.selectedOption = index;
    },
    confirmAnswer() {
      if (this.selectedOption !== null) {
        uni.showModal({
          title: '答案已记录',
          content: '感谢您的回答！这是演示版本，完整版将有36个问题。',
          showCancel: false,
          success: () => {
            uni.switchTab({
              url: '/pages/index/index'
            });
          }
        });
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.progress-header {
  margin-bottom: 40px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B47 0%, #FF8A65 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  min-width: 50px;
}

.ai-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-dot {
  width: 8px;
  height: 8px;
  background-color: #f39c12;
  border-radius: 50%;
  position: absolute;
  animation: pulse 2s infinite;
}

.dot1 {
  left: 25px;
}

.dot2 {
  right: 25px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.question-section {
  margin-bottom: 40px;
}

.question-number {
  font-size: 18px;
  color: #FF6B47;
  margin-bottom: 12px;
  font-weight: 500;
}

.question-text {
  font-size: 20px;
  color: #333;
  font-weight: bold;
  line-height: 1.4;
}

.answer-section {
  margin-bottom: 80px;
}

.answer-type {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 16px;
  color: #333;
  text-align: left;
  transition: all 0.3s ease;
}

.option-btn.selected {
  border-color: #FF6B47;
  background-color: #fff5f2;
  color: #FF6B47;
}

.confirm-section {
  position: fixed;
  bottom: 34px;
  left: 20px;
  right: 20px;
}

.confirm-btn {
  width: 100%;
  background: linear-gradient(135deg, #FF6B47 0%, #FF8A65 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 16px;
  font-size: 18px;
  font-weight: 500;
  transition: opacity 0.3s ease;
}

.confirm-btn:disabled {
  opacity: 0.5;
}
</style>
