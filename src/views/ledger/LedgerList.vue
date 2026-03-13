<template>
  <div class="ledger-page">
    <div class="top-bar">
      <div class="left">
        <h2>Ledger List</h2>
      </div>
      <div class="center">
        <input v-model="search" placeholder="Search Party Name" />
        <select v-model="typeFilter">
          <option value="all">All</option>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
        </select>
      </div>
      <div class="right">
        <router-link class="btn primary" to="/users/create">+ Add Customer</router-link>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>S.No.</th>
            <th>Party Name</th>
            <th>Total Bill Amount</th>
            <th>Outstanding</th>
            <th>Paid</th>
            <th>Total Bills</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="7" class="empty">No parties found</td>
          </tr>
          <tr v-for="(row, idx) in rows" :key="row.partyId">
            <td>{{ idx + 1 }}</td>
            <td>{{ row.name }}</td>
            <td class="num">{{ money(row.totalBillAmount) }}</td>
            <td class="num">{{ money(row.outstanding) }}</td>
            <td class="num">{{ money(row.paid) }}</td>
            <td class="num">{{ row.totalBills }}</td>
            <td>
              <router-link class="btn ghost" :to="`/ledger/${row.partyId}`">View</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="item">Total Bill Amount: <strong>{{ money(summary.totalBillAmount) }}</strong></div>
      <div class="item">Total Outstanding: <strong>{{ money(summary.totalOutstanding) }}</strong></div>
      <div class="item">Total Paid: <strong>{{ money(summary.totalPaid) }}</strong></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import http from "@/api/http";
import { getUsersApi } from "@/api/userApi";
import { getFinancialYearParams } from "@/utils/financialYear";
import { hasUserRole } from "@/utils/userRole";

const search = ref("");
const typeFilter = ref("all");
const users = ref([]);
const purchases = ref([]);
const sales = ref([]);
const payments = ref([]);

const money = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const load = async () => {
  const fy = getFinancialYearParams();
  const [userRes, purchaseRes, salesRes, payRes] = await Promise.all([
    getUsersApi(),
    http.get("/purchase", { params: fy }),
    http.get("/sales", { params: fy }),
    http.get("/payments", { params: fy }),
  ]);
  users.value = userRes.data || [];
  purchases.value = purchaseRes.data || [];
  sales.value = salesRes.data || [];
  payments.value = payRes.data || [];
};

onMounted(load);

const partyRows = computed(() => {
  const map = new Map();

  const ensure = (partyId, name, roles = []) => {
    if (!partyId) return null;
    if (!map.has(partyId)) {
      map.set(partyId, {
        partyId,
        name: name || "-",
        roles,
        totalSales: 0,
        totalPurchase: 0,
        paidReceived: 0,
        totalBills: 0,
      });
    }
    return map.get(partyId);
  };

  users.value.forEach((u) => {
    ensure(String(u._id), u.name, u.roles || []);
  });

  purchases.value.forEach((inv) => {
    const row = ensure(String(inv.partyId?._id || inv.partyId), inv.partyId?.name, ["supplier"]);
    if (row) {
      row.totalPurchase += Number(inv.totalAmount || 0);
      row.totalBills += 1;
    }
  });

  sales.value.forEach((inv) => {
    const row = ensure(String(inv.partyId?._id || inv.partyId), inv.partyId?.name, ["customer"]);
    if (row) {
      row.totalSales += Number(inv.totalAmount || 0);
      row.totalBills += 1;
    }
  });

  payments.value.forEach((p) => {
    const row = ensure(String(p.partyId?._id || p.partyId));
    if (!row) return;
    const isReceived = p.paymentType === "RECEIVED" || p.invoiceType === "SALE";
    if (isReceived) row.paidReceived += Number(p.amount || 0);
  });

  return Array.from(map.values()).map((row) => {
    const totalBillAmount = row.totalSales + row.totalPurchase;
    // Outstanding per requested rule: sales - purchase - paymentsReceived
    const outstanding = row.totalSales - row.totalPurchase - row.paidReceived;
    return { ...row, totalBillAmount, outstanding, paid: row.paidReceived };
  });
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  const type = typeFilter.value;
  return partyRows.value.filter((r) => {
    const matchName = !q || (r.name || "").toLowerCase().includes(q);
    const matchType =
      type === "all" ||
      (type === "customer" && hasUserRole({ roles: r.roles }, "customer")) ||
      (type === "supplier" && hasUserRole({ roles: r.roles }, "supplier"));
    return matchName && matchType;
  });
});

const rows = computed(() => filtered.value.sort((a, b) => a.name.localeCompare(b.name)));

const summary = computed(() =>
  rows.value.reduce(
    (t, r) => {
      t.totalBillAmount += r.totalBillAmount;
      t.totalOutstanding += r.outstanding;
      t.totalPaid += r.paid;
      return t;
    },
    { totalBillAmount: 0, totalOutstanding: 0, totalPaid: 0 },
  ),
);
</script>

<style scoped>
.ledger-page { padding: 20px; }
.top-bar { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 12px; align-items: center; margin-bottom: 16px; }
.left h2 { margin: 0; font-size: 20px; }
.center { display: flex; gap: 10px; align-items: center; }
.center input { flex: 1; padding: 10px; border: 1px solid #d0d5dd; border-radius: 8px; }
.center select { min-width: 140px; padding: 10px; border: 1px solid #d0d5dd; border-radius: 8px; }
.right { display: flex; justify-content: flex-end; }
.table-wrap { overflow-x: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
th { background: #f9fafb; font-weight: 600; }
tbody tr:hover { background: #f8fafc; }
.num { text-align: right; }
.empty { text-align: center; padding: 14px; color: #6b7280; }
.btn { padding: 8px 12px; border-radius: 6px; text-decoration: none; }
.primary { background: #2563eb; color: #fff; }
.ghost { border: 1px solid #2563eb; color: #2563eb; }
.summary { margin-top: 12px; display: flex; gap: 16px; justify-content: flex-end; font-weight: 600; }
.summary .item { background: #fff; padding: 10px 14px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
@media (max-width: 1024px) {
  .top-bar { grid-template-columns: 1fr; }
  .center { width: 100%; }
  .right { justify-content: flex-start; }
}
@media (max-width: 640px) {
  .center { flex-direction: column; align-items: stretch; }
  .center select { width: 100%; }
  .right { width: 100%; }
}
</style>
