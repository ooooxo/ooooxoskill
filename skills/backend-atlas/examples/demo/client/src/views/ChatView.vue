<template>
  <aside>
    <button @click="newProject">新项目</button>
    <a v-for="p in projects" :key="p.id" @click="chat.open(p.id)">{{ p.name }}</a>
  </aside>
  <main>
    <p v-for="(l, i) in chat.lines" :key="i" :class="l.role">{{ l.text }}</p>
    <form @submit.prevent="send">
      <input v-model="draft" :placeholder="chat.running ? '插一句话…' : '说点什么'" />
    </form>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { createProject, listProjects, type Project } from "../services/api";
import { useChatStore } from "../stores/chat";

const chat = useChatStore();
const projects = ref<Project[]>([]);
const draft = ref("");

onMounted(async () => { projects.value = await listProjects(); });

async function newProject() {
  const p = await createProject("未命名");
  projects.value.unshift(p);
  await chat.open(p.id);
}

async function send() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = "";
  await chat.send(text);
}
</script>
