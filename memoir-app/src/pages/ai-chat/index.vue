<template>
  <view class="ai-chat-container">
    <!-- 角色信息卡片 -->
    <view class="character-card">
      <view class="character-avatar">
        <image :src="characterInfo.avatar" class="avatar-image" mode="aspectFill"></image>
      </view>
      <view class="character-info">
        <view class="character-name-container">
          <input 
            v-if="isEditingName" 
            v-model="editingName" 
            class="character-name-input"
            @blur="saveCharacterName"
            @confirm="saveCharacterName"
            @keyup.enter="saveCharacterName"
            :placeholder="characterInfo.name"
          />
          <view v-else class="character-name">{{ characterInfo.name }}</view>
          <view class="edit-name-btn" @click="toggleEditName">
            <image 
              v-if="!isEditingName"
              src="/static/icons/edit.svg" 
              class="edit-icon"
              mode="aspectFit"
            />
            <text v-else class="edit-icon">✓</text>
          </view>
        </view>
        <view class="character-desc">{{ characterInfo.description }}</view>
      </view>
    </view>

    <!-- 聊天区域 -->
    <view class="chat-area">
      <scroll-view 
        class="message-list" 
        scroll-y="true" 
        :scroll-top="scrollTop"
        scroll-with-animation="true"
      >
        <view 
          v-for="(message, index) in messages" 
          :key="index" 
          class="message-item"
          :class="message.type"
        >
          <view class="message-avatar" v-if="message.type === 'ai'">
            <image :src="characterInfo.avatar" class="avatar-image" mode="aspectFill"></image>
          </view>
          <view class="message-content">
            <view class="message-bubble">
              <text class="message-text">{{ message.content }}</text>
            </view>
            <view class="message-time">{{ formatTime(message.timestamp) }}</view>
          </view>
          <view class="message-avatar" v-if="message.type === 'user'">
            <image src="/src/images/default-avatar.png" class="avatar-image" mode="aspectFill"></image>
          </view>
        </view>
        
        <!-- 加载状态 -->
        <view class="message-item ai" v-if="isLoading">
          <view class="message-avatar">
            <image :src="characterInfo.avatar" class="avatar-image" mode="aspectFill"></image>
          </view>
          <view class="message-content">
            <view class="message-bubble loading">
              <view class="typing-indicator">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 输入区域 -->
    <view class="input-area">
      <view class="input-container">
        <input 
          v-model="inputText" 
          class="message-input" 
          :placeholder="`与${characterInfo.name}聊天...`"
          :disabled="isLoading"
          @confirm="sendMessage"
        />
        <button 
          class="send-button" 
          :class="{ disabled: !inputText.trim() || isLoading }"
          @click="sendMessage"
          :disabled="!inputText.trim() || isLoading"
        >
          发送
        </button>
      </view>
    </view>

  </view>
</template>

<script>
// 导入 API 配置工具
import { apiUrl } from '@/utils/apiConfig.js';

