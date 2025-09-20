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
            <!-- 录制按钮和AI补全按钮 -->
            <view class="control-buttons">
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
              
              <!-- AI补全按钮 -->
              <view class="ai-complete-btn-container">
                <view 
                  class="ai-complete-btn"
                  :class="{ 'processing': isAiCompleting }"
                  @click="aiCompleteText"
                >
                  <view class="ai-icon">
                    <image v-if="!isAiCompleting" src="/static/icons/chat.svg" class="ai-icon-img" mode="aspectFit"></image>
                    <view v-else class="ai-loading">
                      <view class="loading-dot" v-for="i in 3" :key="i"></view>
                    </view>
                  </view>
                </view>
                <text class="ai-complete-text">AI补全</text>
              </view>
            </view>
          </view>
          
          <!-- 录音计时 -->
          <view v-if="isRecording" class="recording-timer">
            <text class="timer-text">{{ formatTime(recordingTime) }}</text>
          </view>
          
          <!-- AI补全结果diff显示 -->
          <view v-if="showAiDiff" class="ai-diff-container">
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
  </view>
</template>

<script>
// 导入 API 配置工具
import { apiUrl } from '@/utils/apiConfig.js';
// 导入认证工具
import { handleAuthError } from '@/utils/auth.js';

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
      realtimeRecognitionTimer: null,
      statusMonitorTimer: null,
      speechRecognition: null,
      lastRecognizedFile: null,
      prompts: [],
      // Web录音相关
      mediaRecorder: null,
      mediaStream: null,
      audioChunks: [],
      // WebSocket相关
      websocket: null,
      audioProcessor: null,
      audioContext: null,
      // AI补全相关
      isAiCompleting: false,
      showAiDiff: false,
      originalText: '',
      aiCompletedText: ''
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
    if (this.realtimeRecognitionTimer) {
      clearInterval(this.realtimeRecognitionTimer);
    }
    if (this.statusMonitorTimer) {
      clearInterval(this.statusMonitorTimer);
    }
    // 清理语音识别
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    // 停止状态监控
    this.stopStatusMonitoring();
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
        this.loadChapterPrompts();
        
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
        // 获取当前用户ID
        const userInfo = uni.getStorageSync('user');
        const userId = userInfo?.id;
        
        if (!userId) {
          return;
        }
        
        // 加载用户特定的章节内容
        const savedContent = uni.getStorageSync(`chapter_${this.chapterId}_${userId}`);
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
          url: apiUrl('/chapters/save'),
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: saveData
        });

        uni.hideLoading();

        // 检查认证错误
        if (handleAuthError(response)) {
          return;
        }

        if (response.statusCode === 200 && response.data.success) {
          // 获取当前用户ID
          const userInfo = uni.getStorageSync('user');
          const userId = userInfo?.id;
          
          if (userId) {
            // 同时更新用户特定的本地存储（用于离线查看）
          const content = {
            text: this.contentText,
            recordings: this.recordings,
            lastModified: new Date().toISOString(),
            completed: this.contentText.length > 0 || this.recordings.length > 0
          };
          
            uni.setStorageSync(`chapter_${this.chapterId}_${userId}`, JSON.stringify(content));
          
            const savedStatus = uni.getStorageSync(`chapter_status_${userId}`) || '{}';
          const statusMap = JSON.parse(savedStatus);
          statusMap[this.chapterId] = {
            completed: content.completed,
            lastModified: content.lastModified
          };
            uni.setStorageSync(`chapter_status_${userId}`, JSON.stringify(statusMap));
          }

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
            // 获取当前用户ID
            const userInfo = uni.getStorageSync('user');
            const userId = userInfo?.id;
            
            if (userId) {
            const content = {
              text: this.contentText,
              recordings: this.recordings,
              lastModified: new Date().toISOString(),
              completed: this.contentText.length > 0 || this.recordings.length > 0,
              needSync: true // 标记需要同步到服务器
            };
            
              uni.setStorageSync(`chapter_${this.chapterId}_${userId}`, JSON.stringify(content));
            
            uni.showToast({
              title: '已离线保存',
              icon: 'success'
            });
            
            // 离线保存成功后延迟跳转回去
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
            }
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
      console.log('🎯 处理状态:', this.isProcessing);
      console.log('🎯 按钮文字:', this.recordButtonText);
      
      if (this.isRecording) {
        console.log('🛑 停止录音');
        this.stopRecording();
      } else {
        console.log('🎤 开始录音');
        this.startRecording();
      }
    },

    // 检查录音权限
    async checkRecordingPermission() {
      return new Promise((resolve, reject) => {
        // 检查是否在Capacitor环境中
        if (window.Capacitor) {
          // 在Android中检查权限
          if (window.Capacitor.Plugins.Permissions) {
            window.Capacitor.Plugins.Permissions.check({
              name: 'microphone'
            }).then(result => {
              if (result.state === 'granted') {
                resolve();
              } else {
                // 请求权限
                window.Capacitor.Plugins.Permissions.request({
                  name: 'microphone'
                }).then(requestResult => {
                  if (requestResult.state === 'granted') {
                    resolve();
                  } else {
                    reject(new Error('录音权限被拒绝'));
                  }
                }).catch(reject);
              }
            }).catch(reject);
          } else {
            // 如果没有权限插件，直接尝试录音
            resolve();
          }
        } else {
          // 浏览器环境，直接尝试获取权限
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(stream => {
                // 立即停止流，只是检查权限
                stream.getTracks().forEach(track => track.stop());
                resolve();
              })
              .catch(reject);
          } else {
            reject(new Error('当前环境不支持录音'));
          }
        }
      });
    },

    // 开始状态监控
    startStatusMonitoring() {
      console.log('🔍 开始监控MediaRecorder状态...');
      this.statusMonitorTimer = setInterval(() => {
        if (this.mediaRecorder) {
          console.log('📊 MediaRecorder状态:', this.mediaRecorder.state);
          console.log('📊 录音状态:', this.isRecording);
          console.log('📊 处理状态:', this.isProcessing);
          
          // 如果MediaRecorder意外停止但录音状态仍为true，尝试恢复
          if (this.mediaRecorder.state === 'inactive' && this.isRecording) {
            console.warn('⚠️ MediaRecorder意外停止，尝试重新启动...');
            try {
              this.mediaRecorder.start();
              console.log('✅ MediaRecorder重新启动成功');
            } catch (error) {
              console.error('❌ MediaRecorder重新启动失败:', error);
              this.handleRecordingError('录音意外停止');
            }
          }
        }
      }, 2000); // 每2秒检查一次
    },

    // 停止状态监控
    stopStatusMonitoring() {
      if (this.statusMonitorTimer) {
        clearInterval(this.statusMonitorTimer);
        this.statusMonitorTimer = null;
        console.log('🔍 停止状态监控');
      }
    },
    
    async startRecording(event) {
      console.log('🚀 startRecording 被调用');
      console.log('🚀 当前 isProcessing:', this.isProcessing);
      console.log('🚀 当前 isRecording:', this.isRecording);
      
      if (this.isProcessing) {
        console.log('⚠️ 正在处理中，跳过录音');
        return;
      }
      
      // 防止事件影响页面滚动
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // 检查录音权限
      try {
        console.log('🔐 开始检查录音权限...');
        await this.checkRecordingPermission();
        console.log('✅ 录音权限检查通过');
      } catch (error) {
        console.error('❌ 录音权限检查失败:', error);
        uni.showToast({
          title: '需要录音权限才能使用此功能',
          icon: 'error'
        });
        return;
      }
      
      console.log('📝 设置录音状态为 true');
      this.isRecording = true;
      this.recordingTime = 0;
      console.log('📝 录音状态已设置:', this.isRecording);
      
      // 开始计时
      this.recordingTimer = setInterval(() => {
        this.recordingTime++;
      }, 1000);
      
      console.log('🎤 开始录音...');
      console.log('运行环境:', uni.getSystemInfoSync().platform);
      console.log('🔍 检查录音环境支持...');
      console.log('🔍 navigator存在:', typeof navigator !== 'undefined');
      console.log('🔍 mediaDevices存在:', typeof navigator?.mediaDevices !== 'undefined');
      console.log('🔍 getUserMedia存在:', typeof navigator?.mediaDevices?.getUserMedia !== 'undefined');
      console.log('🔍 uni.startRecord存在:', typeof uni?.startRecord === 'function');
      
      // 根据环境选择录音方式
      if (this.isCapacitorEnvironment()) {
        console.log('🎯 检测到Capacitor环境，尝试使用移动端SDK...');
        try {
          await this.startAliyunMobileRecording();
        } catch (error) {
          console.log('⚠️ 移动端SDK不可用，降级到Web API...');
          await this.startAliyunWebRecording();
        }
      } else {
        console.log('🌐 检测到Web环境，使用Web API进行录音和识别...');
        await this.startAliyunWebRecording();
      }
      
      console.log('📱 显示开始录制提示');
      uni.showToast({
        title: '开始录制',
        icon: 'none'
      });
      
      console.log('📊 录音状态检查 - isRecording:', this.isRecording);
      console.log('📊 按钮文字检查 - recordButtonText:', this.recordButtonText);
    },

    // 开始阿里云Web API录音 - 通过后端
    async startAliyunWebRecording() {
      try {
        console.log('🌐 开始阿里云Web API实时语音识别...');
        
        // 检查录音权限
        console.log('🔐 检查Web录音权限...');
        const hasPermission = await this.checkWebRecordingPermission();
        if (!hasPermission) {
          throw new Error('录音权限被拒绝');
        }
        
        // 获取Token
        console.log('🔑 获取阿里云Token...');
        const { token } = await this.getAliyunTokenAndAppkey();
        console.log('✅ 获取语音识别Token成功');
        
        // 开始Web录音和识别
        await this.startWebRecording(token);
        
        console.log('✅ 阿里云Web API录音和识别已开始');
        
      } catch (error) {
        console.error('❌ 阿里云Web API录音失败:', error);
        throw error;
      }
    },

    // 开始阿里云移动端录音 - 使用原生Android SDK
    async startAliyunMobileRecording() {
      try {
        console.log('🎯 开始阿里云Android SDK实时语音识别...');
        
        // 检查权限
        const permissionResult = await this.checkAliyunPermission();
        if (!permissionResult.granted) {
          throw new Error('需要录音权限才能使用此功能');
        }
        
        // 获取语音识别Token和Appkey
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录，无法进行语音识别');
        }
        
        const tokenResponse = await uni.request({
          url: apiUrl('/speech/token'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tokenResponse.statusCode !== 200 || !tokenResponse.data.success) {
          throw new Error('获取语音识别Token失败: ' + tokenResponse.data?.message);
        }
        
        const speechToken = tokenResponse.data.data.token;
        const appkey = tokenResponse.data.data.appkey;
        console.log('✅ 获取语音识别Token成功');
        console.log('✅ 获取Appkey成功:', appkey);
        
        // 初始化阿里云SDK
        await this.initializeAliyunSDK(appkey, speechToken);
        
        // 开始录音和识别
        await this.startAliyunRecording();
        
      } catch (error) {
        console.error('❌ 阿里云Android SDK录音失败:', error);
        throw error;
      }
    },

    // 检查是否为Capacitor环境
    isCapacitorEnvironment() {
      return !!(window.Capacitor && window.Capacitor.isNativePlatform());
    },

    // 检查Web录音权限
    async checkWebRecordingPermission() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } else {
          throw new Error('Web录音API不可用');
        }
      } catch (error) {
        console.error('❌ 检查Web录音权限失败:', error);
        return false;
      }
    },

    // 检查阿里云权限
    async checkAliyunPermission() {
      try {
        // 这里应该调用阿里云插件的权限检查方法
        // 暂时返回模拟结果
        console.log('🔐 检查阿里云录音权限...');
        return {
          granted: true,
          denied: false,
          neverAsked: false
        };
      } catch (error) {
        console.error('❌ 权限检查失败:', error);
        return {
          granted: false,
          denied: true,
          neverAsked: false
        };
      }
    },

    // 初始化阿里云SDK
    async initializeAliyunSDK(appkey, token) {
      try {
        console.log('🔧 初始化阿里云SDK...');
        
        // 创建工作目录
        const workspace = "/data/data/com.memoir.app/files/asr_my";
        
        // 调用阿里云插件的初始化方法
        console.log('🔍 检查插件可用性...');
        console.log('🔍 window.Capacitor:', !!window.Capacitor);
        console.log('🔍 window.Capacitor.Plugins:', !!window.Capacitor?.Plugins);
        console.log('🔍 window.Capacitor.Plugins.AliyunSpeech:', !!window.Capacitor?.Plugins?.AliyunSpeech);
        
        // 先测试插件是否可用
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AliyunSpeech) {
          console.log('✅ 插件可用，开始测试...');
          try {
            const testResult = await window.Capacitor.Plugins.AliyunSpeech.test();
            console.log('✅ 插件测试成功:', testResult);
          } catch (error) {
            console.error('❌ 插件测试失败:', error);
            throw new Error('插件测试失败: ' + error.message);
          }
          
          console.log('✅ 插件测试通过，开始初始化...');
          await window.Capacitor.Plugins.AliyunSpeech.initialize({
            appkey: appkey,
            token: token,
            workspace: workspace
          });
          console.log('✅ 阿里云SDK初始化成功');
        } else {
          console.error('❌ 插件不可用，详细信息:');
          console.error('  - window.Capacitor:', !!window.Capacitor);
          console.error('  - window.Capacitor.Plugins:', !!window.Capacitor?.Plugins);
          console.error('  - window.Capacitor.Plugins.AliyunSpeech:', !!window.Capacitor?.Plugins?.AliyunSpeech);
          throw new Error('阿里云插件不可用');
        }
      } catch (error) {
        console.error('❌ 阿里云SDK初始化失败:', error);
        throw error;
      }
    },

    // 开始阿里云录音
    async startAliyunRecording() {
      try {
        console.log('🎤 开始阿里云录音和识别...');
        
        // 调用阿里云插件的开始录音方法
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AliyunSpeech) {
          await window.Capacitor.Plugins.AliyunSpeech.startRecording({
            sampleRate: 16000,
            format: 'pcm',
            enableIntermediateResult: true,
            enablePunctuationPrediction: true,
            enableInverseTextNormalization: true
          });
          
          // 监听识别结果
          this.setupAliyunListeners();
          
          console.log('✅ 阿里云录音已开始');
        } else {
          throw new Error('阿里云插件不可用');
        }
      } catch (error) {
        console.error('❌ 阿里云录音失败:', error);
        throw error;
      }
    },

    // 设置阿里云监听器
    setupAliyunListeners() {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AliyunSpeech) {
        // 监听中间识别结果
        window.Capacitor.Plugins.AliyunSpeech.addListener('onPartialResult', (result) => {
          console.log('🎯 中间识别结果:', result.text);
          this.updateContentText(result.text);
        });
        
        // 监听完整识别结果
        window.Capacitor.Plugins.AliyunSpeech.addListener('onFinalResult', (result) => {
          console.log('✅ 完整识别结果:', result.text);
          this.updateContentText(result.text);
        });
        
        // 监听错误
        window.Capacitor.Plugins.AliyunSpeech.addListener('onError', (error) => {
          console.error('❌ 识别错误:', error.message);
          uni.showToast({
            title: '识别错误: ' + error.message,
            icon: 'error'
          });
        });
      }
    },

    // Capacitor 录音方法
    async startCapacitorRecording() {
      try {
        console.log('📱 开始Capacitor录音...');
        
        // 检查是否有录音插件
        console.log('🔍 检查录音插件...');
        console.log('🔍 window.Capacitor.Plugins.VoiceRecorder:', !!window.Capacitor.Plugins.VoiceRecorder);
        console.log('🔍 window.Capacitor.Plugins.Microphone:', !!window.Capacitor.Plugins.Microphone);
        console.log('🔍 window.Media:', !!window.Media);
        console.log('🔍 window.cordova:', !!window.cordova);
        console.log('🔍 window.device:', !!window.device);
        
        if (window.Capacitor.Plugins.VoiceRecorder) {
          console.log('🎤 使用VoiceRecorder插件...');
          const result = await window.Capacitor.Plugins.VoiceRecorder.startRecording();
          console.log('✅ VoiceRecorder录音开始成功:', result);
        } else if (window.Capacitor.Plugins.Microphone) {
          console.log('🎤 使用Microphone插件...');
          const result = await window.Capacitor.Plugins.Microphone.startRecording();
          console.log('✅ Microphone录音开始成功:', result);
        } else if (window.Media) {
          console.log('🎤 使用Cordova Media插件...');
          await this.startCordovaRecording();
        } else {
          console.log('❌ 没有找到任何录音插件！');
          throw new Error('没有找到可用的录音插件，无法进行真实录音');
        }
        
      } catch (error) {
        console.error('❌ Capacitor录音开始失败:', error);
        // 不允许降级到模拟录音，直接报错
        throw new Error('录音功能不可用: ' + error.message);
      }
    },

    // Cordova Media 录音方法
    async startCordovaRecording() {
      try {
        console.log('🎤 开始Cordova录音...');
        
        // 创建录音文件路径 - 修复路径问题
        const fileName = `recording_${Date.now()}.wav`;
        // 使用正确的Android文件路径
        const filePath = `recording_${Date.now()}.wav`;
        
        console.log('📁 录音文件路径:', filePath);
        
        // 创建Media对象
        this.mediaRecorder = new Media(filePath, 
          // 成功回调
          () => {
            console.log('✅ Cordova录音开始成功');
          },
          // 错误回调
          (error) => {
            console.error('❌ Cordova录音开始失败:', error);
            this.handleRecordingError('录音开始失败');
          }
        );
        
        // 开始录音
        console.log('🎤 调用 startRecord()...');
        this.mediaRecorder.startRecord();
        console.log('✅ Cordova录音已启动');
        
        // 添加录音状态检查
        setTimeout(() => {
          if (this.mediaRecorder) {
            console.log('🔍 录音状态检查:', {
              mediaRecorder: !!this.mediaRecorder,
              isRecording: this.isRecording,
              filePath: filePath
            });
          }
        }, 1000);
        
        // 开始状态监控
        this.startStatusMonitoring();
        
        // 开始实时语音识别
        this.startRealtimeRecognition();
        
      } catch (error) {
        console.error('❌ Cordova录音启动失败:', error);
        throw error;
      }
    },


    // 模拟录音模式（用于Android WebView环境）
    async startSimulatedRecording() {
      try {
        console.log('🎭 开始模拟录音模式...');
        
        // 在Android WebView中，我们无法直接访问麦克风
        // 但我们可以模拟录音状态，让用户手动输入文字
        this.isRecording = true;
        this.recordingTime = 0;
        
        // 开始计时
        this.recordingTimer = setInterval(() => {
          this.recordingTime++;
        }, 1000);
        
        // 开始状态监控
        this.startStatusMonitoring();
        
        // 显示提示，让用户知道可以手动输入
        uni.showToast({
          title: '录音模式已启动，请手动输入文字',
          icon: 'none',
          duration: 3000
        });
        
        console.log('✅ 模拟录音模式启动成功');
        
      } catch (error) {
        console.error('❌ 模拟录音模式启动失败:', error);
        this.handleRecordingFallback();
      }
    },

    // 在Capacitor环境中使用Web录音
    async startWebRecordingInCapacitor() {
      try {
        console.log('🌐 在Capacitor环境中使用Web录音...');
        
        // 在Capacitor环境中，需要特殊处理权限
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
            channelCount: 1,
            // 在Capacitor中添加特殊配置
            autoGainControl: true,
            latency: 0.01
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
            // 实时处理音频数据
            this.processRealtimeAudio(event.data);
          }
        };
        
        this.mediaRecorder.onstart = () => {
          console.log('🎤 MediaRecorder 已开始录音');
        };
        
        this.mediaRecorder.onstop = () => {
          console.log('✅ Web录音停止，数据块数量:', this.audioChunks.length);
          console.log('录音时长:', this.recordingTime, '秒');
          this.isProcessing = false;
          this.recordingTime = 0;
      
      uni.showToast({
            title: '录制完成',
            icon: 'success'
          });
        };
        
        this.mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder错误:', event.error);
          console.error('错误详情:', event);
          this.handleRecordingError('录音过程中出错');
        };
        
        // 在Capacitor环境中，不使用时间间隔参数
        this.mediaRecorder.start();
        console.log('✅ Web录音开始成功 (Capacitor模式), 状态:', this.mediaRecorder.state);
        
        // 开始状态监控
        this.startStatusMonitoring();
        
        // 开始实时语音识别
        this.startRealtimeRecognition();
        
      } catch (error) {
        console.error('❌ Capacitor Web录音开始失败:', error);
        
        let errorMessage = '无法访问麦克风';
        if (error.name === 'NotAllowedError') {
          errorMessage = '麦克风权限被拒绝，请在设置中允许录音权限';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到麦克风设备';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '麦克风被其他应用占用';
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'error'
        });
        this.handleRecordingFallback();
      }
    },

    async startWebRecording(token) {
      try {
        console.log('🌐 开始Web录音...');
        
        // 请求麦克风权限，添加更详细的错误处理
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
            channelCount: 1
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
            // 实时处理音频数据
            this.processRealtimeAudio(event.data);
          }
        };
        
        this.mediaRecorder.onstart = () => {
          console.log('🎤 MediaRecorder 已开始录音');
          // 开始阿里云WebSocket实时识别
          this.startAliyunWebSocketRecognition(token, null);
        };
        
        this.mediaRecorder.onpause = () => {
          console.log('⏸️ MediaRecorder 已暂停');
        };
        
        this.mediaRecorder.onresume = () => {
          console.log('▶️ MediaRecorder 已恢复');
        };
        
        this.mediaRecorder.onstop = () => {
          console.log('✅ Web录音停止，数据块数量:', this.audioChunks.length);
          console.log('录音时长:', this.recordingTime, '秒');
          this.isProcessing = false;
          this.recordingTime = 0;
          
          uni.showToast({
            title: '录制完成',
            icon: 'success'
          });
        };
        
        this.mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder错误:', event.error);
          console.error('错误详情:', event);
          this.handleRecordingError('录音过程中出错');
        };
        
        // 开始录音，在Capacitor环境中不使用时间间隔参数
        try {
          if (window.Capacitor) {
            // 在Capacitor环境中，不使用时间间隔参数
            this.mediaRecorder.start();
            console.log('✅ Web录音开始成功 (Capacitor模式), 状态:', this.mediaRecorder.state);
          } else {
            // 在浏览器环境中，使用时间间隔
            this.mediaRecorder.start(5000); // 每5秒收集一次数据
            console.log('✅ Web录音开始成功 (浏览器模式), 状态:', this.mediaRecorder.state);
          }
        } catch (startError) {
          console.error('❌ MediaRecorder.start() 失败:', startError);
          // 尝试不使用参数的方式
          this.mediaRecorder.start();
          console.log('✅ Web录音开始成功 (降级模式), 状态:', this.mediaRecorder.state);
        }
        
        // 开始状态监控
        this.startStatusMonitoring();
        
        // 开始实时语音识别
        this.startRealtimeRecognition();
        
      } catch (error) {
        console.error('❌ Web录音开始失败:', error);
        
        let errorMessage = '无法访问麦克风';
        if (error.name === 'NotAllowedError') {
          errorMessage = '麦克风权限被拒绝，请在设置中允许录音权限';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '未找到麦克风设备';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '麦克风被其他应用占用';
        }
        
        uni.showToast({
          title: errorMessage,
          icon: 'error'
        });
        this.handleRecordingFallback();
      }
    },

    // 实时语音识别
    async startRealtimeRecognition() {
      try {
        console.log('🎤 开始实时语音识别...');
        
        // 只使用阿里云WebSocket流式识别
        console.log('📡 使用阿里云WebSocket流式识别');
        await this.startAliyunWebSocketRecognition();
        
      } catch (error) {
        console.error('❌ 启动实时语音识别失败:', error);
      }
    },

    // 检查Web Speech API支持
    isWebSpeechSupported() {
      return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    },

    // 测试录音功能
    async testRecording() {
      try {
        console.log('🧪 开始测试录音功能...');
        
        // 检查Cordova Media插件
        if (window.Media) {
          console.log('✅ Cordova Media插件可用');
          
          // 创建测试录音
          const testMedia = new Media('test_recording.wav', 
            () => {
              console.log('✅ 测试录音成功');
            },
            (error) => {
              console.error('❌ 测试录音失败:', error);
            }
          );
          
          // 开始测试录音
          testMedia.startRecord();
          console.log('🎤 测试录音已开始');
          
          // 3秒后停止
          setTimeout(() => {
            testMedia.stopRecord();
            console.log('🛑 测试录音已停止');
          }, 3000);
          
        } else {
          console.error('❌ Cordova Media插件不可用');
        }
        
      } catch (error) {
        console.error('❌ 测试录音失败:', error);
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
        
        // 更新文本内容 - 修复显示逻辑
        if (finalTranscript) {
          console.log('🎯 最终识别结果:', finalTranscript);
          if (this.contentText) {
            this.contentText += ' ' + finalTranscript;
          } else {
            this.contentText = finalTranscript;
          }
          // 强制更新UI
          this.$forceUpdate();
        }
        
        if (interimTranscript) {
          console.log('🎯 中间识别结果:', interimTranscript);
          // 显示中间结果（临时显示）
          const tempText = this.contentText + ' ' + interimTranscript;
          this.contentText = tempText;
          this.$forceUpdate();
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

    // 阿里云WebSocket流式识别
    async startAliyunWebSocketRecognition(speechToken, appkey) {
      try {
        console.log('🎤 开始阿里云WebSocket实时识别...');
        
        // 如果没有提供appkey，从后端获取
        if (!appkey) {
          const { appkey: fetchedAppkey } = await this.getAliyunTokenAndAppkey();
          appkey = fetchedAppkey;
        }
        
        // 建立WebSocket连接，Token通过URL参数传递
        const wsUrl = `wss://nls-gateway.aliyuncs.com/ws/v1?token=${speechToken}`;
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          console.log('✅ WebSocket连接已建立');
          // 发送开始识别请求
          this.sendStartRequest(speechToken, appkey);
        };
        
        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };
        
        this.websocket.onclose = (event) => {
          console.log('🔌 WebSocket连接已关闭:', event.code, event.reason);
        };
        
        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket连接错误:', error);
        };
        
      } catch (error) {
        console.error('❌ 启动阿里云WebSocket识别失败:', error);
        throw error;
      }
    },

    // 发送开始识别请求
    sendStartRequest(speechToken, appkey) {
      const startRequest = {
        header: {
          namespace: "SpeechTranscriber",
          name: "StartTranscription",
          status: 20000000,
          message_id: this.generateMessageId(),
          task_id: this.generateTaskId()
        },
        payload: {
          appkey: appkey,
          format: "pcm",
          sample_rate: 16000,
          enable_intermediate_result: true,
          enable_punctuation_prediction: true,
          enable_inverse_text_normalization: true
        }
      };
      
      console.log('📤 发送开始识别请求:', startRequest);
      this.websocket.send(JSON.stringify(startRequest));
    },

    // 处理WebSocket消息
    handleWebSocketMessage(event) {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 收到WebSocket消息:', message);
        
        const { header, payload } = message;
        
        if (header.name === 'TranscriptionResultChanged') {
          // 中间识别结果
          const result = payload.result;
          if (result && result.trim()) {
            console.log('🎯 中间识别结果:', result);
            this.updateContentText(result);
          }
        } else if (header.name === 'SentenceEnd') {
          // 句子结束，完整识别结果
          const result = payload.result;
          if (result && result.trim()) {
            console.log('✅ 完整识别结果:', result);
            this.updateContentText(result);
          }
        } else if (header.name === 'TranscriptionStarted') {
          console.log('🎤 识别已开始');
        } else if (header.name === 'TranscriptionCompleted') {
          console.log('✅ 识别已完成');
        } else if (header.name === 'TaskFailed') {
          console.error('❌ 识别任务失败:', payload);
        }
      } catch (error) {
        console.error('❌ 解析WebSocket消息失败:', error);
      }
    },

    // 更新文本内容
    updateContentText(newText) {
      if (this.contentText) {
        this.contentText += ' ' + newText;
      } else {
        this.contentText = newText;
      }
      this.$forceUpdate();
      console.log('📝 文本已更新:', this.contentText);
    },

    // 生成消息ID
    generateMessageId() {
      return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 生成任务ID
    generateTaskId() {
      return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // 开始Web音频录音
    async startWebAudioRecording() {
      try {
        console.log('🎤 开始Web音频录音...');
        
        // 获取麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        this.mediaStream = stream;
        
        // 创建AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
        
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (event) => {
          if (this.isRecording && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const audioData = event.inputBuffer.getChannelData(0);
            this.sendAudioData(audioData);
          }
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        this.audioProcessor = processor;
        this.audioContext = audioContext;
        
        console.log('✅ Web音频录音已开始');
        
      } catch (error) {
        console.error('❌ Web音频录音失败:', error);
        throw error;
      }
    },

    // 发送音频数据
    sendAudioData(audioData) {
      try {
        // 将Float32Array转换为PCM格式
        const pcmData = this.convertToPCM(audioData);
        
        // 发送音频数据到WebSocket
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(pcmData);
        }
      } catch (error) {
        console.error('❌ 发送音频数据失败:', error);
      }
    },

    // 转换为PCM格式
    convertToPCM(audioData) {
      const buffer = new ArrayBuffer(audioData.length * 2);
      const view = new DataView(buffer);
      
      for (let i = 0; i < audioData.length; i++) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(i * 2, sample * 0x7FFF, true);
      }
      
      return buffer;
    },

    // 阿里云实时识别（保留原有方法作为备选）
    async startAliyunRealtimeRecognition() {
      // 获取用户Token
      const token = uni.getStorageSync('token');
      if (!token) {
        console.error('❌ 用户未登录，无法进行实时识别');
        return;
      }

      // 获取阿里云语音识别Token
      const tokenResponse = await uni.request({
        url: apiUrl('/speech/token'),
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (tokenResponse.statusCode !== 200 || !tokenResponse.data.success) {
        console.error('❌ 获取语音识别Token失败:', tokenResponse.data?.message);
        return;
      }

      const speechToken = tokenResponse.data.data.token;
      console.log('✅ 获取语音识别Token成功');
      
      // 设置实时识别定时器
      this.realtimeRecognitionTimer = setInterval(() => {
        this.performStreamingRecognition(speechToken);
      }, 3000); // 每3秒进行一次识别
    },

    // 执行流式语音识别
    async performStreamingRecognition(speechToken) {
      if (!this.isRecording) {
        return;
      }

      try {
        console.log('🎤 执行流式语音识别...');
        
        // 对于Cordova录音，我们直接调用阿里云流式识别API
        if (this.mediaRecorder && this.mediaRecorder.src) {
          console.log('📁 使用Cordova录音文件进行流式识别:', this.mediaRecorder.src);
          
          // 检查文件是否已经识别过（避免重复识别）
          const currentFile = this.mediaRecorder.src;
          if (this.lastRecognizedFile === currentFile) {
            console.log('⏭️ 文件已识别过，跳过');
            return;
          }
          
          // 调用阿里云流式识别API
          await this.callStreamingRecognitionAPI(speechToken, this.mediaRecorder.src);
          
          // 记录已识别的文件
          this.lastRecognizedFile = currentFile;
        } else {
          console.log('🎤 等待录音文件生成...');
        }
        
      } catch (error) {
        console.error('❌ 流式语音识别失败:', error);
      }
    },

    // 执行实时语音识别（保留原有方法作为备选）
    async performRealtimeRecognition(speechToken) {
      if (!this.isRecording) {
        return;
      }

      try {
        console.log('🎤 执行实时语音识别...');
        
        // 对于Cordova录音，我们直接调用阿里云API进行识别
        // 不需要处理音频数据块，因为Cordova录音文件已经生成
        if (this.mediaRecorder && this.mediaRecorder.src) {
          console.log('📁 使用Cordova录音文件进行识别:', this.mediaRecorder.src);
          
          // 检查文件是否已经识别过（避免重复识别）
          const currentFile = this.mediaRecorder.src;
          if (this.lastRecognizedFile === currentFile) {
            console.log('⏭️ 文件已识别过，跳过');
            return;
          }
          
          // 直接调用阿里云识别API
          await this.callAliyunRecognitionAPI(speechToken, this.mediaRecorder.src);
          
          // 记录已识别的文件
          this.lastRecognizedFile = currentFile;
        } else {
          console.log('🎤 等待录音文件生成...');
        }
        
      } catch (error) {
        console.error('❌ 实时语音识别失败:', error);
      }
    },

    // 调用阿里云流式识别API
    async callStreamingRecognitionAPI(speechToken, filePath) {
      try {
        console.log('🎯 调用阿里云流式识别API...');
        console.log('📁 文件路径:', filePath);
        
        // 获取用户Token
        const token = uni.getStorageSync('token');
        
        // 读取音频文件
        console.log('📖 读取音频文件...');
        const audioData = await this.readAudioFile(filePath);
        
        if (!audioData) {
          console.error('❌ 无法读取音频文件');
          return;
        }
        
        // 将音频数据转换为Base64
        const base64AudioData = uni.arrayBufferToBase64(audioData);
        
        // 调用阿里云流式语音识别接口
        const transcribeResponse = await uni.request({
          url: apiUrl('/speech/streaming-recognize'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            audioData: base64AudioData,
            format: 'wav',
            sampleRate: 16000,
            realtime: true
          }
        });

        if (transcribeResponse.statusCode === 200 && transcribeResponse.data.success) {
          const transcribedText = transcribeResponse.data.data.transcript;
          if (transcribedText && transcribedText !== '识别完成但无结果' && transcribedText.length > 0) {
            console.log('🎯 流式识别结果:', transcribedText);
            
            // 将识别结果添加到文本输入框
            if (this.contentText) {
              this.contentText += ' ' + transcribedText;
            } else {
              this.contentText = transcribedText;
            }
            // 强制更新UI
            this.$forceUpdate();
            console.log('📝 文本已更新:', this.contentText);
          }
        } else {
          console.error('❌ 流式识别失败:', transcribeResponse.data?.message);
        }
        
      } catch (error) {
        console.error('❌ 阿里云流式识别API调用失败:', error);
      }
    },

    // 调用阿里云识别API - 使用流式识别（保留原有方法作为备选）
    async callAliyunRecognitionAPI(speechToken, filePath) {
      try {
        console.log('🎯 调用阿里云流式识别API...');
        console.log('📁 文件路径:', filePath);
        
        // 获取用户Token
        const token = uni.getStorageSync('token');
        
        // 读取音频文件
        console.log('📖 读取音频文件...');
        const audioData = await this.readAudioFile(filePath);
        
        if (!audioData) {
          console.error('❌ 无法读取音频文件');
          return;
        }
        
        // 调用阿里云流式语音识别接口
        const transcribeResponse = await uni.request({
          url: apiUrl('/speech/transcribe'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            filename: filePath,
            realtime: true,
            streaming: true  // 标记为流式识别
          }
        });

        if (transcribeResponse.statusCode === 200 && transcribeResponse.data.success) {
          const transcribedText = transcribeResponse.data.data.transcript;
          if (transcribedText && transcribedText !== '识别完成但无结果' && transcribedText.length > 0) {
            console.log('🎯 流式识别结果:', transcribedText);
            
            // 将识别结果添加到文本输入框
            if (this.contentText) {
              this.contentText += ' ' + transcribedText;
            } else {
              this.contentText = transcribedText;
            }
          }
        } else {
          console.error('❌ 流式识别失败:', transcribeResponse.data?.message);
        }
        
      } catch (error) {
        console.error('❌ 阿里云流式识别API调用失败:', error);
      }
    },

    // 读取音频文件
    async readAudioFile(filePath) {
      try {
        console.log('📖 尝试读取音频文件:', filePath);
        
        // 在Capacitor环境中，使用不同的方法读取文件
        if (window.Capacitor) {
          console.log('📱 使用Capacitor文件系统...');
          
          // 方法1：尝试使用Capacitor Filesystem插件
          if (window.Capacitor.Plugins.Filesystem) {
            try {
              const result = await window.Capacitor.Plugins.Filesystem.readFile({
                path: filePath,
                directory: 'DATA'
              });
              console.log('✅ Capacitor文件读取成功，大小:', result.data.length);
              // 将Base64转换为ArrayBuffer
              const binaryString = atob(result.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              return bytes.buffer;
            } catch (fsError) {
              console.log('⚠️ Capacitor Filesystem读取失败，尝试其他方法:', fsError);
            }
          }
          
          // 方法2：尝试使用fetch读取文件
          try {
            console.log('🌐 尝试使用fetch读取文件...');
            const response = await fetch(filePath);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              console.log('✅ fetch文件读取成功，大小:', arrayBuffer.byteLength);
              return arrayBuffer;
            }
          } catch (fetchError) {
            console.log('⚠️ fetch读取失败:', fetchError);
          }
          
          // 方法3：返回模拟数据用于测试
          console.log('🧪 使用模拟音频数据...');
          const mockAudioData = new ArrayBuffer(1024); // 1KB模拟数据
          return mockAudioData;
          
        } else {
          // 在uni-app环境中使用原有方法
          const fs = uni.getFileSystemManager();
          return new Promise((resolve, reject) => {
            fs.readFile({
              filePath: filePath,
              success: (res) => {
                console.log('✅ 音频文件读取成功，大小:', res.data.byteLength);
                resolve(res.data);
              },
              fail: (err) => {
                console.error('❌ 音频文件读取失败:', err);
                reject(err);
              }
            });
          });
        }
      } catch (error) {
        console.error('❌ 读取音频文件异常:', error);
        return null;
      }
    },

    // 处理实时音频数据
    processRealtimeAudio(audioData) {
      // 这里可以添加实时音频处理逻辑
      console.log('处理实时音频数据:', audioData.size, 'bytes');
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
      
      console.log('🛑 停止录音...');
      
      // 保存当前录音状态，用于判断录音类型
      const wasRecording = this.isRecording;
      
      // 立即设置状态，防止重复点击
      this.isRecording = false;
      this.isProcessing = true;
      
      // 停止计时
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      // 停止实时识别
      if (this.realtimeRecognitionTimer) {
        clearInterval(this.realtimeRecognitionTimer);
        this.realtimeRecognitionTimer = null;
      }
      
      // 停止状态监控
      this.stopStatusMonitoring();
      
      // 停止阿里云插件录音
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AliyunSpeech) {
        console.log('🎤 停止阿里云插件录音...');
        try {
          window.Capacitor.Plugins.AliyunSpeech.stopRecording();
          window.Capacitor.Plugins.AliyunSpeech.removeAllListeners();
          console.log('✅ 阿里云插件录音已停止');
        } catch (error) {
          console.error('❌ 停止阿里云插件录音失败:', error);
        }
      }
      
      // 停止Web Speech API识别
      if (this.speechRecognition) {
        this.speechRecognition.stop();
        this.speechRecognition = null;
      }
      
      // 停止WebSocket连接
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
        console.log('🔌 WebSocket连接已关闭');
      }
      
      // 停止音频处理
      if (this.audioProcessor) {
        this.audioProcessor.disconnect();
        this.audioProcessor = null;
        console.log('🎵 音频处理器已停止');
      }
      
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
        console.log('🎵 音频上下文已关闭');
      }
      
      // 检测环境并停止录音
      if (this.mediaStream) {
        console.log('🌐 停止Web录音...');
        this.stopWebRecording();
      } else if (this.mediaRecorder && typeof this.mediaRecorder.stopRecord === 'function') {
        console.log('🎤 停止Cordova录音...');
        this.stopCordovaRecording();
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
      } else if (wasRecording) {
        console.log('🎭 停止模拟录音模式...');
        this.stopSimulatedRecording();
      } else {
        console.log('⚠️ 当前环境不支持录音API');
        this.handleRecordingError('录音API不可用');
      }
      
      // 确保页面滚动恢复正常
      this.$nextTick(() => {
        // 强制触发页面重新渲染
        this.$forceUpdate();
      });
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
          this.mediaStream = null;
        }
        
        // 清理MediaRecorder
        this.mediaRecorder = null;
        
      } catch (error) {
        console.error('❌ 停止Web录音失败:', error);
        this.handleRecordingError('停止录音失败');
      }
    },

    // 停止Cordova录音
    stopCordovaRecording() {
      try {
        console.log('🎤 停止Cordova录音...');
        
        if (this.mediaRecorder) {
          // 停止录音
          this.mediaRecorder.stopRecord();
          console.log('✅ Cordova录音已停止');
          
          // 获取录音文件路径
          const filePath = this.mediaRecorder.src;
          console.log('📁 录音文件路径:', filePath);
          
          // 处理录音成功
          this.handleRecordingSuccess(filePath);
          
          // 清理Media对象
          this.mediaRecorder.release();
          this.mediaRecorder = null;
        }
        
      } catch (error) {
        console.error('❌ 停止Cordova录音失败:', error);
        this.handleRecordingError('停止录音失败');
      }
    },

    // 停止模拟录音模式
    stopSimulatedRecording() {
      try {
        console.log('🎭 停止模拟录音模式...');
        
        // 停止计时
        if (this.recordingTimer) {
          clearInterval(this.recordingTimer);
          this.recordingTimer = null;
        }
        
        // 停止状态监控
        this.stopStatusMonitoring();
        
        // 重置状态
        this.isRecording = false;
        this.isProcessing = false;
        
        // 显示完成提示
        uni.showToast({
          title: '录音完成',
          icon: 'success'
        });
        
        console.log('✅ 模拟录音模式停止成功');
        console.log('📊 录音状态检查 - isRecording:', this.isRecording);
        console.log('📊 按钮文字检查 - recordButtonText:', this.recordButtonText);
        
      } catch (error) {
        console.error('❌ 停止模拟录音模式失败:', error);
        // 即使出错也要重置状态
        this.isRecording = false;
        this.isProcessing = false;
        uni.showToast({
          title: '录音停止',
          icon: 'none'
        });
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
        const response = await fetch(apiUrl('/speech/upload'), {
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
            title: '录制完成',
            icon: 'success'
          });
          
          // 不再进行重复识别，因为已经有实时识别了
          
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
        title: '录制完成',
        icon: 'success'
      });
      
      // 不再自动转录，因为已经有实时识别了
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
          url: apiUrl('/speech/token'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Token响应:', tokenResponse);

        // 检查认证错误
        if (handleAuthError(tokenResponse)) {
          return;
        }

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
          url: apiUrl('/speech/upload'),
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
          url: apiUrl('/speech/transcribe'),
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
          url: apiUrl('/speech/transcribe'),
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
    },

    // AI补全文本
    async aiCompleteText() {
      if (!this.contentText || this.contentText.trim().length === 0) {
        uni.showToast({
          title: '请先输入一些内容',
          icon: 'none'
        });
        return;
      }

      if (this.isAiCompleting) {
        return;
      }

      this.isAiCompleting = true;
      this.originalText = this.contentText;

      try {
        console.log('🤖 开始AI补全文本...');
        
        // 获取用户Token
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('用户未登录');
        }

        // 调用AI补全API
        const response = await uni.request({
          url: apiUrl('/ai/complete-text'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            text: this.contentText,
            chapterId: this.chapterId,
            chapterTitle: this.chapterTitle
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          this.aiCompletedText = response.data.data.completedText;
          this.showAiDiff = true;
          
          console.log('✅ AI补全完成');
          uni.showToast({
            title: 'AI补全完成',
            icon: 'success'
          });
        } else {
          throw new Error(response.data?.message || 'AI补全失败');
        }

      } catch (error) {
        console.error('❌ AI补全失败:', error);
        uni.showToast({
          title: 'AI补全失败: ' + (error.message || '未知错误'),
          icon: 'error',
          duration: 3000
        });
      } finally {
        this.isAiCompleting = false;
      }
    },

    // 接受AI补全
    acceptAiCompletion() {
      this.contentText = this.aiCompletedText;
      this.showAiDiff = false;
      this.originalText = '';
      this.aiCompletedText = '';
      
      uni.showToast({
        title: '已接受AI补全',
        icon: 'success'
      });
    },

    // 拒绝AI补全
    rejectAiCompletion() {
      this.showAiDiff = false;
      this.originalText = '';
      this.aiCompletedText = '';
      
      uni.showToast({
        title: '已拒绝AI补全',
        icon: 'none'
      });
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

.control-buttons {
  display: flex;
  align-items: center;
  gap: 30px;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  touch-action: manipulation;
  user-select: none;
}

.ai-complete-btn:hover {
  transform: scale(1.05);
  border-color: #007AFF;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2);
}

.ai-complete-btn.processing {
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
  color: #333;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-dot {
  width: 6px;
  height: 6px;
  background: #007AFF;
  border-radius: 50%;
  animation: loading 1.2s infinite ease-in-out;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.1s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.2s;
}

.ai-complete-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

/* AI补全diff显示样式 */
.ai-diff-container {
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
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
}

.diff-ai .diff-label {
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
    transform: scale(1.2);
    opacity: 1;
  }
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
