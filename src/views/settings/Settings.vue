<template>
  <div class="settings-page">
    <div class="page-head">
      <div>
        <h2>Settings</h2>
        <p>Manage company profile, bank accounts, opening balance, and password.</p>
      </div>
    </div>

    <div class="tab-row">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <section v-if="activeTab === 'company'" class="panel">
      <div class="panel-head">
        <h3>Company Profile</h3>
        <span v-if="companyMessage" class="message">{{ companyMessage }}</span>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>Name</span>
          <input v-model.trim="companyForm.name" type="text" />
        </label>
        <label class="field">
          <span>Mobile</span>
          <input v-model.trim="companyForm.mobile" type="text" />
        </label>
        <label class="field">
          <span>Email</span>
          <input v-model.trim="companyForm.email" type="email" />
        </label>
        <label class="field">
          <span>GST</span>
          <input v-model.trim="companyForm.gstNumber" type="text" />
        </label>
        <label class="field">
          <span>Currency</span>
          <select v-model="companyForm.currencySymbol" @change="handleCurrencyChange">
            <option value="Rs">Rs</option>
            <option value="$">$</option>
            <option value="KWD">KWD</option>
            <option value="AED">AED</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label class="field">
          <span>Currency Decimals</span>
          <input v-model.number="companyForm.currencyDecimals" type="number" min="0" max="6" />
        </label>
        <label class="field full">
          <span>Address</span>
          <textarea v-model.trim="companyForm.address" rows="4" />
        </label>
      </div>
      <div class="actions">
        <button class="btn primary" @click="saveCompany">Save Profile</button>
      </div>
    </section>

    <section v-if="activeTab === 'banks'" class="panel">
      <div class="panel-head">
        <h3>Bank Accounts</h3>
        <button class="btn primary" @click="openBankModal()">Add Account</button>
      </div>
      <p v-if="bankMessage" class="message">{{ bankMessage }}</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Account Number</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!bankAccounts.length">
              <td colspan="4" class="empty">No bank accounts found</td>
            </tr>
            <tr v-for="account in bankAccounts" :key="account._id">
              <td>{{ account.accountName }}</td>
              <td>{{ account.accountNumber }}</td>
              <td>{{ money(account.balance) }}</td>
              <td class="row-actions">
                <button class="btn ghost" @click="openBankModal(account)">Edit</button>
                <button class="btn danger" @click="removeBankAccount(account)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="activeTab === 'opening'" class="panel">
      <div class="panel-head">
        <h3>Opening Balance</h3>
        <span v-if="openingMessage" class="message">{{ openingMessage }}</span>
      </div>
      <div class="form-grid short">
        <label class="field">
          <span>Date</span>
          <input v-model="openingForm.date" type="date" @change="loadOpeningBalance" />
        </label>
        <label class="field">
          <span>Opening Balance</span>
          <input v-model.number="openingForm.openingBalance" type="number" step="0.01" />
        </label>
      </div>
      <div class="actions">
        <button class="btn primary" @click="saveOpeningBalance">Save Opening Balance</button>
      </div>
    </section>

    <section v-if="activeTab === 'password'" class="panel">
      <div class="panel-head">
        <h3>Change Password</h3>
        <span v-if="passwordMessage" class="message">{{ passwordMessage }}</span>
      </div>
      <div class="form-grid short">
        <label class="field">
          <span>Old Password</span>
          <input v-model="passwordForm.oldPassword" type="password" />
        </label>
        <label class="field">
          <span>New Password</span>
          <input v-model="passwordForm.newPassword" type="password" />
        </label>
        <label class="field">
          <span>Confirm New Password</span>
          <input v-model="passwordForm.confirmPassword" type="password" />
        </label>
      </div>
      <div class="actions">
        <button class="btn primary" @click="changePassword">Update Password</button>
      </div>
    </section>

    <div v-if="showBankModal" class="modal-wrap">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ bankForm.id ? "Edit Bank Account" : "Add Bank Account" }}</h3>
          <button class="close-btn" @click="closeBankModal">X</button>
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
          <input v-model.number="bankForm.balance" type="number" step="0.01" />
        </label>
        <div class="actions">
          <button class="btn primary" @click="saveBankAccount">Save</button>
          <button class="btn secondary" @click="closeBankModal">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import http from "@/api/http";
import { useCurrency } from "@/composables/useCurrency";
import { notifySuccess, notifyWarning } from "@/utils/notifications";

const today = new Date().toISOString().slice(0, 10);

const tabs = [
  { key: "company", label: "Company Profile" },
  { key: "banks", label: "Bank Accounts" },
  { key: "opening", label: "Opening Balance" },
  { key: "password", label: "Change Password" },
];

const activeTab = ref("company");
const companyMessage = ref("");
const bankMessage = ref("");
const openingMessage = ref("");
const passwordMessage = ref("");
const bankAccounts = ref([]);
const showBankModal = ref(false);
const { formatCurrency: money, setCurrency, currencyConfig } = useCurrency();

const companyForm = reactive({
  name: "",
  mobile: "",
  email: "",
  address: "",
  gstNumber: "",
  currencySymbol: "Rs",
  currencyDecimals: 2,
});

