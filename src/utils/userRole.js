const toRoleList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v).toLowerCase());
  if (typeof value === "string") return [value.toLowerCase()];
  return [];
};

export const getUserRoles = (user) => {
  const roleValues = [
    ...toRoleList(user?.roles),
    ...toRoleList(user?.role),
    ...toRoleList(user?.type),
  ];
  return [...new Set(roleValues)];
};

export const hasUserRole = (user, expectedRole) => {
  const role = String(expectedRole || "").toLowerCase();
  const roles = getUserRoles(user);
  if (role === "customer") {
    return roles.includes("customer") || roles.includes("vendor");
  }
  if (role === "vendor") {
    return roles.includes("vendor") || roles.includes("customer");
  }
  return roles.includes(role);
};
