import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { llmService } from "./services/llm.js";
import { logService } from "./services/log.js";
import { memoryService } from "./services/memory.js";
import { settingsService } from "./services/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

let mainWindow;

function getPreloadPath() {
  return path.join(__dirname, "preload.js");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "default",
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  settingsService.init();
  memoryService.init();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  memoryService.close();
  if (process.platform !== "darwin") app.quit();
});

// --- IPC Handlers ---

// LLM / Chat
ipcMain.handle("llm:chat", async (_, { messages, options }) => {
  return llmService.chat(messages, options);
});

ipcMain.handle("llm:chat-stream", async (_, { messages, options }) => {
  return llmService.chatStream(messages, options, mainWindow);
});

ipcMain.handle("llm:list-models", async () => {
  return llmService.listModels();
});

ipcMain.handle("llm:test-connection", async () => {
  return llmService.testConnection();
});

// Memory
ipcMain.handle("memory:get-all", async () => {
  return memoryService.getAll();
});

ipcMain.handle("memory:search", async (_, query) => {
  return memoryService.search(query);
});

ipcMain.handle("memory:add", async (_, record) => {
  const settings = settingsService.getAll();
  const capacity = parseInt(settings["Database Capacity"] || "100", 10);
  return memoryService.add(record, capacity);
});

ipcMain.handle("memory:update", async (_, id, content) => {
  return memoryService.update(id, content);
});

ipcMain.handle("memory:delete", async (_, id) => {
  return memoryService.delete(id);
});

ipcMain.handle("memory:delete-many", async (_, ids) => {
  return memoryService.deleteMany(ids);
});

// Settings
ipcMain.handle("settings:get-all", async () => {
  return settingsService.getAll();
});

ipcMain.handle("settings:set", async (_, key, value) => {
  return settingsService.set(key, value);
});

ipcMain.handle("settings:set-bulk", async (_, values) => {
  return settingsService.setBulk(values);
});

// Log
ipcMain.handle("log:get-all", async () => logService.getAll());
ipcMain.handle("log:clear", async () => logService.clear());
