import axios from "axios";

// 所有 REST 走这个实例，路径不带 /api 前缀
export const http = axios.create({ baseURL: "/api" });
