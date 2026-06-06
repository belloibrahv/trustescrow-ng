import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const adminApi = {
  // Metrics
  getMetrics: () => api.get('/api/admin/metrics'),
  
  // Analytics
  getWeeklyAnalytics: () => api.get('/api/admin/analytics/weekly'),
  getStatusDistribution: () => api.get('/api/admin/analytics/status-distribution'),
  getRecentActivity: () => api.get('/api/admin/analytics/recent-activity'),

  // Deals
  getDeals: (params?: { page?: number; status?: string; limit?: number }) =>
    api.get('/api/admin/deals', { params }),
  
  getDeal: (id: string) => api.get(`/api/admin/deals/${id}`),

  // Disputes
  resolveDispute: (id: string, data: { decision: 'buyer' | 'seller'; resolution: string }) =>
    api.post(`/api/admin/disputes/${id}/resolve`, data),

  // Users
  getUser: (phone: string) => api.get(`/api/admin/users/${phone}`),
};
