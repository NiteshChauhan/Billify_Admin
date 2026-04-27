import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { notifyError, parseApiError } from "@/utils/notifications";

const http = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://node-backend-gules-two.vercel.app/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
http.interceptors.request.use(
  (config) => {
    const auth = useAuthStore();

    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }

    if (auth.selectedBranchId) {
      config.headers["X-Branch-Id"] = auth.selectedBranchId;
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

    if (!error.config?.skipNotify) {
      notifyError(parseApiError(error));
    }

    return Promise.reject(error);
  },
);

export default http;
