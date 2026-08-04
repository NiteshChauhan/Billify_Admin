<template>
  <section class="analytics-page">
    <div class="page-head">
      <div>
        <h1>Invoice Analytics</h1>
        <p>Item distribution across parties, sites, and applicators.</p>
      </div>
      <button class="primary-btn" type="button" @click="loadAnalytics">Refresh</button>
    </div>

    <div class="filters">
      <label>From <input v-model="filters.fromDate" type="date" /></label>
      <label>To <input v-model="filters.toDate" type="date" /></label>
      <CreatableAutocomplete
        v-model="selectedParty"
        label="Party Name"
        :options="partyOptions"
        :get-option-label="(party) => party.name"
        :get-option-meta="(party) => party.mobile || party.phone || ''"
        placeholder="Search party"
        @search="searchParties"
      />
      <CreatableAutocomplete
        v-model="selectedApplicator"
        label="Applicator"
        :options="applicatorOptions"
        :get-option-label="(applicator) => applicator.name"
        :get-option-meta="(applicator) => applicator.mobile || ''"
        placeholder="Search applicator"
        @search="searchApplicators"
      />
      <CreatableAutocomplete
        v-model="selectedProduct"
        label="Product"
        :options="productOptions"
        :get-option-label="(product) => product.name"
        :get-option-meta="(product) => product.sku || product.unitName || ''"
        placeholder="Search product"
        @search="searchProducts"
      />
      <label>Status
        <select v-model="filters.paymentStatus">
          <option value="">All</option>
          <option value="DUE">Due</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </label>
      <button class="primary-btn" type="button" @click="loadAnalytics">Apply</button>
      <button class="secondary-btn" type="button" @click="resetFilters">Reset</button>
    </div>

    <div class="metric-grid">
      <article v-for="card in cards" :key="card.label" class="metric-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </article>
    </div>

    <div class="analytics-grid">
      <section class="panel">
        <h2>Applicator Summary</h2>
        <div v-if="loading" class="empty">Loading...</div>
        <table v-else>
          <thead><tr><th>Applicator</th><th>Invoices</th><th>Qty</th><th>Value</th></tr></thead>
          <tbody>
            <tr v-for="row in data.applicatorSummary" :key="row.applicatorId || row.applicatorName">
              <td>{{ row.applicatorName || 'Unassigned' }}</td>
              <td>{{ row.invoiceCount }}</td>
              <td>{{ formatQty(row.totalQuantity) }}</td>
              <td>{{ money(row.totalValue) }}</td>
            </tr>
            <tr v-if="!data.applicatorSummary.length"><td colspan="4" class="empty">No analytics data found</td></tr>
          </tbody>
        </table>
      </section>

      <section class="panel">
        <h2>Item Summary</h2>
        <div v-if="loading" class="empty">Loading...</div>
        <table v-else>
          <thead><tr><th>Item</th><th>Invoices</th><th>Qty</th><th>Value</th></tr></thead>
          <tbody>
            <tr v-for="row in data.itemSummary" :key="row.productId || row.productName">
              <td>{{ row.productName }} <small v-if="row.unitName">/{{ row.unitName }}</small></td>
              <td>{{ row.invoiceCount }}</td>
              <td>{{ formatQty(row.totalQuantity) }}</td>
              <td>{{ money(row.totalValue) }}</td>
            </tr>
            <tr v-if="!data.itemSummary.length"><td colspan="4" class="empty">No analytics data found</td></tr>
          </tbody>
        </table>
      </section>
    </div>

    <section class="panel distribution">
      <h2>Party Summary</h2>
      <table>
        <thead><tr><th>Party</th><th>Invoices</th><th>Total</th><th>Paid</th><th>Outstanding</th></tr></thead>
        <tbody>
          <tr v-for="row in data.partySummary" :key="row.partyId || row.partyName">
            <td>{{ row.partyName }}</td>
            <td>{{ row.invoiceCount }}</td>
            <td>{{ money(row.totalValue) }}</td>
            <td>{{ money(row.paidAmount) }}</td>
            <td>{{ money(row.outstandingAmount) }}</td>
          </tr>
          <tr v-if="!loading && !data.partySummary.length"><td colspan="5" class="empty">No analytics data found</td></tr>
        </tbody>
      </table>
    </section>

    <section class="panel distribution">
      <h2>Party / Site / Applicator Distribution</h2>
      <table>
        <thead><tr><th>Party</th><th>Site</th><th>Applicator</th><th>Item</th><th>Qty</th><th>Value</th></tr></thead>
        <tbody>
          <tr v-for="row in data.distribution" :key="`${row.partyId}-${row.siteId}-${row.applicatorId}-${row.productId}`">
            <td>{{ row.partyName }}</td>
            <td>{{ row.siteName || '-' }}</td>
            <td>{{ row.applicatorName || 'Unassigned' }}</td>
            <td>{{ row.productName }} <small v-if="row.unitName">/{{ row.unitName }}</small></td>
            <td>{{ formatQty(row.totalQuantity) }}</td>
            <td>{{ money(row.totalValue) }}</td>
          </tr>
          <tr v-if="!loading && !data.distribution.length"><td colspan="6" class="empty">No analytics data found</td></tr>
        </tbody>
      </table>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import http from "@/api/http";
