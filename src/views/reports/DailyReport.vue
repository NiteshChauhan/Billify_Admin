<template>
  <div class="report-page">
    <section class="top-grid">
      <div class="opening-card">
        <div class="card-title">Opening Balance</div>
        <div class="opening-row">
          <div class="opening-display">
            <span class="muted-label">Current</span>
            <strong>{{ money(summary.openingBalance) }}</strong>
          </div>
          <div class="opening-edit">
            <input type="number" v-model.number="openingBalanceInput" />
            <button class="btn primary" @click="saveOpeningBalance">Save</button>
          </div>
        </div>
      </div>

      <div class="date-card">
        <div class="card-title">Selected Date</div>
        <strong class="date-value">{{ headerDate }}</strong>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="filters-grid">
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
            <option value="sale_return">Sale Return</option>
            <option value="purchase_return">Purchase Return</option>
            <option value="payment">Payment</option>
            <option value="expense">Expense</option>
            <option value="loan">Loan</option>
          </select>
        </label>

        <label class="field search-field">
          <span>Search by Party Name</span>
          <input v-model.trim="filters.search" type="text" placeholder="Search by party name" />
        </label>

        <div class="filter-actions">
          <button class="btn secondary" @click="resetFilters">Reset</button>
        </div>
      </div>

      <div class="toolbar-actions">
        <button class="btn secondary" @click="openBalanceHistory">View Balance History</button>
        <button class="btn secondary" @click="showBankModal = true">Add Bank Account</button>
        <router-link class="btn secondary" to="/collection-transfers">Collection Transfer</router-link>
        <button class="btn primary" @click="openAddExpense">Add Expense</button>
      </div>
    </section>

    <Loader v-if="loading" />

    <div v-else class="daily-layout">
      <section class="book-panel">
        <div class="panel-head">
          <div>
            <h3>Daily Book</h3>
            <p>Main transaction table for the selected day.</p>
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
                <th class="num">Credit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!creditRows.length">
                <td colspan="7" class="empty">No data found</td>
              </tr>
              <tr v-for="row in creditRows" :key="rowKey(row)">
                <td>{{ formatDate(row.date) }}</td>
                <td>{{ typeLabel(row) }}</td>
                <td>{{ row.partyName || "Cash" }}</td>
                <td class="capitalize">{{ row.paymentType }}</td>
                <td>{{ rowReference(row) }}</td>
                <td class="num">{{ money(row.credit || 0) }}</td>
                <td>
                  <div class="action-cell">
                    <router-link
                      v-if="row.type === 'sale' || row.type === 'purchase'"
                      :to="row.type === 'sale' ? `/sales/${row.billId}` : `/purchase/${row.billId}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View bill" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'payment' && row.invoiceType === 'SALE' && row.billId"
                      :to="`/sales/${row.billId}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View sale bill" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'payment' && row.invoiceType === 'PURCHASE' && row.billId"
                      :to="`/purchase/${row.billId}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View purchase bill" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'sale_return'"
                      :to="`/sale-return?billId=${row.referenceId || ''}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View sale return" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'purchase_return'"
                      :to="`/purchase-return?billId=${row.referenceId || ''}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View purchase return" variant="view" @click="navigate" />
                    </router-link>
                    <template v-else>
                      <template v-if="row.type === 'expense'">
                        <ActionIconButton icon="edit" title="Edit expense" variant="edit" @click="editExpense(row)" />
                        <ActionIconButton icon="delete" title="Delete expense" variant="danger" @click="deleteExpense(row)" />
                      </template>
                      <router-link
                        v-else-if="row.type === 'loan'"
                        to="/loans"
                        custom
                        v-slot="{ navigate }"
                      >
                        <ActionIconButton icon="view" title="View loans" variant="view" @click="navigate" />
                      </router-link>
                      <span v-else>-</span>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="expense-summary">
          <div class="mini-total">
            <span>Daily Book Total (Cr)</span>
            <strong>{{ money(totalCredits) }}</strong>
          </div>
        </div>
      </section>

      <aside class="expense-panel">
        <div class="panel-head">
          <div>
            <h3>Expenses</h3>
            <p>Separate expense view for the selected day.</p>
          </div>
        </div>

        <div class="table-wrap expense-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Party</th>
                <th>Payment Type</th>
                <th>Reference</th>
                <th class="num">Debit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!debitRows.length">
                <td colspan="7" class="empty">No debit entries</td>
              </tr>
              <tr v-for="row in debitRows" :key="rowKey(row)">
                <td>{{ formatDate(row.date) }}</td>
                <td>{{ typeLabel(row) }}</td>
                <td>{{ row.partyName || row.note || "-" }}</td>
                <td class="capitalize">{{ row.paymentType }}</td>
                <td>{{ rowReference(row) }}</td>
                <td class="num">{{ money(row.debit || 0) }}</td>
                <td>
                  <div class="action-cell">
                    <router-link
                      v-if="row.type === 'sale' || row.type === 'purchase'"
                      :to="row.type === 'sale' ? `/sales/${row.billId}` : `/purchase/${row.billId}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View bill" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'payment' && row.invoiceType === 'SALE' && row.billId"
                      :to="`/sales/${row.billId}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View sale bill" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'payment' && row.invoiceType === 'PURCHASE' && row.billId"
                      :to="`/purchase/${row.billId}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View purchase bill" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'sale_return'"
                      :to="`/sale-return?billId=${row.referenceId || ''}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View sale return" variant="view" @click="navigate" />
                    </router-link>
                    <router-link
                      v-else-if="row.type === 'purchase_return'"
                      :to="`/purchase-return?billId=${row.referenceId || ''}`"
                      custom
                      v-slot="{ navigate }"
                    >
                      <ActionIconButton icon="view" title="View purchase return" variant="view" @click="navigate" />
                    </router-link>
                    <template v-else>
                      <template v-if="row.type === 'expense'">
                        <ActionIconButton icon="edit" title="Edit expense" variant="edit" @click="editExpense(row)" />
                        <ActionIconButton icon="delete" title="Delete expense" variant="danger" @click="deleteExpense(row)" />
                      </template>
                      <router-link
                        v-else-if="row.type === 'loan'"
                        to="/loans"
                        custom
                        v-slot="{ navigate }"
                      >
                        <ActionIconButton icon="view" title="View loans" variant="view" @click="navigate" />
                      </router-link>
                      <span v-else>-</span>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="expense-summary">
          <div class="mini-total">
            <span>Expenses Total (Dr)</span>
            <strong>{{ money(totalDebits) }}</strong>
          </div>
          <div class="mini-total">
            <span>Total Bank</span>
            <strong>{{ money(totalBank) }}</strong>
          </div>
          <div class="mini-total">
            <span>Total Cash</span>
            <strong>{{ money(totalCash) }}</strong>
          </div>
        </div>
      </aside>
    </div>

    <section v-if="!loading" class="summary-board">
      <div class="summary-row primary-row">
        <div class="summary-box">
          <span>Total Sales</span>
          <strong>{{ money(summary.totalSales) }}</strong>
        </div>
        <div class="summary-box">
          <span>Total Purchase</span>
          <strong>{{ money(summary.totalPurchase) }}</strong>
        </div>
        <div class="summary-box">
          <span>Payment Received</span>
          <strong>{{ money(summary.totalPaymentReceived) }}</strong>
        </div>
        <div class="summary-box">
          <span>Payment Paid</span>
          <strong>{{ money(summary.totalPaymentPaid) }}</strong>
        </div>
        <div class="summary-box">
          <span>Total Expenses</span>
          <strong>{{ money(summary.totalExpenses) }}</strong>
        </div>
      </div>

      <div class="summary-row secondary-row">
        <div class="summary-box">
          <span>Loan In</span>
          <strong>{{ money(summary.totalLoanIn) }}</strong>
        </div>
        <div class="summary-box">
          <span>Loan Out</span>
          <strong>{{ money(summary.totalLoanOut) }}</strong>
        </div>
        <div class="summary-box">
          <span>Collection In</span>
          <strong>{{ money(summary.totalCollectionTransferIn || 0) }}</strong>
        </div>
        <div class="summary-box">
          <span>Collection Out</span>
          <strong>{{ money(summary.totalCollectionTransferOut || 0) }}</strong>
        </div>
        <div class="summary-box">
          <span>Total Bank</span>
          <strong>{{ money(totalBank) }}</strong>
        </div>
        <div class="summary-box">
          <span>Total Cash</span>
          <strong>{{ money(totalCash) }}</strong>
        </div>
        <div class="summary-box closing-box">
          <span>Closing Balance</span>
          <strong>{{ money(summary.closingBalance) }}</strong>
        </div>
      </div>
    </section>

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
import { notifySuccess, notifyWarning } from "@/utils/notifications";
import Loader from "@/components/Loader.vue";
import ActionIconButton from "@/components/common/ActionIconButton.vue";

