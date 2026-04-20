<template>
  <div class="ledger-page">
    <div class="top-bar">
      <div class="left">
        <h2>Ledger List</h2>
      </div>
      <div class="center">
        <input v-model="search" placeholder="Search Party Name" />
        <select v-model="typeFilter">
          <option value="all">All</option>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
        <select v-if="typeFilter === 'bank'" v-model="bankAccountId">
          <option value="">All Banks</option>
          <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
            {{ account.accountName }}
          </option>
        </select>
      </div>
      <div class="right">
        <router-link class="btn primary" to="/users/create">+ Add Customer</router-link>
      </div>
    </div>

    <Loader v-if="loading" />

    <div class="table-wrap" v-else>
      <table>
        <thead>
          <tr>
            <th>S.No.</th>
            <th>Party Name</th>
            <th>Total Bill Amount</th>
            <th>Outstanding</th>
            <th>Remaining Amount</th>
            <th>Paid</th>
            <th>Total Invoices</th>
            <th>Total Transactions</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="9" class="empty">No records found</td>
          </tr>
          <tr v-for="(row, idx) in rows" :key="`${row.type}-${row.referenceId}`">
            <td>{{ idx + 1 }}</td>
            <td>{{ row.name }}</td>
            <td class="num">{{ money(row.totalBillAmount) }}</td>
            <td class="num">{{ money(row.outstanding) }}</td>
            <td class="num" :class="row.remainingAmount < 0 ? 'bad' : 'ok'">
              {{ money(row.remainingAmount) }}
            </td>
            <td class="num">{{ money(row.paid) }}</td>
            <td class="num">{{ row.totalInvoices ?? row.totalBills ?? 0 }}</td>
            <td class="num">{{ row.totalTransactions ?? 0 }}</td>
            <td>
              <router-link
                v-if="row.type === 'party'"
                class="btn ghost"
                :to="`/ledger/${row.referenceId}`"
              >
                View
              </router-link>
              <router-link
                v-else
                class="btn ghost"
                :to="bankLedgerLink(row)"
              >
                View
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="item">Total Bill Amount: <strong>{{ money(summary.totalBillAmount) }}</strong></div>
      <div class="item">Total Outstanding: <strong>{{ money(summary.totalOutstanding) }}</strong></div>
      <div class="item">Total Paid: <strong>{{ money(summary.totalPaid) }}</strong></div>
      <div class="note" title="Totals are deduplicated by transaction (sale, purchase, return, payment), so they won’t equal the sum of grouped rows.">
        Totals are deduped by transaction.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getFinancialYearParams } from "@/utils/financialYear";
import http from "@/api/http";
import { useCurrency } from "@/composables/useCurrency";
import Loader from "@/components/Loader.vue";

const search = ref("");
const typeFilter = ref("all");
const bankAccountId = ref("");
const bankAccounts = ref([]);
const rowsFromApi = ref([]);
const summaryFromApi = ref({ totalBillAmount: 0, totalOutstanding: 0, totalPaid: 0 });
const loading = ref(false);
const { formatCurrency: money } = useCurrency();

const load = async () => {
  loading.value = true;
  const fy = getFinancialYearParams();
  const res = await http.get("/reports/ledger-list", {
    params: {
      ...fy,
      type: typeFilter.value,
      ...(typeFilter.value === "bank" && bankAccountId.value
        ? { bankAccountId: bankAccountId.value }
        : {}),
    },
  });
  if (Array.isArray(res.data)) {
    rowsFromApi.value = res.data || [];
    summaryFromApi.value = { totalBillAmount: 0, totalOutstanding: 0, totalPaid: 0 };
  } else {
    rowsFromApi.value = res.data?.rows || [];
    summaryFromApi.value = res.data?.summary || { totalBillAmount: 0, totalOutstanding: 0, totalPaid: 0 };
  }
  loading.value = false;
};

const bankLedgerLink = (row) => {
  if (row.type !== "bank") return `/ledger/type/${row.type}`;
  const query = row.bankAccountId ? `?bankAccountId=${row.bankAccountId}` : "";
  return `/ledger/type/bank${query}`;
};

watch(typeFilter, (value) => {
  if (value !== "bank") {
    bankAccountId.value = "";
  }
  load();
});

watch(bankAccountId, () => {
  if (typeFilter.value === "bank") {
    load();
  }
});

onMounted(async () => {
  loading.value = true;
  const bankRes = await http.get("/bank-accounts");
  bankAccounts.value = bankRes.data || [];
  await load();
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return rowsFromApi.value
    .filter((r) => {
      const matchName = !q || (r.name || "").toLowerCase().includes(q);
      return matchName;
    })
    .map((r) => ({
      ...r,
      totalBillAmount: r.totalAmount,
    }));
});

const rows = computed(() => filtered.value.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))));

const summary = computed(() => summaryFromApi.value);
</script>

<style scoped>
.ledger-page { padding: 20px; }
.top-bar { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 12px; align-items: center; margin-bottom: 16px; }
.left h2 { margin: 0; font-size: 20px; }
.center { display: flex; gap: 10px; align-items: center; }
.center input { flex: 1; padding: 10px; border: 1px solid #d0d5dd; border-radius: 8px; }
.center select { min-width: 140px; padding: 10px; border: 1px solid #d0d5dd; border-radius: 8px; }
.right { display: flex; justify-content: flex-end; }
.table-wrap { overflow-x: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
th { background: #f9fafb; font-weight: 600; }
tbody tr:hover { background: #f8fafc; }
.num { text-align: right; }
.ok { color: #166534; }
.bad { color: #b91c1c; }
.empty { text-align: center; padding: 14px; color: #6b7280; }
.btn { padding: 8px 12px; border-radius: 6px; text-decoration: none; }
.primary { background: #2563eb; color: #fff; }
.ghost { border: 1px solid #2563eb; color: #2563eb; }
.summary { margin-top: 12px; display: flex; gap: 16px; justify-content: flex-end; font-weight: 600; align-items: center; flex-wrap: wrap; }
.summary .item { background: #fff; padding: 10px 14px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.summary .note { font-weight: 500; color: #64748b; font-size: 12px; }
@media (max-width: 1024px) {
  .top-bar { grid-template-columns: 1fr; }
  .center { width: 100%; }
  .right { justify-content: flex-start; }
}
@media (max-width: 640px) {
  .center { flex-direction: column; align-items: stretch; }
  .center select { width: 100%; }
  .right { width: 100%; }
}
</style>
