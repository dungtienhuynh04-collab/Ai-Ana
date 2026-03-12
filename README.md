# Nova Bot – AI Desktop Assistant

A local AI desktop assistant powered by **LM Studio** or **Ollama**. Everything runs on your machine—no cloud, no API keys, no cost.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Chat** with local LLMs (LM Studio, Ollama) with streaming
- **Multiple chats** with history, New Chat, delete chat
- **System prompt** – edit in app (no need for LM Studio)
- **Long-term memory** stored in SQLite
- **Settings** persisted locally (Theme, LLM, Context Window, etc.)
- **Full-screen** responsive UI, resizable avatar panel
- 100% local and free

---

## Setup & Run (for users)

### Step 1: Download

1. Go to [Releases](https://github.com/dungtienhuynh04-collab/Ai-Ana/releases)
2. Download **Nova Bot-1.0.0-win.zip** (portable, no installation required)

### Step 2: Extract and run

1. Extract the zip file (right-click → **Extract All**)
2. Open the extracted folder
3. Double-click **Nova Bot.exe** to run

**Note:** No Node.js or other software needed. Windows 10/11 (64-bit) only.

### Step 3: Install LM Studio (for AI chat)

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Open LM Studio → **Developer** tab → enable **Local Server** (port 1234)
3. Download and load a model (e.g. Llama, Qwen) in LM Studio
4. In Nova Bot: **Settings** → **Provider**:
   - **Endpoint:** `http://localhost:1234`
   - **Model Name:** type the exact model name shown in LM Studio (e.g. `llama-3.1-8b-instruct`)

### Step 4: Start chatting

Click **Chat** and type your message. The AI will respond using the model you loaded in LM Studio.

---

## Using Ollama instead of LM Studio

1. Install [Ollama](https://ollama.ai/)
2. Open CMD/Terminal and run: `ollama run llama3.1` (or another model)
3. In Nova Bot: **Settings** → **Provider**:
   - **Provider:** Local / Ollama
   - **Endpoint:** `http://localhost:11434`
   - **Model Name:** model name (e.g. `llama3.1`)

---

## Settings reference

| Setting | Description |
|---------|-------------|
| **Model Name** | Must match the model name in LM Studio exactly |
| **Temperature** | Creativity level (0–2) |
| **Context Window** | Max tokens for conversation |
| **System Prompt** | Settings → LLM → click System Prompt to edit |
| **Avatar Panel** | Toggle on/off, resize 30–70% |

---

## For developers (Build from source)

Requires Node.js 18+ and npm.

```bash
npm install
npm run dist
```

Output: `release/Nova Bot-1.0.0-win.zip` – package for uploading to Releases.

**Note:** Close Nova Bot before running `npm run dist`.

---

## Project structure

```
├── electron/           # Desktop app (main, preload, services)
├── server/             # Web mode backend (Express)
├── src/
│   ├── App.jsx
│   ├── api/
│   └── components/
│       └── AIBotDesktopUI.jsx
├── RUN-WEB.bat        # One-click web mode
├── RUN-EXE.bat        # One-click Electron
├── package.json
└── README.md
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No response | Ensure LM Studio Local Server is enabled |
| Model not found | Type the exact model name in Settings → Model Name |
| App won't open | Try running as Administrator or temporarily disable antivirus |

---

## License

MIT
