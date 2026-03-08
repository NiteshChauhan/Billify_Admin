<template>
  <div class="kpi-card">
    <h4>{{ title }}</h4>
    <p>{{ value }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number]
});
</script>

<style scoped>
.kpi-card {
  background: white;
  padding: 12px 14px;
  border-radius: 10px;
  min-height: 84px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

h4 {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

p {
  margin-top: 6px;
  font-size: 18px;
  font-weight: bold;
  line-height: 1.2;
}
</style>
