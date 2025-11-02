import axios from 'axios';

const baseURL = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
const defaultApiKey = import.meta.env?.VITE_API_KEY || 'dev-test-key-12345';
const API_KEY_STORAGE_KEY = 'ad-gen-api-key';

const resolveApiKey = () => {
  if (typeof window === 'undefined') {
    return defaultApiKey;
  }

  const stored = window.localStorage.getItem(API_KEY_STORAGE_KEY);
  return stored || defaultApiKey;
};

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const apiKey = resolveApiKey();
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

export const analyzeBrand = async (brandUrl) => {
  const response = await api.post('/v1/brand-summary', {
    brand_url: brandUrl,
  });
  return response.data;
};

export default api;
