import { app } from "electron";
import fs from "fs";
import path from "path";

const DEFAULT_SETTINGS = {
  "UI Language": "English",
  Theme: "Midnight Glass",
  "UI Style": "Rounded Modern",
  "Accent Color": "Violet",
  "Sidebar Style": "Panel",
  "Startup Page": "Last Session",
  Notifications: "On",
  "Compact Mode": "Off",
  "Avatar Panel Width": "420",
  Provider: "LM Studio",
  Endpoint: "http://localhost:1234",
  "Model Name": "local-model",
  "Fallback Model": "llama3.1:8b",
  "Auto Connect": "Enabled",
  Temperature: "0.7",
  "Top P": "0.95",
  "Max Output Tokens": "4096",
  "Context Window": "32768",
  "System Prompt": "You are a helpful AI assistant. Adapt to the user's needs.",
  Streaming: "Enabled",
  "STT Provider": "Local / Whisper",
  "STT Model": "faster-whisper-large-v3",
  "STT Language": "Auto Detect",
  "Microphone Device": "Default Input",
  "Push To Talk": "On",
  "TTS Provider": "Local / Kokoro",
  "TTS Model": "kokoro-en-v1",
  Voice: "Nova",
  "TTS Language": "English",
  "Speech Speed": "1.0",
  "Short-Term Memory": "Enabled",
  "Short Memory Turns": "12",
  "Long-Term Memory": "Enabled",
  "Memory Provider": "Local Vector Store",
  "Auto Save Memories": "Review First",
  "Memory Retrieval": "Balanced",
  "Tool Calling": "Allowed",
  "Local Files": "Ask First",
  "Web Search": "Enabled",
  "Code Execution": "Enabled",
  "Screen Capture": "Off",
  "Image Generation": "Available",
};

let settings = { ...DEFAULT_SETTINGS };

function getSettingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

export const settingsService = {
  init() {
    try {
      const p = getSettingsPath();
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p, "utf-8");
        const loaded = JSON.parse(data);
        settings = { ...DEFAULT_SETTINGS, ...loaded };
      }
    } catch (e) {
      console.error("Settings load error:", e);
    }
  },

  _save() {
    try {
      fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("Settings save error:", e);
    }
  },

  getAll() {
    return { ...settings };
  },

  set(key, value) {
    settings[key] = String(value);
    this._save();
  },

  setBulk(values) {
    Object.assign(settings, values);
    this._save();
  },
};
