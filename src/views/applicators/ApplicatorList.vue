<template>
  <div class="applicator-page">
    <div class="page-header">
      <div>
        <h2>Applicators</h2>
        <p>Manage applicators appointed by this company.</p>
      </div>
      <router-link class="primary-btn" to="/applicators/add" title="Add Applicator" aria-label="Add Applicator">
        <svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        Add Applicator
      </router-link>
    </div>

    <section class="filter-card" aria-label="Applicator filters">
      <div class="search-field">
        <svg class="search-icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
        <input v-model.trim="search" placeholder="Search name, mobile, city" @keyup.enter="load" />
      </div>
      <select v-model="status" aria-label="Status">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <button class="secondary-btn" type="button" @click="load">Apply</button>
      <button class="ghost-btn" type="button" @click="resetFilters">
        <svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 3v6h6" />
        </svg>
        Reset
      </button>
    </section>

    <section class="table-card">
      <div class="table-title">
        <div>
          <h3>Applicator Directory</h3>
          <p>{{ rows.length }} record{{ rows.length === 1 ? "" : "s" }} shown</p>
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>City</th>
              <th>Status</th>
              <th>Created</th>
              <th class="action-col">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row._id">
              <td>
                <div class="name-cell">
                  <span class="avatar">{{ initials(row.name) }}</span>
                  <strong>{{ row.name }}</strong>
                </div>
              </td>
              <td>{{ row.mobile || "-" }}</td>
              <td>{{ row.email || "-" }}</td>
              <td>{{ row.city || "-" }}</td>
              <td><span :class="['status-badge', row.status]">{{ row.status }}</span></td>
              <td>{{ row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "-" }}</td>
              <td class="actions">
                <ActionIconButton icon="view" :to="`/applicators/${row._id}/view`" title="View applicator" variant="view" />
                <ActionIconButton icon="edit" :to="`/applicators/${row._id}/edit`" title="Edit applicator" variant="edit" />
                <ActionIconButton
                  icon="power"
                  :title="row.status === 'active' ? 'Deactivate applicator' : 'Activate applicator'"
                  :variant="row.status === 'active' ? 'warning' : 'success'"
                  @click="toggle(row)"
                />
                <ActionIconButton icon="delete" title="Delete applicator" variant="danger" @click="remove(row)" />
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="7" class="empty">
                <div>
                  <strong>{{ loading ? "Loading applicators..." : "No applicators found" }}</strong>
                  <span v-if="!loading">Try a different search or add a new applicator.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import {
  deleteApplicatorApi,
  listApplicatorsApi,
  updateApplicatorStatusApi,
} from "@/api/applicatorApi";
import ActionIconButton from "@/components/common/ActionIconButton.vue";
import { notifyError, notifySuccess, parseApiError } from "@/utils/notifications";

const rows = ref([]);
const search = ref("");
const status = ref("active");
const loading = ref(false);

const load = async () => {
  loading.value = true;
  try {
    const res = await listApplicatorsApi({ search: search.value, status: status.value });
    rows.value = res.data?.data || [];
  } finally {
    loading.value = false;
  }
};

const resetFilters = async () => {
  search.value = "";
  status.value = "active";
  await load();
};

const initials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AP";
};

const toggle = async (row) => {
  const nextStatus = row.status === "active" ? "inactive" : "active";
  if (!window.confirm(`Are you sure you want to ${nextStatus === "inactive" ? "deactivate" : "activate"} this record?`)) return;
  try {
    await updateApplicatorStatusApi(row._id, { status: nextStatus });
    notifySuccess(`Applicator ${nextStatus === "active" ? "activated" : "deactivated"} successfully.`);
    await load();
  } catch (err) {
    notifyError(parseApiError(err));
  }
};

const remove = async (row) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  try {
    await deleteApplicatorApi(row._id);
    notifySuccess("Applicator deleted successfully.");
    await load();
  } catch (err) {
    notifyError(parseApiError(err));
  }
};

onMounted(load);
</script>

<style scoped>
.applicator-page {
  display: grid;
  gap: 18px;
}

.page-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.page-header h2,
.table-title h3 {
  color: #0f172a;
  margin: 0;
}

.page-header p,
.table-title p {
  color: #64748b;
  margin: 5px 0 0;
}

.primary-btn,
.secondary-btn,
.ghost-btn,
.action-btn {
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  font-weight: 700;
  gap: 7px;
  justify-content: center;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.primary-btn {
  background: #0f766e;
  border: 1px solid #0f766e;
  color: #fff;
  min-height: 40px;
  padding: 0 14px;
}

.primary-btn:hover {
  background: #115e59;
}

.primary-btn svg,
.ghost-btn svg {
  height: 16px;
  width: 16px;
}

.filter-card,
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.filter-card {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(240px, 1fr) 180px auto auto;
  padding: 14px;
}

.search-field {
  position: relative;
}

.search-icon {
  color: #64748b;
  height: 16px;
  left: 12px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
}

input,
select {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  min-height: 40px;
  outline: none;
  padding: 9px 11px;
  width: 100%;
}

.search-field input {
  padding-left: 38px;
}

input:focus,
select:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.secondary-btn {
  background: #0f172a;
  border: 1px solid #0f172a;
  color: #fff;
  min-height: 40px;
  padding: 0 14px;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #334155;
  min-height: 40px;
  padding: 0 14px;
}

.table-card {
  overflow: hidden;
}

.table-title {
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  padding: 16px;
}

.table-scroll {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 900px;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 13px 14px;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

tbody tr:hover {
  background: #f8fafc;
}

.name-cell {
  align-items: center;
  display: flex;
  gap: 10px;
}

.avatar {
  align-items: center;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  border-radius: 999px;
  color: #075985;
  display: inline-flex;
  flex: 0 0 34px;
  font-size: 12px;
  font-weight: 800;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.status-badge {
  border-radius: 999px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  padding: 5px 10px;
  text-transform: capitalize;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.action-col {
  text-align: right;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: flex-end;
}

.empty {
  color: #64748b;
  padding: 34px 14px;
  text-align: center;
}

.empty div {
  display: grid;
  gap: 5px;
}

.empty strong {
  color: #334155;
}

@media (max-width: 820px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-btn {
    width: fit-content;
  }

  .filter-card {
    grid-template-columns: 1fr;
  }
}
</style>
