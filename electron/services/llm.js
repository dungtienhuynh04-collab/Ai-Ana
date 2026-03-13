import OpenAI from "openai";
import { settingsService } from "./settings.js";
import { logService } from "./log.js";
import { memoryService } from "./memory.js";

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
    const settings = settingsService.getAll();
    const provider = settings.Provider || "LM Studio";
    let endpoint = settings.Endpoint || "http://localhost:1234";

    try {
      if (provider === "LM Studio") {
        const baseUrl = endpoint.replace(/\/v1\/?$/, "").replace(/\/?$/, "");
        
        // Try V0 first - it has exactly what we need (loaded_context_length)
        try {
          const v0Url = `${baseUrl}/api/v0/models`;
          const res = await fetch(v0Url);
          if (res.ok) {
            const json = await res.json();
            const raw = json.data || [];
            const models = raw.map(m => ({
              ...m,
              // Frontend expects 'context_length'
              context_length: m.loaded_context_length || m.max_context_length || undefined,
            }));
            const loaded = models.filter(m => m.state === "loaded" && m.type === "llm");
            logService.info("LM Studio", `V0: Found ${loaded.length} loaded LLMs`);
            return { ok: true, models };
          }
        } catch (e) {
          logService.info("LM Studio", "V0 API not available, trying V1...");
        }

        // Fallback or Try V1 if V0 failed / returned empty
        const v1Url = `${baseUrl}/api/v1/models`;
        const res = await fetch(v1Url);
        const json = await res.json();
        const raw = json.models || json.data || [];
        
        const models = raw.map(m => {
          // In V1, loaded info is in loaded_instances
          const instance = m.loaded_instances?.[0];
          return {
            id: m.key || m.id,
            ...m,
            state: instance ? "loaded" : "not-loaded",
            context_length: instance?.config?.context_length || m.max_context_length || undefined,
            loaded_context_length: instance?.config?.context_length,
          };
        });

        const loadedCount = models.filter(m => m.state === "loaded").length;
        logService.info("LM Studio", `V1: Found ${loadedCount} loaded models`);
        return { ok: true, models };
      }

      // Other providers: OpenAI-compatible
      const c = getClient();
      const list = await c.models.list();
      const models = (list.data || []).map(m => ({ ...m }));
      return { ok: true, models };
    } catch (e) {
      logService.error("ListModels", e.message);
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

  _prepareMessages(messages, settings, options = {}, memoryContext = "") {
    let systemContent = options.systemPrompt || (settings["System Prompt"] || "").trim() || DEFAULT_SYSTEM_PROMPT;
    
    if (memoryContext) {
      systemContent += `\n\nHere are some relevant past memories about the user that might help you answer:\n${memoryContext}`;
    }

    // Use a slightly more aggressive estimate or simple char-based if no tokenizer
    const contextWindow = parseInt(options.contextWindow || settings["Context Window"] || "32768", 10);
    const maxTokens = parseInt(options.maxTokens || settings["Max Output Tokens"] || "4096", 10);
    
    // We aim for the App to be the source of truth. 
    // We truncate the input to fit the user-defined contextWindow.
    const inputBudget = Math.max(1024, (contextWindow - maxTokens) * CHARS_PER_TOKEN);

    const systemMsg = { role: "system", content: systemContent };
    let budget = inputBudget - systemContent.length;
    const out = [];
    
    // Iterate backwards to keep recent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const len = (m.content || "").length;
      if (budget - len < 0) break;
      out.unshift(m);
      budget -= len;
    }
    
    const finalMsgs = [systemMsg, ...out];
    logService.info("Context", `Enforcing ${contextWindow} window. Sending ${finalMsgs.length} messages (~${(inputBudget - budget) / CHARS_PER_TOKEN} tokens)`);
    return finalMsgs;
  },

  async getEmbedding(text, silent = false) {
    if (!text) return null;
    const settings = settingsService.getAll();
    const model = settings["Embedding Model Name"] || "nomic-embed-text";
    const embedEndpoint = settings["Embedding Endpoint"];

    try {
      let baseURL = (embedEndpoint || "").trim();
      if (!baseURL) {
        baseURL = (settings.Endpoint || "http://localhost:1234").replace(/\/?$/, "");
      }
      
      // Ensure it ends with /v1/embeddings
      let url = baseURL;
      if (!url.includes("/embeddings")) {
        url = url.replace(/\/v1\/?$/, ""); // strip existing /v1
        url = `${url}/v1/embeddings`;
      }

      if (!silent) {
        logService.info("Embedding", `Requesting vector via fetch. Model: ${model}, Endpoint: ${url}`);
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: text }),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      const vector = json.data?.[0]?.embedding;
      
      if (!vector || !Array.isArray(vector)) {
        throw new Error("Invalid response format (missing embedding array)");
      }

      const absSum = vector.reduce((a, b) => a + Math.abs(b), 0);
      if (absSum === 0) {
        throw new Error("Received all-zero vector from server (check model status)");
      }

      if (!silent) {
        logService.info("Embedding", `Success: length=${vector.length}, weight=${absSum.toFixed(2)}`);
      }
      return vector;
    } catch (e) {
      if (!silent) {
        logService.error("Embedding failed", e.message);
      }
      return null;
    }
  },

  async extractAndSaveMemory(userText) {
    if (!userText || userText.length < 5) return;

    const settings = settingsService.getAll();
    const model = settings["Model Name"] || "local-model";

    const prompt = `Analyze the following user message. If it contains a new personal fact, preference, or important detail about the user, extract it as a concise statement in the SAME LANGUAGE as the user's message. If it is just a general question, greeting, or contains no personal facts, reply exactly with "NONE".
    
Examples:
User: "I like coffee" -> "User likes coffee"
User: "tôi tên là rito" -> "Người dùng tên là rito"
User: "chào bạn" -> "NONE"
User: "what is 2+2?" -> "NONE"

User message: "${userText}"`;

    try {
      const client = getClient();
      logService.info("Auto-Learning", `Starting extraction for: "${userText.substring(0, 30)}..."`);
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, // Low temperature for factual extraction
        max_tokens: 50,
      });

      const extractedFact = res.choices[0]?.message?.content?.trim();
      logService.info("Auto-Learning", `Model returned: "${extractedFact}"`);

      if (extractedFact && extractedFact !== "NONE" && !extractedFact.toLowerCase().includes("none")) {
        const autoSaveMode = settings["Auto Save Memories"] || "Review First";
        if (autoSaveMode === "Off") {
          logService.info("Auto-Learning", `Skipped saving memory (Auto Save is Off)`);
          return;
        }
        // Note: For "Review First", we currently save it directly but could add a UI prompt later.
        const capacity = parseInt(settings["Database Capacity"] || "100", 10);
        logService.info("Auto-Learning", `Extracted new memory: ${extractedFact}`);

        const vector = await this.getEmbedding(extractedFact);

        memoryService.add({
          user: "User",
          content: extractedFact,
          score: 0.8, // Higher score for auto-extracted facts
          vector: vector ? JSON.stringify(vector) : null
        }, capacity);
      }
    } catch (e) {
      logService.error("Auto-Learning failed", e.message);
    }
  },

  async chat(messages, options = {}) {
    const settings = settingsService.getAll();
    const model = options.model || settings["Model Name"] || "local-model";
    const temperature = parseFloat(options.temperature ?? settings.Temperature ?? "0.7");
    const maxTokens = parseInt(options.maxTokens || settings["Max Output Tokens"] || "4096", 10);
    const topP = parseFloat(options.topP ?? settings["Top P"] ?? "0.95");
    const presencePenalty = parseFloat(options.presencePenalty ?? settings["Presence Penalty"] ?? "0.0");
    const frequencyPenalty = parseFloat(options.frequencyPenalty ?? settings["Frequency Penalty"] ?? "0.0");
    const seed = options.seed || settings["Seed"] ? parseInt(options.seed || settings["Seed"], 10) : undefined;
    const contextWindow = parseInt(options.contextWindow || settings["Context Window"] || "32768", 10);

    // RAG: Vector Search for relevant memories
    let memoryContext = "";
    const lastUserMsg = messages.slice().reverse().find(m => m.role === "user");
    if (lastUserMsg && lastUserMsg.content) {
      const queryVector = await this.getEmbedding(lastUserMsg.content, true); // Silent log for RAG queries
      if (queryVector) {
        const maxMemories = parseInt(settings["Max Memory Count"] || "3", 10);
        // FORCE the min score to a lower threshold if it's too high, to ensure matches
        let minScore = parseFloat(settings["Min Memory Score"] || "0.5");

        const relevantMemories = memoryService.searchVector(queryVector, maxMemories, minScore);

        if (relevantMemories && relevantMemories.length > 0) {
          memoryContext = relevantMemories.map(m => `- ${m.content} (from ${m.time})`).join("\n");
          const logTexts = relevantMemories.map(m => `"${m.content}" (sim: ${m.similarity.toFixed(2)})`).join(" | ");
          logService.info("RAG", `Injected ${relevantMemories.length} memories: ${logTexts}`);
        } else {
          // Fallback: try again with a much lower threshold just to see if ANYTHING matches
          const fallbackMemories = memoryService.searchVector(queryVector, maxMemories, 0.1);
          if (fallbackMemories && fallbackMemories.length > 0) {
            const logTexts = fallbackMemories.map(m => `"${m.content}" (sim: ${m.similarity.toFixed(2)})`).join(" | ");
            logService.info("RAG", `No memories above ${minScore}. Found below threshold: ${logTexts}`);
          } else {
            logService.info("RAG", "No relevant memories found in database at all.");
          }
        }
      }
    }

    const prepared = this._prepareMessages(messages, settings, options, memoryContext);

    logService.info("Request", `model=${model} messages=${prepared.length} ctx=${contextWindow}`);
    try {
      const client = getClient();
      
      const body = {
        model,
        messages: prepared,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty,
        seed,
        stream: false,
      };

      // Ollama specific context window override
      if (settings.Provider === "Local / Ollama") {
        body.options = { num_ctx: contextWindow };
      }

      const res = await client.chat.completions.create(body);
      const content = res.choices[0]?.message?.content || "";
      logService.info("Response", `tokens ~${content.length}`);

      // Auto-Learning: Trigger in background
      if (lastUserMsg && lastUserMsg.content) {
        this.extractAndSaveMemory(lastUserMsg.content).catch(e => console.error("Auto-learning error:", e));
      }

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
    const presencePenalty = parseFloat(options.presencePenalty ?? settings["Presence Penalty"] ?? "0.0");
    const frequencyPenalty = parseFloat(options.frequencyPenalty ?? settings["Frequency Penalty"] ?? "0.0");
    const seed = options.seed || settings["Seed"] ? parseInt(options.seed || settings["Seed"], 10) : undefined;
    const contextWindow = parseInt(options.contextWindow || settings["Context Window"] || "32768", 10);
    const streamEnabled = settings.Streaming === "Enabled";

    // RAG: Vector Search for relevant memories
    let memoryContext = "";
    const lastUserMsg = messages.slice().reverse().find(m => m.role === "user");
    if (lastUserMsg && lastUserMsg.content) {
      const queryVector = await this.getEmbedding(lastUserMsg.content, true); // Silent log for RAG queries
      if (queryVector) {
        const maxMemories = parseInt(settings["Max Memory Count"] || "3", 10);
        // FORCE the min score to a lower threshold if it's too high, to ensure matches
        let minScore = parseFloat(settings["Min Memory Score"] || "0.5");

        const relevantMemories = memoryService.searchVector(queryVector, maxMemories, minScore);

        if (relevantMemories && relevantMemories.length > 0) {
          memoryContext = relevantMemories.map(m => `- ${m.content} (from ${m.time})`).join("\n");
          const logTexts = relevantMemories.map(m => `"${m.content}" (sim: ${m.similarity.toFixed(2)})`).join(" | ");
          logService.info("RAG", `Injected ${relevantMemories.length} memories: ${logTexts}`);
        } else {
          // Fallback: try again with a much lower threshold just to see if ANYTHING matches
          const fallbackMemories = memoryService.searchVector(queryVector, maxMemories, 0.1);
          if (fallbackMemories && fallbackMemories.length > 0) {
            const logTexts = fallbackMemories.map(m => `"${m.content}" (sim: ${m.similarity.toFixed(2)})`).join(" | ");
            logService.info("RAG", `No memories above ${minScore}. Found below threshold: ${logTexts}`);
          } else {
            logService.info("RAG", "No relevant memories found in database at all.");
          }
        }
      }
    }

    const prepared = this._prepareMessages(messages, settings, options, memoryContext);

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
      
      const body = {
        model,
        messages: prepared,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty,
        seed,
        stream: true,
      };

      // Ollama specific context window override
      if (settings.Provider === "Local / Ollama") {
        body.options = { num_ctx: contextWindow };
      }

      const stream = await client.chat.completions.create(body);

      let tokenCount = 0;
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text && mainWindow?.webContents) {
          tokenCount++;
          mainWindow.webContents.send("chat-stream-chunk", text);
        }
      }
      logService.info("Response", `streamed ~${tokenCount} chunks`);

      // Auto-Learning: Trigger in background after stream completes
      if (lastUserMsg && lastUserMsg.content) {
        this.extractAndSaveMemory(lastUserMsg.content).catch(e => console.error("Auto-learning error:", e));
      }

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
