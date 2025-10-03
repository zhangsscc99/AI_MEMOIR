<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="nav-title">书籍管理</view>
    </view>

    <!-- 页面内容 -->
    <view class="content">
      <!-- 生成新书籍按钮 -->
      <view class="action-section">
        <button 
          class="generate-new-btn" 
          :class="{ 'generating': isGenerating }"
          @click="generateNewBook"
          :disabled="isGenerating"
        >
          <text v-if="!isGenerating">+ 生成新书籍</text>
          <text v-else>生成中...</text>
        </button>
        <view class="action-tip">点击生成一份新的回忆录书籍PDF</view>
      </view>

      <!-- PDF列表 -->
      <view class="pdf-list-section">
        <view class="section-header">
          <text class="section-title">我的书籍</text>
          <text class="section-count">共 {{ pdfList.length }} 份</text>
        </view>

        <!-- 加载状态 -->
        <view v-if="isLoading" class="loading-state">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="pdfList.length === 0" class="empty-state">
          <image src="/static/icons/empty-book.svg" class="empty-icon" mode="aspectFit"></image>
          <text class="empty-text">还没有生成书籍</text>
          <text class="empty-subtitle">点击上方按钮生成您的第一份回忆录</text>
        </view>

        <!-- PDF列表 -->
        <view v-else class="pdf-list">
          <view 
            v-for="(pdf, index) in pdfList" 
            :key="index"
            class="pdf-item"
          >
            <view class="pdf-info">
              <view class="pdf-icon">
                <image src="/static/icons/book-filled.svg" class="book-icon" mode="aspectFit"></image>
              </view>
              <view class="pdf-details">
                <text class="pdf-name">回忆录 {{ formatDate(pdf.createdAt) }}</text>
                <text class="pdf-meta">{{ formatFileSize(pdf.size) }} · {{ formatDateTime(pdf.createdAt) }}</text>
              </view>
            </view>
            <view class="pdf-actions">
              <button class="action-btn download-btn" @click="downloadPdf(pdf)">
                下载
              </button>
              <button class="action-btn preview-btn" @click="previewPdf(pdf)">
                预览
              </button>
            </view>
          </view>
        </view>
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
      pdfList: [],
      isLoading: false,
      isGenerating: false
    }
  },
  onLoad() {
    this.loadPdfList();
  },
  onShow() {
    // 每次显示页面时重新加载PDF列表
    this.loadPdfList();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },

    // 加载PDF列表
    async loadPdfList() {
      try {
        this.isLoading = true;

        const token = uni.getStorageSync('token');
        if (!token) {
          console.log('用户未登录');
          this.pdfList = [];
          return;
        }

        const response = await uni.request({
          url: apiUrl('/pdf/list'),
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.statusCode === 200 && response.data.success) {
          this.pdfList = response.data.data.pdfs || [];
          console.log('✅ 加载PDF列表成功:', this.pdfList);
        } else {
          throw new Error(response.data?.message || '加载失败');
        }

      } catch (error) {
        console.error('❌ 加载PDF列表失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        });
      } finally {
        this.isLoading = false;
      }
    },

    // 生成新书籍
    async generateNewBook() {
      if (this.isGenerating) {
        return;
      }

      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'error'
        });
        return;
      }

      this.isGenerating = true;

      try {
        console.log('📚 开始生成新书籍...');

        uni.showLoading({
          title: '正在生成书籍...'
        });

        const response = await uni.request({
          url: apiUrl('/pdf/generate'),
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        uni.hideLoading();

        if (response.statusCode === 200 && response.data.success) {
          console.log('✅ 书籍生成成功');

          uni.showToast({
            title: '书籍生成成功',
            icon: 'success',
            duration: 2000
          });

          // 重新加载列表
          await this.loadPdfList();

        } else {
          throw new Error(response.data?.message || '书籍生成失败');
        }

      } catch (error) {
        console.error('❌ 书籍生成失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: '生成失败: ' + (error.message || '未知错误'),
          icon: 'error',
          duration: 3000
        });
      } finally {
        this.isGenerating = false;
      }
    },

    // 下载PDF
    downloadPdf(pdf) {
      const baseUrl = apiUrl('');
      const fullPdfUrl = baseUrl + pdf.url;

      console.log('📥 下载PDF:', fullPdfUrl);

      // #ifdef H5
      const link = document.createElement('a');
      link.href = fullPdfUrl;
      link.download = pdf.fileName || 'memoir.pdf';
      link.click();

      uni.showToast({
        title: '开始下载',
        icon: 'success'
      });
      // #endif

      // #ifndef H5
      uni.downloadFile({
        url: fullPdfUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveFile({
              tempFilePath: res.tempFilePath,
              success: (saveRes) => {
                console.log('✅ PDF保存成功:', saveRes.savedFilePath);
                uni.showToast({
                  title: '下载成功',
                  icon: 'success'
                });
              },
              fail: (err) => {
                console.error('❌ PDF保存失败:', err);
                uni.showToast({
                  title: '保存失败',
                  icon: 'error'
                });
              }
            });
          }
        },
        fail: (err) => {
          console.error('❌ PDF下载失败:', err);
          uni.showToast({
            title: '下载失败',
            icon: 'error'
          });
        }
      });
      // #endif
    },

    // 预览PDF
    previewPdf(pdf) {
      const baseUrl = apiUrl('');
      const fullPdfUrl = baseUrl + pdf.url;

      console.log('👁 预览PDF:', fullPdfUrl);

      // #ifdef H5
      window.open(fullPdfUrl, '_blank');
      // #endif

      // #ifndef H5
      uni.downloadFile({
        url: fullPdfUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.openDocument({
              filePath: res.tempFilePath,
              showMenu: true,
              success: () => {
                console.log('✅ 打开PDF成功');
              },
              fail: (err) => {
                console.error('❌ 打开PDF失败:', err);
                uni.showToast({
                  title: '打开失败',
                  icon: 'error'
                });
              }
            });
          }
        },
        fail: (err) => {
          console.error('❌ 下载PDF失败:', err);
          uni.showToast({
            title: '预览失败',
            icon: 'error'
          });
        }
      });
      // #endif
    },

    // 格式化日期（简短版本）
    formatDate(dateStr) {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    },

    // 格式化日期时间（完整版本）
    formatDateTime(dateStr) {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    },

    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes) return '未知';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.nav-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 20px;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.back-btn {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.back-btn:active {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}

.back-icon {
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 600;
  color: #333;
  font-family: "STKaiti", "KaiTi", "华文楷体", serif;
  letter-spacing: 2px;
}

.content {
  padding: 20px;
}

/* 生成新书籍按钮区域 */
.action-section {
  margin-bottom: 30px;
  text-align: center;
}

.generate-new-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.generate-new-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.generate-new-btn.generating {
  background: rgba(255, 255, 255, 0.7);
  opacity: 0.6;
}

.action-tip {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

/* PDF列表区域 */
.pdf-list-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.section-count {
  font-size: 14px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 12px;
  border-radius: 12px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  opacity: 0.3;
}

.empty-text {
  display: block;
  font-size: 18px;
  color: #666;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-subtitle {
  display: block;
  font-size: 14px;
  color: #999;
  line-height: 1.5;
}

/* PDF列表 */
.pdf-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pdf-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.pdf-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.pdf-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.pdf-icon {
  width: 40px;
  height: 40px;
  margin-right: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8px;
}

.book-icon {
  width: 24px;
  height: 24px;
  opacity: 0.8;
}

.pdf-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pdf-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pdf-meta {
  font-size: 12px;
  color: #999;
}

.pdf-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
}

.download-btn {
  background: #D4AF37;
  color: white;
  opacity: 0.85;
}

.download-btn:hover {
  background: #C4A030;
  opacity: 1;
}

.preview-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.preview-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .pdf-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .pdf-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .action-btn {
    flex: 1;
  }
}
</style>

