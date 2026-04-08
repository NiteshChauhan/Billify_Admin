<template>
  <div class="card">
    <h2>Supplier Outstanding Report</h2>

    <table>
      <thead>
        <tr>
          <th>Supplier</th>
          <th>Total Purchase</th>
          <th>Paid</th>
          <th>Outstanding</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="s in report" :key="s.userId">
          <td>{{ s.userName }}</td>
          <td class="num">{{ money(s.total) }}</td>
          <td class="num">{{ money(s.paid) }}</td>
          <td class="num" :class="{ danger: s.outstanding > 0 }">
            {{ money(s.outstanding) }}
          </td>
          <td>
            <router-link :to="`/users/${s.userId}/ledger`" class="link">
              View Ledger
            </router-link>
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr>
          <th>Total</th>
          <th class="num">{{ money(totalPurchase) }}</th>
          <th class="num">{{ money(totalPaid) }}</th>
          <th class="num">{{ money(totalOutstanding) }}</th>
          <th></th>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";

const report = ref([]);
const { formatCurrency: money } = useCurrency();

const load = async () => {
  report.value = (await http.get("/reports/outstanding", {
    params: { ...getFinancialYearParams(), role: "supplier" },
  })).data.map((i) => ({
    userId: i.userId || i.partyId || i._id,
    userName: i.userName || i.partyName || i.name,
    total: i.total ?? i.totalPurchase ?? 0,
    paid: i.paid ?? i.totalPaid ?? 0,
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

const totalPurchase = computed(() =>
  report.value.reduce((t, r) => t + r.total, 0),
);

const totalPaid = computed(() =>
  report.value.reduce((t, r) => t + r.paid, 0),
);

const totalOutstanding = computed(() =>
  report.value.reduce((t, r) => t + r.outstanding, 0),
);
</script>

<style scoped>
.card {
  max-width: 1100px;
  margin: auto;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.num {
  text-align: right;
}

.danger {
  color: #dc2626;
  font-weight: bold;
}

tfoot th {
  font-weight: bold;
}

.link {
  color: #2563eb;
  font-weight: 500;
}
</style>
