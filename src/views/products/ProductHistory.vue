<template>
  <div class="card">
    <h2>Product History</h2>

    <div class="top">
      <div><strong>Product:</strong> {{ product.name }}</div>
      <div><strong>Total Available Stock:</strong> {{ summary.totalInStock || 0 }}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Party Name</th>
          <th>Type</th>
          <th>Date</th>
          <th>Quantity Dr</th>
          <th>Quantity Cr</th>
          <th>Price</th>
          <th>Bill Number</th>
          <th>Remaining Stock</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="idx">
          <td>{{ row.partyName || '-' }}</td>
          <td>{{ formatType(row.type) }}</td>
          <td>{{ fmt(row.date) }}</td>
          <td>{{ row.quantityDr || '-' }}</td>
          <td>{{ row.quantityCr || '-' }}</td>
          <td>{{ row.price }}</td>
          <td>{{ row.billNumber || '-' }}</td>
          <td>{{ row.remainingStock }}</td>
          <td>
            <router-link v-if="routeFor(row)" :to="routeFor(row)">View</router-link>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="summary">
      <div>Opening Stock: {{ summary.openingStock || 0 }}</div>
      <div>Opening Rate: {{ summary.openingRate || 0 }}</div>
      <div>Total Purchase: {{ summary.totalPurchase || 0 }}</div>
      <div>Total Sale: {{ summary.totalSale || 0 }}</div>
      <div>Total In Stock: {{ summary.totalInStock || 0 }}</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import http from "@/api/http";

const route = useRoute();
const product = ref({});
const summary = ref({});
const rows = ref([]);

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
const formatType = (t) => String(t || "").replaceAll("_", " ");

const routeFor = (row) => {
  const refType = String(row.referenceType || "").toUpperCase();
  if (refType.includes("SALES")) return `/sales/${row.referenceId}`;
  if (refType.includes("PURCHASE")) return `/purchase/${row.referenceId}`;
  if (refType === "SALE_RETURN") return `/sales/${row.referenceId}`;
  if (refType === "PURCHASE_RETURN") return `/purchase/${row.referenceId}`;
  return "";
};

onMounted(async () => {
  const res = await http.get(`/products/${route.params.id}/history`);
  product.value = res.data.product || {};
  summary.value = res.data.summary || {};
  rows.value = res.data.rows || [];
});
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.summary { margin-top: 14px; display: grid; gap: 6px; justify-content: end; text-align: right; }
</style>
