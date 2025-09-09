export const API_BASE = import.meta?.env?.VITE_API_BASE || '/api';

export const apiUrl = (path) => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};


