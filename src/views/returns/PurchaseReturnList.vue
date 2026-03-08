<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>Purchase Return List</h2>
      </div>
      <router-link class="btn" to="/entry?type=purchase_return">Add Bill</router-link>
    </div>

    <div class="filters">
      <label>From Date <input type="date" v-model="fromDate" /></label>
      <label>To Date <input type="date" v-model="toDate" /></label>
      <button class="btn-light" @click="load">Apply</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Date</th>
          <th>Supplier</th>
          <th>Return Number</th>
          <th>Total Amount</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="row._id">
          <td>{{ idx + 1 }}</td>
          <td>{{ formatDate(row.returnDate) }}</td>
          <td>{{ row.partyId?.name || '-' }}</td>
          <td>{{ row.returnNo || (`PR-${idx + 1}`) }}</td>
          <td>{{ money(row.totalAmount) }}</td>
          <td><router-link :to="`/purchase/${row.billId}`">View Bill</router-link></td>
        </tr>
        <tr v-if="!rows.length"><td colspan="6" class="empty">No return entries</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";

const rows = ref([]);
const fromDate = ref("");
const toDate = ref("");
const money = (n) => `Rs ${Number(n || 0).toFixed(2)}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const load = async () => {
  const params = { ...getFinancialYearParams(), billType: "PURCHASE" };
  if (fromDate.value) params.from = fromDate.value;
  if (toDate.value) params.to = toDate.value;
  const res = await http.get("/returns", {
    params,
  });
  rows.value = res.data || [];
};

onMounted(load);
</script>

<style scoped>
.card { background: #fff; border-radius: 12px; padding: 18px; }
.head { display: flex; justify-content: space-between; margin-bottom: 12px; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; align-items: end; }
.filters label { display: grid; gap: 6px; font-size: 13px; }
input { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
.btn { background: #0ea5e9; color: white; text-decoration: none; padding: 8px 12px; border-radius: 8px; }
.btn-light { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 9px 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
.empty { text-align: center; color: #64748b; }
</style>
