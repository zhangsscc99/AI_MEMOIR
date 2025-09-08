<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">{{ chapterTitle }}</view>
      <view class="save-btn" @click="saveChapter">
        <text class="save-text">保存</text>
      </view>
    </view>

    <!-- 录制内容区 -->
    <view class="content">
      <!-- 引导问题 -->
      <view class="prompts-section">
        <view class="prompts-card">
          <text class="prompts-title">引导问题</text>
          <view class="prompts-list">
            <view 
              v-for="(prompt, index) in prompts" 
              :key="index"
              class="prompt-item"
            >
              <view class="prompt-number">{{ index + 1 }}</view>
              <text class="prompt-text">{{ prompt }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 语音录制区域 -->
      <view class="recording-section">
        <view class="recording-card">
          <!-- 日期显示 -->
          <view class="date-display">
            <text class="date-text">{{ currentDate }}</text>
          </view>
          
          <!-- 文本输入区域 -->
          <view class="text-input-area">
            <textarea 
              class="text-input"
              placeholder="开始记录您的回忆..."
              :value="contentText"
              @input="onTextInput"
              auto-height
              maxlength="5000"
            ></textarea>
          </view>
          
          <!-- 语音录制控制区域 -->
          <view class="voice-control-area">
            <!-- 录制按钮 -->
            <view class="record-btn-container">
              <view 
                class="record-btn"
                :class="{ 'recording': isRecording, 'processing': isProcessing }"
                @touchstart="startRecording"
                @touchend="stopRecording"
                @touchcancel="stopRecording"
              >
                <view class="record-icon">
                  <view v-if="isRecording" class="recording-animation">
                    <view class="wave" v-for="i in 3" :key="i"></view>
                  </view>
                  <text v-else class="mic-icon">🎤</text>
                </view>
              </view>
              <text class="record-text">{{ recordButtonText }}</text>
            </view>
            
            <!-- 语言选择 -->
            <view class="language-selector">
              <text class="language-text">普通话</text>
              <text class="language-arrow">▼</text>
            </view>
          </view>
          
          <!-- 录音计时 -->
          <view v-if="isRecording" class="recording-timer">
            <text class="timer-text">{{ formatTime(recordingTime) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      chapterId: '',
      chapterTitle: '',
      contentText: '',
      isRecording: false,
      isProcessing: false,
      recordingTime: 0,
      recordings: [],
      recordingTimer: null,
      prompts: []
    }
  },
  computed: {
    recordButtonText() {
      if (this.isProcessing) return '处理中...';
      if (this.isRecording) return '松开结束';
      return '按住说话';
    },
    currentDate() {
      const now = new Date();
      return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
  },
  onLoad(options) {
    this.chapterId = options.chapterId || '';
    this.chapterTitle = decodeURIComponent(options.title || '章节录制');
    this.loadChapterPrompts();
    this.loadSavedContent();
  },
  onUnload() {
    // 清理定时器
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
  },
  methods: {
    goBack() {
      this.saveChapter(); // 自动保存
      uni.navigateBack();
    },
    
    onTextInput(event) {
      this.contentText = event.detail.value || event.target.value || '';
    },
    
    loadChapterPrompts() {
      // 根据章节ID加载对应的引导问题
      const promptsMap = {
        'background': [
          '您出生在哪里？那是一个什么样的地方？',
          '您的父母是做什么工作的？',
          '家里有哪些亲人？他们各自有什么特点？',
          '童年时的家是什么样子的？'
        ],
        'childhood': [
          '您最难忘的童年记忆是什么？',
          '小时候最喜欢玩什么游戏？',
          '有没有特别要好的童年伙伴？',
          '童年时最害怕或最开心的事情是什么？'
        ],
        'education': [
          '您的求学经历是怎样的？',
          '有没有对您影响深刻的老师？',
          '学生时代最难忘的经历是什么？',
          '您最喜欢的科目是什么？为什么？'
        ],
        'career': [
          '您的第一份工作是什么？',
          '职业生涯中最大的成就是什么？',
          '工作中遇到过什么挑战？',
          '有没有改变职业方向的经历？'
        ],
        'love': [
          '您是如何遇到另一半的？',
          '印象最深刻的约会经历是什么？',
          '婚礼是什么样的？',
          '感情路上有什么感悟？'
        ],
        'family': [
          '成为父母后的感受如何？',
          '孩子给您带来了什么变化？',
          '家庭生活中最温馨的时刻是什么？',
          '您希望给孩子什么样的教育？'
        ],
        'travel': [
          '您去过哪些地方旅行？',
          '最难忘的旅行经历是什么？',
          '旅行中遇到过什么有趣的人或事？',
          '哪个地方让您印象最深刻？'
        ],
        'relationships': [
          '您生命中最重要的朋友是谁？',
          '有没有改变您人生轨迹的重要遇见？',
          '您如何维系长久的友谊？',
          '人际交往中您学到了什么？'
        ],
        'laterlife': [
          '退休后的生活是什么样的？',
          '晚年最大的快乐来源是什么？',
          '对于衰老您有什么感受？',
          '您希望如何度过余生？'
        ],
        'wisdom': [
          '人生中最重要的感悟是什么？',
          '如果重新来过，您会做出不同的选择吗？',
          '您希望给年轻人什么建议？',
          '什么是您认为最珍贵的？'
        ]
      };
      
      this.prompts = promptsMap[this.chapterId] || [];
    },
    
    loadSavedContent() {
      try {
        const savedContent = uni.getStorageSync(`chapter_${this.chapterId}`);
        if (savedContent) {
          const content = JSON.parse(savedContent);
          this.contentText = content.text || '';
          this.recordings = content.recordings || [];
        }
      } catch (error) {
        console.log('加载保存内容失败:', error);
      }
    },
    
    saveChapter() {
      try {
        const content = {
          text: this.contentText,
          recordings: this.recordings,
          lastModified: new Date().toISOString(),
          completed: this.contentText.length > 0 || this.recordings.length > 0
        };
        
        // 保存章节内容
        uni.setStorageSync(`chapter_${this.chapterId}`, JSON.stringify(content));
        
        // 更新章节状态
        const savedStatus = uni.getStorageSync('chapter_status') || '{}';
        const statusMap = JSON.parse(savedStatus);
        statusMap[this.chapterId] = {
          completed: content.completed,
          lastModified: content.lastModified
        };
        uni.setStorageSync('chapter_status', JSON.stringify(statusMap));
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
      } catch (error) {
        uni.showToast({
          title: '保存失败',
          icon: 'error'
        });
      }
    },
    
    startRecording() {
      if (this.isProcessing) return;
      
      this.isRecording = true;
      this.recordingTime = 0;
      
      // 开始计时
      this.recordingTimer = setInterval(() => {
        this.recordingTime++;
      }, 1000);
      
      // 这里应该调用实际的录音API
      // uni.startRecord({...})
      
      uni.showToast({
        title: '开始录制',
        icon: 'none'
      });
    },
    
    stopRecording() {
      if (!this.isRecording) return;
      
      this.isRecording = false;
      this.isProcessing = true;
      
      // 停止计时
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      // 模拟录音处理
      setTimeout(() => {
        const newRecording = {
          id: Date.now(),
          duration: this.recordingTime,
          filePath: `recording_${Date.now()}.wav`, // 实际应该是录音文件路径
          transcription: '', // 转录文本
          playing: false
        };
        
        this.recordings.push(newRecording);
        this.isProcessing = false;
        this.recordingTime = 0;
        
        uni.showToast({
          title: '录制完成，正在转换文字...',
          icon: 'success'
        });
        
        // 自动开始转录
        setTimeout(() => {
          this.transcribeRecording(newRecording);
        }, 500);
      }, 1000);
    },
    
    playRecording(recording) {
      // 切换播放状态
      recording.playing = !recording.playing;
      
      // 这里应该调用实际的播放API
      if (recording.playing) {
        uni.showToast({
          title: '开始播放',
          icon: 'none'
        });
        
        // 模拟播放结束
        setTimeout(() => {
          recording.playing = false;
        }, recording.duration * 1000);
      } else {
        uni.showToast({
          title: '停止播放',
          icon: 'none'
        });
      }
    },
    
    transcribeRecording(recording) {
      // 转录录音为文字
      uni.showLoading({
        title: '语音转文字中...'
      });
      
      // 模拟转录过程，实际应该调用语音识别API
      setTimeout(() => {
        const sampleTexts = [
          '我出生在一个小城市，那里有着宁静的街道和温暖的邻里关系。',
          '童年时最难忘的是和小伙伴们在院子里玩耍的美好时光。',
          '那时候的生活虽然简单，但充满了纯真的快乐和无忧无虑。',
          '家里的老房子虽然不大，但承载着我们一家人温馨的回忆。'
        ];
        
        const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        recording.transcription = randomText;
        
        // 将转录文本添加到文本输入框
        if (this.contentText) {
          this.contentText += '\n\n' + randomText;
        } else {
          this.contentText = randomText;
        }
        
        uni.hideLoading();
        uni.showToast({
          title: '语音转文字完成',
          icon: 'success'
        });
      }, 2000);
    },
    
    deleteRecording(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这段录音吗？',
        success: (res) => {
          if (res.confirm) {
            this.recordings.splice(index, 1);
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      });
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.nav-header {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-btn {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.save-btn {
  padding: 8px 16px;
  background: #FF6B47;
  border-radius: 20px;
}

.save-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.content {
  padding: 20px;
}


/* 引导问题区域 */
.prompts-section {
  margin-bottom: 60px;
}

.prompts-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.prompts-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.prompts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #333;
}

.prompt-number {
  background: #333;
  color: white;
  font-size: 12px;
  font-weight: 600;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.prompt-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  flex: 1;
}

/* 语音录制区域 */
.recording-section {
  margin-bottom: 40px;
}

.recording-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 400px;
}

.date-display {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.date-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.text-input-area {
  margin-bottom: 30px;
  min-height: 200px;
}

.text-input {
  width: 100%;
  min-height: 200px;
  padding: 16px 0;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: transparent;
  resize: none;
  border-left: 3px solid #e0e0e0;
  padding-left: 16px;
}

.text-input:focus {
  border-left-color: #007AFF;
}

.voice-control-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
}

.record-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.record-btn {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #007AFF 0%, #005FCC 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
}

.record-btn.recording {
  background: linear-gradient(135deg, #FF3B30 0%, #CC1E14 100%);
  box-shadow: 0 4px 20px rgba(255, 59, 48, 0.4);
  animation: pulse 2s infinite;
}

.record-btn.processing {
  background: linear-gradient(135deg, #FF9500 0%, #CC7700 100%);
  box-shadow: 0 4px 20px rgba(255, 149, 0, 0.4);
}

.record-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-icon {
  font-size: 32px;
  color: white;
}

.recording-animation {
  display: flex;
  align-items: center;
  gap: 4px;
}

.wave {
  width: 4px;
  height: 20px;
  background: white;
  border-radius: 2px;
  animation: wave 1.2s infinite ease-in-out;
}

.wave:nth-child(2) {
  animation-delay: 0.1s;
}

.wave:nth-child(3) {
  animation-delay: 0.2s;
}

.record-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 20px;
  cursor: pointer;
}

.language-text {
  font-size: 14px;
  color: #333;
}

.language-arrow {
  font-size: 10px;
  color: #666;
}

.recording-timer {
  text-align: center;
  margin-top: 16px;
  padding: 8px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 8px;
}

.timer-text {
  font-size: 16px;
  font-weight: 600;
  color: #FF3B30;
  font-family: 'Courier New', monospace;
}

/* 动画 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes wave {
  0%, 100% { height: 20px; }
  50% { height: 40px; }
}

/* 移动端适配 */
@media (max-width: 375px) {
  .nav-header {
    padding: 15px;
  }
  
  .content {
    padding: 15px;
  }
  
  .record-btn {
    width: 100px;
    height: 100px;
  }
  
  .record-icon {
    font-size: 28px;
  }
}
</style>
