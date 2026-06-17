<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>{{ applicator?.name || "Applicator" }}</h2>
        <p>{{ applicator?.mobile || "-" }} | {{ applicator?.email || "-" }}</p>
      </div>
      <router-link class="btn" :to="`/applicators/${route.params.id}/edit`">Edit</router-link>
    </div>
    <p><strong>Address:</strong> {{ applicator?.address || "-" }}</p>
    <p><strong>City:</strong> {{ applicator?.city || "-" }} {{ applicator?.state || "" }}</p>
    <p><strong>Notes:</strong> {{ applicator?.notes || "-" }}</p>

    <h3>Assigned Party Sites</h3>
    <table>
      <thead><tr><th>Party</th><th>Site</th><th>Status</th><th>Start</th><th>End</th></tr></thead>
      <tbody>
        <tr v-for="row in assignments" :key="row._id">
          <td>{{ row.partyId?.name || "-" }}</td>
          <td>{{ row.siteId?.name || "-" }}</td>
          <td>{{ row.status }}</td>
          <td>{{ row.startDate ? new Date(row.startDate).toLocaleDateString("en-GB") : "-" }}</td>
          <td>{{ row.endDate ? new Date(row.endDate).toLocaleDateString("en-GB") : "-" }}</td>
        </tr>
        <tr v-if="!assignments.length"><td colspan="5" class="empty">No assignments found</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getApplicatorApi, listAssignmentsApi } from "@/api/applicatorApi";

const route = useRoute();
const applicator = ref(null);
const assignments = ref([]);

onMounted(async () => {
  applicator.value = (await getApplicatorApi(route.params.id)).data;
  assignments.value = (await listAssignmentsApi({ applicatorId: route.params.id })).data?.data || [];
});
</script>

<style scoped>
.card { background:#fff; border-radius:12px; padding:18px; }
.head { display:flex; justify-content:space-between; gap:12px; }
.head p { margin:4px 0 0; color:#64748b; }
.btn { background:#0ea5e9; color:#fff; text-decoration:none; border-radius:8px; padding:10px 12px; }
table { width:100%; border-collapse:collapse; }
th,td { border-bottom:1px solid #e5e7eb; padding:10px; text-align:left; }
.empty { text-align:center; color:#64748b; }
</style>
