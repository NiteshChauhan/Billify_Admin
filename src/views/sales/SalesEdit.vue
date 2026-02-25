<template>
  <div class="card" v-if="loaded">
    <h2>Edit Sales Invoice</h2>

    <!-- CUSTOMER -->
    <label>Customer</label>
    <select v-model="vendorId">
      <option value="">Select Customer</option>
      <option
        v-for="v in vendors"
        :key="v._id"
        :value="String(v._id)"
      >
        {{ v.name }}
      </option>
    </select>

    <!-- ITEMS -->
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
            <select v-model="i.productId">
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

          <td>
            <input type="number" v-model.number="i.quantity" min="1" />
          </td>

          <td>
            <input type="number" v-model.number="i.rate" min="0" />
          </td>

          <td>₹ {{ i.quantity * i.rate || 0 }}</td>

          <td>
            <button @click="remove(idx)">❌</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button @click="add">+ Add Item</button>

    <!-- TAX -->
    <label>Tax</label>
    <input type="number" v-model.number="tax" />

    <!-- PAID -->
    <label>Paid Amount</label>
    <input type="number" v-model.number="paidAmount" />

    <div class="total">
      <strong>Total: ₹ {{ total }}</strong>
    </div>

    <button class="save" @click="update">
      Update Invoice
    </button>
  </div>

  <div v-else class="loading">
    Loading invoice...
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import {
  getSalesByIdApi,
  updateSalesApi
} from "@/api/salesApi";

const router = useRouter();
const route = useRoute();

const vendors = ref([]);
const products = ref([]);

const vendorId = ref("");
const items = ref([]);
const tax = ref(0);
const paidAmount = ref(0);

const loaded = ref(false);

onMounted(async () => {
  const id = route.params.id;

  // Load dropdown data
  vendors.value = (await http.get("/vendors")).data;
  products.value = (await http.get("/products")).data;

  // Load invoice data
  const res = await getSalesByIdApi(id);
  const data = res.data;

  // ✅ Normalize vendorId
  vendorId.value = String(
    data.vendorId?._id || data.vendorId || ""
  );

  tax.value = data.tax || 0;
  paidAmount.value = data.paidAmount || 0;

  // ✅ Normalize items
  items.value = data.items.map((i) => ({
    productId: String(
      i.productId?._id || i.productId || ""
    ),
    quantity: i.quantity,
    rate: i.rate
  }));

  loaded.value = true;
});

const add = () =>
  items.value.push({
    productId: "",
    quantity: 1,
    rate: 0
  });

const remove = (i) =>
  items.value.splice(i, 1);

const total = computed(
  () =>
    items.value.reduce(
      (t, i) => t + i.quantity * i.rate,
      0
    ) + tax.value
);

const update = async () => {
  const id = route.params.id;

  await updateSalesApi(id, {
    vendorId: vendorId.value,
    items: items.value,
    tax: tax.value,
    paidAmount: paidAmount.value
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

.total {
  margin-top: 15px;
  font-size: 18px;
}

.save {
  background: #2563eb;
  color: white;
  padding: 10px;
  margin-top: 15px;
  width: 100%;
  border: none;
  border-radius: 6px;
}

.loading {
  text-align: center;
  margin-top: 100px;
}
</style>