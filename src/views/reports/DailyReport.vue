<template>
  <div class="report-page">
    <div class="report-head">
      <div class="head-card">
        <span class="head-label">Opening Balance</span>
        <strong>{{ money(summary.openingBalance) }}</strong>
      </div>
      <div class="head-card align-right">
        <span class="head-label">Date + Day</span>
        <strong>{{ headerDate }}</strong>
      </div>
    </div>

    <div class="filter-bar">
      <label class="field">
        <span>Date</span>
        <input type="date" v-model="filters.date" @change="load" />
      </label>

      <label class="field">
        <span>Payment Type</span>
        <select v-model="filters.paymentType" @change="load">
          <option value="all">All</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
      </label>

      <label class="field">
        <span>Type</span>
        <select v-model="filters.type" @change="load">
          <option value="all">All</option>
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
        </select>
      </label>

      <label class="field search">
        <span>Search</span>
        <input v-model.trim="filters.search" type="text" placeholder="Search by party name" />
      </label>

      <div class="actions">
        <button class="btn secondary" @click="resetFilters">Reset</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Party</th>
            <th>Payment Type</th>
            <th class="num">Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="6" class="empty">No data found</td>
          </tr>
          <tr v-for="row in rows" :key="`${row.type}-${row.billId}`">
            <td>{{ formatDate(row.date) }}</td>
            <td>{{ row.type === "sale" ? "Sale" : "Purchase" }}</td>
            <td>{{ row.partyName || "Cash" }}</td>
            <td class="capitalize">{{ row.paymentType }}</td>
            <td class="num">{{ money(row.amount) }}</td>
            <td>
              <router-link
                class="btn ghost"
                :to="row.type === 'sale' ? `/sales/${row.billId}` : `/purchase/${row.billId}`"
              >
                View
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="summary-card">
        <span>Total Sales</span>
        <strong>{{ money(summary.totalSales) }}</strong>
      </div>
      <div class="summary-card">
        <span>Total Purchase</span>
        <strong>{{ money(summary.totalPurchase) }}</strong>
      </div>
      <div class="summary-card">
        <span>Closing Balance</span>
        <strong>{{ money(summary.closingBalance) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import http from "@/api/http";

const today = new Date().toISOString().slice(0, 10);

const filters = reactive({
  date: today,
  paymentType: "all",
  type: "all",
  search: "",
});

const rows = ref([]);
const summary = ref({
  openingBalance: 0,
  totalSales: 0,
  totalPurchase: 0,
  closingBalance: 0,
});

let searchTimer = null;

const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (date) => (date ? new Date(date).toLocaleDateString("en-IN") : "-");

const headerDate = computed(() => {
  const date = new Date(filters.date);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        weekday: "long",
      });
});

const load = async () => {
  const res = await http.get("/reports/daily", {
    params: {
      date: filters.date,
      paymentType: filters.paymentType,
      type: filters.type,
      search: filters.search,
    },
  });

  rows.value = res.data.rows || [];
  summary.value = res.data.summary || {
    openingBalance: 0,
    totalSales: 0,
    totalPurchase: 0,
    closingBalance: 0,
  };
};

const resetFilters = async () => {
  filters.date = today;
  filters.paymentType = "all";
  filters.type = "all";
  filters.search = "";
  await load();
};

watch(
  () => filters.search,
  () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 300);
  },
);

onMounted(load);

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
});
</script>

<style scoped>
.report-page {
  padding: 20px;
}

.report-head {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.head-card,
.summary-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.head-card {
  display: grid;
  gap: 4px;
}

.align-right {
  text-align: right;
}

.head-label,
.summary-card span,
.field span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.field {
  display: grid;
  gap: 6px;
}

.field.search {
  min-width: 220px;
}

input,
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #2563eb;
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
}

.btn.secondary {
  background: #fff;
  color: #2563eb;
}

.btn.ghost {
  background: #fff;
  color: #2563eb;
}

.table-wrap {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f8fafc;
  font-weight: 700;
  color: #334155;
}

tbody tr:hover {
  background: #f8fafc;
}

.num {
  text-align: right;
}

.capitalize {
  text-transform: capitalize;
}

.empty {
  text-align: center;
  color: #6b7280;
  padding: 20px;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.summary-card {
  display: grid;
  gap: 6px;
}

@media (max-width: 1100px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }

  .actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .report-head,
  .summary,
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .align-right {
    text-align: left;
  }
}
</style>
