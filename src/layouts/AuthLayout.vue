<template>
  <div class="auth-container">
    <section class="brand-panel" aria-label="Billify overview">
      <div class="brand-mark">
        <span class="brand-logo">B</span>
        <span>Billify</span>
      </div>

      <div class="brand-copy">
        <p class="eyebrow">Admin workspace</p>
        <h1>Smart Billing & Business Management</h1>
        <p>
          Manage invoices, payments, products, parties, branches, and reports
          from one secure dashboard.
        </p>
      </div>

      <ul class="feature-list">
        <li>Create invoices faster</li>
        <li>Manage parties and payments</li>
        <li>Track branches and reports</li>
        <li>Secure business dashboard</li>
      </ul>
    </section>

    <main class="auth-main">
      <div class="auth-card">
        <router-view />
      </div>
      <p class="auth-footer">(c) Billify. All rights reserved.</p>
    </main>
    <NotificationHost />
  </div>
</template>

<script setup>
import NotificationHost from "@/components/NotificationHost.vue";
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 0.95fr) minmax(420px, 1.05fr);
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.28), transparent 34%),
    linear-gradient(135deg, #eaf2ff 0%, #f8fafc 42%, #eef6f3 100%);
  color: #0f172a;
  overflow: hidden;
}

.brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 36px;
  padding: 54px;
  background:
    linear-gradient(150deg, rgba(15, 23, 42, 0.9), rgba(23, 107, 91, 0.9)),
    linear-gradient(135deg, #0f172a, #176b5b);
  color: #f8fafc;
}

.brand-panel::after {
  content: "";
  position: absolute;
  right: -110px;
  bottom: -110px;
  width: 300px;
  height: 300px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
}

.brand-mark {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 800;
}

.brand-logo {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #ffffff;
  color: #176b5b;
  box-shadow: 0 16px 38px rgba(2, 6, 23, 0.22);
}

.brand-copy {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #99f6e4;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.brand-copy h1 {
  margin: 0;
  font-size: clamp(34px, 4vw, 58px);
  line-height: 1.03;
  letter-spacing: 0;
}

.brand-copy p {
  margin: 18px 0 0;
  color: #dbeafe;
  font-size: 16px;
  line-height: 1.7;
}

.feature-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #eef2ff;
  font-weight: 700;
}

.feature-list li::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5eead4;
  box-shadow: 0 0 0 5px rgba(94, 234, 212, 0.16);
}

.auth-main {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 18px;
  padding: 32px;
}

.auth-card {
  background: white;
  width: 100%;
  max-width: 450px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
}

.auth-footer {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 960px) {
  .auth-container {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    display: none;
  }

  .auth-main {
    min-height: 100vh;
    padding: 22px;
  }
}

@media (max-width: 520px) {
  .auth-main {
    padding: 14px;
  }

  .auth-card {
    border-radius: 14px;
  }
}
</style>
