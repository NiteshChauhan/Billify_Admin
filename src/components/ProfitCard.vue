<template>
  <div class="card">
    <h3>{{ title }}</h3>

    <p>Sales: {{ formatCurrency(data.sales) }}</p>
    <p>Cost: {{ formatCurrency(data.cost) }}</p>

    <h2 :class="data.profit >= 0 ? 'profit' : 'loss'">
      {{ data.profit >= 0 ? "Profit" : "Loss" }}: {{ formatCurrency(data.profit) }}
    </h2>
  </div>
</template>

<script setup>
import { useCurrency } from "@/composables/useCurrency";

defineProps({
  title: String,
  data: {
    type: Object,
    default: () => ({
      sales: 0,
      cost: 0,
      profit: 0,
    }),
  },
});

const { formatCurrency } = useCurrency();
</script>

<style scoped>
.card {
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.profit {
  color: #059669;
}

.loss {
  color: #dc2626;
}
</style>
