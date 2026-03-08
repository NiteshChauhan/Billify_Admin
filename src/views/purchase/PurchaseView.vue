<template>
  <div class="invoice">
    <h2>Purchase Invoice</h2>

    <div class="info">
      <div><strong>Supplier:</strong> {{ data.partyId?.name || data.supplierId?.name }}</div>
      <div><strong>Date:</strong> {{ formatDate(data.invoiceDate) }}</div>
      <div><strong>Status:</strong> {{ data.status }}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align: left">Product</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in data.items" :key="i._id">
          <td style="text-align: left">{{ i.productId?.name }}</td>
          <td>{{ i.quantity }}</td>
          <td>Rs {{ i.rate }}</td>
          <td>Rs {{ i.amount }}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div>Subtotal: Rs {{ data.subtotal }}</div>
      <div>Tax: Rs {{ data.tax }}</div>
      <div><strong>Total: Rs {{ data.totalAmount }}</strong></div>
      <div>Paid: Rs {{ data.paidAmount }}</div>
    </div>

    <div class="payments" v-if="payments.length">
      <h3>Payments</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Mode</th>
            <th>Ref No</th>
            <th>Amount</th>
            <th>Bill</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p._id">
            <td>{{ formatDate(p.paymentDate) }}</td>
            <td>{{ p.paymentMode }}</td>
            <td>{{ p.referenceNo || "-" }}</td>
            <td>Rs {{ p.amount }}</td>
            <td>
              <router-link :to="`/purchase/${data._id}`">View Bill</router-link>
              |
              <router-link v-if="isSameDay(data.invoiceDate)" :to="`/purchase/edit/${data._id}`">Edit Bill</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="payments" v-if="returns.length">
      <h3>Purchase Returns</h3>
      <table>
        <thead>
          <tr>
            <th>Return Invoice</th>
            <th>Date</th>
            <th>Amount</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in returns" :key="r._id">
            <td>{{ r.returnNo || "-" }}</td>
            <td>{{ formatDate(r.returnDate) }}</td>
            <td>Rs {{ r.totalAmount }}</td>
            <td>
              <router-link :to="`/purchase-return?billId=${data._id}`">View</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button @click="openPDF">Download PDF</button>
    <button @click="createPurchaseReturn">Return Items</button>
    <router-link class="btn" :to="`/purchase/${data._id}/payment`">Make Payment</router-link>
    <router-link to="/purchase">Back</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { useAuthStore } from "@/stores/authStore";
import { getFinancialYearParams } from "@/utils/financialYear";

const route = useRoute();
const router = useRouter();
const data = ref({ items: [] });
const payments = ref([]);
const returns = ref([]);

const load = async () => {
  data.value = (await http.get(`/purchase/${route.params.id}`)).data;
  payments.value = (await http.get(`/payments/invoice/${route.params.id}`, { params: getFinancialYearParams() })).data;
  returns.value = (
    await http.get("/returns", { params: { billType: "PURCHASE", billId: route.params.id } })
  ).data || [];
};

onMounted(load);

const formatDate = (d) => new Date(d).toLocaleDateString();
const isSameDay = (d) => new Date(d).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

const auth = useAuthStore();
const openPDF = () => {
  const token = auth.token;
  window.open(`${import.meta.env.VITE_API_BASE_URL}/invoice-pdf/purchase/${route.params.id}?token=${token}`, "_blank");
};

const createPurchaseReturn = async () => {
  router.push(`/entry?type=purchase_return&billId=${data.value._id}`);
};
</script>

<style scoped>
.invoice { max-width: 900px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
.info { display: flex; justify-content: space-between; margin-bottom: 15px; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: right; }
.totals { text-align: right; margin-top: 20px; }
</style>
