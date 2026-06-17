<template>
  <div class="loans-page">
    <div class="page-head">
      <div>
        <h2>Owner Contribution / Loans</h2>
        <p>Track loan inflow and repayment without affecting profit and loss.</p>
      </div>
      <button class="btn primary" @click="openModal()">Add Loan Entry</button>
    </div>

    <div class="summary">
      <div class="summary-card">
        <span>Total Loan In</span>
        <strong>{{ money(totalLoanIn) }}</strong>
      </div>
      <div class="summary-card">
        <span>Total Loan Out</span>
        <strong>{{ money(totalLoanOut) }}</strong>
      </div>
      <div class="summary-card">
        <span>Remaining Loan</span>
        <strong>{{ money(totalRemaining) }}</strong>
      </div>
    </div>

    <div class="filter-bar">
      <label class="field">
        <span>Date</span>
        <input v-model="filters.date" type="date" @change="loadLoans" />
      </label>
      <label class="field">
        <span>Search</span>
        <input v-model.trim="filters.search" type="text" placeholder="Search note" />
      </label>
      <label class="field">
        <span>Status</span>
        <select v-model="filters.status" @change="loadLoans">
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
          <option value="all">All</option>
        </select>
      </label>
      <div class="actions">
        <button class="btn secondary" @click="resetFilters">Reset</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Remaining</th>
            <th>Payment Type</th>
            <th>Status</th>
            <th>Note</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredLoans.length">
            <td colspan="8" class="empty">No loan entries found</td>
          </tr>
          <tr v-for="loan in filteredLoans" :key="loan._id">
            <td>{{ formatDate(loan.date) }}</td>
            <td>{{ loan.type === "loan_out" ? "Loan Out" : "Loan In" }}</td>
            <td>{{ money(loan.amount) }}</td>
            <td>{{ money(loan.remainingAmount) }}</td>
            <td class="capitalize">{{ loan.paymentType }}</td>
            <td>{{ loan.isDeleted ? "Deleted" : "Active" }}</td>
            <td>{{ loan.note || "-" }}</td>
            <td class="row-actions">
              <ActionIconButton v-if="!loan.isDeleted" icon="edit" title="Edit loan entry" variant="edit" @click="openModal(loan)" />
              <ActionIconButton v-if="!loan.isDeleted" icon="delete" title="Delete loan entry" variant="danger" @click="deleteLoan(loan)" />
              <ActionIconButton v-else icon="power" title="Restore loan entry" variant="success" @click="restoreLoan(loan)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-wrap">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ form.id ? "Edit Loan Entry" : "Add Loan Entry" }}</h3>
          <button class="close-btn" @click="closeModal">X</button>
        </div>
        <label class="field">
          <span>Date</span>
          <input v-model="form.date" type="date" />
        </label>
        <label class="field">
          <span>Type</span>
          <select v-model="form.type">
            <option value="loan_in">Loan In</option>
            <option value="loan_out">Loan Out</option>
          </select>
        </label>
        <label class="field">
          <span>Amount</span>
          <input v-model.number="form.amount" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>Payment Type</span>
          <select v-model="form.paymentType">
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </label>
        <label v-if="form.paymentType === 'bank'" class="field">
          <span>Bank Account</span>
          <select v-model="form.bankAccountId">
            <option value="">Select Bank Account</option>
            <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
              {{ account.accountName }} - {{ account.accountNumber }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Note</span>
          <textarea v-model.trim="form.note" rows="3" />
        </label>
        <div class="actions">
          <button class="btn primary" @click="saveLoan">Save</button>
          <button class="btn secondary" @click="closeModal">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import http from "@/api/http";
import { useCurrency } from "@/composables/useCurrency";
import { notifySuccess, notifyWarning } from "@/utils/notifications";
import ActionIconButton from "@/components/common/ActionIconButton.vue";

const today = new Date().toISOString().slice(0, 10);

const loans = ref([]);
const bankAccounts = ref([]);
const showModal = ref(false);
const filters = reactive({
  date: "",
  search: "",
  status: "active",
});
const form = reactive({
  id: "",
  date: today,
  type: "loan_in",
  amount: 0,
  paymentType: "cash",
  bankAccountId: "",
  note: "",
});
const { formatCurrency: money } = useCurrency();

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-GB") : "-");

const filteredLoans = computed(() => {
  const q = filters.search.toLowerCase();
  return loans.value.filter((loan) => String(loan.note || "").toLowerCase().includes(q));
});

const totalLoanIn = computed(() =>
  loans.value
    .filter((loan) => loan.type === "loan_in")
    .reduce((sum, loan) => sum + Number(loan.amount || 0), 0),
);

const totalLoanOut = computed(() =>
  loans.value
    .filter((loan) => loan.type === "loan_out")
    .reduce((sum, loan) => sum + Number(loan.amount || 0), 0),
);

const totalRemaining = computed(() =>
  loans.value
    .filter((loan) => loan.type === "loan_in")
    .reduce((sum, loan) => sum + Number(loan.remainingAmount || 0), 0),
);

const loadLoans = async () => {
  const params = {};
  if (filters.date) {
    params.date = filters.date;
  }
  params.status = filters.status;
  const [{ data }, bankRes] = await Promise.all([
    http.get("/loans", { params }),
    http.get("/bank-accounts"),
  ]);
  loans.value = data || [];
  bankAccounts.value = bankRes.data || [];
};

const openModal = (loan = null) => {
  form.id = loan?._id || "";
  form.date = loan?.date ? new Date(loan.date).toISOString().slice(0, 10) : today;
  form.type = loan?.type || "loan_in";
  form.amount = Number(loan?.amount || 0);
  form.paymentType = loan?.paymentType || "cash";
  form.bankAccountId = loan?.bankAccountId?._id || loan?.bankAccountId || "";
  form.note = loan?.note || "";
  showModal.value = true;
};

const closeModal = () => {
  form.id = "";
  form.date = today;
  form.type = "loan_in";
  form.amount = 0;
  form.paymentType = "cash";
  form.bankAccountId = "";
  form.note = "";
  showModal.value = false;
};

const saveLoan = async () => {
  if (!form.date || !form.type || Number(form.amount || 0) <= 0) {
    notifyWarning("Date, type, and amount are required");
    return;
  }
  if (form.paymentType === "bank" && !form.bankAccountId) {
    notifyWarning("Bank account is required for bank loan entries");
    return;
  }

  const payload = {
    date: form.date,
    type: form.type,
    amount: Number(form.amount || 0),
    paymentType: form.paymentType,
    bankAccountId: form.paymentType === "bank" ? form.bankAccountId : null,
    note: form.note,
  };

  if (form.id) {
    await http.put(`/loans/${form.id}`, payload);
    notifySuccess("Loan entry updated successfully.");
  } else {
    await http.post("/loans", payload);
    notifySuccess("Loan entry added successfully.");
  }

  closeModal();
  await loadLoans();
};

const deleteLoan = async (loan) => {
  if (!window.confirm("Are you sure you want to delete this record?")) {
    return;
  }
  await http.delete(`/loans/${loan._id}`);
  notifySuccess("Loan entry deleted successfully.");
  await loadLoans();
};

const resetFilters = async () => {
  filters.date = "";
  filters.search = "";
  filters.status = "active";
  await loadLoans();
};

const restoreLoan = async (loan) => {
  await http.post(`/loans/${loan._id}/restore`);
  notifySuccess("Loan entry restored successfully.");
  await loadLoans();
};

watch(
  () => filters.search,
  () => {
    // computed handles local filter only
  },
);

onMounted(loadLoans);
</script>

<style scoped>
.loans-page {
  display: grid;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.page-head h2 {
  margin: 0;
}

.page-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
}

.summary-card,
.filter-bar,
.table-wrap,
.modal {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.summary-card {
  padding: 14px 16px;
  display: grid;
  gap: 6px;
}

.summary-card span,
.field span {
  color: #64748b;
  font-size: 13px;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 260px)) auto;
  gap: 12px;
  align-items: end;
  padding: 16px;
}

.field {
  display: grid;
  gap: 6px;
}

input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.empty {
  text-align: center;
  color: #64748b;
}

.capitalize {
  text-transform: capitalize;
}

.actions,
.row-actions {
  display: flex;
  gap: 8px;
}

.btn {
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.btn.primary {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

.btn.secondary,
.btn.ghost {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.btn.danger {
  border: 1px solid #ef4444;
  background: #fff1f2;
  color: #b91c1c;
}

.modal-wrap {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.modal {
  width: min(460px, 92vw);
  padding: 18px;
  display: grid;
  gap: 12px;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .page-head,
  .summary,
  .filter-bar {
    grid-template-columns: 1fr;
    display: grid;
  }

  .actions,
  .row-actions {
    flex-wrap: wrap;
  }
}
</style>
