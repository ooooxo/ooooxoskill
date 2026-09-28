// 纯 JS 文件
export function ping() {
  return fetch("/api/health").then((r) => r.ok);
}
