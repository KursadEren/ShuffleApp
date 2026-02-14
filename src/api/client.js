import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { API_BASE_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/config';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage helpers
export const tokenStorage = {
  async getAccessToken() {
    try {
      return await EncryptedStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async getRefreshToken() {
    try {
      return await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setTokens(tokens) {
    await EncryptedStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },

  async clearTokens() {
    await EncryptedStorage.removeItem(ACCESS_TOKEN_KEY);
    await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug log
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: (config.baseURL || '') + (config.url || ''),
      data: config.data,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Debug log success
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    // Debug log error
    console.log('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: JSON.stringify(error.response?.data),
    });
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, register, etc.)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // If 401 and not already retrying and not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await tokenStorage.setTokens({ accessToken, refreshToken: newRefreshToken });

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        // The auth store will handle redirecting to login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
