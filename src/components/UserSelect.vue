<template>
  <select :value="modelValue" @change="onChange">
    <option value="">{{ placeholder }}</option>
    <option v-for="u in users" :key="u._id" :value="String(u._id)">
      {{ u.name }}
    </option>
  </select>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  users: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: "Select User",
  },
});

const emit = defineEmits(["update:modelValue"]);

const onChange = (event) => {
  emit("update:modelValue", event.target.value);
};
</script>
