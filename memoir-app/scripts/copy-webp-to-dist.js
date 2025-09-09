#!/usr/bin/env node

/**
 * 构建后处理脚本
 * 将 WebP 图片复制到构建目录
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../src/images_webp');
const distDir = path.join(__dirname, '../dist/build/h5/images_webp');

// 创建目标目录
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 复制 WebP 图片
function copyWebPImages() {
  if (!fs.existsSync(sourceDir)) {
    console.log('❌ WebP 源目录不存在:', sourceDir);
    return;
  }

  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;

  files.forEach(file => {
    if (file.endsWith('.webp')) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(distDir, file);
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ 复制 WebP 图片: ${file}`);
        copiedCount++;
      } catch (error) {
        console.error(`❌ 复制失败: ${file}`, error.message);
      }
    }
  });

  console.log(`🎉 完成！共复制 ${copiedCount} 个 WebP 图片到构建目录`);
}

// 执行复制
copyWebPImages();
