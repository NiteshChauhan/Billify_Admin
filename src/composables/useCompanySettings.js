import { ref } from "vue";
import http from "@/api/http";

const STORAGE_GST_KEY = "gstEnabled";

const gstEnabled = ref(localStorage.getItem(STORAGE_GST_KEY) !== "false");
let hasLoaded = false;
let loadingPromise = null;

const setGstEnabled = (value) => {
  gstEnabled.value = value !== false;
  localStorage.setItem(STORAGE_GST_KEY, String(gstEnabled.value));
};

const applyCompanySettings = (settings = {}) => {
  setGstEnabled(settings.gstEnabled !== false);
};

const ensureCompanySettingsLoaded = async () => {
  if (hasLoaded) return;
  if (!loadingPromise) {
    loadingPromise = http
      .get("/settings/company")
      .then(({ data }) => {
        applyCompanySettings(data);
        hasLoaded = true;
      })
      .catch(() => {
        hasLoaded = true;
      })
      .finally(() => {
        loadingPromise = null;
      });
  }
  await loadingPromise;
};

export const useCompanySettings = () => {
  ensureCompanySettingsLoaded();

  return {
    gstEnabled,
    setGstEnabled,
    applyCompanySettings,
    ensureCompanySettingsLoaded,
  };
};
