<template>
  <view class="lazy-image-container" :style="{ width: width, height: height }">
    <!-- 占位符 -->
    <view 
      v-if="!loaded" 
      class="image-placeholder"
      :style="{ 
        width: width, 
        height: height,
        backgroundColor: placeholderColor 
      }"
    >
      <view class="loading-spinner" v-if="loading">
        <view class="spinner"></view>
      </view>
    </view>
    
    <!-- 实际图片 -->
    <image
      v-show="loaded"
      :src="optimizedSrc"
      :mode="mode"
      :class="imageClass"
      :style="{ width: width, height: height }"
      @load="onImageLoad"
      @error="onImageError"
      :lazy-load="true"
    />
  </view>
</template>

<script>
// 导入图片映射工具
import { getOptimalImagePath } from '@/utils/imageMapping.js';

export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '200px'
    },
    mode: {
      type: String,
      default: 'aspectFill'
    },
    placeholderColor: {
      type: String,
      default: '#f5f5f5'
    },
    imageClass: {
      type: String,
      default: ''
    },
    // 是否启用WebP格式
    enableWebP: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loaded: false,
      loading: false,
      error: false
    }
  },
  computed: {
    optimizedSrc() {
      if (!this.src) return ''
      
      // 如果是网络图片，直接返回
      if (this.src.startsWith('http')) {
        return this.src
      }
      
      // 使用图片映射工具获取最优路径
      return getOptimalImagePath(this.src)
    }
  },
  mounted() {
    this.loadImage()
  },
  methods: {
    loadImage() {
      if (!this.src) return
      
      this.loading = true
      
      // 使用Intersection Observer API进行懒加载
      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.preloadImage()
              observer.unobserve(entry.target)
            }
          })
        })
        
        observer.observe(this.$el)
      } else {
        // 降级处理，直接加载
        this.preloadImage()
      }
    },
    
    preloadImage() {
      const img = new Image()
      img.onload = () => {
        this.loaded = true
        this.loading = false
        this.$emit('load')
      }
      img.onerror = () => {
        this.loading = false
        this.error = true
        this.$emit('error')
      }
      img.src = this.optimizedSrc
    },
    
    onImageLoad() {
      this.loaded = true
      this.loading = false
      this.$emit('load')
    },
    
    onImageError() {
      this.loading = false
      this.error = true
      this.$emit('error')
    }
  }
}
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
