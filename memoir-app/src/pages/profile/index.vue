<template>
  <view class="container">
    <!-- 未登录状态 -->
    <view v-if="!isLoggedIn" class="login-prompt">
      <image src="/src/images/zaomen.jpeg" class="prompt-avatar" mode="aspectFill"></image>
      <view class="prompt-title">欢迎使用岁月镜像</view>
      <view class="prompt-subtitle">请登录以访问您的个人空间</view>
      <view class="prompt-buttons">
        <button class="login-btn" @click="goToLogin">登录</button>
        <button class="register-btn" @click="goToRegister">注册</button>
      </view>
    </view>
    
    <!-- 已登录状态 -->
    <view v-else class="user-card">
      <view class="user-avatar">
        <image :src="user.avatar || '/src/images/zaomen.jpeg'" class="avatar-image" mode="aspectFill"></image>
      </view>
      <view class="user-info">
        <view class="user-greeting">Hi~ {{ user.nickname || user.username }}</view>
        <view class="user-id">ID: {{ user.id.substring(0, 12) }}</view>
      </view>
      <view class="vip-badge" v-if="user.is_vip">
        <text class="vip-text">会员用户</text>
      </view>
      <view class="normal-badge" v-else>
        <text class="normal-text">普通用户</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" v-for="(item, index) in menuList" :key="index" @click="handleMenuClick(item)">
        <view class="menu-left">
          <image :src="getMenuIcon(item.id)" class="menu-icon" mode="aspectFit"></image>
          <text class="menu-text">{{ item.title }}</text>
        </view>
        <text class="arrow-icon">></text>
      </view>
    </view>

    <view class="footer-links">
      <text class="footer-link">用户服务协议</text>
      <text class="footer-link">隐私政策</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isLoggedIn: false,
      user: {},
      menuList: [
        { id: 'purchase', title: '我要购买' },
        { id: 'orders', title: '我的订单' },
        { id: 'service', title: '联系客服' },
        { id: 'feedback', title: '意见反馈' },
        { id: 'share', title: '分享海报' },
        { id: 'cooperation', title: '商务合作' },
        { id: 'logout', title: '退出登录' }
      ]
    }
  },
  onShow() {
    this.checkLoginStatus();
  },
  methods: {
    checkLoginStatus() {
      try {
        const token = uni.getStorageSync('token');
        const user = uni.getStorageSync('user');
        
        if (token && user) {
          this.isLoggedIn = true;
          this.user = user;
        } else {
          this.isLoggedIn = false;
          this.user = {};
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        this.isLoggedIn = false;
        this.user = {};
      }
    },
    
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/index'
      });
    },
    
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/index'
      });
    },
    
    handleMenuClick(item) {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      if (item.id === 'logout') {
        this.handleLogout();
        return;
      }
      
      uni.showToast({
        title: `${item.title}功能开发中`,
        icon: 'none'
      });
    },
    
    handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token');
            uni.removeStorageSync('user');
            this.isLoggedIn = false;
            this.user = {};
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            });
          }
        }
      });
    },
    getMenuIcon(id) {
      const iconMap = {
        'purchase': '/static/icons/shopping.svg',
        'orders': '/static/icons/orders.svg',
        'service': '/static/icons/support.svg',
        'feedback': '/static/icons/feedback.svg',
        'share': '/static/icons/share.svg',
        'cooperation': '/static/icons/business.svg',
        'logout': '/static/icons/user.svg'
      };
      return iconMap[id] || '';
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

/* 未登录状态样式 */
.login-prompt {
  background: white;
  padding: 60px 40px;
  text-align: center;
  margin-bottom: 12px;
}

.prompt-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50px;
  margin: 0 auto 30px;
  border: 3px solid #f0f0f0;
}

.prompt-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.prompt-subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 40px;
}

.prompt-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.login-btn, .register-btn {
  flex: 1;
  max-width: 120px;
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.login-btn {
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(15px);
}

.register-btn {
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(15px);
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0px);
  background: rgba(255, 255, 255, 0.7);
}

.register-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.register-btn:active {
  transform: translateY(0px);
  background: rgba(255, 255, 255, 0.7);
}

.user-card {
  background: white;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  position: relative;
}

.user-avatar {
  margin-right: 16px;
}

.avatar-image {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: cover;
  object-position: center top;
}

.user-info {
  flex: 1;
}

.user-greeting {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.user-id {
  font-size: 14px;
  color: #333;
}

.vip-badge {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 15px;
  padding: 6px 12px;
}

.vip-text {
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.normal-badge {
  background: #f0f0f0;
  border-radius: 15px;
  padding: 6px 12px;
}

.normal-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.menu-section {
  margin-top: 12px;
  background: white;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
}

.menu-text {
  font-size: 16px;
  color: #333;
}

.arrow-icon {
  font-size: 16px;
  color: #ccc;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 40px;
  padding: 20px;
}

.footer-link {
  font-size: 14px;
  color: #333;
  text-decoration: underline;
}
</style>
