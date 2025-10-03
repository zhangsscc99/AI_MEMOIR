#!/usr/bin/env node

/**
 * 构建后处理脚本
 * 将所有图片复制到构建目录
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../src/images');
const distDir = path.join(__dirname, '../dist/build/h5/images');

// 创建目标目录
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 复制所有图片
function copyAllImages() {
  if (!fs.existsSync(sourceDir)) {
    console.log('❌ 图片源目录不存在:', sourceDir);
    return;
  }

  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;

  files.forEach(file => {
    if (file.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(distDir, file);
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ 复制图片: ${file}`);
        copiedCount++;
      } catch (error) {
        console.error(`❌ 复制失败: ${file}`, error.message);
      }
    }
  });

  console.log(`🎉 完成！共复制 ${copiedCount} 个图片到构建目录`);
}

// 执行复制
copyAllImages();
