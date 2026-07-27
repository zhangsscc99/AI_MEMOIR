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

const LEGACY_HOSTS = ['103.146.125.208', 'localhost', '127.0.0.1'];

function getMediaBase() {
  if (typeof window !== 'undefined') {
    if (window.MEDIA_BASE) {
      return String(window.MEDIA_BASE).replace(/\/$/, '');
    }
    if (window.API_BASE) {
      return String(window.API_BASE).replace(/\/api\/?$/, '');
    }
  }
  return '';
}

function isProductionBuild() {
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) ||
    process.env.NODE_ENV === 'production';
}

function toProductionStaticPath(originalPath) {
  return originalPath.replace('/src/images/', '/images/');
}

function toProductionWebpPath(originalPath) {
  return toProductionStaticPath(originalPath)
    .replace('/images/', '/images_webp/')
    .replace(/\.(png|jpe?g)$/i, '.webp');
}

export function resolveMediaUrl(path) {
  if (!path) return '';

  if (path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (LEGACY_HOSTS.includes(url.hostname)) {
        const mediaBase = getMediaBase();
        if (mediaBase) {
          return `${mediaBase}${url.pathname}${url.search}${url.hash}`;
        }
      }
      if (url.hostname === '103.146.125.208') {
        url.hostname = '103.146.124.206';
        return url.toString();
      }
    } catch (_error) {
      return path;
    }
    return path;
  }

  if (path.startsWith('/uploads/')) {
    const mediaBase = getMediaBase();
    return mediaBase ? `${mediaBase}${path}` : path;
  }

  return path;
}

// 获取 WebP 路径
export function getWebPPath(originalPath) {
  const resolvedPath = resolveMediaUrl(originalPath);
  if (/^https?:\/\//i.test(resolvedPath) || resolvedPath.startsWith('/uploads/')) {
    return resolvedPath;
  }

  if (isProductionBuild()) {
    if (/\.svg$/i.test(resolvedPath)) {
      return toProductionStaticPath(resolvedPath);
    }
    return toProductionWebpPath(resolvedPath);
  }

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
  const resolvedPath = resolveMediaUrl(originalPath);
  if (!resolvedPath) return '';

  if (/^https?:\/\//i.test(resolvedPath) || resolvedPath.startsWith('/uploads/')) {
    return resolvedPath;
  }

  if (/\.svg$/i.test(resolvedPath)) {
    return isProductionBuild() ? toProductionStaticPath(resolvedPath) : resolvedPath;
  }

  if (supportsWebP()) {
    return getWebPPath(originalPath);
  }

  if (isProductionBuild()) {
    return toProductionStaticPath(resolvedPath);
  }

  return resolvedPath;
}
