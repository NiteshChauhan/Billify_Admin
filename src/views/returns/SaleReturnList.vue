<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>Sale Return List</h2>
        <p class="subhead">Track customer return bills and linked replacements.</p>
      </div>
      <div class="head-actions">
        <router-link class="btn btn-light" to="/sales/replacement-bills">Replacement Bills</router-link>
        <router-link class="btn action-btn" to="/entry?type=sale_return">Add Bill</router-link>
      </div>
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
          <th>Return Number</th>
          <th>Total Amount</th>
          <th>Record</th>
          <th>Replacement</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="row._id">
          <td>{{ idx + 1 }}</td>
          <td>{{ formatDate(row.returnDate) }}</td>
          <td>{{ row.partyId?.name || "-" }}</td>
          <td>{{ row.returnNo || `SR-${idx + 1}` }}</td>
          <td>{{ money(row.totalAmount) }}</td>
          <td><span :class="['pill', row.isDeleted ? 'DELETED' : 'ACTIVE']">{{ row.isDeleted ? "Deleted" : "Active" }}</span></td>
          <td>
            <div v-if="getReplacementBill(row)" class="replacement-links">
              <ActionIconButton icon="view" :to="`/sales/${getReplacementBill(row).id || row.replacementBillId}`" title="View replacement bill" variant="view" />
              <ActionIconButton icon="edit" :to="`/sales/edit/${getReplacementBill(row).id || row.replacementBillId}`" title="Edit replacement bill" variant="edit" />
              <ActionIconButton icon="delete" title="Delete replacement bill" variant="danger" @click="deleteReplacementBill(getReplacementBill(row))" />
            </div>
            <span v-else>-</span>
          </td>
          <td class="actions">
            <ActionIconButton icon="view" :to="`/sales/${row.billId}`" title="View sale bill" variant="view" />
            <ActionIconButton v-if="!row.isDeleted" icon="delete" title="Delete return" variant="danger" @click="deleteReturn(row)" />
            <ActionIconButton v-else icon="power" title="Restore return" variant="success" @click="restoreReturn(row)" />
          </td>
        </tr>
        <tr v-if="!rows.length"><td colspan="8" class="empty">No return entries</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";
import Loader from "@/components/Loader.vue";
import ActionIconButton from "@/components/common/ActionIconButton.vue";
import { notifySuccess, notifyWarning } from "@/utils/notifications";

const route = useRoute();
const router = useRouter();
const rows = ref([]);
const fromDate = ref("");
const toDate = ref("");
const statusFilter = ref("active");
const loading = ref(false);
const { formatCurrency: money } = useCurrency();
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const getReplacementBill = (row) => row?.replacementBills?.[0] || (row?.replacementBillId ? { id: row.replacementBillId } : null);

const load = async () => {
  loading.value = true;
  try {
    const params = { ...getFinancialYearParams(), billType: "SALE" };
    if (route.query.billId) params.billId = String(route.query.billId);
    if (fromDate.value) params.from = fromDate.value;
    if (toDate.value) params.to = toDate.value;
    params.status = statusFilter.value;
    const res = await http.get("/returns", { params });
    rows.value = res.data || [];
  } finally {
    loading.value = false;
  }
};

const deleteReturn = async (row) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  try {
    await http.delete(`/returns/${row._id}`);
    notifySuccess("Sale return deleted successfully.");
    await load();
  } catch (err) {
    const data = err?.response?.data || {};
    if (data.code === "REPLACEMENT_BILL_EXISTS" && Array.isArray(data.replacementBills) && data.replacementBills.length) {
      const bill = data.replacementBills[0];
      const detail = [
        data.message || "Delete linked replacement bill first before deleting this return",
        "",
        `Bill: ${bill.billNo || bill.invoiceNo || "-"}`,
        `Customer: ${bill.customerName || "-"}`,
        `Amount: ${money(bill.totalAmount || 0)}`,
        "",
        "Open Replacement Bills now?",
      ].join("\n");
      if (window.confirm(detail)) {
        router.push("/sales/replacement-bills");
      }
      return;
    }
    notifyWarning(data.message || "Failed to delete sale return");
  }
};

const deleteReplacementBill = async (bill) => {
  const replacementBillId = bill?.id || bill?._id;
  if (!replacementBillId) return;
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  await http.delete(`/sales/${replacementBillId}`);
  notifySuccess("Replacement bill deleted successfully.");
  await load();
};

const restoreReturn = async (row) => {
  await http.post(`/returns/${row._id}/restore`);
  notifySuccess("Sale return restored successfully.");
  await load();
};

onMounted(load);
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.head h2 { margin: 0; }
.subhead { margin: 6px 0 0; color: #64748b; }
.head-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; align-items: end; }
.filters label { display: grid; gap: 6px; font-size: 13px; }
input { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
.btn { display: inline-flex; align-items: center; justify-content: center; background: #0ea5e9; color: white; text-decoration: none; padding: 10px 14px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
.btn-light { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 10px; padding: 10px 14px; text-decoration: none; font-weight: 600; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: top; }
.actions,
.replacement-links { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pill { padding: 4px 10px; border-radius: 999px; font-size: 12px; }
.ACTIVE { background: #e0f2fe; color: #075985; }
.DELETED { background: #e5e7eb; color: #374151; }
.empty { text-align: center; color: #64748b; }

@media (max-width: 720px) {
  .head {
    align-items: stretch;
  }

  .head-actions,
  .action-btn,
  .btn-light {
    width: 100%;
  }
}
</style>
