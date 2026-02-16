import apiClient from './client';

export const matchingApi = {
  // Eşleşme kuyruğuna katıl (body boş, sadece auth gerekli)
  joinQueue: async () => {
    const response = await apiClient.post('/matching/join-queue');
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

export const shuffleApi = {
  // Shuffle (buluşma) oluştur
  create: async (data) => {
    const response = await apiClient.post('/shuffles', data);
    return response.data;
  },

  // Feed - yakındaki buluşmaları getir
  getFeed: async (params = {}) => {
    const response = await apiClient.get('/shuffles', { params });
    return response.data;
  },

  // Tek shuffle detayı
  getById: async (id) => {
    const response = await apiClient.get(`/shuffles/${id}`);
    return response.data;
  },

  // Shuffle'a katıl
  join: async (id) => {
    const response = await apiClient.post(`/shuffles/${id}/join`);
    return response.data;
  },

  // Shuffle'dan ayrıl
  leave: async (id) => {
    const response = await apiClient.post(`/shuffles/${id}/leave`);
    return response.data;
  },
};
