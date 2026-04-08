<template>
  <div class="report-page">
    <div class="report-head">
      <div class="head-card">
        <span class="head-label">Opening Balance</span>
        <strong>{{ money(summary.openingBalance) }}</strong>
        <div class="opening-edit">
          <input type="number" v-model.number="openingBalanceInput" />
          <button class="btn secondary" @click="saveOpeningBalance">Save</button>
        </div>
      </div>
      <div class="head-card align-right">
        <span class="head-label">Date + Day</span>
        <strong>{{ headerDate }}</strong>
      </div>
    </div>

    <div class="filter-bar">
      <label class="field">
        <span>Date</span>
        <input type="date" v-model="filters.date" @change="load" />
      </label>

      <label class="field">
        <span>Payment Type</span>
        <select v-model="filters.paymentType" @change="load">
          <option value="all">All</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
      </label>

      <label class="field">
        <span>Type</span>
        <select v-model="filters.type" @change="load">
          <option value="all">All</option>
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
          <option value="payment">Payment</option>
          <option value="loan">Loan</option>
        </select>
      </label>

      <label class="field search">
        <span>Search</span>
        <input v-model.trim="filters.search" type="text" placeholder="Search by party name" />
      </label>

      <div class="actions">
        <button class="btn secondary" @click="openBalanceHistory">View Balance History</button>
        <button class="btn secondary" @click="showBankModal = true">Add Bank Account</button>
        <button class="btn primary" @click="openAddExpense">Add Expense</button>
        <button class="btn secondary" @click="resetFilters">Reset</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Party</th>
            <th>Payment Type</th>
            <th>Reference</th>
            <th class="num">Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7" class="empty">No data found</td>
          </tr>
          <tr v-for="row in rows" :key="`${row.type}-${row.billId}`">
            <td>{{ formatDate(row.date) }}</td>
            <td>{{ typeLabel(row) }}</td>
            <td>{{ row.partyName || "Cash" }}</td>
            <td class="capitalize">{{ row.paymentType }}</td>
            <td>{{ rowReference(row) }}</td>
            <td class="num">{{ money(row.amount) }}</td>
            <td>
              <router-link
                v-if="row.type === 'sale' || row.type === 'purchase'"
                class="btn ghost"
                :to="row.type === 'sale' ? `/sales/${row.billId}` : `/purchase/${row.billId}`"
              >
                View
              </router-link>
              <router-link
                v-else-if="row.type === 'payment' && row.invoiceType === 'SALE' && row.billId"
                class="btn ghost"
                :to="`/sales/${row.billId}`"
              >
                View
              </router-link>
              <router-link
                v-else-if="row.type === 'payment' && row.invoiceType === 'PURCHASE' && row.billId"
                class="btn ghost"
                :to="`/purchase/${row.billId}`"
              >
                View
              </router-link>
              <template v-else>
                <template v-if="row.type === 'expense'">
                  <button class="btn ghost" @click="editExpense(row)">Edit</button>
                  <button class="btn danger" @click="deleteExpense(row)">Delete</button>
                </template>
                <router-link
                  v-else-if="row.type === 'loan'"
                  class="btn ghost"
                  to="/loans"
                >
                  View
                </router-link>
                <span v-else>-</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="summary-card">
        <span>Total Sales</span>
        <strong>{{ money(summary.totalSales) }}</strong>
      </div>
      <div class="summary-card">
        <span>Total Purchase</span>
        <strong>{{ money(summary.totalPurchase) }}</strong>
      </div>
      <div class="summary-card">
        <span>Payment Received</span>
        <strong>{{ money(summary.totalPaymentReceived) }}</strong>
      </div>
      <div class="summary-card">
        <span>Payment Paid</span>
        <strong>{{ money(summary.totalPaymentPaid) }}</strong>
      </div>
      <div class="summary-card">
        <span>Total Expenses</span>
        <strong>{{ money(summary.totalExpenses) }}</strong>
      </div>
      <div class="summary-card">
        <span>Loan In</span>
        <strong>{{ money(summary.totalLoanIn) }}</strong>
      </div>
      <div class="summary-card">
        <span>Loan Out</span>
        <strong>{{ money(summary.totalLoanOut) }}</strong>
      </div>
      <div class="summary-card">
        <span>Closing Balance</span>
        <strong>{{ money(summary.closingBalance) }}</strong>
      </div>
    </div>

    <div v-if="showExpenseModal" class="modal-wrap">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ expenseForm.id ? "Edit Expense" : "Add Expense" }}</h3>
          <button class="close-btn" @click="closeExpenseModal">X</button>
        </div>
        <label class="field">
          <span>Date</span>
          <input v-model="expenseForm.date" type="date" />
        </label>
        <label class="field">
          <span>Title</span>
          <input v-model.trim="expenseForm.title" type="text" />
        </label>
        <label class="field">
          <span>Amount</span>
          <input v-model.number="expenseForm.amount" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>Payment Type</span>
          <select v-model="expenseForm.paymentType">
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </label>
        <label v-if="expenseForm.paymentType === 'bank'" class="field">
          <span>Bank Account</span>
          <select v-model="expenseForm.bankAccountId">
            <option value="">Select Bank Account</option>
            <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
              {{ account.accountName }} - {{ account.accountNumber }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Note</span>
          <input v-model.trim="expenseForm.note" type="text" />
        </label>
        <div class="modal-actions">
          <button class="btn primary" @click="saveExpense">Save Expense</button>
          <button class="btn secondary" @click="closeExpenseModal">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showBankModal" class="modal-wrap">
      <div class="modal">
        <div class="modal-head">
          <h3>Add Bank Account</h3>
          <button class="close-btn" @click="showBankModal = false">X</button>
        </div>
        <label class="field">
          <span>Account Name</span>
          <input v-model.trim="bankForm.accountName" type="text" />
        </label>
        <label class="field">
          <span>Account Number</span>
          <input v-model.trim="bankForm.accountNumber" type="text" />
        </label>
        <label class="field">
          <span>Balance</span>
          <input v-model.number="bankForm.balance" type="number" min="0" step="0.01" />
        </label>
        <div class="modal-actions">
          <button class="btn primary" @click="saveBankAccount">Save Account</button>
          <button class="btn secondary" @click="showBankModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showHistoryModal" class="modal-wrap">
      <div class="modal history-modal">
        <div class="modal-head">
          <h3>Balance History</h3>
          <button class="close-btn" @click="showHistoryModal = false">X</button>
        </div>
        <div class="history-filters">
          <label class="field">
            <span>From</span>
            <input v-model="historyFilters.from" type="date" />
          </label>
          <label class="field">
            <span>To</span>
            <input v-model="historyFilters.to" type="date" />
          </label>
          <div class="history-actions">
            <button class="btn primary" @click="loadBalanceHistory">Load</button>
          </div>
        </div>
        <div class="table-wrap history-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th class="num">Opening Balance</th>
                <th class="num">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!balanceHistory.length">
                <td colspan="3" class="empty">No balance history found</td>
              </tr>
              <tr v-for="row in balanceHistory" :key="row.date">
                <td>{{ formatDate(row.date) }}</td>
                <td class="num">{{ money(row.openingBalance) }}</td>
                <td class="num">{{ money(row.closingBalance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import http from "@/api/http";
import { useCurrency } from "@/composables/useCurrency";

const today = new Date().toISOString().slice(0, 10);

const filters = reactive({
  date: today,
  paymentType: "all",
  type: "all",
  search: "",
});

const rows = ref([]);
const bankAccounts = ref([]);
const openingBalanceInput = ref(0);
const showExpenseModal = ref(false);
const showBankModal = ref(false);
const showHistoryModal = ref(false);
const balanceHistory = ref([]);
const summary = ref({
  openingBalance: 0,
  totalSales: 0,
  totalPurchase: 0,
  totalPaymentReceived: 0,
  totalPaymentPaid: 0,
  totalExpenses: 0,
  totalLoanIn: 0,
  totalLoanOut: 0,
  closingBalance: 0,
});
const expenseForm = reactive({
  id: "",
  date: today,
  title: "",
  amount: 0,
  paymentType: "cash",
  bankAccountId: "",
  note: "",
});
const bankForm = reactive({
  accountName: "",
  accountNumber: "",
  balance: 0,
});
const historyFilters = reactive({
  from: today,
  to: today,
});
const { formatCurrency: money } = useCurrency();

let searchTimer = null;

const formatDate = (date) => (date ? new Date(date).toLocaleDateString("en-IN") : "-");
const typeLabel = (row) => {
  if (row.type === "payment") {
    return row.paymentDirection === "paid" ? "Payment Paid" : "Payment Received";
  }
  if (row.type === "loan") {
    return row.loanType === "loan_out" ? "Loan Out" : "Loan In";
  }
  return ({ sale: "Sale", purchase: "Purchase", payment: "Payment", expense: "Expense" }[row.type] || row.type);
};
const rowReference = (row) => {
  if (row.type === "expense") {
    return row.note || row.bankAccountName || "-";
  }
  if (row.type === "loan") {
    return row.note || row.bankAccountName || "-";
  }
  if (row.type === "payment") {
    return row.referenceNo || (row.invoiceType === "OPENING" ? "Opening Balance" : row.bankAccountName || "-");
  }
  return row.bankAccountName || "-";
};

const headerDate = computed(() => {
  const date = new Date(filters.date);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        weekday: "long",
      });
});

const load = async () => {
  const [dailyRes, bankRes] = await Promise.all([
    http.get("/reports/daily", {
      params: {
        date: filters.date,
        paymentType: filters.paymentType,
        type: filters.type,
        search: filters.search,
      },
    }),
    http.get("/bank-accounts"),
  ]);

  rows.value = dailyRes.data.rows || [];
  summary.value = dailyRes.data.summary || {
    openingBalance: 0,
    totalSales: 0,
    totalPurchase: 0,
    totalPaymentReceived: 0,
    totalPaymentPaid: 0,
    totalExpenses: 0,
    totalLoanIn: 0,
    totalLoanOut: 0,
    closingBalance: 0,
  };
  openingBalanceInput.value = Number(summary.value.openingBalance || 0);
  bankAccounts.value = bankRes.data || [];
};

const loadBalanceHistory = async () => {
  const res = await http.get("/reports/daybook/balance-history", {
    params: {
      from: historyFilters.from,
      to: historyFilters.to,
      paymentType: filters.paymentType,
    },
  });
  balanceHistory.value = res.data.history || [];
};

const openBalanceHistory = async () => {
  historyFilters.from = filters.date;
  historyFilters.to = filters.date;
  showHistoryModal.value = true;
  await loadBalanceHistory();
};

const saveOpeningBalance = async () => {
  await http.post("/company-balance", {
    date: filters.date,
    openingBalance: Number(openingBalanceInput.value || 0),
  });
  await load();
};

const saveExpense = async () => {
  if (!expenseForm.date || !expenseForm.title || Number(expenseForm.amount || 0) <= 0) {
    alert("Date, title and amount are required");
    return;
  }
  if (expenseForm.paymentType === "bank" && !expenseForm.bankAccountId) {
    alert("Select bank account for bank expense");
    return;
  }

  const payload = {
    date: expenseForm.date,
    title: expenseForm.title,
    amount: Number(expenseForm.amount || 0),
    paymentType: expenseForm.paymentType,
    bankAccountId: expenseForm.paymentType === "bank" ? expenseForm.bankAccountId : null,
    note: expenseForm.note,
  };

  if (expenseForm.id) {
    await http.put(`/expenses/${expenseForm.id}`, payload);
  } else {
    await http.post("/expenses", payload);
  }

  closeExpenseModal();
  await load();
};

const closeExpenseModal = () => {
  expenseForm.id = "";
  expenseForm.date = filters.date;
  expenseForm.title = "";
  expenseForm.amount = 0;
  expenseForm.paymentType = "cash";
  expenseForm.bankAccountId = "";
  expenseForm.note = "";
  showExpenseModal.value = false;
};

const openAddExpense = () => {
  closeExpenseModal();
  expenseForm.date = filters.date;
  showExpenseModal.value = true;
};

const editExpense = (row) => {
  expenseForm.id = row.billId;
  expenseForm.date = row.date ? new Date(row.date).toISOString().slice(0, 10) : filters.date;
  expenseForm.title = row.partyName || "";
  expenseForm.amount = Number(row.amount || 0);
  expenseForm.paymentType = row.paymentType || "cash";
  expenseForm.bankAccountId = row.bankAccountId || "";
  expenseForm.note = row.note || "";
  showExpenseModal.value = true;
};

const deleteExpense = async (row) => {
  if (!window.confirm(`Delete expense "${row.partyName || "Expense"}"?`)) {
    return;
  }
  await http.delete(`/expenses/${row.billId}`);
  await load();
};

const saveBankAccount = async () => {
  if (!bankForm.accountName || !bankForm.accountNumber) {
    alert("Account name and account number are required");
    return;
  }

  await http.post("/bank-accounts", {
    accountName: bankForm.accountName,
    accountNumber: bankForm.accountNumber,
    balance: Number(bankForm.balance || 0),
  });

  bankForm.accountName = "";
  bankForm.accountNumber = "";
  bankForm.balance = 0;
  showBankModal.value = false;
  await load();
};

const resetFilters = async () => {
  filters.date = today;
  filters.paymentType = "all";
  filters.type = "all";
  filters.search = "";
  closeExpenseModal();
  await load();
};

watch(
  () => filters.search,
  () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 300);
  },
);

