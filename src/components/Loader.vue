<template>
  <div class="loader-wrap" :class="{ inline }">
    <div class="spinner" />
    <span v-if="label" class="loader-label">{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: "Loading..." },
  inline: { type: Boolean, default: false },
});
</script>

<style scoped>
.loader-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  color: #475569;
}

.loader-wrap.inline {
  padding: 6px 0;
  justify-content: flex-start;
}

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  animation: spin 0.8s linear infinite;
}

.loader-label {
  font-size: 13px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
