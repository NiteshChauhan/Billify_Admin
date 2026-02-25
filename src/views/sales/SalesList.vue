<template>
  <div class="page-wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div>
          <h2>Sales Invoices</h2>
          <p class="subtitle">Manage and track all sales invoices</p>
        </div>

        <router-link to="/sales/create" class="btn-primary">
          + New Sale
        </router-link>
      </div>

      <!-- Responsive Table Wrapper -->
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="i in invoices" :key="i._id">
              <td class="bold">{{ i.invoiceNo }}</td>
              <td>{{ formatDate(i.invoiceDate) }}</td>
              <td>{{ i.vendorId?.name }}</td>
              <td>₹ {{ i.totalAmount }}</td>
              <td>₹ {{ i.paidAmount }}</td>
              <td>
                <span :class="`status ${i.status}`">
                  {{ i.status }}
                </span>
              </td>
              <td class="actions">
                <router-link :to="`/sales/${i._id}`" class="btn-link">
                  View
                </router-link>
                <router-link :to="`/sales/edit/${i._id}`" class="btn-link edit">
                  Edit
                </router-link>
              </td>
            </tr>

            <tr v-if="!invoices.length">
              <td colspan="7" class="empty">
                No invoices found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import http from "@/api/http";

const invoices = ref([]);

onMounted(async () => {
  const res = await http.get("/sales");
  invoices.value = res.data;
});

const formatDate = (d) => new Date(d).toLocaleDateString();
</script>

<style scoped>
.page-wrapper {
  padding: 20px;
  background: #f5f7fb;
  min-height: 100vh;
}

/* Card */
.card {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  text-decoration: none;
  transition: 0.2s ease;
}

.btn-primary:hover {
  background: #1e40af;
}

/* Table */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

th {
  text-align: left;
  padding: 12px 10px;
  background: #f9fafb;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

td {
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #374151;
}

.bold {
  font-weight: 600;
}

/* Status Badges */
.status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status.PAID {
  background: #dcfce7;
  color: #166534;
}

.status.PARTIAL {
  background: #fef3c7;
  color: #92400e;
}

.status.DUE {
  background: #fee2e2;
  color: #991b1b;
}

/* Actions */
.actions {
  display: flex;
  gap: 10px;
}

.btn-link {
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-link.edit {
  color: #059669;
}

/* Empty state */
.empty {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

/* Mobile */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>