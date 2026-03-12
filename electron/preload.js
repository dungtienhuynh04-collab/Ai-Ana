const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // LLM
  chat: (messages, options) => ipcRenderer.invoke("llm:chat", { messages, options }),
  chatStream: (messages, options) => ipcRenderer.invoke("llm:chat-stream", { messages, options }),
  listModels: () => ipcRenderer.invoke("llm:list-models"),
  testConnection: () => ipcRenderer.invoke("llm:test-connection"),

  // Memory
  memoryGetAll: () => ipcRenderer.invoke("memory:get-all"),
  memorySearch: (query) => ipcRenderer.invoke("memory:search", query),
  memoryAdd: (record) => ipcRenderer.invoke("memory:add", record),
  memoryUpdate: (id, content) => ipcRenderer.invoke("memory:update", id, content),
  memoryDelete: (id) => ipcRenderer.invoke("memory:delete", id),
  memoryDeleteMany: (ids) => ipcRenderer.invoke("memory:delete-many", ids),

  // Settings
  settingsGetAll: () => ipcRenderer.invoke("settings:get-all"),
  settingsSet: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  settingsSetBulk: (values) => ipcRenderer.invoke("settings:set-bulk", values),

  // Stream listener (call removeChatListeners before re-registering)
  onChatChunk: (callback) => {
    ipcRenderer.on("chat-stream-chunk", (_, chunk) => callback(chunk));
  },
  onChatDone: (callback) => {
    ipcRenderer.on("chat-stream-done", () => callback());
  },
  removeChatListeners: () => {
    ipcRenderer.removeAllListeners("chat-stream-chunk");
    ipcRenderer.removeAllListeners("chat-stream-done");
  },

  // Log
  logGetAll: () => ipcRenderer.invoke("log:get-all"),
  logClear: () => ipcRenderer.invoke("log:clear"),
});
