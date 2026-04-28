<template>
  <div class="ledger-card" v-if="loaded">
    <h2>User Ledger</h2>

    <div class="header">
      <div><strong>Name:</strong> {{ user.name }}</div>
      <div><strong>Opening Balance:</strong> {{ money(user.openingBalance ?? 0) }}</div>
      <div><strong>Closing Balance:</strong> {{ money(closingBalance) }}</div>
    </div>

    <div class="toolbar">
      <select v-model="pdfLanguage" class="pdf-select" @change="savePdfLanguage">
        <option v-for="option in pdfLanguageOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button @click="exportPdf">Export PDF</button>
    </div>

    <table v-if="ledger.length">
      <thead>
        <tr>
          <th>Date</th>
          <th>Bill No</th>
          <th>Type</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Balance</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(l, i) in ledger" :key="i">
          <td>{{ formatDate(l.date) }}</td>
          <td>{{ l.bill_no || l.billNumber || '-' }}</td>
          <td>{{ l.type }}</td>
          <td class="debit">{{ l.debit ? money(l.debit) : '-' }}</td>
          <td class="credit">{{ l.credit ? money(l.credit) : '-' }}</td>
          <td>{{ money(l.balance) }}</td>
          <td>
            <router-link v-if="l.billType === 'PURCHASE'" :to="`/purchase/${l.billId}`">View</router-link>
            <router-link v-else-if="l.billType === 'SALE'" :to="`/sales/${l.billId}`">View</router-link>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty">No ledger entries</div>
    <router-link class="btn-secondary" to="/users">Back</router-link>
  </div>

  <div v-else class="loading">Loading ledger...</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";
import { getPdfLanguage, pdfLanguageOptions, setPdfLanguage } from "@/utils/pdfLanguage";

const route = useRoute();
const { formatCurrency: money } = useCurrency();
const user = ref({ name: "", openingBalance: 0 });
const ledger = ref([]);
const closingBalance = ref(0);
const loaded = ref(false);
const pdfLanguage = ref(getPdfLanguage());

const load = async () => {
  const userId = route.params.userId || route.params.id;
  loaded.value = false;
  const res = await http.get(`/users/${userId}/ledger`, {
    params: { ...getFinancialYearParams(), role: "all" },
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

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const exportPdf = () => {
  const userId = route.params.userId || route.params.id;
  const params = new URLSearchParams({
    ...getFinancialYearParams(),
    role: "all",
    token: localStorage.getItem("token") || "",
    branchId: localStorage.getItem("selectedBranchId") || "",
    language: pdfLanguage.value,
  });
  window.open(
    `${import.meta.env.VITE_API_BASE_URL}/users/${userId}/ledger/pdf?${params.toString()}`,
    "_blank",
  );
};

const savePdfLanguage = () => setPdfLanguage(pdfLanguage.value);
</script>

<style scoped>
.ledger-card { max-width: 1100px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
.header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.toolbar { margin-bottom: 10px; }
button { border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; padding: 8px 10px; }
.btn-secondary { display: inline-flex; align-items: center; justify-content: center; margin-top: 12px; border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 6px; padding: 8px 10px; text-decoration: none; }
.pdf-select { margin-right: 8px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; padding: 8px 10px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
.empty { color: #64748b; padding: 12px 0; }
.loading { text-align: center; margin-top: 60px; }
.debit { color: #b45309; }
.credit { color: #166534; }
</style>
