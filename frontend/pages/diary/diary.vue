<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <view class="page-title">随记</view>
      <view class="page-subtitle">记录照片里的故事，随手写下生活点滴。<br/>轻松导入回忆录</view>
    </view>

    <!-- 示例随记 -->
    <view class="diary-list">
      <view class="diary-item" v-for="(item, index) in diaryList" :key="index" @click="viewDiary(item)">
        <image :src="item.image" class="diary-image" mode="aspectFill"></image>
        <view class="diary-content">
          <view class="diary-title">{{ item.title }}</view>
          <view class="diary-date">{{ item.date }}</view>
        </view>
        <view class="diary-menu" @click.stop="showMenu(item)">
          <view class="menu-dot"></view>
          <view class="menu-dot"></view>
          <view class="menu-dot"></view>
        </view>
      </view>
    </view>

    <!-- 新建随记按钮 -->
    <view class="add-btn-container">
      <button class="add-btn" @click="addNewDiary">
        <text class="add-icon">+</text>
        <text class="add-text">新随记</text>
      </button>
    </view>

    <!-- 底部占位 -->
    <view class="bottom-placeholder"></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      diaryList: [
        {
          id: 1,
          title: '示例：春节福字的故事',
          date: '2025/08/25',
          image: '/static/images/spring-festival.jpg',
          content: '记录春节写福字的温馨时光...'
        }
      ]
    }
  },
  onLoad() {
    this.loadDiaryList();
  },
  onShow() {
    // 页面显示时刷新列表
    this.loadDiaryList();
  },
  methods: {
    loadDiaryList() {
      // 从本地存储或服务器加载随记列表
      // 这里使用示例数据
    },
    viewDiary(item) {
      // 查看随记详情
      uni.navigateTo({
        url: `/pages/diary-detail/diary-detail?id=${item.id}`
      });
    },
    showMenu(item) {
      uni.showActionSheet({
        itemList: ['编辑', '删除', '分享'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              this.editDiary(item);
              break;
            case 1:
              this.deleteDiary(item);
              break;
            case 2:
              this.shareDiary(item);
              break;
          }
        }
      });
    },
    editDiary(item) {
      uni.navigateTo({
        url: `/pages/diary-edit/diary-edit?id=${item.id}`
      });
    },
    deleteDiary(item) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这篇随记吗？',
        success: (res) => {
          if (res.confirm) {
            // 删除随记
            const index = this.diaryList.findIndex(d => d.id === item.id);
            if (index > -1) {
              this.diaryList.splice(index, 1);
            }
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }
        }
      });
    },
    shareDiary(item) {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      });
    },
    addNewDiary() {
      uni.navigateTo({
        url: '/pages/diary-edit/diary-edit'
      });
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.page-subtitle {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.diary-list {
  margin-bottom: 100px;
}

.diary-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.diary-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-right: 16px;
  flex-shrink: 0;
}

.diary-content {
  flex: 1;
}

.diary-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  line-height: 1.3;
}

.diary-date {
  font-size: 14px;
  color: #999;
}

.diary-menu {
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.menu-dot {
  width: 4px;
  height: 4px;
  background-color: #ccc;
  border-radius: 50%;
}

.add-btn-container {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.add-btn {
  background: linear-gradient(135deg, #FF6B47 0%, #FF8A65 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(255, 107, 71, 0.3);
}

.add-icon {
  font-size: 20px;
  font-weight: bold;
}

.add-text {
  font-size: 16px;
  font-weight: 500;
}

.bottom-placeholder {
  height: 120px;
}
</style>
