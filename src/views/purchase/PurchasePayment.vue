<template>
  <div class="card">
    <h2>Purchase Payment</h2>
    <div class="info">
      <div><strong>Supplier:</strong> {{ party.name }}</div>
      <div><strong>Invoice Total:</strong> Rs {{ invoice.totalAmount }}</div>
      <div><strong>Paid:</strong> Rs {{ invoice.paidAmount }}</div>
      <div><strong>Balance:</strong> Rs {{ balance }}</div>
    </div>

    <div class="form">
      <label>Payment Amount</label>
      <input type="number" v-model.number="amount" :max="balance" min="1" :disabled="balance <= 0" />

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

const route = useRoute();
const router = useRouter();

const invoice = ref({ totalAmount: 0, paidAmount: 0 });
const party = ref({});
const bankAccounts = ref([]);

const amount = ref(0);
const paymentMode = ref("CASH");
const bankAccountId = ref("");
const referenceNo = ref("");
const remarks = ref("");

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
const canSave = computed(() => amount.value > 0 && amount.value <= balance.value && balance.value > 0);

const save = async () => {
  if (paymentMode.value === "BANK" && !bankAccountId.value) {
    alert("Bank account is required for bank payment");
    return;
  }
  await http.post("/payments", {
    partyId: party.value._id,
    invoiceType: "PURCHASE",
    invoiceId: route.params.id,
    amount: Number(amount.value),
    paymentMode: paymentMode.value,
    bankAccountId: paymentMode.value === "BANK" ? bankAccountId.value : null,
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
.btn-primary { margin-top: 15px; width: 100%; }
</style>
