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
          :src="getOptimalImagePath(diary.image || '/src/images/lion.png')"
          class="diary-image"
          mode="aspectFill"
        />
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
        <image
          :src="getOptimalImagePath('/src/images/lion.png')"
          class="diary-image"
          mode="aspectFill"
        />
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
// 导入 API 配置工具
import { apiUrl } from '@/utils/apiConfig.js';

// 导入图片映射工具
import { getOptimalImagePath } from '@/utils/imageMapping.js';
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
    // 暴露图片路径优化函数
    getOptimalImagePath,
    
    // 加载随记数据
    async loadDiaries() {
      try {
        console.log('🔄 开始加载随记数据...');
        
        // 获取当前用户ID
        const userInfo = uni.getStorageSync('user');
        const userId = userInfo?.id;
        
        // 清理可能过期的缓存数据
        if (userId) {
          uni.removeStorageSync(`diaries_${userId}`);
          uni.removeStorageSync(`currentDiary_${userId}`);
        }
        uni.removeStorageSync('diaries');
        uni.removeStorageSync('currentDiary');
        
        // 检查用户登录状态
        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('❌ 未登录，使用本地存储数据');
          const localDiaries = userId ? uni.getStorageSync(`diaries_${userId}`) || [] : uni.getStorageSync('diaries') || [];
          this.diaries = localDiaries;
          return;
        }
        
        // 从后端获取用户章节，过滤出diary章节
        const response = await uni.request({
          url: apiUrl('/chapters'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 后端章节响应:', response);
        console.log('📊 响应数据详情:', response.data);
        
        if (response.statusCode === 200 && response.data.success) {
          const responseData = response.data.data || {};
          console.log('📊 原始数据类型:', typeof responseData, '是否为数组:', Array.isArray(responseData));
          console.log('📊 原始数据内容:', responseData);
          
          // 正确访问章节数组：response.data.data.chapters
          const userChapters = responseData.chapters || [];
          
          // 过滤出diary章节并转换为随记格式
          const diaryChapters = userChapters.filter(chapter =>
            chapter.chapterId && chapter.chapterId.startsWith('diary_')
          );
          
          console.log('📖 过滤出的diary章节:', diaryChapters);
          
          this.diaries = diaryChapters.map(chapter => ({
            id: chapter.id, // 使用数据库的真实ID
            chapterId: chapter.chapterId, // 保存chapterId用于显示
            title: chapter.title || '无标题随记',
            content: chapter.content || '',
            image: chapter.backgroundImage && !chapter.backgroundImage.startsWith('blob:') ? 
              (chapter.backgroundImage.startsWith('http') ? chapter.backgroundImage : getOptimalImagePath(chapter.backgroundImage)) : 
              '/src/images/default-diary.svg',
            createTime: chapter.updatedAt || chapter.createdAt,
            chapterData: chapter // 保存完整的章节数据
          }));

          // 添加样板案例到列表末尾
          const sampleDiaries = this.getDefaultDiaries();
          console.log('🦁 添加样板案例:', sampleDiaries);
          this.diaries = this.diaries.concat(sampleDiaries);
          
          console.log('✅ 随记数据加载完成，总数:', this.diaries.length, '数据:', this.diaries);
        } else {
          console.log('❌ 获取随记失败，使用本地存储数据:', response.data);
          const localDiaries = userId ? uni.getStorageSync(`diaries_${userId}`) || [] : uni.getStorageSync('diaries') || [];
          this.diaries = localDiaries.concat(this.getDefaultDiaries());
        }
      } catch (error) {
        console.error('❌ 加载随记出错，使用本地存储数据:', error);
        const localDiaries = userId ? uni.getStorageSync(`diaries_${userId}`) || [] : uni.getStorageSync('diaries') || [];
        this.diaries = localDiaries.concat(this.getDefaultDiaries());
      }
    },

    // 获取默认随记数据（样板案例）
    getDefaultDiaries() {
      return [
        {
          id: 'sample_diary_1',
          chapterId: 'sample_diary_1',
          title: '春节舞狮子',
          content: '舞狮子是中国传统民间艺术，在春节期间尤为盛行。狮子象征着威武和吉祥，舞狮表演寓意驱邪避害、祈求平安。表演者需要配合默契，通过精湛的技艺展现狮子的威武和灵动，为节日增添喜庆氛围。',
          image: getOptimalImagePath('/src/images/lion.png'),
          createTime: new Date().toISOString(),
          chapterData: {
            chapterId: 'sample_diary_1',
            title: '春节舞狮子',
            content: '舞狮子是中国传统民间艺术，在春节期间尤为盛行。狮子象征着威武和吉祥，舞狮表演寓意驱邪避害、祈求平安。表演者需要配合默契，通过精湛的技艺展现狮子的威武和灵动，为节日增添喜庆氛围。',
            backgroundImage: getOptimalImagePath('/src/images/lion.png'),
            status: 'completed'
          }
        }
      ];
    },

    // 新建随记
    addNewDiary() {
      uni.navigateTo({
        url: '/pages/diary/edit'
      });
    },

    // 查看随记详情
    viewDiary(diary) {
      console.log('查看随记:', diary);
      
      // 获取当前用户ID
      const userInfo = uni.getStorageSync('user');
      const userId = userInfo?.id;
      
      // 将完整的随记数据存储到本地，供编辑页面使用
      if (userId) {
        uni.setStorageSync(`currentDiary_${userId}`, diary);
      }
      uni.setStorageSync('currentDiary', diary);
      
      // 跳转到编辑页面，以查看模式打开
      const chapterIdentifier = diary.chapterId || diary.id;
      uni.navigateTo({
        url: `/pages/diary/edit?chapterId=${chapterIdentifier}&title=${encodeURIComponent(diary.title)}&mode=view`
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
      console.log('编辑随记:', diary);
      
      // 获取当前用户ID
      const userInfo = uni.getStorageSync('user');
      const userId = userInfo?.id;
      
      // 将完整的随记数据存储到本地，供编辑页面使用
      if (userId) {
        uni.setStorageSync(`currentDiary_${userId}`, diary);
      }
      uni.setStorageSync('currentDiary', diary);
      
      const chapterIdentifier = diary.chapterId || diary.id;
      uni.navigateTo({
        url: `/pages/diary/edit?chapterId=${chapterIdentifier}&title=${encodeURIComponent(diary.title)}&mode=edit`
      });
    },

    // 删除随记
    deleteDiary(diary) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条随记吗？',
        success: (res) => {
          if (res.confirm) {
            this.performDelete(diary);
          }
        }
      });
    },

    // 执行删除操作
    async performDelete(diary) {
      // 如果是样板案例，直接本地删除
      if (diary.id.startsWith('sample_')) {
        this.deleteFromLocal(diary);
        return;
      }

      try {
        uni.showLoading({
          title: '删除中...'
        });

        const token = uni.getStorageSync('token');
        if (!token) {
          uni.hideLoading();
          uni.showToast({
            title: '请先登录',
            icon: 'error'
          });
          return;
        }

        // 调用后端删除API
        const response = await uni.request({
          url: apiUrl(`/chapters/${diary.id}`),
          method: 'DELETE',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        uni.hideLoading();

        if (response.statusCode === 200 && response.data.success) {
          // 删除成功，重新加载数据
          this.loadDiaries();
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
        } else {
          // 后端删除失败，尝试本地删除
          console.log('后端删除失败，尝试本地删除:', response.data);
          this.deleteFromLocal(diary);
        }
      } catch (error) {
        console.error('删除随记出错:', error);
        uni.hideLoading();
        
        // 网络错误，尝试本地删除
        uni.showModal({
          title: '网络错误',
          content: '无法连接到服务器，是否仅从本地删除？',
          success: (res) => {
            if (res.confirm) {
              this.deleteFromLocal(diary);
            }
          }
        });
      }
    },

    // 本地删除
    deleteFromLocal(diary) {
      try {
        // 获取当前用户ID
        const userInfo = uni.getStorageSync('user');
        const userId = userInfo?.id;
        
        const diaries = userId ? uni.getStorageSync(`diaries_${userId}`) || [] : uni.getStorageSync('diaries') || [];
        const index = diaries.findIndex(d => d.id === diary.id);
        if (index > -1) {
          diaries.splice(index, 1);
          if (userId) {
            uni.setStorageSync(`diaries_${userId}`, diaries);
          }
          uni.setStorageSync('diaries', diaries);
          this.loadDiaries();
          uni.showToast({
            title: '本地删除成功',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('本地删除失败:', error);
        uni.showToast({
          title: '删除失败',
          icon: 'error'
        });
      }
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
