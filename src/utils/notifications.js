import { useNotificationStore } from "@/stores/notificationStore";

export const notify = (type, message, options = {}) => {
  const store = useNotificationStore();
  store.push({
    type,
    message,
    title: options.title,
    timeout: options.timeout,
  });
};

export const notifySuccess = (message, options = {}) =>
  notify("success", message, options);
export const notifyError = (message, options = {}) =>
  notify("error", message, options);
export const notifyWarning = (message, options = {}) =>
  notify("warning", message, options);
export const notifyInfo = (message, options = {}) =>
  notify("info", message, options);

export const parseApiError = (error) => {
  const data = error?.response?.data || {};
  if (data?.error === "Insufficient stock") {
    const name = data.productName || "Product";
    const available = Number(data.availableStock ?? 0);
    return `Insufficient stock for ${name}. Available stock: ${available}.`;
  }
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (error?.message) return error.message;
  return "Something went wrong. Please try again.";
};
