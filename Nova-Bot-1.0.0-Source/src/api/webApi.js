const BASE = "/api";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export const webApi = {
  async settingsGetAll() {
    return fetchJson(`${BASE}/settings`);
  },

  async settingsSet(key, value) {
    return fetchJson(`${BASE}/settings`, {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });
  },

  async settingsSetBulk(values) {
    return fetchJson(`${BASE}/settings/bulk`, {
      method: "POST",
      body: JSON.stringify(values),
    });
  },

  async memoryGetAll() {
    return fetchJson(`${BASE}/memory`);
  },

  async memorySearch(query) {
    return fetchJson(`${BASE}/memory/search?q=${encodeURIComponent(query)}`);
  },

  async memoryAdd(record) {
    const { id } = await fetchJson(`${BASE}/memory`, {
      method: "POST",
      body: JSON.stringify(record),
    });
    return id;
  },

  async memoryUpdate(id, content) {
    return fetchJson(`${BASE}/memory/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  },

  async memoryDelete(id) {
    return fetchJson(`${BASE}/memory/${id}`, { method: "DELETE" });
  },

  async memoryDeleteMany(ids) {
    return fetchJson(`${BASE}/memory/delete-many`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },

  async logGetAll() {
    return fetchJson(`${BASE}/log`);
  },

  async logClear() {
    return fetchJson(`${BASE}/log/clear`, { method: "POST" });
  },

  async chat(messages) {
    const { content } = await fetchJson(`${BASE}/chat`, {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
    return content;
  },

  async chatStream(messages, options, chunkHandler, doneHandler) {
    const res = await fetch(`${BASE}/chat/stream`, {
      method: "POST",
      body: JSON.stringify({ messages, options }),
      headers: { "Content-Type": "application/json" },
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) chunkHandler(data.chunk);
            if (data.done) doneHandler?.();
          } catch (_) {}
        }
      }
    }
    doneHandler?.();
  },
};
