import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getMemoryPath() {
  ensureDataDir();
  return path.join(DATA_DIR, "memory.json");
}

// Settings
const DEFAULT_SETTINGS = {
  Provider: "LM Studio",
  Endpoint: "http://localhost:1234",
  "Model Name": "local-model",
  Temperature: "0.7",
  "Top P": "0.95",
  "Max Output Tokens": "4096",
  "Context Window": "32768",
  "System Prompt": "You are a helpful AI assistant. Adapt to the user's needs.",
  Streaming: "Enabled",
};

let settings = { ...DEFAULT_SETTINGS };

function getSettingsPath() {
  ensureDataDir();
  return path.join(DATA_DIR, "settings.json");
}

export const settingsService = {
  init() {
    try {
      const p = getSettingsPath();
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p, "utf-8");
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error("Settings load error:", e);
    }
  },
  getAll() {
    return { ...settings };
  },
  set(key, value) {
    settings[key] = String(value);
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
  },
  setBulk(values) {
    Object.assign(settings, values);
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
  },
};

// Memory (JSON file for web server - no native deps)
let memories = [];

function loadMemories() {
  try {
    const p = getMemoryPath();
    if (fs.existsSync(p)) {
      memories = JSON.parse(fs.readFileSync(p, "utf-8"));
    } else {
      memories = [];
    }
  } catch (e) {
    memories = [];
  }
}

function saveMemories() {
  fs.writeFileSync(getMemoryPath(), JSON.stringify(memories, null, 2));
}

export const memoryService = {
  init() {
    loadMemories();
  },
  getAll() {
    return [...memories].sort((a, b) => (b.id || 0) - (a.id || 0));
  },
  search(query) {
    const q = (query || "").toLowerCase();
    return memories.filter(
      (m) =>
        (m.content || "").toLowerCase().includes(q) ||
        (m.user || "").toLowerCase().includes(q)
    );
  },
  add(record) {
    const id = memories.length ? Math.max(...memories.map((m) => m.id || 0)) + 1 : 1;
    memories.unshift({
      id,
      user: record.user || "User",
      content: record.content || "",
      time: record.time || new Date().toISOString().slice(0, 16).replace("T", " "),
      score: record.score ?? 0.5,
    });
    saveMemories();
    return id;
  },
  update(id, content) {
    const m = memories.find((x) => x.id === id);
    if (m) {
      m.content = content;
      saveMemories();
      return true;
    }
    return false;
  },
  delete(id) {
    const i = memories.findIndex((x) => x.id === id);
    if (i >= 0) {
      memories.splice(i, 1);
      saveMemories();
      return true;
    }
    return false;
  },
  deleteMany(ids) {
    const set = new Set(ids);
    const before = memories.length;
    memories = memories.filter((m) => !set.has(m.id));
    saveMemories();
    return before - memories.length;
  },
};

// Log
const logs = [];
const MAX_LOGS = 500;

function ts() {
  return new Date().toISOString().slice(11, 19);
}

export const logService = {
  add(level, msg, detail) {
    logs.push({ time: ts(), level, message: msg, detail: detail || "" });
    if (logs.length > MAX_LOGS) logs.shift();
  },
  info(m, d) {
    this.add("info", m, d);
  },
  error(m, d) {
    this.add("error", m, d);
  },
  getAll() {
    return [...logs];
  },
  clear() {
    logs.length = 0;
  },
};

// LLM
const CHARS_PER_TOKEN = 4;
const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant.";

function getClient() {
  const s = settingsService.getAll();
  let baseURL = s.Endpoint || "http://localhost:1234";
  if (!baseURL.endsWith("/v1")) baseURL = baseURL.replace(/\/?$/, "") + "/v1";
  return new OpenAI({ baseURL, apiKey: "lm-studio" });
}

function prepareMessages(messages, s) {
  const systemContent = (s["System Prompt"] || "").trim() || DEFAULT_SYSTEM_PROMPT;
  const contextWindow = parseInt(s["Context Window"] || "32768", 10);
  const maxTokens = parseInt(s["Max Output Tokens"] || "4096", 10);
  const inputBudget = Math.max(1024, (contextWindow - maxTokens) * CHARS_PER_TOKEN);

  const systemMsg = { role: "system", content: systemContent };
  let budget = inputBudget - systemContent.length;
  const out = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const len = (m.content || "").length;
    if (budget - len < 0) break;
    out.unshift(m);
    budget -= len;
  }
  return [systemMsg, ...out];
}

export const llmService = {
  async chat(messages, options = {}) {
    const s = settingsService.getAll();
    const model = options.model || s["Model Name"] || "local-model";
    const temp = parseFloat(s.Temperature || "0.7");
    const maxTok = parseInt(s["Max Output Tokens"] || "4096", 10);
    const topP = parseFloat(s["Top P"] || "0.95");
    const prepared = prepareMessages(messages, s);

    logService.info("Request", `model=${model} messages=${prepared.length} ctx=${s["Context Window"] || "32768"}`);
    try {
      const client = getClient();
      const res = await client.chat.completions.create({
        model,
        messages: prepared,
        temperature: temp,
        max_tokens: maxTok,
        top_p: topP,
        stream: false,
      });
      const content = res.choices[0]?.message?.content || "";
      logService.info("Response", `tokens ~${content.length}`);
      return content;
    } catch (e) {
      logService.error("Chat failed", e.message);
      throw e;
    }
  },

  async chatStream(messages, options, onChunk, onDone) {
    const s = settingsService.getAll();
    const model = options.model || s["Model Name"] || "local-model";
    const temp = parseFloat(s.Temperature || "0.7");
    const maxTok = parseInt(s["Max Output Tokens"] || "4096", 10);
    const topP = parseFloat(s["Top P"] || "0.95");
    const prepared = prepareMessages(messages, s);

    logService.info("Request", `stream model=${model} messages=${prepared.length}`);
    try {
      const client = getClient();
      const stream = await client.chat.completions.create({
        model,
        messages: prepared,
        temperature: temp,
        max_tokens: maxTok,
        top_p: topP,
        stream: true,
      });

      let n = 0;
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          n++;
          onChunk(text);
        }
      }
      logService.info("Response", `streamed ~${n} chunks`);
    } catch (e) {
      logService.error("Stream failed", e.message);
      onChunk(`\n[Error: ${e.message}]`);
    }
    onDone();
  },
};
