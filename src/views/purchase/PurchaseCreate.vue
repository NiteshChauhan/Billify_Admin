<template>
  <div class="invoice-card">
    <h2 class="title">Purchase Invoice</h2>

    <div class="header-grid">
      <div>
        <label>Bill Number</label>
        <input v-model.trim="form.invoiceNo" placeholder="Enter purchase bill number" />
      </div>

      <div>
        <label>Supplier</label>
        <UserSelect
          v-model="form.supplierId"
          :users="supplierUsers"
          placeholder="Select Supplier"
        />
      </div>

      <div>
        <label>Payment Type</label>
        <select v-model="form.paymentType">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      <div v-if="form.paymentType === 'bank'">
        <label>Bank Account</label>
        <select v-model="form.bankAccountId">
          <option value="">Select Bank Account</option>
          <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
            {{ account.accountName }} - {{ account.accountNumber }}
          </option>
        </select>
      </div>

      <div>
        <label>Invoice Date</label>
        <input type="date" v-model="form.invoiceDate" />
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Product</th>
          <th>Stock</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(i, index) in form.items" :key="index">
          <td>
            <select v-model="i.productId" @change="onProductChange(i)">
              <option value="">Select</option>
              <option v-for="p in products" :key="p._id" :value="p._id">
                {{ p.name }}
              </option>
            </select>
          </td>

          <td class="num">
            {{ i.availableStock ?? '-' }}
          </td>

          <td>
            <input type="number" min="1" v-model.number="i.quantity" />
          </td>

          <td>
            <input type="number" min="0" v-model.number="i.rate" />
            <small v-if="i.lastRate !== null" class="hint">Last rate: {{ money(i.lastRate) }}</small>
          </td>

          <td class="num">
            {{ money(i.quantity * i.rate || 0) }}
          </td>

          <td>
            <button class="remove" @click="removeItem(index)">X</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="add" @click="addItem">+ Add Item</button>

    <div class="totals">
      <div>Subtotal: {{ money(subtotal) }}</div>

      <div>
        Tax:
        <input type="number" v-model.number="form.tax" />
      </div>

      <div><strong>Total: {{ money(total) }}</strong></div>

      <div>
        Paid:
        <input type="number" v-model.number="form.paidAmount" :disabled="form.paymentType !== 'credit'" />
      </div>
    </div>

    <button class="btn-primary" @click="save">
      Save Purchase
    </button>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { createPurchaseApi } from "@/api/purchaseApi";
import http from "@/api/http";
import { getUsersApi } from "@/api/userApi";
import { hasUserRole } from "@/utils/userRole";
import UserSelect from "@/components/UserSelect.vue";
import { useRouter } from "vue-router";
import { useCurrency } from "@/composables/useCurrency";

const router = useRouter();
const { formatCurrency: money } = useCurrency();

const users = ref([]);
const products = ref([]);
const bankAccounts = ref([]);

const form = reactive({
  invoiceNo: "",
  supplierId: "",
  invoiceDate: "",
  paymentType: "credit",
  bankAccountId: "",
  items: [createItem()],
  tax: 0,
  paidAmount: 0,
});

function createItem() {
  return {
    productId: "",
    quantity: 1,
    rate: 0,
    availableStock: null,
    lastRate: null,
  };
}

onMounted(async () => {
  users.value = (await getUsersApi()).data;
  products.value = (await http.get("/products")).data;
  bankAccounts.value = (await http.get("/bank-accounts")).data || [];
});

const supplierUsers = computed(() =>
  users.value.filter((user) => hasUserRole(user, "supplier")),
);

const onProductChange = async (item) => {
  if (!item.productId) return;

  const product = products.value.find((p) => p._id === item.productId);

  const stockRes = await http.get(`/stock/${item.productId}`);
  item.availableStock = stockRes.data.stock;

  const lastRateRes = form.supplierId
    ? await http.get(`/products/${item.productId}/last-rate`, {
        params: { partyId: form.supplierId, type: "purchase" },
      })
    : { data: { lastRate: null } };
  item.lastRate = lastRateRes.data?.lastRate ?? null;
  item.rate = item.lastRate ?? product?.lastPurchaseRate ?? 0;
  item.quantity = 1;
};

const addItem = () => form.items.push(createItem());
const removeItem = (i) => form.items.splice(i, 1);

const subtotal = computed(() =>
  form.items.reduce((t, i) => t + i.quantity * i.rate, 0),
);

const total = computed(() => subtotal.value + form.tax);

const save = async () => {
  if (!form.invoiceNo?.trim()) {
    alert("Purchase bill number is required");
    return;
  }

  if (!["cash", "bank", "credit"].includes(form.paymentType)) {
    alert("Payment type is required");
    return;
  }
  if (form.paymentType === "bank" && !form.bankAccountId) {
    alert("Bank account is required for bank payment");
    return;
  }

  if (form.paymentType === "credit" && !form.supplierId) {
    alert("Supplier is required for credit");
    return;
  }

  const payloadItems = form.items
    .filter((i) => i.productId && Number(i.quantity) > 0 && Number(i.rate) > 0)
    .map((i) => ({
      productId: i.productId,
      quantity: Number(i.quantity),
      rate: Number(i.rate),
    }));

  if (!payloadItems.length) {
    alert("Add at least one valid product row");
    return;
  }

  await createPurchaseApi({
    invoiceNo: form.invoiceNo.trim(),
    invoiceDate: form.invoiceDate,
    paymentType: form.paymentType,
    bankAccountId: form.paymentType === "bank" ? form.bankAccountId : null,
    items: payloadItems,
    tax: Number(form.tax || 0),
    paidAmount: form.paymentType === "credit" ? Number(form.paidAmount || 0) : Number(total.value || 0),
    partyId: form.supplierId || null,
  });
  router.push("/purchase");
};
</script>
<style scoped>
.invoice-card {
  max-width: 1100px;
  margin: auto;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.title {
  margin-bottom: 15px;
}

.header-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

label {
  font-weight: 600;
  margin-bottom: 5px;
  display: block;
}

input,
select {
  width: 100%;
  padding: 8px;
}

.hint {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.items th,
.items td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
}

.num {
  text-align: right;
}

.add {
  margin-top: 10px;
}

.remove {
  background: #dc2626;
  color: white;
  border: none;
  padding: 4px 8px;
}

.totals {
  margin-top: 20px;
  text-align: right;
}

.btn-primary {
  margin-top: 20px;
  padding: 12px;
  width: 100%;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .header-grid {
    grid-template-columns: 1fr;
  }

  .items {
    font-size: 12px;
  }
}
</style>
