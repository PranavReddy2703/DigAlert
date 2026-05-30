import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into request headers if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: async (username, password) => {
    // FastAPI expects OAuth2 Form Data for token logins
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const permitsAPI = {
  list: async (filters = {}) => {
    const params = {};
    if (filters.status) params.status_filter = filters.status;
    if (filters.agency) params.agency_filter = filters.agency;
    const response = await api.get('/api/permits', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/api/permits/${id}`);
    return response.data;
  },
  create: async (permitData) => {
    const response = await api.post('/api/permits', permitData);
    return response.data;
  },
  precheck: async (precheckData) => {
    const response = await api.post('/api/permits/precheck', precheckData);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/permits/${id}/status`, { status });
    return response.data;
  },
  resolveClash: async (id) => {
    const response = await api.post(`/api/permits/${id}/resolve-clash`);
    return response.data;
  },
};

export const complaintsAPI = {
  list: async (filters = {}) => {
    const params = {};
    if (filters.status) params.status_filter = filters.status;
    if (filters.agency) params.agency_filter = filters.agency;
    const response = await api.get('/api/complaints', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/api/complaints/${id}`);
    return response.data;
  },
  create: async (complaintData) => {
    const response = await api.post('/api/complaints', complaintData);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.patch(`/api/complaints/${id}`, data);
    return response.data;
  },
};

export const analyticsAPI = {
  getSummary: async () => {
    const response = await api.get('/api/analytics/summary');
    return response.data;
  },
  getLeaderboard: async () => {
    const response = await api.get('/api/analytics/leaderboard');
    return response.data;
  },
};

export default api;
