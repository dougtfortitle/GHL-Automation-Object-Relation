import axios from 'axios';
import Bottleneck from 'bottleneck';
import { env } from './env.js';

// GHL rate limit: 100 requests per 10 seconds
const limiter = new Bottleneck({
  reservoir: 100,
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 10 * 1000,
  maxConcurrent: 10,
});

const axiosInstance = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    Authorization: `Bearer ${env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
    Version: '2023-02-21',
  },
  timeout: 15000,
});

// Wrap every axios method through bottleneck
const ghlClient = {
  get: (url, config) => limiter.schedule(() => axiosInstance.get(url, config)),
  post: (url, data, config) => limiter.schedule(() => axiosInstance.post(url, data, config)),
  put: (url, data, config) => limiter.schedule(() => axiosInstance.put(url, data, config)),
  delete: (url, config) => limiter.schedule(() => axiosInstance.delete(url, config)),
};

export default ghlClient;
