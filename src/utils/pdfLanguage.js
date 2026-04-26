const STORAGE_KEY = "pdfLanguage";

export const pdfLanguageOptions = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "en_ar", label: "English + Arabic" },
  { value: "en_hi", label: "English + Hindi" },
];

const normalizePdfLanguage = (value) => {
  const next = String(value || "").toLowerCase();
  if (["en", "ar", "hi", "en_ar", "en_hi"].includes(next)) {
    return next;
  }
  return "en";
};

export const getPdfLanguage = () => normalizePdfLanguage(localStorage.getItem(STORAGE_KEY));

export const setPdfLanguage = (value) => {
  localStorage.setItem(STORAGE_KEY, normalizePdfLanguage(value));
};

export const syncPdfLanguageFromCompany = (company) => {
  const next = company?.pdfLanguage || "en";
  setPdfLanguage(next);
  return next;
};
