<template>
  <div class="ledger-detail" v-if="loaded">
    <div class="header">
      <div class="left">
        <router-link class="btn icon" to="/ledger">←</router-link>
        <div class="party">{{ title }}</div>
      </div>
      <div class="center">
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
            <th>Party Name</th>
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
            <td colspan="8" class="empty">No transactions</td>
          </tr>
          <tr v-for="row in ledger" :key="`${row.date}-${row.type}-${row.bill_no}-${row.debit}-${row.credit}-${row.billId || ''}`">
            <td>{{ formatDate(row.date) }}</td>
            <td>{{ row.partyName || "-" }}</td>
            <td>{{ formatType(row.type) }}</td>
            <td>{{ row.bill_no || "-" }}</td>
            <td class="num">{{ money(row.debit) }}</td>
            <td class="num">{{ money(row.credit) }}</td>
            <td class="num">{{ money(row.balance) }}</td>
            <td>
              <router-link v-if="viewLink(row)" class="btn ghost" :to="viewLink(row)">View</router-link>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div>Closing Balance: <strong>{{ money(closingBalance) }}</strong></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";

const route = useRoute();
const router = useRouter();
const type = computed(() => String(route.params.type || "all").toLowerCase());

const ledger = ref([]);
const closingBalance = ref(0);
const loaded = ref(false);
const from = ref("");
const to = ref("");
const bankAccountId = ref("");
const bankAccounts = ref([]);
const selectedBankName = computed(() => {
  const selected = bankAccounts.value.find((account) => String(account._id) === String(bankAccountId.value));
  return selected?.accountName || "";
});

const title = computed(() => {
  if (type.value === "cash") return "Cash Ledger";
  if (type.value === "bank") return selectedBankName.value ? `${selectedBankName.value} Ledger` : "Bank Ledger";
  return "Ledger";
});
const { formatCurrency: money } = useCurrency();
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
const formatType = (t) =>
  ({ SALE: "Sales", PURCHASE: "Purchase", SALE_RETURN: "Sale Return", PURCHASE_RETURN: "Purchase Return", PAYMENT: "Payment" }[t] || t);

const viewLink = (row) => {
  const billType = String(row.billType || "").toUpperCase();
  const billId = row.billId;
  if (!billId) return "";
  // For PAYMENT entries, we open the related invoice view since a dedicated payment-details page doesn't exist.
  if (billType === "SALE") return `/sales/${billId}`;
  if (billType === "PURCHASE") return `/purchase/${billId}`;
  return "";
};

const load = async () => {
  loaded.value = false;
  const params = { ...getFinancialYearParams(), type: type.value };
  if (from.value && to.value) {
    params.from = from.value;
    params.to = to.value;
  }
  if (type.value === "bank" && bankAccountId.value) {
    params.bankAccountId = bankAccountId.value;
  }

  const res = await http.get("/reports/ledger-transactions", { params });
  ledger.value = res.data.ledger || [];
  closingBalance.value = res.data.closingBalance || 0;
  loaded.value = true;
};

watch(type, (value) => {
  if (value !== "bank") {
    bankAccountId.value = "";
    router.replace({ query: {} });
  }
});

watch(bankAccountId, (value) => {
  if (type.value !== "bank") return;
  router.replace({
    query: value ? { bankAccountId: value } : {},
  });
});

watch(
  () => route.query.bankAccountId,
  (value) => {
    const nextValue = String(value || "");
    if (nextValue !== String(bankAccountId.value || "")) {
      bankAccountId.value = nextValue;
      load();
    }
  },
);

onMounted(async () => {
  const bankRes = await http.get("/bank-accounts");
  bankAccounts.value = bankRes.data || [];
  bankAccountId.value = String(route.query.bankAccountId || "");
  await load();
});

const printLedger = () => {
  // Reuse existing browser print; PDF export isn't implemented for cash/bank ledgers.
  window.print();
};
</script>

<style scoped>
.ledger-detail { padding: 20px; }
.header { display: grid; grid-template-columns: 1.2fr 2fr 0.8fr; align-items: center; gap: 12px; margin-bottom: 16px; }
.left { display: flex; align-items: center; gap: 10px; }
.party { font-weight: 700; font-size: 16px; color: #0f172a; }
.center { display: flex; align-items: center; gap: 8px; justify-content: flex-start; flex-wrap: wrap; max-width: 520px; }
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
.btn { padding: 9px 12px; border-radius: 8px; text-decoration: none; border: 1px solid #2563eb; color: #2563eb; background: transparent; cursor: pointer; font-weight: 600; }
.btn.icon { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
.ghost { border-color: #2563eb; color: #2563eb; }
.summary { margin-top: 14px; display: flex; justify-content: flex-end; }
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
