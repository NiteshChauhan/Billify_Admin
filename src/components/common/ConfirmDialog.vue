<template>
  <Teleport to="body">
    <div v-if="open" class="confirm-backdrop" @click.self="cancel">
      <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <h3 :id="titleId">{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="confirm-dialog__actions">
          <button type="button" class="btn secondary" :disabled="loading" @click="cancel">{{ cancelLabel }}</button>
          <button type="button" :class="['btn', variant]" :disabled="loading" @click="$emit('confirm')">
            {{ loading ? 'Please wait...' : confirmLabel }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  cancelLabel: { type: String, default: "Cancel" },
  confirmLabel: { type: String, default: "Confirm" },
  loading: { type: Boolean, default: false },
  message: { type: String, default: "Are you sure?" },
  open: { type: Boolean, default: false },
  title: { type: String, default: "Confirm action" },
  variant: { type: String, default: "primary" },
});

const emit = defineEmits(["cancel", "confirm", "update:open"]);
const titleId = `confirm-${Math.random().toString(36).slice(2)}`;
const cancel = () => {
  if (props.loading) return;
  emit("update:open", false);
  emit("cancel");
};
</script>

<style scoped>
.confirm-backdrop { align-items: center; background: rgba(15, 23, 42, 0.45); display: flex; inset: 0; justify-content: center; padding: 18px; position: fixed; z-index: 2000; }
.confirm-dialog { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24); max-width: 420px; padding: 22px; width: 100%; }
.confirm-dialog h3 { color: #0f172a; font-size: 18px; margin: 0 0 8px; }
.confirm-dialog p { color: #475569; line-height: 1.55; margin: 0; white-space: pre-line; }
.confirm-dialog__actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
.btn { border: 1px solid transparent; border-radius: 8px; cursor: pointer; font-weight: 700; padding: 10px 14px; }
.btn:disabled { cursor: not-allowed; opacity: 0.65; }
.btn.secondary { background: #fff; border-color: #cbd5e1; color: #334155; }
.btn.primary { background: #2563eb; color: #fff; }
.btn.danger { background: #dc2626; color: #fff; }
</style>
