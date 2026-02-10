<script setup>
import { ref } from "vue";
import { registerApi } from "@/api/authApi";
// import AuthLayout from "@/layouts/AuthLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import { useRouter } from "vue-router";

const router = useRouter();

const companyName = ref("");
const name = ref("");
const email = ref("");
const password = ref("");

const message = ref("");
const type = ref("error");

const register = async () => {
  try {
    await registerApi({
      companyName: companyName.value,
      name: name.value,
      email: email.value,
      password: password.value,
    });

    message.value = "Registration successful. Please login.";
    type.value = "success";

    setTimeout(() => router.push("/login"), 1500);
  } catch (err) {
    message.value = err.response?.data?.message || "Registration failed";
    type.value = "error";
  }
};
</script>

<template>
  <!-- <AuthLayout> -->
  <h2>Create Company Account</h2>

  <AppAlert :message="message" :type="type" />

  <input v-model="companyName" placeholder="Company Name" />
  <br /><br />

  <input v-model="name" placeholder="Admin Name" />
  <br /><br />

  <input v-model="email" placeholder="Email" />
  <br /><br />

  <input v-model="password" type="password" placeholder="Password" />
  <br /><br />

  <button type="button" @click="register">Register</button>

  <p style="margin-top: 10px">
    Already have account?
    <router-link to="/login">Login</router-link>
  </p>
  <!-- </AuthLayout> -->
</template>
