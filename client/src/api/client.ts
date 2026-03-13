import axios, { type AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

const axiosFileInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true,
});

axiosFileInstance.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<T, T>(url, config),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.post<T, T>(url, data, config),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.put<T, T>(url, data, config),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T, T>(url, data, config),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<T, T>(url, config),
};

export const fileApiClient = {
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    axiosFileInstance.post<T, T>(url, data, config),
};