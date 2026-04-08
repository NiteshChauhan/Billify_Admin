import { ref } from "vue";
import http from "@/api/http";

const DEFAULT_CURRENCY = "Rs";
const DEFAULT_DECIMALS = 2;
const STORAGE_SYMBOL_KEY = "currencySymbol";
const STORAGE_DECIMALS_KEY = "currencyDecimals";

export const currencyConfig = {
  Rs: 2,
  $: 2,
  AED: 2,
  EUR: 2,
  KWD: 3,
  JOD: 3,
  OMR: 3,
};

const currencySymbol = ref(localStorage.getItem(STORAGE_SYMBOL_KEY) || DEFAULT_CURRENCY);
const currencyDecimals = ref(Number(localStorage.getItem(STORAGE_DECIMALS_KEY) || DEFAULT_DECIMALS));
let hasLoaded = false;
let loadingPromise = null;

const toNumber = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
};

const resolveCurrencyDecimals = (symbol, providedDecimals) => {
  if (providedDecimals !== undefined && providedDecimals !== null && providedDecimals !== "") {
    const parsed = Number(providedDecimals);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 6) {
      return parsed;
    }
  }
  return currencyConfig[String(symbol || DEFAULT_CURRENCY).trim()] ?? DEFAULT_DECIMALS;
};

const setCurrency = ({ symbol, decimals } = {}) => {
  const nextSymbol = String(symbol || currencySymbol.value || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY;
  const nextDecimals = resolveCurrencyDecimals(nextSymbol, decimals);
  currencySymbol.value = nextSymbol;
  currencyDecimals.value = nextDecimals;
  localStorage.setItem(STORAGE_SYMBOL_KEY, nextSymbol);
  localStorage.setItem(STORAGE_DECIMALS_KEY, String(nextDecimals));
};

const ensureCurrencyLoaded = async () => {
  if (hasLoaded) return;
  if (!loadingPromise) {
    loadingPromise = http
      .get("/settings/company")
      .then(({ data }) => {
        setCurrency({
          symbol: data?.currencySymbol || DEFAULT_CURRENCY,
          decimals: data?.currencyDecimals,
        });
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

  const roundCurrency = (value, decimals = currencyDecimals.value) => {
    const amount = toNumber(value);
    return Number(amount.toFixed(decimals));
  };

  const formatCurrency = (value, options = {}) => {
    const amount = toNumber(value);
    const decimals = options.decimals ?? currencyDecimals.value;
    return `${currencySymbol.value} ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  return {
    currencySymbol,
    currencyDecimals,
    currencyConfig,
    formatCurrency,
    roundCurrency,
    setCurrency,
    ensureCurrencyLoaded,
  };
};
