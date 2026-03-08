<template>
  <div>
    <h1>Dashboard</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- KPI CARDS -->
    <div class="grid">
      <DashboardCard title="Total Sales" :value="data.totalSales" />
      <DashboardCard title="Total Purchase" :value="data.totalPurchase" />
      <DashboardCard title="Payments Received" :value="data.totalPayments" />
      <DashboardCard title="Products" :value="data.totalProducts" />
    </div>

    <!-- CHART -->
    <div class="chart-card">
      <h3>Monthly Sales vs Purchase</h3>
      <canvas ref="chart"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import http from "@/api/http";
import DashboardCard from "@/components/DashboardCard.vue";
import Chart from "chart.js/auto";
import { useAuthStore } from "@/stores/authStore";

const chart = ref(null);
let chartInstance = null;
const error = ref("");
const router = useRouter();
const auth = useAuthStore();

const data = ref({
  totalSales: 0,
  totalPurchase: 0,
  totalPayments: 0,
  totalProducts: 0,
  monthlySales: [],
  monthlyPurchase: [],
});

const loadDashboard = async () => {
  try {
    if (!auth.token) {
      router.replace("/login");
      return;
    }

    const res = await http.get("/dashboard/summary");

    data.value = res.data;
    renderChart();
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) {
      error.value = "Session expired. Please login again.";
      auth.logout();
      router.replace("/login");
      return;
    }

    error.value =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Failed to load dashboard summary. Check API and login state.";
  }
};

const renderChart = () => {
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chart.value, {
    type: "bar",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Sales",
          data: data.value.monthlySales,
        },
        {
          label: "Purchase",
          data: data.value.monthlyPurchase,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

onMounted(loadDashboard);
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  height: 300px;
}

.error {
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 10px;
  margin: 8px 0 12px;
}
</style>
