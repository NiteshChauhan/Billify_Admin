<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2>Collection Transfers</h2>
        <p>Record end-of-day cash merge between branches inside the same company.</p>
      </div>
    </div>

    <section class="panel">
      <div class="grid">
        <label class="field">
          <span>Date</span>
          <input v-model="form.transferDate" type="date" />
        </label>
        <label class="field">
          <span>From Branch</span>
          <select v-model="form.fromBranchId">
            <option v-for="branch in branches" :key="branch._id" :value="branch._id">
              {{ branch.branchName }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>To Branch</span>
          <select v-model="form.toBranchId">
            <option value="">Select branch</option>
            <option v-for="branch in destinationBranches" :key="branch._id" :value="branch._id">
              {{ branch.branchName }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Amount</span>
          <input v-model.number="form.amount" type="number" min="0" step="0.001" />
        </label>
        <label class="field">
          <span>Payment Mode</span>
          <select v-model="form.paymentMode">
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label class="field full">
          <span>Remarks</span>
          <input v-model.trim="form.remarks" type="text" placeholder="Optional note" />
        </label>
      </div>

      <div class="actions">
        <button class="btn primary" @click="saveTransfer">Create Collection Transfer</button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>Collection Transfer History</h3>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th class="num">Amount</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!transfers.length">
              <td colspan="6" class="empty">No collection transfers found</td>
            </tr>
            <tr v-for="transfer in transfers" :key="transfer._id">
              <td>{{ transfer.transferNo }}</td>
              <td>{{ formatDate(transfer.transferDate) }}</td>
              <td>{{ transfer.fromBranchId?.branchName || "-" }}</td>
              <td>{{ transfer.toBranchId?.branchName || "-" }}</td>
              <td class="num">{{ transfer.amount }}</td>
              <td class="capitalize">{{ transfer.paymentMode }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import http from "@/api/http";
import { useAuthStore } from "@/stores/authStore";
import { notifySuccess, notifyWarning } from "@/utils/notifications";

const auth = useAuthStore();
const today = new Date().toISOString().slice(0, 10);

const branches = ref([]);
const transfers = ref([]);
const form = reactive({
  transferDate: today,
  fromBranchId: auth.selectedBranchId || "",
  toBranchId: "",
  amount: 0,
  paymentMode: "cash",
  remarks: "",
});

const destinationBranches = computed(() =>
  branches.value.filter((branch) => String(branch._id) !== String(form.fromBranchId || "")),
);

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

const load = async () => {
  const [branchRes, transferRes] = await Promise.all([
    http.get("/branches"),
    http.get("/collection-transfers"),
  ]);
  branches.value = branchRes.data || [];
  transfers.value = transferRes.data || [];
  if (!form.fromBranchId) {
    form.fromBranchId = auth.selectedBranchId || branches.value[0]?._id || "";
  }
};

const saveTransfer = async () => {
  if (!form.fromBranchId || !form.toBranchId) {
    notifyWarning("Select both branches");
    return;
  }
  if (!(Number(form.amount || 0) > 0)) {
    notifyWarning("Enter transfer amount");
    return;
  }
  await http.post("/collection-transfers", form);
  notifySuccess("Collection transfer created.");
  form.toBranchId = "";
  form.amount = 0;
  form.paymentMode = "cash";
  form.remarks = "";
  await load();
};

onMounted(load);
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.page-head h2, .panel-head h3 { margin: 0; }
.page-head p { margin: 6px 0 0; color: #64748b; }
.panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: grid; gap: 14px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
.num { text-align: right; }
.capitalize { text-transform: capitalize; }
.empty { text-align: center; color: #64748b; }
.actions { display: flex; justify-content: flex-end; }
input, select { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; }
.btn { border-radius: 10px; padding: 10px 14px; font-weight: 600; cursor: pointer; }
.btn.primary { border: 1px solid #2563eb; background: #2563eb; color: #fff; }
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
