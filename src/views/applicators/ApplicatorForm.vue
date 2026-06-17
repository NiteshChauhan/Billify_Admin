<template>
  <div class="form-page">
    <div class="page-header">
      <div>
        <h2>{{ isEdit ? "Edit Applicator" : "Add Applicator" }}</h2>
        <p>{{ isEdit ? "Update applicator profile and working details." : "Create a new applicator profile for assignments." }}</p>
      </div>
      <router-link class="ghost-btn" to="/applicators" title="Back to applicators">Back</router-link>
    </div>

    <section class="form-card">
      <div class="card-head">
        <h3>Applicator Information</h3>
        <p>Fields marked with * are required.</p>
      </div>

      <form class="grid" @submit.prevent="save">
        <label>
          <span>Name <b>*</b></span>
          <input v-model.trim="form.name" required />
        </label>
        <label>
          <span>Mobile</span>
          <input v-model.trim="form.mobile" />
        </label>
        <label>
          <span>Email</span>
          <input v-model.trim="form.email" type="email" />
        </label>
        <label>
          <span>City</span>
          <input v-model.trim="form.city" />
        </label>
        <label>
          <span>State</span>
          <input v-model.trim="form.state" />
        </label>
        <label>
          <span>Pincode</span>
          <input v-model.trim="form.pincode" />
        </label>
        <label>
          <span>Status</span>
          <select v-model="form.status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label class="full">
          <span>Address</span>
          <textarea v-model.trim="form.address" />
        </label>
        <label class="full">
          <span>Notes</span>
          <textarea v-model.trim="form.notes" />
        </label>
        <p v-if="message" class="error full">{{ message }}</p>
        <div class="actions full">
          <router-link class="ghost-btn" to="/applicators">Cancel</router-link>
          <button class="primary-btn" :disabled="saving" type="submit">{{ saving ? "Saving..." : "Save Applicator" }}</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createApplicatorApi, getApplicatorApi, updateApplicatorApi } from "@/api/applicatorApi";
import { notifyError, notifySuccess, parseApiError } from "@/utils/notifications";

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => Boolean(route.params.id));
const message = ref("");
const saving = ref(false);
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
  message.value = "";
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateApplicatorApi(route.params.id, { ...form });
      notifySuccess("Applicator updated successfully.");
    } else {
      await createApplicatorApi({ ...form });
      notifySuccess("Applicator created successfully.");
    }
    router.push("/applicators");
  } catch (err) {
    message.value = err.response?.data?.message || "Failed to save applicator";
    notifyError(parseApiError(err));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.form-page {
  display: grid;
  gap: 18px;
}

.page-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.page-header h2,
.card-head h3 {
  color: #0f172a;
  margin: 0;
}

.page-header p,
.card-head p {
  color: #64748b;
  margin: 5px 0 0;
}

.form-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  margin: 0 auto;
  max-width: 860px;
  overflow: hidden;
  width: 100%;
}

.card-head {
  border-bottom: 1px solid #e2e8f0;
  padding: 18px;
}

.grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 18px;
}

label {
  color: #334155;
  display: grid;
  font-weight: 700;
  gap: 7px;
}

label span {
  font-size: 13px;
}

b {
  color: #b91c1c;
}

input,
select,
textarea {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  min-height: 42px;
  outline: none;
  padding: 10px 11px;
  width: 100%;
}

textarea {
  min-height: 92px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.full {
  grid-column: 1 / -1;
}

.actions {
  align-items: center;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin: 4px -18px -18px;
  padding: 16px 18px;
}

.primary-btn,
.ghost-btn {
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  text-decoration: none;
}

.primary-btn {
  background: #0f766e;
  border: 1px solid #0f766e;
  color: #fff;
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  margin: 0;
  padding: 10px 12px;
}

@media (max-width: 720px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
