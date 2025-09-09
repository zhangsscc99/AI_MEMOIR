<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">新随记</view>
      <view class="action-menu">
        <text class="menu-icon">⋯</text>
      </view>
      <view class="save-btn" @click="saveDiary">
        <text class="save-text">完成</text>
      </view>
    </view>

    <!-- 随记内容区 -->
    <view class="content">
      <!-- 标题输入 -->
      <view class="title-section">
        <input 
          class="title-input" 
          placeholder="随记标题"
          v-model="diaryTitle"
          maxlength="50"
        />
      </view>

      <!-- 照片上传区域 -->
      <view class="photo-section">
        <view class="photo-upload" @click="chooseImage" v-if="!selectedImage">
          <view class="upload-icon">
            <image src="/static/icons/camera.svg" class="camera-icon" mode="aspectFit"></image>
          </view>
          <text class="upload-text">上传图片 记录美好瞬间</text>
        </view>
        
        <!-- 已选择的图片 -->
        <view class="photo-preview" v-if="selectedImage">
          <image :src="selectedImage" class="preview-image" mode="aspectFill"></image>
          <view class="photo-overlay">
            <view class="photo-actions">
              <view class="action-btn" @click="chooseImage">
                <image src="/static/icons/camera.svg" class="action-camera-icon" mode="aspectFit"></image>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 文字内容输入 -->
      <view class="text-section">
        <textarea 
          class="content-textarea"
          placeholder="记录您现在想到的事情..."
          v-model="diaryContent"
          maxlength="2000"
          auto-height
        ></textarea>
      </view>

      <!-- 录音控制区 -->
      <view class="recording-section">
        <!-- 录音时间显示 -->
        <view class="recording-timer" v-if="isRecording || recordings.length > 0">
          <text class="timer-text">{{ formatTime(recordingTime) }}</text>
          <text class="timer-limit">最多可录制10分钟</text>
        </view>

        <!-- 录音波形 -->
        <view class="recording-wave" v-if="isRecording">
          <view 
            class="wave-bar" 
            v-for="(height, index) in waveform" 
            :key="index"
            :style="{ height: height + 'px' }"
          ></view>
        </view>

        <!-- 录音按钮 -->
        <view class="recording-controls">
          <view class="record-btn-container">
            <view 
              class="record-btn" 
              @click="toggleRecording" 
              :class="{ 'recording': isRecording }"
            >
              <view class="record-icon">
                <view v-if="isRecording" class="recording-animation">
                  <view class="wave" v-for="i in 3" :key="i"></view>
                </view>
                <image v-else src="/static/icons/microphone.svg" class="mic-icon" mode="aspectFit"></image>
              </view>
            </view>
            <text class="record-text">{{ isRecording ? '结束录制' : '点击录制' }}</text>
          </view>
        </view>

        <!-- 录音列表 -->
        <view class="recordings-list" v-if="recordings.length > 0">
          <view 
            class="recording-item" 
            v-for="(recording, index) in recordings" 
            :key="index"
          >
            <view class="recording-info">
              <text class="recording-name">录音 {{ index + 1 }}</text>
              <text class="recording-duration">{{ formatTime(recording.duration) }}</text>
            </view>
            <view class="recording-actions">
              <view class="play-btn" @click="playRecording(recording)">
                <text class="play-icon">▶️</text>
              </view>
              <view class="delete-btn" @click="deleteRecording(index)">
                <text class="delete-icon">🗑️</text>
              </view>
            </view>
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
      diaryTitle: '',
      diaryContent: '',
      selectedImage: '',
      isRecording: false,
      recordingTime: 0,
      recordings: [],
      recordingTimer: null,
      waveform: [],
      maxRecordingTime: 600, // 10分钟
      recorderManager: null
    };
  },

  onLoad() {
    this.initRecorderManager();
    this.generateWaveform();
  },

  onUnload() {
    this.stopRecording();
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
  },

  methods: {
    goBack() {
      if (this.diaryTitle || this.diaryContent || this.selectedImage || this.recordings.length > 0) {
        uni.showModal({
          title: '提示',
          content: '当前内容尚未保存，确定要离开吗？',
          success: (res) => {
            if (res.confirm) {
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    },

    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.selectedImage = res.tempFilePaths[0];
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          uni.showToast({
            title: '选择图片失败',
            icon: 'error'
          });
        }
      });
    },

    // 初始化录音管理器
    initRecorderManager() {
      // #ifdef APP-PLUS || H5
      this.recorderManager = uni.getRecorderManager();
      
      this.recorderManager.onStart(() => {
        console.log('开始录音');
        this.isRecording = true;
        this.startRecordingTimer();
      });

      this.recorderManager.onStop((res) => {
        console.log('录音结束', res);
        this.isRecording = false;
        this.stopRecordingTimer();
        
        if (res.tempFilePath) {
          this.recordings.push({
            path: res.tempFilePath,
            duration: this.recordingTime,
            createTime: new Date().getTime()
          });
        }
        
        this.recordingTime = 0;
      });

      this.recorderManager.onError((err) => {
        console.error('录音错误:', err);
        this.isRecording = false;
        this.stopRecordingTimer();
        uni.showToast({
          title: '录音失败',
          icon: 'error'
        });
      });
      // #endif
    },

    // 切换录音状态
    toggleRecording() {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    },

    // 开始录音
    startRecording() {
      if (this.recordings.length >= 5) {
        uni.showToast({
          title: '最多录制5段音频',
          icon: 'none'
        });
        return;
      }

      // #ifdef APP-PLUS || H5
      this.recorderManager.start({
        duration: this.maxRecordingTime * 1000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'mp3'
      });
      // #endif

      // #ifdef MP-WEIXIN
      // 微信小程序录音实现
      wx.startRecord({
        success: () => {
          this.isRecording = true;
          this.startRecordingTimer();
        },
        fail: (err) => {
          console.error('录音失败:', err);
          uni.showToast({
            title: '录音失败',
            icon: 'error'
          });
        }
      });
      // #endif
    },

    // 停止录音
    stopRecording() {
      if (!this.isRecording) return;

      // #ifdef APP-PLUS || H5
      this.recorderManager.stop();
      // #endif

      // #ifdef MP-WEIXIN
      wx.stopRecord();
      this.isRecording = false;
      this.stopRecordingTimer();
      // #endif
    },

    // 开始录音计时
    startRecordingTimer() {
      this.recordingTime = 0;
      this.recordingTimer = setInterval(() => {
        this.recordingTime++;
        if (this.recordingTime >= this.maxRecordingTime) {
          this.stopRecording();
        }
      }, 1000);
    },

    // 停止录音计时
    stopRecordingTimer() {
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
    },

    // 播放录音
    playRecording(recording) {
      uni.showToast({
        title: '播放功能开发中',
        icon: 'none'
      });
    },

    // 删除录音
    deleteRecording(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这段录音吗？',
        success: (res) => {
          if (res.confirm) {
            this.recordings.splice(index, 1);
          }
        }
      });
    },

    // 生成波形
    generateWaveform() {
      this.waveform = [];
      for (let i = 0; i < 30; i++) {
        this.waveform.push(Math.random() * 20 + 5);
      }
    },

    // 格式化时间
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // 保存随记
    async saveDiary() {
      if (!this.diaryTitle.trim()) {
        uni.showToast({
          title: '请输入随记标题',
          icon: 'none'
        });
        return;
      }

      if (!this.diaryContent.trim() && !this.selectedImage && this.recordings.length === 0) {
        uni.showToast({
          title: '请添加内容、图片或录音',
          icon: 'none'
        });
        return;
      }

      uni.showLoading({
        title: '保存中...'
      });

      try {
        // 准备保存数据
        const diaryData = {
          title: this.diaryTitle.trim(),
          content: this.diaryContent.trim(),
          image: this.selectedImage,
          recordings: this.recordings,
          createTime: new Date().getTime(),
          updateTime: new Date().getTime()
        };

        // 这里可以调用后端API保存
        // const response = await uni.request({
        //   url: 'http://localhost:3001/api/diary/save',
        //   method: 'POST',
        //   data: diaryData
        // });

        // 暂时保存到本地存储
        const existingDiaries = uni.getStorageSync('diaries') || [];
        diaryData.id = 'diary_' + Date.now();
        existingDiaries.unshift(diaryData);
        uni.setStorageSync('diaries', existingDiaries);

        uni.hideLoading();
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 延迟跳转回随记列表
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);

      } catch (error) {
        uni.hideLoading();
        console.error('保存随记失败:', error);
        uni.showToast({
          title: '保存失败',
          icon: 'error'
        });
      }
    }
  }
};
</script>

