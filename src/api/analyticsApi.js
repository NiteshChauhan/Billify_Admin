import http from "./http";

export const getInvoiceAnalyticsApi = (params = {}) =>
  http.get("/admin/analytics/invoices", { params });
