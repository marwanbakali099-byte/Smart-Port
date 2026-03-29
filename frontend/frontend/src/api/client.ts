import axios from 'axios';

// ==========================================
// MOCK DATA FLAG
// ==========================================
export const USE_MOCK = false; // Set to false when Django backend is ready
// ==========================================

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_port_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smart_port_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to simulate network delay for mock promises
export const simulateDelay = <T>(data: T, ms = 800): Promise<T> => 
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export default apiClient;
