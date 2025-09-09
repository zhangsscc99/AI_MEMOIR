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
          <view class="prompts-title">引导问题</view>
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
              @click="toggleRecording"
            >
                <view class="record-icon">
                  <view v-if="isRecording" class="recording-animation">
                    <view class="wave" v-for="i in 3" :key="i"></view>
                  </view>
                  <image v-else src="/static/icons/microphone.svg" class="mic-icon" mode="aspectFit"></image>
                </view>
              </view>
              <text class="record-text">{{ recordButtonText }}</text>
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
      prompts: [],
      // Web录音相关
      mediaRecorder: null,
      mediaStream: null,
      audioChunks: []
    }
  },
  computed: {
    recordButtonText() {
      if (this.isProcessing) return '处理中...';
      if (this.isRecording) return '结束录制';
      return '点击录制';
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
  mounted() {
    this.loadChapterData();
    this.checkRecordingSupport();
  },
  methods: {
    // 调试方法：检查录音支持
    checkRecordingSupport() {
      console.log('=== 录音支持检查 ===');
      console.log('navigator存在:', typeof navigator !== 'undefined');
      console.log('mediaDevices存在:', typeof navigator?.mediaDevices !== 'undefined');
      console.log('getUserMedia存在:', typeof navigator?.mediaDevices?.getUserMedia !== 'undefined');
      console.log('MediaRecorder存在:', typeof MediaRecorder !== 'undefined');
      
      if (typeof MediaRecorder !== 'undefined') {
        console.log('支持的MIME类型:');
        console.log('audio/webm:', MediaRecorder.isTypeSupported('audio/webm'));
        console.log('audio/webm;codecs=opus:', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'));
        console.log('audio/mp4:', MediaRecorder.isTypeSupported('audio/mp4'));
      }
      
      console.log('uni存在:', typeof uni !== 'undefined');
      console.log('uni.startRecord存在:', typeof uni?.startRecord !== 'undefined');
      console.log('==================');
    },

    loadChapterData() {
      // 获取传入的章节ID和标题
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        const options = currentPage.options || {};
        
        this.chapterId = options.chapterId || '';
        this.chapterTitle = options.title || '';
        
        console.log('加载章节数据:', this.chapterId, this.chapterTitle);
        
        // 设置引导问题
        this.prompts = this.promptsMap[this.chapterId] || [];
        
        // 尝试加载已保存的内容
        this.loadSavedContent();
      }
    },

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
          '家里有哪些亲人？他们各自有什么特点？'
        ],
        'childhood': [
          '您最难忘的童年记忆是什么？',
          '小时候最喜欢玩什么游戏？',
          '有没有特别要好的童年伙伴？'
        ],
        'education': [
          '您的求学经历是怎样的？',
          '有没有对您影响深刻的老师？',
          '学生时代最难忘的经历是什么？'
        ],
        'career': [
          '您的第一份工作是什么？',
          '职业生涯中最大的成就是什么？',
          '工作中遇到过什么挑战？'
        ],
        'love': [
          '您是如何遇到另一半的？',
          '印象最深刻的约会经历是什么？',
          '婚礼是什么样的？'
        ],
        'family': [
          '成为父母后的感受如何？',
          '孩子给您带来了什么变化？',
          '家庭生活中最温馨的时刻是什么？'
        ],
        'travel': [
          '您去过哪些地方旅行？',
          '最难忘的旅行经历是什么？',
          '旅行中遇到过什么有趣的人或事？'
        ],
        'relationships': [
          '您生命中最重要的朋友是谁？',
          '有没有改变您人生轨迹的重要遇见？',
          '您如何维系长久的友谊？'
        ],
        'laterlife': [
          '退休后的生活是什么样的？',
          '晚年最大的快乐来源是什么？',
          '对于衰老您有什么感受？'
        ],
        'wisdom': [
          '人生中最重要的感悟是什么？',
          '如果重新来过，您会做出不同的选择吗？',
          '您希望给年轻人什么建议？'
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
    
    async saveChapter() {
      try {
        // 检查用户是否登录
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'error'
          });
          return;
        }

        // 显示加载状态
        uni.showLoading({
          title: '保存中...'
        });

        // 准备要保存的数据
        const saveData = {
          chapterId: this.chapterId,
          title: this.chapterTitle,
          content: this.contentText,
          recordings: this.recordings
        };

        // 调用后端API保存章节
        const response = await uni.request({
          url: 'http://106.15.248.189:3001/api/chapters/save',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: saveData
        });

        uni.hideLoading();

        if (response.statusCode === 200 && response.data.success) {
          // 同时更新本地存储（用于离线查看）
          const content = {
            text: this.contentText,
            recordings: this.recordings,
            lastModified: new Date().toISOString(),
            completed: this.contentText.length > 0 || this.recordings.length > 0
          };
          
          uni.setStorageSync(`chapter_${this.chapterId}`, JSON.stringify(content));
          
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
          
          // 保存成功后延迟跳转回去
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error(response.data?.message || '保存失败');
        }
      } catch (error) {
        uni.hideLoading();
        console.error('保存章节失败:', error);
        
        // 如果是网络错误，尝试本地保存
        if (error.errMsg && error.errMsg.includes('network')) {
          try {
            const content = {
              text: this.contentText,
              recordings: this.recordings,
              lastModified: new Date().toISOString(),
              completed: this.contentText.length > 0 || this.recordings.length > 0,
              needSync: true // 标记需要同步到服务器
            };
            
            uni.setStorageSync(`chapter_${this.chapterId}`, JSON.stringify(content));
            
            uni.showToast({
              title: '已离线保存',
              icon: 'success'
            });
            
            // 离线保存成功后延迟跳转回去
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } catch (localError) {
            uni.showToast({
              title: '保存失败',
              icon: 'error'
            });
          }
        } else {
          uni.showToast({
            title: error.message || '保存失败',
            icon: 'error'
          });
        }
      }
    },

    // 切换录音状态
    toggleRecording() {
      console.log('🎯 点击录制按钮，当前状态:', this.isRecording);
      
      if (this.isRecording) {
        console.log('🛑 停止录音');
        this.stopRecording();
      } else {
        console.log('🎤 开始录音');
        this.startRecording();
      }
    },
    
    async startRecording(event) {
      if (this.isProcessing) return;
      
      // 防止事件影响页面滚动
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      this.isRecording = true;
      this.recordingTime = 0;
      
      // 开始计时
      this.recordingTimer = setInterval(() => {
        this.recordingTime++;
      }, 1000);
      
      console.log('🎤 开始录音...');
      console.log('运行环境:', uni.getSystemInfoSync().platform);
      
      // 检测浏览器环境并使用Web录音
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('🌐 检测到浏览器环境，使用Web录音...');
        await this.startWebRecording();
      } else if (typeof uni !== 'undefined' && typeof uni.startRecord === 'function') {
        console.log('📱 检测到App环境，使用uni录音...');
        uni.startRecord({
          success: (res) => {
            console.log('✅ App录音开始成功');
          },
          fail: (err) => {
            console.error('❌ App录音开始失败:', err);
            this.handleRecordingFallback();
          }
        });
      } else {
        console.log('⚠️ 当前环境不支持录音API');
        this.handleRecordingFallback();
      }
      
      uni.showToast({
        title: '开始录制',
        icon: 'none'
      });
    },

    async startWebRecording() {
      try {
        console.log('🌐 开始Web录音...');
        
        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000
          } 
        });
        this.mediaStream = stream;
        
        // 检查浏览器支持的mime类型
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = ''; // 使用默认
            }
          }
        }
        
        console.log('使用MIME类型:', mimeType);
        
        // 创建MediaRecorder
        this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
          console.log('收到音频数据:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstop = () => {
          console.log('✅ Web录音停止，数据块数量:', this.audioChunks.length);
          if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
            console.log('音频Blob大小:', audioBlob.size, 'bytes');
            this.processWebAudio(audioBlob);
          } else {
            console.error('❌ 没有录音数据');
            this.handleRecordingError('录音数据为空');
          }
        };
        
        this.mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder错误:', event.error);
          this.handleRecordingError('录音过程中出错');
        };
        
        // 开始录音
        this.mediaRecorder.start(100); // 每100ms收集一次数据
        console.log('✅ Web录音开始成功, 状态:', this.mediaRecorder.state);
        
      } catch (error) {
        console.error('❌ Web录音开始失败:', error);
        
        let errorMessage = '无法访问麦克风';
        if (error.name === 'NotAllowedError') {
          errorMessage = '麦克风权限被拒绝';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到麦克风设备';
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'error'
        });
        this.handleRecordingFallback();
      }
    },
    
    handleRecordingFallback() {
      console.log('🔄 录音API不可用，使用降级处理');
      this.isRecording = false;
      this.isProcessing = false;
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      uni.showToast({
        title: '当前环境不支持录音',
        icon: 'error'
      });
    },
    
    stopRecording(event) {
      if (!this.isRecording) return;
      
      // 确保事件不影响页面滚动
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      this.isRecording = false;
      this.isProcessing = true;
      
      // 停止计时
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      // 确保页面滚动恢复正常
      this.$nextTick(() => {
        // 强制触发页面重新渲染
        this.$forceUpdate();
      });
      
      console.log('🛑 停止录音...');
      
      // 检测环境并停止录音
      if (this.mediaRecorder || this.mediaStream) {
        console.log('🌐 停止Web录音...');
        this.stopWebRecording();
      } else if (typeof uni !== 'undefined' && typeof uni.stopRecord === 'function') {
        console.log('📱 停止App录音...');
        uni.stopRecord({
          success: (res) => {
            console.log('✅ App录音停止成功，文件路径:', res.tempFilePath);
            this.handleRecordingSuccess(res.tempFilePath);
          },
          fail: (err) => {
            console.error('❌ App录音停止失败:', err);
            this.handleRecordingError('录音停止失败');
          }
        });
      } else {
        console.log('⚠️ 当前环境不支持录音API');
        this.handleRecordingError('录音API不可用');
      }
    },

    stopWebRecording() {
      try {
        console.log('🌐 停止Web录音...');
        console.log('MediaRecorder状态:', this.mediaRecorder?.state);
        
        if (this.mediaRecorder) {
          if (this.mediaRecorder.state === 'recording') {
            console.log('停止MediaRecorder...');
            this.mediaRecorder.stop();
          } else if (this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.mediaRecorder.stop();
          }
        }
        
        // 停止所有音频轨道
        if (this.mediaStream) {
          console.log('停止媒体流...');
          this.mediaStream.getTracks().forEach(track => {
            console.log('停止轨道:', track.kind);
            track.stop();
          });
        }
        
      } catch (error) {
        console.error('❌ 停止Web录音失败:', error);
        this.handleRecordingError('停止录音失败');
      }
    },

    async processWebAudio(audioBlob) {
      try {
        console.log('🎵 处理Web录音数据...', audioBlob.size, 'bytes');
        console.log('🎵 音频Blob类型:', audioBlob.type);
        
        // 根据Blob类型确定文件扩展名
        let extension = '.webm';
        let mimeType = audioBlob.type || 'audio/webm';
        
        if (mimeType.includes('webm')) {
          extension = '.webm';
        } else if (mimeType.includes('mp4')) {
          extension = '.mp4';
        } else if (mimeType.includes('wav')) {
          extension = '.wav';
        } else if (mimeType.includes('ogg')) {
          extension = '.ogg';
        }
        
        // 创建带正确扩展名和MIME类型的File对象
        const timestamp = Date.now();
        const fileName = `web_recording_${timestamp}${extension}`;
        
        const audioFile = new File([audioBlob], fileName, { 
          type: mimeType
        });
        
        console.log('📁 创建音频文件:', {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type
        });
        
        // 直接上传到后端
        await this.uploadWebAudio(audioFile);
        
      } catch (error) {
        console.error('❌ 处理Web音频失败:', error);
        this.handleRecordingError('音频处理失败');
      }
    },

    async uploadWebAudio(audioFile) {
      try {
        console.log('📤 上传Web录音文件...');
        
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
        // 创建FormData
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        // 使用原生fetch上传文件
        const response = await fetch('http://106.15.248.189:3001/api/speech/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('✅ Web音频上传成功:', result.data);
          
          // 创建录音记录
          const newRecording = {
            id: Date.now(),
            duration: this.recordingTime,
            filePath: result.data.file.filename,
            transcription: '',
            playing: false,
            isWebAudio: true
          };
          
          this.recordings.push(newRecording);
          this.isProcessing = false;
          this.recordingTime = 0;
          
          uni.showToast({
            title: '录制完成，正在转换文字...',
            icon: 'success'
          });
          
          // 获取Token并调用语音识别
          setTimeout(() => {
            this.transcribeRecording(newRecording);
          }, 500);
          
        } else {
          throw new Error(result.message || '上传失败');
        }
        
      } catch (error) {
        console.error('❌ Web音频上传失败:', error);
        this.handleRecordingError(`上传失败: ${error.message}`);
      }
    },
    
    handleRecordingSuccess(filePath) {
      console.log('📁 处理录音文件:', filePath);
      
      const newRecording = {
        id: Date.now(),
        duration: this.recordingTime,
        filePath: filePath,
        transcription: '',
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
    },
    
    handleRecordingError(errorMessage) {
      console.error('❌ 录音处理失败:', errorMessage);
      this.isRecording = false;
      this.isProcessing = false;
      this.recordingTime = 0;
      
      uni.showToast({
        title: errorMessage || '录音失败',
        icon: 'error'
      });
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
    
    async transcribeRecording(recording) {
      try {
        // 转录录音为文字
        uni.showLoading({
          title: '语音转文字中...'
        });

        // 获取用户Token
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }

        // 获取阿里云语音识别Token
        console.log('正在获取阿里云语音识别Token...');
        const tokenResponse = await uni.request({
          url: 'http://106.15.248.189:3001/api/speech/token',
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Token响应:', tokenResponse);

        if (tokenResponse.statusCode !== 200 || !tokenResponse.data.success) {
          throw new Error(tokenResponse.data?.message || '获取语音识别Token失败');
        }

        const speechToken = tokenResponse.data.data.token;
        console.log('成功获取阿里云Token:', speechToken.substring(0, 20) + '...');

        // 如果有录音文件，处理语音识别
        if (recording && recording.filePath) {
          console.log('📁 开始处理录音文件:', recording.filePath);
          
          try {
            // 检查是否为Web录音（已经上传过的）
            if (recording.isWebAudio) {
              console.log('🌐 Web录音文件，直接调用转写API...');
              // Web录音文件已经上传，直接调用转写
              await this.callTranscribeAPI(recording, speechToken, recording.filePath);
            } else {
              console.log('📤 准备上传音频文件进行阿里云识别...');
              // App录音或其他情况，需要先上传
              const uploadResult = await this.uploadAudioFile(recording.filePath, token);
              console.log('✅ 音频文件上传成功:', uploadResult);
              
              // 调用转写API
              await this.callTranscribeAPI(recording, speechToken, uploadResult.file.filename);
            }
            
          } catch (error) {
            console.error('❌ 音频处理失败:', error);
            uni.hideLoading();
            uni.showToast({
              title: '语音识别失败: ' + (error.message || '未知错误'),
              icon: 'error',
              duration: 3000
            });
          }
          
        } else {
          throw new Error('没有找到录音文件');
        }
        
      } catch (error) {
        uni.hideLoading();
        console.error('❌ 语音转文字失败:', error);
        
        // 显示具体的错误信息
        const errorMessage = error.message || '语音转文字失败';
        uni.showToast({
          title: errorMessage,
          icon: 'error',
          duration: 3000
        });
      }
    },

    async uploadAudioFile(filePath, token) {
      try {
        console.log('准备上传音频文件:', filePath);
        
        const uploadResponse = await uni.uploadFile({
          url: 'http://106.15.248.189:3001/api/speech/upload',
          filePath: filePath,
          name: 'audio',
          header: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('音频上传响应:', uploadResponse);

        if (uploadResponse.statusCode === 200) {
          const result = JSON.parse(uploadResponse.data);
          if (result.success) {
            console.log('✅ 音频文件上传成功:', result.data);
            return result.data;
          } else {
            throw new Error(result.message || '音频上传失败');
          }
        } else {
          throw new Error(`上传失败，状态码: ${uploadResponse.statusCode}`);
        }
      } catch (error) {
        console.error('❌ 音频文件上传失败:', error);
        throw error;
      }
    },

    async performRealSpeechRecognition(recording, speechToken, uploadResult) {
      try {
        console.log('🎯 开始真实语音识别处理...');
        console.log('📁 音频文件:', uploadResult.file.filename);
        console.log('🔑 Token:', speechToken.substring(0, 20) + '...');
        
        // 获取用户Token
        const token = uni.getStorageSync('token');
        
        // 调用真实的阿里云语音识别接口
        const transcribeResponse = await uni.request({
          url: 'http://106.15.248.189:3001/api/speech/transcribe',
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            filename: uploadResult.file.filename
          }
        });

        console.log('转写响应:', transcribeResponse);

        if (transcribeResponse.statusCode === 200 && transcribeResponse.data.success) {
          const transcribedText = transcribeResponse.data.data.transcript;
          recording.transcription = transcribedText;
          
          // 将转录文本添加到文本输入框
          if (this.contentText) {
            this.contentText += '\n\n' + transcribedText;
          } else {
            this.contentText = transcribedText;
          }
          
          uni.hideLoading();
          uni.showToast({
            title: '语音转文字完成',
            icon: 'success'
          });
          
          console.log('✅ 阿里云语音识别完成！');
          console.log('📄 转录文本:', transcribedText);
          console.log('⏰ 转写时间:', transcribeResponse.data.data.transcribedAt);
          
        } else {
          throw new Error(transcribeResponse.data?.message || '语音识别请求失败');
        }
        
      } catch (error) {
        console.error('❌ 真实语音识别失败:', error);
        throw error; // 不再降级，直接抛出错误
      }
    },

    async callTranscribeAPI(recording, speechToken, filename) {
      try {
        console.log('🎯 开始阿里云语音识别...');
        console.log('📁 音频文件:', filename);
        console.log('🔑 Token:', speechToken.substring(0, 20) + '...');
        
        // 获取用户Token
        const token = uni.getStorageSync('token');
        
        // 调用真实的转写API（不使用测试模式）
        const transcribeResponse = await uni.request({
          url: 'http://106.15.248.189:3001/api/speech/transcribe',
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            filename: filename,
            testMode: false // 明确指定不是测试模式
          }
        });

        console.log('转写响应:', transcribeResponse);

        if (transcribeResponse.statusCode === 200 && transcribeResponse.data.success) {
          const transcribedText = transcribeResponse.data.data.transcript;
          recording.transcription = transcribedText;
          
          // 将转录文本添加到文本输入框
          if (this.contentText) {
            this.contentText += '\n\n' + transcribedText;
          } else {
            this.contentText = transcribedText;
          }
          
          uni.hideLoading();
          uni.showToast({
            title: '语音转文字完成',
            icon: 'success'
          });
          
          console.log('✅ 阿里云语音识别完成！');
          console.log('📄 转录文本:', transcribedText);
          console.log('⏰ 转写时间:', transcribeResponse.data.data.transcribedAt);
          
        } else {
          const errorMsg = transcribeResponse.data?.message || transcribeResponse.data?.details || '语音识别请求失败';
          console.error('❌ 转写API响应错误:', transcribeResponse);
          throw new Error(errorMsg);
        }
        
      } catch (error) {
        console.error('❌ 阿里云语音识别失败:', error);
        throw error;
      }
    },

    async fallbackSpeechRecognition(recording, speechToken) {
      try {
        console.log('🎯 执行降级语音识别...');
        
        const sampleTexts = [
          '我出生在一个小城市，那里有着宁静的街道和温暖的邻里关系。',
          '童年时最难忘的是和小伙伴们在院子里玩耍的美好时光。',
          '那时候的生活虽然简单，但充满了纯真的快乐和无忧无虑。',
          '家里的老房子虽然不大，但承载着我们一家人温馨的回忆。',
          '父母亲都是勤劳朴实的人，他们用自己的方式为我们撑起了一个温暖的家。'
        ];
        
        // 模拟识别处理时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const transcribedText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        recording.transcription = transcribedText;
        
        // 将转录文本添加到文本输入框
        if (this.contentText) {
          this.contentText += '\n\n' + transcribedText;
        } else {
          this.contentText = transcribedText;
        }
        
        uni.hideLoading();
        uni.showToast({
          title: '语音转文字完成（降级模式）',
          icon: 'success'
        });
        
        console.log('✅ 降级语音识别完成！');
        console.log('📄 转录文本:', transcribedText);
        
      } catch (error) {
        console.error('❌ 降级语音识别失败:', error);
        throw error;
      }
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
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.save-text {
  color: #333;
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
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 32px;
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
  padding: 16px 16px 16px 16px;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: transparent;
  resize: none;
  border-left: 3px solid #e0e0e0;
  box-sizing: border-box;
}

.text-input:focus {
  border-left-color: #007AFF;
}

.voice-control-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  touch-action: manipulation;
  user-select: none;
}

.record-btn.recording {
  background: rgba(255, 59, 48, 0.1);
  border-color: #FF3B30;
  box-shadow: 0 4px 20px rgba(255, 59, 48, 0.2);
  animation: pulse 2s infinite;
}

.record-btn.processing {
  background: rgba(255, 149, 0, 0.1);
  border-color: #FF9500;
  box-shadow: 0 4px 20px rgba(255, 149, 0, 0.2);
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
    width: 60px;
    height: 60px;
  }
  
  .record-icon {
    font-size: 28px;
  }
}
</style>
