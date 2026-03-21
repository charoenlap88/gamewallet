import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

/** dev: ใช้ /api/v1 ผ่าน Vite proxy — production: ตั้ง VITE_API_URL */
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api/v1' : 'http://localhost:3000/api/v1');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

function isAuthLoginOrRegister(config?: InternalAxiosRequestConfig): boolean {
  const url = config?.url || '';
  return url.includes('/auth/login') || url.includes('/auth/register');
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    // อย่า redirect เมื่อ login/register ผิด — ไม่งั้นหน้า login รีโหลดและไม่แสดง error
    if (status === 401 && !isAuthLoginOrRegister(error.config)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Backend TransformInterceptor: `{ success, data: T, timestamp }` */
export const extractData = <T = any>(res: AxiosResponse<unknown>): T => {
  const body = res.data as { data: T };
  return body.data;
};
