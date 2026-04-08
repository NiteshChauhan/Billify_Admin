<template>
  <div class="card">
    <div class="header">
      <h2>Users</h2>
      <router-link to="/users/create" class="btn">
        + Add User
      </router-link>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Type</th>
          <th>Balance</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(u, idx) in users" :key="u._id">
          <td>{{ idx + 1 }}</td>
          <td>{{ u.name }}</td>
          <td>{{ u.phone }}</td>
          <td>{{ formatType(u) }}</td>
          <td>{{ money(u.balance ?? u.openingBalance ?? 0) }}</td>
          <td class="actions">
            <router-link :to="`/users/${u._id}/ledger`">View</router-link>
            <router-link :to="`/users/edit/${u._id}`">Edit</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getUsersApi } from "@/api/userApi";
import { getUserRoles } from "@/utils/userRole";
import { useCurrency } from "@/composables/useCurrency";

const users = ref([]);
const { formatCurrency: money } = useCurrency();

const load = async () => {
  users.value = (await getUsersApi()).data;
};

onMounted(load);

const formatType = (user) => {
  const roles = getUserRoles(user);
  const hasSupplier = roles.includes("supplier");
  const hasCustomer = roles.includes("customer") || roles.includes("vendor");
  if (hasSupplier && hasCustomer) return "Both";
  if (hasSupplier) return "Supplier";
  if (hasCustomer) return "Customer";
  return "-";
};
</script>

<style scoped>
.card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.btn {
  background: #2563eb;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
}
.actions {
  display: flex;
  gap: 10px;
}
.actions a {
  color: #1d4ed8;
}
</style>
