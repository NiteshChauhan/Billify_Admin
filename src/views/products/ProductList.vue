<template>
  <div class="card">
    <div class="head">
      <h2>Product List</h2>
      <div class="head-actions">
        <button class="btn-light" @click="downloadSampleCsv">Download Sample CSV</button>
        <button class="btn-light" @click="triggerUpload">Upload CSV</button>
        <button class="btn" @click="openCreate">Add Product</button>
      </div>
    </div>
    <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden-input" @change="handleCsvUpload" />
    <p v-if="uploadMessage" class="upload-message">{{ uploadMessage }}</p>

    <div class="toolbar">
      <input v-model="search" placeholder="Search Product" />
      <select v-model="stockFilter">
        <option value="all">All</option>
        <option value="available">Available</option>
        <option value="not_available">Not Available</option>
      </select>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Product Name</th>
          <th>Opening Stock</th>
          <th>In Stock</th>
          <th>Total Stock</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, idx) in filteredRows" :key="p._id">
          <td>{{ idx + 1 }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.openingStock }}</td>
          <td>{{ p.inStock }}</td>
          <td>{{ p.totalStock }}</td>
          <td>{{ p.inStock > 0 ? 'Available' : 'Not Available' }}</td>
          <td class="actions">
            <router-link :to="`/products/${p._id}/history`">View</router-link>
            <button @click="openEdit(p)">Edit</button>
          </td>
        </tr>
        <tr v-if="!filteredRows.length"><td colspan="7" class="empty">No products found</td></tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-wrap">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ editId ? 'Edit Product' : 'Add Product' }}</h3>
          <button class="modal-close" @click="closeModal" aria-label="Close">X</button>
        </div>
        <label>Product Name <input v-model="form.name" /></label>
        <label>SKU <input v-model="form.sku" /></label>
        <label>Opening Stock <input type="number" min="0" step="0.01" v-model.number="form.openingStock" /></label>
        <label>Price <input type="number" min="0" step="0.01" v-model.number="form.price" /></label>
        <label>Opening Rate (Cost) <input type="number" min="0" step="0.01" v-model.number="form.openingRate" /></label>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="save">Save</button>
          <button class="btn-light btn-secondary" @click="closeModal">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import http from "@/api/http";

const rows = ref([]);
const search = ref("");
const stockFilter = ref("all");

const showModal = ref(false);
const editId = ref("");
const form = reactive({ name: "", sku: "", openingStock: 0, price: 0, openingRate: 0 });
const fileInput = ref(null);
const uploadMessage = ref("");

const load = async () => {
  const products = (await http.get("/products")).data || [];
  const enriched = await Promise.all(
    products.map(async (p) => {
      const history = (await http.get(`/products/${p._id}/history`)).data;
      const summary = history.summary || {};
      return {
        ...p,
        openingStock: summary.openingStock || 0,
        inStock: summary.totalInStock || 0,
        totalStock: (summary.openingStock || 0) + (summary.totalPurchase || 0),
      };
    }),
  );
  rows.value = enriched;
};

onMounted(load);

const filteredRows = computed(() => {
  const q = search.value.toLowerCase();
  return rows.value
    .filter((p) => (p.name || "").toLowerCase().includes(q))
    .filter((p) => {
      if (stockFilter.value === "available") return p.inStock > 0;
      if (stockFilter.value === "not_available") return p.inStock <= 0;
      return true;
    });
});

const openCreate = () => {
  editId.value = "";
  form.name = "";
  form.sku = "";
  form.openingStock = 0;
  form.price = 0;
  form.openingRate = 0;
  showModal.value = true;
};

const openEdit = (product) => {
  editId.value = product._id;
  form.name = product.name || "";
  form.sku = product.sku || "";
  form.openingStock = Number(product.openingStock || 0);
  form.price = Number(product.price || 0);
  form.openingRate = Number(product.openingRate || 0);
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const downloadSampleCsv = async () => {
  const res = await http.get("/products/sample-csv", { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "products-sample.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const triggerUpload = () => {
  fileInput.value?.click();
};

const handleCsvUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const csvText = await file.text();
  const res = await http.post("/products/bulk-upload", { csvText });
  uploadMessage.value = `Inserted: ${res.data.insertedCount}, Skipped: ${res.data.skippedCount}, Errors: ${res.data.errorCount}`;
  event.target.value = "";
  await load();
};

const save = async () => {
  if (!form.name || !form.sku) {
    alert("Name and SKU are required");
    return;
  }

  if (editId.value) {
    await http.put(`/products/${editId.value}`, {
      name: form.name,
      sku: form.sku,
      openingStock: Number(form.openingStock || 0),
      price: Number(form.price || 0),
      openingRate: Number(form.openingRate || 0),
    });
  } else {
    await http.post("/products", {
      name: form.name,
      sku: form.sku,
      openingStock: Number(form.openingStock || 0),
      price: Number(form.price || 0),
      openingRate: Number(form.openingRate || 0),
    });
  }

  closeModal();
  await load();
};
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.head { display: flex; justify-content: space-between; margin-bottom: 10px; }
.head-actions { display: flex; gap: 8px; align-items: center; }
.toolbar { display: flex; gap: 10px; margin-bottom: 10px; }
input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.actions { display: flex; gap: 8px; align-items: center; }
.actions button { border: none; background: none; color: #2563eb; cursor: pointer; }
.empty { text-align: center; color: #64748b; }
.btn { background: #0ea5e9; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.btn-light { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 8px; padding: 8px 12px; }
.hidden-input { display: none; }
.upload-message { margin: 8px 0 12px; color: #475569; }
.modal-wrap { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.45); display: grid; place-items: center; }
.modal { width: min(420px, 92vw); background: #fff; border-radius: 12px; padding: 16px; display: grid; gap: 10px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; }
.modal label { display: grid; gap: 6px; }
.modal-actions { display: flex; justify-content: end; gap: 8px; }
.modal-close {
  border: 1px solid #ef4444;
  background: #fff1f2;
  color: #b91c1c;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-weight: 700;
}
</style>
