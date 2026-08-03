const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

export const normalizePhoneNumber = (phone, defaultCountryCode = "91") => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = `${defaultCountryCode}${digits.slice(1)}`;
  if (digits.length === 10) digits = `${defaultCountryCode}${digits}`;

  if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) return "";
  return digits;
};

export const getWhatsAppUrl = (phone, message = "") => {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return "";
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${text}`;
};

export const openWhatsApp = (phone, message = "") => {
  const url = getWhatsAppUrl(phone, message);
  if (!url) throw new Error("Valid mobile number is not available");
  window.open(url, "_blank", "noopener,noreferrer");
};

export const startPhoneCall = (phone) => {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) throw new Error("Valid mobile number is not available");
  window.location.href = `tel:+${normalized}`;
};
