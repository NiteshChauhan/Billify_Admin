<template>
  <div class="stock-card">
    <h2 class="title">Opening Stock</h2>

    <div class="product-info">
      <div><strong>Product:</strong> {{ product.name }}</div>
      <div><strong>SKU:</strong> {{ product.sku }}</div>
    </div>

    <div v-if="alreadyAdded && !editMode" class="already">
      <p>Opening stock already added</p>
      <div class="summary">
        <div><strong>Quantity:</strong> {{ existing.quantity }}</div>
        <div><strong>Rate:</strong> Rs {{ existing.rate }}</div>
        <div><strong>Total:</strong> Rs {{ existing.amount }}</div>
      </div>
      <button v-if="existing.editable" class="btn-primary" @click="editMode = true">
        Edit Opening Stock
      </button>
      <p v-else class="error">
        Editing disabled: purchase/sale/return already exists for this product.
      </p>
      <router-link to="/products" class="btn-secondary">Back to Products</router-link>
    </div>

    <form v-else @submit.prevent="submit">
      <div class="form-group">
        <label>Quantity *</label>
        <input type="number" v-model.number="form.quantity" required min="0.01" step="0.01" />
      </div>
      <div class="form-group">
        <label>Rate</label>
        <input type="number" v-model.number="form.rate" min="0" step="0.01" />
      </div>
      <div class="form-group readonly">
        <label>Total</label>
        <input :value="total" readonly />
      </div>

      <p v-if="message" :class="type" class="message">{{ message }}</p>
      <button class="btn-primary">{{ alreadyAdded ? "Update Opening Stock" : "Save Opening Stock" }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";

const route = useRoute();
const router = useRouter();
const productId = route.params.productId;

const product = ref({});
const existing = ref({});
const alreadyAdded = ref(false);
const editMode = ref(false);
const form = reactive({ quantity: 0, rate: 0 });
const message = ref("");
const type = ref("");

const total = computed(() => (form.quantity * form.rate).toFixed(2));

onMounted(async () => {
  try {
    const prodRes = await http.get(`/products/${productId}`);
    product.value = prodRes.data;
    const stockRes = await http.get(`/opening-stock/${productId}`);
    if (stockRes.data.exists) {
      alreadyAdded.value = true;
      existing.value = stockRes.data;
      form.quantity = stockRes.data.quantity;
      form.rate = stockRes.data.rate;
    }
  } catch {
    // no-op
  }
});

const submit = async () => {
  try {
    if (form.quantity <= 0) {
      message.value = "Quantity must be greater than zero";
      type.value = "error";
      return;
    }

    if (alreadyAdded.value) {
      await http.put(`/opening-stock/${productId}`, {
        quantity: form.quantity,
        rate: form.rate,
      });
      message.value = "Opening stock updated successfully";
    } else {
      await http.post("/opening-stock", {
        productId,
        quantity: form.quantity,
        rate: form.rate,
      });
      message.value = "Opening stock added successfully";
    }

    type.value = "success";
    setTimeout(() => router.push("/products"), 800);
  } catch (err) {
    message.value = err.response?.data?.message || "Failed to save opening stock";
    type.value = "error";
  }
};
</script>

<style scoped>
.stock-card {
  max-width: 520px;
  margin: 30px auto;
  padding: 25px;
  background: #fff;
  border-radius: 8px;
}
.title {
  text-align: center;
  margin-bottom: 20px;
}
.product-info {
  background: #f8fafc;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 5px;
}
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.readonly input {
  background: #f3f4f6;
}
label {
  font-weight: 600;
  margin-bottom: 5px;
}
input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.btn-primary {
  width: 100%;
  padding: 12px;
}
.btn-secondary {
  display: inline-block;
  margin-top: 15px;
}
.message {
  text-align: center;
  margin-bottom: 10px;
}
.success {
  color: green;
}
.error {
  color: red;
}
.summary {
  margin-top: 10px;
}
</style>
