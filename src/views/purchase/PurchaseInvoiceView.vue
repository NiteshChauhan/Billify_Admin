<template>
  <div class="invoice">
    <div class="top">
      <h2>Purchase Invoice</h2>

      <div class="actions">
        <button class="btn primary" @click="openPDF">Download PDF</button>
        <router-link class="btn secondary" to="/purchase">Back</router-link>
      </div>
    </div>

    <div class="block">
      <strong>{{ company.name }}</strong><br />
      {{ company.address }}
    </div>

    <div class="block">
      <strong>Supplier:</strong> {{ supplier.name }}<br />
      {{ supplier.phone }}
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="i in invoice.items" :key="i._id">
          <td>{{ i.productId?.name }}</td>
          <td>{{ i.quantity }}</td>
          <td>{{ money(i.rate) }}</td>
          <td>{{ money(i.amount) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div>Subtotal: {{ money(invoice.subtotal) }}</div>
      <div>Tax: {{ money(invoice.tax) }}</div>
      <div><strong>Total: {{ money(invoice.totalAmount) }}</strong></div>
      <div>Paid: {{ money(invoice.paidAmount) }}</div>
      <div>Status: {{ invoice.status }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import http from "@/api/http";
import { useCurrency } from "@/composables/useCurrency";

const route = useRoute();
const { formatCurrency: money } = useCurrency();

const invoice = ref({});
const company = ref({});
const supplier = ref({});

onMounted(async () => {
  const res = await http.get(`/purchase/${route.params.id}`);
  invoice.value = res.data.invoice;
  company.value = res.data.company;
  supplier.value = res.data.supplier;
});

const openPDF = () => {
  window.open(
    `${import.meta.env.VITE_API_URL}/invoice/purchase/${route.params.id}`,
    "_blank",
  );
};
</script>

<style scoped>
.invoice {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 20px;
}
.top {
  display: flex;
  justify-content: space-between;
}
.actions button {
  margin-right: 10px;
}
.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  text-decoration: none;
  cursor: pointer;
  font-weight: 600;
}
.btn.primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.btn.secondary {
  background: #fff;
  color: #2563eb;
}
.block {
  margin: 15px 0;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
}
.totals {
  margin-top: 20px;
  text-align: right;
}
</style>
