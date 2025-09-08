<template>
  <view class="container">
    <!-- 进度条 -->
    <view class="progress-header">
      <view class="progress-bar-container">
        <view class="progress-bar">
          <view class="progress-fill" :style="{width: progressPercent + '%'}"></view>
        </view>
        <view class="progress-text">{{ currentQuestion }}/{{ totalQuestions }}</view>
      </view>
    </view>

    <!-- AI头像 -->
    <view class="ai-avatar">
      <view class="avatar-circle">
        <view class="avatar-dot dot1"></view>
        <view class="avatar-dot dot2"></view>
      </view>
    </view>

    <!-- 问题区域 -->
    <view class="question-section">
      <view class="question-number">问题{{ currentQuestion }}：</view>
      <view class="question-text">{{ currentQuestionData.text }}</view>
    </view>

    <!-- 答案选项 -->
    <view class="answer-section">
      <view class="answer-type">{{ currentQuestionData.type }}</view>
      <view class="options-container">
        <button 
          v-for="(option, index) in currentQuestionData.options" 
          :key="index"
          class="option-btn"
          :class="{ selected: selectedOptions.includes(index) }"
          @click="selectOption(index)"
        >
          {{ option }}
        </button>
      </view>
    </view>

    <!-- 确定按钮 -->
    <view class="confirm-section">
      <button class="confirm-btn" @click="confirmAnswer" :disabled="!canConfirm">
        确定
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentQuestion: 1,
      totalQuestions: 36,
      selectedOptions: [],
      answers: [],
      questions: [
        {
          id: 1,
          text: '您的年龄？',
          type: '单选',
          options: ['40岁以下', '40~50岁', '50~60岁', '60~70岁', '70岁以上'],
          multiple: false
        },
        {
          id: 2,
          text: '您的职业背景？',
          type: '单选',
          options: ['教师', '医生', '工程师', '商人', '公务员', '退休'],
          multiple: false
        },
        {
          id: 3,
          text: '您最难忘的人生阶段？',
          type: '多选',
          options: ['童年时光', '求学经历', '工作生涯', '恋爱结婚', '育儿时光', '退休生活'],
          multiple: true
        },
        {
          id: 4,
          text: '您的家乡在哪里？',
          type: '单选',
          options: ['北方城市', '南方城市', '农村地区', '海外', '其他'],
          multiple: false
        },
        {
          id: 5,
          text: '您最重视的价值观？',
          type: '多选',
          options: ['家庭和睦', '事业成功', '健康快乐', '知识学习', '助人为乐', '诚信正直'],
          multiple: true
        }
        // 可以继续添加更多问题到36个
      ]
    }
  },
  computed: {
    progressPercent() {
      return (this.currentQuestion / this.totalQuestions) * 100;
    },
    currentQuestionData() {
      return this.questions[this.currentQuestion - 1] || this.questions[0];
    },
    canConfirm() {
      return this.selectedOptions.length > 0;
    }
  },
  methods: {
    selectOption(index) {
      if (this.currentQuestionData.multiple) {
        // 多选
        const optionIndex = this.selectedOptions.indexOf(index);
        if (optionIndex > -1) {
          this.selectedOptions.splice(optionIndex, 1);
        } else {
          this.selectedOptions.push(index);
        }
      } else {
        // 单选
        this.selectedOptions = [index];
      }
    },
    confirmAnswer() {
      if (!this.canConfirm) return;
      
      // 保存答案
      const selectedAnswers = this.selectedOptions.map(index => 
        this.currentQuestionData.options[index]
      );
      
      this.answers.push({
        questionId: this.currentQuestion,
        question: this.currentQuestionData.text,
        answers: selectedAnswers,
        type: this.currentQuestionData.type
      });
      
      console.log(`问题${this.currentQuestion}的答案：`, selectedAnswers);
      
      // 进入下一题
      this.nextQuestion();
    },
    nextQuestion() {
      if (this.currentQuestion < Math.min(this.questions.length, this.totalQuestions)) {
        this.currentQuestion++;
        this.selectedOptions = [];
      } else {
        // 完成所有可用问题
        this.completeQuestionnaire();
      }
    },
    completeQuestionnaire() {
      uni.showModal({
        title: '问卷完成！',
        content: `您已完成 ${this.currentQuestion - 1} 个问题的回答。我们将开始为您生成专属回忆录。`,
        showCancel: false,
        success: () => {
          // 保存答案到本地存储
          uni.setStorageSync('memoirAnswers', this.answers);
          
          // 返回首页并显示生成中状态
          uni.switchTab({
            url: '/pages/index/index'
          });
        }
      });
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

.option-btn:active {
  transform: scale(0.98);
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
