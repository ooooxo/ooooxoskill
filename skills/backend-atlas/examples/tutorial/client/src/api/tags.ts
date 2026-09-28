export async function listTags() {
  const res = await fetch("/api/tags");
  return res.json();
}

export async function createTag(name: string) {
  await fetch("/api/tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
}
