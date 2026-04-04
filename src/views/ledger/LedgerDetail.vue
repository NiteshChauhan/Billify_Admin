<template>
  <div class="ledger-detail" v-if="loaded">
    <div class="header">
      <div class="left">
        <router-link class="btn icon" to="/ledger">←</router-link>
        <div class="party">{{ party.name }}</div>
      </div>
      <div class="center">
        <select v-model="type" class="type" @change="load">
          <option value="all">All</option>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="credit">Credit</option>
        </select>
        <select v-if="type === 'bank'" v-model="bankAccountId" class="type" @change="load">
          <option value="">All Banks</option>
          <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
            {{ account.accountName }}
          </option>
        </select>
        <input type="date" v-model="from" />
        <span>to</span>
        <input type="date" v-model="to" />
        <button class="btn primary" @click="load">Apply</button>
      </div>
      <div class="right">
        <button class="btn ghost" @click="printLedger">Print</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Bill No</th>
            <th class="num">Dr.</th>
            <th class="num">Cr.</th>
            <th class="num">Remaining</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ledger.length === 0">
            <td colspan="7" class="empty">No transactions</td>
          </tr>
          <tr v-for="row in ledger" :key="row._id + row.date + row.particulars">
            <td>{{ formatDate(row.date) }}</td>
            <td>{{ formatType(row.type) }}</td>
            <td>{{ row.bill_no || billNo(row.particulars) }}</td>
            <td class="num">{{ money(row.debit) }}</td>
            <td class="num">{{ money(row.credit) }}</td>
            <td class="num">{{ money(row.balance) }}</td>
            <td class="actions">
              <router-link v-if="row.billId && row.billType === 'SALE'" :to="`/sales/${row.billId}`">View</router-link>
              <router-link v-else-if="row.billId && row.billType === 'PURCHASE'" :to="`/purchase/${row.billId}`">View</router-link>
              <router-link v-if="row.canEditBill && row.billId && row.billType === 'SALE'" :to="`/sales/edit/${row.billId}`">Edit</router-link>
              <router-link v-if="row.canEditBill && row.billId && row.billType === 'PURCHASE'" :to="`/purchase/edit/${row.billId}`">Edit</router-link>
              <a v-if="row.billId && row.billType" @click.prevent="printBill(row)">Print</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div>Total Bill Paid: <strong>{{ money(totals.totalPaid) }}</strong></div>
      <div>Total Amount Received: <strong>{{ money(totals.totalReceived) }}</strong></div>
      <div>Total Sales: <strong>{{ money(totals.totalSales) }}</strong></div>
      <div>Total Purchase: <strong>{{ money(totals.totalPurchase) }}</strong></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";

const route = useRoute();
const ledger = ref([]);
const party = ref({});
const loaded = ref(false);
const from = ref("");
const to = ref("");
const type = ref("all");
const bankAccountId = ref("");
const bankAccounts = ref([]);

const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
const formatType = (t) =>
  ({ SALE: "Sales", PURCHASE: "Purchase", SALE_RETURN: "Sale Return", PURCHASE_RETURN: "Purchase Return", PAYMENT: "Payment" }[t] || t);
const billNo = (particulars = "") => {
  const match = particulars.match(/Invoice\s+([^\s]+)/i);
  return match ? match[1] : "-";
};

const load = async () => {
  loaded.value = false;
  const params = { ...getFinancialYearParams() };
  if (from.value && to.value) {
    params.from = from.value;
    params.to = to.value;
  }
  if (type.value) params.type = type.value;
  if (type.value === "bank" && bankAccountId.value) {
    params.bankAccountId = bankAccountId.value;
  }
  const res = await http.get(`/users/${route.params.userId}/ledger`, { params });
  party.value = res.data.user || res.data.party || {};
  ledger.value = res.data.ledger || [];
  loaded.value = true;
};

watch(type, (value) => {
  if (value !== "bank") {
    bankAccountId.value = "";
  }
});

onMounted(async () => {
  const bankRes = await http.get("/bank-accounts");
  bankAccounts.value = bankRes.data || [];
  await load();
});

const totals = computed(() =>
  ledger.value.reduce(
    (t, row) => {
      if (row.type === "PAYMENT") {
        t.totalPaid += Number(row.debit || 0);
        t.totalReceived += Number(row.credit || 0);
      }
      if (row.type === "SALE") t.totalSales += Number(row.debit || 0);
      if (row.type === "PURCHASE") t.totalPurchase += Number(row.credit || 0);
      return t;
    },
    { totalPaid: 0, totalReceived: 0, totalSales: 0, totalPurchase: 0 },
  ),
);

const printLedger = () => {
  const baseParams = { ...getFinancialYearParams() };
  if (from.value && to.value) {
    baseParams.from = from.value;
    baseParams.to = to.value;
  }
  if (type.value) baseParams.type = type.value;
  if (type.value === "bank" && bankAccountId.value) {
    baseParams.bankAccountId = bankAccountId.value;
  }
  const params = new URLSearchParams({ ...baseParams, token: localStorage.getItem("token") || "" });
  window.open(`${import.meta.env.VITE_API_BASE_URL}/users/${route.params.userId}/ledger/pdf?${params}`, "_blank");
};

const printBill = (row) => {
  if (!row.billId || !row.billType) return;
  const token = localStorage.getItem("token") || "";
  const base = import.meta.env.VITE_API_BASE_URL;
  if (row.billType === "SALE") {
    window.open(`${base}/invoice-pdf/sales/${row.billId}?token=${token}`, "_blank");
  } else if (row.billType === "PURCHASE") {
    window.open(`${base}/invoice-pdf/purchase/${row.billId}?token=${token}`, "_blank");
  }
};
</script>

<style scoped>
.ledger-detail { padding: 20px; }
.header { display: grid; grid-template-columns: 1.2fr 2fr 0.8fr; align-items: center; gap: 12px; margin-bottom: 16px; }
.left { display: flex; align-items: center; gap: 10px; }
.party { font-weight: 700; font-size: 16px; color: #0f172a; }
.center { display: flex; align-items: center; gap: 8px; justify-content: flex-start; flex-wrap: wrap; max-width: 480px; }
.center .type { padding: 8px 10px; border: 1px solid #d0d5dd; border-radius: 8px; width: 140px; background: #fff; }
.center input { padding: 8px 10px; border: 1px solid #d0d5dd; border-radius: 8px; width: 150px; }
.center span { color: #6b7280; font-size: 13px; }
.right { display: flex; justify-content: flex-end; }
.table-wrap { background: #fff; border-radius: 8px; overflow-x: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
th { background: #f9fafb; font-weight: 600; }
tbody tr:hover { background: #f8fafc; }
.num { text-align: right; }
.empty { text-align: center; padding: 14px; color: #6b7280; }
.actions a, .actions .router-link-active, .actions .router-link { margin-right: 10px; color: #2563eb; text-decoration: none; }
.btn { padding: 9px 12px; border-radius: 8px; text-decoration: none; border: 1px solid #2563eb; color: #2563eb; background: transparent; cursor: pointer; font-weight: 600; }
.btn.icon { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
.ghost { border-color: #2563eb; color: #2563eb; }
.summary { margin-top: 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.summary div { background: #fff; padding: 10px 14px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
@media (max-width: 1024px) {
  .header { grid-template-columns: 1fr; row-gap: 10px; }
  .right { justify-content: flex-start; }
}
@media (max-width: 640px) {
  .center { max-width: 100%; }
  .center input { width: 100%; }
  .center { flex-direction: column; align-items: stretch; }
}
</style>
