<template>
  <div class="card">
    <h2>Sales Receipt</h2>

    <div class="info">
      <div><strong>Customer:</strong> {{ party.name }}</div>
      <div><strong>Invoice Total:</strong> {{ money(invoice.totalAmount) }}</div>
      <div><strong>Already Paid:</strong> {{ money(invoice.paidAmount) }}</div>
      <div><strong>Balance:</strong> {{ money(balance) }}</div>
      <div><strong>Opening Balance:</strong> {{ money(openingBalanceRemaining) }}</div>
    </div>

    <div class="form">
      <label>Adjust Payment To</label>
      <div class="adjust-options">
        <label><input type="radio" value="bill" v-model="adjustType" /> Bill Payment</label>
        <label><input type="radio" value="opening" v-model="adjustType" :disabled="!canAdjustOpening" /> Opening Balance</label>
      </div>

      <label>Receipt Amount</label>
      <input type="number" v-model.number="amount" :max="maxAmount" />

      <label>Payment Mode</label>
      <select v-model="paymentMode">
        <option>CASH</option>
        <option>UPI</option>
        <option>BANK</option>
        <option>CHEQUE</option>
      </select>

      <template v-if="paymentMode === 'BANK'">
        <label>Bank Account</label>
        <select v-model="bankAccountId">
          <option value="">Select Bank Account</option>
          <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
            {{ account.accountName }} - {{ account.accountNumber }}
          </option>
        </select>
      </template>

      <label>Reference No</label>
      <input v-model="referenceNo" />

      <label>Remarks</label>
      <textarea v-model="remarks"></textarea>

      <button :disabled="amount <= 0 || amount > maxAmount" @click="save">Save Receipt</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { useCurrency } from "@/composables/useCurrency";
import { notifySuccess, notifyWarning } from "@/utils/notifications";

const route = useRoute();
const router = useRouter();

const invoice = ref({});
const party = ref({});
const bankAccounts = ref([]);

const amount = ref(0);
const paymentMode = ref("CASH");
const bankAccountId = ref("");
const adjustType = ref("bill");
const referenceNo = ref("");
const remarks = ref("");
const { formatCurrency: money } = useCurrency();

const resolvedOpeningBalance = computed(() =>
  Number((party.value.remainingOpeningBalance ?? party.value.openingBalance) ?? 0),
);

onMounted(async () => {
  const [invoiceRes, bankRes] = await Promise.all([http.get(`/sales/${route.params.id}`), http.get("/bank-accounts")]);
  invoice.value = invoiceRes.data;
  party.value = invoiceRes.data.partyId || invoiceRes.data.customerId || invoiceRes.data.vendorId || {};
  bankAccounts.value = bankRes.data || [];
});

const balance = computed(() => (invoice.value.totalAmount || 0) - (invoice.value.paidAmount || 0));
const canAdjustOpening = computed(() =>
  resolvedOpeningBalance.value > 0 && String(party.value.openingType || "receivable") === "receivable",
);
const openingBalanceRemaining = computed(() => resolvedOpeningBalance.value);
const maxAmount = computed(() => (adjustType.value === "opening" ? openingBalanceRemaining.value : balance.value));

const save = async () => {
  if (paymentMode.value === "BANK" && !bankAccountId.value) {
    notifyWarning("Bank account is required for bank payment");
    return;
  }
  if (adjustType.value === "opening" && !canAdjustOpening.value) {
    notifyWarning("Opening balance is not available for adjustment");
    return;
  }
  await http.post("/payments", {
    partyId: party.value._id,
    invoiceType: "SALE",
    invoiceId: route.params.id,
    amount: Number(amount.value),
    paymentMode: paymentMode.value,
    bankAccountId: paymentMode.value === "BANK" ? bankAccountId.value : null,
    adjustType: adjustType.value,
    referenceNo: referenceNo.value,
    remarks: remarks.value,
  });

  notifySuccess("Receipt saved successfully.");
  router.push(`/sales/${route.params.id}`);
};
</script>

<style scoped>
.card { max-width: 500px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
.form label { display: block; margin-top: 12px; }
input, select, textarea { width: 100%; padding: 8px; }
.adjust-options { display: flex; gap: 16px; margin-top: 8px; }
button { margin-top: 15px; }
</style>
