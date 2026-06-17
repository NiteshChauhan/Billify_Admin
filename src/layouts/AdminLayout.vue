<template>
  <div class="admin-shell" :style="{ '--app-sidebar-width': sidebarWidth }">
    <aside
      :class="['sidebar', { collapsed: !isSidebarOpen, open: mobileOpen }]"
    >
      <div class="brand-row">
        <h2 v-if="isSidebarOpen">Billing Admin</h2>
      </div>

      <FinancialYearSelect v-if="isSidebarOpen" />

      <nav class="nav" @click="closeMobile">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          exact-active-class="active"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="item.icon" />
            </svg>
          </span>
          <span v-if="isSidebarOpen" class="nav-label">{{ item.label }}</span>
          <span v-else class="nav-tooltip">{{ item.label }}</span>
        </router-link>
      </nav>

      <button class="logout" @click="handleLogout">
        <span class="nav-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </span>
        <span v-if="isSidebarOpen">Logout</span>
      </button>
    </aside>

    <div class="main-wrap">
      <header class="topbar">
        <button class="icon-btn" @click="toggleSidebar">&#9776;</button>
        <h3>Billing</h3>
        <div class="topbar-spacer" />
        <div class="quick-actions">
          <router-link class="quick-btn" to="/entry?type=sale">Add Invoice</router-link>
          <button class="quick-btn" @click="downloadCsv">Export Excel</button>
          <button class="quick-btn" @click="downloadPdf">Export PDF</button>
          <button class="quick-btn" @click="downloadApplicatorSummary">Applicator Summary</button>
          <router-link class="quick-btn" to="/payments">Add Payment</router-link>
        </div>
        <label class="company-switcher">
          <span>Branch</span>
          <select
            :value="selectedBranchId"
            :disabled="companyLoading || branchOptions.length <= 1"
            @change="handleBranchChange"
          >
            <option
              v-for="branch in branchOptions"
              :key="branch._id"
              :value="branch._id"
            >
              {{ branch.branchCode ? `${branch.branchName} (${branch.branchCode})` : branch.branchName }}
            </option>
          </select>
        </label>
        <div class="company-chip">{{ currentBranchLabel }}</div>
      </header>
      <div v-if="auth.subscriptionWarning" class="subscription-warning">
        {{ auth.subscriptionWarning.message }}
      </div>
      <main class="content"><router-view /></main>
    </div>

    <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />
    <NotificationHost />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import FinancialYearSelect from "@/components/FinancialYearSelect.vue";
import NotificationHost from "@/components/NotificationHost.vue";
import { downloadAdminBlob } from "@/api/applicatorApi";

const router = useRouter();
const auth = useAuthStore();

const isSidebarOpen = ref(true);
const mobileOpen = ref(false);
const companyLoading = ref(false);

