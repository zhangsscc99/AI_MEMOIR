<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-avatar">
        <image :src="userInfo.avatar" class="avatar-img" mode="aspectFill"></image>
        <view class="avatar-badge">
          <image src="/static/icons/male.png" class="gender-icon" mode="aspectFit"></image>
        </view>
      </view>
      <view class="user-info">
        <view class="user-greeting">{{ userInfo.greeting }}</view>
        <view class="user-id">ID: {{ userInfo.id }}</view>
      </view>
      <view class="vip-badge">
        <image src="/static/icons/crown.png" class="crown-icon" mode="aspectFit"></image>
        <text class="vip-text">会员用户</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-section">
      <view class="menu-item" v-for="(item, index) in menuList" :key="index" @click="handleMenuClick(item)">
        <view class="menu-left">
          <image :src="item.icon" class="menu-icon" mode="aspectFit"></image>
          <text class="menu-text">{{ item.title }}</text>
        </view>
        <image src="/static/icons/arrow-right.png" class="arrow-icon" mode="aspectFit"></image>
      </view>
    </view>

    <!-- 底部链接 -->
    <view class="footer-links">
      <text class="footer-link" @click="openUserAgreement">用户服务协议</text>
      <text class="footer-link" @click="openPrivacyPolicy">隐私政策</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        avatar: '/static/images/avatar-default.jpg',
        greeting: 'Hi~',
        id: '68abf5f55ef6a'
      },
      menuList: [
        {
          id: 'purchase',
          title: '我要购买',
          icon: '/static/icons/purchase.png',
          action: 'purchase'
        },
        {
          id: 'orders',
          title: '我的订单',
          icon: '/static/icons/orders.png',
          action: 'orders'
        },
        {
          id: 'service',
          title: '联系客服',
          icon: '/static/icons/service.png',
          action: 'service'
        },
        {
          id: 'feedback',
          title: '意见反馈',
          icon: '/static/icons/feedback.png',
          action: 'feedback'
        },
        {
          id: 'share',
          title: '分享海报',
          icon: '/static/icons/share.png',
          action: 'share'
        },
        {
          id: 'cooperation',
          title: '商务合作',
          icon: '/static/icons/cooperation.png',
          action: 'cooperation'
        }
      ]
    }
  },
  onLoad() {
    this.loadUserInfo();
  },
  methods: {
    loadUserInfo() {
      // 从本地存储或服务器加载用户信息
      const userInfo = uni.getStorageSync('userInfo');
      if (userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo };
      }
    },
    handleMenuClick(item) {
      switch(item.action) {
        case 'purchase':
          this.handlePurchase();
          break;
        case 'orders':
          this.handleOrders();
          break;
        case 'service':
          this.handleService();
          break;
        case 'feedback':
          this.handleFeedback();
          break;
        case 'share':
          this.handleShare();
          break;
        case 'cooperation':
          this.handleCooperation();
          break;
      }
    },
    handlePurchase() {
      uni.showToast({
        title: '购买功能开发中',
        icon: 'none'
      });
    },
    handleOrders() {
      uni.navigateTo({
        url: '/pages/orders/orders'
      });
    },
    handleService() {
      uni.showModal({
        title: '联系客服',
        content: '客服微信：memoir-service\n客服电话：400-123-4567',
        showCancel: false
      });
    },
    handleFeedback() {
      uni.navigateTo({
        url: '/pages/feedback/feedback'
      });
    },
    handleShare() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      });
    },
    handleCooperation() {
      uni.showModal({
        title: '商务合作',
        content: '商务合作请联系：\nbusiness@memoir.com\n或添加微信：memoir-business',
        showCancel: false
      });
    },
    openUserAgreement() {
      uni.navigateTo({
        url: '/pages/agreement/agreement?type=user'
      });
    },
    openPrivacyPolicy() {
      uni.navigateTo({
        url: '/pages/agreement/agreement?type=privacy'
      });
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.user-card {
  background: white;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  position: relative;
}

.user-avatar {
  position: relative;
  margin-right: 16px;
}

.avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 32px;
}

.avatar-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.gender-icon {
  width: 12px;
  height: 12px;
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
  color: #999;
}

.vip-badge {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 15px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.crown-icon {
  width: 16px;
  height: 16px;
}

.vip-text {
  font-size: 12px;
  color: white;
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
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.menu-text {
  font-size: 16px;
  color: #333;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  opacity: 0.5;
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
  color: #FF6B47;
  text-decoration: underline;
}
</style>
