<template>
  <div class="report-card">
    <h2>Outstanding Report</h2>

    <!-- Tabs -->
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

    <!-- Table -->
    <table v-if="rows.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Total</th>
          <th>Paid / Received</th>
          <th>Outstanding</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="r in rows" :key="r._id">
          <td>{{ r.name }}</td>

          <td>₹ {{ r.total }}</td>

          <td>₹ {{ r.paid }}</td>

          <td
            :class="{
              due: r.outstanding > 0,
              clear: r.outstanding === 0,
            }"
          >
            ₹ {{ r.outstanding }}
          </td>

          <td>
            <router-link :to="`/users/${r._id}/ledger`">
              View Ledger
            </router-link>
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <th>Total</th>
          <th>₹ {{ totals.total }}</th>
          <th>₹ {{ totals.paid }}</th>
          <th>₹ {{ totals.outstanding }}</th>
          <th></th>
        </tr>
      </tfoot>
    </table>

    <p v-else class="empty">No data found</p>
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
  const res = await http.get("/reports/outstanding", {
    params: { ...getFinancialYearParams(), role },
  });
  data.value = res.data.map((i) => ({
    _id: i.userId || i.partyId || i._id,
    name: i.userName || i.partyName || i.name,
    total: i.total ?? i.totalPurchase ?? i.totalSales ?? 0,
    paid: i.paid ?? i.totalPaid ?? i.totalReceived ?? 0,
    outstanding: i.outstanding ?? 0,
  }));
};

onMounted(async () => {
  await load();
  window.addEventListener("fy-changed", load);
});

onUnmounted(() => {
  window.removeEventListener("fy-changed", load);
});

const rows = computed(() => data.value);

const totals = computed(() => {
  return data.value.reduce(
    (t, r) => {
      t.total += r.total;
      t.paid += r.paid;
      t.outstanding += r.outstanding;
      return t;
    },
    { total: 0, paid: 0, outstanding: 0 },
  );
});
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
  cursor: pointer;
  border-radius: 6px;
}

.tabs button.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
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

tfoot th {
  font-weight: bold;
}

.due {
  color: #dc2626;
  font-weight: 600;
}

.clear {
  color: #059669;
}

.empty {
  text-align: center;
  margin-top: 30px;
  color: #6b7280;
}
</style>
