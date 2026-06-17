<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>Replacement Bills</h2>
        <p class="subhead">Manage sales invoices created from sale return replacement flow.</p>
      </div>
      <router-link class="btn btn-light" to="/sale-return">Back to Sale Return</router-link>
    </div>

    <div class="filters">
      <label>From Date <input type="date" v-model="fromDate" /></label>
      <label>To Date <input type="date" v-model="toDate" /></label>
      <label>Status
        <select v-model="statusFilter">
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
          <option value="all">All</option>
        </select>
      </label>
      <button class="btn-light" @click="load">Apply</button>
    </div>

    <Loader v-if="loading" />

    <table v-else>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Bill No</th>
          <th>Linked Sale Return</th>
          <th>Amount</th>
          <th>Record</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="row._id">
          <td>{{ idx + 1 }}</td>
          <td>{{ formatDate(row.invoiceDate) }}</td>
          <td>{{ row.partyId?.name || "-" }}</td>
          <td>{{ row.invoiceNo || "-" }}</td>
          <td>{{ row.linkedReturnNo || "-" }}</td>
          <td>{{ money(row.totalAmount) }}</td>
          <td><span :class="['pill', row.isDeleted ? 'DELETED' : 'ACTIVE']">{{ row.isDeleted ? "Deleted" : "Active" }}</span></td>
          <td>{{ row.status || "-" }}</td>
          <td class="actions">
            <ActionIconButton icon="view" :to="`/sales/${row._id}`" title="View replacement bill" variant="view" />
            <ActionIconButton v-if="!row.isDeleted" icon="edit" :to="`/sales/edit/${row._id}`" title="Edit replacement bill" variant="edit" />
            <ActionIconButton v-if="!row.isDeleted" icon="delete" title="Delete replacement bill" variant="danger" @click="deleteBill(row)" />
            <ActionIconButton v-else icon="power" title="Restore replacement bill" variant="success" @click="restoreBill(row)" />
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="9" class="empty">No replacement bills found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import http from "@/api/http";
import Loader from "@/components/Loader.vue";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";
import ActionIconButton from "@/components/common/ActionIconButton.vue";
import { notifySuccess } from "@/utils/notifications";

const rows = ref([]);
const fromDate = ref("");
const toDate = ref("");
const statusFilter = ref("active");
const loading = ref(false);
const { formatCurrency: money } = useCurrency();
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const load = async () => {
  loading.value = true;
  try {
    const params = { ...getFinancialYearParams(), type: "replacement", status: statusFilter.value };
    if (fromDate.value) params.from = fromDate.value;
    if (toDate.value) params.to = toDate.value;
    const res = await http.get("/sales/replacement-bills", { params });
    rows.value = res.data || [];
  } finally {
    loading.value = false;
  }
};

const deleteBill = async (row) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  await http.delete(`/sales/${row._id}`);
  notifySuccess("Replacement bill deleted successfully.");
  await load();
};

const restoreBill = async (row) => {
  await http.post(`/sales/${row._id}/restore`);
  notifySuccess("Replacement bill restored successfully.");
  await load();
};

onMounted(load);
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.head h2 { margin: 0; }
.subhead { margin: 6px 0 0; color: #64748b; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; align-items: end; }
.filters label { display: grid; gap: 6px; font-size: 13px; }
input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
.btn { display: inline-flex; align-items: center; justify-content: center; background: #0ea5e9; color: white; text-decoration: none; padding: 10px 14px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
.btn-light { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 10px; padding: 10px 14px; text-decoration: none; font-weight: 600; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: top; }
.actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pill { padding: 4px 10px; border-radius: 999px; font-size: 12px; }
.ACTIVE { background: #e0f2fe; color: #075985; }
.DELETED { background: #e5e7eb; color: #374151; }
.empty { text-align: center; color: #64748b; }

@media (max-width: 720px) {
  .head {
    align-items: stretch;
  }

  .btn-light {
    width: 100%;
  }
}
</style>
