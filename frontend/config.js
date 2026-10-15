import axios from "axios";

// Defaults go through the Vite dev proxy (see vite.config.js), so no .env is needed for local runs.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const NPOINT_URL = import.meta.env.VITE_NPOINT_URL || `${API_BASE_URL}/iot/index`;

export const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

export const errorMessage = (err) => err?.response?.data?.error || err?.message || "Something went wrong";
