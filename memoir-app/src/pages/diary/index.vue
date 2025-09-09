<template>
  <view class="container">
    <view class="page-header">
      <view class="page-title">随记</view>
      <view class="page-subtitle">记录照片里的故事，随手写下生活点滴。<br/>轻松导入回忆录</view>
    </view>

    <view class="diary-list">
      <!-- 显示已保存的随记 -->
      <view 
        class="diary-item" 
        v-for="diary in diaries" 
        :key="diary.id"
        @click="viewDiary(diary)"
      >
        <image 
          :src="diary.image || '/src/images/lion.png'" 
          class="diary-image" 
          mode="aspectFill"
        ></image>
        <view class="diary-content">
          <view class="diary-title">{{ diary.title }}</view>
          <view class="diary-date">{{ formatDate(diary.createTime) }}</view>
        </view>
        <view class="diary-menu" @click.stop="showDiaryMenu(diary)">
          <view class="menu-dot"></view>
          <view class="menu-dot"></view>
          <view class="menu-dot"></view>
        </view>
      </view>
      
      <!-- 默认示例（如果没有随记） -->
      <view class="diary-item" v-if="diaries.length === 0">
        <image src="/src/images/lion.png" class="diary-image" mode="aspectFill"></image>
        <view class="diary-content">
          <view class="diary-title">示例：春节福字的故事</view>
          <view class="diary-date">2025/08/25</view>
        </view>
        <view class="diary-menu">
          <view class="menu-dot"></view>
          <view class="menu-dot"></view>
          <view class="menu-dot"></view>
        </view>
      </view>
    </view>

    <view class="add-btn-container">
      <button class="add-btn" @click="addNewDiary">
        <text class="add-icon">+</text>
        <text class="add-text">新随记</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      diaries: []
    };
  },

  onShow() {
    this.loadDiaries();
  },

  methods: {
    // 加载随记数据
    loadDiaries() {
      try {
        const diaries = uni.getStorageSync('diaries') || [];
        this.diaries = diaries;
      } catch (error) {
        console.error('加载随记失败:', error);
        this.diaries = [];
      }
    },

    // 新建随记
    addNewDiary() {
      uni.navigateTo({
        url: '/pages/diary/edit'
      });
    },

    // 查看随记详情
    viewDiary(diary) {
      uni.showToast({
        title: '查看功能开发中',
        icon: 'none'
      });
    },

    // 显示随记菜单
    showDiaryMenu(diary) {
      uni.showActionSheet({
        itemList: ['编辑', '删除', '分享'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.editDiary(diary);
              break;
            case 1:
              this.deleteDiary(diary);
              break;
            case 2:
              this.shareDiary(diary);
              break;
          }
        }
      });
    },

    // 编辑随记
    editDiary(diary) {
      uni.showToast({
        title: '编辑功能开发中',
        icon: 'none'
      });
    },

    // 删除随记
    deleteDiary(diary) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条随记吗？',
        success: (res) => {
          if (res.confirm) {
            try {
              const diaries = uni.getStorageSync('diaries') || [];
              const index = diaries.findIndex(d => d.id === diary.id);
              if (index > -1) {
                diaries.splice(index, 1);
                uni.setStorageSync('diaries', diaries);
                this.loadDiaries();
                uni.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              }
            } catch (error) {
              uni.showToast({
                title: '删除失败',
                icon: 'error'
              });
            }
          }
        }
      });
    },

    // 分享随记
    shareDiary(diary) {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      });
    },

    // 格式化日期
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}/${month}/${day}`;
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
  object-fit: cover;
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
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 25px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.add-icon {
  font-size: 20px;
  font-weight: bold;
}

.add-text {
  font-size: 16px;
  font-weight: 500;
}
</style>
