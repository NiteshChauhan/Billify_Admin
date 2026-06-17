<template>
  <component
    :is="componentType"
    :to="to"
    :href="href"
    :type="buttonType"
    :class="['action-icon-button', `action-icon-button--${variant}`]"
    :title="title"
    :aria-label="ariaLabel || title"
    v-bind="linkAttrs"
    @click="$emit('click', $event)"
  >
    <svg
      aria-hidden="true"
      class="action-icon-button__icon"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <template v-if="icon === 'view'">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </template>
      <template v-else-if="icon === 'edit'">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
      </template>
      <template v-else-if="icon === 'print'">
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </template>
      <template v-else-if="icon === 'delete'">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </template>
      <template v-else-if="icon === 'power'">
        <path d="M12 2v10" />
        <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
      </template>
      <template v-else-if="icon === 'download'">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </template>
      <template v-else-if="icon === 'file-text'">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </template>
      <template v-else-if="icon === 'spreadsheet'">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h8" />
        <path d="M12 13v4" />
      </template>
      <template v-else-if="icon === 'plus'">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </template>
      <template v-else-if="icon === 'search'">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </template>
      <template v-else-if="icon === 'reset'">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 3v6h6" />
      </template>
      <template v-else>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </template>
    </svg>
  </component>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  ariaLabel: { type: String, default: "" },
  href: { type: String, default: "" },
  icon: { type: String, required: true },
  target: { type: String, default: "" },
  title: { type: String, required: true },
  to: { type: [String, Object], default: "" },
  type: { type: String, default: "button" },
  variant: { type: String, default: "view" },
});

defineEmits(["click"]);

const componentType = computed(() => {
  if (props.to) return "router-link";
  if (props.href) return "a";
  return "button";
});

const buttonType = computed(() => (componentType.value === "button" ? props.type : undefined));
const linkAttrs = computed(() => {
  if (!props.href) return {};
  return {
    target: props.target || undefined,
    rel: props.target === "_blank" ? "noopener noreferrer" : undefined,
  };
});
</script>

<style scoped>
.action-icon-button {
  align-items: center;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 34px;
  height: 34px;
  justify-content: center;
  padding: 0;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
  width: 34px;
}

.action-icon-button:hover {
  transform: translateY(-1px);
}

.action-icon-button__icon {
  height: 16px;
  width: 16px;
}

.action-icon-button--view {
  color: #2563eb;
}

.action-icon-button--view:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.action-icon-button--edit {
  color: #0f766e;
}

.action-icon-button--edit:hover {
  background: #ecfdf5;
  border-color: #5eead4;
}

.action-icon-button--print,
.action-icon-button--download,
.action-icon-button--pdf,
.action-icon-button--excel {
  color: #0369a1;
}

.action-icon-button--print:hover,
.action-icon-button--download:hover,
.action-icon-button--pdf:hover,
.action-icon-button--excel:hover {
  background: #f0f9ff;
  border-color: #7dd3fc;
}

.action-icon-button--danger {
  color: #b91c1c;
}

.action-icon-button--danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.action-icon-button--success {
  color: #15803d;
}

.action-icon-button--success:hover {
  background: #f0fdf4;
  border-color: #86efac;
}

.action-icon-button--warning {
  color: #a16207;
}

.action-icon-button--warning:hover {
  background: #fefce8;
  border-color: #fde68a;
}
</style>
