import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/',
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

axiosInstance.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized request - token may be expired');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
