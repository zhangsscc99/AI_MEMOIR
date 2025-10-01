<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">{{ viewMode ? '查看随记' : (editMode ? '编辑随记' : '新随记') }}</view>
      <view class="save-btn" @click="saveDiary">
        <text class="save-text">保存</text>
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
          <image :src="selectedImage.startsWith('http') ? selectedImage : getOptimalImagePath(selectedImage)" class="preview-image" mode="aspectFill"></image>
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

        <!-- 录音和AI补全按钮 -->
        <view class="recording-controls">
          <view class="control-buttons">
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
            
            <!-- AI补全按钮 -->
            <view class="ai-complete-btn-container">
              <view 
                class="ai-complete-btn" 
                @click="aiCompleteText"
                :class="{ 'loading': isAiCompleting }"
              >
                <view class="ai-icon" v-if="!isAiCompleting">
                  <image src="/static/icons/chat.svg" class="ai-icon-img" mode="aspectFit"></image>
                </view>
                <view class="ai-loading" v-else>
                  <view class="loading-dot" v-for="i in 3" :key="i"></view>
                </view>
              </view>
              <text class="ai-complete-text">AI补全</text>
            </view>
          </view>
        </view>

        <!-- AI补全结果显示 -->
        <view class="ai-complete-result" v-if="showAiDiff">
          <view class="diff-header">
            <text class="diff-title">AI补全结果</text>
            <text class="diff-subtitle">请选择是否接受AI的修改</text>
          </view>
          
          <view class="diff-content">
            <!-- AI补全内容（绿色背景） -->
            <view class="diff-ai">
              <view class="diff-label">AI补全结果</view>
              <view class="diff-text ai-text">{{ aiCompletedText }}</view>
            </view>
          </view>
          
          <!-- 选择按钮 -->
          <view class="diff-actions">
            <view class="diff-btn reject-btn" @click="rejectAiCompletion">
              <image src="/static/icons/close.svg" class="btn-icon" mode="aspectFit"></image>
            </view>
            <view class="diff-btn accept-btn" @click="acceptAiCompletion">
              <image src="/static/icons/check.svg" class="btn-icon" mode="aspectFit"></image>
            </view>
          </view>
        </view>

      </view>
    </view>
  </view>
</template>

<script>
// 导入 API 配置工具
import { apiUrl } from '@/utils/apiConfig.js';

