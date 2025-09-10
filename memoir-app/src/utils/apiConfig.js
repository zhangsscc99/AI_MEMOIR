// API 配置工具
// 根据运行环境自动选择 API 地址

/**
 * 获取 API 基础地址
 * @returns {string} API 基础地址
 */
export function getApiBase() {
  // 根据当前域名判断环境
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // 本地开发环境 - 优先判断，避免被全局变量覆盖
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    
    // 生产环境（服务器域名）
    if (hostname === '106.15.248.189') {
      return 'http://106.15.248.189:3001/api';
    }
  }
  
  // 检查是否有全局注入的 API_BASE（仅在生产构建时使用）
  if (typeof window !== 'undefined' && window.API_BASE) {
    return window.API_BASE;
  }
  
  // 默认返回本地地址（开发环境）
  return 'http://localhost:3001/api';
}

/**
 * 生成完整的 API URL
 * @param {string} path - API 路径
 * @returns {string} 完整的 API URL
 */
export function apiUrl(path) {
  const base = getApiBase();
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

// 导出默认配置
export default {
  getApiBase,
  apiUrl
};
