import express from "express";
import { createServer } from "http";
import { settingsService, memoryService, logService, llmService } from "./services.js";

const app = express();
app.use(express.json());

settingsService.init();
memoryService.init();

// Settings
app.get("/api/settings", (_, res) => res.json(settingsService.getAll()));
app.post("/api/settings", (req, res) => {
  const { key, value } = req.body;
  if (key) settingsService.set(key, value);
  res.json({ ok: true });
});
app.post("/api/settings/bulk", (req, res) => {
  settingsService.setBulk(req.body || {});
  res.json({ ok: true });
});

// Memory
app.get("/api/memory", (_, res) => res.json(memoryService.getAll()));
app.get("/api/memory/search", (req, res) => res.json(memoryService.search(req.query.q || "")));
app.post("/api/memory", (req, res) => {
  const id = memoryService.add(req.body);
  res.json({ id });
});
app.put("/api/memory/:id", (req, res) => {
  memoryService.update(Number(req.params.id), req.body.content);
  res.json({ ok: true });
});
app.delete("/api/memory/:id", (req, res) => {
  memoryService.delete(Number(req.params.id));
  res.json({ ok: true });
});
app.post("/api/memory/delete-many", (req, res) => {
  memoryService.deleteMany(req.body.ids || []);
  res.json({ ok: true });
});

// Log
app.get("/api/log", (_, res) => res.json(logService.getAll()));
app.post("/api/log/clear", (_, res) => {
  logService.clear();
  res.json({ ok: true });
});

// Chat
app.post("/api/chat", async (req, res) => {
  try {
    const content = await llmService.chat(req.body.messages || [], req.body.options || {});
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Chat stream (SSE)
app.post("/api/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flush?.();
  };

  try {
    await llmService.chatStream(
      req.body.messages || [],
      req.body.options || {},
      (chunk) => send({ chunk }),
      () => send({ done: true })
    );
  } catch (e) {
    send({ chunk: `\n[Error: ${e.message}]` });
    send({ done: true });
  }
  res.end();
});

const PORT = 3001;
createServer(app).listen(PORT, () => {
  console.log(`Nova Bot API: http://localhost:${PORT}`);
});
