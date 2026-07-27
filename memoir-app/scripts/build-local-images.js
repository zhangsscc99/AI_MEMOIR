#!/usr/bin/env node

/**
 * 构建本地图片资源：WebP 主图 + 压缩原格式备用图 + SVG
 * 源码目录 src/images 中的原始 PNG/JPEG 不会被删除或修改
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MAX_WIDTH = 800;
const WEBP_QUALITY = 75;

const sourceDir = path.join(__dirname, '../src/images');
const srcWebpDir = path.join(__dirname, '../src/images_webp');
const distWebpDir = path.join(__dirname, '../dist/build/h5/images_webp');
const distImagesDir = path.join(__dirname, '../dist/build/h5/images');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function isRasterImage(inputPath) {
  try {
    await sharp(inputPath).metadata();
    return true;
  } catch (_error) {
    return false;
  }
}

async function buildWebP(inputPath, outputPath) {
  try {
    const info = await sharp(inputPath)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(outputPath);
    return info.size;
  } catch (_error) {
    return null;
  }
}

async function buildFallback(inputPath, outputPath) {
  try {
    const ext = path.extname(outputPath).toLowerCase();
    let pipeline = sharp(inputPath)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true });

    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
    } else {
      pipeline = pipeline.png({ compressionLevel: 9 });
    }

    const info = await pipeline.toFile(outputPath);
    return info.size;
  } catch (_error) {
    return null;
  }
}

async function main() {
  console.log('🖼️  开始构建本地图片资源...\n');

  ensureDir(srcWebpDir);
  ensureDir(distWebpDir);
  ensureDir(distImagesDir);

  const files = fs.readdirSync(sourceDir);
  let webpCount = 0;
  let fallbackCount = 0;
  let svgCount = 0;
  let totalWebpBytes = 0;
  let totalFallbackBytes = 0;

  for (const file of files) {
    const inputPath = path.join(sourceDir, file);

    if (/\.(png|jpe?g)$/i.test(file)) {
      if (!(await isRasterImage(inputPath))) {
        console.log(`⚠️  跳过无效图片: ${file}`);
        continue;
      }

      const baseName = file.replace(/\.(png|jpe?g)$/i, '');
      const webpName = `${baseName}.webp`;
      const distWebpOut = path.join(distWebpDir, webpName);
      const srcWebpOut = path.join(srcWebpDir, webpName);

      const webpSize = await buildWebP(inputPath, distWebpOut);
      if (!webpSize) {
        console.log(`⚠️  WebP 转换失败: ${file}`);
        continue;
      }

      fs.copyFileSync(distWebpOut, srcWebpOut);
      totalWebpBytes += webpSize;
      webpCount += 1;
      console.log(`✅ ${file} → ${webpName} (${formatSize(webpSize)})`);

      const fallbackOut = path.join(distImagesDir, file);
      const fallbackSize = await buildFallback(inputPath, fallbackOut);
      if (fallbackSize) {
        totalFallbackBytes += fallbackSize;
        fallbackCount += 1;
        console.log(`   ↳ 备用 ${file} (${formatSize(fallbackSize)})`);
      }
      continue;
    }

    if (/\.svg$/i.test(file)) {
      fs.copyFileSync(inputPath, path.join(distImagesDir, file));
      svgCount += 1;
      console.log(`✅ SVG: ${file}`);
    }
  }

  console.log('\n📈 构建统计:');
  console.log(`  WebP: ${webpCount} 个, 合计 ${formatSize(totalWebpBytes)}`);
  console.log(`  备用图: ${fallbackCount} 个, 合计 ${formatSize(totalFallbackBytes)}`);
  console.log(`  SVG: ${svgCount} 个`);
  console.log(`  源码原图仍保留在: ${sourceDir}`);
  console.log('\n🎉 本地图片构建完成');
}

main().catch((error) => {
  console.error('❌ 图片构建失败:', error);
  process.exit(1);
});
