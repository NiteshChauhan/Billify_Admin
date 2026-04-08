<template>
  <div class="invoice">
    <h2>Sales Invoice</h2>

    <div class="info">
      <div><strong>Customer:</strong> {{ data.partyId?.name || data.customerId?.name || data.vendorId?.name }}</div>
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
          <td>{{ money(i.rate) }}</td>
          <td>{{ money(i.amount) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div>Subtotal: {{ money(data.subtotal) }}</div>
      <div>Tax: {{ money(data.tax) }}</div>
      <div><strong>Total: {{ money(data.totalAmount) }}</strong></div>
      <div>Paid: {{ money(data.paidAmount) }}</div>
      <div><strong>Balance: {{ money(balance) }}</strong></div>
    </div>

    <div class="actions">
      <router-link v-if="balance > 0" :to="`/sales/${data._id}/receipt`" class="btn green">+ Receive Payment</router-link>
      <button class="btn blue" @click="openPDF">Download PDF</button>
      <button class="btn orange" @click="createSaleReturn">Return Items</button>
      <router-link to="/sales" class="btn gray">Back</router-link>
    </div>

    <div v-if="payments.length" class="payments">
      <h3>Receipts</h3>
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
            <td>{{ formatDate(p.createdAt) }}</td>
            <td>{{ p.paymentMode }}</td>
            <td>{{ p.referenceNo || "-" }}</td>
            <td>{{ money(p.amount) }}</td>
            <td>
              <router-link :to="`/sales/${data._id}`">View Bill</router-link>
              |
              <router-link v-if="isSameDay(data.invoiceDate)" :to="`/sales/edit/${data._id}`">Edit Bill</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="returns.length" class="payments">
      <h3>Sale Returns</h3>
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
            <td>{{ money(r.totalAmount) }}</td>
            <td>
              <router-link :to="`/sale-return?billId=${data._id}`">View</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";

const route = useRoute();
const router = useRouter();
const data = ref({ items: [] });
const payments = ref([]);
const returns = ref([]);
const { formatCurrency: money } = useCurrency();

const load = async () => {
  data.value = (await http.get(`/sales/${route.params.id}`)).data;
  payments.value = (await http.get(`/payments/invoice/${route.params.id}`, { params: getFinancialYearParams() })).data;
  returns.value = (
    await http.get("/returns", { params: { billType: "SALE", billId: route.params.id } })
  ).data || [];
};

onMounted(load);

const balance = computed(() => (data.value.totalAmount || 0) - (data.value.paidAmount || 0));
const formatDate = (d) => new Date(d).toLocaleDateString();
const isSameDay = (d) => new Date(d).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

const openPDF = () => {
  window.open(`${import.meta.env.VITE_API_BASE_URL}/invoice-pdf/sales/${route.params.id}?token=${localStorage.getItem("token")}`, "_blank");
};

const createSaleReturn = async () => {
  router.push(`/entry?type=sale_return&billId=${data.value._id}`);
};
</script>

<style scoped>
.invoice { max-width: 900px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
.info { display: flex; justify-content: space-between; margin-bottom: 15px; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: right; }
.totals { margin-top: 15px; text-align: right; }
.actions { margin-top: 20px; display: flex; gap: 10px; }
.btn { padding: 8px 12px; text-decoration: none; color: white; border-radius: 5px; border: none; }
.green { background: #16a34a; }
.blue { background: #2563eb; }
.orange { background: #f59e0b; }
.gray { background: #6b7280; }
.payments { margin-top: 30px; }
</style>
