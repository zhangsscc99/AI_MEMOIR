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
      <!-- 录制提示 -->
      <view class="prompt-section" v-if="prompts.length > 0">
        <view class="prompt-card">
          <view class="prompt-title">💭 引导问题</view>
          <view class="prompt-list">
            <text 
              v-for="(prompt, index) in prompts" 
              :key="index"
              class="prompt-item"
            >{{ prompt }}</text>
          </view>
        </view>
      </view>

      <!-- 文字编辑区 -->
      <view class="editor-section">
        <view class="editor-header">
          <text class="editor-title">✍️ 文字记录</text>
          <text class="word-count">{{ contentText.length }} 字</text>
        </view>
        <textarea 
          class="text-editor"
          placeholder="在这里写下您的故事，或者使用语音录制后编辑..."
          v-model="contentText"
          auto-height
          :maxlength="5000"
        ></textarea>
      </view>

      <!-- 语音录制区 -->
      <view class="voice-section">
        <view class="voice-header">
          <text class="voice-title">🎤 语音录制</text>
          <text class="voice-tip">点击录制，说出您的故事</text>
        </view>
        
        <!-- 录制控制 -->
        <view class="voice-controls">
          <view class="record-area">
            <!-- 录制按钮 -->
            <view 
              class="record-btn" 
              :class="{ 
                'recording': isRecording,
                'disabled': isProcessing 
              }"
              @touchstart="startRecording"
              @touchend="stopRecording"
            >
              <view class="record-icon">
                <text v-if="!isRecording && !isProcessing">🎤</text>
                <text v-else-if="isRecording">⏹️</text>
                <text v-else>⏳</text>
              </view>
              <text class="record-text">
                {{ recordButtonText }}
              </text>
            </view>
            
            <!-- 录制时长 -->
            <view v-if="isRecording" class="recording-timer">
              <text class="timer-text">{{ formatTime(recordingTime) }}</text>
              <view class="wave-animation">
                <view class="wave"></view>
                <view class="wave"></view>
                <view class="wave"></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 录音列表 -->
        <view class="recordings-list" v-if="recordings.length > 0">
          <view class="recordings-header">
            <text class="recordings-title">录音片段</text>
          </view>
          <view 
            v-for="(recording, index) in recordings" 
            :key="index"
            class="recording-item"
          >
            <view class="recording-info">
              <text class="recording-name">录音 {{ index + 1 }}</text>
              <text class="recording-duration">{{ formatTime(recording.duration) }}</text>
            </view>
            <view class="recording-actions">
              <view class="action-btn" @click="playRecording(recording)">
                <text class="action-icon">{{ recording.playing ? '⏸️' : '▶️' }}</text>
              </view>
              <view class="action-btn" @click="transcribeRecording(recording)">
                <text class="action-icon">📝</text>
              </view>
              <view class="action-btn" @click="deleteRecording(index)">
                <text class="action-icon">🗑️</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 章节完成度 -->
      <view class="progress-section">
        <view class="progress-card">
          <text class="progress-title">完成度</text>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercentage + '%' }"></view>
          </view>
          <text class="progress-text">{{ progressPercentage }}%</text>
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
      return '按住录制';
    },
    progressPercentage() {
      const textScore = Math.min(this.contentText.length / 200, 1) * 50;
      const recordingScore = Math.min(this.recordings.length / 2, 1) * 50;
      return Math.round(textScore + recordingScore);
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
          completed: this.progressPercentage >= 50
        };
        
        // 保存章节内容
        uni.setStorageSync(`chapter_${this.chapterId}`, JSON.stringify(content));
        
        // 更新章节状态
        const savedStatus = uni.getStorageSync('chapter_status') || '{}';
        const statusMap = JSON.parse(savedStatus);
        statusMap[this.chapterId] = {
          completed: content.completed,
          progress: this.progressPercentage,
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
          title: '录制完成',
          icon: 'success'
        });
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
        title: '转录中...'
      });
      
      // 模拟转录过程
      setTimeout(() => {
        const sampleText = '这是一段示例转录文本，实际应该调用语音识别API进行转录。';
        recording.transcription = sampleText;
        
        // 将转录文本添加到编辑器
        this.contentText += (this.contentText ? '\n\n' : '') + sampleText;
        
        uni.hideLoading();
        uni.showToast({
          title: '转录完成',
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

/* 提示区域 */
.prompt-section {
  margin-bottom: 20px;
}

.prompt-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.prompt-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.prompt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-item {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

/* 文字编辑区 */
.editor-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.editor-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.word-count {
  font-size: 12px;
  color: #666;
}

.text-editor {
  width: 100%;
  min-height: 120px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: #fafafa;
}

/* 语音录制区 */
.voice-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.voice-header {
  margin-bottom: 20px;
}

.voice-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.voice-tip {
  font-size: 14px;
  color: #666;
}

.voice-controls {
  text-align: center;
  margin-bottom: 24px;
}

.record-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.record-btn {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background: linear-gradient(135deg, #FF6B47 0%, #FF8A47 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(255, 107, 71, 0.3);
}

.record-btn.recording {
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
  animation: pulse 1.5s infinite;
}

.record-btn.disabled {
  background: #ccc;
  pointer-events: none;
}

.record-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.record-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.recording-timer {
  text-align: center;
}

.timer-text {
  font-size: 18px;
  font-weight: 600;
  color: #ff4757;
  margin-bottom: 8px;
}

.wave-animation {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.wave {
  width: 4px;
  height: 20px;
  background: #ff4757;
  border-radius: 2px;
  animation: wave 1s infinite;
}

.wave:nth-child(2) {
  animation-delay: 0.2s;
}

.wave:nth-child(3) {
  animation-delay: 0.4s;
}

/* 录音列表 */
.recordings-list {
  margin-top: 24px;
}

.recordings-header {
  margin-bottom: 12px;
}

.recordings-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.recording-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fafafa;
}

.recording-info {
  flex: 1;
}

.recording-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.recording-duration {
  font-size: 12px;
  color: #666;
}

.recording-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 14px;
}

/* 进度区域 */
.progress-section {
  margin-bottom: 40px;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #FF6B47 0%, #FF8A47 100%);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #FF6B47;
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