import { getInvoiceAnalyticsApi } from "@/api/analyticsApi";
import { listApplicatorsApi } from "@/api/applicatorApi";
import CreatableAutocomplete from "@/components/common/CreatableAutocomplete.vue";
import { notifyError, parseApiError } from "@/utils/notifications";

const loading = ref(false);
const filters = reactive({ fromDate: "", toDate: "", paymentStatus: "" });
const selectedParty = ref(null);
const selectedApplicator = ref(null);
const selectedProduct = ref(null);
const partyOptions = ref([]);
const applicatorOptions = ref([]);
const productOptions = ref([]);
const data = reactive({
  overview: {},
  applicatorSummary: [],
  itemSummary: [],
  partySummary: [],
  distribution: [],
});

const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatQty = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const cards = computed(() => [
  { label: "Invoices", value: Number(data.overview.invoiceCount || 0).toLocaleString() },
  { label: "Total Value", value: money(data.overview.totalAmount) },
  { label: "Pending", value: money(data.overview.pendingAmount) },
  { label: "Quantity", value: formatQty(data.overview.totalQuantity) },
  { label: "Parties", value: Number(data.overview.activeParties || 0).toLocaleString() },
  { label: "Applicators", value: Number(data.overview.activeApplicators || 0).toLocaleString() },
]);

let timer = null;
const loadAnalytics = async () => {
  loading.value = true;
  try {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    if (selectedParty.value?._id) params.partyId = selectedParty.value._id;
    if (selectedApplicator.value?._id) params.applicatorId = selectedApplicator.value._id;
    if (selectedProduct.value?._id) params.productId = selectedProduct.value._id;
    const res = await getInvoiceAnalyticsApi(params);
    const payload = res.data?.data || res.data || {};
    Object.assign(data, {
      overview: payload.overview || payload.metrics || {},
      applicatorSummary: payload.applicatorSummary || payload.byApplicator || [],
      itemSummary: payload.itemSummary || payload.byProduct || [],
      partySummary: payload.partySummary || payload.byParty || [],
      distribution: payload.distribution || [],
    });
  } catch (err) {
    notifyError(parseApiError(err) || "Unable to load Analytics.");
  } finally {
    loading.value = false;
  }
};
const resetFilters = () => {
  filters.fromDate = "";
  filters.toDate = "";
  filters.paymentStatus = "";
  selectedParty.value = null;
  selectedApplicator.value = null;
  selectedProduct.value = null;
  loadAnalytics();
};

const searchParties = async (term = "") => {
  const res = await http.get("/parties", { params: { search: term, limit: 20 }, skipNotify: true });
  partyOptions.value = res.data || [];
};

const searchApplicators = async (term = "") => {
  const res = await listApplicatorsApi({ search: term, status: "active", limit: 20 });
  applicatorOptions.value = res.data?.data || res.data || [];
};

const searchProducts = async (term = "") => {
  const res = await http.get("/products", { params: { search: term, status: "active", limit: 20 }, skipNotify: true });
  productOptions.value = res.data?.data || res.data || [];
};
watch(filters, () => {
  clearTimeout(timer);
  timer = setTimeout(loadAnalytics, 300);
});

onMounted(async () => {
  await Promise.all([searchParties(), searchApplicators(), searchProducts()]);
  await loadAnalytics();
});
</script>

<style scoped>
.analytics-page { display: grid; gap: 18px; }
.page-head { align-items: center; display: flex; justify-content: space-between; gap: 16px; }
.page-head h1 { color: #0f172a; font-size: 24px; margin: 0; }
.page-head p { color: #64748b; margin: 4px 0 0; }
.filters { align-items: end; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.filters label { color: #334155; display: grid; font-size: 13px; font-weight: 700; gap: 6px; }
.filters input, .filters select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
.primary-btn, .secondary-btn { border-radius: 8px; cursor: pointer; font-weight: 700; padding: 10px 14px; }
.primary-btn { background: #2563eb; border: 1px solid #2563eb; color: #fff; }
.secondary-btn { background: #fff; border: 1px solid #cbd5e1; color: #334155; }
.metric-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.metric-card, .panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }
.metric-card { padding: 16px; }
.metric-card span { color: #64748b; display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; }
.metric-card strong { color: #0f172a; display: block; font-size: 22px; margin-top: 6px; }
.analytics-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
.panel { overflow: auto; padding: 16px; }
.panel h2 { color: #0f172a; font-size: 16px; margin: 0 0 12px; }
table { border-collapse: collapse; min-width: 100%; }
th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; white-space: nowrap; }
th { color: #475569; font-size: 12px; text-transform: uppercase; }
small { color: #64748b; }
.empty { color: #64748b; padding: 14px; text-align: center; }
@media (max-width: 720px) { .page-head { align-items: flex-start; flex-direction: column; } }
</style>
