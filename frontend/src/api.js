import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000
});

export function getAdminApi() {
  const client = axios.create({ baseURL: api.defaults.baseURL, timeout: 10000 });
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('dateMeAdminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}

export default api;
