<template>
  <view class="container">
    <!-- 主要内容区域 -->
    <view class="main-content">
      <!-- 未登录状态 -->
      <view v-if="!isLoggedIn" class="welcome-section">
        <image :src="getOptimalImagePath('/src/images/zaomen.jpeg')" class="avatar" mode="aspectFill"></image>
        <text class="welcome-title">欢迎使用岁月镜像</text>
        <text class="welcome-subtitle">请登录以访问您的个人空间</text>
        <view class="auth-buttons">
          <button class="auth-btn" @click="goToLogin">登录</button>
          <button class="auth-btn" @click="goToRegister">注册</button>
        </view>
        <view class="footer-links">
          <text class="footer-link">用户服务协议</text>
          <text class="footer-link">隐私政策</text>
        </view>
      </view>
      
      <!-- 已登录状态 -->
      <view v-else class="profile-section">
        <!-- 用户信息 -->
        <view class="user-header">
          <image :src="getOptimalImagePath(user.avatar || '/src/images/zaomen.jpeg')" class="avatar" mode="aspectFill"></image>
          <view class="user-details">
            <text class="user-name">Hi~ {{ user.nickname || user.username }}</text>
            <text class="user-id">ID: {{ user.id.substring(0, 12) }}</text>
          </view>
          <view class="user-badge" :class="{ 'vip': user.is_vip }">
            <text class="badge-text">{{ user.is_vip ? '会员用户' : '普通用户' }}</text>
          </view>
        </view>
        
        <!-- 菜单列表 -->
        <view class="menu-list">
          <view class="menu-item" v-for="(item, index) in displayMenuList" :key="index" @click="handleMenuClick(item)">
            <image :src="getMenuIcon(item.id)" class="menu-icon" mode="aspectFit"></image>
            <text class="menu-text">{{ item.title }}</text>
            <text class="menu-arrow">></text>
          </view>
        </view>
        
        <!-- 底部链接 -->
        <view class="footer-links">
          <text class="footer-link">用户服务协议</text>
          <text class="footer-link">隐私政策</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
// 导入图片映射工具
import { getOptimalImagePath } from '@/utils/imageMapping.js';

export default {
  data() {
    return {
      user: {},
      isLoggedIn: false,
      menuList: [
        { id: 'shopping', title: '我的购物' },
        { id: 'orders', title: '我的订单' },
        { id: 'support', title: '客服支持' },
        { id: 'feedback', title: '意见反馈' },
        { id: 'share', title: '分享应用' },
        { id: 'business', title: '商务合作' },
        { id: 'logout', title: '退出登录' }
      ]
    }
  },
  computed: {
    displayMenuList() {
      return this.isLoggedIn 
        ? this.menuList 
        : this.menuList.filter(item => item.id !== 'logout');
    }
  },
  onShow() {
    this.checkLoginStatus();
  },
  methods: {
    checkLoginStatus() {
      const token = uni.getStorageSync('token');
      const user = uni.getStorageSync('user');
      
      if (token && user) {
        this.isLoggedIn = true;
        this.user = user;
      } else {
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
      if (item.id === 'logout') {
        this.handleLogout();
      } else {
        uni.showToast({
          title: `点击了${item.title}`,
          icon: 'none'
        });
      }
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
        shopping: '/static/icons/shopping.svg',
        orders: '/static/icons/orders.svg',
        support: '/static/icons/support.svg',
        feedback: '/static/icons/feedback.svg',
        share: '/static/icons/share.svg',
        business: '/static/icons/business.svg',
        logout: '/static/icons/user.svg'
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
  padding: 20px 8px 12px 8px;
}

@media (max-width: 375px) {
  .container {
    padding: 15px 6px 10px 6px;
  }
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-width: 280px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 375px) {
  .main-content {
    min-width: auto;
    border-radius: 8px;
  }
}

/* 未登录状态 */
.welcome-section {
  padding: 60px 40px;
  text-align: center;
}

@media (max-width: 375px) {
  .welcome-section {
    padding: 40px 20px;
  }
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50px;
  margin: 0 auto 30px;
  border: 3px solid #f0f0f0;
  object-position: center top;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: block;
}

.welcome-subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  display: block;
}

.auth-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
}

.auth-btn {
  flex: 1;
  max-width: 120px;
  height: 44px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.auth-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.auth-btn:active {
  transform: translateY(0px);
  background: rgba(255, 255, 255, 0.7);
}

/* 已登录状态 */
.profile-section {
  padding: 0;
}

.user-header {
  display: flex;
  align-items: center;
  padding: 24px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.user-header .avatar {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  margin: 0 16px 0 0;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.user-id {
  font-size: 14px;
  color: #333;
  display: block;
}

.user-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: #f0f0f0;
}

.user-badge.vip {
  background: linear-gradient(45deg, #FFD700, #FFA500);
}

.badge-text {
  font-weight: 500;
  color: #666;
}

.user-badge.vip .badge-text {
  color: white;
}

.menu-list {
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s ease;
}

.menu-item:last-child {
  border-bottom: 1px solid #f5f5f5;
}

.menu-item:active {
  background-color: #f8f9fa;
}

.menu-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.menu-text {
  font-size: 16px;
  color: #333;
  flex: 1;
}

.menu-arrow {
  font-size: 18px;
  color: #ccc;
  font-weight: 300;
}

.footer-links {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #f5f5f5;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-link {
  font-size: 13px;
  color: #333;
  margin: 0 12px;
  text-decoration: underline;
  display: inline-block;
}

.footer-link:active {
  opacity: 0.7;
}
</style>