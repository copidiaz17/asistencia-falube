// src/config/axios.Config.js
import axios from "axios";

const RAW = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";
const API_BASE_URL = RAW
  ? (RAW.endsWith("/api") ? RAW : RAW.replace(/\/+$/, "") + "/api")
  : "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error(
      "[AXIOS] ERROR",
      error?.response?.status,
      error?.config?.url,
      error?.response?.data || error?.message
    );
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
