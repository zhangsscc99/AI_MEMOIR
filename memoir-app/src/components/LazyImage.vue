<template>
  <view class="lazy-image-container" :class="{ 'lazy-image-fill': fill }" :style="containerStyle">
    <image
      :src="displaySrc"
      :mode="mode"
      :class="imageClass"
      :style="imageStyle"
      :lazy-load="!immediate"
      @error="onImageError"
    />
  </view>
</template>

<script>
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
    imageClass: {
      type: String,
      default: ''
    },
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
      useFallback: false
    };
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
    optimizedSrc() {
      if (!this.src) return '';
      return getOptimalImagePath(this.src);
    },
    fallbackSrc() {
      if (!this.src || /^https?:\/\//i.test(this.src) || this.src.startsWith('/uploads/')) {
        return this.optimizedSrc;
      }
      return this.src.replace('/src/images/', '/images/');
    },
    displaySrc() {
      return this.useFallback ? this.fallbackSrc : this.optimizedSrc;
    }
  },
  methods: {
    onImageError() {
      if (!this.useFallback && this.fallbackSrc !== this.optimizedSrc) {
        this.useFallback = true;
      }
    }
  }
};
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
</style>
