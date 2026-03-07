<template>
  <div class="form-card">
    <h2>{{ isEdit ? "Edit User" : "New User" }}</h2>

    <div class="grid">
      <input v-model="form.name" placeholder="User Name *" />
      <input v-model="form.phone" placeholder="Phone" />
      <input v-model="form.email" placeholder="Email" />
      <input v-model="form.gstNumber" placeholder="GST Number" />
    </div>

    <textarea
      v-model="form.address"
      placeholder="Address"
    ></textarea>

    <div class="roles">
      <label>
        <input type="checkbox" value="supplier" v-model="form.roles" />
        Supplier
      </label>
      <label>
        <input type="checkbox" value="customer" v-model="form.roles" />
        Customer
      </label>
    </div>

    <div class="grid">
      <input
        type="number"
        v-model.number="form.openingBalance"
        placeholder="Opening Balance"
      />
    </div>

    <button class="btn" @click="save">
      Save User
    </button>
  </div>
</template>

<script setup>
import { reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createUserApi,
  getUserByIdApi,
  getUsersApi,
  updateUserApi,
} from "@/api/userApi";
import { getUserRoles } from "@/utils/userRole";

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);

const form = reactive({
  name: "",
  phone: "",
  email: "",
  address: "",
  gstNumber: "",
  openingBalance: 0,
  roles: [],
});

const mapUserToForm = (user) => {
  if (!user) return;
  form.name = user.name || "";
  form.phone = user.phone || "";
  form.email = user.email || "";
  form.address = user.address || "";
  form.gstNumber = user.gstNumber || "";
  form.openingBalance = user.openingBalance ?? user.balance ?? 0;
  form.roles = getUserRoles(user);
};

onMounted(async () => {
  if (!isEdit.value) return;

  try {
    const res = await getUserByIdApi(route.params.id);
    mapUserToForm(res.data);
  } catch {
    const listRes = await getUsersApi();
    const user = listRes.data.find((x) => String(x._id) === String(route.params.id));
    mapUserToForm(user);
  }
});

const buildPayload = () => {
  const roles = [...new Set(form.roles)];
  return {
    name: form.name.trim(),
    phone: form.phone,
    email: form.email,
    address: form.address,
    gstNumber: form.gstNumber,
    openingBalance: Number(form.openingBalance || 0),
    roles,
    role: roles.length === 1 ? roles[0] : roles,
    type: roles.length === 1 ? roles[0] : roles,
  };
};

const save = async () => {
  if (!form.name.trim()) {
    alert("User name is required");
    return;
  }

  if (!form.roles.length) {
    alert("Select at least one role");
    return;
  }

  const payload = buildPayload();

  if (isEdit.value) {
    await updateUserApi(route.params.id, payload);
  } else {
    await createUserApi(payload);
  }

  router.push("/users");
};
</script>

<style scoped>
.form-card {
  max-width: 600px;
  margin: auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}
input,
textarea {
  padding: 8px;
}
textarea {
  margin-top: 10px;
  width: 100%;
}
.roles {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}
.roles label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn {
  margin-top: 20px;
  background: #2563eb;
  color: white;
  padding: 10px;
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
