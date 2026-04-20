const STORAGE_KEY = "pdfLanguage";

export const pdfLanguageOptions = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
];

export const getPdfLanguage = () => localStorage.getItem(STORAGE_KEY) || "en";

export const setPdfLanguage = (value) => {
  localStorage.setItem(STORAGE_KEY, value || "en");
};

export const syncPdfLanguageFromCompany = (company) => {
  const next = company?.pdfLanguage || "en";
  setPdfLanguage(next);
  return next;
};
