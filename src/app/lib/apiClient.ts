import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// JWT 토큰을 localStorage에서 가져오는 함수 (필요에 따라 수정)
function getJwtToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwtToken');
  }
  return null;
}

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getJwtToken();
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터(예시: 401 처리 등)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 인증 만료 등 처리 (예: 로그아웃, 토큰 삭제 등)
      // localStorage.removeItem('jwtToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient; 