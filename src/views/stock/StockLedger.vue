<template>
  <div class="ledger-card">
    <h2>Stock History</h2>

    <div class="product-info">
      <strong>{{ product.name }}</strong>
      <span>Available Stock: {{ summary.totalInStock ?? 0 }}</span>
    </div>

    <table class="ledger-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Product</th>
          <th>Party Name</th>
          <th>Transaction Type</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Available Stock</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td>{{ formatDate(row.date) }}</td>
          <td>{{ product.name }}</td>
          <td>{{ row.partyName || '-' }}</td>
          <td>{{ formatType(row.type) }}</td>
          <td>{{ row.quantityDr > 0 ? row.quantityDr : row.quantityCr }}</td>
          <td>{{ row.price }}</td>
          <td>{{ row.remainingStock }}</td>
          <td>
            <router-link v-if="billRoute(row)" :to="billRoute(row)">View Bill</router-link>
            <span v-else>-</span>
          </td>
        </tr>
        <tr v-if="!rows.length"><td colspan="8" class="empty">No stock transactions found</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import http from "@/api/http";

const route = useRoute();
const productId = route.params.productId;

const product = ref({});
const rows = ref([]);
const summary = ref({});

onMounted(async () => {
  const res = await http.get(`/products/${productId}/history`);
  product.value = res.data.product || {};
  rows.value = res.data.rows || [];
  summary.value = res.data.summary || {};
});

const billRoute = (row) => {
  const refType = String(row.referenceType || "").toUpperCase();
  if (refType.includes("SALES")) return `/sales/${row.referenceId}`;
  if (refType.includes("PURCHASE")) return `/purchase/${row.referenceId}`;
  if (refType === "SALE_RETURN") return `/sales/${row.referenceId}`;
  if (refType === "PURCHASE_RETURN") return `/purchase/${row.referenceId}`;
  return "";
};

const formatType = (type) => {
  if (!type) return "-";
  return String(type).replaceAll("_", " ");
};

const formatDate = (d) => new Date(d).toLocaleDateString("en-IN");
</script>

<style scoped>
.ledger-card { background: #fff; border-radius: 12px; padding: 18px; }
.product-info { display: flex; justify-content: space-between; margin-bottom: 14px; }
.ledger-table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
.empty { text-align: center; color: #64748b; }
</style>
