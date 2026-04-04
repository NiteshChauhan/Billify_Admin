import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

import AdminLayout from "@/layouts/AdminLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

import Login from "@/views/auth/Login.vue";
import Register from "@/views/auth/Register.vue";
import Dashboard from "@/views/dashboard/Dashboard.vue";

const routes = [
  {
    path: "/login",
    component: AuthLayout,
    children: [{ path: "", name: "login", component: Login }],
  },
  {
    path: "/register",
    component: AuthLayout,
    children: [{ path: "", name: "register", component: Register }],
  },
  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "dashboard", component: Dashboard },

      { path: "sales", name: "sales-list", component: () => import("@/views/sales/SalesList.vue") },
      { path: "sales/create", component: () => import("@/views/sales/SalesCreate.vue") },
      { path: "sales/edit/:id", component: () => import("@/views/sales/SalesEdit.vue") },
      { path: "sales/:id", component: () => import("@/views/sales/SalesView.vue") },
      { path: "sales/:id/receipt", name: "sales-receipt", component: () => import("@/views/sales/SalesReceipt.vue") },

      { path: "purchase", name: "purchase-list", component: () => import("@/views/purchase/PurchaseList.vue") },
      { path: "purchase/create", component: () => import("@/views/purchase/PurchaseCreate.vue") },
      { path: "purchase/edit/:id", component: () => import("@/views/purchase/PurchaseEdit.vue") },
      { path: "purchase/:id", name: "purchase-view", component: () => import("@/views/purchase/PurchaseView.vue") },
      { path: "purchase/:id/payment", name: "purchase-payment", component: () => import("@/views/purchase/PurchasePayment.vue") },

      { path: "sale-return", name: "sale-return-list", component: () => import("@/views/returns/SaleReturnList.vue") },
      { path: "purchase-return", name: "purchase-return-list", component: () => import("@/views/returns/PurchaseReturnList.vue") },

      { path: "products", name: "products", component: () => import("@/views/products/ProductList.vue") },
      { path: "products/:id/history", name: "product-history", component: () => import("@/views/products/ProductHistory.vue") },
      { path: "products/create", name: "product-create", component: () => import("@/views/products/ProductForm.vue") },
      { path: "products/edit/:id", name: "product-edit", component: () => import("@/views/products/ProductForm.vue") },

      { path: "entry", name: "entry", component: () => import("@/views/entry/EntryPage.vue") },

      { path: "stock", name: "stock", component: () => import("@/views/stock/StockList.vue") },
      { path: "stock-ledger/:productId", name: "stock-ledger", component: () => import("@/views/stock/StockLedger.vue") },
      { path: "opening-stock/:productId", name: "opening-stock", component: () => import("@/views/stock/OpeningStock.vue") },

      { path: "users", name: "user-list", component: () => import("@/views/users/UserList.vue") },
      { path: "users/create", name: "user-create", component: () => import("@/views/users/UserForm.vue") },
      { path: "users/edit/:id", name: "user-edit", component: () => import("@/views/users/UserForm.vue") },
      { path: "users/:userId/ledger", name: "user-ledger", component: () => import("@/views/users/UserLedger.vue") },
      { path: "ledger", name: "ledger-list", component: () => import("@/views/ledger/LedgerList.vue") },
      { path: "ledger/type/:type", name: "ledger-type", component: () => import("@/views/ledger/LedgerTypeDetail.vue") },
      { path: "ledger/:userId", name: "ledger-detail", component: () => import("@/views/ledger/LedgerDetail.vue") },

      { path: "reports/outstanding", component: () => import("@/views/reports/OutstandingReport.vue") },
      { path: "reports/ageing", component: () => import("@/views/reports/AgeingReport.vue") },
      { path: "reports/supplier-outstanding", component: () => import("@/views/reports/SupplierOutstanding.vue") },
      { path: "reports/daily", component: () => import("@/views/reports/DailyReport.vue") },
      { path: "reports/profit", component: () => import("@/views/dashboard/ProfitDashboard.vue") },
      { path: "expenses", name: "expenses", component: () => import("@/views/expenses/Expenses.vue") },
      { path: "settings", name: "settings", component: () => import("@/views/settings/Settings.vue") },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    return "/login";
  }
});

export default router;
