import { HubConnectionBuilder } from "@microsoft/signalr";

// 项目频道：服务端推 { type, data }
export type ProjectEvent = { type: string; data?: any };

const conn = new HubConnectionBuilder().withUrl("/hubs/project").withAutomaticReconnect().build();
let onEvent: ((e: ProjectEvent) => void) | null = null;

conn.on("event", (e: ProjectEvent) => onEvent?.(e));

export function setEventHandler(h: (e: ProjectEvent) => void) { onEvent = h; }

export async function joinProject(projectId: string) {
  if (conn.state === "Disconnected") await conn.start();
  await conn.invoke("JoinProject", projectId);
}

export const leaveProject = (projectId: string) => conn.invoke("LeaveProject", projectId);
