import apiClient from './client';

export const userApi = {
  // Get current user profile
  async getProfile() {
    const response = await apiClient.get('/users/me');
    return response.data.data;
  },

  // Update user profile
  async updateProfile(data) {
    const response = await apiClient.patch('/users/me', data);
    return response.data.data;
  },

  // Get user stats
  async getStats() {
    const response = await apiClient.get('/users/me/stats');
    return response.data.data;
  },

  // Update preferences
  async updatePreferences(preferences) {
    const response = await apiClient.patch('/users/me/preferences', preferences);
    return response.data.data;
  },

  // Delete account
  async deleteAccount() {
    await apiClient.delete('/users/me');
  },
};
