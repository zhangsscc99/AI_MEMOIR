const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 图标配置
const icons = [
  { name: 'home', color: '#7A7E83', filledColor: '#FF6B47' },
  { name: 'book', color: '#7A7E83', filledColor: '#FF6B47' },
  { name: 'edit', color: '#7A7E83', filledColor: '#FF6B47' },
  { name: 'user', color: '#7A7E83', filledColor: '#FF6B47' },
  { name: 'chat', color: '#7A7E83', filledColor: '#FF6B47' }
];

const sourceDir = 'src/static/icons';
const targetDir = 'src/static/tabbar';

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('🎨 开始生成高质量的 tabBar 图标...');

icons.forEach(icon => {
  try {
    // 生成普通状态图标
    const normalCmd = `magick "${sourceDir}/${icon.name}.svg" -resize 80x80 -background transparent -fill "${icon.color}" -colorize 100 -type TrueColor "${targetDir}/${icon.name}.png"`;
    execSync(normalCmd, { stdio: 'pipe' });
    console.log(`✅ 生成 ${icon.name}.png`);

    // 生成选中状态图标
    const filledCmd = `magick "${sourceDir}/${icon.name}-filled.svg" -resize 80x80 -background transparent -fill "${icon.filledColor}" -colorize 100 -type TrueColor "${targetDir}/${icon.name}-filled.png"`;
    execSync(filledCmd, { stdio: 'pipe' });
    console.log(`✅ 生成 ${icon.name}-filled.png`);
  } catch (error) {
    console.error(`❌ 生成 ${icon.name} 图标失败:`, error.message);
  }
});

console.log('🎉 所有 tabBar 图标生成完成！');
