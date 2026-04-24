<template>
  <div class="form-card">
    <h2 class="title">
      {{ isEdit ? "Edit Product" : "Add Product" }}
    </h2>

    <form @submit.prevent="submit">
      <!-- Product Name -->
      <div class="form-group">
        <label>Product Name</label>
        <input v-model="form.name" required />
      </div>

      <!-- SKU -->
      <div class="form-group">
        <label>SKU / Code</label>
        <input v-model="form.sku" required />
      </div>

      <div class="form-group">
        <label>Opening Stock</label>
        <input type="number" min="0" step="0.01" v-model.number="form.openingStock" />
      </div>

      <div class="form-group">
        <label>Price</label>
        <input type="number" min="0" step="0.01" v-model.number="form.price" />
      </div>

      <div class="form-group">
        <label>Opening Rate (Cost)</label>
        <input type="number" min="0" step="0.01" v-model.number="form.openingRate" />
      </div>

      <div class="form-group">
        <label>Stock Settlement</label>
        <select v-model="form.stockMode">
          <option value="flexible">Not Done (Allow Negative Sale)</option>
          <option value="locked">Done (Block Short Stock Sale)</option>
        </select>
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
  getProductByIdApi
} from "@/api/productApi";

const route = useRoute();
const router = useRouter();

/* 🔍 Edit mode */
const isEdit = computed(() => !!route.params.id);

/* 📦 Form state */
const form = reactive({
  name: "",
  sku: "",
  openingStock: 0,
  price: 0,
  openingRate: 0,
  stockMode: "flexible",
  attributes: [
    { key: "", value: "" }
  ]
});

const message = ref("");
const type = ref("");

/* 📥 Load product for edit */
onMounted(async () => {
  if (isEdit.value) {
    try {
      const res = await getProductByIdApi(route.params.id);

      form.name = res.data.name;
      form.sku = res.data.sku;
      form.openingStock = Number(res.data.openingStock || 0);
      form.price = Number(res.data.price || 0);
      form.openingRate = Number(res.data.openingRate || 0);
      form.stockMode = String(res.data.stockMode || "flexible");

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

/* ➕ Add attribute */
const addAttribute = () => {
  form.attributes.push({ key: "", value: "" });
};

/* ❌ Remove attribute */
const removeAttribute = (index) => {
  form.attributes.splice(index, 1);
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
      sku: form.sku,
      openingStock: Number(form.openingStock || 0),
      price: Number(form.price || 0),
      openingRate: Number(form.openingRate || 0),
      stockMode: form.stockMode === "locked" ? "locked" : "flexible",
      attributes: attributesObj
    };

    if (isEdit.value) {
      await updateProductApi(route.params.id, payload);
      message.value = "Product updated successfully";
    } else {
      await createProductApi(payload);
      message.value = "Product created successfully";
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
