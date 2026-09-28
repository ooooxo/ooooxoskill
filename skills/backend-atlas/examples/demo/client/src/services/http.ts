// 请求层：所有 REST 都从这里走，出错抛 { code, message }
export async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: { "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    credentials: "include",
  });
  if (!res.ok) throw await res.json();
  return res.json() as Promise<T>;
}
