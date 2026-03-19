<template>
  <div class="invoice-card" v-if="loaded">
    <h2 class="title">Edit Purchase Invoice</h2>

    <!-- HEADER -->
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

      <div>
        <label>Invoice Date</label>
        <input type="date" v-model="form.invoiceDate" />
      </div>
    </div>

    <!-- ITEMS -->
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
                <option
                    v-for="p in products"
                    :key="p._id"
                    :value="String(p._id)"
                >
                    {{ p.name }}
                </option>
            </select>
          </td>

          <td class="num">
            {{ i.availableStock ?? "-" }}
          </td>

          <td>
            <input type="number" min="1" v-model.number="i.quantity" />
          </td>

          <td>
            <input type="number" min="0" v-model.number="i.rate" />
          </td>

          <td class="num">
            {{ i.quantity * i.rate || 0 }}
          </td>

          <td>
            <button class="remove" @click="removeItem(index)">×</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="add" @click="addItem">+ Add Item</button>

    <!-- TOTALS -->
    <div class="totals">
      <div>Subtotal: ₹ {{ subtotal }}</div>

      <div>
        Tax:
        <input type="number" v-model.number="form.tax" />
      </div>

      <div><strong>Total: ₹ {{ total }}</strong></div>

      <div>
        Paid:
        <input type="number" v-model.number="form.paidAmount" :disabled="form.paymentType !== 'credit'" />
      </div>
    </div>

    <button class="btn-primary" @click="update">
      Update Purchase
    </button>
  </div>

  <div v-else class="loading">
    Loading invoice...
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import http from "@/api/http";
import { getUsersApi } from "@/api/userApi";
import { hasUserRole } from "@/utils/userRole";
import UserSelect from "@/components/UserSelect.vue";
import {
  getPurchaseByIdApi,
  updatePurchaseApi
} from "@/api/purchaseApi";

const router = useRouter();
const route = useRoute();

const users = ref([]);
const products = ref([]);
const loaded = ref(false);

const form = reactive({
  invoiceNo: "",
  supplierId: "",
  invoiceDate: "",
  items: [],
  paymentType: "credit",
  tax: 0,
  paidAmount: 0
});

function createItem() {
  return {
    productId: "",
    quantity: 1,
    rate: 0,
    availableStock: null
  };
}

onMounted(async () => {
  const id = route.params.id;

  // Load dropdown data
  users.value = (await getUsersApi()).data;
  products.value = (await http.get("/products")).data;

  // Load purchase data
  const res = await getPurchaseByIdApi(id);
  const data = res.data;

  // ✅ Convert supplierId to string
  form.supplierId = String(
    data.partyId?._id || data.supplierId?._id || data.partyId || data.supplierId || ""
  );

  form.invoiceDate = data.invoiceDate?.substring(0, 10);
  form.invoiceNo = data.invoiceNo || "";
  form.tax = data.tax || 0;
  form.paidAmount = data.paidAmount || 0;
  form.paymentType = (data.paymentType || "credit").toString().toLowerCase();

  // ✅ Normalize items
  form.items = data.items.map(item => ({
    productId: String(
      item.productId?._id || item.productId || ""
    ),
    quantity: item.quantity,
    rate: item.rate,
    availableStock: null
  }));

  loaded.value = true;
});

const supplierUsers = computed(() =>
  users.value.filter((user) => hasUserRole(user, "supplier")),
);

/* 🔄 Product change */
const onProductChange = async (item) => {
  if (!item.productId) return;

  const product = products.value.find(p => p._id === item.productId);

  const stockRes = await http.get(`/stock/${item.productId}`);
  item.availableStock = stockRes.data.stock;

  item.rate = product?.lastPurchaseRate || 0;
  item.quantity = 1;
};

const addItem = () => form.items.push(createItem());
const removeItem = i => form.items.splice(i, 1);

const subtotal = computed(() =>
  form.items.reduce((t, i) => t + i.quantity * i.rate, 0)
);

const total = computed(() => subtotal.value + form.tax);

const update = async () => {
  if (!form.invoiceNo?.trim()) {
    alert("Purchase bill number is required");
    return;
  }

  if (!["cash", "bank", "credit"].includes(form.paymentType)) {
    alert("Payment type is required");
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

  const id = route.params.id;
  await updatePurchaseApi(id, {
    invoiceNo: form.invoiceNo.trim(),
    invoiceDate: form.invoiceDate,
    paymentType: form.paymentType,
    items: payloadItems,
    tax: Number(form.tax || 0),
    paidAmount:
      form.paymentType === "credit" ? Number(form.paidAmount || 0) : Number(total.value || 0),
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

.loading {
  text-align: center;
  margin-top: 100px;
}
</style>
