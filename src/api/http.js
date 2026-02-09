import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const http = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://node-backend-gules-two.vercel.app/api",

  headers: {
    "Content-Type": "application/json",
  },

  withCredentials: true, // 🔥 IMPORTANT for Vercel + CORS
});

/* ================= REQUEST INTERCEPTOR ================= */
http.interceptors.request.use(
  (config) => {
    const auth = useAuthStore();

    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* ================= RESPONSE INTERCEPTOR ================= */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: handle token expiry globally
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.logout?.();
    }

    return Promise.reject(error);
  },
);

export default http;
