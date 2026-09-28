<template>
  <p v-for="(m, i) in messages" :key="i">{{ m }}</p>
  <form @submit.prevent="send"><input v-model="text" /></form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onMessage, say } from "@/realtime";

const messages = ref<string[]>([]);
const text = ref("");

onMessage((user, body) => messages.value.push(`${user}: ${body}`));

async function send() {
  await say("me", text.value);
  text.value = "";
}
</script>
