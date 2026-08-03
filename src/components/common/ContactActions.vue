<template>
  <span class="contact-actions">
    <ActionIconButton
      icon="message"
      :title="hasValidPhone ? 'Open WhatsApp' : 'Mobile number unavailable'"
      variant="success"
      @click="handleWhatsApp"
    />
    <ActionIconButton
      icon="phone"
      :title="hasValidPhone ? 'Call' : 'Mobile number unavailable'"
      variant="view"
      @click="handleCall"
    />
  </span>
</template>

<script setup>
import { computed } from "vue";
import ActionIconButton from "@/components/common/ActionIconButton.vue";
import { normalizePhoneNumber, openWhatsApp, startPhoneCall } from "@/utils/contactActions";
import { notifyWarning } from "@/utils/notifications";

const props = defineProps({
  message: { type: String, default: "" },
  phone: { type: String, default: "" },
});

const hasValidPhone = computed(() => Boolean(normalizePhoneNumber(props.phone)));

const stopEvent = (event) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
};

const handleWhatsApp = (event) => {
  stopEvent(event);
  try {
    openWhatsApp(props.phone, props.message);
  } catch (error) {
    notifyWarning(error.message || "Mobile number is unavailable.");
  }
};

const handleCall = (event) => {
  stopEvent(event);
  try {
    startPhoneCall(props.phone);
  } catch (error) {
    notifyWarning(error.message || "Mobile number is unavailable.");
  }
};
</script>

<style scoped>
.contact-actions { display: inline-flex; gap: 6px; vertical-align: middle; }
</style>
