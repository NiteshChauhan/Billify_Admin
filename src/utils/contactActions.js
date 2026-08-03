export const normalizePhoneNumber = (phone, defaultCountryCode = "91") => {
  const raw = String(phone || "").trim();
  if (!raw) return { digits: "", tel: "" };

  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10 && defaultCountryCode) digits = `${defaultCountryCode}${digits}`;

  return { digits, tel: `+${digits}` };
};

export const getWhatsAppUrl = (phone, message = "") => {
  const { digits } = normalizePhoneNumber(phone);
  if (!digits) return "";
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
};

export const openWhatsApp = (phone, message = "") => {
  const url = getWhatsAppUrl(phone, message);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
};

export const startPhoneCall = (phone) => {
  const { tel } = normalizePhoneNumber(phone);
  if (!tel) return false;
  window.location.href = `tel:${tel}`;
  return true;
};
