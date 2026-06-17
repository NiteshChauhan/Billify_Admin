<template>
  <div class="card">
    <h2>Stock</h2>

    <div class="toolbar">
      <input v-model="search" placeholder="Search product" />
    </div>

    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Available Quantity</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filteredRows" :key="row._id">
          <td>{{ row.name }}</td>
          <td>{{ row.stock }}</td>
          <td><ActionIconButton icon="view" :to="`/stock-ledger/${row._id}`" title="View stock ledger" variant="view" /></td>
        </tr>
        <tr v-if="!filteredRows.length"><td colspan="3" class="empty">No products found</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import http from "@/api/http";
import ActionIconButton from "@/components/common/ActionIconButton.vue";

const search = ref("");
const rows = ref([]);

onMounted(async () => {
  const products = (await http.get("/products")).data || [];
  const withStock = await Promise.all(
    products.map(async (product) => {
      const stockRes = await http.get(`/stock/${product._id}`);
      return { ...product, stock: stockRes.data.stock || 0 };
    }),
  );
  rows.value = withStock;
});

const filteredRows = computed(() => {
  const q = search.value.toLowerCase();
  return rows.value.filter((row) => (row.name || "").toLowerCase().includes(q));
});
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.toolbar { margin-bottom: 10px; }
input { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; width: 280px; max-width: 100%; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.empty { text-align: center; color: #64748b; }
</style>
