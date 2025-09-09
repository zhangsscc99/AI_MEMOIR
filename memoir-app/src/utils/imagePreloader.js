/**
 * 图片预加载工具
 * 用于提前加载关键图片，提升用户体验
 */

class ImagePreloader {
  constructor() {
    this.cache = new Map()
    this.loadingPromises = new Map()
  }

  /**
   * 预加载单张图片
   * @param {string} src 图片路径
   * @param {Object} options 选项
   * @returns {Promise} 加载Promise
   */
  preload(src, options = {}) {
    if (!src) return Promise.reject(new Error('图片路径不能为空'))
    
    // 如果已经缓存，直接返回
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src))
    }
    
    // 如果正在加载，返回现有的Promise
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)
    }
    
    const promise = this._loadImage(src, options)
    this.loadingPromises.set(src, promise)
    
    return promise
  }

  /**
   * 批量预加载图片
   * @param {Array} srcList 图片路径数组
   * @param {Object} options 选项
   * @returns {Promise} 所有图片加载完成的Promise
   */
  preloadBatch(srcList, options = {}) {
    if (!Array.isArray(srcList)) {
      return Promise.reject(new Error('图片路径必须是数组'))
    }
    
    const promises = srcList.map(src => this.preload(src, options))
    return Promise.allSettled(promises)
  }

  /**
   * 预加载关键图片（首屏图片）
   * @param {Array} criticalImages 关键图片列表
   */
  preloadCritical(criticalImages = []) {
    const defaultCriticalImages = [
      '/src/images/memoirbook.png',
      '/src/images/lion.png',
      '/src/images/winter.png',
      '/src/images/story1.png',
      '/src/images/story2.png'
    ]
    
    const imagesToPreload = criticalImages.length > 0 ? criticalImages : defaultCriticalImages
    
    return this.preloadBatch(imagesToPreload, {
      priority: 'high'
    })
  }

  /**
   * 预加载章节图片
   * @param {Array} chapterImages 章节图片列表
   */
  preloadChapterImages(chapterImages = []) {
    const defaultChapterImages = [
      '/src/images/story1.png',
      '/src/images/story2.png',
      '/src/images/story3.png',
      '/src/images/story4.png',
      '/src/images/story5.png',
      '/src/images/story6.png',
      '/src/images/story7.png',
      '/src/images/story8.png',
      '/src/images/story9.png',
      '/src/images/story10.png'
    ]
    
    const imagesToPreload = chapterImages.length > 0 ? chapterImages : defaultChapterImages
    
    return this.preloadBatch(imagesToPreload, {
      priority: 'low'
    })
  }

  /**
   * 内部加载图片方法
   * @private
   */
  _loadImage(src, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        this.cache.set(src, {
          src,
          loaded: true,
          timestamp: Date.now(),
          ...options
        })
        this.loadingPromises.delete(src)
        resolve(this.cache.get(src))
      }
      
      img.onerror = (error) => {
        this.cache.set(src, {
          src,
          loaded: false,
          error: error,
          timestamp: Date.now(),
          ...options
        })
        this.loadingPromises.delete(src)
        reject(error)
      }
      
      // 设置加载优先级
      if (options.priority === 'high') {
        img.loading = 'eager'
      } else {
        img.loading = 'lazy'
      }
      
      img.src = src
    })
  }

  /**
   * 获取缓存状态
   * @param {string} src 图片路径
   * @returns {Object|null} 缓存信息
   */
  getCache(src) {
    return this.cache.get(src) || null
  }

  /**
   * 清除缓存
   * @param {string} src 可选，指定清除的图片路径
   */
  clearCache(src = null) {
    if (src) {
      this.cache.delete(src)
      this.loadingPromises.delete(src)
    } else {
      this.cache.clear()
      this.loadingPromises.clear()
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const total = this.cache.size
    const loaded = Array.from(this.cache.values()).filter(item => item.loaded).length
    const loading = this.loadingPromises.size
    
    return {
      total,
      loaded,
      loading,
      failed: total - loaded
    }
  }
}

// 创建全局实例
const imagePreloader = new ImagePreloader()

export default imagePreloader
export { ImagePreloader }