export default {
  data() {
    return {
      // 角色信息
      characterInfo: {
        name: '',
        description: '',
        avatar: '/src/images/default-avatar.png'
      },
      
      // 聊天消息
      messages: [],
      
      // 输入相关
      inputText: '',
      isLoading: false,
      scrollTop: 0,
      
      // 记忆相关
      userMemories: [],
      
      // 编辑相关
      isEditingName: false,
      editingName: ''
    }
  },
  
  async onLoad() {
    await this.loadCharacterInfo();
    this.loadUserMemories();
    this.loadCustomCharacterName();
    this.preBuildCharacter();
    this.addWelcomeMessage();
  },
  
  methods: {

    // 加载角色信息
    async loadCharacterInfo() {
      try {
        const token = uni.getStorageSync('token');
        console.log('🔍 检查登录状态，token:', token ? '存在' : '不存在');
        
        if (!token) {
          console.log('用户未登录，使用默认角色信息');
          // 未登录时保持默认描述
          this.characterInfo.description = 'AI角色';
          return;
        }

        console.log('🔄 开始获取用户信息...');
        // 从用户资料获取角色信息
        const response = await uni.request({
          url: apiUrl('/auth/me'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 用户信息响应:', response);

        if (response.statusCode === 200 && response.data.success) {
          const userInfo = response.data.data.user; // 注意：后端返回的是 { user: userProfile }
          console.log('👤 用户信息:', userInfo);
          const userName = userInfo.nickname || userInfo.username || '张无忌';
          console.log('📝 用户名:', userName);
          
          this.characterInfo.name = userName;
          // 只有登录用户才显示基于回忆录的描述
          this.characterInfo.description = `基于${userName}的回忆录生成的AI角色`;
          console.log('✅ 角色信息更新完成:', this.characterInfo);
        } else {
          console.log('❌ 获取用户信息失败，使用默认角色信息:', response.data);
          this.characterInfo.description = 'AI角色';
        }
      } catch (error) {
        console.error('❌ 加载角色信息失败:', error);
        // 出错时使用默认描述
        this.characterInfo.description = 'AI角色';
      }
    },

    // 加载用户记忆
    async loadUserMemories() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录');
          return;
        }

        // 获取用户的章节数据作为记忆
        const response = await uni.request({
          url: apiUrl('/chapters'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          const chapters = response.data.data.chapters || [];
          this.userMemories = chapters;
        }
      } catch (error) {
        console.error('加载用户记忆失败:', error);
      }
    },

    // 发送消息（支持流式输出）
    async sendMessage() {
      if (!this.inputText.trim() || this.isLoading) return;

      const userMessage = {
        type: 'user',
        content: this.inputText.trim(),
        timestamp: new Date()
      };

      this.messages.push(userMessage);
      const currentInput = this.inputText.trim();
      this.inputText = '';
      this.isLoading = true;

      // 滚动到底部
      this.scrollToBottom();

      // 创建AI消息占位符
      const aiMessage = {
        type: 'ai',
        content: '',
        timestamp: new Date()
      };
      this.messages.push(aiMessage);
      
      // 确保消息被添加到数组中
      const messageIndex = this.messages.length - 1;

      try {
        // 使用流式请求
        await this.streamChat(currentInput, messageIndex);
      } catch (error) {
        console.error('AI聊天失败:', error);
        this.messages[messageIndex].content = '抱歉，我现在无法回答您的问题，请稍后再试。';
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },

    // 流式聊天请求
    async streamChat(message, messageIndex) {
      const token = uni.getStorageSync('token');
      if (!token) {
        throw new Error('未登录');
      }

      try {
        // 使用非流式请求，因为uni-app对SSE支持有限
        const response = await uni.request({
          url: apiUrl('/ai/chat'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            message: message,
            stream: false  // 使用非流式请求
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          const fullResponse = response.data.data.response || '抱歉，我现在无法回答您的问题。';
          console.log('AI回复内容:', fullResponse);
          this.handleStreamResponse(fullResponse, messageIndex);
        } else {
          console.error('AI聊天响应错误:', response.data);
          throw new Error(response.data.message || '请求失败');
        }
      } catch (error) {
        console.error('AI聊天请求失败:', error);
        throw error;
      }
    },

    // 处理流式响应（模拟打字机效果）
    handleStreamResponse(fullResponse, messageIndex) {
      console.log('开始打字机效果，内容长度:', fullResponse.length);
      console.log('AI回复内容预览:', fullResponse.substring(0, 100) + '...');
      
      // 直接替换整个消息对象来确保响应式更新
      const updateMessage = (content) => {
        this.messages.splice(messageIndex, 1, {
          ...this.messages[messageIndex],
          content: content
        });
      };
      
      // 清空现有内容
      updateMessage('');
      
      // 模拟打字机效果
      let index = 0;
      const typeWriter = () => {
        if (index < fullResponse.length) {
          const currentContent = fullResponse.substring(0, index + 1);
          updateMessage(currentContent);
          index++;
          
          this.scrollToBottom();
          
          // 继续下一个字符
          setTimeout(typeWriter, 30); // 30ms间隔
        } else {
          console.log('打字机效果完成，最终内容长度:', this.messages[messageIndex].content.length);
        }
      };
      
      // 立即开始打字效果
      typeWriter();
    },

    // 构建上下文
    buildContext(message) {
      // 从用户记忆中提取相关内容
      const relevantMemories = this.userMemories.filter(memory => {
        const content = (memory.content || '').toLowerCase();
        const title = (memory.title || '').toLowerCase();
        const query = message.toLowerCase();
        
        return content.includes(query) || title.includes(query);
      });

      return {
        character: this.characterInfo.name,
        memories: relevantMemories.slice(0, 5), // 最多5个相关记忆
        totalMemories: this.userMemories.length
      };
    },

    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = 99999;
      });
    },

    // 格式化时间
    formatTime(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const diff = now - time;
      
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) { // 1天内
        return Math.floor(diff / 3600000) + '小时前';
      } else {
        return time.toLocaleDateString();
      }
    },

    // 切换编辑模式
    toggleEditName() {
      if (this.isEditingName) {
        this.saveCharacterName();
      } else {
        this.isEditingName = true;
        this.editingName = this.characterInfo.name;
        // 聚焦到输入框
        this.$nextTick(() => {
          const input = document.querySelector('.character-name-input');
          if (input) {
            input.focus();
            input.select();
          }
        });
      }
    },

    // 保存角色名称
    async saveCharacterName() {
      if (this.isEditingName) {
        const newName = this.editingName.trim();
        if (newName && newName !== this.characterInfo.name) {
          try {
            // 显示加载状态
            uni.showLoading({
              title: '保存中...'
            });

            const token = uni.getStorageSync('token');
            if (!token) {
              throw new Error('用户未登录');
            }

            // 调用后端接口更新用户昵称
            const response = await uni.request({
              url: apiUrl('/auth/profile'),
              method: 'PUT',
              header: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: {
                nickname: newName
              }
            });

            uni.hideLoading();

            if (response.statusCode === 200 && response.data.success) {
              // 更新本地角色信息
              this.characterInfo.name = newName;
              this.characterInfo.description = `基于${newName}的回忆录生成的AI角色`;
              
              // 更新本地存储的用户信息
              const userInfo = response.data.data.user;
              uni.setStorageSync('user', userInfo);
              
              // 清除自定义角色名称缓存（因为现在使用数据库中的昵称）
              uni.removeStorageSync('customCharacterName');
              
              console.log('✅ 角色名称已更新到数据库:', newName);
              
              // 更新欢迎消息中的角色名称
              this.updateWelcomeMessage();
              
              uni.showToast({
                title: '保存成功',
                icon: 'success'
              });
            } else {
              throw new Error(response.data.message || '保存失败');
            }
          } catch (error) {
            uni.hideLoading();
            console.error('保存角色名称失败:', error);
            uni.showToast({
              title: error.message || '保存失败',
              icon: 'none'
            });
          }
        }
        this.isEditingName = false;
        this.editingName = '';
      }
    },

    // 加载自定义角色名称
    loadCustomCharacterName() {
      const customName = uni.getStorageSync('customCharacterName');
      if (customName && !this.characterInfo.name) {
        // 只有在没有从用户信息获取到名称时才使用自定义名称
        this.characterInfo.name = customName;
        this.characterInfo.description = `基于${customName}的回忆录生成的AI角色`;
        console.log('📝 加载自定义角色名称:', customName);
      }
    },

    // 预构建角色
    async preBuildCharacter() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录，跳过角色预构建');
          return;
        }

        console.log('开始预构建AI角色...');
        const response = await uni.request({
          url: apiUrl('/ai/prebuild'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          console.log('✅ AI角色预构建成功，记忆数量:', response.data.data.memoryCount);
          // 更新角色描述（不显示记忆数量）
          this.characterInfo.description = `基于您的回忆录生成的AI角色`;
        } else {
          console.log('⚠️ AI角色预构建失败，将使用实时构建');
        }
      } catch (error) {
        console.error('预构建AI角色失败:', error);
      }
    },


    // 添加欢迎消息
    addWelcomeMessage() {
      if (this.messages.length === 0) {
        this.messages.push({
          type: 'ai',
          content: `你好！我是${this.characterInfo.name}，基于您的回忆录生成的AI角色。我可以和您聊关于您的经历，或者回答关于您回忆录内容的问题。有什么想聊的吗？`,
          timestamp: new Date()
        });
      }
    },

    // 更新欢迎消息中的角色名称
    updateWelcomeMessage() {
      if (this.messages.length > 0) {
        // 更新第一条AI消息（欢迎消息）
        const firstMessage = this.messages[0];
        if (firstMessage.type === 'ai' && firstMessage.content.includes('你好！我是')) {
          firstMessage.content = `你好！我是${this.characterInfo.name}，基于您的回忆录生成的AI角色。我可以和您聊关于您的经历，或者回答关于您回忆录内容的问题。有什么想聊的吗？`;
        }
      }
    }

  }
}
</script>

