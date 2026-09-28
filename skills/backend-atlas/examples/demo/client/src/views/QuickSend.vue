<template>
  <form @submit.prevent="send">
    <input v-model="text" placeholder="快发到当前项目" />
  </form>
</template>

<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { ref } from "vue";

const props = defineProps<{ projectId: string }>();
const text = ref("");

async function send() {
  await invoke("quick_send", { projectId: props.projectId, text: text.value });
  text.value = "";
}
</script>
