#!/usr/bin/env node

/**
 * 图片优化脚本
 * 用于压缩和优化项目中的图片文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查是否安装了必要的工具
function checkDependencies() {
  try {
    execSync('which convert', { stdio: 'ignore' });
    console.log('✅ ImageMagick 已安装');
  } catch (error) {
    console.log('❌ 请先安装 ImageMagick: brew install imagemagick');
    process.exit(1);
  }
}

// 获取图片文件列表
function getImageFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getImageFiles(fullPath));
    } else if (/\.(png|jpg|jpeg)$/i.test(item)) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// 压缩单个图片
function optimizeImage(inputPath, outputPath, quality = 80) {
  try {
    const ext = path.extname(inputPath).toLowerCase();
    let command;
    
    if (ext === '.png') {
      // PNG 压缩
      command = `convert "${inputPath}" -strip -quality ${quality} -define png:compression-level=9 "${outputPath}"`;
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      // JPEG 压缩
      command = `convert "${inputPath}" -strip -quality ${quality} -interlace Plane "${outputPath}"`;
    }
    
    if (command) {
      execSync(command, { stdio: 'ignore' });
      return true;
    }
  } catch (error) {
    console.error(`压缩失败: ${inputPath}`, error.message);
    return false;
  }
  
  return false;
}

// 生成 WebP 格式
function generateWebP(inputPath, outputPath, quality = 80) {
  try {
    const command = `convert "${inputPath}" -quality ${quality} "${outputPath}"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error(`WebP 生成失败: ${inputPath}`, error.message);
    return false;
  }
}

// 获取文件大小
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 主函数
async function main() {
  console.log('🚀 开始图片优化...\n');
  
  // 检查依赖
  checkDependencies();
  
  const imagesDir = path.join(__dirname, '../src/images');
  const backupDir = path.join(__dirname, '../src/images/backup');
  
  // 创建备份目录
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // 获取所有图片文件
  const imageFiles = getImageFiles(imagesDir);
  
  if (imageFiles.length === 0) {
    console.log('❌ 没有找到图片文件');
    return;
  }
  
  console.log(`📁 找到 ${imageFiles.length} 个图片文件\n`);
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let totalWebPSize = 0;
  let successCount = 0;
  let webpCount = 0;
  
  // 处理单个图片的函数
  async function processImage(filePath, index) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    const nameWithoutExt = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    console.log(`[${index + 1}/${imageFiles.length}] 处理: ${fileName}`);
    
    // 获取原始文件大小
    const originalSize = getFileSize(filePath);
    
    // 备份原文件
    const backupPath = path.join(backupDir, fileName);
    fs.copyFileSync(filePath, backupPath);
    
    // 并行处理：同时进行压缩和WebP转换
    const optimizedPath = path.join(dir, `${nameWithoutExt}_optimized${ext}`);
    const webpPath = path.join(dir, `${nameWithoutExt}.webp`);
    
    try {
      // 使用 Promise.allSettled 并行执行
      const [compressionResult, webpResult] = await Promise.allSettled([
        new Promise((resolve) => {
          const result = optimizeImage(filePath, optimizedPath, 80);
          resolve(result);
        }),
        new Promise((resolve) => {
          const result = generateWebP(filePath, webpPath, 80);
          resolve(result);
        })
      ]);
      
      const compressionSuccess = compressionResult.status === 'fulfilled' && compressionResult.value;
      const webpSuccess = webpResult.status === 'fulfilled' && webpResult.value;
      
      // 处理压缩结果
      if (compressionSuccess) {
        const optimizedSize = getFileSize(optimizedPath);
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        console.log(`  📊 原始: ${formatFileSize(originalSize)} → 优化: ${formatFileSize(optimizedSize)} (减少 ${reduction}%)`);
        
        // 如果压缩效果好，替换原文件
        if (optimizedSize < originalSize) {
          fs.renameSync(optimizedPath, filePath);
          return { 
            originalSize, 
            optimizedSize, 
            success: true, 
            webpSuccess: false, 
            webpSize: 0 
          };
        } else {
          // 压缩效果不好，删除优化文件
          fs.unlinkSync(optimizedPath);
          console.log(`  ⚠️  压缩效果不佳，保持原文件`);
        }
      } else {
        console.log(`  ❌ 压缩失败`);
      }
      
      // 处理 WebP 结果
      let webpSize = 0;
      if (webpSuccess) {
        webpSize = getFileSize(webpPath);
        const webpReduction = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
        console.log(`  🎨 WebP: ${formatFileSize(webpSize)} (减少 ${webpReduction}%)`);
      } else {
        console.log(`  ❌ WebP 生成失败`);
      }
      
      return { 
        originalSize, 
        optimizedSize: originalSize, 
        success: compressionSuccess, 
        webpSuccess, 
        webpSize 
      };
      
    } catch (error) {
      console.error(`处理图片失败: ${fileName}`, error.message);
      return { 
        originalSize, 
        optimizedSize: originalSize, 
        success: false, 
        webpSuccess: false, 
        webpSize: 0 
      };
    }
  }
  
  // 并行处理所有图片（限制并发数量）
  const concurrency = 3; // 同时处理3个图片
  const results = [];
  
  for (let i = 0; i < imageFiles.length; i += concurrency) {
    const batch = imageFiles.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((filePath, batchIndex) => 
      processImage(filePath, i + batchIndex)
    ));
    results.push(...batchResults);
  }
  
  // 统计结果
  results.forEach(result => {
    totalOriginalSize += result.originalSize;
    totalOptimizedSize += result.optimizedSize;
    totalWebPSize += result.webpSize;
    if (result.success) successCount++;
    if (result.webpSuccess) webpCount++;
  });
  
  // 输出统计信息
  console.log('📈 优化统计:');
  console.log(`  📁 处理文件: ${imageFiles.length} 个`);
  console.log(`  ✅ 成功压缩: ${successCount} 个`);
  console.log(`  🎨 生成 WebP: ${webpCount} 个`);
  console.log(`  📊 原始总大小: ${formatFileSize(totalOriginalSize)}`);
  console.log(`  📊 优化后大小: ${formatFileSize(totalOptimizedSize)}`);
  console.log(`  📊 WebP 总大小: ${formatFileSize(totalWebPSize)}`);
  
  const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
  const webpReduction = ((totalOriginalSize - totalWebPSize) / totalOriginalSize * 100).toFixed(1);
  
  console.log(`  💾 总体减少: ${totalReduction}%`);
  console.log(`  🎨 WebP 减少: ${webpReduction}%`);
  console.log(`  💾 节省空间: ${formatFileSize(totalOriginalSize - totalOptimizedSize)}`);
  console.log(`  🎨 WebP 节省: ${formatFileSize(totalOriginalSize - totalWebPSize)}`);
  
  console.log('\n🎉 图片优化完成！');
  console.log(`📁 原文件备份在: ${backupDir}`);
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { optimizeImage, generateWebP };
