# Nova Bot / Ai-Ana – Project Overview

Tài liệu tổng hợp thông tin dự án, kiến trúc, workflow và roadmap.

---

## 1. Tổng quan

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên** | Nova Bot (Ai-Ana) |
| **Phiên bản** | 1.0.0 |
| **Mô tả** | AI desktop assistant chạy 100% local |
| **Platform** | Windows 10/11 (64-bit) |
| **License** | MIT |

**Đặc điểm:** Không cloud, không API key, dùng LM Studio hoặc Ollama.

---

## 2. Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 18, Vite 6, Tailwind CSS |
| **Desktop** | Electron 33 |
| **Backend (Web)** | Express |
| **LLM Client** | OpenAI SDK (compatible LM Studio/Ollama) |
| **Database** | better-sqlite3 (Electron), JSON file (Web) |

---

## 3. Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  src/App.jsx, src/components/AIBotDesktopUI.jsx             │
│  src/api/webApi.js (fetch) hoặc window.electronAPI (IPC)     │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                           ▼
┌─────────────────────┐                 ┌─────────────────────┐
│  Electron (desktop) │                 │  Web (dev/test)     │
│  electron/main.js   │                 │  server/index.js    │
│  IPC ↔ preload.js   │                 │  Express API        │
└─────────────────────┘                 └─────────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────────┐                 ┌─────────────────────┐
│  electron/services/ │                 │  server/services.js │
│  llm, memory,       │                 │  (LLM, memory,      │
│  settings, log      │                 │   settings, log)     │
└─────────────────────┘                 └─────────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────────┐                 ┌─────────────────────┐
│  SQLite (memory.db)  │                 │  JSON (memory.json) │
│  settings.json      │                 │  settings.json      │
└─────────────────────┘                 └─────────────────────┘
```

---

## 4. Cấu trúc thư mục

```
Ai-Ana/
├── electron/              # Desktop app
│   ├── main.js           # Entry, IPC handlers
│   ├── preload.js        # contextBridge → electronAPI
│   └── services/
│       ├── llm.js        # Chat, streaming, LM Studio/Ollama
│       ├── memory.js     # SQLite CRUD
│       ├── settings.js   # settings.json
│       └── log.js        # In-memory log
├── server/               # Web mode
│   ├── index.js          # Express API
│   └── services.js       # LLM, memory, settings, log
├── src/
│   ├── App.jsx           # State, chat logic, api switch
│   ├── main.jsx
│   ├── index.css
│   ├── api/webApi.js     # Fetch API cho web mode
│   └── components/
│       └── AIBotDesktopUI.jsx  # UI chính
├── scripts/
│   └── kill-app.js       # Đóng app trước build
├── .vscode/              # Cursor/VS Code
│   ├── tasks.json
│   ├── launch.json
│   └── settings.json
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── README.md
├── PROJECT.md            # File này
├── RUN-WEB.bat
└── RUN-EXE.bat
```

---

## 5. Tính năng hiện tại

### Đã có
- Chat với LM Studio/Ollama, streaming
- Nhiều cuộc hội thoại, lưu localStorage
- System prompt chỉnh trong app (presets: Default, Coder, Creative, Assistant)
- Long-term memory: CRUD thủ công qua UI (SQLite/JSON)
- Settings: Theme, LLM, Provider, Context Window, v.v.
- UI: Themes, UI Style, Accent Color, Avatar Panel resize
- Log viewer
- Chạy Electron hoặc Web mode

### Chưa nối / chưa dùng
- **LTM trong chat:** Memory không được retrieve/inject vào prompt khi chat
- **Auto Save Memories:** Setting có nhưng chưa implement
- **Memory Retrieval:** Setting có nhưng chưa dùng
- **STT, TTS, Tools, Screen Capture:** UI có, backend chưa

---

## 6. Workflow

### Development

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chỉ Vite (frontend) |
| `npm run server` | Chỉ Express API |
| `npm run dev:web` | Vite + Express (web mode) |
| `npm run dev:tunnel` | dev:web + localtunnel (xem trong Cursor) |
| `npm run electron:dev` | Vite + Electron (hot reload) |

### Build & Release

| Lệnh | Mô tả | Output |
|------|-------|--------|
| `npm run build` | Vite build | `dist/` |
| `npm run dist` | Build + electron-builder (tự đóng app) | `release-out/` |

### Output (upload lên GitHub Releases)

| File | Mục đích |
|------|----------|
| `Nova Bot-1.0.0-win.zip` | Giải nén → chạy Nova Bot.exe (không cài đặt) |

---

## 7. Chạy trong Cursor

- **Web:** `Run Task` → Start Nova Bot (Web) → mở `http://localhost:5173` (trình duyệt ngoài)
- **Tunnel (trong Cursor):** `npm run dev:tunnel` → mở URL `https://xxx.loca.lt` trong Integrated Browser
- **Electron:** `Run Task` → Start Nova Bot (Electron)
- **F5:** Chọn config "Nova Bot (Web)" hoặc "Nova Bot (Electron)"

---

## 8. Roadmap / Ý tưởng

### Ưu tiên cao
1. **LTM trong chat:** Gọi `memoryService.search()` trong `_prepareMessages()`, inject vào system prompt
2. **Persona system:** Tab Persona = prompt + model + params; danh sách, đổi tên, xóa, chọn nhanh

### Ưu tiên trung bình
3. **Danh sách System Prompt:** Lưu nhiều prompt, đổi tên, xóa, chọn
4. **Auto Save Memories:** Tự extract từ chat, review trước khi lưu

### Ưu tiên thấp
5. STT, TTS, Tools, Screen Capture (backend)
6. macOS, Linux build

---

## 9. Cấu hình quan trọng

### Vite (`vite.config.js`)
- `base: "./"` – relative paths cho Electron
- `server.proxy /api → 3001` – Web mode
- Headers CORS cho Simple Browser

### Electron Builder (`package.json` build)
- `asar: false` – native modules (better-sqlite3)
- `directories.output: release-build`
- `files`: package.json, dist, electron, node_modules
- `extraResources`: README.md

### Ports
- **5173** – Vite dev server
- **3001** – Express API (web mode)
- **1234** – LM Studio
- **11434** – Ollama

---

## 10. Troubleshooting

| Vấn đề | Giải pháp |
|-------|-----------|
| Access denied khi build | `npm run dist` tự kill app; output dùng `release-build/` |
| Zip thiếu tính năng | Chạy `npm run dist:clean` rồi `npm run dist` |
| Không xem được trong Cursor | Dùng `npm run dev:tunnel` hoặc trình duyệt ngoài |
| Model not found | Nhập đúng tên model trong LM Studio |
| No response | Bật Local Server trong LM Studio |

---

## 11. Liên kết

- [README.md](./README.md) – Hướng dẫn người dùng
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) – Setup GitHub Releases
- [CONTRIBUTING.md](./CONTRIBUTING.md) – Đóng góp
