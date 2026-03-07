const STORAGE_KEY = "billing_fy";

export const getDefaultFinancialYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyStart = `${year}-04-01`;
  const fyEnd = `${year + 1}-03-31`;
  return { label: `${year}-${year + 1}`, fyStart, fyEnd };
};

export const getFinancialYear = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultFinancialYear();
    const parsed = JSON.parse(raw);
    if (!parsed?.fyStart || !parsed?.fyEnd) return getDefaultFinancialYear();
    return parsed;
  } catch {
    return getDefaultFinancialYear();
  }
};

export const setFinancialYear = (value) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("fy-changed", { detail: value }));
};

export const getFinancialYearParams = () => {
  const fy = getFinancialYear();
  return { fyStart: fy.fyStart, fyEnd: fy.fyEnd };
};

export const buildFinancialYearOptions = (count = 4) => {
  const now = new Date();
  const currentStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: count }, (_, idx) => {
    const year = currentStartYear - idx;
    return {
      label: `${year}-${year + 1}`,
      fyStart: `${year}-04-01`,
      fyEnd: `${year + 1}-03-31`,
    };
  });
};

