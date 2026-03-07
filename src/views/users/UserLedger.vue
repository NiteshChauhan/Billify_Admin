<template>
  <div class="ledger-card" v-if="loaded">
    <h2>User Ledger</h2>

    <div class="header">
      <div><strong>Name:</strong> {{ user.name }}</div>
      <div><strong>Opening Balance:</strong> Rs {{ user.openingBalance ?? 0 }}</div>
      <div><strong>Closing Balance:</strong> Rs {{ closingBalance }}</div>
    </div>

    <div class="toolbar">
      <label>View As</label>
      <select v-model="role" @change="load">
        <option value="supplier">Supplier</option>
        <option value="customer">Customer</option>
      </select>
      <button @click="exportPdf">Export PDF</button>
    </div>

    <table v-if="ledger.length">
      <thead>
        <tr>
          <th>Date</th>
          <th>Particulars</th>
          <th>Debit (Rs)</th>
          <th>Credit (Rs)</th>
          <th>Balance (Rs)</th>
          <th>Bill</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(l, i) in ledger" :key="i">
          <td>{{ formatDate(l.date) }}</td>
          <td>{{ l.particulars }}</td>
          <td class="debit">{{ l.debit ? l.debit : "-" }}</td>
          <td class="credit">{{ l.credit ? l.credit : "-" }}</td>
          <td>{{ l.balance }}</td>
          <td>
            <router-link v-if="l.billType === 'PURCHASE'" :to="`/purchase/${l.billId}`">View</router-link>
            <router-link v-if="l.billType === 'SALE'" :to="`/sales/${l.billId}`">View</router-link>
            <template v-if="l.canEditBill">
              |
              <router-link v-if="l.billType === 'PURCHASE'" :to="`/purchase/edit/${l.billId}`">Edit</router-link>
              <router-link v-if="l.billType === 'SALE'" :to="`/sales/edit/${l.billId}`">Edit</router-link>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty">No ledger entries</div>
    <router-link to="/users">Back</router-link>
  </div>

  <div v-else class="loading">Loading ledger...</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";

const route = useRoute();
const user = ref({ name: "", openingBalance: 0 });
const ledger = ref([]);
const closingBalance = ref(0);
const loaded = ref(false);
const role = ref("supplier");

const load = async () => {
  const userId = route.params.userId || route.params.id;
  loaded.value = false;
  const res = await http.get(`/users/${userId}/ledger`, {
    params: { ...getFinancialYearParams(), role: role.value },
  });
  user.value = res.data.user || res.data.party || {};
  ledger.value = res.data.ledger || [];
  closingBalance.value = res.data.closingBalance ?? 0;
  loaded.value = true;
};

onMounted(async () => {
  await load();
  window.addEventListener("fy-changed", load);
});

onUnmounted(() => {
  window.removeEventListener("fy-changed", load);
});

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

const exportPdf = () => {
  const userId = route.params.userId || route.params.id;
  const params = new URLSearchParams({
    ...getFinancialYearParams(),
    role: role.value,
    token: localStorage.getItem("token") || "",
  });
  window.open(
    `${import.meta.env.VITE_API_BASE_URL}/users/${userId}/ledger/pdf?${params.toString()}`,
    "_blank",
  );
};
</script>

<style scoped>
.ledger-card {
  max-width: 1000px;
  margin: auto;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
}
.debit {
  color: #dc2626;
}
.credit {
  color: #059669;
}
</style>

