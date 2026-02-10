<template>
  <div class="app">
    <!-- TOP BAR (MOBILE ONLY) -->
    <header class="topbar">
      <button class="menu-btn" @click="toggleSidebar">☰</button>
      <span class="title">Billing ERP</span>
    </header>

    <!-- BACKDROP -->
    <div v-if="isSidebarOpen" class="backdrop" @click="toggleSidebar"></div>

    <!-- SIDEBAR -->
    <aside :class="['sidebar', { open: isSidebarOpen }]">
      <h3 class="logo">Billing ERP</h3>

      <nav @click="closeSidebar">
        <router-link to="/" class="nav-item" exact-active-class="active">
          Dashboard
        </router-link>

        <router-link to="/products" class="nav-item">Products</router-link>
        <router-link to="/suppliers" class="nav-item">Suppliers</router-link>
        <router-link to="/vendors" class="nav-item">Customers</router-link>

        <div class="menu">
          <div class="menu-title">Purchase</div>
          <router-link to="/purchase/create" class="nav-sub">
            + New Purchase
          </router-link>
          <router-link to="/purchase" class="nav-sub">
            Purchase List
          </router-link>
        </div>

        <div class="menu">
          <div class="menu-title">Sales</div>
          <router-link to="/sales/create" class="nav-sub">
            + New Sale
          </router-link>
          <router-link to="/sales" class="nav-sub"> Sales Invoice </router-link>
        </div>

        <div class="menu">
          <div class="menu-title">Reports</div>
          <router-link to="/reports/outstanding" class="nav-sub">
            Outstanding
          </router-link>
          <router-link to="/reports/ageing" class="nav-sub">
            Ageing Report
          </router-link>
          <router-link to="/reports/profit" class="nav-item">
            Profit & Loss
          </router-link>
        </div>
      </nav>

      <button class="logout" @click="handleLogout">Logout</button>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const router = useRouter();

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  if (window.innerWidth <= 768) {
    isSidebarOpen.value = false;
  }
};

const handleLogout = () => {
  auth.logout();
  router.replace("/login");
};
</script>

<style scoped>
/* ===== DESKTOP LAYOUT ===== */
.app {
  display: flex;
  min-height: 100vh;
  background: #f4f6fa;
}

/* TOP BAR */
.topbar {
  display: none; /* hidden on desktop */
  align-items: center;
  gap: 12px;
  background: #1e3a8a;
  color: white;
  padding: 12px 16px;
}

.menu-btn {
  font-size: 22px;
  width: 10%;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

.title {
  font-weight: 600;
}

/* SIDEBAR */
.sidebar {
  width: 240px;
  background: #1e3a8a;
  color: white;
  padding: 20px;
  flex-shrink: 0;
}

.logo {
  margin-bottom: 20px;
}

/* NAV */
.nav-item,
.nav-sub {
  display: block;
  padding: 10px;
  border-radius: 6px;
  color: white;
  text-decoration: none;
  margin-bottom: 6px;
}

.nav-sub {
  font-size: 14px;
  margin-left: 10px;
}

.active {
  background: #2563eb;
}

.menu {
  margin-top: 15px;
}

.menu-title {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 6px;
}

/* LOGOUT */
.logout {
  margin-top: 20px;
  width: 100%;
  padding: 10px;
  background: #dc2626;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

/* CONTENT */
.content {
  flex: 1;
  padding: 20px;
}

/* BACKDROP */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
}

/* ===== MOBILE LAYOUT ===== */
@media (max-width: 768px) {
  .app {
    display: block;
  }

  /* ✅ SHOW TOPBAR */
  .topbar {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1001;
  }

  /* SIDEBAR AS DRAWER */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  /* PUSH CONTENT BELOW TOPBAR */
  .content {
    padding-top: 60px;
  }
}
</style>
