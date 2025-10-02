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
          <view class="message-content">
            <view class="message-bubble">
              <text class="message-text">{{ message.content }}</text>
            </view>
            <view class="message-time">{{ formatTime(message.timestamp) }}</view>
          </view>
        </view>
        
        <!-- 加载状态 -->
        <view class="message-item ai" v-if="isLoading">
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
        name: '小忆',
        description: '我是小忆，你的AI回忆录助手，可以陪你聊天、整理回忆并记录新的故事。',
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
      hasPersona: false,
      
      // 编辑相关
      isEditingName: false,
      editingName: ''
    }
  },
  
  async onLoad() {
    await this.loadCharacterInfo();
    await this.loadUserMemories();
    this.loadCustomCharacterName();
    await this.preBuildCharacter();
    await this.fetchGeneratedCharacterName();
    this.addWelcomeMessage();
  },

  // 每次显示页面时都重新预构建角色（确保数据最新）
  async onShow() {
    console.log('🔄 AI聊天页面显示，重新预构建角色...');
    await this.loadUserMemories();
    await this.preBuildCharacter();
    await this.fetchGeneratedCharacterName();
    this.updateWelcomeMessage();
  },
  
  methods: {

    // 加载角色信息
    async loadCharacterInfo() {
      try {
        const token = uni.getStorageSync('token');
        console.log('🔍 检查登录状态，token:', token ? '存在' : '不存在');
        
        if (!token) {
          console.log('用户未登录，使用默认角色信息');
          this.characterInfo.name = '小忆';
          this.characterInfo.description = this.buildDefaultIntroduction(false);
          this.refreshCharacterPersona();
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
          const nickname = (userInfo.nickname || '').trim();
          const username = (userInfo.username || '').trim();
          let displayName = nickname;

          if (!displayName || displayName.toLowerCase() === 'demo' || displayName === username) {
            displayName = '小忆';
          }

          console.log('📝 角色名称:', displayName);
          
          this.characterInfo.name = displayName;
          this.characterInfo.description = this.buildDefaultIntroduction(true);
          this.refreshCharacterPersona();
          console.log('✅ 角色信息更新完成:', this.characterInfo);
        } else {
          console.log('❌ 获取用户信息失败，使用默认角色信息:', response.data);
          this.characterInfo.description = this.buildDefaultIntroduction(true);
          this.refreshCharacterPersona();
        }
      } catch (error) {
        console.error('❌ 加载角色信息失败:', error);
        this.characterInfo.description = this.buildDefaultIntroduction(true);
        this.refreshCharacterPersona();
      }
    },

    // 加载用户记忆
    async loadUserMemories() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录');
          this.refreshCharacterPersona();
          return;
        }

        // 获取用户的章节数据作为记忆
        const response = await uni.request({
          url: apiUrl('/ai/memories'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          const memories = response.data.data.memories || [];
          this.userMemories = memories;
          this.refreshCharacterPersona();
        }
      } catch (error) {
        console.error('加载用户记忆失败:', error);
        this.refreshCharacterPersona();
      }
    },

    buildDefaultIntroduction(isLoggedIn) {
      const name = this.characterInfo.name || '小忆';
      if (isLoggedIn) {
        return `我是${name}，你的AI回忆录助手。我可以帮你梳理已经记录的章节、整理随记内容，还能陪你聊天，继续探索新的故事。`;
      }
      return `我是${name}，你的AI回忆录助手，可以指导你如何记录人生点滴，整理回忆，并陪你轻松聊天。`;
    },

    buildPersonaIntroduction() {
      const name = this.characterInfo.name || '小忆';
      if (!this.userMemories || this.userMemories.length === 0) {
        return this.buildDefaultIntroduction(true);
      }

      const topMemories = this.userMemories.slice(0, 3);
      const primary = topMemories[0];
      let highlight = '';

      if (primary) {
        const formattedDate = this.formatDate(primary.createdAt);
        const title = primary.title || '一段故事';
        highlight = formattedDate
          ? `我记得在${formattedDate}你写下的《${title}》`
          : `我记得《${title}》这段经历`;
      }

      const additionalTitles = topMemories.slice(1).map(item => `《${item.title}》`).filter(Boolean);
      let additional = '';
      if (additionalTitles.length === 1) {
        additional = `，还有${additionalTitles[0]}同样珍贵`;
      } else if (additionalTitles.length > 1) {
        additional = `，以及${additionalTitles.join('、')}等故事陪伴着我`;
      }

      const remaining = this.userMemories.length - topMemories.length;
      if (remaining > 0) {
        additional += `，还有其他${remaining}段珍贵记忆`;
      }

      const memorySummary = highlight ? `${highlight}${additional}` : '我保存着你记录的许多珍贵记忆';
      return `我是${name}，根据你的回忆录打造的AI伙伴，${memorySummary}。随时可以和我聊聊这些故事，或继续记录新的篇章。`;
    },

    refreshCharacterPersona() {
      const token = uni.getStorageSync('token');
      const hasLogin = !!token;
      const hasMemories = hasLogin && this.userMemories && this.userMemories.length > 0;

      this.hasPersona = hasMemories;

      if (!hasLogin) {
        this.characterInfo.description = this.buildDefaultIntroduction(false);
      } else if (hasMemories) {
        this.characterInfo.description = this.buildPersonaIntroduction();
      } else {
        this.characterInfo.description = this.buildDefaultIntroduction(true);
      }

      this.updateWelcomeMessage();
    },

    async fetchGeneratedCharacterName() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          return;
        }

        const customName = uni.getStorageSync('customCharacterName');
        if (customName && customName !== '小忆') {
          // 用户自定义了昵称，不自动覆盖
          return;
        }

        const response = await uni.request({
          url: apiUrl('/ai/character-name'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          const { characterName } = response.data.data;
          if (characterName && characterName !== this.characterInfo.name) {
            console.log('🎭 自动识别角色姓名:', characterName);
            this.characterInfo.name = characterName;
            this.refreshCharacterPersona();
            uni.setStorageSync('customCharacterName', characterName);

            // 更新本地缓存的用户信息
            const userInfo = uni.getStorageSync('user');
            if (userInfo) {
              userInfo.nickname = characterName;
              uni.setStorageSync('user', userInfo);
            }

            if (response.data.data.updatedProfile) {
              console.log('🔄 用户昵称已同步更新为:', characterName);
            }
          }
        } else {
          console.log('⚠️ 角色姓名识别失败:', response.data?.message);
        }
      } catch (error) {
        console.error('自动生成角色姓名失败:', error);
      }
    },

    buildWelcomeMessageText() {
      const token = uni.getStorageSync('token');
      const intro = this.characterInfo.description || this.buildDefaultIntroduction(!!token);
      if (!token) {
        return `你好！${intro}如果你想体验完整的个性化聊天功能，可以登录并开始记录你的回忆。`;
      }

      if (this.hasPersona) {
        return `你好！${intro}想和我聊聊这些故事，或者继续记录新的篇章吗？`;
      }

      return `你好！${intro}如果你已经准备好开始记录或提问，随时告诉我。`;
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) {
        return '';
      }
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
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
      
      // 未登录用户使用特殊的聊天接口
      if (!token) {
        return await this.guestChat(message, messageIndex);
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
              this.refreshCharacterPersona();
              
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
      if (customName) {
        const trimmed = customName.trim();
        if (!trimmed || trimmed.toLowerCase() === 'demo' || trimmed === '小忆') {
          uni.removeStorageSync('customCharacterName');
          return;
        }
        this.characterInfo.name = customName;
        console.log('📝 加载自定义角色名称:', customName);
        this.refreshCharacterPersona();
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
          this.hasPersona = (response.data.data.memoryCount || 0) > 0;
          this.refreshCharacterPersona();
        } else {
          console.log('⚠️ AI角色预构建失败，将使用实时构建');
          this.refreshCharacterPersona();
        }
      } catch (error) {
        console.error('预构建AI角色失败:', error);
        this.refreshCharacterPersona();
      }
    },


    // 添加欢迎消息
    addWelcomeMessage() {
      if (this.messages.length === 0) {
        this.messages.push({
          type: 'ai',
          content: this.buildWelcomeMessageText(),
          timestamp: new Date()
        });
      }
    },

    // 更新欢迎消息中的角色名称
    updateWelcomeMessage() {
      if (this.messages.length > 0) {
        // 更新第一条AI消息（欢迎消息）
        const firstMessage = this.messages[0];
        if (firstMessage.type === 'ai') {
          firstMessage.content = this.buildWelcomeMessageText();
        }
      }
    },

    // 未登录用户聊天
    async guestChat(message, messageIndex) {
      try {
        const response = await uni.request({
          url: apiUrl('/ai/guest-chat'),
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            message: message,
            stream: false
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
  padding: 10rpx 20rpx 10rpx 35rpx;
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
  margin-left: 0;
  justify-content: flex-start;
}

.message-item.user {
  flex-direction: row;
  justify-content: flex-end;
  padding-right: 20rpx;
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
  margin-right: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.ai .message-content {
  margin-left: 0;
  align-items: flex-start;
}

.message-item.user .message-content {
  align-items: flex-end;
  margin-right: 0;
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
