// 自动生成的图片映射文件
// 用于将原始图片路径映射到 WebP 路径

export const imageMapping = {
  "/src/images/lion.png": "/src/images_webp/lion.webp",
  "/src/images/memoirbook.png": "/src/images_webp/memoirbook.webp",
  "/src/images/story1.png": "/src/images_webp/story1.webp",
  "/src/images/story10.png": "/src/images_webp/story10.webp",
  "/src/images/story2.png": "/src/images_webp/story2.webp",
  "/src/images/story3.png": "/src/images_webp/story3.webp",
  "/src/images/story4.png": "/src/images_webp/story4.webp",
  "/src/images/story5.png": "/src/images_webp/story5.webp",
  "/src/images/story6.png": "/src/images_webp/story6.webp",
  "/src/images/story7.png": "/src/images_webp/story7.webp",
  "/src/images/story8.png": "/src/images_webp/story8.webp",
  "/src/images/story9.png": "/src/images_webp/story9.webp",
  "/src/images/winter.png": "/src/images_webp/winter.webp",
  "/src/images/zaomen.jpeg": "/src/images_webp/zaomen.webp"
};

// 获取 WebP 路径
export function getWebPPath(originalPath) {
  // 检查是否是生产环境
  const isProduction = process.env.NODE_ENV === 'production' || 
                      (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
  
  if (isProduction) {
    // 生产环境：将 /src/images/ 替换为 images_webp/
    const webpPath = originalPath.replace('/src/images/', 'images_webp/').replace(/\.(png|jpe?g)$/i, '.webp');
    return webpPath;
  }
  
  // 开发环境：使用映射表
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
