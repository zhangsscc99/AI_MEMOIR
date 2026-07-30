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

        <view class="image-analysis-section">
          <view class="image-section-header">章节图片</view>

          <view v-if="!selectedImage" class="image-upload" @click="chooseImage">
            <view class="upload-icon">
              <image src="/static/icons/camera.svg" class="upload-camera" mode="aspectFit"></image>
            </view>
            <text class="upload-text">添加图片，丰富本章记忆</text>
          </view>

          <view v-else class="image-preview">
            <image :src="imagePreviewUrl" class="preview-image" mode="aspectFill"></image>
            <view class="image-actions">
              <button class="image-action-btn" @click.stop="chooseImage">更换图片</button>
              <button class="image-action-btn remove" @click.stop="removeImage">移除图片</button>
            </view>
          </view>

          <button
            class="analyze-btn"
            :class="{ loading: isAnalyzingImage, disabled: !selectedImage }"
            :disabled="!selectedImage || isAnalyzingImage"
            @click="analyzeChapterImage"
          >
            {{ isAnalyzingImage ? '解析中…' : '解析图片' }}
          </button>
          <text class="analyze-tip">解析结果将追加到正文末尾，保持故事语气一致。</text>
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
      // 音频数据队列（用于重连时发送）
      audioQueue: [],
      audioProcessingPromise: Promise.resolve(),
      pcmSampleRate: 16000,
      useAudioProcessorStreaming: false,
      allowAudioStreaming: false,
      // WebSocket相关
      websocket: null,
      audioProcessor: null,
      audioContext: null,
      audioSourceNode: null,
      websocketKeepAliveTimer: null,
      decodeAudioContext: null,
      currentToken: null,
      currentApiKey: null,
      speechProvider: 'aliyun',
      currentSpeechConfig: null,
      aliyunAppKey: null,
      aliyunRegion: null,
      aliyunWsUrl: null,
      aliyunTaskId: null,
      lastPartialText: '',
      // AI补全相关
      isAiCompleting: false,
      showAiDiff: false,
      originalText: '',
      aiCompletedText: '',
      // 图片解析相关
      selectedImage: '',
      uploadedImageUrl: '',
      isAnalyzingImage: false
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
    },
    imagePreviewUrl() {
      if (!this.selectedImage) {
        return '';
      }

      const lower = this.selectedImage.toLowerCase();
      if (
        lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        lower.startsWith('data:') ||
        lower.startsWith('blob:') ||
        lower.startsWith('file://') ||
        lower.startsWith('wxfile://')
      ) {
        return this.selectedImage;
      }

      return this.resolveFileUrl(this.selectedImage);
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

    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const path = (res.tempFiles && res.tempFiles[0] && res.tempFiles[0].path) || (res.tempFilePaths && res.tempFilePaths[0]);
          if (path) {
            this.selectedImage = path;
            this.uploadedImageUrl = '';
          }
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

    removeImage() {
      this.selectedImage = '';
      this.uploadedImageUrl = '';
    },

    async goBack() {
      try {
        await this.saveChapter({ autoNavigate: false, silent: true });
      } catch (error) {
        console.log('返回时自动保存失败:', error);
      } finally {
        uni.navigateBack();
      }
    },
    
    onTextInput(event) {
      this.contentText = event.detail.value || event.target.value || '';
      this.lastPartialText = '';
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

    async loadSavedContent() {
      try {
        // 获取当前用户ID
        const userInfo = uni.getStorageSync('user');
        const userId = userInfo?.id;

        if (!userId) {
          return;
        }

        let hasContent = false;

        // 优先读取本地缓存
        const savedContent = uni.getStorageSync(`chapter_${this.chapterId}_${userId}`);
        if (savedContent) {
          const content = JSON.parse(savedContent);
          this.contentText = content.text || '';
          this.recordings = content.recordings || [];
          if (content.image) {
            this.selectedImage = content.image;
            this.uploadedImageUrl = content.image;
          }
          hasContent = !!((this.contentText && this.contentText.trim().length > 0) || content.image);
        }

        if (hasContent && this.selectedImage) {
          return;
        }

        const token = uni.getStorageSync('token');
        if (!token) {
          return;
        }

        const response = await uni.request({
          url: apiUrl(`/chapters/${this.chapterId}`),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (handleAuthError(response)) {
          return;
        }

        if (response.statusCode === 200 && response.data.success) {
          const payload = response.data?.data || {};
          const chapter = payload.chapter || payload;

          this.contentText = chapter.content || '';
          this.recordings = Array.isArray(chapter.recordings) ? chapter.recordings : [];
          this.selectedImage = chapter.backgroundImage || '';
          this.uploadedImageUrl = chapter.backgroundImage || '';

          const cachePayload = {
            text: this.contentText,
            recordings: this.recordings,
            lastModified: chapter.updatedAt || new Date().toISOString(),
            completed: this.contentText.length > 0 || this.recordings.length > 0,
            image: this.uploadedImageUrl
          };

          uni.setStorageSync(`chapter_${this.chapterId}_${userId}`, JSON.stringify(cachePayload));

          const savedStatus = uni.getStorageSync(`chapter_status_${userId}`) || '{}';
          const statusMap = JSON.parse(savedStatus);
          statusMap[this.chapterId] = {
            completed: cachePayload.completed,
            lastModified: cachePayload.lastModified
          };
          uni.setStorageSync(`chapter_status_${userId}`, JSON.stringify(statusMap));
        }
      } catch (error) {
        console.log('加载保存内容失败:', error);
      }
    },

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
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            let data = {};
            try {
              data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            } catch (parseError) {
              reject(new Error('解析上传结果失败'));
              return;
            }

            if (res.statusCode === 401) {
              handleAuthError({ statusCode: res.statusCode, data });
              reject(new Error('登录已过期'));
              return;
            }

            if (res.statusCode !== 200 || !data.success) {
              reject(new Error(data.message || '图片上传失败'));
              return;
            }

            resolve(data.data?.url || data.url);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },

    async ensureImageUploaded() {
      if (!this.selectedImage) {
        this.uploadedImageUrl = '';
        return null;
      }

      const lower = this.selectedImage.toLowerCase();
      const isRemote = lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('/uploads/');

      if (isRemote) {
        this.uploadedImageUrl = this.selectedImage;
        return this.selectedImage;
      }

      if (this.uploadedImageUrl) {
        return this.uploadedImageUrl;
      }

      const uploadedUrl = await this.uploadImageToServer(this.selectedImage);
      this.uploadedImageUrl = uploadedUrl;
      this.selectedImage = uploadedUrl;
      return uploadedUrl;
    },

    async saveChapter(options = {}) {
      const { autoNavigate = true, silent = false } = options;

      try {
        // 检查用户是否登录
        const token = uni.getStorageSync('token');
        if (!token) {
          if (!silent) {
            uni.showToast({
              title: '请先登录',
              icon: 'error'
            });
          }
          return;
        }

        // 显示加载状态
        if (!silent) {
          uni.showLoading({
            title: '保存中...'
          });
        }

        let backgroundImage = null;
        try {
          backgroundImage = await this.ensureImageUploaded();
        } catch (uploadError) {
          if (!silent) {
            uni.hideLoading();
            uni.showToast({
              title: uploadError.message || '图片上传失败',
              icon: 'error'
            });
          }
          throw uploadError;
        }

        const saveData = {
          chapterId: this.chapterId,
          title: this.chapterTitle,
          content: this.contentText,
          recordings: this.recordings,
          backgroundImage: backgroundImage || null
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

        if (!silent) {
          uni.hideLoading();
        }

        // 检查认证错误
        if (handleAuthError(response)) {
          return;
        }

        if (response.statusCode === 200 && response.data.success) {
          // 获取当前用户ID
          const userInfo = uni.getStorageSync('user');
          const userId = userInfo?.id;
          
          if (userId) {
            const cacheContent = {
              text: this.contentText,
              recordings: this.recordings,
              image: backgroundImage || '',
              lastModified: new Date().toISOString(),
              completed: this.contentText.length > 0 || this.recordings.length > 0
            };

            uni.setStorageSync(`chapter_${this.chapterId}_${userId}`, JSON.stringify(cacheContent));

            const savedStatus = uni.getStorageSync(`chapter_status_${userId}`) || '{}';
            const statusMap = JSON.parse(savedStatus);
            statusMap[this.chapterId] = {
              completed: cacheContent.completed,
              lastModified: cacheContent.lastModified
            };
            uni.setStorageSync(`chapter_status_${userId}`, JSON.stringify(statusMap));
          }

          if (!silent) {
            uni.showToast({
              title: '保存成功',
              icon: 'success'
            });
          }

          if (autoNavigate) {
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          }

          return true;
        } else {
          throw new Error(response.data?.message || '保存失败');
        }
      } catch (error) {
        if (!silent) {
          uni.hideLoading();
        }
        console.error('保存章节失败:', error);
        
        // 如果是网络错误，尝试本地保存
        if (error.errMsg && error.errMsg.includes('network')) {
          try {
            // 获取当前用户ID
            const userInfo = uni.getStorageSync('user');
            const userId = userInfo?.id;
            
            if (userId) {
              const cacheContent = {
                text: this.contentText,
                recordings: this.recordings,
                image: backgroundImage || this.uploadedImageUrl || '',
                lastModified: new Date().toISOString(),
                completed: this.contentText.length > 0 || this.recordings.length > 0,
                needSync: true
              };

              uni.setStorageSync(`chapter_${this.chapterId}_${userId}`, JSON.stringify(cacheContent));

            if (!silent) {
              uni.showToast({
                title: '已离线保存',
                icon: 'success'
              });
            }

            if (autoNavigate) {
              setTimeout(() => {
                uni.navigateBack();
              }, 1500);
            }

            return true;
            }
          } catch (localError) {
            if (!silent) {
              uni.showToast({
                title: '保存失败',
                icon: 'error'
              });
            }
          }

          return true;
        } else {
          if (!silent) {
            uni.showToast({
              title: error.message || '保存失败',
              icon: 'error'
            });
          }
          throw error;
        }
      }
    },

    async analyzeChapterImage() {
      if (!this.selectedImage) {
        uni.showToast({
          title: '请先添加图片',
          icon: 'none'
        });
        return;
      }

      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'error'
        });
        return;
      }

      try {
        this.isAnalyzingImage = true;
        const imageUrl = await this.ensureImageUploaded();

        if (!imageUrl) {
          uni.showToast({
            title: '请先上传图片',
            icon: 'none'
          });
          return;
        }

        const response = await uni.request({
          url: apiUrl('/ai/vision/analyze'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            imageUrl,
            chapterId: this.chapterId
          }
        });

        if (handleAuthError(response)) {
          return;
        }

        if (response.statusCode === 200 && response.data.success) {
          const addition = (response.data.data?.text || '').trim();
          if (addition) {
            const sanitizedExisting = this.contentText ? this.contentText.replace(/\s*$/, '') : '';
            this.contentText = sanitizedExisting
              ? `${sanitizedExisting}\n\n${addition}`
              : addition;
            await this.saveChapter({ autoNavigate: false, silent: true });
            uni.showToast({
              title: '解析完成',
              icon: 'success'
            });
          } else {
            uni.showToast({
              title: '未解析到有效内容',
              icon: 'none'
            });
          }
        } else {
          throw new Error(response.data?.message || '解析失败');
        }
      } catch (error) {
        console.error('解析图片失败:', error);
        uni.showToast({
          title: error.message || '解析失败',
          icon: 'error'
        });
      } finally {
        this.isAnalyzingImage = false;
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

      this.allowAudioStreaming = true;
      this.lastPartialText = '';
      this.audioQueue = [];
      this.audioProcessingPromise = Promise.resolve();

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
      try {
        console.log('🌐 使用阿里云语音实时识别...');
        await this.startAliyunWebRecording();
      } catch (error) {
        console.error('❌ 阿里云实时识别启动失败:', error);
        this.handleRecordingError(error.message || '语音识别启动失败');
        return;
      }
      
      console.log('📱 显示开始录制提示');
      uni.showToast({
        title: '开始录制',
        icon: 'none'
      });
      
      console.log('📊 录音状态检查 - isRecording:', this.isRecording);
      console.log('📊 按钮文字检查 - recordButtonText:', this.recordButtonText);
    },

    // 开始阿里云Web实时语音识别
    async startAliyunWebRecording() {
      try {
        console.log('🌐 开始阿里云Web实时语音识别...');

        console.log('🔐 检查Web录音权限...');
        const hasPermission = await this.checkWebRecordingPermission();
        if (!hasPermission) {
          throw new Error('录音权限被拒绝');
        }

        console.log('🔑 获取阿里云语音识别配置...');
        const config = await this.getAliyunSpeechConfig();
        console.log('✅ 语音识别配置已获取 (阿里云)');

        this.speechProvider = 'aliyun';
        this.currentSpeechConfig = config;
        await this.startWebRecording(config);

        console.log('✅ 阿里云Web实时语音识别已开始');

      } catch (error) {
        console.error('❌ 阿里云Web实时语音识别启动失败:', error);
        throw error;
      }
    },

    // 获取阿里云语音识别配置
    async getAliyunSpeechConfig() {
      try {
        let token = uni.getStorageSync('token');
        if (!token) {
          console.log('🔐 用户未登录，尝试自动登录...');
          await this.autoLogin();
          token = uni.getStorageSync('token');
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

        if (tokenResponse.data.success) {
          const data = tokenResponse.data.data || {};
          const speechToken = data.token;
          const appKey = data.appKey;
          const region = data.region || data.regionId || 'cn-shanghai';
          const websocketUrl = data.websocketUrl || `wss://nls-gateway-${region}.aliyuncs.com/ws/v1`;
          const sampleRate = data.sampleRate || this.pcmSampleRate || 16000;

          this.currentToken = speechToken;
          this.currentApiKey = appKey;
          this.aliyunAppKey = appKey;
          this.aliyunRegion = region;
          this.aliyunWsUrl = websocketUrl;
          this.pcmSampleRate = sampleRate;

          console.log('✅ 获取阿里云语音识别配置成功:', {
            region,
            websocketUrl,
            sampleRate
          });

          return {
            provider: 'aliyun',
            token: speechToken,
            appKey,
            websocketUrl,
            region,
            sampleRate
          };
        } else {
          throw new Error('获取语音识别Token失败: ' + tokenResponse.data.message);
        }
      } catch (error) {
        console.error('❌ 获取阿里云语音识别配置失败:', error);
        throw error;
      }
    },

    // 检查是否为Capacitor环境
    isCapacitorEnvironment() {
      return !!(window.Capacitor && window.Capacitor.isNativePlatform());
    },

    // 自动登录方法
    async autoLogin() {
      try {
        console.log('🔐 开始自动登录...');
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
        
        if (loginResponse.data.success) {
          const { token, user } = loginResponse.data.data;
          uni.setStorageSync('token', token);
          uni.setStorageSync('user', user);
          console.log('✅ 自动登录成功');
          return true;
        } else {
          console.error('❌ 自动登录失败:', loginResponse.data.message);
          return false;
        }
      } catch (error) {
        console.error('❌ 自动登录异常:', error);
        return false;
      }
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

    async startWebRecording(config) {
      try {
        console.log('🌐 开始Web录音...');

        const provider = config?.provider || this.speechProvider || 'aliyun';
        this.speechProvider = provider;
        if (config?.sampleRate) {
          this.pcmSampleRate = config.sampleRate;
        }
        this.currentSpeechConfig = config;
        
        // 请求麦克风权限，添加更详细的错误处理
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: config?.sampleRate || this.pcmSampleRate,
            channelCount: 1
          } 
        });
        
        this.mediaStream = stream;
        await this.setupAudioProcessing(stream);

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
        
        // 创建MediaRecorder，设置timeslice为100ms以获取实时数据
        this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
          console.log('收到音频数据:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
            if (!this.useAudioProcessorStreaming) {
              this.processRealtimeAudio(event.data);
            }
          }
        };
        
        this.mediaRecorder.onstart = () => {
          console.log('🎤 MediaRecorder 已开始录音');
          this.currentSpeechConfig = config;

          this.startAliyunWebSocketRecognition(config);
          this.keepWebSocketAlive();
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
            this.mediaRecorder.start(100); // 每100ms收集一次数据，实现实时流式传输
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
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          console.log('📡 WebSocket已连接，跳过重复启动');
          return;
        }

        let config;
        if (this.currentToken && this.aliyunAppKey) {
          config = {
            provider: 'aliyun',
            token: this.currentToken,
            appKey: this.aliyunAppKey,
            websocketUrl: this.aliyunWsUrl,
            region: this.aliyunRegion,
            sampleRate: this.pcmSampleRate
          };
        } else {
          config = await this.getAliyunSpeechConfig();
        }

        await this.startAliyunWebSocketRecognition(config);

      } catch (error) {
        console.error('❌ 启动实时语音识别失败:', error);
      }
    },

    async setupAudioProcessing(stream) {
      try {
        const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
        if (!NativeAudioContext) {
          console.warn('⚠️ AudioContext不可用，继续使用MediaRecorder回退');
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
          this.audioSourceNode = null;
        }

        if (this.audioProcessor) {
          try {
            this.audioProcessor.disconnect();
          } catch (error) {
            console.warn('⚠️ 断开旧音频处理器失败:', error);
          }
          this.audioProcessor = null;
        }

        const sourceNode = this.audioContext.createMediaStreamSource(stream);
        const processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
        const contextRate = this.audioContext.sampleRate;
        const targetRate = this.pcmSampleRate;

        processorNode.onaudioprocess = (event) => {
          if (!this.allowAudioStreaming || !this.isRecording) {
            return;
          }

          const inputBuffer = event.inputBuffer;
          if (!inputBuffer) {
            return;
          }

          const channelData = inputBuffer.getChannelData(0);
          if (!channelData || !channelData.length) {
            return;
          }

          const sourceRate = inputBuffer.sampleRate || contextRate;
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
              console.error('❌ 通过音频处理器发送音频失败:', error);
            }
          }
        };

        sourceNode.connect(processorNode);
        processorNode.connect(this.audioContext.destination);

        this.audioSourceNode = sourceNode;
        this.audioProcessor = processorNode;
        this.useAudioProcessorStreaming = true;

        console.log('✅ 音频处理器初始化完成，采样率:', contextRate, '→', targetRate);
      } catch (error) {
        console.error('❌ 初始化音频处理器失败:', error);
        this.useAudioProcessorStreaming = false;
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

        console.log('🎤 开始阿里云WebSocket实时识别...');
        console.log('🔑 Token前缀:', token.substring(0, 12) + '...');
        console.log('🆔 AppKey:', appKey);
        console.log('🌏 Region:', region || '默认');

        this.currentToken = token;
        this.currentApiKey = appKey;
        this.aliyunAppKey = appKey;
        this.aliyunRegion = region || this.aliyunRegion;
        this.pcmSampleRate = sampleRate;
        this.currentSpeechConfig = { ...config, provider: 'aliyun', sampleRate };

        this.audioQueue = [];
        this.audioProcessingPromise = Promise.resolve();
        this.allowAudioStreaming = true;

        let wsUrl = websocketUrl;
        if (wsUrl.includes('?')) {
          wsUrl = `${wsUrl}&token=${encodeURIComponent(token)}`;
        } else {
          wsUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
        }
        console.log('🌐 WebSocket URL:', wsUrl);

        if (this.websocket) {
          try {
            this.websocket.close();
          } catch (closeError) {
            console.warn('⚠️ 关闭旧的WebSocket失败:', closeError);
          }
        }

        this.websocket = new WebSocket(wsUrl);
        this.websocket.binaryType = 'arraybuffer';

        const taskId = this.generateMessageId();
        this.aliyunTaskId = taskId;

        this.websocket.onopen = () => {
          console.log('✅ 阿里云WebSocket连接已建立');
          const startMessage = {
            header: {
              message_id: this.generateMessageId(),
              task_id: taskId,
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
          } catch (sendError) {
            console.error('❌ 发送Start指令失败:', sendError);
          }
        };

        this.websocket.onmessage = (event) => {
          this.handleAliyunWebSocketMessage(event);
        };

        this.websocket.onclose = (event) => {
          console.log('🔌 阿里云WebSocket连接已关闭:', event.code, event.reason);
          this.allowAudioStreaming = false;
        };

        this.websocket.onerror = (error) => {
          console.error('❌ 阿里云WebSocket连接错误:', error);
          this.allowAudioStreaming = false;
        };

      } catch (error) {
        console.error('❌ 启动阿里云WebSocket识别失败:', error);
        this.allowAudioStreaming = false;
        throw error;
      }
    },

    // 保持WebSocket连接活跃
    keepWebSocketAlive() {
      if (this.websocketKeepAliveTimer) {
        clearInterval(this.websocketKeepAliveTimer);
        this.websocketKeepAliveTimer = null;
      }

      this.websocketKeepAliveTimer = setInterval(() => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          console.log('💓 WebSocket连接正常');
        }
      }, 5000);
    },

    // 停止保持WebSocket活跃
    stopKeepWebSocketAlive() {
      if (this.websocketKeepAliveTimer) {
        clearInterval(this.websocketKeepAliveTimer);
        this.websocketKeepAliveTimer = null;
        console.log('🛑 停止WebSocket保活');
      }
    },

    // 发送停止识别请求
    sendStopRequest() {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        console.log('⚠️ WebSocket未连接，无法发送停止请求');
        return;
      }

      try {
        const stopMessage = {
          header: {
            message_id: this.generateMessageId(),
            task_id: this.aliyunTaskId || this.generateMessageId(),
            namespace: 'SpeechTranscriber',
            name: 'StopTranscription',
            appkey: this.aliyunAppKey || this.currentApiKey
          },
          payload: {}
        };
        this.websocket.send(JSON.stringify(stopMessage));
        console.log('🛑 已发送阿里云StopTranscription指令');
      } catch (error) {
        console.error('❌ 发送StopTranscription指令失败:', error);
      }
    },

    scheduleStopRequest() {
      (async () => {
        try {
          if (this.audioProcessingPromise) {
            await this.audioProcessingPromise.catch(error => {
              console.error('❌ 等待音频处理完成时出错:', error);
            });
          }

          await this.processAudioQueue();
        } catch (error) {
          console.error('❌ 停止前处理音频队列失败:', error);
        } finally {
          this.sendStopRequest();
          this.audioQueue = [];
          this.audioProcessingPromise = Promise.resolve();
          this.allowAudioStreaming = false;
          if (this.decodeAudioContext && this.decodeAudioContext.state !== 'closed') {
            try {
              this.decodeAudioContext.close();
            } catch (closeError) {
              console.warn('⚠️ 关闭AudioContext时出错:', closeError);
            }
          }
          this.decodeAudioContext = null;
        }
      })();
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
          case 'SentenceBegin':
            console.log('📝 阿里云检测到句子开始:', payload?.index);
            break;
          case 'TranscriptionResultChanged': {
            const text = payload?.result || payload?.text;
            if (text) {
              console.log('🎯 阿里云中间结果:', text);
              this.updateContentText(text, false);
            }
            break;
          }
          case 'SentenceEnd': {
            const text = payload?.result || payload?.text;
            if (text) {
              console.log('✅ 阿里云最终结果:', text);
              this.updateContentText(text, true);
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
              console.log('ℹ️ 阿里云未处理事件:', name, payload);
            }
        }
      } catch (error) {
        console.error('❌ 解析阿里云WebSocket消息失败:', error);
      }
    },

    // 更新文本内容
    updateContentText(newText, isFinal = false) {
      if (!newText || !newText.trim()) {
        console.log('⚠️ 空文本，跳过更新');
        return;
      }

      const trimmedText = newText.trim();
      let baseText = this.contentText || '';

      if (this.lastPartialText) {
        const partialTrimmed = this.lastPartialText.trim();
        if (partialTrimmed && baseText.endsWith(partialTrimmed)) {
          baseText = baseText.slice(0, baseText.length - partialTrimmed.length).trimEnd();
        }
      }

      let combinedText = baseText ? baseText.replace(/\s+$/u, '') : '';
      if (combinedText) {
        combinedText += combinedText.endsWith(' ') ? '' : ' ';
        combinedText += trimmedText;
      } else {
        combinedText = trimmedText;
      }

      this.contentText = combinedText;
      this.lastPartialText = isFinal ? '' : trimmedText;

      console.log('📝 文本已更新:', this.contentText);
      console.log('📝 新增文本:', trimmedText, '最终结果:', isFinal);

      this.$nextTick(() => {
        this.$forceUpdate();
      });
    },

    // 生成消息ID (32位十六进制格式)
    generateMessageId() {
      const hexDigits = "0123456789abcdef";
      let messageId = "";
      for (let i = 0; i < 32; i++) {
        messageId += hexDigits[Math.floor(Math.random() * 16)];
      }
      return messageId;
    },
    
    generateSessionId() {
      const base = Math.random().toString(36).substring(2, 12);
      return `memoir-${base}`;
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
      if (!audioData) {
        console.warn('⚠️ 未接收到有效的音频数据');
        return;
      }

      if (!this.allowAudioStreaming) {
        console.log('🛑 当前不允许发送音频流，忽略数据');
        return;
      }

      const handleChunk = async () => {
        if (!this.allowAudioStreaming) {
          console.log('🛑 音频流已停止，跳过处理');
          return;
        }

        console.log('处理实时音频数据:', audioData.size || audioData.byteLength || 0, 'bytes');
        console.log('🔍 音频数据类型:', audioData.constructor ? audioData.constructor.name : typeof audioData);
        console.log('🔍 WebSocket状态:', this.websocket ? this.websocket.readyState : 'null');

        const pcmBuffer = await this.preparePcmBuffer(audioData);

        if (!pcmBuffer || !pcmBuffer.byteLength) {
          console.warn('⚠️ PCM转换失败或为空，跳过当前音频块');
          return;
        }

        if (!this.allowAudioStreaming) {
          console.log('🛑 音频流已停止，在发送前终止');
          return;
        }

        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          try {
            this.websocket.send(pcmBuffer);
            console.log('✅ 音频数据发送成功 (PCM格式)，大小:', pcmBuffer.byteLength, 'bytes');
          } catch (error) {
            console.error('❌ 发送音频数据失败:', error);
            if (this.allowAudioStreaming) {
              this.audioQueue.push(pcmBuffer);
            }
          }
        } else if (this.allowAudioStreaming) {
          console.log('📦 WebSocket未就绪，将PCM音频数据加入队列:', pcmBuffer.byteLength, 'bytes');
          this.audioQueue.push(pcmBuffer);

          if (!this.websocket || this.websocket.readyState === WebSocket.CLOSED) {
            if ((this.isRecording || this.isProcessing) && this.currentToken && this.currentApiKey && this.aliyunAppKey) {
              console.log('🔄 尝试重连WebSocket...');
              const config = this.currentSpeechConfig || {
                provider: 'aliyun',
                token: this.currentToken,
                appKey: this.aliyunAppKey || this.currentApiKey,
                websocketUrl: this.aliyunWsUrl,
                region: this.aliyunRegion,
                sampleRate: this.pcmSampleRate
              };
              this.startAliyunWebSocketRecognition(config);
            }
          }
        }
      };

      const basePromise = this.audioProcessingPromise || Promise.resolve();
      this.audioProcessingPromise = basePromise
        .then(handleChunk)
        .catch(error => {
          console.error('❌ 处理音频数据失败:', error);
        });
    },

    async preparePcmBuffer(audioData) {
      try {
        if (!audioData) {
          return null;
        }

        if (audioData instanceof ArrayBuffer) {
          return audioData;
        }

        if (ArrayBuffer.isView(audioData)) {
          return audioData.buffer;
        }

        if (audioData instanceof Blob) {
          return await this.convertWebMToPCM(audioData);
        }

        if (typeof audioData.arrayBuffer === 'function') {
          return await audioData.arrayBuffer();
        }

        console.warn('⚠️ 不支持的音频数据类型，无法转换为PCM');
        return null;
      } catch (error) {
        console.error('❌ 准备PCM音频数据失败:', error);
        return null;
      }
    },

    // 处理音频队列
    async processAudioQueue() {
      if (!this.allowAudioStreaming) {
        if (this.audioQueue.length) {
          console.log('🧹 音频流已关闭，清空待发送队列');
        }
        this.audioQueue = [];
        return;
      }

      if (this.audioQueue.length === 0) {
        console.log('📦 音频队列为空');
        return;
      }

      console.log('📦 处理音频队列，队列长度:', this.audioQueue.length);
      
      while (this.audioQueue.length > 0 && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const queuedData = this.audioQueue.shift();
        const buffer = queuedData instanceof ArrayBuffer ? queuedData : queuedData?.buffer;

        if (!buffer || !buffer.byteLength) {
          console.warn('⚠️ 队列中的音频数据无效，已跳过');
          continue;
        }

        try {
          this.websocket.send(buffer);
          console.log('✅ 发送队列中的音频数据:', buffer.byteLength, 'bytes (PCM格式)');
        } catch (error) {
          console.error('❌ 发送队列音频数据失败:', error);
          this.audioQueue.unshift(buffer);
          break;
        }
      }

      console.log('📦 音频队列处理完成，剩余:', this.audioQueue.length);
    },

    // 将WebM格式转换为PCM格式
    async convertWebMToPCM(webmBlob) {
      try {
        console.log('🔄 开始转换WebM到PCM格式...');

        const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
        if (!NativeAudioContext) {
          throw new Error('AudioContext 不可用');
        }

        if (!this.decodeAudioContext || this.decodeAudioContext.state === 'closed') {
          this.decodeAudioContext = new NativeAudioContext();
        }

        const arrayBuffer = await webmBlob.arrayBuffer();

        const audioBuffer = await new Promise((resolve, reject) => {
          this.decodeAudioContext.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
        });

        const resampledData = await this.resampleAudioData(audioBuffer, this.pcmSampleRate);

        if (!resampledData || !resampledData.length) {
          throw new Error('重采样结果为空');
        }

        const pcmBuffer = this.float32ToPCM(resampledData);
        console.log('✅ WebM到PCM转换完成，字节数:', pcmBuffer.byteLength);
        return pcmBuffer;
      } catch (error) {
        console.error('❌ WebM到PCM转换失败:', error);
        // 如果转换失败，返回null，不发送数据
        return null;
      }
    },

    async resampleAudioData(audioBuffer, targetSampleRate) {
      if (!audioBuffer) {
        return null;
      }

      if (audioBuffer.sampleRate === targetSampleRate) {
        return audioBuffer.getChannelData(0);
      }

      const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

      if (OfflineAudioContext) {
        try {
          const frameCount = Math.ceil(audioBuffer.duration * targetSampleRate);
          const offlineContext = new OfflineAudioContext(1, frameCount, targetSampleRate);
          const bufferSource = offlineContext.createBufferSource();
          bufferSource.buffer = audioBuffer;
          bufferSource.connect(offlineContext.destination);
          bufferSource.start(0);
          const renderedBuffer = await offlineContext.startRendering();
          return renderedBuffer.getChannelData(0);
        } catch (error) {
          console.warn('⚠️ OfflineAudioContext 重采样失败，使用降级算法:', error);
        }
      }

      const channelData = audioBuffer.getChannelData(0);
      return this.downsampleBuffer(channelData, audioBuffer.sampleRate, targetSampleRate);
    },

    downsampleBuffer(channelData, sourceSampleRate, targetSampleRate) {
      if (!channelData || sourceSampleRate === targetSampleRate) {
        return channelData;
      }

      const sampleRateRatio = sourceSampleRate / targetSampleRate;
      const newLength = Math.round(channelData.length / sampleRateRatio);
      const downsampledData = new Float32Array(newLength);

      for (let i = 0; i < newLength; i++) {
        const sourceIndex = Math.floor(i * sampleRateRatio);
        downsampledData[i] = channelData[sourceIndex];
      }

      return downsampledData;
    },

    float32ToPCM(channelData) {
      if (!channelData) {
        return new ArrayBuffer(0);
      }

      const buffer = new ArrayBuffer(channelData.length * 2);
      const view = new DataView(buffer);

      for (let i = 0; i < channelData.length; i++) {
        let sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }

      return buffer;
    },
    
    handleRecordingFallback() {
      console.log('🔄 录音API不可用，使用降级处理');
      this.isRecording = false;
      this.isProcessing = false;
      this.allowAudioStreaming = false;
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
      this.lastPartialText = '';
      
      // 停止计时
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      // 发送停止识别请求
      this.scheduleStopRequest();

      // 停止WebSocket保活
      this.stopKeepWebSocketAlive();
      
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
        
        this.allowAudioStreaming = false;

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

        this.allowAudioStreaming = false;

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
        this.allowAudioStreaming = false;

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

        // 获取阿里云语音识别配置
        console.log('正在获取阿里云语音识别配置...');
        const speechConfig = await this.getAliyunSpeechConfig();
        const speechToken = speechConfig.token;
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
              console.log('📤 准备上传音频文件进行语音识别...');
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
        
        // 调用语音识别转写接口
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
          
          console.log('✅ 语音识别完成！');
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
        console.log('🎯 开始语音识别...');
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
          
          console.log('✅ 语音识别完成！');
          console.log('📄 转录文本:', transcribedText);
          console.log('⏰ 转写时间:', transcribeResponse.data.data.transcribedAt);
          
        } else {
          const errorMsg = transcribeResponse.data?.message || transcribeResponse.data?.details || '语音识别请求失败';
          console.error('❌ 转写API响应错误:', transcribeResponse);
          throw new Error(errorMsg);
        }
        
      } catch (error) {
        console.error('❌ 语音识别失败:', error);
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

.image-analysis-section {
  margin-top: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-section-header {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.image-upload {
  border: 2px dashed rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.6);
}

.image-upload:hover {
  border-color: rgba(0, 122, 255, 0.6);
  background: rgba(0, 122, 255, 0.05);
}

.upload-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: rgba(0, 122, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-camera {
  width: 28px;
  height: 28px;
  opacity: 0.75;
}

.upload-text {
  font-size: 14px;
  color: #666;
}

.image-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f7fb;
}

.preview-image {
  width: 100%;
  height: 200px;
}

.image-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.image-action-btn {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  background: #ffffff;
  color: #2c3e50;
  font-size: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.2s ease;
}

.image-action-btn:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-action-btn.remove {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
}

.analyze-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  color: #2c3e50;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.analyze-btn:active {
  transform: scale(0.98);
}

.analyze-btn.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.analyze-btn.loading {
  opacity: 0.8;
}

.analyze-tip {
  font-size: 12px;
  color: #8e8e8e;
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
