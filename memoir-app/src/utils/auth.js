// 认证工具
import { apiUrl } from './apiConfig.js';

/**
 * 检查token是否有效
 * @returns {Promise<boolean>} token是否有效
 */
export async function checkTokenValid() {
  try {
    const token = uni.getStorageSync('token');
    if (!token) {
      return false;
    }

    // 尝试调用一个需要认证的API来验证token
    const response = await uni.request({
      url: apiUrl('/auth/me'),
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.statusCode === 200 && response.data.success;
  } catch (error) {
    console.error('Token验证失败:', error);
    return false;
  }
}

/**
 * 清除用户认证信息
 */
export function clearAuth() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('user');
  uni.removeStorageSync('customCharacterName');
}

/**
 * 跳转到登录页面
 */
export function goToLogin() {
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  });
  
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/login/index'
    });
  }, 2000);
}

/**
 * 处理API响应，检查认证错误
 * @param {Object} response - API响应
 * @returns {boolean} 是否需要重新登录
 */
export function handleAuthError(response) {
  if (response.statusCode === 401) {
    const errorCode = response.data?.code;
    if (errorCode === 'AUTH_FAILED' || errorCode === 'NO_TOKEN' || errorCode === 'USER_NOT_FOUND') {
      clearAuth();
      goToLogin();
      return true;
    }
  }
  return false;
}
