<template>
  <div class="card">
    <h2>{{ isEdit ? "Edit Applicator" : "Add Applicator" }}</h2>
    <form class="grid" @submit.prevent="save">
      <label>Name *<input v-model.trim="form.name" required /></label>
      <label>Mobile<input v-model.trim="form.mobile" /></label>
      <label>Email<input v-model.trim="form.email" type="email" /></label>
      <label>City<input v-model.trim="form.city" /></label>
      <label>State<input v-model.trim="form.state" /></label>
      <label>Pincode<input v-model.trim="form.pincode" /></label>
      <label>Status
        <select v-model="form.status">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <label class="full">Address<textarea v-model.trim="form.address" /></label>
      <label class="full">Notes<textarea v-model.trim="form.notes" /></label>
      <p v-if="message" class="error full">{{ message }}</p>
      <div class="actions full">
        <router-link to="/applicators">Cancel</router-link>
        <button class="btn">Save</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createApplicatorApi, getApplicatorApi, updateApplicatorApi } from "@/api/applicatorApi";

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const message = ref("");
const form = reactive({
  name: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  status: "active",
  notes: "",
});

onMounted(async () => {
  if (!isEdit.value) return;
  const res = await getApplicatorApi(route.params.id);
  Object.assign(form, res.data || {});
});

const save = async () => {
  try {
    if (isEdit.value) await updateApplicatorApi(route.params.id, { ...form });
    else await createApplicatorApi({ ...form });
    router.push("/applicators");
  } catch (err) {
    message.value = err.response?.data?.message || "Failed to save applicator";
  }
};
</script>

<style scoped>
.card { background:#fff; border-radius:12px; padding:18px; max-width:760px; margin:auto; }
.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
label { display:grid; gap:6px; font-weight:600; }
input, select, textarea { border:1px solid #cbd5e1; border-radius:8px; padding:9px; }
textarea { min-height:76px; }
.full { grid-column:1 / -1; }
.actions { display:flex; justify-content:flex-end; gap:10px; }
.btn { background:#0ea5e9; color:#fff; border:none; border-radius:8px; padding:10px 12px; }
.error { color:#b91c1c; }
@media (max-width:720px){ .grid{grid-template-columns:1fr;} }
</style>
