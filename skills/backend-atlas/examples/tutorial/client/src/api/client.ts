// 自己包的一层：路径由调用方传进来
async function call<T>(method: string, path: string): Promise<T> {
  const res = await fetch("/api" + path, { method });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export const getProjects = () => call<{ id: number; name: string }[]>("GET", "/projects");
export const removeProject = (id: number) => call("DELETE", `/projects/${id}`);
export const archiveProject = (id: number) => call("POST", `/projects/${id}/archive`);
