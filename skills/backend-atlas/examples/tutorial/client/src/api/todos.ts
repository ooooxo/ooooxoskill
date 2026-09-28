import { http } from "@/api/http";

export type Todo = { id: number; title: string; done: boolean };

export const listTodos = () => http.get<Todo[]>("/todos").then((r) => r.data);
export const createTodo = (title: string) => http.post<Todo>("/todos", { title });
export const updateTodo = (id: number, title: string) => http.put(`/todos/${id}`, { title });
export const deleteTodo = (id: number) => http.delete(`/todos/${id}`);
