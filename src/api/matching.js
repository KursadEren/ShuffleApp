import apiClient from './client';

export const matchingApi = {
  // Eşleşme kuyruğuna katıl
  joinQueue: async (data) => {
    const response = await apiClient.post('/matching/join-queue', data);
    return response.data;
  },

  // Kuyruktan ayrıl
  leaveQueue: async () => {
    const response = await apiClient.delete('/matching/leave-queue');
    return response.data;
  },

  // Eşleşme durumunu sorgula
  getStatus: async () => {
    const response = await apiClient.get('/matching/status');
    return response.data;
  },
};
