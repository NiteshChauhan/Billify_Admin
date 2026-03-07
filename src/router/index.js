import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

/* Layouts */
import AdminLayout from "@/layouts/AdminLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

/* Pages */
import Login from "@/views/auth/Login.vue";
import Register from "@/views/auth/Register.vue";
import Dashboard from "@/views/dashboard/Dashboard.vue";
import ProductList from "@/views/products/ProductList.vue";
import ProductForm from "@/views/products/ProductForm.vue";
import OpeningStock from "@/views/stock/OpeningStock.vue";
import StockLedger from "@/views/stock/StockLedger.vue";

import PurchaseCreate from "@/views/purchase/PurchaseCreate.vue";


const routes = [
  /* ---------- AUTH ---------- */
  {
    path: "/login",
    component: AuthLayout,
    children: [
      {
        path: "",
        name: "login",
        component: Login,
      },
    ],
  },
  {
    path: "/register",
    component: AuthLayout,
    children: [
      {
        path: "",
        name: "register",
        component: Register,
      },
    ],
  },

  /* ---------- ADMIN ---------- */
  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "dashboard",
        component: Dashboard,
      },

      /* PRODUCTS */
      {
        path: "products",
        name: "products",
        component: ProductList,
      },
      {
        path: "products/create",
        name: "product-create",
        component: ProductForm,
      },
      {
        path: "products/edit/:id",
        name: "product-edit",
        component: ProductForm,
      },

      /* OPENING STOCK */
      {
        path: "opening-stock/:productId",
        name: "opening-stock",
        component: OpeningStock,
      },
      {
        path: "/stock-ledger/:productId",
        name: "stock-ledger",
        component: StockLedger,
      },

      /* Purchase Invoice */
      {
        path: "purchase",
        name: "purchase-list",
        component: () => import("@/views/purchase/PurchaseList.vue"),
      },
      {
        path: "purchase/create",
        name: "purchase-create",
        component: PurchaseCreate,
      },
      {
        path: "/purchase/edit/:id",
        component: () => import("@/views/purchase/PurchaseEdit.vue")
      },
      {
        path: "purchase/:id",
        name: "purchase-view",
        component: () => import("@/views/purchase/PurchaseView.vue"),
      },
      {
        path: "/purchase/:id/payment",
        name: "PurchasePayment",
        component: () => import("@/views/purchase/PurchasePayment.vue"),
      },
      {
        path: "users",
        name: "user-list",
        component: () => import("@/views/users/UserList.vue"),
      },
      {
        path: "users/create",
        name: "user-create",
        component: () => import("@/views/users/UserForm.vue"),
      },
      {
        path: "users/edit/:id",
        name: "user-edit",
        component: () => import("@/views/users/UserForm.vue"),
      },
      {
        path: "users/:userId/ledger",
        name: "user-ledger",
        component: () => import("@/views/users/UserLedger.vue"),
      },
      {
        path: "reports/supplier-outstanding",
        name: "supplier-outstanding",
        component: () => import("@/views/reports/SupplierOutstanding.vue"),
      },
      {
        path: "/sales",
        component: () => import("@/views/sales/SalesList.vue"),
      },
      {
        path: "/sales/create",
        component: () => import("@/views/sales/SalesCreate.vue"),
      },
      {
        path: "/sales/edit/:id",
        component: () => import("@/views/sales/SalesEdit.vue")
      },
      {
        path: "/sales/:id",
        component: () => import("@/views/sales/SalesView.vue"),
      },
      {
        path: "/sales/:id/receipt",
        name: "sales-receipt",
        component: () => import("@/views/sales/SalesReceipt.vue"),
      },
      {
        path: "/reports/outstanding",
        component: () => import("@/views/reports/OutstandingReport.vue"),
      },
      {
        path: "/reports/ageing",
        component: () => import("@/views/reports/AgeingReport.vue"),
      },
      {
        path: "/reports/profit",
        component: () => import("@/views/dashboard/ProfitDashboard.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/* 🔐 Auth Guard */
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    return "/login";
  }
});

export default router;
