import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import viteImagemin from 'vite-plugin-imagemin'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    // 图片压缩插件
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.8] },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: false }
        ]
      }
    })
  ],
  build: {
    // 图片优化配置
    assetsInlineLimit: 4096, // 小于4KB的图片会被内联为base64
    rollupOptions: {
      output: {
        // 图片资源分块
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  },
  // 开发服务器配置
  server: {
    // 启用gzip压缩
    compress: true
  }
})
