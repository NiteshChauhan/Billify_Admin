import http from "./http";

export const createSalesApi = (data) =>
  http.post("/sales", data);

export const getSalesByIdApi = (id) =>
  http.get(`/sales/${id}`);

export const updateSalesApi = (id, data) =>
  http.put(`/sales/${id}`, data);