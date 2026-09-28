<template>
  <ul>
    <li v-for="t in todos" :key="t.id">
      <input :value="t.title" @change="rename(t.id, ($event.target as HTMLInputElement).value)" />
      <button @click="remove(t.id)">删除</button>
    </li>
  </ul>
  <form @submit.prevent="add"><input v-model="draft" /></form>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { createTodo, deleteTodo, listTodos, updateTodo, type Todo } from "@/api/todos";
import { onTodoChanged } from "@/realtime";
import { bus } from "@/bus";

const todos = ref<Todo[]>([]);
const draft = ref("");

async function load() { todos.value = await listTodos(); }
async function add() { await createTodo(draft.value); draft.value = ""; }
async function rename(id: number, title: string) { await updateTodo(id, title); }
async function remove(id: number) { await deleteTodo(id); }

onMounted(load);
onTodoChanged(() => load());
bus.on("update", () => load());
</script>
