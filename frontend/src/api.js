import axios from 'axios';

// 1. axiosの共通設定（インスタンス）を作成
const api = axios.create({
  // 環境変数からURLを取得（Viteのルール：import.meta.env）
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. 共通のエラーハンドリング（任意）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API通信でエラーが発生しました:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;