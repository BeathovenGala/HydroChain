import axios from "axios";

// Defaults go through the Vite dev proxy (see vite.config.js), so no .env is needed for local runs.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const NPOINT_URL = import.meta.env.VITE_NPOINT_URL || `${API_BASE_URL}/iot/index`;

// sessionStorage is per tab, so Plant, Industry and Auditor can be logged in side by side.
const TOKEN_KEY = "hc_token";
export const setAuthToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);

export const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const errorMessage = (err) => err?.response?.data?.error || err?.message || "Something went wrong";
