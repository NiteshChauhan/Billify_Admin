<template>
  <div class="card">
    <h2>Create Sales Invoice</h2>

    <label>Customer</label>
    <UserSelect
      v-model="vendorId"
      :users="vendorUsers"
      placeholder="Select Customer"
    />

    <label>Payment Type</label>
    <select v-model="paymentType">
      <option value="cash">Cash</option>
      <option value="bank">Bank</option>
      <option value="credit">Credit</option>
    </select>

    <template v-if="paymentType === 'bank'">
      <label>Bank Account</label>
      <select v-model="bankAccountId">
        <option value="">Select Bank Account</option>
        <option v-for="account in bankAccounts" :key="account._id" :value="account._id">
          {{ account.accountName }} - {{ account.accountNumber }}
        </option>
      </select>
    </template>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(i, idx) in items" :key="idx">
          <td>
            <select v-model="i.productId" @change="onProductChange(i)">
              <option value="">Select</option>
              <option v-for="p in products" :value="p._id">
                {{ p.name }}
              </option>
            </select>
          </td>
          <td><input type="number" v-model.number="i.quantity" /></td>
          <td>
            <input type="number" v-model.number="i.rate" />
            <small v-if="i.lastRate !== null" class="hint">Last rate: ₹ {{ i.lastRate }}</small>
          </td>
          <td>₹ {{ i.quantity * i.rate || 0 }}</td>
          <td>
            <button @click="remove(idx)">❌</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button @click="add">+ Add Item</button>

    <label>Tax</label>
    <input type="number" v-model.number="tax" />

    <label>Paid Amount (optional)</label>
    <input type="number" v-model.number="paidAmount" :disabled="paymentType !== 'credit'" />

    <div class="total">Total: ₹ {{ total }}</div>

    <button class="save" @click="save">Save Invoice</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import http from "@/api/http";
import { getUsersApi } from "@/api/userApi";
import { hasUserRole } from "@/utils/userRole";
import UserSelect from "@/components/UserSelect.vue";

const router = useRouter();

const users = ref([]);
const products = ref([]);
const bankAccounts = ref([]);

const vendorId = ref("");
const paymentType = ref("credit");
const bankAccountId = ref("");
const items = ref([{ productId: "", quantity: 1, rate: 0, lastRate: null }]);
const tax = ref(0);
const paidAmount = ref(0);

onMounted(async () => {
  users.value = (await getUsersApi()).data;
  products.value = (await http.get("/products")).data;
  bankAccounts.value = (await http.get("/bank-accounts")).data || [];
});

const vendorUsers = computed(() =>
  users.value.filter((user) => hasUserRole(user, "customer")),
);

const add = () => items.value.push({ productId: "", quantity: 1, rate: 0, lastRate: null });

const onProductChange = async (item) => {
  item.lastRate = null;
  if (!item.productId || !vendorId.value) return;
  const res = await http.get(`/products/${item.productId}/last-rate`, {
    params: { partyId: vendorId.value, type: "sale" },
  });
  item.lastRate = res.data?.lastRate ?? null;
  if (item.lastRate !== null) {
    item.rate = item.lastRate;
  }
};

const remove = (i) => items.value.splice(i, 1);

const total = computed(
  () => items.value.reduce((t, i) => t + i.quantity * i.rate, 0) + tax.value,
);

const save = async () => {
  if (!["cash", "bank", "credit"].includes(paymentType.value)) {
    alert("Payment type is required");
    return;
  }
  if (paymentType.value === "bank" && !bankAccountId.value) {
    alert("Bank account is required for bank payment");
    return;
  }

  if (paymentType.value === "credit" && !vendorId.value) {
    alert("Customer is required for credit");
    return;
  }

  const payloadItems = items.value
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

  await http.post("/sales", {
    partyId: vendorId.value || null,
    paymentType: paymentType.value,
    bankAccountId: paymentType.value === "bank" ? bankAccountId.value : null,
    items: payloadItems,
    tax: tax.value,
    paidAmount: paymentType.value === "credit" ? paidAmount.value : total.value,
  });

  router.push("/sales");
};
</script>

<style scoped>
.card {
  max-width: 900px;
  margin: auto;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

table {
  width: 100%;
  margin: 10px 0;
}

input,
select {
  width: 100%;
  padding: 6px;
}

.hint {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.save {
  background: #16a34a;
  color: white;
  padding: 10px;
  margin-top: 10px;
}
</style>
