<template>
  <div class="ledger-card">
    <h2 class="title">Stock Ledger</h2>

    <!-- Product Header -->
    <div class="product-info">
      <strong>{{ product.name }}</strong>
      <span>({{ product.sku }})</span>
    </div>

    <!-- Ledger Table -->
    <table class="ledger-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Particulars</th>
          <th class="num">In</th>
          <th class="num">Out</th>
          <th class="num">Rate</th>
          <th class="num">Balance</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="rows.length === 0">
          <td colspan="6" class="empty">
            No stock transactions found
          </td>
        </tr>

        <tr v-for="(row, i) in rows" :key="i">
          <td>{{ formatDate(row.date) }}</td>
          <td>{{ row.particular }}</td>
          <td class="num">{{ row.inQty || "-" }}</td>
          <td class="num">{{ row.outQty || "-" }}</td>
          <td class="num">{{ row.rate }}</td>
          <td class="num">{{ row.balance }}</td>
        </tr>
      </tbody>
    </table>

    <router-link to="/products" class="back">
      ← Back to Products
    </router-link>
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

onMounted(async () => {
  const prodRes = await http.get(`/products/${productId}`);
  product.value = prodRes.data;

  const ledgerRes = await http.get(`/stock-ledger/${productId}`);
  buildLedger(ledgerRes.data);
});

/* BUILD RUNNING BALANCE (TALLY LOGIC) */
const buildLedger = (data) => {
  let balance = 0;

  rows.value = data.map(e => {
    const inQty = ["OPENING", "PURCHASE", "SALE_RETURN"].includes(e.type) ? e.quantity : 0;
    const outQty = ["SALE", "PURCHASE_RETURN"].includes(e.type) ? e.quantity : 0;

    balance += inQty - outQty;

    return {
      date: e.createdAt,
      particular:
        e.type === "OPENING"
          ? "Opening Stock"
          : e.type === "PURCHASE"
            ? "Purchase"
            : e.type === "SALE"
              ? "Sale"
              : e.type === "SALE_RETURN"
                ? "Sale Return"
                : e.type === "PURCHASE_RETURN"
                  ? "Purchase Return"
                  : "Adjustment",
      inQty: inQty || "",
      outQty: outQty || "",
      rate: e.rate ?? "-",
      balance
    };
  });
};

const formatDate = d =>
  new Date(d).toLocaleDateString("en-IN");
</script>

<style scoped>
.ledger-card {
  max-width: 1000px;
  margin: 25px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.title {
  text-align: center;
  margin-bottom: 15px;
}

.product-info {
  margin-bottom: 15px;
  font-size: 15px;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f3f4f6;
}

.num {
  text-align: right;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
}

.back {
  display: inline-block;
  margin-top: 15px;
  color: #2563eb;
  font-weight: 600;
}

/* 📱 Mobile */
@media (max-width: 768px) {
  .ledger-card {
    margin: 10px;
    padding: 15px;
  }

  table {
    font-size: 12px;
  }
}
</style>
