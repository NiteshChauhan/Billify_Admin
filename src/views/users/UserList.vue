<template>
  <div class="card">
    <div class="header">
      <div>
        <h2>Users</h2>
        <p class="subhead">Manage customer and supplier contacts in one place.</p>
      </div>
      <router-link to="/users/create" class="btn action-btn">
        Add User
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
            <ActionIconButton icon="view" :to="`/users/${u._id}/ledger`" title="View ledger" variant="view" />
            <ActionIconButton icon="edit" :to="`/users/edit/${u._id}`" title="Edit user" variant="edit" />
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
import ActionIconButton from "@/components/common/ActionIconButton.vue";

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
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}
.header h2 {
  margin: 0;
}
.subhead {
  margin: 6px 0 0;
  color: #64748b;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  padding: 10px 14px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 10px;
}
@media (max-width: 720px) {
  .header {
    align-items: stretch;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
