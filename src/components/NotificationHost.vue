<template>
  <div class="toast-host">
    <transition-group name="toast">
      <div
        v-for="item in items"
        :key="item.id"
        :class="['toast', item.type]"
      >
        <div class="toast-header">
          <strong>{{ titleFor(item) }}</strong>
          <button class="toast-close" @click="remove(item.id)">×</button>
        </div>
        <p class="toast-message">{{ item.message }}</p>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useNotificationStore } from "@/stores/notificationStore";

const store = useNotificationStore();
const { items } = storeToRefs(store);

const remove = (id) => {
  store.remove(id);
};

const titleFor = (item) => {
  if (item.title) return item.title;
  if (item.type === "success") return "Success";
  if (item.type === "error") return "Error";
  if (item.type === "warning") return "Warning";
  return "Info";
};

const schedule = (item) => {
  if (!item.timeout) return;
  setTimeout(() => remove(item.id), item.timeout);
};

onMounted(() => {
  items.value.forEach(schedule);
});

watch(
  items,
  (next, prev = []) => {
    next.forEach((item) => {
      if (!prev.find((old) => old.id === item.id)) {
        schedule(item);
      }
    });
  },
  { deep: true },
);
</script>

<style scoped>
.toast-host {
  position: fixed;
  right: 18px;
  bottom: 18px;
  display: grid;
  gap: 10px;
  z-index: 2000;
}

.toast {
  min-width: 240px;
  max-width: 320px;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
  background: #fff;
  border: 1px solid #e2e8f0;
}

.toast.success {
  border-color: #86efac;
  background: #f0fdf4;
  color: #166534;
}

.toast.error {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}

.toast.warning {
  border-color: #fdba74;
  background: #fff7ed;
  color: #c2410c;
}

.toast.info {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}

.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  margin-bottom: 6px;
}

.toast-message {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

.toast-close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: currentColor;
  opacity: 0.7;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
