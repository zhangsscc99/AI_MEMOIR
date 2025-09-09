#!/usr/bin/env node

/**
 * WebP 批量转换脚本
 * 将 images 文件夹中的所有图片转换为 WebP 格式，并保存到 images_webp 文件夹
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

// 转换单个图片为WebP
function convertToWebP(inputPath, outputPath, quality = 80) {
  try {
    const command = `convert "${inputPath}" -quality ${quality} -define webp:lossless=false "${outputPath}"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error(`WebP 转换失败: ${inputPath}`, error.message);
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

// 创建映射文件
function createMappingFile(conversions) {
  const mapping = {};
  conversions.forEach(conv => {
    if (conv.success) {
      // 从 /src/images/xxx.png 映射到 /src/images_webp/xxx.webp
      const relativePath = conv.originalPath.replace(/.*\/src\/images\//, '/src/images/');
      const webpPath = relativePath.replace(/\.(png|jpg|jpeg)$/i, '.webp').replace('/src/images/', '/src/images_webp/');
      mapping[relativePath] = webpPath;
    }
  });
  
  const mappingPath = path.join(__dirname, '../src/utils/imageMapping.js');
  const mappingContent = `// 自动生成的图片映射文件
// 用于将原始图片路径映射到 WebP 路径

export const imageMapping = ${JSON.stringify(mapping, null, 2)};

// 获取 WebP 路径
export function getWebPPath(originalPath) {
  return imageMapping[originalPath] || originalPath;
}

// 检查是否支持 WebP
export function supportsWebP() {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// 获取最优图片路径（支持 WebP 则返回 WebP，否则返回原图）
export function getOptimalImagePath(originalPath) {
  if (supportsWebP()) {
    return getWebPPath(originalPath);
  }
  return originalPath;
}
`;
  
  fs.writeFileSync(mappingPath, mappingContent);
  console.log(`📝 图片映射文件已生成: ${mappingPath}`);
}

// 主函数
async function main() {
  console.log('🚀 开始 WebP 批量转换...\n');
  
  // 检查依赖
  checkDependencies();
  
  const imagesDir = path.join(__dirname, '../src/images');
  const webpDir = path.join(__dirname, '../src/images_webp');
  
  // 创建 WebP 目录
  if (!fs.existsSync(webpDir)) {
    fs.mkdirSync(webpDir, { recursive: true });
    console.log(`📁 创建 WebP 目录: ${webpDir}`);
  }
  
  // 获取所有图片文件
  const imageFiles = getImageFiles(imagesDir);
  
  if (imageFiles.length === 0) {
    console.log('❌ 没有找到图片文件');
    return;
  }
  
  console.log(`📁 找到 ${imageFiles.length} 个图片文件\n`);
  
  let totalOriginalSize = 0;
  let totalWebPSize = 0;
  let successCount = 0;
  const conversions = [];
  
  // 处理单个图片的函数
  async function processImage(filePath, index) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    const nameWithoutExt = path.basename(filePath, ext);
    const relativePath = filePath.replace(/.*\/src\/images\//, '/src/images/');
    
    console.log(`[${index + 1}/${imageFiles.length}] 转换: ${fileName}`);
    
    // 获取原始文件大小
    const originalSize = getFileSize(filePath);
    
    // 生成 WebP 文件路径
    const webpFileName = `${nameWithoutExt}.webp`;
    const webpPath = path.join(webpDir, webpFileName);
    
    try {
      // 转换图片
      const success = convertToWebP(filePath, webpPath, 80);
      
      if (success) {
        const webpSize = getFileSize(webpPath);
        const reduction = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
        
        console.log(`  📊 原始: ${formatFileSize(originalSize)} → WebP: ${formatFileSize(webpSize)} (减少 ${reduction}%)`);
        
        conversions.push({
          originalPath: relativePath,
          webpPath: relativePath.replace('/src/images/', '/src/images_webp/').replace(/\.(png|jpg|jpeg)$/i, '.webp'),
          originalSize,
          webpSize,
          success: true
        });
        
        return {
          originalSize,
          webpSize,
          success: true
        };
      } else {
        console.log(`  ❌ 转换失败`);
        conversions.push({
          originalPath: relativePath,
          webpPath: '',
          originalSize,
          webpSize: 0,
          success: false
        });
        
        return {
          originalSize,
          webpSize: 0,
          success: false
        };
      }
    } catch (error) {
      console.error(`处理图片失败: ${fileName}`, error.message);
      conversions.push({
        originalPath: relativePath,
        webpPath: '',
        originalSize,
        webpSize: 0,
        success: false
      });
      
      return {
        originalSize,
        webpSize: 0,
        success: false
      };
    }
  }
  
  // 并行处理所有图片（限制并发数量）
  const concurrency = 3;
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
    totalWebPSize += result.webpSize;
    if (result.success) successCount++;
  });
  
  // 创建映射文件
  createMappingFile(conversions);
  
  // 输出统计信息
  console.log('\n📈 转换统计:');
  console.log(`  📁 处理文件: ${imageFiles.length} 个`);
  console.log(`  ✅ 成功转换: ${successCount} 个`);
  console.log(`  📊 原始总大小: ${formatFileSize(totalOriginalSize)}`);
  console.log(`  📊 WebP 总大小: ${formatFileSize(totalWebPSize)}`);
  
  const totalReduction = ((totalOriginalSize - totalWebPSize) / totalOriginalSize * 100).toFixed(1);
  console.log(`  💾 总体减少: ${totalReduction}%`);
  console.log(`  💾 节省空间: ${formatFileSize(totalOriginalSize - totalWebPSize)}`);
  
  console.log('\n🎉 WebP 转换完成！');
  console.log(`📁 WebP 文件保存在: ${webpDir}`);
  console.log(`📝 映射文件已生成: src/utils/imageMapping.js`);
  console.log('\n💡 下一步：运行 npm run update-images 更新所有图片引用');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertToWebP, createMappingFile };
