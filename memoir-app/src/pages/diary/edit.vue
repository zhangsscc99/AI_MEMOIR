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
        <view class="photo-upload" @click="chooseImage" v-if="selectedImages.length < 9">
          <view class="upload-icon">
            <image src="/static/icons/camera.svg" class="camera-icon" mode="aspectFit"></image>
          </view>
          <text class="upload-text">添加图片（{{ selectedImages.length }}/9）</text>
        </view>
        
        <!-- 已选择的图片 -->
        <view v-if="selectedImages.length" class="photo-grid">
          <view v-for="(image, index) in selectedImages" :key="image + index" class="photo-preview">
            <image :src="resolveImagePreview(image)" class="preview-image" mode="aspectFill"></image>
            <view class="photo-actions">
              <button
                class="photo-action-btn"
                :disabled="analyzingImageIndex !== -1"
                @click.stop="analyzeDiaryImage(index)"
              >{{ analyzingImageIndex === index ? '生成中...' : '生成文字' }}</button>
              <button class="photo-action-btn remove" @click.stop="removeImage(index)">删除</button>
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
      selectedImages: [],
      analyzingImageIndex: -1,
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
      speechProvider: 'aliyun',
      aliyunAppKey: null,
      aliyunToken: null,
      aliyunWsUrl: null,
      aliyunTaskId: null,
      websocket: null,
      pcmSampleRate: 16000,
      audioContext: null,
      audioProcessor: null,
      audioSourceNode: null,
      decodeAudioContext: null,
      useAudioProcessorStreaming: false,
      allowAudioStreaming: false,
      audioProcessingPromise: Promise.resolve(),
      currentSpeechConfig: null,
      lastPartialText: '',
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
        this.selectedImages = ['/src/images/lion.png'];
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
          this.selectedImages = Array.isArray(localDiary.images) && localDiary.images.length
            ? localDiary.images.slice(0, 9)
            : (localDiary.image || localDiary.backgroundImage ? [localDiary.image || localDiary.backgroundImage] : []);
          
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
          const payload = response.data?.data || {};
          const chapterData = payload.chapter || payload;
          console.log('📖 加载的随记数据:', chapterData);

          // 填充表单数据
          this.diaryTitle = chapterData.title || '随记';
          this.diaryContent = chapterData.content || '';
          this.selectedImages = Array.isArray(chapterData.images) && chapterData.images.length
            ? chapterData.images.slice(0, 9)
            : (chapterData.backgroundImage ? [chapterData.backgroundImage] : []);
          
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
      if (this.diaryTitle || this.diaryContent || this.selectedImages.length || this.recordings.length > 0) {
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
      const remaining = 9 - this.selectedImages.length;
      if (remaining <= 0) return;
      uni.chooseImage({
        count: remaining,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const paths = (res.tempFilePaths || (res.tempFiles || []).map(file => file.path)).filter(Boolean);
          this.selectedImages = [...this.selectedImages, ...paths].slice(0, 9);
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

    removeImage(index) {
      this.selectedImages.splice(index, 1);
    },

    resolveImagePreview(image) {
      if (!image) return '';
      const lower = image.toLowerCase();
      return lower.startsWith('http://') || lower.startsWith('https://') ||
        lower.startsWith('blob:') || lower.startsWith('data:') ||
        lower.startsWith('file://') || lower.startsWith('wxfile://')
        ? image
        : getOptimalImagePath(image);
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
      this.speechProvider = 'aliyun';
      
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

        const config = await this.getAliyunSpeechConfig();
        this.currentSpeechConfig = config;
        if (config?.sampleRate) {
          this.pcmSampleRate = config.sampleRate;
        }

        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: this.pcmSampleRate,
            channelCount: 1
          } 
        });
        this.mediaStream = stream;

        await this.setupAliyunAudioProcessing(stream);

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
            if (!this.useAudioProcessorStreaming) {
              this.processRealtimeAudioChunk(event.data);
            }
          }
        };
        
        this.mediaRecorder.onstop = () => {
          console.log('✅ Web录音停止，数据块数量:', this.audioChunks.length);
          if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
            console.log('音频Blob大小:', audioBlob.size, 'bytes');
            this.handleRecordedBlob(audioBlob);
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

        await this.startAliyunWebSocketRecognition(config);

        // 开始录音
        this.mediaRecorder.start(200); // 每200ms收集一次数据
        console.log('✅ Web录音开始成功, 状态:', this.mediaRecorder.state);

        this.allowAudioStreaming = true;
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

    async autoLogin() {
      try {
        const loginResponse = await uni.request({
          url: apiUrl('/auth/login'),
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            identifier: 'demo',
            password: 'demo123'
          }
        });

        if (loginResponse.data?.success) {
          const { token, user } = loginResponse.data.data;
          uni.setStorageSync('token', token);
          uni.setStorageSync('user', user);
          return true;
        }
      } catch (error) {
        console.error('❌ 自动登录失败:', error);
      }
      return false;
    },

    async getAliyunSpeechConfig() {
      try {
        let token = uni.getStorageSync('token');
        if (!token) {
          console.log('🔐 用户未登录，尝试自动登录...');
          const loginSuccess = await this.autoLogin();
          if (loginSuccess) {
            token = uni.getStorageSync('token');
          }
          if (!token) {
            throw new Error('用户未登录，无法进行语音识别');
          }
        }

        const tokenResponse = await uni.request({
          url: apiUrl('/aliyun-speech/token'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (tokenResponse.data?.success) {
          const data = tokenResponse.data.data || {};
          const region = data.region || data.regionId || 'cn-shanghai';
          const sampleRate = data.sampleRate || this.pcmSampleRate || 16000;

          this.aliyunToken = data.token;
          this.aliyunAppKey = data.appKey;
          this.aliyunWsUrl = data.websocketUrl || `wss://nls-gateway-${region}.aliyuncs.com/ws/v1`;
          this.pcmSampleRate = sampleRate;

          return {
            provider: 'aliyun',
            token: data.token,
            appKey: data.appKey,
            websocketUrl: this.aliyunWsUrl,
            region,
            sampleRate
          };
        }

        throw new Error(tokenResponse.data?.message || '获取语音识别Token失败');

      } catch (error) {
        console.error('❌ 获取阿里云语音识别配置失败:', error);
        throw error;
      }
    },

    async startAliyunWebSocketRecognition(config = {}) {
      try {
        const {
          token,
          appKey,
          websocketUrl,
          sampleRate = this.pcmSampleRate || 16000,
          region
        } = config;

        if (!token || !appKey || !websocketUrl) {
          throw new Error('阿里云语音识别配置不完整');
        }

        this.currentSpeechConfig = { ...config, provider: 'aliyun', sampleRate };
        this.aliyunToken = token;
        this.aliyunAppKey = appKey;
        this.aliyunWsUrl = websocketUrl;
        this.pcmSampleRate = sampleRate;

        let wsUrl = websocketUrl;
        if (wsUrl.includes('?')) {
          wsUrl = `${wsUrl}&token=${encodeURIComponent(token)}`;
        } else {
          wsUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
        }

        if (this.websocket) {
          try {
            this.websocket.close();
          } catch (error) {
            console.warn('⚠️ 关闭旧的WebSocket失败:', error);
          }
        }

        this.websocket = new WebSocket(wsUrl);
        this.websocket.binaryType = 'arraybuffer';
        this.aliyunTaskId = this.generateMessageId();

        this.websocket.onopen = () => {
          const startMessage = {
            header: {
              message_id: this.generateMessageId(),
              task_id: this.aliyunTaskId,
              namespace: 'SpeechTranscriber',
              name: 'StartTranscription',
              appkey: appKey
            },
            payload: {
              format: 'pcm',
              sample_rate: Number(sampleRate) || 16000,
              enable_intermediate_result: true,
              enable_punctuation_prediction: true,
              enable_inverse_text_normalization: true,
              disfluency: true,
              max_sentence_silence: 800
            }
          };

          try {
            this.websocket.send(JSON.stringify(startMessage));
            console.log('📤 已发送阿里云StartTranscription指令');
          } catch (error) {
            console.error('❌ 发送Start指令失败:', error);
          }
        };

        this.websocket.onmessage = (event) => {
          this.handleAliyunWebSocketMessage(event);
        };

        this.websocket.onclose = (event) => {
          console.log('🔌 阿里云WebSocket关闭:', event.code, event.reason);
          this.allowAudioStreaming = false;
        };

        this.websocket.onerror = (error) => {
          console.error('❌ 阿里云WebSocket错误:', error);
          this.allowAudioStreaming = false;
        };

      } catch (error) {
        console.error('❌ 启动阿里云WebSocket识别失败:', error);
        throw error;
      }
    },

    handleAliyunWebSocketMessage(event) {
      try {
        if (!event || typeof event.data !== 'string') {
          return;
        }

        const message = JSON.parse(event.data);
        const header = message?.header || {};
        const payload = message?.payload || {};
        const name = header.name;

        if (header.task_id) {
          this.aliyunTaskId = header.task_id;
        }

        switch (name) {
          case 'TranscriptionStarted':
            console.log('🚀 阿里云识别已启动');
            break;
          case 'TranscriptionResultChanged': {
            const text = payload?.result || payload?.text;
            if (text) {
              this.applyRecognitionResult(text, false);
            }
            break;
          }
          case 'SentenceEnd': {
            const text = payload?.result || payload?.text;
            if (text) {
              this.applyRecognitionResult(text, true);
            }
            break;
          }
          case 'TranscriptionCompleted':
            console.log('🏁 阿里云识别完成');
            this.lastPartialText = '';
            break;
          case 'TaskFailed': {
            const statusText = header?.status_text || header?.status_message || '识别失败';
            console.error('❌ 阿里云识别失败:', statusText);
            break;
          }
          default:
            if (name) {
              console.log('ℹ️ 阿里云事件:', name, payload);
            }
        }
      } catch (error) {
        console.error('❌ 解析阿里云WebSocket消息失败:', error);
      }
    },

    applyRecognitionResult(text, isFinal = false) {
      if (!text || !text.trim()) {
        return;
      }

      const trimmed = text.trim();
      let baseText = this.diaryContent || '';

      if (this.lastPartialText) {
        const partial = this.lastPartialText.trim();
        if (partial && baseText.endsWith(partial)) {
          baseText = baseText.slice(0, -partial.length).trimEnd();
        }
      }

      const combined = baseText ? `${baseText} ${trimmed}`.replace(/\s+/g, ' ').trim() : trimmed;

      if (isFinal) {
        this.lastPartialText = '';
      } else {
        this.lastPartialText = trimmed;
      }

      this.diaryContent = combined;
    },

    sendAliyunStopRequest() {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        const stopMessage = {
          header: {
            message_id: this.generateMessageId(),
            task_id: this.aliyunTaskId || this.generateMessageId(),
            namespace: 'SpeechTranscriber',
            name: 'StopTranscription',
            appkey: this.aliyunAppKey
          },
          payload: {}
        };
        this.websocket.send(JSON.stringify(stopMessage));
        console.log('🛑 已发送阿里云StopTranscription指令');
      } catch (error) {
        console.error('❌ 发送停止指令失败:', error);
      }
    },

    async setupAliyunAudioProcessing(stream) {
      try {
        const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
        if (!NativeAudioContext) {
          console.warn('⚠️ AudioContext不可用，降级到MediaRecorder处理');
          this.useAudioProcessorStreaming = false;
          return;
        }

        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new NativeAudioContext({
            sampleRate: this.pcmSampleRate
          });
        }

        if (this.audioContext.state === 'suspended' && typeof this.audioContext.resume === 'function') {
          await this.audioContext.resume();
        }

        if (this.audioSourceNode) {
          try {
            this.audioSourceNode.disconnect();
          } catch (error) {
            console.warn('⚠️ 断开旧音频源失败:', error);
          }
        }

        if (this.audioProcessor) {
          try {
            this.audioProcessor.disconnect();
          } catch (error) {
            console.warn('⚠️ 断开旧音频处理器失败:', error);
          }
        }

        const sourceNode = this.audioContext.createMediaStreamSource(stream);
        const processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
        const contextRate = this.audioContext.sampleRate;
        const targetRate = this.pcmSampleRate;

        processorNode.onaudioprocess = (event) => {
          if (!this.allowAudioStreaming || !this.isRecording) {
            return;
          }

          const channelData = event.inputBuffer?.getChannelData(0);
          if (!channelData || !channelData.length) {
            return;
          }

          const sourceRate = event.inputBuffer.sampleRate || contextRate;
          let processed = channelData;
          if (sourceRate !== targetRate) {
            processed = this.downsampleBuffer(channelData, sourceRate, targetRate);
          }

          if (!processed || !processed.length) {
            return;
          }

          const pcmBuffer = this.float32ToPCM(processed);
          if (pcmBuffer && pcmBuffer.byteLength && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            try {
              this.websocket.send(pcmBuffer);
            } catch (error) {
              console.error('❌ 发送音频数据失败:', error);
            }
          }
        };

        sourceNode.connect(processorNode);
        processorNode.connect(this.audioContext.destination);

        this.audioSourceNode = sourceNode;
        this.audioProcessor = processorNode;
        this.useAudioProcessorStreaming = true;

      } catch (error) {
        console.error('❌ 初始化音频处理器失败:', error);
        this.useAudioProcessorStreaming = false;
      }
    },

    async processRealtimeAudioChunk(blob) {
      try {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
          return;
        }

        const pcmBuffer = await this.convertWebMToPCM(blob);
        if (pcmBuffer && pcmBuffer.byteLength) {
          this.websocket.send(pcmBuffer);
        }
      } catch (error) {
        console.error('❌ 处理实时音频数据失败:', error);
      }
    },

    async convertWebMToPCM(blob) {
      try {
        const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
        if (!NativeAudioContext) {
          throw new Error('AudioContext 不可用');
        }

        if (!this.decodeAudioContext || this.decodeAudioContext.state === 'closed') {
          this.decodeAudioContext = new NativeAudioContext();
        }

        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await new Promise((resolve, reject) => {
          this.decodeAudioContext.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
        });

        const channelData = audioBuffer.getChannelData(0);
        const resampled = this.downsampleBuffer(channelData, audioBuffer.sampleRate, this.pcmSampleRate);
        return this.float32ToPCM(resampled);

      } catch (error) {
        console.error('❌ WebM到PCM转换失败:', error);
        return null;
      }
    },

    downsampleBuffer(channelData, sourceSampleRate, targetSampleRate) {
      if (!channelData || sourceSampleRate === targetSampleRate) {
        return channelData;
      }

      const sampleRateRatio = sourceSampleRate / targetSampleRate;
      const newLength = Math.round(channelData.length / sampleRateRatio);
      const result = new Float32Array(newLength);

      for (let i = 0; i < newLength; i++) {
        const sourceIndex = Math.floor(i * sampleRateRatio);
        result[i] = channelData[sourceIndex];
      }

      return result;
    },

    float32ToPCM(channelData) {
      if (!channelData) {
        return new ArrayBuffer(0);
      }

      const buffer = new ArrayBuffer(channelData.length * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }

      return buffer;
    },

    generateMessageId() {
      const hexDigits = '0123456789abcdef';
      let messageId = '';
      for (let i = 0; i < 32; i++) {
        messageId += hexDigits[Math.floor(Math.random() * 16)];
      }
      return messageId;
    },

    async handleRecordedBlob(audioBlob) {
      try {
        const objectUrl = URL.createObjectURL(audioBlob);

        let uploadedFile = null;
        try {
          uploadedFile = await this.uploadWebAudio(audioBlob);
        } catch (uploadError) {
          console.warn('⚠️ 音频文件上传失败，使用本地URL:', uploadError);
        }

        this.recordings.push({
          filePath: uploadedFile?.fileUrl || uploadedFile?.filename || objectUrl,
          duration: this.recordingTime,
          createTime: Date.now()
        });

        this.recordingTime = 0;

        uni.showToast({
          title: '录制完成',
          icon: 'success'
        });

      } catch (error) {
        console.error('❌ 处理录音文件失败:', error);
      }
    },

    async uploadWebAudio(audioBlob) {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }

        let extension = '.webm';
        const mimeType = audioBlob.type || 'audio/webm';

        if (mimeType.includes('webm')) {
          extension = '.webm';
        } else if (mimeType.includes('mp4')) {
          extension = '.mp4';
        } else if (mimeType.includes('wav')) {
          extension = '.wav';
        } else if (mimeType.includes('ogg')) {
          extension = '.ogg';
        }

        const timestamp = Date.now();
        const fileName = `diary_recording_${timestamp}${extension}`;
        const audioFile = new File([audioBlob], fileName, { type: mimeType });

        const formData = new FormData();
        formData.append('audio', audioFile);

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
        if (result.success && result.data?.file) {
          return result.data.file;
        }

        throw new Error(result.message || '上传失败');

      } catch (error) {
        console.error('❌ 上传录音文件失败:', error);
        throw error;
      }
    },

    // Web录音停止
    stopWebRecording() {
      try {
        console.log('🌐 停止Web录音...');
        console.log('MediaRecorder状态:', this.mediaRecorder?.state);

        this.allowAudioStreaming = false;
        this.sendAliyunStopRequest();
        
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
          this.mediaStream = null;
        }

        if (this.audioProcessor) {
          try {
            this.audioProcessor.disconnect();
          } catch (error) {
            console.warn('⚠️ 断开音频处理器失败:', error);
          }
          this.audioProcessor = null;
        }

        if (this.audioSourceNode) {
          try {
            this.audioSourceNode.disconnect();
          } catch (error) {
            console.warn('⚠️ 断开音频源失败:', error);
          }
          this.audioSourceNode = null;
        }

        if (this.audioContext) {
          try {
            this.audioContext.close();
          } catch (error) {
            console.warn('⚠️ 关闭音频上下文失败:', error);
          }
          this.audioContext = null;
        }

        if (this.websocket) {
          try {
            this.websocket.close();
          } catch (error) {
            console.warn('⚠️ 关闭WebSocket失败:', error);
          }
          this.websocket = null;
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

        if (this.decodeAudioContext) {
          try {
            this.decodeAudioContext.close();
          } catch (error) {
            console.warn('⚠️ 关闭解码音频上下文失败:', error);
          }
          this.decodeAudioContext = null;
        }

        this.audioChunks = [];

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

    // 上传图片到服务器
    uploadImageToServer(filePath) {
      return new Promise((resolve, reject) => {
        const token = uni.getStorageSync('token');
        if (!token) {
          reject(new Error('请先登录'));
          return;
        }

        uni.uploadFile({
          url: apiUrl('/upload/image'),
          filePath,
          name: 'image',
          timeout: 120000,
          header: { 'Authorization': `Bearer ${token}` },
          success: (res) => {
            try {
              const result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
              if (res.statusCode !== 200 || !result.success) {
                reject(new Error(result.message || '图片上传失败'));
                return;
              }
              resolve(result.data?.url || result.url);
            } catch (error) {
              reject(new Error('解析上传结果失败'));
            }
          },
          fail: reject
        });
      });
    },

    async ensureImageUploaded(index) {
      const image = this.selectedImages[index];
      if (!image) return null;
      const lower = image.toLowerCase();
      if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('/uploads/')) {
        return image;
      }
      const uploadedUrl = await this.uploadImageToServer(image);
      this.selectedImages.splice(index, 1, uploadedUrl);
      return uploadedUrl;
    },

    async ensureImagesUploaded() {
      const uploaded = [];
      for (let index = 0; index < this.selectedImages.length; index += 1) {
        uploaded.push(await this.ensureImageUploaded(index));
      }
      return uploaded.filter(Boolean);
    },

    async analyzeDiaryImage(index) {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'error' });
        return;
      }

      try {
        this.analyzingImageIndex = index;
        const imageUrl = await this.ensureImageUploaded(index);
        const response = await uni.request({
          url: apiUrl('/ai/vision/analyze'),
          method: 'POST',
          timeout: 180000,
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            imageUrl,
            chapterId: this.editChapterId || undefined
          }
        });

        if (response.statusCode !== 200 || !response.data.success) {
          throw new Error(response.data?.message || '生成失败');
        }
        const addition = (response.data.data?.text || '').trim();
        if (!addition) throw new Error('未生成有效文字');

        uni.showModal({
          title: '图片生成文字',
          content: addition,
          confirmText: '添加正文',
          cancelText: '取消',
          success: (result) => {
            if (!result.confirm) return;
            const existing = this.diaryContent ? this.diaryContent.replace(/\s*$/, '') : '';
            this.diaryContent = existing ? `${existing}\n\n${addition}` : addition;
          }
        });
      } catch (error) {
        console.error('图片生成文字失败:', error);
        uni.showToast({ title: error.message || '生成失败', icon: 'none' });
      } finally {
        this.analyzingImageIndex = -1;
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

      if (!this.diaryContent.trim() && !this.selectedImages.length && this.recordings.length === 0) {
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
        const images = await this.ensureImagesUploaded();
        const backgroundImage = images[0] || '/src/images/default-diary.svg';

        // 准备保存为回忆录章节的数据
        const chapterData = {
          chapterId: customChapterId,
          title: this.diaryTitle.trim(),
          content: this.diaryContent.trim(),
          recordings: this.recordings,
          backgroundImage,
          images
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
            chapterId: customChapterId,
            title: this.diaryTitle.trim(),
            description: '自定义随记章节',
            backgroundImage,
            images,
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
              image: backgroundImage,
              images,
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
              backgroundImage: this.selectedImages[0] || '/src/images/story1.png',
              images: this.selectedImages,
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
                image: this.selectedImages[0] || '',
                images: this.selectedImages,
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
  border-radius: 8px;
  overflow: hidden;
  background: white;
  border: 1px solid #e0e0e0;
}

.preview-image {
  width: 100%;
  height: 180px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.photo-actions {
  display: flex;
  gap: 8px;
  padding: 10px;
}

.photo-action-btn {
  flex: 1;
  min-width: 0;
  padding: 8px 6px;
  border-radius: 6px;
  border: 1px solid #dedede;
  background: white;
  color: #333;
  font-size: 14px;
}

.photo-action-btn.remove {
  background: #222;
  border-color: #222;
  color: white;
}

@media (max-width: 420px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }
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
