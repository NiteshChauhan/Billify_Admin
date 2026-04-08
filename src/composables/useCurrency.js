import { ref } from "vue";
import http from "@/api/http";

const DEFAULT_CURRENCY = "Rs";
const STORAGE_KEY = "currencySymbol";

const currencySymbol = ref(localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY);
let hasLoaded = false;
let loadingPromise = null;

const toNumber = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
};

const setCurrencySymbol = (value) => {
  const nextValue = String(value || "").trim() || DEFAULT_CURRENCY;
  currencySymbol.value = nextValue;
  localStorage.setItem(STORAGE_KEY, nextValue);
};

const ensureCurrencyLoaded = async () => {
  if (hasLoaded) return;
  if (!loadingPromise) {
    loadingPromise = http
      .get("/settings/company")
      .then(({ data }) => {
        setCurrencySymbol(data?.currencySymbol || DEFAULT_CURRENCY);
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

export const useCurrency = () => {
  ensureCurrencyLoaded();

  const formatCurrency = (value, options = {}) => {
    const amount = toNumber(value);
    const minimumFractionDigits = options.minimumFractionDigits ?? 2;
    const maximumFractionDigits = options.maximumFractionDigits ?? 2;
    return `${currencySymbol.value} ${amount.toLocaleString("en-IN", {
      minimumFractionDigits,
      maximumFractionDigits,
    })}`;
  };

  return {
    currencySymbol,
    formatCurrency,
    setCurrencySymbol,
    ensureCurrencyLoaded,
  };
};
