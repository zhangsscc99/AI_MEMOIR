// 图片路径工具：生产环境映射到同源 /images_webp 与 /images

export const imageMapping = {
  "/src/images/lion.png": "/images_webp/lion.webp",
  "/src/images/memoirbook.png": "/images_webp/memoirbook.webp",
  "/src/images/story1.png": "/images_webp/story1.webp",
  "/src/images/story10.png": "/images_webp/story10.webp",
  "/src/images/story2.png": "/images_webp/story2.webp",
  "/src/images/story3.png": "/images_webp/story3.webp",
  "/src/images/story4.png": "/images_webp/story4.webp",
  "/src/images/story5.png": "/images_webp/story5.webp",
  "/src/images/story6.png": "/images_webp/story6.webp",
  "/src/images/story7.png": "/images_webp/story7.webp",
  "/src/images/story8.png": "/images_webp/story8.webp",
  "/src/images/story9.png": "/images_webp/story9.webp",
  "/src/images/winter.png": "/images_webp/winter.webp",
  "/src/images/zaomen.jpeg": "/images_webp/zaomen.webp"
};

const LEGACY_HOSTS = ['103.146.125.208', 'localhost', '127.0.0.1'];

function getOrigin() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}

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
  try {
    return !!(import.meta && import.meta.env && import.meta.env.PROD);
  } catch (_e) {
    return false;
  }
}

function withOrigin(path) {
  if (!path || /^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const origin = getOrigin();
  if (!origin) return path;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
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
    return mediaBase ? `${mediaBase}${path}` : withOrigin(path);
  }

  return path;
}

function toLocalStaticPath(originalPath) {
  let path = String(originalPath || '');
  if (path.startsWith('/src/images/')) {
    // Prefer WebP in production
    path = path
      .replace('/src/images/', '/images_webp/')
      .replace(/\.(png|jpe?g)$/i, '.webp');
  }
  return path;
}

export function getWebPPath(originalPath) {
  return getOptimalImagePath(originalPath);
}

export function supportsWebP() {
  return true;
}

/**
 * 生产环境：/src/images/x.png → http://host:3020/images_webp/x.webp
 * 上传图：走 MEDIA_BASE(后端)
 */
export function getOptimalImagePath(originalPath) {
  const resolvedPath = resolveMediaUrl(originalPath);
  if (!resolvedPath) return '';

  if (
    /^https?:\/\//i.test(resolvedPath) ||
    resolvedPath.startsWith('blob:') ||
    resolvedPath.startsWith('data:')
  ) {
    return resolvedPath;
  }

  if (resolvedPath.startsWith('/uploads/')) {
    const mediaBase = getMediaBase();
    return mediaBase ? `${mediaBase}${resolvedPath}` : withOrigin(resolvedPath);
  }

  if (/\.svg$/i.test(resolvedPath)) {
    const svgPath = resolvedPath.replace('/src/images/', '/images/');
    return isProductionBuild() ? withOrigin(svgPath) : resolvedPath;
  }

  if (isProductionBuild()) {
    return withOrigin(toLocalStaticPath(resolvedPath));
  }

  return resolvedPath;
}