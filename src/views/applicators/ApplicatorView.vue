<template>
  <div class="detail-page">
    <section class="profile-card">
      <div class="profile-head">
        <div class="identity">
          <span class="avatar">{{ initials(applicator?.name) }}</span>
          <div>
            <div class="title-line">
              <h2>{{ applicator?.name || "Applicator" }}</h2>
              <span v-if="applicator?.status" :class="['status-badge', applicator.status]">{{ applicator.status }}</span>
            </div>
            <p>{{ applicator?.mobile || "-" }} | {{ applicator?.email || "-" }}</p>
          </div>
        </div>
        <div class="top-actions">
          <router-link class="ghost-btn" to="/applicators" title="Back to applicators">Back</router-link>
          <ActionIconButton icon="edit" :to="`/applicators/${route.params.id}/edit`" title="Edit applicator" variant="edit" />
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span>Mobile</span>
          <strong>{{ applicator?.mobile || "-" }}</strong>
        </div>
        <div class="info-item">
          <span>Email</span>
          <strong>{{ applicator?.email || "-" }}</strong>
        </div>
        <div class="info-item">
          <span>City</span>
          <strong>{{ applicator?.city || "-" }}</strong>
        </div>
        <div class="info-item">
          <span>State</span>
          <strong>{{ applicator?.state || "-" }}</strong>
        </div>
        <div class="info-item">
          <span>Pincode</span>
          <strong>{{ applicator?.pincode || "-" }}</strong>
        </div>
        <div class="info-item wide">
          <span>Address</span>
          <strong>{{ applicator?.address || "-" }}</strong>
        </div>
        <div class="info-item wide">
          <span>Notes</span>
          <strong>{{ applicator?.notes || "-" }}</strong>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="table-title">
        <div>
          <h3>Assigned Party Sites</h3>
          <p>{{ assignments.length }} assignment{{ assignments.length === 1 ? "" : "s" }} linked</p>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Party</th>
              <th>Site</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in assignments" :key="row._id">
              <td>{{ row.partyId?.name || "-" }}</td>
              <td>{{ row.siteId?.name || "-" }}</td>
              <td><span :class="['status-badge', row.status]">{{ row.status }}</span></td>
              <td>{{ row.startDate ? new Date(row.startDate).toLocaleDateString("en-GB") : "-" }}</td>
              <td>{{ row.endDate ? new Date(row.endDate).toLocaleDateString("en-GB") : "-" }}</td>
            </tr>
            <tr v-if="!assignments.length">
              <td colspan="5" class="empty">No assignments found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getApplicatorApi, listAssignmentsApi } from "@/api/applicatorApi";
import ActionIconButton from "@/components/common/ActionIconButton.vue";

const route = useRoute();
const applicator = ref(null);
const assignments = ref([]);

const initials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AP";
};

onMounted(async () => {
  applicator.value = (await getApplicatorApi(route.params.id)).data;
  assignments.value = (await listAssignmentsApi({ applicatorId: route.params.id })).data?.data || [];
});
</script>

<style scoped>
.detail-page {
  display: grid;
  gap: 18px;
}

.profile-card,
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.profile-head {
  align-items: flex-start;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 18px;
}

.identity {
  align-items: center;
  display: flex;
  gap: 12px;
  min-width: 0;
}

.avatar {
  align-items: center;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  border-radius: 999px;
  color: #075985;
  display: inline-flex;
  flex: 0 0 46px;
  font-size: 15px;
  font-weight: 900;
  height: 46px;
  justify-content: center;
  width: 46px;
}

.title-line {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

h2,
h3 {
  color: #0f172a;
  margin: 0;
}

.profile-head p,
.table-title p {
  color: #64748b;
  margin: 5px 0 0;
}

.top-actions {
  display: flex;
  gap: 8px;
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
  white-space: nowrap;
}

.primary-btn {
  background: #0f766e;
  border: 1px solid #0f766e;
  color: #fff;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.info-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 18px;
}

.info-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: grid;
  gap: 5px;
  padding: 12px;
}

.info-item span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.info-item strong {
  color: #0f172a;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.wide {
  grid-column: span 3;
}

.table-title {
  border-bottom: 1px solid #e2e8f0;
  padding: 16px;
}

.table-scroll {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 720px;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 13px 14px;
  text-align: left;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

tbody tr:hover {
  background: #f8fafc;
}

.status-badge {
  border-radius: 999px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  padding: 5px 10px;
  text-transform: capitalize;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.empty {
  color: #64748b;
  padding: 30px 14px;
  text-align: center;
}

@media (max-width: 780px) {
  .profile-head,
  .top-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .wide {
    grid-column: auto;
  }
}
</style>
