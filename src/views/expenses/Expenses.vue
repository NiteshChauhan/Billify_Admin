<template>
  <div class="expenses-page">
    <div class="page-head">
      <div>
        <h2>Expenses</h2>
        <p>Manage manual expenses without affecting profit and loss.</p>
      </div>
      <button class="btn primary" @click="openModal()">Add Expense</button>
    </div>

    <div class="filter-bar">
      <label class="field">
        <span>Date</span>
        <input v-model="filters.date" type="date" @change="loadExpenses" />
      </label>
      <label class="field">
        <span>Search</span>
        <input v-model.trim="filters.search" type="text" placeholder="Search title" />
      </label>
      <label class="field">
        <span>Status</span>
        <select v-model="filters.status" @change="loadExpenses">
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
          <option value="all">All</option>
        </select>
      </label>
      <div class="actions">
        <button class="btn secondary" @click="resetFilters">Reset</button>
      </div>
    </div>

    <p v-if="message" class="message">{{ message }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Payment Type</th>
            <th>Status</th>
            <th>Note</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredExpenses.length">
            <td colspan="7" class="empty">No expenses found</td>
          </tr>
          <tr v-for="expense in filteredExpenses" :key="expense._id">
            <td>{{ formatDate(expense.date) }}</td>
            <td>{{ expense.title }}</td>
            <td>{{ money(expense.amount) }}</td>
            <td class="capitalize">{{ expense.paymentType }}</td>
            <td>{{ expense.isDeleted ? "Deleted" : "Active" }}</td>
            <td>{{ expense.note || "-" }}</td>
            <td class="row-actions">
              <button v-if="!expense.isDeleted" class="btn ghost" @click="openModal(expense)">Edit</button>
              <button v-if="!expense.isDeleted" class="btn danger" @click="deleteExpense(expense)">Delete</button>
              <button v-else class="btn ghost" @click="restoreExpense(expense)">Restore</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-wrap">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ form.id ? "Edit Expense" : "Add Expense" }}</h3>
          <button class="close-btn" @click="closeModal">X</button>
        </div>
        <label class="field">
          <span>Date</span>
          <input v-model="form.date" type="date" />
        </label>
        <label class="field">
          <span>Title</span>
          <input v-model.trim="form.title" type="text" />
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
          <button class="btn primary" @click="saveExpense">Save</button>
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

const today = new Date().toISOString().slice(0, 10);

const message = ref("");
const expenses = ref([]);
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
  title: "",
  amount: 0,
  paymentType: "cash",
  bankAccountId: "",
  note: "",
});
const { formatCurrency: money } = useCurrency();
const formatDate = (date) => (date ? new Date(date).toLocaleDateString("en-GB") : "-");

const filteredExpenses = computed(() => {
  const q = filters.search.toLowerCase();
  return expenses.value.filter((expense) => (expense.title || "").toLowerCase().includes(q));
});

const loadExpenses = async () => {
  const params = {};
  if (filters.date) {
    params.date = filters.date;
  }
  params.status = filters.status;
  const { data } = await http.get("/expenses", { params });
  expenses.value = data || [];
};

const loadBankAccounts = async () => {
  const { data } = await http.get("/bank-accounts");
  bankAccounts.value = data || [];
};

const openModal = (expense = null) => {
  message.value = "";
  form.id = expense?._id || "";
  form.date = expense?.date ? new Date(expense.date).toISOString().slice(0, 10) : today;
  form.title = expense?.title || "";
  form.amount = Number(expense?.amount || 0);
  form.paymentType = expense?.paymentType || "cash";
  form.bankAccountId = expense?.bankAccountId?._id || expense?.bankAccountId || "";
  form.note = expense?.note || "";
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  form.id = "";
  form.date = today;
  form.title = "";
  form.amount = 0;
  form.paymentType = "cash";
  form.bankAccountId = "";
  form.note = "";
};

const saveExpense = async () => {
  if (!form.date || !form.title || Number(form.amount || 0) <= 0) {
    notifyWarning("Date, title, and valid amount are required");
    return;
  }
  if (form.paymentType === "bank" && !form.bankAccountId) {
    notifyWarning("Bank account is required for bank expense");
    return;
  }

  const payload = {
    date: form.date,
    title: form.title,
    amount: Number(form.amount || 0),
    paymentType: form.paymentType,
    bankAccountId: form.paymentType === "bank" ? form.bankAccountId : null,
    note: form.note,
  };

  if (form.id) {
    await http.put(`/expenses/${form.id}`, payload);
    message.value = "Expense updated";
    notifySuccess("Expense updated successfully.");
  } else {
    await http.post("/expenses", payload);
    message.value = "Expense added";
    notifySuccess("Expense added successfully.");
  }

  closeModal();
  await loadExpenses();
};

const deleteExpense = async (expense) => {
  if (!window.confirm(`Delete expense "${expense.title}"?`)) {
    return;
  }
  await http.delete(`/expenses/${expense._id}`);
  message.value = "Expense deleted";
  notifySuccess("Expense deleted successfully.");
  await loadExpenses();
};

const resetFilters = async () => {
  filters.date = "";
  filters.search = "";
  filters.status = "active";
  await loadExpenses();
};

const restoreExpense = async (expense) => {
  await http.post(`/expenses/${expense._id}/restore`);
  message.value = "Expense restored";
  notifySuccess("Expense restored successfully.");
  await loadExpenses();
};

watch(
  () => filters.search,
  () => {
    message.value = "";
  },
);

onMounted(async () => {
  await Promise.all([loadExpenses(), loadBankAccounts()]);
});
</script>

<style scoped>
.expenses-page {
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

.filter-bar,
.modal,
.table-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
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

.field span,
.message {
  font-size: 13px;
  color: #64748b;
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

@media (max-width: 820px) {
  .page-head,
  .filter-bar {
    grid-template-columns: 1fr;
    display: grid;
  }

  .row-actions,
  .actions {
    flex-wrap: wrap;
  }
}
</style>
