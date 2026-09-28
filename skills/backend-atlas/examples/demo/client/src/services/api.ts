import { request } from "./http";

export type Project = { id: string; name: string };

// ---------- 账号 ----------
export const register = (email: string, password: string) => request<{ id: number }>("/api/auth/register", { method: "POST", body: { email, password } });
export const login = (email: string, password: string) => request<{ id: number }>("/api/auth/login", { method: "POST", body: { email, password } });

// ---------- 项目 ----------
export const listProjects = () => request<Project[]>("/api/projects");
export const createProject = (name: string) => request<Project>("/api/projects", { method: "POST", body: { name } });

// ---------- 对话：空闲时起一轮，进行中记成插话 ----------
export const sendMessage = (projectId: string, text: string) =>
  request<{ kind: "turn" | "interjection" }>(`/api/projects/${projectId}/messages`, { method: "POST", body: { text } });
