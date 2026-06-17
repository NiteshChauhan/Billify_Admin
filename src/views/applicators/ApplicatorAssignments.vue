<template>
  <div class="assignment-page">
    <div class="page-header">
      <div>
        <h2>Applicator Assignments</h2>
        <p>Assign active applicators to customer party sites and manage assignment status.</p>
      </div>
    </div>

    <section class="form-card">
      <div class="card-head">
        <h3>New Assignment</h3>
        <p>Select a party, site, and applicator to create an assignment.</p>
      </div>

      <form class="grid" @submit.prevent="save">
        <label>
          <span>Party <b>*</b></span>
          <select v-model="form.partyId" required @change="loadSites">
            <option value="">Select Party</option>
            <option v-for="party in parties" :key="party._id" :value="party._id">{{ party.name }}</option>
          </select>
        </label>
        <label>
          <span>Site <b>*</b></span>
          <select v-model="form.siteId" required>
            <option value="">Select Site</option>
            <option v-for="site in sites" :key="site._id" :value="site._id">{{ site.name }}</option>
          </select>
        </label>
        <label>
          <span>Quick Add Site</span>
          <div class="inline">
            <input v-model.trim="newSiteName" placeholder="Site name" />
            <button type="button" class="secondary-btn" @click="addSite">Add</button>
          </div>
        </label>
        <label>
          <span>Applicator <b>*</b></span>
          <select v-model="form.applicatorId" required>
            <option value="">Select Applicator</option>
            <option v-for="applicator in applicators" :key="applicator._id" :value="applicator._id">{{ applicator.name }}</option>
          </select>
        </label>
        <label>
          <span>Start Date</span>
          <input v-model="form.startDate" type="date" />
        </label>
        <label>
          <span>End Date</span>
          <input v-model="form.endDate" type="date" />
        </label>
        <label>
          <span>Status</span>
          <select v-model="form.status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label class="full">
          <span>Notes</span>
          <textarea v-model.trim="form.notes" />
        </label>
        <div class="actions full">
          <button class="primary-btn" :disabled="saving" type="submit">{{ saving ? "Assigning..." : "Assign Applicator" }}</button>
        </div>
      </form>
    </section>

    <section class="table-card">
      <div class="table-title">
        <div>
          <h3>Current Assignments</h3>
          <p>{{ rows.length }} assignment{{ rows.length === 1 ? "" : "s" }} shown</p>
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Party</th>
              <th>Site</th>
              <th>Applicator</th>
              <th>Status</th>
              <th class="action-col">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row._id">
              <td>{{ row.partyId?.name || "-" }}</td>
              <td>{{ row.siteId?.name || "-" }}</td>
              <td>{{ row.applicatorId?.name || "-" }}</td>
              <td><span :class="['status-badge', row.status]">{{ row.status }}</span></td>
              <td class="row-actions">
                <ActionIconButton
                  icon="power"
                  :title="row.status === 'active' ? 'Deactivate assignment' : 'Activate assignment'"
                  :variant="row.status === 'active' ? 'warning' : 'success'"
                  @click="toggle(row)"
                />
                <ActionIconButton icon="delete" title="Remove assignment" variant="danger" @click="remove(row)" />
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="empty">No assignments found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
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
import ActionIconButton from "@/components/common/ActionIconButton.vue";
import { notifyError, notifySuccess, parseApiError } from "@/utils/notifications";

const parties = ref([]);
const sites = ref([]);
const applicators = ref([]);
const rows = ref([]);
const newSiteName = ref("");
const saving = ref(false);
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
  saving.value = true;
  try {
    await createAssignmentApi({ ...form });
    notifySuccess("Assignment created successfully.");
    form.siteId = "";
    form.applicatorId = "";
    form.notes = "";
    await load();
  } catch (err) {
    notifyError(parseApiError(err));
  } finally {
    saving.value = false;
  }
};

const toggle = async (row) => {
  const nextStatus = row.status === "active" ? "inactive" : "active";
  if (!window.confirm(`Are you sure you want to ${nextStatus === "inactive" ? "deactivate" : "activate"} this record?`)) return;
  try {
    await updateAssignmentStatusApi(row._id, { status: nextStatus });
    notifySuccess(`Assignment ${nextStatus === "active" ? "activated" : "deactivated"} successfully.`);
    await load();
  } catch (err) {
    notifyError(parseApiError(err));
  }
};

const remove = async (row) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  try {
    await deleteAssignmentApi(row._id);
    notifySuccess("Assignment removed successfully.");
    await load();
  } catch (err) {
    notifyError(parseApiError(err));
  }
};

onMounted(load);
</script>

<style scoped>
.assignment-page {
  display: grid;
  gap: 18px;
}

.page-header h2,
.card-head h3,
.table-title h3 {
  color: #0f172a;
  margin: 0;
}

.page-header p,
.card-head p,
.table-title p {
  color: #64748b;
  margin: 5px 0 0;
}

.form-card,
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.card-head,
.table-title {
  border-bottom: 1px solid #e2e8f0;
  padding: 16px;
}

.grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 16px;
}

label {
  color: #334155;
  display: grid;
  font-weight: 700;
  gap: 7px;
}

label span {
  font-size: 13px;
}

b {
  color: #b91c1c;
}

input,
select,
textarea {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  min-height: 42px;
  outline: none;
  padding: 10px 11px;
  width: 100%;
}

textarea {
  min-height: 86px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.full {
  grid-column: 1 / -1;
}

.inline {
  display: flex;
  gap: 8px;
}

.inline input {
  min-width: 0;
}

.actions {
  align-items: center;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  margin: 2px -16px -16px;
  padding: 16px;
}

.primary-btn,
.secondary-btn {
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
}

.primary-btn {
  background: #0f766e;
  border: 1px solid #0f766e;
  color: #fff;
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.secondary-btn {
  background: #0f172a;
  border: 1px solid #0f172a;
  color: #fff;
}

.table-scroll {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 760px;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 13px 14px;
  text-align: left;
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

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: flex-end;
}

.empty {
  color: #64748b;
  padding: 30px 14px;
  text-align: center;
}

@media (max-width: 920px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .inline,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