const navItems = [
  { label: "Dashboard", path: "/", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { label: "Sales", path: "/sales", icon: "M4 7h16M4 12h10M4 17h8" },
  {
    label: "Purchase",
    path: "/purchase",
    icon: "M3 6h18l-2 12H5L3 6zM8 6V4h8v2",
  },
  { label: "Sale Return", path: "/sale-return", icon: "M20 7H8M12 3l-4 4 4 4" },
  {
    label: "Purchase Return",
    path: "/purchase-return",
    icon: "M4 17h12M12 21l4-4-4-4",
  },
  {
    label: "Products",
    path: "/products",
    icon: "M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 7.5V16.5L12 21l9-4.5V7.5",
  },
  {
    label: "Applicators",
    path: "/applicators",
    icon: "M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zM16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z",
  },
  {
    label: "Assignments",
    path: "/applicator-assignments",
    icon: "M4 7h16M4 12h16M4 17h10",
  },
  { label: "Entry", path: "/entry", icon: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" },
  { label: "Stock", path: "/stock", icon: "M3 7h18M5 7v12h14V7" },
  { label: "Stock Transfer", path: "/stock-transfers", icon: "M4 7h9M10 3l4 4-4 4M20 17h-9M14 13l-4 4 4 4" },
  { label: "Cash Merge", path: "/collection-transfers", icon: "M4 12h16M12 4l8 8-8 8" },
  {
    label: "Users",
    path: "/users",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    label: "Profit & Loss",
    path: "/reports/profit",
    icon: "M4 16l4-4 3 3 6-6",
  },
  {
    label: "Outstanding",
    path: "/reports/outstanding",
    icon: "M6 6h12v12H6zM9 9h6v6H9",
  },
  {
    label: "Ledger",
    path: "/ledger",
    icon: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h6",
  },
  {
    label: "Day Book",
    path: "/reports/daily",
    icon: "M4 5h16v14H4zM8 3v4M16 3v4M4 10h16",
  },
  {
    label: "Expenses",
    path: "/expenses",
    icon: "M5 5h14v14H5zM9 9h6M9 13h6",
  },
  {
    label: "Loans",
    path: "/loans",
    icon: "M4 7h16M7 4v16M17 8c0-1.657-2.239-3-5-3s-5 1.343-5 3s1.567 2.42 5 3c3.433.58 5 1.343 5 3s-2.239 3-5 3s-5-1.343-5-3",
  },
  {
    label: "Payments",
    path: "/payments",
    icon: "M4 7h16M4 12h8M4 17h12",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: "M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zm8 4l-2.1.7a7.7 7.7 0 0 1-.6 1.4l1 2l-2 2l-2-.9a7.7 7.7 0 0 1-1.4.6L12 20l-1.3-2.1a7.7 7.7 0 0 1-1.4-.6l-2 .9l-2-2l1-2a7.7 7.7 0 0 1-.6-1.4L4 12l2.1-1.3a7.7 7.7 0 0 1 .6-1.4l-1-2l2-2l2 .9a7.7 7.7 0 0 1 1.4-.6L12 4l1.3 2.1a7.7 7.7 0 0 1 1.4.6l2-.9l2 2l-1 2c.26.45.46.92.6 1.4L20 12z",
  },
  {
    label: "Logs",
    path: "/logs",
    icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  },
];

const sidebarWidth = computed(() => (isSidebarOpen.value ? "280px" : "88px"));
const branchOptions = computed(() => auth.branches || []);
const selectedBranchId = computed(() => auth.selectedBranchId || "");
const currentBranchLabel = computed(() => {
  if (auth.currentBranch?.branchCode) {
    return `${auth.currentBranch.branchName} (${auth.currentBranch.branchCode})`;
  }
  return auth.currentBranch?.branchName || "Select Branch";
});

const toggleSidebar = () => {
  if (window.innerWidth <= 960) {
    mobileOpen.value = !mobileOpen.value;
    return;
  }
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeMobile = () => {
  if (window.innerWidth <= 960) {
    mobileOpen.value = false;
  }
};

const handleBranchChange = async (event) => {
  const nextBranchId = String(event.target.value || "");
  const previousBranchId = String(auth.selectedBranchId || "");
  if (!nextBranchId || nextBranchId === previousBranchId) return;
  auth.selectBranch(nextBranchId);
  if (previousBranchId !== nextBranchId) {
    window.location.reload();
  }
};

const handleLogout = async () => {
  try {
    await fetch(`${import.meta.env.VITE_API_BASE_URL || "https://node-backend-gules-two.vercel.app/api"}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth.token ? `Bearer ${auth.token}` : "",
      },
    });
  } catch (err) {
    console.warn("Logout logging failed", err);
  } finally {
    auth.logout();
    router.replace("/login");
  }
};

const downloadCsv = () => downloadAdminBlob("/admin/exports/invoices/csv", "invoices.csv");
const downloadPdf = () => downloadAdminBlob("/admin/exports/invoices/pdf", "invoices.pdf");
const downloadApplicatorSummary = () =>
  downloadAdminBlob("/admin/reports/applicator-summary/pdf", "applicator-summary.pdf");

onMounted(async () => {
  if (auth.token && (!auth.branches.length || !auth.selectedBranchId)) {
    try {
      await auth.refreshSessionContext();
    } catch (err) {
      console.warn("Failed to refresh auth session context", err);
    }
  }
});
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f3f6fb;
}

.sidebar {
  width: 280px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: width 0.2s ease;
  z-index: 1000;
}

.sidebar.collapsed {
  width: 88px;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.brand-row h2 {
  margin: 0;
  font-size: 18px;
}

.icon-btn {
  border: 1px solid #334155;
  background: #111827;
  color: #e5e7eb;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  overflow-x: visible;
}

.nav-item {
  color: #cbd5e1;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item:hover,
.nav-item.active {
  background: #1e293b;
  color: #fff;
}

.nav-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 18px;
}

.nav-icon svg {
  width: 18px;
  height: 18px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 9px;
  position: relative;
}

.nav-tooltip {
  display: none;
}

.sidebar.collapsed .nav-item:hover .nav-tooltip {
  display: block;
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: #0f172a;
  color: #fff;
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 1100;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.22);
}

.sidebar.collapsed .nav-item:hover .nav-tooltip::before {
  content: "";
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #0f172a;
  z-index: 1100;
}

.nav-label {
  white-space: nowrap;
  font-size: 14px;
}

.logout {
  margin-top: auto;
  border: none;
  background: #ef4444;
  color: #fff;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.main-wrap {
  flex: 1;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 14px;
}

.topbar h3 {
  margin: 0;
}

.topbar-spacer {
  flex: 1;
}

.company-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.company-switcher select {
  min-width: 210px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
}

.company-chip {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.quick-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.quick-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  border-radius: 7px;
  padding: 7px 9px;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.subscription-warning {
  border-bottom: 1px solid #fed7aa;
  background: #fff7ed;
  color: #9a3412;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
}

.content {
  padding: 20px;
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.45);
  z-index: 999;
}

@media (max-width: 960px) {
  .sidebar {
    position: fixed;
    left: -320px;
    top: 0;
    bottom: 0;
    width: 280px;
    transition: left 0.25s ease;
  }

  .sidebar.open {
    left: 0;
  }

  .topbar {
    flex-wrap: wrap;
  }

  .topbar-spacer {
    display: none;
  }

  .company-switcher,
  .company-switcher select,
  .company-chip,
  .quick-actions {
    width: 100%;
  }

  .quick-btn {
    flex: 1 1 130px;
  }
}
</style>
