import { defineStore } from "pinia";
import { ref } from "vue";

const buildId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useNotificationStore = defineStore("notification", () => {
  const items = ref([]);

  const push = (payload = {}) => {
    const item = {
      id: buildId(),
      type: payload.type || "info",
      title: payload.title || "",
      message: payload.message || "",
      timeout: typeof payload.timeout === "number" ? payload.timeout : 3200,
    };
    items.value = [...items.value, item];
    return item.id;
  };

  const remove = (id) => {
    items.value = items.value.filter((item) => item.id !== id);
  };

  return {
    items,
    push,
    remove,
  };
});
