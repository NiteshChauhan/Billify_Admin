import http from "./http";

export const listApplicatorsApi = (params = {}) => http.get("/admin/applicators", { params });
export const createApplicatorApi = (data) => http.post("/admin/applicators", data);
export const getApplicatorApi = (id) => http.get(`/admin/applicators/${id}`);
export const updateApplicatorApi = (id, data) => http.put(`/admin/applicators/${id}`, data);
export const updateApplicatorStatusApi = (id, data) => http.patch(`/admin/applicators/${id}/status`, data);
export const deleteApplicatorApi = (id) => http.delete(`/admin/applicators/${id}`);

export const listUnitsApi = (params = {}) => http.get("/admin/units", { params });
export const createUnitApi = (data) => http.post("/admin/units", data);

export const listSitesApi = (params = {}) => http.get("/admin/sites", { params });
export const createSiteApi = (data) => http.post("/admin/sites", data);

export const listAssignmentsApi = (params = {}) =>
  http.get("/admin/party-site-applicators", { params });
export const createAssignmentApi = (data) => http.post("/admin/party-site-applicators", data);
export const updateAssignmentStatusApi = (id, data) =>
  http.patch(`/admin/party-site-applicators/${id}/status`, data);
export const deleteAssignmentApi = (id) => http.delete(`/admin/party-site-applicators/${id}`);
export const listAssignedApplicatorsBySiteApi = (params = {}) =>
  http.get("/admin/party-site-applicators/by-site", { params });

export const downloadAdminBlob = async (url, filename, params = {}) => {
  const res = await http.get(url, { params, responseType: "blob" });
  const blobUrl = URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
};
