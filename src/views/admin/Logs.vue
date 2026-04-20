<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>Action Logs</h2>
        <p>Track important account and system actions.</p>
      </div>
    </div>

    <div class="filters">
      <label>From Date <input v-model="fromDate" type="date" /></label>
      <label>To Date <input v-model="toDate" type="date" /></label>
      <label>Module
        <select v-model="moduleFilter">
          <option value="">All</option>
          <option value="auth">Auth</option>
          <option value="backup">Backup</option>
        </select>
      </label>
      <label>Action
        <select v-model="actionFilter">
          <option value="">All</option>
          <option value="REGISTER">Register</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="CHANGE_PASSWORD">Change Password</option>
          <option value="BACKUP_EXPORT">Backup Export</option>
          <option value="BACKUP_RESTORE">Backup Restore</option>
        </select>
      </label>
      <button class="btn-light" @click="load">Apply</button>
    </div>

    <Loader v-if="loading" />

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Module</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="5" class="empty">No logs found</td>
          </tr>
          <tr v-for="row in rows" :key="row._id">
            <td>{{ formatDate(row.createdAt) }}</td>
            <td>{{ row.userId?.name || row.userId?.email || "-" }}</td>
            <td>{{ row.actionType }}</td>
            <td class="caps">{{ row.module }}</td>
            <td>{{ row.description || formatDetails(row.details) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import http from "@/api/http";
import Loader from "@/components/Loader.vue";

const today = new Date().toISOString().slice(0, 10);
const rows = ref([]);
const loading = ref(false);
const fromDate = ref(today);
const toDate = ref(today);
const moduleFilter = ref("");
const actionFilter = ref("");

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

const formatDetails = (details) => {
  if (!details) return "-";
  if (typeof details === "string") return details;
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
};

const load = async () => {
  loading.value = true;
  const params = {};
  if (fromDate.value) params.from = fromDate.value;
  if (toDate.value) params.to = toDate.value;
  if (moduleFilter.value) params.module = moduleFilter.value;
  if (actionFilter.value) params.actionType = actionFilter.value;
  const { data } = await http.get("/logs", { params });
  rows.value = data || [];
  loading.value = false;
};

onMounted(load);
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
.head p { margin: 0; color: #64748b; }
.filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; align-items: end; }
.filters label { display: grid; gap: 6px; font-size: 13px; }
input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
.btn-light { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 9px 12px; }
.table-wrap { overflow: auto; }
table { width: 100%; min-width: 880px; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: top; }
.caps { text-transform: capitalize; }
.empty { text-align: center; color: #64748b; }
</style>
