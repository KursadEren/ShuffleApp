import apiClient, { tokenStorage } from './client';

export const authApi = {
  // Register new user
  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data.data;
    const tokens = { accessToken, refreshToken };
    await tokenStorage.setTokens(tokens);
    return { user, tokens };
  },

  // Login with email/password
  async login(data) {
    const response = await apiClient.post('/auth/login', data);
    const { accessToken, refreshToken, user } = response.data.data;
    const tokens = { accessToken, refreshToken };
    await tokenStorage.setTokens(tokens);
    return { user, tokens };
  },

  // Logout
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await tokenStorage.clearTokens();
    }
  },

  // Refresh token (handled automatically by interceptor, but exposed for manual use)
  async refreshToken() {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    await tokenStorage.setTokens(response.data.data);
  },

  // Forgot password
  async forgotPassword(email) {
    await apiClient.post('/auth/forgot-password', { email });
  },

  // Reset password
  async resetPassword(token, newPassword) {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  // Verify email
  async verifyEmail(token) {
    await apiClient.post('/auth/verify-email', { token });
  },

  // Verify phone (send OTP)
  async sendPhoneOTP(phone) {
    await apiClient.post('/auth/verify-phone', { phone });
  },

  // Verify phone OTP
  async verifyPhoneOTP(phone, code) {
    await apiClient.post('/auth/verify-phone/confirm', { phone, code });
  },
};