// 导入图片路径优化工具
import { getOptimalImagePath } from '@/utils/imageMapping.js';
export default {
  data() {
    return {
      // 编辑模式相关
      editMode: false,
      viewMode: false,
      editChapterId: '',
      diaryTitle: '',
      diaryContent: '',
      selectedImage: '',
      isRecording: false,
      recordingTime: 0,
      recordings: [],
      recordingTimer: null,
      waveform: [],
      maxRecordingTime: 600, // 10分钟
      recorderManager: null,
      // Web录音相关
      mediaRecorder: null,
      mediaStream: null,
      audioChunks: [],
      // 实时语音识别相关
      realtimeRecognitionTimer: null,
      speechRecognition: null,
      // AI补全相关
      isAiCompleting: false,
      showAiDiff: false,
      originalText: '',
      aiCompletedText: ''
    };
  },

  onLoad(options) {
    console.log('📱 随记编辑页面加载', options);
    
    // 先设置模式
    if (options.chapterId && options.mode === 'edit') {
      this.editMode = true;
      this.editChapterId = options.chapterId;
      this.diaryTitle = decodeURIComponent(options.title || '随记');
      this.loadExistingDiary();
    } else if (options.chapterId && options.mode === 'view') {
      this.viewMode = true;
      this.editChapterId = options.chapterId;
      this.diaryTitle = decodeURIComponent(options.title || '随记');
      this.loadExistingDiary();
    }
    
    // 初始化录音功能
    this.initRecorderManager();
    this.generateWaveform();
  },

  onUnload() {
    this.stopRecording();
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
    // 清理实时识别
    if (this.realtimeRecognitionTimer) {
      clearInterval(this.realtimeRecognitionTimer);
    }
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    // 清理Web录音资源
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
    }
  },

  methods: {
    // 暴露图片路径优化函数
    getOptimalImagePath,
    
    // 加载现有随记数据（编辑模式）
    async loadExistingDiary() {
      // 如果是样板案例，使用默认数据
      if (this.editChapterId.startsWith('sample_')) {
        console.log('📖 加载样板案例数据');
        this.diaryTitle = '春节舞狮子';
        this.diaryContent = '舞狮子是中国传统民间艺术，在春节期间尤为盛行。狮子象征着威武和吉祥，舞狮表演寓意驱邪避害、祈求平安。表演者需要配合默契，通过精湛的技艺展现狮子的威武和灵动，为节日增添喜庆氛围。';
        this.selectedImage = '/src/images/lion.png';
        this.recordings = [];
        console.log('✅ 样板案例数据加载完成');
        return;
      }

      try {
        console.log('🔄 加载现有随记数据...', this.editChapterId);
        
        // 优先使用本地存储的数据
        const localDiary = uni.getStorageSync('currentDiary');
        if (localDiary && (localDiary.id === this.editChapterId || localDiary.chapterId === this.editChapterId)) {
          console.log('📖 使用本地存储的随记数据:', localDiary);
          
          // 填充表单数据
          this.diaryTitle = localDiary.title || '随记';
          this.diaryContent = localDiary.content || '';
          this.selectedImage = localDiary.image || '';
          
          // 如果有录音数据，恢复录音列表
          if (localDiary.recordings && Array.isArray(localDiary.recordings)) {
            this.recordings = localDiary.recordings.map(recording => ({
              ...recording,
              playing: false // 重置播放状态
            }));
          }
          
          console.log('✅ 随记数据加载完成（本地）');
          return;
        }
        
        // 如果本地没有数据，尝试从后端获取
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('❌ 未登录，无法加载随记数据');
          return;
        }
        
        // 从后端获取指定章节的详细数据
        const response = await uni.request({
          url: apiUrl(`/chapters/${this.editChapterId}`),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 随记详情响应:', response);
        
        if (response.statusCode === 200 && response.data.success) {
          const chapterData = response.data.data;
          console.log('📖 加载的随记数据:', chapterData);
          
          // 填充表单数据
          this.diaryTitle = chapterData.title || '随记';
          this.diaryContent = chapterData.content || '';
          this.selectedImage = chapterData.backgroundImage || '';
          
          // 如果有录音数据，恢复录音列表
          if (chapterData.recordings && Array.isArray(chapterData.recordings)) {
            this.recordings = chapterData.recordings.map(recording => ({
              ...recording,
              playing: false // 重置播放状态
            }));
          }
          
          console.log('✅ 随记数据加载完成');
        } else {
          console.log('❌ 获取随记详情失败:', response.data);
          uni.showToast({
            title: '加载随记失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('❌ 加载随记数据出错:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    },
    
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
      // #ifdef APP-PLUS
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
      
      // #ifdef H5
      console.log('H5环境，使用Web录音API');
      // H5环境使用Web MediaRecorder API，不需要初始化uni.getRecorderManager
      // #endif
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

    // 开始录音
    async startRecording() {
      if (this.recordings.length >= 5) {
        uni.showToast({
          title: '最多录制5段音频',
          icon: 'none'
        });
        return;
      }

      console.log('🎤 开始录音...');
      
      // 检测浏览器环境并使用Web录音
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('🌐 检测到浏览器环境，使用Web录音...');
        await this.startWebRecording();
      } else {
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
      }
    },

    // 停止录音
    stopRecording() {
      if (!this.isRecording) return;

      console.log('🛑 停止录音...');
      
      // 检测环境并停止录音
      if (this.mediaRecorder || this.mediaStream) {
        console.log('🌐 停止Web录音...');
        this.stopWebRecording();
      } else {
        // #ifdef APP-PLUS || H5
        this.recorderManager.stop();
        // #endif

        // #ifdef MP-WEIXIN
        wx.stopRecord();
        this.isRecording = false;
        this.stopRecordingTimer();
        // #endif
      }
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

    // Web录音开始
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
              mimeType = '';
            }
          }
        }
        
        // 创建MediaRecorder
        this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
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
            uni.showToast({
              title: '录音数据为空',
              icon: 'error'
            });
          }
        };
        
        this.mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder错误:', event.error);
          uni.showToast({
            title: '录音过程中出错',
            icon: 'error'
          });
        };
        
        // 开始录音
        this.mediaRecorder.start(2000); // 每2秒收集一次数据
        console.log('✅ Web录音开始成功, 状态:', this.mediaRecorder.state);
        
        // 开始实时语音识别
        this.startRealtimeRecognition();
        
        // 设置录音状态
        this.isRecording = true;
        this.startRecordingTimer();
        
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
      }
    },

    // Web录音停止
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
            track.stop();
          });
        }
        
        // 停止实时识别
        if (this.realtimeRecognitionTimer) {
          clearInterval(this.realtimeRecognitionTimer);
          this.realtimeRecognitionTimer = null;
        }
        
        // 停止Web Speech API识别
        if (this.speechRecognition) {
          this.speechRecognition.stop();
          this.speechRecognition = null;
        }
        
        // 设置录音状态
        this.isRecording = false;
        this.stopRecordingTimer();
        
      } catch (error) {
        console.error('❌ 停止Web录音失败:', error);
        uni.showToast({
          title: '停止录音失败',
          icon: 'error'
        });
      }
    },

    // 处理Web录音数据
    async processWebAudio(audioBlob) {
      try {
        console.log('🎵 处理Web录音数据...', audioBlob.size, 'bytes');
        
        // 先上传录音文件
        const uploadedFile = await this.uploadWebAudio(audioBlob);
        
        // 重置录音时间
        this.recordingTime = 0;
        
        uni.showToast({
          title: '录制完成',
          icon: 'success'
        });
        
      } catch (error) {
        console.error('❌ 处理Web录音失败:', error);
        uni.showToast({
          title: '处理录音失败',
          icon: 'error'
        });
      }
    },

    // 上传Web录音文件
    async uploadWebAudio(audioBlob) {
      try {
        console.log('📤 上传Web录音文件...');
        
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
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
        const fileName = `diary_recording_${timestamp}${extension}`;
        
        const audioFile = new File([audioBlob], fileName, { 
          type: mimeType
        });
        
        // 创建FormData
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        // 使用原生fetch上传文件
        const response = await fetch(apiUrl('/speech/upload'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`上传失败: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ 录音文件上传成功:', result.data.file);
          return result.data.file;
        } else {
          throw new Error(result.message || '上传失败');
        }
        
      } catch (error) {
        console.error('❌ 上传录音文件失败:', error);
        throw error;
      }
    },

    // 实时语音识别
    async startRealtimeRecognition() {
      try {
        console.log('🎤 开始实时语音识别...');
        
        // 检查浏览器是否支持Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          console.log('🌐 使用Web Speech API进行实时识别');
          this.startWebSpeechRecognition();
        } else {
          console.log('📡 使用百度语音识别');
          await this.startBaiduRealtimeRecognition();
        }
      } catch (error) {
        console.error('❌ 实时语音识别启动失败:', error);
      }
    },

    // Web Speech API实时识别
    startWebSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'zh-CN';
      
      this.speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // 更新内容区域
        if (finalTranscript) {
          console.log('✅ 最终识别结果:', finalTranscript);
          if (this.diaryContent.trim()) {
            this.diaryContent += ' ' + finalTranscript;
          } else {
            this.diaryContent = finalTranscript;
          }
        } else if (interimTranscript) {
          console.log('🎯 中间识别结果:', interimTranscript);
        }
      };
      
      this.speechRecognition.onerror = (event) => {
        console.error('❌ Web Speech API错误:', event.error);
      };
      
      this.speechRecognition.onend = () => {
        console.log('Web Speech API识别结束');
      };
      
      this.speechRecognition.start();
      console.log('✅ Web Speech API开始识别');
    },

    // 百度实时识别
    async startBaiduRealtimeRecognition() {
      // 获取用户Token
      const token = uni.getStorageSync('token');
      if (!token) {
        console.error('❌ 用户未登录，无法进行实时识别');
        return;
      }

      try {
        // 获取语音识别Token
        const tokenResponse = await uni.request({
          url: apiUrl('/speech/token'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (tokenResponse.statusCode !== 200 || !tokenResponse.data.success) {
          throw new Error('获取语音识别Token失败');
        }

        const speechToken = tokenResponse.data.data.token;
        console.log('✅ 获取语音识别Token成功');
        
        // 设置实时识别定时器
        this.realtimeRecognitionTimer = setInterval(() => {
          this.performRealtimeRecognition(speechToken);
        }, 3000); // 每3秒进行一次识别
      } catch (error) {
        console.error('❌ 百度实时识别启动失败:', error);
      }
    },

    // 执行实时语音识别
    async performRealtimeRecognition(speechToken) {
      if (!this.isRecording || this.audioChunks.length === 0) {
        return;
      }

      try {
        // 获取最新的音频数据
        const latestChunk = this.audioChunks[this.audioChunks.length - 1];
        if (!latestChunk || latestChunk.size === 0) {
          return;
        }

        console.log('🎯 执行实时识别，音频大小:', latestChunk.size);

        // 创建FormData
        const formData = new FormData();
        const audioFile = new File([latestChunk], 'audio.webm', { type: 'audio/webm' });
        formData.append('audio', audioFile);

        // 调用实时识别API
        const response = await fetch(apiUrl('/speech/transcribe'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${uni.getStorageSync('token')}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.transcript) {
            const transcribedText = result.data.transcript;
            console.log('✅ 实时识别结果:', transcribedText);
            
            // 将识别结果添加到内容区域
            if (this.diaryContent.trim()) {
              this.diaryContent += ' ' + transcribedText;
            } else {
              this.diaryContent = transcribedText;
            }
          }
        }
      } catch (error) {
        console.error('❌ 实时识别失败:', error);
      }
    },

    // AI补全文本
    async aiCompleteText() {
      try {
        if (!this.diaryContent || this.diaryContent.trim().length === 0) {
          uni.showToast({
            title: '请先输入内容',
            icon: 'none'
          });
          return;
        }

        this.isAiCompleting = true;
        this.originalText = this.diaryContent;

        console.log('🤖 开始AI补全文本...');
        
        // 获取用户Token
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }

        const response = await uni.request({
          url: apiUrl('/ai/complete-text'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            text: this.diaryContent,
            chapterId: this.editChapterId,
            chapterTitle: this.diaryTitle || '随记'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          this.aiCompletedText = response.data.data.completedText;
          this.showAiDiff = true;
          
          console.log('✅ AI补全成功');
        } else {
          throw new Error(response.data?.message || 'AI补全失败');
        }
      } catch (error) {
        console.error('❌ AI补全失败:', error);
        uni.showToast({
          title: error.message || 'AI补全失败',
          icon: 'error'
        });
      } finally {
        this.isAiCompleting = false;
      }
    },

    // 接受AI补全
    acceptAiCompletion() {
      this.diaryContent = this.aiCompletedText;
      this.showAiDiff = false;
      this.originalText = '';
      this.aiCompletedText = '';
      
      uni.showToast({
        title: '已应用AI补全',
        icon: 'success'
      });
    },

    // 拒绝AI补全
    rejectAiCompletion() {
      this.showAiDiff = false;
      this.originalText = '';
      this.aiCompletedText = '';
      
      uni.showToast({
        title: '已取消AI补全',
        icon: 'none'
      });
    },

    // 语音识别
    async transcribeRecording(recording) {
      try {
        console.log('🎯 开始语音识别:', recording.filePath);
        
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
        // 调用语音识别API
        const response = await uni.request({
          url: apiUrl('/speech/transcribe'),
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: {
            filename: recording.filePath
          }
        });
        
        if (response.statusCode === 200 && response.data.success) {
          const transcript = response.data.data.transcript;
          console.log('✅ 语音识别成功:', transcript);
          
          // 更新录音的转录文本
          recording.transcription = transcript;
          
          // 如果有识别结果，自动添加到内容区域
          if (transcript && transcript.trim()) {
            if (this.diaryContent.trim()) {
              this.diaryContent += '\n\n' + transcript;
            } else {
              this.diaryContent = transcript;
            }
            
            uni.showToast({
              title: '语音转文字成功',
              icon: 'success'
            });
          }
          
        } else {
          throw new Error(response.data?.message || '语音识别失败');
        }
        
      } catch (error) {
        console.error('❌ 语音识别失败:', error);
        uni.showToast({
          title: '语音转文字失败',
          icon: 'error'
        });
      }
    },

    // 上传图片到服务器
    async uploadImageToServer(blobUrl) {
      try {
        console.log('📤 开始上传图片:', blobUrl);
        
        // 将blob URL转换为File对象
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        
        // 创建FormData
        const formData = new FormData();
        const fileName = `diary_image_${Date.now()}.jpg`;
        // 确保blob有正确的MIME类型
        const imageBlob = new Blob([blob], { type: 'image/jpeg' });
        formData.append('image', imageBlob, fileName);
        
        // 获取token
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }
        
        // 上传到服务器
        const uploadResponse = await fetch(apiUrl('/upload/image'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`上传失败: ${uploadResponse.status}`);
        }
        
        const result = await uploadResponse.json();
        console.log('✅ 图片上传成功:', result);
        
        // 返回服务器上的图片URL
        return result.data.url || result.url;
        
      } catch (error) {
        console.error('❌ 图片上传失败:', error);
        throw error;
      }
    },

    // 保存随记
    async saveDiary() {
      // 如果是查看模式，先切换到编辑模式
      if (this.viewMode) {
        this.viewMode = false;
        this.editMode = true;
        // 不返回，继续执行保存逻辑
      }

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
        // 检查用户是否登录
        const token = uni.getStorageSync('token');
        console.log('🔑 用户token:', token ? '已获取' : '未找到');
        
        if (!token) {
          uni.hideLoading();
          uni.showToast({
            title: '请先登录',
            icon: 'error'
          });
          
          // 跳转到登录页面
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/index'
            });
          }, 1500);
          return;
        }

        // 生成或使用现有的章节ID
        let customChapterId;
        if (this.editMode) {
          // 如果是样板案例，生成新的ID
          if (this.editChapterId.startsWith('sample_')) {
            customChapterId = 'diary_' + Date.now();
            console.log('📝 样板案例保存为新随记，生成新ID:', customChapterId);
          } else {
            customChapterId = this.editChapterId;
            console.log('📝 编辑现有随记，使用原ID:', customChapterId);
          }
        } else {
          customChapterId = 'diary_' + Date.now();
          console.log('📝 新建随记，生成新ID:', customChapterId);
        }
        
        // 处理图片上传
        let backgroundImage = '/src/images/default-diary.svg'; // 默认图片
        if (this.selectedImage) {
          try {
            // 如果是blob URL，需要上传到服务器
            if (this.selectedImage.startsWith('blob:')) {
              backgroundImage = await this.uploadImageToServer(this.selectedImage);
            } else {
              // 如果是其他格式，直接使用
              backgroundImage = this.selectedImage;
            }
          } catch (error) {
            console.error('图片上传失败:', error);
            // 如果上传失败，使用默认图片
            backgroundImage = '/src/images/default-diary.svg';
          }
        }

        // 准备保存为回忆录章节的数据
        const chapterData = {
          chapterId: customChapterId,
          title: this.diaryTitle.trim(),
          content: this.diaryContent.trim(),
          recordings: this.recordings,
          backgroundImage: backgroundImage // 上传的图片作为章节背景图
        };

        console.log('📤 发送章节数据:', chapterData);

        // 调用回忆录章节保存API
        const response = await uni.request({
          url: apiUrl('/chapters/save'),
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: chapterData
        });

        uni.hideLoading();
        
        console.log('📊 保存响应:', response);
        console.log('📊 响应状态码:', response.statusCode);
        console.log('📊 响应数据:', response.data);
        
        // 如果有错误，显示详细的验证错误
        if (response.data && response.data.errors) {
          console.log('❌ 验证错误详情:', response.data.errors);
          response.data.errors.forEach((error, index) => {
            console.log(`❌ 错误 ${index + 1}:`, error);
          });
        }

        if (response.statusCode === 200 && response.data.success) {
          // 同时保存到本地存储（用于离线查看和章节列表显示）
          const localChapterData = {
            id: customChapterId,
            title: this.diaryTitle.trim(),
            description: '自定义随记章节',
            backgroundImage: this.selectedImage || '/src/images/story1.png',
            completed: true,
            isCustom: true, // 标记为自定义章节
            content: this.diaryContent.trim(),
            recordings: this.recordings,
            createTime: Date.now(),
            lastModified: new Date().toISOString()
          };

          // 获取当前用户ID
          const userInfo = uni.getStorageSync('user');
          const userId = userInfo?.id;
          
          if (userId) {
            // 保存到用户特定的本地章节状态
            uni.setStorageSync(`chapter_${customChapterId}_${userId}`, JSON.stringify({
              text: this.diaryContent.trim(),
              recordings: this.recordings,
              lastModified: new Date().toISOString(),
              completed: true
            }));

            // 更新用户特定的章节状态映射
            const savedStatus = uni.getStorageSync(`chapter_status_${userId}`) || '{}';
            const statusMap = JSON.parse(savedStatus);
            statusMap[customChapterId] = {
              completed: true,
              lastModified: new Date().toISOString()
            };
            uni.setStorageSync(`chapter_status_${userId}`, JSON.stringify(statusMap));

            // 添加到用户特定的自定义章节列表（用于首页和章节页显示）
            const customChapters = uni.getStorageSync(`custom_chapters_${userId}`) || [];
            customChapters.unshift(localChapterData);
            uni.setStorageSync(`custom_chapters_${userId}`, customChapters);
          }

          uni.showToast({
            title: '保存成功',
            icon: 'success'
          });

          // 延迟跳转回随记列表
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);

        } else {
          console.error('❌ 保存失败详情:', response.data);
          const errorMessage = response.data?.message || `保存失败 (${response.statusCode})`;
          const errorDetails = response.data?.details || response.data?.error || '';
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        }

      } catch (error) {
        uni.hideLoading();
        console.error('保存随记失败:', error);
        
        // 如果是网络错误，尝试本地保存
        if (error.errMsg && error.errMsg.includes('network')) {
          try {
            const customChapterId = this.editMode ? this.editChapterId : 'diary_' + Date.now();
            
            // 本地保存章节数据
            const localChapterData = {
              id: customChapterId,
              title: this.diaryTitle.trim(),
              description: '自定义随记章节',
              backgroundImage: this.selectedImage || '/src/images/story1.png',
              completed: true,
              isCustom: true,
              content: this.diaryContent.trim(),
              recordings: this.recordings,
              createTime: Date.now(),
              lastModified: new Date().toISOString(),
              needSync: true // 标记需要同步到服务器
            };

            // 获取当前用户ID
            const userInfo = uni.getStorageSync('user');
            const userId = userInfo?.id;
            
            if (userId) {
              uni.setStorageSync(`chapter_${customChapterId}_${userId}`, JSON.stringify({
                text: this.diaryContent.trim(),
                recordings: this.recordings,
                lastModified: new Date().toISOString(),
                completed: true,
                needSync: true
              }));

              const customChapters = uni.getStorageSync(`custom_chapters_${userId}`) || [];
              customChapters.unshift(localChapterData);
              uni.setStorageSync(`custom_chapters_${userId}`, customChapters);
            }

            uni.showToast({
              title: '已离线保存',
              icon: 'success'
            });

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

/* 控制按钮布局 */
.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
}

/* AI补全按钮样式 */
.ai-complete-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ai-complete-btn {
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
}

.ai-complete-btn:hover {
  transform: scale(1.05);
  border-color: #007AFF;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2);
}

.ai-complete-btn.loading {
  background: rgba(0, 122, 255, 0.1);
  border-color: #007AFF;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2);
  animation: pulse 2s infinite;
}

.ai-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-icon-img {
  width: 24px;
  height: 24px;
  filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
}

.ai-loading {
  display: flex;
  gap: 3px;
  align-items: center;
}

.loading-dot {
  width: 6px;
  height: 6px;
  background: #007AFF;
  border-radius: 50%;
  animation: loading 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }
.loading-dot:nth-child(3) { animation-delay: 0s; }

.ai-complete-text {
  color: #333;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

/* AI补全结果显示 */
.ai-complete-result {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.diff-header {
  text-align: center;
  margin-bottom: 20px;
}

.diff-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.diff-subtitle {
  font-size: 14px;
  color: #666;
  display: block;
}

.diff-content {
  margin-bottom: 20px;
}

.diff-ai {
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
  background: linear-gradient(135deg, 
    rgba(52, 199, 89, 0.15) 0%, 
    rgba(52, 199, 89, 0.08) 50%, 
    rgba(52, 199, 89, 0.12) 100%);
  border: 1px solid rgba(52, 199, 89, 0.4);
  box-shadow: 
    0 2px 8px rgba(52, 199, 89, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.diff-ai::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.6) 50%, 
    transparent 100%);
}

.diff-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  display: block;
  color: #1e7e34;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.diff-text {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.ai-text {
  color: #1e7e34;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.2);
}

.diff-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.diff-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  font-weight: 600;
}

.reject-btn {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  color: #d70015;
}

.reject-btn:hover {
  background: rgba(255, 59, 48, 0.2);
  transform: translateY(-2px);
}

.accept-btn {
  background: rgba(52, 199, 89, 0.1);
  border: 1px solid rgba(52, 199, 89, 0.3);
  color: #28a745;
}

.accept-btn:hover {
  background: rgba(52, 199, 89, 0.2);
  transform: translateY(-2px);
}

.btn-icon {
  width: 24px;
  height: 24px;
}

/* 动画 */
@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

</style>