const today = new Date().toISOString().slice(0, 10);

const filters = reactive({
  date: today,
  paymentType: "all",
  type: "all",
  search: "",
});

const rows = ref([]);
const bankAccounts = ref([]);
const loading = ref(false);
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
const rowKey = (row) =>
  [
    row.type || "",
    row.billId || "",
    row.referenceId || "",
    row.date || "",
    row.note || "",
    row.amount || 0,
  ].join("-");
const typeLabel = (row) => {
  if (row.type === "payment") {
    return row.paymentDirection === "paid" ? "Payment Paid" : "Payment Received";
  }
  if (row.type === "loan") {
    return row.loanType === "loan_out" ? "Loan Out" : "Loan In";
  }
  if (row.type === "collection_transfer_in") return "Collection Transfer In";
  if (row.type === "collection_transfer_out") return "Collection Transfer Out";
  return ({
    sale: "Sale",
    purchase: "Purchase",
    sale_return: "Sale Return",
    purchase_return: "Purchase Return",
    payment: "Payment",
    expense: "Expense",
  }[row.type] || row.type);
};
const rowReference = (row) => {
  if (row.type === "sale_return" || row.type === "purchase_return") {
    return row.invoiceNo || "-";
  }
  if (row.type === "expense") {
    return row.note || row.bankAccountName || "-";
  }
  if (row.type === "loan") {
    return row.note || row.bankAccountName || "-";
  }
  if (row.type === "payment") {
    return row.referenceNo || (row.invoiceType === "OPENING" ? "Opening Balance" : row.bankAccountName || "-");
  }
  if (row.type === "collection_transfer_in" || row.type === "collection_transfer_out") {
    return row.referenceNo || row.note || "-";
  }
  return row.bankAccountName || "-";
};