<style scoped>
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.nav-header {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-icon {
  font-size: 18px;
  color: #333;
}

.nav-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.action-menu {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.menu-icon {
  font-size: 18px;
  color: #333;
}

.save-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.save-text {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.content {
  padding: 20px;
}

.title-section {
  margin-bottom: 20px;
}

.title-input {
  width: 100%;
  padding: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
}

.photo-section {
  margin-bottom: 30px;
}

.photo-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: white;
  border: 2px dashed #e0e0e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.photo-upload:hover {
  border-color: #999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.upload-icon {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-icon {
  width: 48px;
  height: 48px;
  opacity: 0.6;
}

.upload-text {
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.photo-preview {
  position: relative;
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 24px;
}

.action-camera-icon {
  width: 24px;
  height: 24px;
}

.text-section {
  margin-bottom: 30px;
}

.content-textarea {
  width: 100%;
  min-height: 120px;
  padding: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
}

.recording-section {
  margin-bottom: 30px;
}

.recording-timer {
  text-align: center;
  margin-bottom: 20px;
}

.timer-text {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.timer-limit {
  font-size: 12px;
  color: #999;
}

.recording-wave {
  display: flex;
  align-items: end;
  justify-content: center;
  height: 60px;
  margin-bottom: 30px;
  gap: 2px;
}

.wave-bar {
  width: 4px;
  background: #FF6B47;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite alternate;
}

.wave-bar:nth-child(2n) {
  animation-delay: 0.1s;
}

.wave-bar:nth-child(3n) {
  animation-delay: 0.2s;
}

@keyframes wave {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

.recording-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.record-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.record-btn {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.record-btn.recording {
  background: rgba(255, 59, 48, 0.1);
  border-color: #FF3B30;
  box-shadow: 0 4px 20px rgba(255, 59, 48, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 4px 20px rgba(255, 59, 48, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 6px 30px rgba(255, 59, 48, 0.3); }
  100% { transform: scale(1); box-shadow: 0 4px 20px rgba(255, 59, 48, 0.2); }
}

.record-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-icon {
  width: 24px;
  height: 24px;
  color: #333;
}

.recording-animation {
  display: flex;
  align-items: center;
  gap: 4px;
}

.wave {
  width: 4px;
  height: 20px;
  background: #FF3B30;
  border-radius: 2px;
  animation: wave 1.2s infinite ease-in-out;
}

.wave:nth-child(2) {
  animation-delay: 0.1s;
}

.wave:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes wave {
  0%, 40%, 100% { 
    transform: scaleY(0.4);
  }
  20% { 
    transform: scaleY(1.0);
  }
}

.record-text {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.recordings-list {
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.recording-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.recording-item:last-child {
  border-bottom: none;
}

.recording-info {
  flex: 1;
}

.recording-name {
  font-size: 16px;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.recording-duration {
  font-size: 14px;
  color: #999;
}

.recording-actions {
  display: flex;
  gap: 10px;
}

.play-btn,
.delete-btn {
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.play-icon,
.delete-icon {
  font-size: 16px;
  color: #333;
}
</style>
