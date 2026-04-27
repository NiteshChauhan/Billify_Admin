<script setup>
import { ref } from "vue";
import { loginApi } from "@/api/authApi";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";
import AppAlert from "@/components/AppAlert.vue";

const email = ref("");
const password = ref("");
const message = ref("");
const type = ref("error");

const auth = useAuthStore();
const router = useRouter();

const login = async () => {
  try {
    const res = await loginApi({
      email: email.value,
      password: password.value
    });

    auth.login(res.data);
    console.log("[AUTH] login success", {
      hasToken: Boolean(res.data?.token),
      selectedBranchId: res.data?.selectedBranchId || res.data?.user?.selectedBranchId || null,
    });
    router.push("/");
  } catch (err) {
    message.value =
      err.response?.data?.message || "Invalid email or password";
    type.value = "error";
  }
};
</script>

<template>
  <h2>Login</h2>

  <AppAlert :message="message" :type="type" />

  <input v-model="email" placeholder="Email" />
  <br /><br />

  <input v-model="password" type="password" placeholder="Password" />
  <br /><br />

  <button @click="login">Login</button>

  <!--<p style="margin-top:10px">
    New company?
    <router-link to="/register">Create account</router-link>
  </p>-->
</template>
