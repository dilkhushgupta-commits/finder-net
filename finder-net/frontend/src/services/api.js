import axios from 'axios';

// In production, use relative URL (served through nginx proxy)
// In development, Vite proxy handles /api -> backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const itemService = {
  getAllItems: (params) => api.get('/items', { params }),
  getItems: (params) => api.get('/items', { params }),
  getItemById: (id) => api.get(`/items/${id}`),
  createItem: (formData) => api.post('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateItem: (id, data) => api.put(`/items/${id}`, data),
  deleteItem: (id) => api.delete(`/items/${id}`),
  getMyItems: (params) => api.get('/items/user/my-items', { params }),
  getUserItems: () => api.get('/items/user/my-items'),
  markAsRecovered: (id, data) => api.put(`/items/${id}/recover`, data),
  getStats: () => api.get('/items/stats'),
};

export const matchService = {
  findMatches: (id, threshold) => api.post(`/match/${id}`, { threshold }),
  getMatches: (id) => api.get(`/match/${id}/matches`),
  getUserMatches: () => api.get('/match/user/matches'),
  reportMatch: (data) => api.post('/match/report', data),
  updateMatchStatus: (id, status) => api.put(`/match/${id}/status`, { status }),
};

export const chatService = {
  getChats: () => api.get('/chat'),
  getUserChats: () => api.get('/chat'),
  getChatById: (id) => api.get(`/chat/${id}`),
  getChatMessages: (id) => api.get(`/chat/${id}/messages`),
  createChat: (data) => api.post('/chat', data),
  getOrCreateChat: (userId, itemId) => api.post('/chat/get-or-create', { userId, itemId }),
  sendMessage: (id, data) => api.post(`/chat/${id}/message`, data),
  closeChat: (id) => api.put(`/chat/${id}/close`),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

export const userService = {
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/users/notifications/read-all'),
  getProfile: (id) => api.get(`/users/profile/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getPendingItems: () => api.get('/admin/items/pending'),
  approveItem: (id, data) => api.put(`/admin/items/${id}/approve`, data),
  rejectItem: (id, data) => api.put(`/admin/items/${id}/reject`, data),
  updateItemStatus: (id, status) => api.put(`/admin/items/${id}/status`, { status }),
  getAllItems: (params) => api.get('/admin/items', { params }),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
  deactivateUser: (id) => api.put(`/admin/users/${id}/deactivate`),
  activateUser: (id) => api.put(`/admin/users/${id}/activate`),
  deleteItem: (id) => api.delete(`/admin/items/${id}`),
};
