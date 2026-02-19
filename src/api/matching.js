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

  // Sohbetlerim - Aktif chat'ler (status: active/completed)
  getMyChats: async (params = {}) => {
    const response = await apiClient.get('/shuffles/my/chats', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params,
      }
    });
    return response.data;
  },

  // Katıldıklarım - Başkasının oluşturduğu shuffle'lar
  getJoinedShuffles: async (params = {}) => {
    const response = await apiClient.get('/shuffles/my/joined', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params,
      }
    });
    return response.data;
  },

  // Oluşturduklarım - Benim oluşturduğum shuffle'lar
  getCreatedShuffles: async (params = {}) => {
    const response = await apiClient.get('/shuffles/my/created', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params,
      }
    });
    return response.data;
  },

  // Tek shuffle detayı
  getById: async (id) => {
    const response = await apiClient.get(`/shuffles/${id}`);
    return response.data;
  },

  // Shuffle güncelle
  update: async (id, data) => {
    const response = await apiClient.put(`/shuffles/${id}`, data);
    return response.data;
  },

  // Shuffle sil
  delete: async (id) => {
    const response = await apiClient.delete(`/shuffles/${id}`);
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

  // Chat mesajlarını getir
  getMessages: async (shuffleId, params = {}) => {
    const response = await apiClient.get(`/shuffles/${shuffleId}/chat/messages`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
        ...params,
      },
    });
    return response.data;
  },

  // Chat mesajı gönder
  sendMessage: async (shuffleId, data) => {
    const response = await apiClient.post(`/shuffles/${shuffleId}/chat/messages`, data);
    return response.data;
  },

  // Chat katılımcılarını getir
  getParticipants: async (shuffleId) => {
    const response = await apiClient.get(`/shuffles/${shuffleId}/participants`);
    return response.data;
  },
};
