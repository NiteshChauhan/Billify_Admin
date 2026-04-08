<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>Sales List</h2>
        <p>Track customer sales and outstanding.</p>
      </div>
      <router-link class="btn" to="/entry?type=sale">Add Bill</router-link>
    </div>

    <div class="filters">
      <label>From Date <input type="date" v-model="fromDate" /></label>
      <label>To Date <input type="date" v-model="toDate" /></label>
      <button class="btn-light" @click="load">Apply</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Date</th>
            <th>Customer Name</th>
            <th>Sale Number</th>
            <th>Total Amount</th>
            <th>Paid Amount</th>
            <th>Status</th>
            <th>How Many Days</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(inv, idx) in rows" :key="inv._id">
            <td>{{ idx + 1 }}</td>
            <td>{{ fmt(inv.invoiceDate) }}</td>
            <td>{{ inv.partyId?.name || inv.customerId?.name || inv.vendorId?.name || '-' }}</td>
            <td>{{ inv.invoiceNo }}</td>
            <td>{{ money(inv.totalAmount) }}</td>
            <td>{{ money(inv.paidAmount) }}</td>
            <td><span :class="['pill', inv.status]">{{ statusLabel(inv.status) }}</span></td>
            <td>{{ pendingDays(inv) }}</td>
            <td class="actions">
              <router-link :to="`/sales/edit/${inv._id}`">Edit</router-link>
              <router-link :to="`/sales/${inv._id}`">View</router-link>
              <button @click="printBill(inv._id)">Print</button>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="9" class="empty">No sales found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div>Total Sales Amount: {{ money(totals.totalSales) }}</div>
      <div>Total Paid Amount: {{ money(totals.totalPaid) }}</div>
      <div>Outstanding Amount: {{ money(totals.outstanding) }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";

const rows = ref([]);
const fromDate = ref("");
const toDate = ref("");
const { formatCurrency: money } = useCurrency();

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
const statusLabel = (s) => (s === "DUE" ? "Unpaid" : s === "PARTIAL" ? "Partial" : "Paid");

const pendingDays = (inv) => {
  if (!["DUE", "PARTIAL"].includes(inv.status)) return "-";
  const diff = Date.now() - new Date(inv.invoiceDate).getTime();
  return `${Math.max(0, Math.floor(diff / 86400000))} days`;
};

const load = async () => {
  const params = { ...getFinancialYearParams() };
  if (fromDate.value) params.from = fromDate.value;
  if (toDate.value) params.to = toDate.value;
  const res = await http.get("/sales", { params });
  rows.value = res.data || [];
};

const printBill = (id) => {
  const token = localStorage.getItem("token") || "";
  window.open(`${import.meta.env.VITE_API_BASE_URL}/invoice-pdf/sales/${id}?token=${token}`, "_blank");
};

const totals = computed(() => {
  const totalSales = rows.value.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
  const totalPaid = rows.value.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0);
  return {
    totalSales,
    totalPaid,
    outstanding: totalSales - totalPaid,
  };
});

onMounted(load);
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
.head p { margin: 0; color: #64748b; }
.btn { background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; padding: 10px 12px; }
.filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; align-items: end; }
.filters label { display: grid; gap: 6px; font-size: 13px; }
input { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
.btn-light { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 9px 12px; }
.table-wrap { overflow: auto; }
table { width: 100%; min-width: 980px; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.pill { padding: 4px 10px; border-radius: 999px; font-size: 12px; }
.PAID { background: #dcfce7; color: #166534; }
.PARTIAL { background: #fef9c3; color: #854d0e; }
.DUE { background: #fee2e2; color: #991b1b; }
.actions { display: flex; gap: 8px; align-items: center; }
.actions button { border: none; background: none; color: #2563eb; cursor: pointer; }
.empty { text-align: center; color: #64748b; }
.summary { margin-top: 12px; display: grid; gap: 6px; justify-content: end; text-align: right; }
</style>
