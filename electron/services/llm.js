import OpenAI from "openai";
import { settingsService } from "./settings.js";

let client = null;

function getClient() {
  const settings = settingsService.getAll();
  const provider = settings.Provider || "LM Studio";
  let baseURL = settings.Endpoint || "http://localhost:1234/v1";

  // LM Studio uses /v1, Ollama uses different structure
  if (provider === "LM Studio" && !baseURL.endsWith("/v1")) {
    baseURL = baseURL.replace(/\/?$/, "/v1");
  }
  if (provider === "Local / Ollama") {
    baseURL = (settings.Endpoint || "http://localhost:11434").replace(/\/?$/, "") + "/v1";
  }

  return new OpenAI({
    baseURL,
    apiKey: "lm-studio",
  });
}

export const llmService = {
  async listModels() {
    try {
      const c = getClient();
      const list = await c.models.list();
      return { ok: true, models: list.data?.map((m) => m.id) || [] };
    } catch (e) {
      return { ok: false, error: e.message, models: [] };
    }
  },

  async testConnection() {
    try {
      await this.listModels();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async chat(messages, options = {}) {
    const settings = settingsService.getAll();
    const model = options.model || settings["Model Name"] || "local-model";
    const temperature = parseFloat(settings.Temperature || "0.7");
    const maxTokens = parseInt(settings["Max Output Tokens"] || "4096", 10);

    const client = getClient();
    const res = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    });
    return res.choices[0]?.message?.content || "";
  },

  async chatStream(messages, options, mainWindow) {
    const settings = settingsService.getAll();
    const model = options.model || settings["Model Name"] || "local-model";
    const temperature = parseFloat(settings.Temperature || "0.7");
    const maxTokens = parseInt(settings["Max Output Tokens"] || "4096", 10);
    const streamEnabled = settings.Streaming === "Enabled";

    if (!streamEnabled || !mainWindow) {
      const full = await this.chat(messages, options);
      if (mainWindow?.webContents) {
        mainWindow.webContents.send("chat-stream-chunk", full);
        mainWindow.webContents.send("chat-stream-done");
      }
      return;
    }

    const client = getClient();
    const stream = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text && mainWindow?.webContents) {
        mainWindow.webContents.send("chat-stream-chunk", text);
      }
    }
    if (mainWindow?.webContents) {
      mainWindow.webContents.send("chat-stream-done");
    }
  },
};
