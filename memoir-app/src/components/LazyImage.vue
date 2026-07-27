<template>
  <view class="lazy-image-container" :class="{ 'lazy-image-fill': fill }" :style="containerStyle">
    <!-- 占位符 -->
    <view 
      v-if="!loaded" 
      class="image-placeholder"
      :style="placeholderStyle"
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
      :style="imageStyle"
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
    },
    // 是否立即加载（不进行懒加载）
    immediate: {
      type: Boolean,
      default: false
    },
    fill: {
      type: Boolean,
      default: false
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
    containerStyle() {
      if (this.fill) return {};
      return { width: this.width, height: this.height };
    },
    imageStyle() {
      if (this.fill) return { width: '100%', height: '100%' };
      return { width: this.width, height: this.height };
    },
    placeholderStyle() {
      if (this.fill) {
        return { width: '100%', height: '100%', backgroundColor: this.placeholderColor };
      }
      return {
        width: this.width,
        height: this.height,
        backgroundColor: this.placeholderColor
      };
    },
    optimizedSrc() {
      if (!this.src) return '';
      return getOptimalImagePath(this.src);
    }
  },
  mounted() {
    if (this.immediate) {
      // 立即加载，不使用懒加载
      this.preloadImage()
    } else {
      this.loadImage()
    }
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
}

.lazy-image-container.lazy-image-fill {
  position: absolute;
  inset: 0;
  border-radius: 0;
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
