<template>
  <div>
    <span v-for="t in tags" :key="t.id">{{ t.name }}</span>
    <button @click="add">加标签</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { createTag, listTags } from "@/api/tags";

// Options API 写法
export default defineComponent({
  data: () => ({ tags: [] as { id: number; name: string }[] }),
  async mounted() {
    this.tags = await listTags();
  },
  methods: {
    async add() {
      await createTag("new");
      this.tags = await listTags();
    },
  },
});
</script>
