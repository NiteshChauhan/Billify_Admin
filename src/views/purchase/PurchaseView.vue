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
          <td>{{ money(i.rate) }}</td>
          <td>{{ money(i.amount) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div>Subtotal: {{ money(data.subtotal) }}</div>
      <div v-if="gstEnabled">Tax: {{ money(data.tax) }}</div>
      <div><strong>Total: {{ money(data.totalAmount) }}</strong></div>
      <div>Paid: {{ money(data.paidAmount) }}</div>
    </div>

    <div class="payments" v-if="payments.length">
      <h3>Payments</h3>
      <label class="payment-toggle">
        <input v-model="showDeletedPayments" type="checkbox" @change="load" />
        Show deleted payments
      </label>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Mode</th>
            <th>Ref No</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Bill</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p._id">
            <td>{{ formatDate(p.paymentDate) }}</td>
            <td>{{ p.paymentMode }}</td>
            <td>{{ p.referenceNo || "-" }}</td>
            <td>{{ money(p.amount) }}</td>
            <td>{{ p.isDeleted ? "Deleted" : "Active" }}</td>
            <td>
              <router-link :to="`/purchase/${data._id}`">View Bill</router-link>
              |
              <router-link v-if="isSameDay(data.invoiceDate)" :to="`/purchase/edit/${data._id}`">Edit Bill</router-link>
              |
              <a v-if="!p.isDeleted" href="#" @click.prevent="deletePayment(p)">Delete Payment</a>
              <a v-else href="#" @click.prevent="restorePayment(p)">Restore Payment</a>
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
            <th>Replacement</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in returns" :key="r._id">
            <td>{{ r.returnNo || "-" }}</td>
            <td>{{ formatDate(r.returnDate) }}</td>
            <td>{{ money(r.totalAmount) }}</td>
            <td>
              <router-link v-if="r.replacementBillId" :to="`/purchase/${r.replacementBillId}`">View</router-link>
              <span v-else>-</span>
            </td>
            <td>
              <router-link :to="`/purchase-return?billId=${data._id}`">View</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="actions">
      <select v-model="pdfLanguage" class="pdf-select" @change="savePdfLanguage">
        <option v-for="option in pdfLanguageOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button class="btn blue" @click="openPDF">Download PDF</button>
      <button class="btn orange" @click="createPurchaseReturn">Return Items</button>
      <router-link class="btn green" :to="`/purchase/${data._id}/payment`">Make Payment</router-link>
      <router-link class="btn gray" to="/purchase">Back</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import { useAuthStore } from "@/stores/authStore";
import { getFinancialYearParams } from "@/utils/financialYear";
import { useCurrency } from "@/composables/useCurrency";
import { useCompanySettings } from "@/composables/useCompanySettings";
import { notifySuccess } from "@/utils/notifications";
import { getPdfLanguage, pdfLanguageOptions, setPdfLanguage } from "@/utils/pdfLanguage";

const route = useRoute();
const router = useRouter();
const data = ref({ items: [] });
const payments = ref([]);
const returns = ref([]);
const showDeletedPayments = ref(false);
const pdfLanguage = ref(getPdfLanguage());
const { formatCurrency: money } = useCurrency();
const { gstEnabled } = useCompanySettings();

const load = async () => {
  data.value = (await http.get(`/purchase/${route.params.id}`)).data;
  payments.value = (
    await http.get(`/payments/invoice/${route.params.id}`, {
      params: {
        ...getFinancialYearParams(),
        status: showDeletedPayments.value ? "all" : "active",
      },
    })
  ).data;
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
  const branchId = localStorage.getItem("selectedBranchId") || "";
  window.open(`${import.meta.env.VITE_API_BASE_URL}/invoice-pdf/purchase/${route.params.id}?token=${token}&branchId=${encodeURIComponent(branchId)}&languageMode=${encodeURIComponent(pdfLanguage.value)}`, "_blank");
};

const savePdfLanguage = () => setPdfLanguage(pdfLanguage.value);

const createPurchaseReturn = async () => {
  router.push(`/entry?type=purchase_return&billId=${data.value._id}`);
};

const deletePayment = async (payment) => {
  if (!window.confirm("Delete this payment?")) return;
  await http.delete(`/payments/${payment._id}`);
  notifySuccess("Payment deleted successfully.");
  await load();
};

const restorePayment = async (payment) => {
  await http.post(`/payments/${payment._id}/restore`);
  notifySuccess("Payment restored successfully.");
  await load();
};
</script>

<style scoped>
.invoice { max-width: 900px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
.info { display: flex; justify-content: space-between; margin-bottom: 15px; }
.page-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
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
.btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.btn.secondary { background: #fff; color: #2563eb; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: right; }
.totals { text-align: right; margin-top: 20px; }
.pdf-select { margin-right: 8px; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 5px; }
.actions { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.btn { padding: 8px 12px; text-decoration: none; color: white; border-radius: 5px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.green { background: #16a34a; }
.blue { background: #2563eb; }
.orange { background: #f59e0b; }
.gray { background: #6b7280; }
</style>
