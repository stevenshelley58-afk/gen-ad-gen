import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'dev-test-key-12345'
  }
});

export const analyzeBrand = async (brandUrl) => {
  const response = await api.post('/v1/brand-summary', {
    brand_url: brandUrl
  });
  return response.data;
};

export default api;
