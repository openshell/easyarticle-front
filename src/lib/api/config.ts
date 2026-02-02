import axios, { AxiosInstance } from 'axios';

// API基础URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// 统一API响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 错误类型定义
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的token和用户信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 跳转到登录页面
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;