// 使用全局变量方式，在构建时注入
const API_BASE = window.API_BASE || '/api';

export const apiUrl = (path) => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};


