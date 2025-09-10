<template>
  <view class="ai-chat-container">
    <!-- 角色信息卡片 -->
    <view class="character-card">
      <view class="character-avatar">
        <image :src="characterInfo.avatar" class="avatar-image" mode="aspectFill"></image>
      </view>
      <view class="character-info">
        <view class="character-name">{{ characterInfo.name }}</view>
        <view class="character-desc">{{ characterInfo.description }}</view>
        <view class="memory-count">记忆片段: {{ memoryCount }} 个</view>
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
          placeholder="与{{ characterInfo.name }}聊天..."
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

    <!-- 记忆管理按钮 -->
    <view class="memory-manage" @click="showMemoryManage">
      <view class="memory-icon">🧠</view>
      <text class="memory-text">管理记忆</text>
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
        name: '张无忌',
        description: '基于您的回忆录生成的AI角色',
        avatar: '/src/images/default-avatar.png'
      },
      
      // 聊天消息
      messages: [
        {
          type: 'ai',
          content: '你好！我是张无忌，基于您的回忆录生成的AI角色。我可以和您聊关于您在倚天屠龙记中的经历，或者回答关于您回忆录内容的问题。有什么想聊的吗？',
          timestamp: new Date()
        }
      ],
      
      // 输入相关
      inputText: '',
      isLoading: false,
      scrollTop: 0,
      
      // 记忆相关
      memoryCount: 0,
      userMemories: []
    }
  },
  
  onLoad() {
    this.loadCharacterInfo();
    this.loadUserMemories();
  },
  
  methods: {
    // 加载角色信息
    async loadCharacterInfo() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录');
          return;
        }

        // 从用户资料获取角色信息
        const response = await uni.request({
          url: apiUrl('/auth/me'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          const userInfo = response.data.data;
          this.characterInfo.name = userInfo.name || '张无忌';
          this.characterInfo.description = `基于${userInfo.name}的回忆录生成的AI角色`;
        }
      } catch (error) {
        console.error('加载角色信息失败:', error);
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
          this.memoryCount = chapters.length;
        }
      } catch (error) {
        console.error('加载用户记忆失败:', error);
      }
    },

    // 发送消息
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

      try {
        // 调用AI聊天API
        const response = await this.callAIChat(currentInput);
        
        const aiMessage = {
          type: 'ai',
          content: response.content || '抱歉，我现在无法回答您的问题。',
          timestamp: new Date()
        };

        this.messages.push(aiMessage);
      } catch (error) {
        console.error('AI聊天失败:', error);
        const errorMessage = {
          type: 'ai',
          content: '抱歉，我现在无法回答您的问题，请稍后再试。',
          timestamp: new Date()
        };
        this.messages.push(errorMessage);
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },

    // 调用AI聊天API
    async callAIChat(message) {
      const token = uni.getStorageSync('token');
      
      // 构建上下文，包含用户的记忆片段
      const context = this.buildContext(message);
      
      const response = await uni.request({
        url: apiUrl('/ai/chat'),
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          message: message,
          context: context,
          character: this.characterInfo.name
        }
      });

      if (response.statusCode === 200 && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'AI聊天失败');
      }
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

    // 显示记忆管理
    showMemoryManage() {
      uni.showModal({
        title: '记忆管理',
        content: `当前共有 ${this.memoryCount} 个记忆片段。AI角色会基于这些记忆与您对话。`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  }
}
</script>

<style scoped>
.ai-chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

/* 角色信息卡片 */
.character-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20rpx;
  display: flex;
  align-items: center;
  color: white;
}

.character-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.character-info {
  flex: 1;
}

.character-name {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.character-desc {
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
}

.memory-count {
  font-size: 22rpx;
  opacity: 0.8;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  padding: 20rpx;
  background-color: #ffffff;
}

.message-list {
  height: 100%;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 20rpx;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
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
  padding: 20rpx;
  border-top: 1rpx solid #e0e0e0;
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

/* 记忆管理 */
.memory-manage {
  position: fixed;
  right: 30rpx;
  bottom: 200rpx;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 20rpx;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  z-index: 1000;
}

.memory-icon {
  font-size: 32rpx;
  margin-right: 10rpx;
}

.memory-text {
  font-size: 24rpx;
}
</style>
