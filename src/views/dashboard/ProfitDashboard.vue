<script setup>
import { ref, onMounted, watch } from "vue";
import http from "@/api/http";
import ProfitCard from "@/components/ProfitCard.vue";
import { getFinancialYearParams } from "@/utils/financialYear";

const range = ref("week");
const fromDate = ref("");
const toDate = ref("");
const loading = ref(false);
const profitData = ref({ sales: 0, cost: 0, profit: 0 });
const rows = ref([]);

const fetchReport = async () => {
  loading.value = true;
  const params = { ...getFinancialYearParams(), range: range.value };
  if (fromDate.value && toDate.value) {
    params.from = fromDate.value;
    params.to = toDate.value;
  }

  const [summaryRes, detailRes] = await Promise.all([
    http.get("/profit", { params }),
    http.get("/profit", { params: { ...params, mode: "entries" } }),
  ]);

  profitData.value = summaryRes.data;
  rows.value = detailRes.data.entries || [];
  loading.value = false;
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
const money = (n) => Number(n || 0).toFixed(2);

watch([range, fromDate, toDate], fetchReport);
onMounted(fetchReport);
</script>

<template>
  <div class="card">
    <h2>Profit &amp; Loss</h2>

    <div class="filters">
      <button v-for="r in ['today', 'week', 'month', 'year']" :key="r" :class="{ active: range === r }" @click="range = r">
        {{ r.toUpperCase() }}
      </button>
      <input type="date" v-model="fromDate" />
      <input type="date" v-model="toDate" />
    </div>

    <div v-if="loading">Loading...</div>

    <ProfitCard v-else :title="range.toUpperCase()" :data="profitData" />

    <div class="table-wrap" v-if="!loading">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Product Name</th>
            <th>Sale Quantity</th>
            <th>Cost Price</th>
            <th>Sale Price</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td>{{ fmt(row.date) }}</td>
            <td>{{ row.productName }}</td>
            <td>{{ row.quantity }}</td>
            <td>{{ money(row.costPrice) }}</td>
            <td>{{ money(row.salePrice) }}</td>
            <td :class="row.profit >= 0 ? 'ok' : 'bad'">{{ money(row.profit) }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="empty">No records found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 8px 10px; }
button.active { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
input { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
.table-wrap { overflow: auto; margin-top: 14px; }
table { width: 100%; border-collapse: collapse; min-width: 820px; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.ok { color: #15803d; }
.bad { color: #b91c1c; }
.empty { text-align: center; color: #64748b; }
</style>
