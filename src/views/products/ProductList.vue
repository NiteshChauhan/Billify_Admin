<template>
  <div class="card">
    <div class="head">
      <div>
        <h2>Product List</h2>
        <p class="subhead">
          Fast product list with stock and latest rates in one request.
        </p>
      </div>
      <div class="head-actions">
        <button class="btn-light" @click="downloadSampleCsv">
          Download Sample CSV
        </button>
        <button
          class="btn-light"
          :disabled="isUploading"
          @click="triggerUpload"
        >
          {{ isUploading ? "Uploading..." : "Upload CSV" }}
        </button>
        <button class="btn" @click="openCreate">Add Product</button>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      class="hidden-input"
      @change="handleCsvUpload"
    />

    <p v-if="uploadMessage" class="upload-message">{{ uploadMessage }}</p>

    <div v-if="uploadResult" class="upload-result">
      <div class="summary-cards">
        <div class="summary-card success">
          <span class="summary-label">Inserted</span>
          <strong>{{ uploadResult.insertedCount || 0 }}</strong>
        </div>
        <div class="summary-card warning">
          <span class="summary-label">Skipped</span>
          <strong>{{ formattedSkipped.length }}</strong>
        </div>
        <div class="summary-card danger">
          <span class="summary-label">Errors</span>
          <strong>{{ formattedErrors.length }}</strong>
        </div>
      </div>

      <details>
        <summary>Skipped Products (Duplicate / Invalid)</summary>
        <div v-if="formattedSkipped.length" class="result-table-wrap">
          <table class="result-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Product Name</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in formattedSkipped"
                :key="`${item.name}-${item.reason}-${index}`"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="result-box">No skipped products</div>
      </details>

      <details open>
        <summary>Errors (Fix Required)</summary>
        <div v-if="formattedErrors.length" class="result-table-wrap">
          <table class="result-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Product Name</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in formattedErrors"
                :key="`${item.name}-${item.error}-${index}`"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.error }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="result-box">No errors</div>
      </details>

      <div class="result-actions">
        <button
          class="btn-light"
          :disabled="!formattedErrors.length && !formattedSkipped.length"
          @click="downloadErrorReport"
        >
          Download Error Report (CSV)
        </button>
      </div>
    </div>

    <div class="toolbar">
      <input v-model.trim="search" placeholder="Search Product" />
      <select v-model="stockFilter">
        <option value="all">All</option>
        <option value="available">Available</option>
        <option value="not_available">Not Available</option>
      </select>
      <select v-model.number="limit" @change="changePage(1)">
        <option :value="20">20</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
      </select>
    </div>

    <div class="pagination-head">
      <span>{{ showingText }}</span>
      <span>Total Products: {{ total }}</span>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>Product Name</th>
          <th>Opening Stock</th>
          <th>Current Stock</th>
          <th>Price</th>
          <th>Last Sale</th>
          <th>Last Purchase</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, idx) in filteredRows" :key="p._id">
          <td>{{ startIndex + idx + 1 }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.openingStock }}</td>
          <td>{{ p.stock }}</td>
          <td>{{ money(p.price) }}</td>
          <td>{{ money(p.lastSalePrice) }}</td>
          <td>{{ money(p.lastPurchasePrice) }}</td>
          <td>{{ p.stock > 0 ? "Available" : "Not Available" }}</td>
          <td class="actions">
            <router-link :to="`/products/${p._id}/history`">View</router-link>
            <button @click="openEdit(p)">Edit</button>
          </td>
        </tr>
        <tr v-if="!filteredRows.length">
          <td colspan="9" class="empty">No products found</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button
        class="btn-light"
        :disabled="page <= 1"
        @click="changePage(page - 1)"
      >
        Previous
      </button>
      <button
        v-for="pageNumber in pageNumbers"
        :key="pageNumber"
        :class="['page-btn', { active: pageNumber === page }]"
        @click="changePage(pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button
        class="btn-light"
        :disabled="page >= totalPages"
        @click="changePage(page + 1)"
      >
        Next
      </button>
    </div>

    <div v-if="showModal" class="modal-wrap">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ editId ? "Edit Product" : "Add Product" }}</h3>
          <button class="modal-close" @click="closeModal" aria-label="Close">
            X
          </button>
        </div>
        <label>Product Name <input v-model="form.name" /></label>
        <label>SKU <input v-model="form.sku" /></label>
        <label
          >Opening Stock
          <input
            type="number"
            min="0"
            step="0.01"
            v-model.number="form.openingStock"
        /></label>
        <label
          >Price
          <input type="number" min="0" step="0.01" v-model.number="form.price"
        /></label>
        <label
          >Opening Rate (Cost)
          <input
            type="number"
            min="0"
            step="0.01"
            v-model.number="form.openingRate"
        /></label>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="save">Save</button>
          <button class="btn-light btn-secondary" @click="closeModal">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div v-if="showUploadModal" class="modal-wrap">
      <div class="modal upload-modal">
        <div class="modal-head">
          <h3>{{ uploadModalTitle }}</h3>
          <button
            class="modal-close minimal"
            :disabled="
              uploadState === 'uploading' || uploadState === 'processing'
            "
            @click="closeUploadModal"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          v-if="uploadState === 'uploading' || uploadState === 'processing'"
          class="upload-modal-body centered"
        >
          <div class="progress-meta split">
            <strong>{{ uploadProgress }}%</strong>
            <span>{{ uploadPhaseLabel }}</span>
          </div>
          <div class="progress-track compact">
            <div
              class="progress-fill animated"
              :style="{ width: `${uploadProgress}%` }"
            />
          </div>
          <p class="upload-status-text">{{ uploadStatusText }}</p>
        </div>

        <div v-else-if="uploadState === 'success'" class="upload-modal-body">
          <div class="completed-summary">
            <div class="completed-row success-text">
              <span>✔ Inserted</span>
              <strong>{{ uploadResult?.insertedCount || 0 }}</strong>
            </div>
            <div class="completed-row warning-text">
              <span>⚠ Skipped</span>
              <strong>{{ formattedSkipped.length }}</strong>
            </div>
            <div class="completed-row danger-text">
              <span>✖ Errors</span>
              <strong>{{ formattedErrors.length }}</strong>
            </div>
          </div>
        </div>

        <div v-else-if="uploadState === 'error'" class="upload-modal-body">
          <div class="status-panel error-panel">
            <strong>Upload Failed</strong>
            <span>{{ uploadError }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button
            v-if="uploadState === 'success'"
            class="btn"
            @click="closeUploadModal"
          >
            View Details
          </button>
          <button
            v-if="uploadState === 'error'"
            class="btn"
            @click="retryUpload"
          >
            Retry Upload
          </button>
          <button
            v-if="uploadState === 'success' || uploadState === 'error'"
            class="btn-light"
            @click="closeUploadModal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import http from "@/api/http";

const rows = ref([]);
const search = ref("");
const stockFilter = ref("all");
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const totalPages = ref(1);

const showModal = ref(false);
const editId = ref("");
const form = reactive({
  name: "",
  sku: "",
  openingStock: 0,
  price: 0,
  openingRate: 0,
});
const fileInput = ref(null);
const uploadMessage = ref("");
const uploadResult = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const showUploadModal = ref(false);
const uploadState = ref("idle");
const uploadStatusText = ref("");
const uploadError = ref("");
const lastSelectedFile = ref(null);
let progressTimer = null;

const money = (value) => `Rs ${Number(value || 0).toFixed(2)}`;
const normalizeLabel = (value, fallback = "-") => {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const normalizeReason = (value) => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (text === "duplicate product name") return "Duplicate product";
  if (text === "invalid number in stock or price")
    return "Invalid stock or price";
  if (text === "missing required field: name")
    return "Missing required field: name";
  return normalizeLabel(text, "-");
};

const formattedSkipped = computed(() =>
  (uploadResult.value?.skipped || []).map((item) => ({
    name: String(item.name || "").trim() || "-",
    reason: normalizeReason(item.reason),
  })),
);

const formattedErrors = computed(() =>
  (uploadResult.value?.errors || []).map((item) => ({
    name: String(item.name || "").trim() || "-",
    error: normalizeReason(item.error),
  })),
);
const uploadModalTitle = computed(() => {
  if (uploadState.value === "success") return "Upload Completed ✅";
  if (uploadState.value === "error") return "Upload Failed";
  return "Uploading Products...";
});
const uploadPhaseLabel = computed(() => {
  if (uploadState.value === "processing") return "Processing...";
  return "Uploading...";
});

const startProgressSimulation = () => {
  clearInterval(progressTimer);
  uploadProgress.value = 10;
  uploadState.value = "uploading";
  uploadStatusText.value = "Uploading file...";
  progressTimer = setInterval(() => {
    if (uploadProgress.value < 70) {
      uploadProgress.value += 5;
      uploadState.value = "uploading";
      uploadStatusText.value = "Uploading file...";
    } else if (uploadProgress.value < 90) {
      uploadProgress.value += 2;
      uploadState.value = "processing";
      uploadStatusText.value = "Processing data...";
    }
  }, 180);
};

const stopProgressSimulation = () => {
  clearInterval(progressTimer);
  uploadState.value = "processing";
  uploadProgress.value = 100;
  uploadStatusText.value = "Saving products...";
  setTimeout(() => {
    isUploading.value = false;
    uploadState.value = "success";
  }, 300);
};

const load = async () => {
  const res = await http.get("/products", {
    params: {
      page: page.value,
      limit: limit.value,
    },
  });

  rows.value = res.data?.data || [];
  total.value = Number(res.data?.total || 0);
  page.value = Number(res.data?.page || 1);
  totalPages.value = Number(res.data?.totalPages || 1);
};

onMounted(load);

const filteredRows = computed(() => {
  const q = search.value.toLowerCase();
  return rows.value
    .filter((p) => (p.name || "").toLowerCase().includes(q))
    .filter((p) => {
      if (stockFilter.value === "available") return Number(p.stock || 0) > 0;
      if (stockFilter.value === "not_available")
        return Number(p.stock || 0) <= 0;
      return true;
    });
});

const startIndex = computed(() => (page.value - 1) * limit.value);
const showingText = computed(() => {
  if (!total.value) return "Showing 0 of 0 products";
  const from = startIndex.value + 1;
  const to = Math.min(startIndex.value + rows.value.length, total.value);
  return `Showing ${from}-${to} of ${total.value} products`;
});

const pageNumbers = computed(() => {
  const pages = [];
  const start = Math.max(1, page.value - 2);
  const end = Math.min(totalPages.value, page.value + 2);
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  return pages;
});

const changePage = async (nextPage) => {
  if (nextPage < 1 || nextPage > totalPages.value) return;
  page.value = nextPage;
  await load();
};

const openCreate = () => {
  editId.value = "";
  form.name = "";
  form.sku = "";
  form.openingStock = 0;
  form.price = 0;
  form.openingRate = 0;
  showModal.value = true;
};

const openEdit = (product) => {
  editId.value = product._id;
  form.name = product.name || "";
  form.sku = product.sku || "";
  form.openingStock = Number(product.openingStock || 0);
  form.price = Number(product.price || 0);
  form.openingRate = Number(product.openingRate || 0);
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const downloadSampleCsv = async () => {
  const res = await http.get("/products/sample-csv", { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "products-sample.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const triggerUpload = () => {
  if (isUploading.value) return;
  fileInput.value?.click();
};

const runCsvUpload = async (file, inputRef = null) => {
  if (!file) return;

  const csvText = await file.text();
  lastSelectedFile.value = file;
  uploadMessage.value = "";
  uploadResult.value = null;
  uploadError.value = "";
  isUploading.value = true;
  showUploadModal.value = true;
  startProgressSimulation();

  try {
    const res = await http.post(
      "/products/bulk-upload",
      { csvText },
      {
        onUploadProgress(progressEvent) {
          if (!progressEvent.total) return;
          const rawPercent = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100,
          );
          const percent = Math.max(10, Math.min(70, rawPercent));
          uploadProgress.value = percent;
        },
      },
    );
    stopProgressSimulation();
    uploadResult.value = res.data;
    uploadMessage.value = `Inserted: ${res.data.insertedCount}, Skipped: ${res.data.skipped?.length || 0}, Errors: ${res.data.errors?.length || 0}`;
    if (inputRef) inputRef.value = "";
    await load();
  } catch (error) {
    clearInterval(progressTimer);
    isUploading.value = false;
    uploadState.value = "error";
    uploadProgress.value = 0;
    uploadStatusText.value = "Upload failed";
    uploadError.value =
      error.response?.data?.message || "Failed to upload products";
    uploadMessage.value = uploadError.value;
    if (inputRef) inputRef.value = "";
  }
};

const handleCsvUpload = async (event) => {
  const file = event.target.files?.[0];
  await runCsvUpload(file, event.target);
};

const closeUploadModal = () => {
  if (uploadState.value === "uploading") return;
  showUploadModal.value = false;
  uploadProgress.value = 0;
  uploadStatusText.value = "";
  uploadState.value = "idle";
};

const retryUpload = async () => {
  if (!lastSelectedFile.value) {
    closeUploadModal();
    return;
  }
  await runCsvUpload(lastSelectedFile.value);
};

const downloadErrorReport = () => {
  const lines = [
    ["section", "product_name", "message"].join(","),
    ...formattedSkipped.value.map((item) =>
      ["skipped", `"${item.name}"`, `"${item.reason}"`].join(","),
    ),
    ...formattedErrors.value.map((item) =>
      ["error", `"${item.name}"`, `"${item.error}"`].join(","),
    ),
  ];
  const blob = new Blob([`${lines.join("\n")}\n`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "product-upload-report.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const save = async () => {
  if (!form.name || !form.sku) {
    alert("Name and SKU are required");
    return;
  }

  if (editId.value) {
    await http.put(`/products/${editId.value}`, {
      name: form.name,
      sku: form.sku,
      openingStock: Number(form.openingStock || 0),
      price: Number(form.price || 0),
      openingRate: Number(form.openingRate || 0),
    });
  } else {
    await http.post("/products", {
      name: form.name,
      sku: form.sku,
      openingStock: Number(form.openingStock || 0),
      price: Number(form.price || 0),
      openingRate: Number(form.openingRate || 0),
    });
  }

  closeModal();
  await load();
};
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
}
.head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  align-items: flex-start;
}
.subhead {
  margin: 6px 0 0;
  color: #64748b;
}
.head-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.pagination-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.actions button {
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
}
.empty {
  text-align: center;
  color: #64748b;
}
.btn {
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
.btn-light {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
.btn-light:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.hidden-input {
  display: none;
}
.upload-message {
  margin: 8px 0 12px;
  color: #475569;
}
.upload-progress,
.upload-result {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.summary-card {
  border-radius: 12px;
  padding: 14px;
  border: 1px solid transparent;
  display: grid;
  gap: 6px;
}
.summary-card.success {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}
.summary-card.warning {
  background: #fff7ed;
  border-color: #fdba74;
  color: #c2410c;
}
.summary-card.danger {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}
.summary-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.progress-head {
  font-weight: 600;
  margin-bottom: 8px;
}
.progress-track {
  height: 10px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}
.progress-track.large {
  height: 14px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #0ea5e9);
  border-radius: 999px;
  transition: width 0.2s ease;
}
.result-box {
  padding: 10px 0;
  color: #334155;
}
.result-table-wrap {
  margin-top: 10px;
  max-height: 320px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
}
.result-table th,
.result-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}
.result-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
}
.result-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.pagination {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.page-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
.page-btn.active {
  border-color: #0ea5e9;
  color: #0ea5e9;
  font-weight: 700;
}
.modal-wrap {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.45);
  display: grid;
  place-items: center;
}
.modal {
  width: min(420px, 92vw);
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 10px;
  animation: fadeIn 0.18s ease;
}
.upload-modal {
  width: min(450px, 92vw);
  padding: 20px 22px;
  gap: 16px;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal label {
  display: grid;
  gap: 6px;
}
.modal-actions {
  display: flex;
  justify-content: end;
  gap: 8px;
}
.upload-modal-body {
  display: grid;
  gap: 14px;
  padding: 4px 0;
}
.upload-modal-body.centered {
  text-align: center;
}
.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #475569;
}
.progress-meta.split strong {
  font-size: 18px;
  color: #0f172a;
}
.status-panel {
  border-radius: 10px;
  padding: 14px;
  display: grid;
  gap: 6px;
}
.success-panel {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}
.error-panel {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}
.progress-track.compact {
  height: 8px;
}
.progress-fill.animated {
  transition: width 0.25s ease;
}
.upload-status-text {
  margin: 0;
  color: #475569;
  font-size: 14px;
}
.completed-summary {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  display: grid;
  gap: 12px;
}
.completed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
}
.success-text {
  color: #166534;
}
.warning-text {
  color: #c2410c;
}
.danger-text {
  color: #b91c1c;
}
.modal-close {
  border: 1px solid #ef4444;
  background: #fff1f2;
  color: #b91c1c;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-weight: 700;
}
.modal-close.minimal {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 22px;
  line-height: 1;
}
.modal-close.minimal:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}
.modal-close.minimal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .head,
  .pagination-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
