import http from "./http";

export const createPurchaseApi = (data) =>
  http.post("/purchase", data);

export const getPurchaseByIdApi = (id) =>
  http.get(`/purchase/${id}`);

export const updatePurchaseApi = (id, data) =>
  http.put(`/purchase/${id}`, data);