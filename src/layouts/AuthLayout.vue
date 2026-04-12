<template>
  <div class="auth-container">
    <div class="auth-card">
      <router-view />
    </div>
    <NotificationHost />
  </div>
</template>

<script setup>
import NotificationHost from "@/components/NotificationHost.vue";
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(120deg, #2563eb, #1e3a8a);
}

.auth-card {
  background: white;
  padding: 30px;
  width: 100%;
  max-width: 380px;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
</style>