onMounted(load);

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
});
</script>

<style scoped>
.report-page {
  padding: 20px;
}

.report-head {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.head-card,
.summary-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.head-card {
  display: grid;
  gap: 4px;
}

.align-right {
  text-align: right;
}

.head-label,
.summary-card span,
.field span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.field {
  display: grid;
  gap: 6px;
}

.field.search {
  min-width: 220px;
}

input,
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #2563eb;
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
}

.btn.primary {
  background: #2563eb;
  color: #fff;
}

.btn.secondary {
  background: #fff;
  color: #2563eb;
}

.btn.ghost {
  background: #fff;
  color: #2563eb;
}

.table-wrap {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f8fafc;
  font-weight: 700;
  color: #334155;
}

tbody tr:hover {
  background: #f8fafc;
}

.num {
  text-align: right;
}

.capitalize {
  text-transform: capitalize;
}

.empty {
  text-align: center;
  color: #6b7280;
  padding: 20px;
}

.summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.summary-card {
  display: grid;
  gap: 6px;
}

@media (max-width: 1100px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }

  .actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .report-head,
  .summary,
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .align-right {
    text-align: left;
  }
}

.opening-edit {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
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
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.history-modal {
  width: min(760px, 96vw);
}

.history-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 12px;
  align-items: end;
}

.history-actions {
  display: flex;
  justify-content: flex-end;
}

.history-table {
  max-height: 380px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 8px;
  width: 32px;
  height: 32px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
