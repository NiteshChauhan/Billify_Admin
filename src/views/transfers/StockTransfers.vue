<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2>Stock Transfers</h2>
        <p>Move stock internally between branches without sale or purchase invoices.</p>
      </div>
    </div>

    <section class="panel form-panel">
      <div class="grid">
        <label class="field">
          <span>Date</span>
          <input v-model="form.transferDate" type="date" />
        </label>
        <label class="field">
          <span>From Branch</span>
          <select v-model="form.fromBranchId">
            <option v-for="branch in branches" :key="branch._id" :value="branch._id">
              {{ branch.branchName }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>To Branch</span>
          <select v-model="form.toBranchId">
            <option value="">Select branch</option>
            <option v-for="branch in destinationBranches" :key="branch._id" :value="branch._id">
              {{ branch.branchName }}
            </option>
          </select>
        </label>
        <label class="field full">
          <span>Remarks</span>
          <input v-model.trim="form.remarks" type="text" placeholder="Optional note" />
        </label>
      </div>

      <div class="item-row">
        <select v-model="itemForm.productId">
          <option value="">Select product</option>
          <option v-for="product in products" :key="product._id" :value="product._id">
            {{ product.name }}
          </option>
        </select>
        <input v-model.number="itemForm.qty" type="number" min="0" step="0.01" placeholder="Qty" />
        <button class="btn secondary" @click="addItem">Add Item</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th class="num">Qty</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!form.items.length">
              <td colspan="3" class="empty">No items added</td>
            </tr>
            <tr v-for="(item, index) in form.items" :key="`${item.productId}-${index}`">
              <td>{{ productName(item.productId) }}</td>
              <td class="num">{{ item.qty }}</td>
              <td><button class="btn danger" @click="removeItem(index)">Remove</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions">
        <button class="btn primary" @click="saveTransfer">Create Transfer</button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h3>Transfer History</h3>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Items</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!transfers.length">
              <td colspan="7" class="empty">No stock transfers found</td>
            </tr>
            <tr v-for="transfer in transfers" :key="transfer._id">
              <td>{{ transfer.transferNo }}</td>
              <td>{{ formatDate(transfer.transferDate) }}</td>
              <td>{{ transfer.fromBranchId?.branchName || "-" }}</td>
              <td>{{ transfer.toBranchId?.branchName || "-" }}</td>
              <td>{{ (transfer.items || []).length }}</td>
              <td class="capitalize">{{ transfer.status }}</td>
              <td>
                <button class="btn secondary" @click="openTransferView(transfer)">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showViewModal" class="modal-wrap">
      <div class="modal detail-modal">
        <div class="modal-head">
          <div>
            <h3>Transfer Details</h3>
            <p>Review branch movement and transferred items.</p>
          </div>
          <button class="close-btn" @click="closeTransferView">X</button>
        </div>

        <div v-if="selectedTransfer" class="detail-grid">
          <div class="detail-card">
            <span>Transfer No</span>
            <strong>{{ selectedTransfer.transferNo || "-" }}</strong>
          </div>
          <div class="detail-card">
            <span>Transfer Date</span>
            <strong>{{ formatDate(selectedTransfer.transferDate) }}</strong>
          </div>
          <div class="detail-card">
            <span>From Branch</span>
            <strong>{{ selectedTransfer.fromBranchId?.branchName || "-" }}</strong>
          </div>
          <div class="detail-card">
            <span>To Branch</span>
            <strong>{{ selectedTransfer.toBranchId?.branchName || "-" }}</strong>
          </div>
          <div class="detail-card">
            <span>Status</span>
            <strong class="capitalize">{{ selectedTransfer.status || "-" }}</strong>
          </div>
          <div class="detail-card">
            <span>Created By</span>
            <strong>{{ transferCreatedBy(selectedTransfer) }}</strong>
          </div>
          <div class="detail-card full">
            <span>Remarks</span>
            <strong>{{ selectedTransfer.remarks || "-" }}</strong>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Product Name</th>
                <th>Product Code / SKU</th>
                <th class="num">Quantity</th>
                <th class="num">Rate / Cost</th>
                <th class="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!selectedTransferItems.length">
                <td colspan="6" class="empty">No products found for this transfer.</td>
              </tr>
              <tr v-for="(item, index) in selectedTransferItems" :key="`${item.productId?._id || item.productId || 'item'}-${index}`">
                <td>{{ index + 1 }}</td>
                <td>{{ item.productId?.name || "Product" }}</td>
                <td>{{ item.productId?.sku || "-" }}</td>
                <td class="num">{{ formatNumber(item.qty) }}</td>
                <td class="num">{{ formatMoney(item.rate) }}</td>
                <td class="num">{{ formatMoney(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="actions">
          <button class="btn secondary" @click="closeTransferView">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import http from "@/api/http";
import { useAuthStore } from "@/stores/authStore";
import { useCurrency } from "@/composables/useCurrency";
import { notifySuccess, notifyWarning } from "@/utils/notifications";

const auth = useAuthStore();
const today = new Date().toISOString().slice(0, 10);
const { formatCurrency } = useCurrency();

const branches = ref([]);
const products = ref([]);
const transfers = ref([]);
const selectedTransfer = ref(null);
const showViewModal = ref(false);
const form = reactive({
  transferDate: today,
  fromBranchId: auth.selectedBranchId || "",
  toBranchId: "",
  remarks: "",
  items: [],
});
const itemForm = reactive({
  productId: "",
  qty: 1,
});

const destinationBranches = computed(() =>
  branches.value.filter((branch) => String(branch._id) !== String(form.fromBranchId || "")),
);
const selectedTransferItems = computed(() => selectedTransfer.value?.items || []);

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");
const formatNumber = (value) => Number(value || 0).toFixed(2);
const formatMoney = (value) => formatCurrency(Number(value || 0));
const productName = (productId) =>
  products.value.find((product) => String(product._id) === String(productId))?.name || "Product";
const transferCreatedBy = (transfer) => {
  if (!transfer?.createdBy) return "-";
  if (typeof transfer.createdBy === "string") return transfer.createdBy;
  return transfer.createdBy?.name || transfer.createdBy?.username || transfer.createdBy?.email || "-";
};

const load = async () => {
  const [branchRes, productRes, transferRes] = await Promise.all([
    http.get("/branches"),
    http.get("/products"),
    http.get("/stock-transfers"),
  ]);
  branches.value = branchRes.data || [];
  products.value = productRes.data || [];
  transfers.value = transferRes.data || [];
  if (!form.fromBranchId) {
    form.fromBranchId = auth.selectedBranchId || branches.value[0]?._id || "";
  }
};

const addItem = () => {
  if (!itemForm.productId || !(Number(itemForm.qty || 0) > 0)) {
    notifyWarning("Select product and enter qty");
    return;
  }
  form.items.push({
    productId: itemForm.productId,
    qty: Number(itemForm.qty || 0),
  });
  itemForm.productId = "";
  itemForm.qty = 1;
};

const removeItem = (index) => {
  form.items.splice(index, 1);
};

const openTransferView = (transfer) => {
  selectedTransfer.value = transfer;
  showViewModal.value = true;
};

const closeTransferView = () => {
  showViewModal.value = false;
  selectedTransfer.value = null;
};

const saveTransfer = async () => {
  if (!form.fromBranchId || !form.toBranchId) {
    notifyWarning("Select both branches");
    return;
  }
  if (!form.items.length) {
    notifyWarning("Add at least one item");
    return;
  }
  await http.post("/stock-transfers", form);
  notifySuccess("Stock transfer created.");
  form.toBranchId = "";
  form.remarks = "";
  form.items = [];
  await load();
};

onMounted(load);
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.page-head h2, .panel-head h3 { margin: 0; }
.page-head p { margin: 6px 0 0; color: #64748b; }
.panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: grid; gap: 14px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.item-row { display: grid; grid-template-columns: minmax(240px, 1fr) 160px 140px; gap: 12px; align-items: end; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
.num { text-align: right; }
.capitalize { text-transform: capitalize; }
.empty { text-align: center; color: #64748b; }
.actions { display: flex; justify-content: flex-end; }
input, select { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; }
.btn { border-radius: 10px; padding: 10px 14px; font-weight: 600; cursor: pointer; }
.btn.primary { border: 1px solid #2563eb; background: #2563eb; color: #fff; }
.btn.secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
.btn.danger { border: 1px solid #ef4444; background: #fff1f2; color: #b91c1c; }
.modal-wrap {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
}
.modal {
  width: min(960px, 96vw);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  display: grid;
  gap: 14px;
}
.detail-modal .modal-head p {
  margin: 6px 0 0;
  color: #64748b;
}
.modal-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.close-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(200px, 1fr));
  gap: 12px;
}
.detail-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}
.detail-card span {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}
.detail-card.full {
  grid-column: 1 / -1;
}
@media (max-width: 900px) {
  .grid, .item-row { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
