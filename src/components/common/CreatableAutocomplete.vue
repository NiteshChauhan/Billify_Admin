<template>
  <div class="autocomplete" ref="rootEl">
    <label v-if="label" class="autocomplete__label">{{ label }} <span v-if="required">*</span></label>
    <div :class="['autocomplete__box', { 'is-open': isOpen, 'is-disabled': disabled }]">
      <input
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        class="autocomplete__input"
        @focus="openMenu"
        @input="handleInput"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="chooseHighlighted"
        @keydown.esc="closeMenu"
      />
      <button v-if="modelValue && !disabled" class="autocomplete__clear" type="button" title="Clear" @click="clearSelection">×</button>
    </div>
    <div v-if="isOpen" class="autocomplete__menu">
      <div v-if="loading" class="autocomplete__state">Loading...</div>
      <button
        v-for="(option, index) in options"
        :key="optionKey(option, index)"
        :class="['autocomplete__option', { active: index === highlightedIndex }]"
        type="button"
        @mousedown.prevent="selectOption(option)"
      >
        <strong>{{ optionLabel(option) }}</strong>
        <span v-if="optionMeta(option)">{{ optionMeta(option) }}</span>
      </button>
      <button
        v-if="canCreate"
        :class="['autocomplete__option', 'create', { active: highlightedIndex === options.length }]"
        type="button"
        @mousedown.prevent="createOption"
      >
        {{ createText }}
      </button>
      <div v-if="!loading && !options.length && !canCreate" class="autocomplete__state">No matches</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  allowCreate: { type: Boolean, default: false },
  createLabel: { type: Function, default: null },
  disabled: { type: Boolean, default: false },
  getOptionLabel: { type: Function, default: (option) => option?.name || option?.label || "" },
  getOptionMeta: { type: Function, default: (option) => option?.mobile || option?.phone || option?.sku || option?.address || "" },
  label: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  modelValue: { type: Object, default: null },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: "Search..." },
  required: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "search", "create", "select"]);
const rootEl = ref(null);
const inputValue = ref("");
const isOpen = ref(false);
const highlightedIndex = ref(0);
let timer = null;

const optionLabel = (option) => String(props.getOptionLabel(option) || "");
const optionMeta = (option) => String(props.getOptionMeta(option) || "");
const displayValue = computed(() => (props.modelValue ? optionLabel(props.modelValue) : inputValue.value));
const canCreate = computed(() => {
  const value = inputValue.value.trim();
  if (!props.allowCreate || !value) return false;
  return !props.options.some((option) => optionLabel(option).toLowerCase() === value.toLowerCase());
});
const createText = computed(() => props.createLabel?.(inputValue.value.trim()) || `Create "${inputValue.value.trim()}"`);

watch(() => props.modelValue, (value) => {
  inputValue.value = value ? optionLabel(value) : "";
}, { immediate: true });

const optionKey = (option, index) => option?._id || option?.id || `${optionLabel(option)}-${index}`;
const emitSearch = (value) => {
  clearTimeout(timer);
  timer = setTimeout(() => emit("search", value), 300);
};
const openMenu = () => {
  if (props.disabled) return;
  isOpen.value = true;
  emitSearch(inputValue.value.trim());
};
const closeMenu = () => {
  isOpen.value = false;
};
const handleInput = (event) => {
  inputValue.value = event.target.value;
  highlightedIndex.value = 0;
  emit("update:modelValue", null);
  isOpen.value = true;
  emitSearch(inputValue.value.trim());
};
const selectOption = (option) => {
  emit("update:modelValue", option);
  emit("select", option);
  closeMenu();
};
const createOption = () => {
  const value = inputValue.value.trim();
  if (!value) return;
  emit("create", value);
  closeMenu();
};
const chooseHighlighted = () => {
  if (highlightedIndex.value < props.options.length) {
    selectOption(props.options[highlightedIndex.value]);
    return;
  }
  if (canCreate.value) createOption();
};
const move = (direction) => {
  const count = props.options.length + (canCreate.value ? 1 : 0);
  if (!count) return;
  highlightedIndex.value = (highlightedIndex.value + direction + count) % count;
};
const clearSelection = async () => {
  emit("update:modelValue", null);
  inputValue.value = "";
  await nextTick();
  emitSearch("");
};
const handleOutsideClick = (event) => {
  if (rootEl.value && !rootEl.value.contains(event.target)) closeMenu();
};

onMounted(() => document.addEventListener("mousedown", handleOutsideClick));
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
  clearTimeout(timer);
});
</script>

<style scoped>
.autocomplete { position: relative; }
.autocomplete__label { color: #334155; display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.autocomplete__label span { color: #dc2626; }
.autocomplete__box { align-items: center; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; min-height: 40px; }
.autocomplete__box.is-open { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.autocomplete__box.is-disabled { background: #f8fafc; }
.autocomplete__input { background: transparent; border: 0; color: #0f172a; flex: 1; font: inherit; min-width: 0; outline: 0; padding: 10px 12px; }
.autocomplete__clear { background: transparent; border: 0; color: #64748b; cursor: pointer; font-size: 20px; height: 32px; width: 32px; }
.autocomplete__menu { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.16); left: 0; max-height: 260px; overflow: auto; padding: 6px; position: absolute; right: 0; top: calc(100% + 6px); z-index: 60; }
.autocomplete__option { background: transparent; border: 0; border-radius: 6px; color: #0f172a; cursor: pointer; display: flex; flex-direction: column; gap: 2px; padding: 9px 10px; text-align: left; width: 100%; }
.autocomplete__option span, .autocomplete__state { color: #64748b; font-size: 12px; }
.autocomplete__option.active, .autocomplete__option:hover { background: #eff6ff; }
.autocomplete__option.create { color: #0f766e; font-weight: 700; }
.autocomplete__state { padding: 10px; }
</style>
