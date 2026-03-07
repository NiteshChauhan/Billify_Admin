<template>
  <div class="report-card">
    <h2>Ageing Report</h2>

    <div class="tabs">
      <button
        :class="{ active: tab === 'SUPPLIER' }"
        @click="switchTab('SUPPLIER')"
      >
        Suppliers
      </button>

      <button
        :class="{ active: tab === 'CUSTOMER' }"
        @click="switchTab('CUSTOMER')"
      >
        Customers
      </button>
    </div>

    <table v-if="rows.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>0–30 Days</th>
          <th>31–60 Days</th>
          <th>61+ Days</th>
          <th>Total</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="r in rows" :key="r.id">
          <td>{{ r.name }}</td>
          <td>₹ {{ r["0_30"] }}</td>
          <td>₹ {{ r["31_60"] }}</td>
          <td>₹ {{ r["61_plus"] }}</td>
          <td class="total">₹ {{ r.total }}</td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <th>Total</th>
          <th>₹ {{ totals["0_30"] }}</th>
          <th>₹ {{ totals["31_60"] }}</th>
          <th>₹ {{ totals["61_plus"] }}</th>
          <th>₹ {{ totals.total }}</th>
        </tr>
      </tfoot>
    </table>

    <p v-else class="empty">No outstanding data</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";

const tab = ref("SUPPLIER");
const data = ref([]);

const switchTab = async (t) => {
  tab.value = t;
  await load();
};

const load = async () => {
  const role = tab.value === "SUPPLIER" ? "supplier" : "customer";
  const res = await http.get("/reports/ageing", {
    params: { ...getFinancialYearParams(), role },
  });
  data.value = res.data;
};

onMounted(async () => {
  await load();
  window.addEventListener("fy-changed", load);
});

onUnmounted(() => {
  window.removeEventListener("fy-changed", load);
});

const rows = computed(() => data.value);

const totals = computed(() =>
  data.value.reduce(
    (t, r) => {
      t["0_30"] += r["0_30"];
      t["31_60"] += r["31_60"];
      t["61_plus"] += r["61_plus"];
      t.total += r.total;
      return t;
    },
    { "0_30": 0, "31_60": 0, "61_plus": 0, total: 0 },
  ),
);
</script>

<style scoped>
.report-card {
  max-width: 1100px;
  margin: auto;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.tabs button {
  padding: 8px 20px;
  border: 1px solid #ddd;
  background: #8a95a1;
  border-radius: 6px;
  cursor: pointer;
}

.tabs button.active {
  background: #2563eb;
  color: #fff;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.total {
  font-weight: bold;
}

.empty {
  text-align: center;
  margin-top: 30px;
  color: #6b7280;
}
</style>
