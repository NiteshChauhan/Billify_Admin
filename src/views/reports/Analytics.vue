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
      <label>From <input v-model="filters.from" type="date" /></label>
      <label>To <input v-model="filters.to" type="date" /></label>
      <label>Status
        <select v-model="filters.paymentStatus">
          <option value="">All</option>
          <option value="DUE">Due</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </label>
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
            <tr v-if="!data.applicatorSummary.length"><td colspan="4" class="empty">No data</td></tr>
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
            <tr v-if="!data.itemSummary.length"><td colspan="4" class="empty">No data</td></tr>
          </tbody>
        </table>
      </section>
    </div>

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
          <tr v-if="!loading && !data.distribution.length"><td colspan="6" class="empty">No distribution rows</td></tr>
        </tbody>
      </table>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getInvoiceAnalyticsApi } from "@/api/analyticsApi";
import { notifyError } from "@/utils/notifications";

const loading = ref(false);
const filters = reactive({ from: "", to: "", paymentStatus: "" });
const data = reactive({
  overview: {},
  applicatorSummary: [],
  itemSummary: [],
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
    const res = await getInvoiceAnalyticsApi(params);
    Object.assign(data, {
      overview: res.data.overview || {},
      applicatorSummary: res.data.applicatorSummary || [],
      itemSummary: res.data.itemSummary || [],
      distribution: res.data.distribution || [],
    });
  } catch (err) {
    notifyError(err.response?.data?.message || "Failed to load analytics");
  } finally {
    loading.value = false;
  }
};
const resetFilters = () => {
  filters.from = "";
  filters.to = "";
  filters.paymentStatus = "";
  loadAnalytics();
};

watch(filters, () => {
  clearTimeout(timer);
  timer = setTimeout(loadAnalytics, 300);
});

onMounted(loadAnalytics);
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
