import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import viteImagemin from 'vite-plugin-imagemin'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

// 自定义插件：构建后复制 WebP 图片
function copyWebPPlugin() {
  return {
    name: 'copy-webp',
    writeBundle() {
      const sourceDir = join(__dirname, 'src/images_webp')
      const distDir = join(__dirname, 'dist/build/h5/images_webp')
      
      if (!existsSync(sourceDir)) {
        console.log('❌ WebP 源目录不存在:', sourceDir)
        return
      }
      
      // 创建目标目录
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true })
      }
      
      // 复制 WebP 图片
      const files = readdirSync(sourceDir)
      let copiedCount = 0
      
      files.forEach(file => {
        if (file.endsWith('.webp')) {
          const sourcePath = join(sourceDir, file)
          const destPath = join(distDir, file)
          
          try {
            copyFileSync(sourcePath, destPath)
            console.log(`✅ 复制 WebP 图片: ${file}`)
            copiedCount++
          } catch (error) {
            console.error(`❌ 复制失败: ${file}`, error.message)
          }
        }
      })
      
      console.log(`🎉 完成！共复制 ${copiedCount} 个 WebP 图片到构建目录`)
    }
  }
}

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
    }),
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
    host: '0.0.0.0',
    port: Number(process.env.FRONTEND_PORT || 4100),
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.VITE_BACKEND_PORT || 3200}`,
        changeOrigin: true
      },
      '/uploads': {
        target: `http://127.0.0.1:${process.env.VITE_BACKEND_PORT || 3200}`,
        changeOrigin: true
      }
    },
    // 启用gzip压缩
    compress: true
  }
})
