<template>
  <div>
    <h2 class="page-title">Products</h2>

    <div class="toolbar">
      <input v-model="search" placeholder="Search by name or SKU..." />
      <router-link to="/products/create" class="btn-primary">+ Add Product</router-link>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th>Attributes</th>
          <th>GST</th>
          <th>Current Stock Qty</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="filteredProducts.length === 0">
          <td colspan="6" class="empty">No products found</td>
        </tr>

        <tr v-for="p in filteredProducts" :key="p._id">
          <td>{{ p.name }}</td>
          <td>{{ p.sku }}</td>
          <td>
            <div v-if="p.attributes && Object.keys(p.attributes).length" class="attrs">
              <div v-for="(val, key) in p.attributes" :key="key">
                <strong>{{ key }}:</strong> {{ val }}
              </div>
            </div>
            <span v-else>-</span>
          </td>
          <td>{{ p.gst ?? 0 }}%</td>
          <td>{{ stockMap[p._id] ?? "-" }}</td>
          <td class="actions">
            <router-link :to="`/products/edit/${p._id}`" class="link">Edit</router-link>
            <router-link :to="`/opening-stock/${p._id}`" class="link secondary">Opening Stock</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { getProductsApi } from "@/api/productApi";
import http from "@/api/http";

const products = ref([]);
const stockMap = ref({});
const search = ref("");

onMounted(async () => {
  try {
    const res = await getProductsApi();
    products.value = res.data;

    const entries = await Promise.all(
      products.value.map(async (product) => {
        const stock = await http.get(`/stock/${product._id}`);
        return [product._id, stock.data.stock ?? 0];
      }),
    );
    stockMap.value = Object.fromEntries(entries);
  } catch (err) {
    console.error("Failed to load products", err);
  }
});

const filteredProducts = computed(() => {
  if (!search.value) return products.value;
  const q = search.value.toLowerCase();
  return products.value.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q),
  );
});
</script>

<style scoped>
.page-title {
  font-size: 22px;
  margin-bottom: 15px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

input {
  padding: 8px;
  width: 260px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  vertical-align: top;
}

.attrs div {
  font-size: 13px;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 10px;
}

.link {
  color: #2563eb;
  font-weight: 500;
}

.secondary {
  color: #059669;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  text-decoration: none;
}

@media (max-width: 600px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  input {
    width: 100%;
  }
}
</style>
