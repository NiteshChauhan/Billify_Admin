import http from "./http";

export const getUsersApi = (params = {}) => http.get("/users", { params });
export const getUserByIdApi = (id) => http.get(`/users/${id}`);
export const createUserApi = (data) => http.post("/users", data);
export const updateUserApi = (id, data) => http.put(`/users/${id}`, data);
export const deleteUserApi = (id) => http.delete(`/users/${id}`);

