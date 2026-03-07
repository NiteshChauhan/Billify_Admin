<template>
  <div class="fy-select">
    <label for="fy">FY</label>
    <select id="fy" v-model="selectedLabel" @change="onChange">
      <option v-for="option in options" :key="option.label" :value="option.label">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  buildFinancialYearOptions,
  getFinancialYear,
  setFinancialYear,
} from "@/utils/financialYear";

const options = buildFinancialYearOptions(6);
const current = getFinancialYear();
const selectedLabel = ref(current.label);

const onChange = () => {
  const selected = options.find((item) => item.label === selectedLabel.value);
  if (selected) setFinancialYear(selected);
};
</script>

<style scoped>
.fy-select {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: #fff;
}

label {
  font-size: 12px;
  opacity: 0.9;
}

select {
  padding: 6px;
  border-radius: 6px;
  border: none;
}
</style>

