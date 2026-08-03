<template>
  <span class="contact-actions">
    <ActionIconButton
      icon="message"
      title="Open WhatsApp"
      variant="success"
      :disabled="!phone"
      @click="handleWhatsApp"
    />
    <ActionIconButton
      icon="phone"
      title="Call"
      variant="view"
      :disabled="!phone"
      @click="handleCall"
    />
  </span>
</template>

<script setup>
import ActionIconButton from "@/components/common/ActionIconButton.vue";
import { openWhatsApp, startPhoneCall } from "@/utils/contactActions";
import { notifyWarning } from "@/utils/notifications";

const props = defineProps({
  message: { type: String, default: "" },
  phone: { type: String, default: "" },
});

const handleWhatsApp = () => {
  if (!openWhatsApp(props.phone, props.message)) notifyWarning("Phone number is not available");
};

const handleCall = () => {
  if (!startPhoneCall(props.phone)) notifyWarning("Phone number is not available");
};
</script>

<style scoped>
.contact-actions { display: inline-flex; gap: 6px; vertical-align: middle; }
</style>
