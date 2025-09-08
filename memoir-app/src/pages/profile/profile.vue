<template>
  <view class="container">
    <view class="user-card">
      <view class="user-avatar">
        <view class="avatar-placeholder"></view>
      </view>
      <view class="user-info">
        <view class="user-greeting">Hi~</view>
        <view class="user-id">ID: 68abf5f55ef6a</view>
      </view>
      <view class="vip-badge">
        <text class="vip-text">会员用户</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-item" v-for="(item, index) in menuList" :key="index" @click="handleMenuClick(item)">
        <view class="menu-left">
          <view class="menu-icon-placeholder"></view>
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
      menuList: [
        { id: 'purchase', title: '我要购买' },
        { id: 'orders', title: '我的订单' },
        { id: 'service', title: '联系客服' },
        { id: 'feedback', title: '意见反馈' },
        { id: 'share', title: '分享海报' },
        { id: 'cooperation', title: '商务合作' }
      ]
    }
  },
  methods: {
    handleMenuClick(item) {
      uni.showToast({
        title: `${item.title}功能开发中`,
        icon: 'none'
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
  margin-right: 16px;
}

.avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: #f0f0f0;
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

.menu-icon-placeholder {
  width: 24px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
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
  color: #FF6B47;
  text-decoration: underline;
}
</style>