const headerDate = computed(() => {
  const date = new Date(filters.date);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
});

const creditRows = computed(() =>
  rows.value.filter((row) => Number(row.credit || 0) > 0),
);

const debitRows = computed(() =>
  rows.value.filter((row) => Number(row.debit || 0) > 0),
);

const totalCredits = computed(() =>
  creditRows.value.reduce((sum, row) => sum + Number(row.credit || 0), 0),
);

const totalDebits = computed(() =>
  debitRows.value.reduce((sum, row) => sum + Number(row.debit || 0), 0),
);

const totalBank = computed(() =>
  rows.value.reduce((sum, row) => {
    if (String(row.paymentType || "").toLowerCase() !== "bank") return sum;
    return sum + Number(row.amount || 0);
  }, 0),
);

const totalCash = computed(() =>
  rows.value.reduce((sum, row) => {
    if (String(row.paymentType || "").toLowerCase() !== "cash") return sum;
    return sum + Number(row.amount || 0);
  }, 0),
);

const load = async () => {
  loading.value = true;
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
  loading.value = false;
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
  notifySuccess("Opening balance saved.");
  await load();
};

const saveExpense = async () => {
  if (!expenseForm.date || !expenseForm.title || Number(expenseForm.amount || 0) <= 0) {
    notifyWarning("Date, title and amount are required");
    return;
  }
  if (expenseForm.paymentType === "bank" && !expenseForm.bankAccountId) {
    notifyWarning("Select bank account for bank expense");
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
    notifySuccess("Expense updated successfully.");
  } else {
    await http.post("/expenses", payload);
    notifySuccess("Expense added successfully.");
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
  notifySuccess("Expense deleted successfully.");
  await load();
};

const saveBankAccount = async () => {
  if (!bankForm.accountName || !bankForm.accountNumber) {
    notifyWarning("Account name and account number are required");
    return;
  }

  await http.post("/bank-accounts", {
    accountName: bankForm.accountName,
    accountNumber: bankForm.accountNumber,
    balance: Number(bankForm.balance || 0),
  });

  notifySuccess("Bank account added successfully.");
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
  display: grid;
  gap: 16px;
}

.top-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  gap: 14px;
}

.opening-card,
.date-card,
.toolbar-card,
.book-panel,
.expense-panel,
.summary-box {
  background: #fff;
  border: 1px solid #d9e2ec;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.opening-card,
.date-card,
.toolbar-card,
.book-panel,
.expense-panel {
  padding: 16px;
}

.card-title,
.panel-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.panel-head p,
.muted-label,
.field span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.opening-row {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-top: 10px;
}

.opening-display {
  display: grid;
  gap: 4px;
}

.opening-display strong,
.date-value {
  font-size: 24px;
  line-height: 1.2;
}

.opening-edit {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-card {
  display: grid;
  align-content: center;
  gap: 8px;
}

.toolbar-card {
  display: grid;
  gap: 14px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
  gap: 12px;
  align-items: end;
}

.search-field {
  min-width: 220px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.field {
  display: grid;
  gap: 6px;
}

input,
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
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

.btn.secondary,
.btn.ghost {
  background: #fff;
  color: #2563eb;
}

.btn.danger {
  background: #fff1f2;
  border-color: #ef4444;
  color: #b91c1c;
}

.action-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.daily-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-head p {
  margin: 4px 0 0;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.expense-wrap table {
  min-width: 520px;
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

.expense-summary {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.mini-total {
  border: 1px solid #d9e2ec;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  background: #fcfdff;
}

.mini-total span,
.summary-box span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.summary-board {
  display: grid;
  gap: 12px;
}

.summary-row {
  display: grid;
  gap: 12px;
}

.primary-row {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.secondary-row {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.summary-box {
  padding: 14px 16px;
  display: grid;
  gap: 6px;
}

.closing-box {
  border-color: #2563eb;
  background: #eff6ff;
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

@media (max-width: 1240px) {
  .daily-layout {
    grid-template-columns: 1fr;
  }

  .primary-row,
  .secondary-row {
    grid-template-columns: repeat(3, minmax(160px, 1fr));
  }
}

@media (max-width: 1100px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }

  .filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .report-page,
  .summary-board {
    gap: 14px;
  }

  .top-grid,
  .filters-grid,
  .primary-row,
  .secondary-row,
  .history-filters {
    grid-template-columns: 1fr;
  }

  .opening-row,
  .toolbar-actions,
  .modal-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .opening-edit {
    width: 100%;
    flex-wrap: wrap;
  }

  .date-value {
    font-size: 20px;
  }

  .btn {
    width: 100%;
  }
}
</style>
