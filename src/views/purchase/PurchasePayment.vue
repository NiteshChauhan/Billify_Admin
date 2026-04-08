<template>
  <div class="card">
    <h2>Purchase Payment</h2>
    <div class="info">
      <div><strong>Supplier:</strong> {{ party.name }}</div>
      <div><strong>Invoice Total:</strong> {{ money(invoice.totalAmount) }}</div>
      <div><strong>Paid:</strong> {{ money(invoice.paidAmount) }}</div>
      <div><strong>Balance:</strong> {{ money(balance) }}</div>
      <div><strong>Opening Balance:</strong> {{ money(openingBalanceRemaining) }}</div>
    </div>

    <div class="form">
      <label>Adjust Payment To</label>
      <div class="adjust-options">
        <label><input type="radio" value="bill" v-model="adjustType" /> Bill Payment</label>
        <label><input type="radio" value="opening" v-model="adjustType" :disabled="!canAdjustOpening" /> Opening Balance</label>
      </div>

      <label>Payment Amount</label>
      <input type="number" v-model.number="amount" :max="maxAmount" min="1" :disabled="maxAmount <= 0" />

      <label>Payment Mode</label>
      <select v-model="paymentMode">
        <option value="CASH">CASH</option>
        <option value="UPI">UPI</option>
        <option value="BANK">BANK</option>
        <option value="CHEQUE">CHEQUE</option>
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

      <button @click="save" :disabled="!canSave" class="btn-primary">Save Payment</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { useCurrency } from "@/composables/useCurrency";

const route = useRoute();
const router = useRouter();

const invoice = ref({ totalAmount: 0, paidAmount: 0 });
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
  const [purchaseRes, bankRes] = await Promise.all([http.get(`/purchase/${route.params.id}`), http.get("/bank-accounts")]);
  invoice.value = {
    totalAmount: purchaseRes.data.totalAmount,
    paidAmount: purchaseRes.data.paidAmount,
  };
  party.value = purchaseRes.data.partyId || purchaseRes.data.supplierId || {};
  bankAccounts.value = bankRes.data || [];
});

const balance = computed(() => (invoice.value.totalAmount || 0) - (invoice.value.paidAmount || 0));
const canAdjustOpening = computed(() =>
  resolvedOpeningBalance.value > 0 && String(party.value.openingType || "receivable") === "payable",
);
const openingBalanceRemaining = computed(() => resolvedOpeningBalance.value);
const maxAmount = computed(() => (adjustType.value === "opening" ? openingBalanceRemaining.value : balance.value));
const canSave = computed(() => amount.value > 0 && amount.value <= maxAmount.value && maxAmount.value > 0);

const save = async () => {
  if (paymentMode.value === "BANK" && !bankAccountId.value) {
    alert("Bank account is required for bank payment");
    return;
  }
  if (adjustType.value === "opening" && !canAdjustOpening.value) {
    alert("Opening balance is not available for adjustment");
    return;
  }
  await http.post("/payments", {
    partyId: party.value._id,
    invoiceType: "PURCHASE",
    invoiceId: route.params.id,
    amount: Number(amount.value),
    paymentMode: paymentMode.value,
    bankAccountId: paymentMode.value === "BANK" ? bankAccountId.value : null,
    adjustType: adjustType.value,
    referenceNo: referenceNo.value,
    remarks: remarks.value,
  });

  router.push(`/purchase/${route.params.id}`);
};
</script>

<style scoped>
.card { max-width: 520px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
.form label { display: block; margin-top: 12px; }
input, select, textarea { width: 100%; padding: 8px; }
.adjust-options { display: flex; gap: 16px; margin-top: 8px; }
.btn-primary { margin-top: 15px; width: 100%; }
</style>
