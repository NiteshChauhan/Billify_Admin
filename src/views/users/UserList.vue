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
          <th>Name</th>
          <th>Phone</th>
          <th>GST</th>
          <th>Roles</th>
          <th>Balance</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="u in users" :key="u._id">
          <td>{{ u.name }}</td>
          <td>{{ u.phone }}</td>
          <td>{{ u.gstNumber }}</td>
          <td>{{ formatRoles(u) }}</td>
          <td>Rs {{ u.balance ?? u.openingBalance ?? 0 }}</td>
          <td>
            <router-link :to="`/users/edit/${u._id}`">Edit</router-link>
            |
            <router-link :to="`/users/${u._id}/ledger`">View Ledger</router-link>
            |
            <a href="#" @click.prevent="remove(u._id)">Delete</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { deleteUserApi, getUsersApi } from "@/api/userApi";
import { getUserRoles } from "@/utils/userRole";

const users = ref([]);

const load = async () => {
  users.value = (await getUsersApi()).data;
};

onMounted(load);

const formatRoles = (user) => {
  const roles = getUserRoles(user);
  return roles.length ? roles.join(", ") : "-";
};

const remove = async (id) => {
  if (!confirm("Deactivate this user?")) return;
  await deleteUserApi(id);
  await load();
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
</style>

