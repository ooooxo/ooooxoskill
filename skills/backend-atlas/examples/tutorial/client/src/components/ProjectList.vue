<template>
  <div v-for="p in projects" :key="p.id">
    {{ p.name }}
    <button @click="archive(p.id)">归档</button>
    <button @click="drop(p.id)">删除</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { archiveProject, getProjects, removeProject } from "@/api/client";
import { ping } from "@/api/health";

const projects = ref<{ id: number; name: string }[]>([]);
onMounted(async () => { await ping(); projects.value = await getProjects(); });
const archive = (id: number) => archiveProject(id);
const drop = (id: number) => removeProject(id);
</script>
