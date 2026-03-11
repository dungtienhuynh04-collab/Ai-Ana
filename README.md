# Nova Bot – AI Desktop Assistant

A local AI desktop assistant powered by **LM Studio** or **Ollama**. Everything runs on your machine—no cloud, no API keys, no cost.

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Chat** with local LLMs (LM Studio, Ollama) with streaming
- **Long-term memory** stored in SQLite
- **Settings** persisted locally
- **Full-screen** responsive UI
- 100% local and free

## Quick Start (Download Release)

1. Go to [Releases](https://github.com/dungtienhuynh04-collab/Ai-Ana/releases) 
2. Download **Nova Bot Setup 1.0.0.exe** (installer) or **Nova Bot 1.0.0 win.zip** (portable)
3. Run the app
4. Start **LM Studio** → Developer tab → enable Local Server
5. Load a model in LM Studio
6. In Nova Bot: **Settings** → **Provider** → set **Model Name** to match your loaded model

## Requirements

- **Windows** 10/11 (64-bit)
- **LM Studio** or **Ollama** (for local LLM)
- No Node.js needed when using the release build

## Configuration

1. Open **Settings** in the app
2. Go to **Provider**:
   - **Provider**: LM Studio (or Ollama)
   - **Endpoint**: `http://127.0.0.1:11434` (LM Studio) or `http://localhost:11434` (Ollama)
   - **Model Name**: exact name of the model loaded in LM Studio (e.g. `llama-3.1-8b`)

## Build from Source

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/dungtienhuynh04-collab/Ai-Ana.git
cd Ai-Ana
npm install
npm run electron:dev
```

### Build Release (Windows)

```bash
npm run build
npm run dist
```

Outputs:

- `release/Nova-Bot-Setup-1.0.0.exe` – installer
- `release/Nova-Bot-1.0.0-win.zip` – portable ZIP

## Project Structure

```
├── electron/
│   ├── main.js           # Electron main process
│   ├── preload.js        # IPC bridge
│   └── services/
│       ├── llm.js        # LM Studio / Ollama API
│       ├── memory.js     # SQLite memory
│       └── settings.js   # Settings persistence
├── src/
│   ├── App.jsx
│   └── components/
│       └── AIBotDesktopUI.jsx
├── package.json
└── README.md
```

## License

MIT
