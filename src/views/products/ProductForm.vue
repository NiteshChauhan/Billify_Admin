<template>
  <div class="form-card">
    <h2 class="title">
      {{ isEdit ? "Edit Product" : "Add Product" }}
    </h2>

    <form @submit.prevent="submit">
      <!-- Product Name -->
      <div class="form-group">
        <label>Product Name </label>
        <input v-model="form.name" required />
      </div>

      <!-- <div class="form-group">
        <label>Product Name (Arabic)</label>
        <input v-model="form.nameAr" />
      </div>

      <div class="form-group">
        <label>Product Name (Hindi)</label>
        <input v-model="form.nameHi" />
      </div> -->

      <!-- SKU -->
      <div class="form-group">
        <label>SKU / Code</label>
        <input v-model="form.sku" required />
      </div>

      <div class="form-group">
        <label>Opening Stock</label>
        <input type="number" min="0" step="0.01" v-model.number="form.openingStock" />
      </div>

      <div v-if="isEdit" class="stock-panel">
        <span>Current Stock</span>
        <strong>{{ currentStock }} {{ selectedUnitLabel }}</strong>
      </div>

      <div class="form-group">
        <label>Price</label>
        <input type="number" min="0" step="0.01" v-model.number="form.price" />
      </div>

      <div class="form-group">
        <label>Unit</label>
        <select v-model="form.unitId">
          <option value="">No unit</option>
          <option v-for="unit in units" :key="unit._id" :value="unit._id">
            {{ unit.name }}{{ unit.shortName ? ` (${unit.shortName})` : "" }}
          </option>
        </select>
      </div>

      <div class="form-group quick-unit">
        <label>Quick Add Unit</label>
        <div class="quick-row">
          <input v-model.trim="newUnitName" placeholder="Unit name" />
          <button type="button" class="btn-secondary" @click="quickAddUnit">Add</button>
        </div>
      </div>

      <div class="form-group">
        <label>Opening Rate (Cost)</label>
        <input type="number" min="0" step="0.01" v-model.number="form.openingRate" />
      </div>

      <div class="form-group">
        <label>Low Stock Alert</label>
        <input type="number" min="0" step="0.01" v-model.number="form.lowStockAlert" />
      </div>

      <div v-if="isEdit" class="adjust-panel">
        <h3>Stock Adjustment</h3>
        <select v-model="stockAdjustment.type">
          <option value="set">Set Stock</option>
          <option value="increase">Add Stock</option>
          <option value="decrease">Reduce Stock</option>
        </select>
        <input type="number" min="0" step="0.01" v-model.number="stockAdjustment.quantity" placeholder="Quantity" />
        <input v-model.trim="stockAdjustment.reason" placeholder="Reason" />
        <button type="button" class="btn-secondary" @click="adjustStock">Update Stock</button>
      </div>

      <!-- Attributes -->
      <div class="form-group">
        <label>Product Attributes</label>

        <div
          v-for="(attr, index) in form.attributes"
          :key="index"
          class="attr-row"
        >
          <input
            v-model="attr.key"
            placeholder="Attribute (e.g. Unit, Weight)"
          />
          <input
            v-model="attr.value"
            placeholder="Value (e.g. kg, 25kg)"
          />
          <button
            type="button"
            class="btn-remove"
            @click="removeAttribute(index)"
          >
            ✕
          </button>
        </div>

        <button type="button" class="btn-secondary" @click="addAttribute">
          + Add Attribute
        </button>
      </div>

      <ConfirmDialog
        v-model:open="unitConfirm.open"
        title="Create new Unit?"
        :message="`Name: ${unitConfirm.name}`"
        confirm-label="Create and Select"
        :loading="unitConfirm.loading"
        @confirm="confirmQuickAddUnit"
      />

      <!-- Message -->
      <p v-if="message" :class="type" class="message">
        {{ message }}
      </p>

      <!-- Submit -->
      <button class="btn-primary">
        {{ isEdit ? "Update Product" : "Save Product" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createProductApi,
  updateProductApi,
  getProductByIdApi,
  updateProductStockApi
} from "@/api/productApi";
import { createUnitApi, listUnitsApi } from "@/api/applicatorApi";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import { notifyError, notifySuccess, notifyWarning, parseApiError } from "@/utils/notifications";

const route = useRoute();
const router = useRouter();

/* 🔍 Edit mode */
const isEdit = computed(() => !!route.params.id);

/* 📦 Form state */
const form = reactive({
  name: "",
  nameAr: "",
  nameHi: "",
  sku: "",
  openingStock: 0,
  price: 0,
  openingRate: 0,
  lowStockAlert: 0,
  unitId: "",
  attributes: [
    { key: "", value: "" }
  ]
});

const message = ref("");
const type = ref("");
const units = ref([]);
const newUnitName = ref("");
const unitConfirm = reactive({ open: false, loading: false, name: "" });
const currentStock = ref(0);
const stockAdjustment = reactive({ type: "set", quantity: 0, reason: "" });
const selectedUnitLabel = computed(() => {
  const unit = units.value.find((entry) => String(entry._id) === String(form.unitId));
  return unit?.shortName || unit?.name || "";
});

/* 📥 Load product for edit */
onMounted(async () => {
  units.value = (await listUnitsApi({ status: "active" })).data || [];
  if (isEdit.value) {
    try {
      const res = await getProductByIdApi(route.params.id);

      form.name = res.data.name;
      form.nameAr = res.data.nameAr || "";
      form.nameHi = res.data.nameHi || "";
      form.sku = res.data.sku;
      form.openingStock = Number(res.data.openingStock || 0);
      form.price = Number(res.data.price || 0);
      form.openingRate = Number(res.data.openingRate || 0);
      form.lowStockAlert = Number(res.data.lowStockAlert || 0);
      form.unitId = res.data.unitId || "";
      currentStock.value = Number(res.data.currentStock ?? res.data.stock ?? 0);
      stockAdjustment.quantity = currentStock.value;

      /* 🔥 Convert attributes object → array */
      form.attributes = Object.entries(res.data.attributes || {}).map(
        ([key, value]) => ({ key, value })
      );
    } catch (err) {
      message.value = "Failed to load product";
      type.value = "error";
    }
  }
});

const quickAddUnit = async () => {
  const name = String(newUnitName.value || "").trim();
  if (!name) {
    notifyWarning("Unit name is required.");
    return;
  }
  unitConfirm.name = name;
  unitConfirm.open = true;
};

const confirmQuickAddUnit = async () => {
  unitConfirm.loading = true;
  try {
    const res = await createUnitApi({ name: unitConfirm.name });
    units.value = [res.data, ...units.value.filter((unit) => String(unit._id) !== String(res.data._id))];
    form.unitId = res.data?._id || "";
    newUnitName.value = "";
    unitConfirm.open = false;
    notifySuccess("Unit created successfully.");
  } catch (err) {
    notifyError(parseApiError(err));
  } finally {
    unitConfirm.loading = false;
  }
};

/* ➕ Add attribute */
const addAttribute = () => {
  form.attributes.push({ key: "", value: "" });
};

/* ❌ Remove attribute */
const removeAttribute = (index) => {
  form.attributes.splice(index, 1);
};

const adjustStock = async () => {
  if (!isEdit.value) return;
  if (Number(stockAdjustment.quantity || 0) < 0) {
    notifyWarning("Quantity cannot be negative.");
    return;
  }
  try {
    const res = await updateProductStockApi(route.params.id, {
      type: stockAdjustment.type,
      quantity: Number(stockAdjustment.quantity || 0),
      reason: stockAdjustment.reason,
    });
    currentStock.value = Number(res.data?.data?.currentStock ?? res.data?.data?.product?.currentStock ?? 0);
    form.openingStock = Number(res.data?.data?.openingStock ?? form.openingStock);
    stockAdjustment.quantity = currentStock.value;
    stockAdjustment.reason = "";
    notifySuccess("Product stock updated successfully.");
  } catch (err) {
    notifyError(parseApiError(err));
  }
};

/* 💾 Submit */
const submit = async () => {
  try {
    /* 🔁 Convert attributes array → object */
    const attributesObj = {};
    form.attributes.forEach(a => {
      if (a.key) attributesObj[a.key] = a.value;
    });

    const payload = {
      name: form.name,
      nameAr: form.nameAr,
      nameHi: form.nameHi,
      sku: form.sku,
      openingStock: Number(form.openingStock || 0),
      price: Number(form.price || 0),
      openingRate: Number(form.openingRate || 0),
      lowStockAlert: Number(form.lowStockAlert || 0),
      unitId: form.unitId || null,
      attributes: attributesObj
    };

    if (isEdit.value) {
      await updateProductApi(route.params.id, payload);
      message.value = "Product updated successfully";
      notifySuccess("Product updated successfully.");
    } else {
      await createProductApi(payload);
      message.value = "Product created successfully";
      notifySuccess("Product created successfully.");
    }

    type.value = "success";
    setTimeout(() => router.push("/products"), 800);
  } catch (err) {
    message.value =
      err.response?.data?.message || "Failed to save product";
    type.value = "error";
  }
};
</script>

<style scoped>
.form-card {
  max-width: 560px;
  margin: 30px auto;
  padding: 25px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,.05);
}

.title {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 6px;
}

input,
select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.attr-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.quick-row {
  display: flex;
  gap: 8px;
}

.quick-row input {
  flex: 1;
}

.stock-panel,
.adjust-panel {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.stock-panel span {
  color: #64748b;
  font-size: 13px;
}

.adjust-panel h3 {
  margin: 0;
  font-size: 15px;
}

.btn-remove {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0 10px;
  border-radius: 4px;
}

.btn-secondary {
  margin-top: 8px;
  padding: 8px;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 5px;
}

.message {
  text-align: center;
  margin-bottom: 10px;
}

.success { color: green; }
.error { color: red; }

@media (max-width: 600px) {
  .form-card {
    margin: 15px;
  }
}
</style>
