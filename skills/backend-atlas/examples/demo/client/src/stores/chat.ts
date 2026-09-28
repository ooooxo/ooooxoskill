import { listen } from "@tauri-apps/api/event";
import { defineStore } from "pinia";
import { ref } from "vue";
import * as api from "../services/api";
import { joinProject, leaveProject, setEventHandler, type ProjectEvent } from "../services/hub";

type Line = { role: "user" | "assistant" | "tool" | "system"; text: string };

// 对话：发消息 + 收推送，把一轮里发生的事排成一列
export const useChatStore = defineStore("chat", () => {
  const projectId = ref<string | null>(null);
  const lines = ref<Line[]>([]);
  const running = ref(false);

  async function open(id: string) {
    if (projectId.value) await leaveProject(projectId.value);
    projectId.value = id;
    lines.value = [];
    setEventHandler(apply);
    await joinProject(id);
  }

  async function send(text: string) {
    lines.value.push({ role: "user", text });
    const r = await api.sendMessage(projectId.value!, text);
    if (r.kind === "interjection") lines.value.push({ role: "system", text: "已插话，下一步生效" });
  }

  // 桌面托盘快发成功：窗口里补一行提示（回复照常从推送来）
  listen("quick_sent", () => lines.value.push({ role: "system", text: "已从托盘快发" }));

  function apply(e: ProjectEvent) {
    if (e.type === "turn_started") running.value = true;
    else if (e.type === "reply") lines.value.push({ role: "assistant", text: e.data.text });
    else if (e.type === "tool_start") lines.value.push({ role: "tool", text: `在用 ${e.data.name}…` });
    else if (e.type === "turn_ended") running.value = false;
  }

  return { projectId, lines, running, open, send };
});