const handleCurrencyChange = () => {
  companyForm.currencyDecimals = currencyConfig[companyForm.currencySymbol] ?? 2;
};

const openingForm = reactive({
  date: today,
  openingBalance: 0,
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const bankForm = reactive({
  id: "",
  accountName: "",
  accountNumber: "",
  balance: 0,
});

const loadCompany = async () => {
  const { data } = await http.get("/settings/company");
  companyForm.name = data.name || "";
  companyForm.mobile = data.mobile || "";
  companyForm.email = data.email || "";
  companyForm.address = data.address || "";
  companyForm.gstNumber = data.gstNumber || "";
  companyForm.currencySymbol = data.currencySymbol || "Rs";
  companyForm.currencyDecimals = Number(data.currencyDecimals ?? currencyConfig[companyForm.currencySymbol] ?? 2);
  setCurrency({
    symbol: companyForm.currencySymbol,
    decimals: companyForm.currencyDecimals,
  });
};

const loadBankAccounts = async () => {
  const { data } = await http.get("/bank-accounts");
  bankAccounts.value = data || [];
};

const loadOpeningBalance = async () => {
  openingMessage.value = "";
  if (!openingForm.date) return;
  const { data } = await http.get("/company-balance", { params: { date: openingForm.date } });
  openingForm.openingBalance = Number(data?.openingBalance || 0);
};

const saveCompany = async () => {
  if (!companyForm.name) {
    notifyWarning("Company name is required");
    return;
  }
  await http.post("/settings/company", { ...companyForm });
  setCurrency({
    symbol: companyForm.currencySymbol,
    decimals: companyForm.currencyDecimals,
  });
  companyMessage.value = "Company profile saved";
  notifySuccess("Company profile saved.");
};

const openBankModal = (account = null) => {
  bankMessage.value = "";
  bankForm.id = account?._id || "";
  bankForm.accountName = account?.accountName || "";
  bankForm.accountNumber = account?.accountNumber || "";
  bankForm.balance = Number(account?.balance || 0);
  showBankModal.value = true;
};

const closeBankModal = () => {
  showBankModal.value = false;
  bankForm.id = "";
  bankForm.accountName = "";
  bankForm.accountNumber = "";
  bankForm.balance = 0;
};

const saveBankAccount = async () => {
  if (!bankForm.accountName || !bankForm.accountNumber) {
    notifyWarning("Account name and account number are required");
    return;
  }
  if (bankForm.id) {
    await http.put(`/bank-accounts/${bankForm.id}`, {
      accountName: bankForm.accountName,
      accountNumber: bankForm.accountNumber,
      balance: Number(bankForm.balance || 0),
    });
    bankMessage.value = "Bank account updated";
    notifySuccess("Bank account updated.");
  } else {
    await http.post("/bank-accounts", {
      accountName: bankForm.accountName,
      accountNumber: bankForm.accountNumber,
      balance: Number(bankForm.balance || 0),
    });
    bankMessage.value = "Bank account added";
    notifySuccess("Bank account added.");
  }
  closeBankModal();
  await loadBankAccounts();
};

const removeBankAccount = async (account) => {
  if (!window.confirm(`Delete bank account "${account.accountName}"?`)) {
    return;
  }
  try {
    await http.delete(`/bank-accounts/${account._id}`);
    bankMessage.value = "Bank account deleted";
    notifySuccess("Bank account deleted.");
    await loadBankAccounts();
  } catch (err) {
    bankMessage.value = err.response?.data?.message || "Failed to delete bank account";
  }
};

const saveOpeningBalance = async () => {
  await http.post("/company-balance", {
    date: openingForm.date,
    openingBalance: Number(openingForm.openingBalance || 0),
  });
  openingMessage.value = "Opening balance saved";
  notifySuccess("Opening balance saved.");
};

const changePassword = async () => {
  passwordMessage.value = "";
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    notifyWarning("Old and new password are required");
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    notifyWarning("New password and confirm password do not match");
    return;
  }

  try {
    await http.post("/auth/change-password", {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
    passwordMessage.value = "Password updated successfully";
    notifySuccess("Password updated successfully.");
  } catch (err) {
    passwordMessage.value = err.response?.data?.message || "Failed to change password";
  }
};

onMounted(async () => {
  await Promise.all([loadCompany(), loadBankAccounts(), loadOpeningBalance()]);
});
</script>

<style scoped>
.settings-page {
  display: grid;
  gap: 16px;
}

.page-head h2,
.panel-head h3 {
  margin: 0;
}

.page-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tab-btn,
.btn {
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.tab-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.tab-btn.active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.panel,
.modal {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 14px;
}

.form-grid.short {
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

.field {
  display: grid;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field span,
.message {
  font-size: 13px;
  color: #64748b;
}

input,
textarea {
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
  margin-top: 16px;
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

.row-actions {
  display: flex;
  gap: 8px;
}

.empty {
  text-align: center;
  color: #64748b;
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
  .form-grid,
  .form-grid.short {
    grid-template-columns: 1fr;
  }

  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions,
  .row-actions {
    flex-wrap: wrap;
  }
}
</style>
