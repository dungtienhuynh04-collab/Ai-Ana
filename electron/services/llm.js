import OpenAI from "openai";
import { settingsService } from "./settings.js";
import { logService } from "./log.js";

const CHARS_PER_TOKEN = 4;
const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant.";

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
      const models = list.data?.map((m) => m.id) || [];
      logService.info("LM Studio", `Listed ${models.length} models: ${models.slice(0, 3).join(", ")}${models.length > 3 ? "..." : ""}`);
      return { ok: true, models };
    } catch (e) {
      logService.error("LM Studio", e.message);
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

  _prepareMessages(messages, settings, options = {}) {
    const systemContent = options.systemPrompt || (settings["System Prompt"] || "").trim() || DEFAULT_SYSTEM_PROMPT;
    const contextWindow = parseInt(options.contextWindow || settings["Context Window"] || "32768", 10);
    const maxTokens = parseInt(options.maxTokens || settings["Max Output Tokens"] || "4096", 10);
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
    const finalMsgs = [systemMsg, ...out];
    logService.info("Context", `System: "${systemMsg.content.substring(0, 50)}..."`);
    return finalMsgs;
  },

  async chat(messages, options = {}) {
    const settings = settingsService.getAll();
    const model = options.model || settings["Model Name"] || "local-model";
    const temperature = parseFloat(options.temperature ?? settings.Temperature ?? "0.7");
    const maxTokens = parseInt(options.maxTokens || settings["Max Output Tokens"] || "4096", 10);
    const topP = parseFloat(options.topP ?? settings["Top P"] ?? "0.95");
    const prepared = this._prepareMessages(messages, settings, options);

    logService.info("Request", `model=${model} messages=${prepared.length} ctx=${settings["Context Window"] || "32768"}`);
    try {
      const client = getClient();
      const res = await client.chat.completions.create({
        model,
        messages: prepared,
        temperature,
        max_tokens: maxTokens,
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

  async chatStream(messages, options, mainWindow) {
    options = options || {};
    const settings = settingsService.getAll();
    const model = options.model || settings["Model Name"] || "local-model";
    const temperature = parseFloat(options.temperature ?? settings.Temperature ?? "0.7");
    const maxTokens = parseInt(options.maxTokens || settings["Max Output Tokens"] || "4096", 10);
    const topP = parseFloat(options.topP ?? settings["Top P"] ?? "0.95");
    const streamEnabled = settings.Streaming === "Enabled";
    const prepared = this._prepareMessages(messages, settings, options);

    logService.info("Request", `stream=${streamEnabled} model=${model} messages=${prepared.length}`);

    if (!streamEnabled || !mainWindow) {
      try {
        const full = await this.chat(messages, options);
        if (mainWindow?.webContents) {
          mainWindow.webContents.send("chat-stream-chunk", full);
          mainWindow.webContents.send("chat-stream-done");
        }
      } catch (e) {
        if (mainWindow?.webContents) {
          mainWindow.webContents.send("chat-stream-chunk", `\n[Error: ${e.message}]`);
          mainWindow.webContents.send("chat-stream-done");
        }
      }
      return;
    }

    try {
      const client = getClient();
      const stream = await client.chat.completions.create({
        model,
        messages: prepared,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: true,
      });

      let tokenCount = 0;
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text && mainWindow?.webContents) {
          tokenCount++;
          mainWindow.webContents.send("chat-stream-chunk", text);
        }
      }
      logService.info("Response", `streamed ~${tokenCount} chunks`);
    } catch (e) {
      logService.error("Stream failed", e.message);
      if (mainWindow?.webContents) {
        mainWindow.webContents.send("chat-stream-chunk", `\n[Error: ${e.message}]`);
      }
    }
    if (mainWindow?.webContents) {
      mainWindow.webContents.send("chat-stream-done");
    }
  },
};
