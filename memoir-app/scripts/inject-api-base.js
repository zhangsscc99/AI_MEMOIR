const fs = require('fs');
const path = require('path');

// 读取构建后的index.html
const indexPath = path.join(__dirname, '../dist/build/h5/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 在head标签中注入API_BASE全局变量
const apiBaseScript = `
  <script>
    window.API_BASE = 'http://103.146.125.208:3001/api';
  </script>`;

// 在</head>之前插入脚本
html = html.replace('</head>', apiBaseScript + '\n</head>');

// 写回文件
fs.writeFileSync(indexPath, html);

console.log('✅ API_BASE 已注入到 index.html');
