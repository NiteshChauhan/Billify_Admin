<template>
  <div class="payments-page">
    <div class="page-head">
      <div>
        <h2>Payments</h2>
        <p>Allocate a payment across opening balance and pending bills.</p>
      </div>
    </div>

    <div class="payment-card">
      <div class="form-grid">
        <label class="field">
          <span>Party</span>
          <select v-model="selectedPartyId" @change="loadOutstanding">
            <option value="">Select Party</option>
            <option v-for="party in parties" :key="party._id" :value="party._id">
              {{ party.name }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Total Amount</span>
          <input v-model.number="totalAmount" type="number" min="0" step="0.01" @input="distributeAmount" />
        </label>
        <label class="field">
          <span>Payment Mode</span>
          <select v-model="paymentMode">
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="BANK">BANK</option>
            <option value="CHEQUE">CHEQUE</option>
          </select>
        </label>
        <label v-if="paymentMode === 'BANK'" class="field">
          <span>Bank Account</span>
          <select v-model="bankAccountId">
            <option value="">Select Bank Account</option>
            <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
              {{ account.accountName }} - {{ account.accountNumber }}
            </option>
          </select>
        </label>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Reference No</span>
          <input v-model.trim="referenceNo" type="text" />
        </label>
        <label class="field full">
          <span>Remarks</span>
          <textarea v-model.trim="remarks" rows="3" />
        </label>
      </div>
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <span>Total Due</span>
        <strong>{{ money(totalDue) }}</strong>
      </div>
      <div class="summary-card">
        <span>Total Selected</span>
        <strong>{{ money(totalSelected) }}</strong>
      </div>
      <div class="summary-card">
        <span>Remaining Amount</span>
        <strong>{{ money(remainingAmount) }}</strong>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Type</th>
            <th>Ref No</th>
            <th>Date</th>
            <th>Total</th>
            <th>Pending</th>
            <th>Pay Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7" class="empty">Select a party to view outstanding items</td>
          </tr>
          <tr v-for="row in rows" :key="row.id">
            <td>
              <input
                type="checkbox"
                v-model="row.selected"
                :disabled="row.pendingAmount <= 0"
                @change="distributeAmount"
              />
            </td>
            <td>
              <span :class="['type-pill', row.type]">{{ typeLabel(row.type) }}</span>
            </td>
            <td>{{ row.refNo }}</td>
            <td>{{ formatDate(row.date) }}</td>
            <td>{{ money(row.totalAmount) }}</td>
            <td class="pending">{{ money(row.pendingAmount) }}</td>
            <td>
              <input
                type="number"
                min="0"
                step="0.01"
                :max="row.pendingAmount"
                v-model.number="row.payAmount"
                :disabled="!row.selected"
                @input="handleManualAmount(row)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="actions">
      <button class="btn primary" :disabled="!canSave" @click="savePayment">Save Payment</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import http from "@/api/http";
import { getUsersApi } from "@/api/userApi";
import { useCurrency } from "@/composables/useCurrency";
import { notifySuccess, notifyWarning } from "@/utils/notifications";

const parties = ref([]);
const bankAccounts = ref([]);
const selectedPartyId = ref("");
const totalAmount = ref(0);
const paymentMode = ref("CASH");
const bankAccountId = ref("");
const referenceNo = ref("");
const remarks = ref("");
const rows = ref([]);
const totalDue = ref(0);
const { formatCurrency: money } = useCurrency();
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-GB") : "-");
const typeLabel = (type) => ({ opening: "Opening", sale: "Sale", purchase: "Purchase" }[type] || type);

const totalSelected = computed(() =>
  rows.value.reduce((sum, row) => sum + Number(row.selected ? row.payAmount || 0 : 0), 0),
);
const remainingAmount = computed(() => Number(totalAmount.value || 0) - totalSelected.value);
const canSave = computed(() =>
  !!selectedPartyId.value &&
  Number(totalAmount.value || 0) > 0 &&
  totalSelected.value > 0 &&
  Math.abs(remainingAmount.value) < 0.001,
);

const loadOutstanding = async () => {
  rows.value = [];
  totalDue.value = 0;
  if (!selectedPartyId.value) return;
  const res = await http.get(`/parties/${selectedPartyId.value}/outstanding`);
  totalDue.value = Number(res.data.totalDue || 0);
  rows.value = (res.data.items || []).map((item) => ({
    ...item,
    selected: false,
    payAmount: 0,
  }));
};

const distributeAmount = () => {
  let remaining = Number(totalAmount.value || 0);
  rows.value = rows.value.map((row) => {
    if (!row.selected) {
      return { ...row, payAmount: 0 };
    }
    const payAmount = Math.min(Number(row.pendingAmount || 0), Math.max(0, remaining));
    remaining -= payAmount;
    return { ...row, payAmount };
  });
};

const handleManualAmount = (row) => {
  if (!row.selected) {
    row.payAmount = 0;
    return;
  }
  const capped = Math.min(Number(row.pendingAmount || 0), Math.max(0, Number(row.payAmount || 0)));
  row.payAmount = capped;
};

const savePayment = async () => {
  if (paymentMode.value === "BANK" && !bankAccountId.value) {
    notifyWarning("Bank account is required for bank payment");
    return;
  }

  const allocations = rows.value
    .filter((row) => row.selected && Number(row.payAmount || 0) > 0)
    .map((row) => ({
      type: row.type,
      refId: row.refId,
      amount: Number(row.payAmount || 0),
    }));

  if (!allocations.length) {
    notifyWarning("Select at least one outstanding item");
    return;
  }

  await http.post("/payments", {
    partyId: selectedPartyId.value,
    totalAmount: Number(totalAmount.value || 0),
    allocations,
    paymentMode: paymentMode.value,
    bankAccountId: paymentMode.value === "BANK" ? bankAccountId.value : null,
    referenceNo: referenceNo.value,
    remarks: remarks.value,
  });

  notifySuccess("Payment saved successfully.");
  totalAmount.value = 0;
  referenceNo.value = "";
  remarks.value = "";
  await loadOutstanding();
};

onMounted(async () => {
  const [partyRes, bankRes] = await Promise.all([getUsersApi(), http.get("/bank-accounts")]);
  parties.value = partyRes.data || [];
  bankAccounts.value = bankRes.data || [];
});
</script>

<style scoped>
.payments-page { display: grid; gap: 16px; }
.page-head h2 { margin: 0; }
.page-head p { margin: 6px 0 0; color: #64748b; }
.payment-card, .summary-card, .table-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05); }
.payment-card { padding: 16px; display: grid; gap: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.field span { font-size: 13px; color: #64748b; }
input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; }
.summary-row { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 12px; }
.summary-card { padding: 14px; display: grid; gap: 6px; }
.summary-card span { color: #64748b; font-size: 13px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
th { background: #f8fafc; }
.empty { text-align: center; color: #64748b; }
.pending { color: #b91c1c; font-weight: 600; }
.type-pill { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.type-pill.opening { background: #eff6ff; color: #1d4ed8; }
.type-pill.sale { background: #ecfdf5; color: #047857; }
.type-pill.purchase { background: #fff7ed; color: #c2410c; }
.actions { display: flex; justify-content: flex-end; }
.btn.primary { border: 1px solid #2563eb; background: #2563eb; color: #fff; border-radius: 10px; padding: 10px 14px; font-weight: 600; cursor: pointer; }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width: 960px) {
  .form-grid, .summary-row { grid-template-columns: 1fr; }
}
</style>
