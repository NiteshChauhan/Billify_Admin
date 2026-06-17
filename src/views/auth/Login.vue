<script setup>
import { computed, onMounted, ref } from "vue";
import { loginApi } from "@/api/authApi";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";

const REMEMBER_EMAIL_KEY = "rememberedAdminEmail";

const email = ref(localStorage.getItem(REMEMBER_EMAIL_KEY) || "");
const password = ref("");
const message = ref("");
const type = ref("error");
const rememberMe = ref(Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY)));
const showPassword = ref(false);
const loading = ref(false);
const emailInput = ref(null);

const auth = useAuthStore();
const router = useRouter();

const emailIsValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));

const validate = () => {
  if (!email.value.trim()) {
    message.value = "Email address is required";
    return false;
  }
  if (!emailIsValid.value) {
    message.value = "Enter a valid email address";
    return false;
  }
  if (!password.value) {
    message.value = "Password is required";
    return false;
  }
  message.value = "";
  return true;
};

const login = async () => {
  if (!validate() || loading.value) return;
  loading.value = true;
  try {
    const res = await loginApi({
      email: email.value.trim(),
      password: password.value
    });

    auth.login(res.data);
    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email.value.trim());
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
    console.log("[AUTH] login success", {
      hasToken: Boolean(res.data?.token),
      selectedBranchId: res.data?.selectedBranchId || res.data?.user?.selectedBranchId || null,
    });
    router.push("/");
  } catch (err) {
    message.value =
      err.response?.data?.message || "Invalid email or password";
    type.value = "error";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  emailInput.value?.focus();
});
</script>

<template>
  <form class="login-card" @submit.prevent="login">
    <div class="mobile-brand">
      <span class="mobile-logo">B</span>
      <span>Billify</span>
    </div>

    <header class="login-head">
      <p>Welcome Back</p>
      <h2>Login to your admin account</h2>
    </header>

    <div v-if="message" :class="['login-alert', type]">
      {{ message }}
    </div>

    <label class="field">
      <span>Email Address</span>
      <div class="input-wrap">
        <span class="field-icon">@</span>
        <input
          ref="emailInput"
          v-model="email"
          type="email"
          placeholder="admin@company.com"
          autocomplete="email"
          :disabled="loading"
        />
      </div>
    </label>

    <label class="field">
      <span>Password</span>
      <div class="input-wrap">
        <span class="field-icon">#</span>
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter your password"
          autocomplete="current-password"
          :disabled="loading"
        />
        <button
          class="password-toggle"
          type="button"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? "Hide" : "Show" }}
        </button>
      </div>
    </label>

    <div class="form-row">
      <label class="remember">
        <input v-model="rememberMe" type="checkbox" />
        <span>Remember me</span>
      </label>
    </div>

    <button class="login-button" type="submit" :disabled="loading">
      <span v-if="loading" class="spinner" />
      {{ loading ? "Signing in..." : "Login" }}
    </button>
  </form>
</template>

<style scoped>
.login-card {
  padding: 34px;
  display: grid;
  gap: 20px;
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  color: #176b5b;
  font-weight: 900;
  font-size: 20px;
}

.mobile-logo {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #176b5b;
  color: #fff;
}

.login-head {
  display: grid;
  gap: 6px;
}

.login-head p {
  margin: 0;
  color: #176b5b;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  line-height: 1.18;
  letter-spacing: 0;
}

.login-alert {
  border-radius: 12px;
  padding: 11px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 13px;
  font-weight: 700;
}

.field {
  display: grid;
  gap: 8px;
}

.field > span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.input-wrap {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #fff;
  padding: 0 12px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input-wrap:focus-within {
  border-color: #176b5b;
  box-shadow: 0 0 0 4px rgba(23, 107, 91, 0.12);
}

.field-icon {
  color: #64748b;
  font-weight: 900;
  width: 20px;
  text-align: center;
}

.input-wrap input {
  border: 0;
  outline: 0;
  padding: 0;
  min-width: 0;
  flex: 1;
  height: 46px;
  color: #0f172a;
  background: transparent;
}

.input-wrap input:disabled {
  cursor: not-allowed;
}

.password-toggle {
  border: 0;
  background: transparent;
  color: #176b5b;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 900;
  width: auto;
}

.password-toggle:hover {
  background: transparent;
  color: #0f766e;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.remember input {
  width: 16px;
  height: 16px;
  accent-color: #176b5b;
}

.login-button {
  width: 100%;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 12px;
  background: #176b5b;
  color: #fff;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(23, 107, 91, 0.25);
}

.login-button:hover:not(:disabled) {
  background: #115447;
}

.login-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .mobile-brand {
    display: inline-flex;
  }
}

@media (max-width: 520px) {
  .login-card {
    padding: 24px 18px;
  }

  .login-head h2 {
    font-size: 24px;
  }
}
</style>
