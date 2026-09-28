<template>
  <form @submit.prevent="submit">
    <input v-model="email" placeholder="邮箱" />
    <input v-model="password" type="password" placeholder="密码" />
    <button type="submit">{{ mode === "login" ? "登录" : "注册" }}</button>
    <a @click="toggle">{{ mode === "login" ? "没有账号？注册" : "已有账号？登录" }}</a>
    <p v-if="error">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { login, register } from "../services/api";

const emit = defineEmits<{ done: [] }>();
const email = ref("");
const password = ref("");
const mode = ref<"login" | "register">("login");
const error = ref("");

function toggle() { mode.value = mode.value === "login" ? "register" : "login"; }

async function submit() {
  error.value = "";
  try {
    await (mode.value === "login" ? login : register)(email.value, password.value);
    emit("done");
  } catch (e: any) {
    error.value = e.message;
  }
}
</script>
