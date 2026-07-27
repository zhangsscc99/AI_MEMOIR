const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/build/h5/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const apiBaseScript = `
  <script>
    window.API_BASE = 'http://103.146.124.206:3001/api';
    window.MEDIA_BASE = 'http://103.146.124.206:3001';
  </script>`;

html = html.replace('</head>', apiBaseScript + '\n</head>');
fs.writeFileSync(indexPath, html);

console.log('✅ API_BASE / MEDIA_BASE 已注入到 index.html');