<style scoped>
.ai-chat-container {
  height: 95vh;
  display: flex;
  flex-direction: column;
  background-color: #F8F6F3;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.ai-chat-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

/* 角色信息卡片 */
.character-card {
  background: #ffffff;
  padding: 15rpx 20rpx;
  display: flex;
  align-items: center;
  color: #333;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  margin: 15rpx 20rpx 10rpx 15rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.character-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
  border: 3rpx solid #e0e0e0;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.character-info {
  flex: 1;
}

.character-name-container {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.character-name {
  font-size: 32rpx;
  font-weight: bold;
  flex: 1;
}

.character-name-input {
  font-size: 32rpx;
  font-weight: bold;
  flex: 1;
  border: 1rpx solid #007AFF;
  border-radius: 8rpx;
  padding: 8rpx 12rpx;
  background: white;
  color: #333;
}

.edit-name-btn {
  margin-left: 15rpx;
  padding: 8rpx;
  border-radius: 50%;
  background: #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-name-btn:hover {
  background: #e0e0e0;
}

.edit-name-btn:active {
  background: #d0d0d0;
}

.edit-icon {
  font-size: 24rpx;
  color: #666;
  width: 24rpx;
  height: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.character-desc {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}


/* 聊天区域 */
.chat-area {
  flex: 1;
  padding: 10rpx 20rpx 10rpx 0rpx;
  background-color: #F8F6F3;
  min-height: 0;
  overflow: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.chat-area::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.message-list {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.message-list::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
  padding-left: 0;
}

.message-item.ai {
  padding-left: 0;
  margin-left: -5rpx;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 20rpx 0 0;
}

.message-item.ai .message-avatar {
  margin-left: 0;
  margin-right: 8rpx;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.ai .message-content {
  margin-left: 0;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-bubble {
  background: #f8f8f8;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  position: relative;
}

.message-item.user .message-bubble {
  background: #007AFF;
  color: white;
}

.message-item.ai .message-bubble {
  background: #f8f8f8;
  color: #333;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.4;
}

.message-time {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
}

.message-item.user .message-time {
  text-align: right;
}

/* 加载状态 */
.loading {
  padding: 20rpx 24rpx;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.dot {
  width: 8rpx;
  height: 8rpx;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10rpx);
    opacity: 1;
  }
}

/* 输入区域 */
.input-area {
  background: white;
  padding: 20rpx 20rpx 20rpx 15rpx;
  border-top: 1rpx solid #e0e0e0;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 100;
  margin-bottom: 50px;
}

.input-container {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border-radius: 30rpx;
  padding: 10rpx 20rpx;
}

.message-input {
  flex: 1;
  font-size: 28rpx;
  padding: 15rpx 0;
  border: none;
  background: transparent;
}

.send-button {
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 20rpx;
  padding: 15rpx 30rpx;
  font-size: 26rpx;
  margin-left: 20rpx;
}

.send-button.disabled {
  background: #ccc;
  color: #999;
}

</style>
