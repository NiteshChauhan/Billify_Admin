<template>
  <div class="card">
    <h2>Applicator Assignments</h2>
    <form class="grid" @submit.prevent="save">
      <label>Party *
        <select v-model="form.partyId" required @change="loadSites">
          <option value="">Select Party</option>
          <option v-for="party in parties" :key="party._id" :value="party._id">{{ party.name }}</option>
        </select>
      </label>
      <label>Site *
        <select v-model="form.siteId" required>
          <option value="">Select Site</option>
          <option v-for="site in sites" :key="site._id" :value="site._id">{{ site.name }}</option>
        </select>
      </label>
      <label>Quick Add Site
        <div class="inline">
          <input v-model.trim="newSiteName" placeholder="Site name" />
          <button type="button" class="btn-light" @click="addSite">Add</button>
        </div>
      </label>
      <label>Applicator *
        <select v-model="form.applicatorId" required>
          <option value="">Select Applicator</option>
          <option v-for="applicator in applicators" :key="applicator._id" :value="applicator._id">{{ applicator.name }}</option>
        </select>
      </label>
      <label>Start Date<input v-model="form.startDate" type="date" /></label>
      <label>End Date<input v-model="form.endDate" type="date" /></label>
      <label>Status
        <select v-model="form.status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <label class="full">Notes<textarea v-model.trim="form.notes" /></label>
      <div class="actions full"><button class="btn">Assign Applicator</button></div>
    </form>

    <table>
      <thead><tr><th>Party</th><th>Site</th><th>Applicator</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row._id">
          <td>{{ row.partyId?.name || "-" }}</td>
          <td>{{ row.siteId?.name || "-" }}</td>
          <td>{{ row.applicatorId?.name || "-" }}</td>
          <td>{{ row.status }}</td>
          <td class="actions">
            <button @click="toggle(row)">{{ row.status === "active" ? "Deactivate" : "Activate" }}</button>
            <button @click="remove(row)">Remove</button>
          </td>
        </tr>
        <tr v-if="!rows.length"><td colspan="5" class="empty">No assignments found</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { getUsersApi } from "@/api/userApi";
import { hasUserRole } from "@/utils/userRole";
import {
  createAssignmentApi,
  createSiteApi,
  deleteAssignmentApi,
  listApplicatorsApi,
  listAssignmentsApi,
  listSitesApi,
  updateAssignmentStatusApi,
} from "@/api/applicatorApi";

const parties = ref([]);
const sites = ref([]);
const applicators = ref([]);
const rows = ref([]);
const newSiteName = ref("");
const form = reactive({
  partyId: "",
  siteId: "",
  applicatorId: "",
  startDate: "",
  endDate: "",
  status: "active",
  notes: "",
});

const loadSites = async () => {
  form.siteId = "";
  if (!form.partyId) {
    sites.value = [];
    return;
  }
  sites.value = (await listSitesApi({ partyId: form.partyId })).data || [];
};

const addSite = async () => {
  if (!form.partyId || !newSiteName.value) return;
  const res = await createSiteApi({ partyId: form.partyId, name: newSiteName.value });
  newSiteName.value = "";
  await loadSites();
  form.siteId = res.data?._id || "";
};

const load = async () => {
  const [partyRes, appRes, assignmentRes] = await Promise.all([
    getUsersApi(),
    listApplicatorsApi({ status: "active", limit: 100 }),
    listAssignmentsApi({ limit: 100 }),
  ]);
  parties.value = (partyRes.data || []).filter((party) => hasUserRole(party, "customer"));
  applicators.value = appRes.data?.data || [];
  rows.value = assignmentRes.data?.data || [];
};

const save = async () => {
  await createAssignmentApi({ ...form });
  form.siteId = "";
  form.applicatorId = "";
  form.notes = "";
  await load();
};

const toggle = async (row) => {
  await updateAssignmentStatusApi(row._id, { status: row.status === "active" ? "inactive" : "active" });
  await load();
};

const remove = async (row) => {
  if (!window.confirm("Remove this assignment?")) return;
  await deleteAssignmentApi(row._id);
  await load();
};

onMounted(load);
</script>

<style scoped>
.card { background:#fff; border-radius:12px; padding:18px; }
.grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:18px; }
label { display:grid; gap:6px; font-weight:600; }
input, select, textarea { border:1px solid #cbd5e1; border-radius:8px; padding:8px; }
textarea { min-height:70px; }
.full { grid-column:1 / -1; }
.inline { display:flex; gap:8px; }
.btn { background:#0ea5e9; color:#fff; border:none; border-radius:8px; padding:10px 12px; }
.btn-light { border:1px solid #cbd5e1; background:#fff; border-radius:8px; padding:8px 12px; }
table { width:100%; border-collapse:collapse; }
th, td { border-bottom:1px solid #e5e7eb; padding:10px; text-align:left; }
.actions { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
.actions button { border:none; background:none; color:#2563eb; cursor:pointer; }
.empty { text-align:center; color:#64748b; }
@media (max-width:900px){ .grid{grid-template-columns:1fr;} }
</style>
