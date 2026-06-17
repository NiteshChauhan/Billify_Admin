<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>Applicators</h2>
        <p>Manage applicators appointed by this company.</p>
      </div>
      <router-link class="btn" to="/applicators/add">Add Applicator</router-link>
    </div>

    <div class="filters">
      <input v-model.trim="search" placeholder="Search name, mobile, city" @keyup.enter="load" />
      <select v-model="status" @change="load">
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <button class="btn-light" @click="load">Apply</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Mobile</th>
          <th>Email</th>
          <th>City</th>
          <th>Status</th>
          <th>Created</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row._id">
          <td>{{ row.name }}</td>
          <td>{{ row.mobile || "-" }}</td>
          <td>{{ row.email || "-" }}</td>
          <td>{{ row.city || "-" }}</td>
          <td><span :class="['pill', row.status]">{{ row.status }}</span></td>
          <td>{{ row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "-" }}</td>
          <td class="actions">
            <router-link :to="`/applicators/${row._id}/view`">View</router-link>
            <router-link :to="`/applicators/${row._id}/edit`">Edit</router-link>
            <button @click="toggle(row)">{{ row.status === "active" ? "Deactivate" : "Activate" }}</button>
            <button @click="remove(row)">Delete</button>
          </td>
        </tr>
        <tr v-if="!rows.length"><td colspan="7" class="empty">No applicators found</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import {
  deleteApplicatorApi,
  listApplicatorsApi,
  updateApplicatorStatusApi,
} from "@/api/applicatorApi";

const rows = ref([]);
const search = ref("");
const status = ref("active");

const load = async () => {
  const res = await listApplicatorsApi({ search: search.value, status: status.value });
  rows.value = res.data?.data || [];
};

const toggle = async (row) => {
  await updateApplicatorStatusApi(row._id, { status: row.status === "active" ? "inactive" : "active" });
  await load();
};

const remove = async (row) => {
  if (!window.confirm(`Delete applicator "${row.name}"?`)) return;
  await deleteApplicatorApi(row._id);
  await load();
};

onMounted(load);
</script>

<style scoped>
.card { background:#fff; border-radius:12px; padding:18px; }
.head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:12px; }
.head p { margin:4px 0 0; color:#64748b; }
.filters { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
input, select { border:1px solid #cbd5e1; border-radius:8px; padding:8px; }
table { width:100%; border-collapse:collapse; }
th, td { border-bottom:1px solid #e5e7eb; padding:10px; text-align:left; }
.btn { background:#0ea5e9; color:#fff; text-decoration:none; border-radius:8px; padding:10px 12px; }
.btn-light { border:1px solid #cbd5e1; background:#fff; border-radius:8px; padding:8px 12px; }
.actions { display:flex; gap:8px; flex-wrap:wrap; }
.actions button { border:none; background:none; color:#2563eb; cursor:pointer; }
.pill { border-radius:999px; padding:4px 9px; text-transform:capitalize; }
.active { background:#dcfce7; color:#166534; }
.inactive { background:#fee2e2; color:#991b1b; }
.empty { text-align:center; color:#64748b; }
</style>
