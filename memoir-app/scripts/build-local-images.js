#!/usr/bin/env node

/**
 * 构建本地图片资源：缩放 + WebP 压缩，仅输出 WebP 与 SVG 到 dist
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MAX_WIDTH = 800;
const WEBP_QUALITY = 75;

const sourceDir = path.join(__dirname, '../src/images');
const srcWebpDir = path.join(__dirname, '../src/images_webp');
const distWebpDir = path.join(__dirname, '../dist/build/h5/images_webp');
const distSvgDir = path.join(__dirname, '../dist/build/h5/images');

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

async function buildWebP(inputPath, outputPath) {
  try {
    const info = await sharp(inputPath)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(outputPath);
    return info.size;
  } catch (error) {
    return null;
  }
}

async function isRasterImage(inputPath) {
  try {
    await sharp(inputPath).metadata();
    return true;
  } catch (_error) {
    return false;
  }
}

async function main() {
  console.log('🖼️  开始构建本地图片资源...\n');

  ensureDir(srcWebpDir);
  ensureDir(distWebpDir);
  ensureDir(distSvgDir);

  const files = fs.readdirSync(sourceDir);
  let webpCount = 0;
  let svgCount = 0;
  let totalWebpBytes = 0;

  for (const file of files) {
    const inputPath = path.join(sourceDir, file);

    if (/\.(png|jpe?g)$/i.test(file)) {
      if (!(await isRasterImage(inputPath))) {
        console.log(`⚠️  跳过无效图片: ${file}`);
        continue;
      }

      const baseName = file.replace(/\.(png|jpe?g)$/i, '');
      const webpName = `${baseName}.webp`;
      const srcOut = path.join(srcWebpDir, webpName);
      const distOut = path.join(distWebpDir, webpName);

      const size = await buildWebP(inputPath, distOut);
      if (!size) {
        console.log(`⚠️  转换失败: ${file}`);
        continue;
      }
      fs.copyFileSync(distOut, srcOut);
      totalWebpBytes += size;
      webpCount += 1;
      console.log(`✅ ${file} → ${webpName} (${formatSize(size)})`);
      continue;
    }

    if (/\.svg$/i.test(file)) {
      fs.copyFileSync(inputPath, path.join(distSvgDir, file));
      svgCount += 1;
      console.log(`✅ SVG: ${file}`);
    }
  }

  // 清理 dist 里可能遗留的旧 PNG/JPEG
  for (const file of fs.readdirSync(distSvgDir)) {
    if (/\.(png|jpe?g)$/i.test(file)) {
      fs.unlinkSync(path.join(distSvgDir, file));
    }
  }

  console.log('\n📈 构建统计:');
  console.log(`  WebP: ${webpCount} 个, 合计 ${formatSize(totalWebpBytes)}`);
  console.log(`  SVG:  ${svgCount} 个`);
  console.log(`  输出: ${distWebpDir}`);
  console.log(`        ${distSvgDir}`);
  console.log('\n🎉 本地图片构建完成（生产环境不包含 PNG/JPEG）');
}

main().catch((error) => {
  console.error('❌ 图片构建失败:', error);
  process.exit(1);
});
