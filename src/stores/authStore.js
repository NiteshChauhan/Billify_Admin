import { defineStore } from "pinia";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const SELECTED_BRANCH_KEY = "selectedBranchId";
const MAIN_BRANCH_ALIASES = new Set(["0", "main", "main_branch", "main-branch"]);

function getStoredUser() {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user && user !== "undefined" ? JSON.parse(user) : null;
  } catch (e) {
    console.warn("Invalid user data in localStorage, clearing it");
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function getStoredSelectedBranchId() {
  const value = localStorage.getItem(SELECTED_BRANCH_KEY) || null;
  if (!value) return null;
  return MAIN_BRANCH_ALIASES.has(String(value).trim().toLowerCase()) ? null : value;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: getStoredUser(),
    selectedBranchId: getStoredSelectedBranchId(),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    branches: (state) => state.user?.branches || [],
    currentBranch: (state) =>
      (state.user?.branches || []).find(
        (branch) => String(branch._id) === String(state.selectedBranchId || ""),
      ) || null,
  },

  actions: {
    login(data) {
      this.token = data.token;
      this.user = {
        ...data.user,
        branches: data.branches || data.user?.branches || [],
        selectedBranchId:
          data.selectedBranchId ||
          data.user?.selectedBranchId ||
          null,
      };
      this.selectedBranchId =
        data.selectedBranchId ||
        data.user?.selectedBranchId ||
        this.user?.branches?.[0]?._id ||
        null;

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      if (this.selectedBranchId) {
        localStorage.setItem(SELECTED_BRANCH_KEY, String(this.selectedBranchId));
      } else {
        localStorage.removeItem(SELECTED_BRANCH_KEY);
      }
    },

    setSessionContext(data) {
      const branches = data.branches || data.user?.branches || [];
      const selectedBranchId =
        data.selectedBranchId ||
        data.user?.selectedBranchId ||
        this.selectedBranchId ||
        branches[0]?._id ||
        null;

      this.user = {
        ...(this.user || {}),
        ...(data.user || {}),
        branches,
        selectedBranchId,
      };
      this.selectedBranchId = selectedBranchId;

      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      if (selectedBranchId) {
        localStorage.setItem(SELECTED_BRANCH_KEY, String(selectedBranchId));
      } else {
        localStorage.removeItem(SELECTED_BRANCH_KEY);
      }
    },

    selectBranch(branchId) {
      const nextBranchId = String(branchId || "");
      const exists = this.branches.find(
        (branch) => String(branch._id) === nextBranchId,
      );
      if (!exists) return;

      this.selectedBranchId = nextBranchId;
      if (this.user) {
        this.user = {
          ...this.user,
          selectedBranchId: nextBranchId,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      }
      localStorage.setItem(SELECTED_BRANCH_KEY, nextBranchId);
    },

    async refreshSessionContext() {
      if (!this.token) return null;

      const makeRequest = () =>
        fetch(
          `${import.meta.env.VITE_API_BASE_URL || "https://node-backend-gules-two.vercel.app/api"}/auth/session`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${this.token}`,
              ...(this.selectedBranchId ? { "X-Branch-Id": this.selectedBranchId } : {}),
            },
          },
        );

      let response = await makeRequest();

      if (response.status === 403 && this.selectedBranchId) {
        this.selectedBranchId = null;
        localStorage.removeItem(SELECTED_BRANCH_KEY);
        response = await makeRequest();
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.logout();
        }
        throw new Error("Failed to refresh session context");
      }

      const data = await response.json();
      this.setSessionContext(data);
      return data;
    },

    logout() {
      this.token = null;
      this.user = null;
      this.selectedBranchId = null;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SELECTED_BRANCH_KEY);
    },
  },
});
