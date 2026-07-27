// API 配置工具
// 根据运行环境自动选择 API 地址

const DEV_BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3200';
const DEV_API_BASE = import.meta.env.VITE_API_BASE || `http://localhost:${DEV_BACKEND_PORT}/api`;
const CAPACITOR_API_BASE = import.meta.env.VITE_CAPACITOR_API_BASE || 'http://103.146.125.208:3001/api';

/**
 * 获取 API 基础地址
 * @returns {string} API 基础地址
 */
export function getApiBase() {
  console.log('🔍 [API Config] 开始检测 API 基础地址...');
  
  // 检查是否有全局注入的 API_BASE（优先使用）
  if (typeof window !== 'undefined' && window.API_BASE) {
    console.log('✅ [API Config] 使用全局注入的 API_BASE:', window.API_BASE);
    return window.API_BASE;
  }
  
  // 检查是否在移动应用中（Capacitor 环境）- 优先判断
  if (typeof window !== 'undefined' && window.Capacitor) {
    console.log('📱 [API Config] 检测到 Capacitor 环境，使用服务器地址');
    const apiUrl = CAPACITOR_API_BASE;
    console.log('🎯 [API Config] 最终 API 地址:', apiUrl);
    return apiUrl;
  }
  
  // 根据当前域名判断环境（仅在非 Capacitor 环境中）
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('🌐 [API Config] 当前 hostname:', hostname);
    console.log('🔧 [API Config] Capacitor 环境检测:', !!window.Capacitor);
    
    // 本地开发环境（仅在浏览器中）
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('💻 [API Config] 检测到本地开发环境，使用 localhost');
      return DEV_API_BASE;
    }
    
    // 生产环境（服务器域名）
    if (hostname === '103.146.125.208') {
      console.log('🌍 [API Config] 检测到生产环境，使用Nginx代理');
      return '/api';
    }
  }
  
  // 默认返回相对路径（生产环境）
  console.log('⚙️ [API Config] 使用默认相对路径');
  const defaultUrl = '/api';
  console.log('🎯 [API Config] 最终 API 地址:', defaultUrl);
  return defaultUrl;
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
