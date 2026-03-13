import { useMemo, useState, useEffect, useRef } from "react";

export default function AIBotDesktopUI({
  settingValues = {},
  onSettingChange = () => { },
  onSaveSettings = () => false,
  memoryRows = [],
  onMemoryAdd = () => { },
  onMemoryUpdate = () => { },
  onMemoryDelete = () => { },
  onMemoryDeleteMany = () => { },
  onMemorySearch = () => { },
  onOpenMemoryEditor = () => { },
  onGetLogs = () => Promise.resolve([]),
  onClearLogs = () => { },
  messages = [],
  inputText = "",
  onInputChange = () => { },
  onSendMessage = () => { },
  isLoading = false,
  chats = [],
  activeChatId = null,
  onNewChat = () => { },
  onSelectChat = () => { },
  onDeleteChat = () => { },
  onRenameChat = () => { },
  hasElectronAPI = true,
  availableModels = [],
  messageQueueCount = 0,
  onPersonaSwitch = () => { },
}) {
  const chatInputRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [activeSettingsSection, setActiveSettingsSection] = useState("general");
  const [rightPanelWidth, setRightPanelWidth] = useState(420);
  const [chatRatio, setChatRatio] = useState(0.7);
  const avatarPanelEnabled = (settingValues["Avatar Panel"] ?? "On") === "On";
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryEditorOpen, setMemoryEditorOpen] = useState(false);
  const [systemPromptEditorOpen, setSystemPromptEditorOpen] = useState(false);
  const [systemPromptDraft, setSystemPromptDraft] = useState("");
  const [promptNameDraft, setPromptNameDraft] = useState("");
  const [personaEditorOpen, setPersonaEditorOpen] = useState(false);
  const [personaDraft, setPersonaDraft] = useState({ name: "", prompt: "", model: "", temperature: 0.7, topP: 0.95, maxTokens: 4096, contextWindow: 32768 });
  const [screenCaptureSettingsOpen, setScreenCaptureSettingsOpen] = useState(false);
  const [selectedMemoryIds, setSelectedMemoryIds] = useState(new Set());
  const [logEntries, setLogEntries] = useState([]);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Auto-focus chat input after AI response completes
  useEffect(() => {
    if (!isLoading && activeTab === "chat") {
      chatInputRef.current?.focus();
    }
  }, [isLoading, activeTab]);

  useEffect(() => {
    const w = Number(settingValues["Avatar Panel Width"]);
    if (!Number.isNaN(w)) setRightPanelWidth(Math.min(680, Math.max(280, w)));
  }, [settingValues["Avatar Panel Width"]]);

  useEffect(() => {
    const r = Number(settingValues["Chat Ratio"]);
    if (!Number.isNaN(r) && r >= 0.3 && r <= 0.7) setChatRatio(r);
  }, [settingValues["Chat Ratio"]]);

  useEffect(() => {
    if (activeTab === "log" && hasElectronAPI) {
      onGetLogs().then(setLogEntries);
    }
  }, [activeTab, hasElectronAPI, onGetLogs]);

  useEffect(() => {
    if (systemPromptEditorOpen) {
      setSystemPromptDraft(settingValues["System Prompt"] ?? "You are a helpful AI assistant.");
      setPromptNameDraft("");
    }
  }, [systemPromptEditorOpen, settingValues["System Prompt"]]);

  const personas = useMemo(() => {
    try {
      return JSON.parse(settingValues.Personas || "[]");
    } catch {
      return [];
    }
  }, [settingValues.Personas]);

  useEffect(() => {
    if (personaEditorOpen) {
      const activeId = settingValues["Active Persona ID"];
      if (activeId) {
        const active = personas.find(p => p.id === activeId);
        if (active) {
          setPersonaDraft(active);
          return;
        }
      }
      if (!personaDraft.name && personas.length > 0) {
        setPersonaDraft(personas[0]);
      }
    }
  }, [personaEditorOpen, settingValues["Active Persona ID"], personas]);

  const customPrompts = useMemo(() => {
    try {
      return JSON.parse(settingValues["System Prompts"] || "[]");
    } catch {
      return [];
    }
  }, [settingValues["System Prompts"]]);

  const savePromptToLibrary = () => {
    const name = promptNameDraft.trim() || "Untitled Prompt";
    const text = systemPromptDraft.trim();
    if (!text) return;
    const newPrompts = [...customPrompts, { id: Date.now().toString(), name, content: text }];
    handleSettingChange("System Prompts", JSON.stringify(newPrompts));
    handleSettingChange("System Prompt", text);
    setPromptNameDraft("");
  };

  const deletePromptFromLibrary = (id) => {
    const newPrompts = customPrompts.filter((p) => p.id !== id);
    handleSettingChange("System Prompts", JSON.stringify(newPrompts));
  };

  const savePersonaToLibrary = (andActivate = false) => {
    if (!personaDraft.name.trim() || !personaDraft.prompt.trim()) return;
    const id = personaDraft.id || Date.now().toString();
    const newPersona = { ...personaDraft, id };
    
    let nextPersonas;
    const existing = personas.find(p => p.id === id);
    if (existing) {
      nextPersonas = personas.map(p => p.id === id ? newPersona : p);
    } else {
      nextPersonas = [...personas, newPersona];
    }
    
    handleSettingChange("Personas", JSON.stringify(nextPersonas));
    
    if (andActivate) {
      onPersonaSwitch(id);
    }
    
    setPersonaEditorOpen(false);
  };

  const deletePersonaFromLibrary = (id) => {
    const nextPersonas = personas.filter((p) => p.id !== id);
    handleSettingChange("Personas", JSON.stringify(nextPersonas));
  };

  const settingSections = useMemo(
    () => [
      {
        id: "general",
        label: "General",
        description: "Core app preferences and interface behavior.",
        items: [
          { name: "UI Language", value: "English", hint: "Switch app language", type: "select", options: ["English", "Vietnamese"] },
          { name: "Theme", value: "Midnight Glass", hint: "Visual appearance preset", type: "select", options: ["Midnight Glass", "Pure Dark", "Soft Light", "Cyber Neon", "Soft Violet", "Ocean Blue"] },
          { name: "UI Style", value: "Rounded Modern", hint: "Overall component style", type: "select", options: ["Rounded Modern", "Minimal Flat", "Dense Pro", "Floating Glass", "Gaming HUD", "Soft Card", "Luxury Panel"] },
          { name: "Accent Color", value: "Violet", hint: "Primary highlight color", type: "select", options: ["White", "Violet", "Blue", "Cyan", "Green", "Orange", "Rose"] },
          { name: "Sidebar Style", value: "Panel", hint: "Navigation presentation", type: "select", options: ["Panel", "Floating", "Compact Rail", "Blur Strip"] },
          { name: "Startup Page", value: "Last Session", hint: "Open on launch", type: "select", options: ["Last Session", "Chat", "Settings"] },
          { name: "Notifications", value: "On", hint: "Desktop alerts", type: "toggle", provider: settingValues.Provider },
          { name: "Compact Mode", value: "Off", hint: "Dense layout", type: "toggle", provider: settingValues.Provider },
          { name: "Avatar Panel", value: settingValues["Avatar Panel"] ?? "On", hint: "Show avatar area (off = chat 100%)", type: "toggle", provider: settingValues.Provider },
          { name: "Avatar Panel Width", value: String(rightPanelWidth), hint: "Resize avatar area (30–70%)", type: "slider", min: 280, max: 680, provider: settingValues.Provider },
        ],
      },
      {
        id: "provider",
        label: "Provider",
        description: "Connect cloud or local inference backends.",
        items: [
          { name: "Provider", value: settingValues.Provider || "LM Studio", hint: "Choose runtime source", type: "select", options: ["LM Studio", "Local / Ollama", "OpenAI API", "Anthropic API"], provider: settingValues.Provider },
          { name: "Endpoint", value: settingValues.Endpoint || "http://localhost:1234", hint: "LM Studio: localhost:1234 | Ollama: localhost:11434", type: "input", provider: settingValues.Provider },
          { name: "Auto Connect", value: "Enabled", hint: "Reconnect on app launch", type: "toggle", provider: settingValues.Provider },
        ],
      },
      {
        id: "llm",
        label: "LLM",
        description: "Tune generation, context, and reasoning behavior.",
        items: [
          { name: "Temperature", value: settingValues.Temperature || "0.7", hint: "Creativity level", type: "slider", min: 0, max: 2, provider: settingValues.Provider },
          { name: "Top P", value: settingValues["Top P"] || "0.95", hint: "Probability mass", type: "slider", min: 0, max: 1, provider: settingValues.Provider },
          { name: "Max Output Tokens", value: settingValues["Max Output Tokens"] || "4096", hint: "Response limit", type: "input", provider: settingValues.Provider },
          { name: "Context Window", value: settingValues["Context Window"] || "32768", hint: "Conversation memory size (Synced with Studio)", type: "input", provider: settingValues.Provider },
          { name: "Streaming", value: "Enabled", hint: "Render tokens live", type: "toggle", provider: settingValues.Provider },
          { name: "Model Name", value: settingValues["Model Name"] || "local-model", hint: "Select active model", type: availableModels.length ? "select" : "input", options: availableModels.map(m => typeof m === "string" ? m : m.id), provider: settingValues.Provider },
          { name: "Frequency Penalty", value: settingValues["Frequency Penalty"] ?? "0.0", hint: "Penalize repeated words (-2 to 2)", type: "slider", min: -2, max: 2, provider: settingValues.Provider },
          { name: "Seed", value: settingValues["Seed"] ?? "", hint: "Deterministic results (empty = random)", type: "input", provider: settingValues.Provider },
          { name: "Active Persona ID", value: settingValues["Active Persona ID"] || "", hint: "Select an active persona that overrides settings", type: "select", options: [{ id: "", name: "Default AI (None)" }, ...personas], labelKey: "name", valueKey: "id", onValueChange: (v) => onPersonaSwitch(v) },
          { name: "Persona Manager", value: "Manage your AI personas", hint: "Create, edit, or delete personas", type: "action", buttonLabel: "Open Manager", onAction: () => setPersonaEditorOpen(true) },
          { 
            name: "System Prompt", 
            value: settingValues["System Prompt"] ?? "You are a helpful AI assistant.", 
            hint: settingValues["Active Persona ID"] ? `Controlled by Persona: ${personas.find(p => p.id === settingValues["Active Persona ID"])?.name || "Active Persona"}` : "Currently active prompt instructions", 
            type: "prompt-trigger", 
            disabled: !!settingValues["Active Persona ID"]
          },
        ],
      },
      {
        id: "stt",
        label: "STT",
        description: "Speech-to-text input configuration.",
        items: [
          { name: "STT Provider", value: "Local / Whisper", hint: "Speech recognition backend", type: "select", options: ["Local / Whisper", "OpenAI API", "Deepgram API", "Azure Speech"] },
          { name: "STT Model", value: "faster-whisper-large-v3", hint: "Transcription model", type: "select", options: ["faster-whisper-small", "faster-whisper-medium", "faster-whisper-large-v3"] },
          { name: "STT Language", value: "Auto Detect", hint: "Recognition language", type: "select", options: ["Auto Detect", "English", "Vietnamese"] },
          { name: "Microphone Device", value: "Default Input", hint: "Audio input source", type: "select", options: ["Default Input", "Headset Mic", "USB Microphone"] },
          { name: "Push To Talk", value: "On", hint: "Manual voice activation", type: "toggle" },
        ],
      },
      {
        id: "tts",
        label: "TTS",
        description: "Text-to-speech voice output configuration.",
        items: [
          { name: "TTS Provider", value: "Local / Kokoro", hint: "Speech synthesis backend", type: "select", options: ["Local / Kokoro", "XTTS v2", "OpenAI API"] },
          { name: "TTS Model", value: "kokoro-en-v1", hint: "Voice generation model", type: "select", options: ["kokoro-en-v1", "xtts-v2"] },
          { name: "Voice", value: "Nova", hint: "Voice preset", type: "select", options: ["Nova", "Alloy", "Echo", "Luna"] },
          { name: "TTS Language", value: "English", hint: "Output language", type: "select", options: ["English", "Vietnamese"] },
          { name: "Speech Speed", value: "1.0", hint: "Playback rate", type: "slider", min: 0.5, max: 2 },
        ],
      },
      {
        id: "memory",
        label: "Memory",
        description: "Manage short-term and long-term memory behavior.",
        items: [
          { name: "Short-Term Memory", value: "Enabled", hint: "Use recent turns", type: "toggle" },
          { name: "Short Memory Turns", value: "12", hint: "Conversation buffer", type: "slider", min: 4, max: 30 },
          { name: "Long-Term Memory", value: "Enabled", hint: "Persistent memory", type: "toggle" },
          { name: "Memory Provider", value: "Local Vector Store", hint: "Storage backend", type: "select", options: ["Local Vector Store", "SQLite"] },
          { name: "Embedding Model Name", value: "nomic-embed-text", hint: "Model used for vector embeddings", type: "input" },
          { name: "Embedding Endpoint", value: "", hint: "Endpoint for embeddings (leave empty to use main endpoint)", type: "input" },
          { name: "Auto Save Memories", value: "Review First", hint: "Approval mode", type: "select", options: ["Off", "Always", "Review First"] },
          { name: "Memory Retrieval", value: "Balanced", hint: "Recall aggressiveness", type: "select", options: ["Precise", "Balanced", "Aggressive"] },
          { name: "Min Memory Score", value: "0.2", hint: "Minimum vector similarity score (0.0 - 1.0)", type: "slider", min: 0, max: 1 },
          { name: "Max Memory Count", value: "3", hint: "Max memories to retrieve", type: "slider", min: 1, max: 100 },
          { name: "Database Capacity", value: "100", hint: "Max saved memories (replaces lowest score when full)", type: "slider", min: 10, max: 1000 },
          { name: "Edit Long-Term Memory", value: "Open memory database", hint: "Review saved memory records", type: "action", buttonLabel: "Edit Memory" },
        ],
      },
      {
        id: "tools",
        label: "Tools",
        description: "Control file access, search, and tool calling.",
        items: [
          { name: "Tool Calling", value: "Allowed", hint: "Enable tool use", type: "toggle" },
          { name: "Local Files", value: "Ask First", hint: "Permission mode", type: "select", options: ["Off", "Ask First", "Always Allow"] },
          { name: "Web Search", value: "Enabled", hint: "Online lookup", type: "toggle" },
          { name: "Code Execution", value: "Enabled", hint: "Runtime access", type: "toggle" },
          { name: "Screen Capture", value: "Off", hint: "Allow assistant screen observation", type: "toggle" },
          { name: "Screen Capture Settings", value: "Open detailed capture controls", hint: "Provider, mode, target, and frame rate", type: "action", buttonLabel: "Open Capture Settings" },
          { name: "Image Generation", value: "Available", hint: "Visual generation tools", type: "toggle" },
        ],
      },
    ],
    [rightPanelWidth, settingValues["Avatar Panel"], settingValues["System Prompt"]]
  );

  const currentSection = settingSections.find((s) => s.id === activeSettingsSection) ?? settingSections[0];
  const filteredMemoryRows = memoryRows.filter((row) => {
    const q = memorySearch.toLowerCase();
    return (
      (row.user || "").toLowerCase().includes(q) ||
      (row.content || "").toLowerCase().includes(q) ||
      (row.time || "").toLowerCase().includes(q)
    );
  });

  const currentTheme = settingValues.Theme ?? "Midnight Glass";
  const currentStyle = settingValues["UI Style"] ?? "Rounded Modern";
  const currentAccent = settingValues["Accent Color"] ?? "Violet";
  const screenCaptureEnabled = settingValues["Screen Capture"] === "On";
  const isLightTheme = currentTheme === "Soft Light";

  const themeMap = {
    "Midnight Glass": { app: "bg-neutral-950 text-white", shell: "border-white/10 bg-white/5", panel: "bg-black/20 border-white/10", bubble: "bg-white/[0.04] border-white/10", input: "bg-black/20 border-white/10 text-white/80", avatar: "from-violet-500/[0.08] via-cyan-400/[0.04] to-transparent" },
    "Pure Dark": { app: "bg-black text-white", shell: "border-white/10 bg-black", panel: "bg-neutral-950 border-white/10", bubble: "bg-neutral-900 border-white/10", input: "bg-neutral-950 border-white/10 text-white/80", avatar: "from-white/[0.03] via-transparent to-transparent" },
    "Soft Light": { app: "bg-stone-200 text-neutral-900", shell: "border-black/10 bg-stone-100", panel: "bg-stone-50 border-black/10", bubble: "bg-white border-black/10", input: "bg-white border-black/10 text-neutral-800", avatar: "from-stone-300/30 via-white/40 to-stone-100/20" },
    "Cyber Neon": { app: "bg-slate-950 text-cyan-50", shell: "border-cyan-400/20 bg-slate-950", panel: "bg-slate-900 border-cyan-400/20", bubble: "bg-slate-900 border-cyan-400/20", input: "bg-slate-950 border-cyan-400/20 text-cyan-50", avatar: "from-cyan-400/[0.16] via-fuchsia-500/[0.09] to-transparent" },
    "Soft Violet": { app: "bg-[#171325] text-violet-50", shell: "border-violet-300/10 bg-[#1b1730]", panel: "bg-[#221c3b] border-violet-200/10", bubble: "bg-[#261f45] border-violet-200/10", input: "bg-[#201a38] border-violet-200/10 text-violet-50", avatar: "from-violet-400/[0.16] via-pink-300/[0.06] to-transparent" },
    "Ocean Blue": { app: "bg-[#071826] text-sky-50", shell: "border-sky-300/10 bg-[#0a2031]", panel: "bg-[#0e2940] border-sky-200/10", bubble: "bg-[#12304b] border-sky-200/10", input: "bg-[#0b2438] border-sky-200/10 text-sky-50", avatar: "from-sky-400/[0.14] via-cyan-300/[0.07] to-transparent" },
  };

  const styleMap = {
    "Rounded Modern": { shell: "rounded-[28px]", panel: "rounded-[28px]", button: "rounded-2xl", card: "rounded-[24px]", border: "border", title: "" },
    "Minimal Flat": { shell: "rounded-[10px]", panel: "rounded-[10px]", button: "rounded-md", card: "rounded-lg", border: "border", title: "" },
    "Dense Pro": { shell: "rounded-[14px]", panel: "rounded-[14px]", button: "rounded-lg", card: "rounded-xl", border: "border", title: "tracking-tight" },
    "Floating Glass": { shell: "rounded-[34px]", panel: "rounded-[32px]", button: "rounded-[22px]", card: "rounded-[28px]", border: "border", title: "" },
    "Gaming HUD": { shell: "rounded-[6px]", panel: "rounded-[6px]", button: "rounded-none", card: "rounded-[4px]", border: "border-2", title: "uppercase tracking-[0.12em] font-mono" },
    "Soft Card": { shell: "rounded-[24px]", panel: "rounded-[26px]", button: "rounded-[20px]", card: "rounded-[22px]", border: "border", title: "" },
    "Luxury Panel": { shell: "rounded-[18px]", panel: "rounded-[16px]", button: "rounded-[10px]", card: "rounded-[12px]", border: "border", title: "tracking-[0.03em]" },
  };

  const accentMap = { White: "shadow-[0_0_28px_rgba(255,255,255,0.08)]", Violet: "shadow-[0_0_28px_rgba(139,92,246,0.18)]", Blue: "shadow-[0_0_28px_rgba(59,130,246,0.18)]", Cyan: "shadow-[0_0_28px_rgba(34,211,238,0.18)]", Green: "shadow-[0_0_28px_rgba(34,197,94,0.18)]", Orange: "shadow-[0_0_28px_rgba(249,115,22,0.18)]", Rose: "shadow-[0_0_28px_rgba(244,63,94,0.18)]" };

  const theme = themeMap[currentTheme] ?? themeMap["Midnight Glass"];
  const uiStyle = styleMap[currentStyle] ?? styleMap["Rounded Modern"];
  const accentGlow = accentMap[currentAccent] ?? accentMap.Violet;
  const textMain = isLightTheme ? "text-neutral-900" : "text-white";
  const textSub = isLightTheme ? "text-neutral-500" : "text-white/45";
  const sidebarTextMuted = isLightTheme ? "text-neutral-600" : "text-white/65";

  const handleSettingChange = (name, value) => {
    onSettingChange(name, value);
    if (name === "Avatar Panel Width") {
      const w = Number(value);
      if (!Number.isNaN(w)) setRightPanelWidth(w);
    }
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    const gridEl = e.currentTarget.parentElement;
    const container = gridEl?.getBoundingClientRect();
    if (!container) return;
    const sidebarW = sidebarCollapsed ? 0 : 260;
    const contentW = container.width - sidebarW - 10;
    const handleMouseMove = (me) => {
      const avatarW = container.right - me.clientX;
      const avatarRatio = Math.min(0.7, Math.max(0.3, avatarW / contentW));
      const newChatRatio = 1 - avatarRatio;
      setChatRatio(newChatRatio);
      onSettingChange("Chat Ratio", String(newChatRatio.toFixed(2)));
      setRightPanelWidth(Math.round(contentW * avatarRatio));
      onSettingChange("Avatar Panel Width", String(Math.round(contentW * avatarRatio)));
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const toggleSelectAll = () => {
    const allSelected = filteredMemoryRows.length > 0 && filteredMemoryRows.every((r) => selectedMemoryIds.has(r.id));
    if (allSelected) setSelectedMemoryIds(new Set());
    else setSelectedMemoryIds(new Set(filteredMemoryRows.map((r) => r.id)));
  };

  const toggleRow = (id) => {
    setSelectedMemoryIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    onMemoryDeleteMany([...selectedMemoryIds]);
    setSelectedMemoryIds(new Set());
  };

  const addMemoryRow = () => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    onMemoryAdd({ user: "User", content: "New long-term memory entry.", time: now, score: 0.5 });
    setMemoryEditorOpen(true);
  };

  const updateMemoryContent = (id, content) => onMemoryUpdate(id, content);

  const handleSaveSettings = () => {
    const ok = onSaveSettings();
    if (ok) {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    }
  };

  const handleClearLogs = () => {
    onClearLogs();
    setLogEntries([]);
  };

  return (
    <div className={`h-screen w-full flex flex-col overflow-hidden p-4 ${theme.app}`}>
      <div className={`mx-auto flex-1 w-full max-w-full min-w-0 overflow-hidden ${uiStyle.border} ${uiStyle.shell} ${theme.shell} shadow-2xl backdrop-blur ${accentGlow}`}>
        <div className="relative h-full min-w-0 overflow-hidden">
          {sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(false)} className={`absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center ${uiStyle.border} ${uiStyle.button} ${theme.input} text-sm shadow-lg transition hover:opacity-90`} title="Open sidebar" aria-label="Open sidebar">
              <span aria-hidden="true">→</span>
            </button>
          )}

          <div className="grid h-full min-w-0 transition-[grid-template-columns] duration-150" style={{ gridTemplateColumns: avatarPanelEnabled ? (sidebarCollapsed ? `0px ${chatRatio}fr 10px ${1 - chatRatio}fr` : `260px ${chatRatio}fr 10px ${1 - chatRatio}fr`) : (sidebarCollapsed ? "0px 1fr" : "260px 1fr") }}>
            <aside className={`overflow-hidden ${uiStyle.border} border-r ${theme.panel} transition-all duration-300 ${sidebarCollapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}>
              <div className="flex h-full flex-col p-4">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center bg-white/10 text-lg font-bold ${uiStyle.button}`}>AI</div>
                    <div>
                      <p className={`text-sm ${textSub}`}>Desktop App</p>
                      <h1 className={`text-lg font-semibold ${textMain} ${uiStyle.title}`}>Nova Bot</h1>
                    </div>
                  </div>
                  <button onClick={() => setSidebarCollapsed(true)} className={`px-3 py-2 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`} title="Hide sidebar" aria-label="Hide sidebar">
                    <span aria-hidden="true">←</span>
                  </button>
                </div>

                <button onClick={activeTab === "chat" ? onNewChat : undefined} className={`mb-4 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 ${uiStyle.button} bg-white`}>
                  {activeTab === "chat" ? "+ New Chat" : "Search Settings"}
                </button>

                {activeTab === "chat" && personas.length > 0 && (
                  <div className="mb-4">
                    <p className={`mb-2 px-1 text-[10px] font-bold uppercase tracking-widest ${textSub}`}>Active Persona</p>
                    <select 
                      value={settingValues["Active Persona ID"] || ""} 
                      onChange={(e) => onPersonaSwitch(e.target.value)}
                      className={`w-full truncate px-3 py-2 text-xs outline-none transition ${uiStyle.button} ${uiStyle.border} ${theme.input} ${uiStyle.title}`}
                    >
                      <option value="">Default AI (None)</option>
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${!isLightTheme ? "dark-scroll" : ""}`}>
                  {activeTab === "chat" ? (
                    <div className="flex h-full min-h-0 flex-col gap-4">
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                          {(Array.isArray(chats) ? chats : []).map((chat) => {
                            const c = typeof chat === "string" ? { id: chat, title: chat, messages: [] } : chat;
                            const isActive = c.id === activeChatId;
                            
                            // Extract unique persona names from assistant messages
                            const usedPersonas = Array.from(new Set((c.messages || [])
                              .filter(m => m.role === "assistant" && m.personaName)
                              .map(m => m.personaName)
                            ));

                            return (
                              <div key={c.id} className={`group flex flex-col gap-1 ${uiStyle.button}`}>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => onSelectChat(c.id)} className={`min-w-0 flex-1 px-4 py-3 text-left text-sm transition ${isActive ? (isLightTheme ? "bg-black/10 text-neutral-900" : "bg-white/12 text-white") : `${sidebarTextMuted} hover:bg-white/8 hover:text-inherit`} ${uiStyle.title}`}>
                                    <span className="block truncate">{c.title || "Untitled"}</span>
                                    {usedPersonas.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {usedPersonas.map(name => (
                                          <span key={name} className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${isActive ? (isLightTheme ? "bg-black/20 text-black" : "bg-white/20 text-white") : "bg-black/10 text-neutral-500"}`}>
                                            {name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); onDeleteChat(c.id); }} className={`shrink-0 px-2 py-2 text-xs opacity-0 transition hover:opacity-100 group-hover:opacity-70 ${isLightTheme ? "text-neutral-500 hover:text-red-600" : "text-white/50 hover:text-red-400"}`} title="Delete chat">×</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className={`p-4 ${uiStyle.border} ${uiStyle.panel} ${theme.bubble}`}>
                        <div className={`aspect-square w-full p-4 ${uiStyle.card} ${theme.input}`}>
                          <div className={`flex h-full flex-col justify-between p-4 ${uiStyle.card} ${isLightTheme ? "bg-black/[0.03]" : "bg-black/20"}`}>
                            <div>
                              <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>Screen Capture</p>
                              <p className={`mt-2 text-sm font-medium ${textMain}`}>Live Observation Slot</p>
                            </div>
                            <div className={`space-y-2 text-xs ${textSub}`}>
                              <div className="flex items-center justify-between"><span>Source</span><span>Desktop 1</span></div>
                              <div className="flex items-center justify-between"><span>Status</span><span>{screenCaptureEnabled ? "Watching" : "Idle"}</span></div>
                              <div className="flex items-center justify-between"><span>Mode</span><span>Window</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`px-2 text-xs uppercase tracking-[0.2em] ${textSub}`}>Settings Groups</p>
                      <div className="mt-4 space-y-2">
                        {settingSections.map((section) => (
                          <button key={section.id} onClick={() => setActiveSettingsSection(section.id)} className={`w-full px-4 py-4 text-left transition ${uiStyle.button} ${uiStyle.border} ${currentSection.id === section.id ? "bg-white text-black" : `${theme.bubble} ${textMain}`} ${uiStyle.title}`}>
                            <div className="text-sm font-medium">{section.label}</div>
                            <div className={`mt-1 text-xs ${currentSection.id === section.id ? "text-black/65" : textSub}`}>{section.description}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </aside>

            <main className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-b ${isLightTheme ? "from-black/[0.02] to-transparent" : "from-white/[0.03] to-transparent"}`}>
              <header className={`flex items-center justify-between border-b px-6 py-4 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                <div>
                  <p className={`text-sm ${textSub}`}>{activeTab === "chat" ? "Current workspace" : activeTab === "log" ? "Activity" : "System preferences"}</p>
                  <h2 className={`text-xl font-semibold ${textMain} ${uiStyle.title}`}>
                    {activeTab === "chat" ? (chats.find((c) => typeof c === "object" && c.id === activeChatId)?.title ?? chats[0]?.title ?? "General Assistant") : activeTab === "log" ? "Log" : `${currentSection.label} Settings`}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {["chat", "settings", "log"].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm transition ${uiStyle.border} ${uiStyle.button} ${activeTab === tab ? "bg-white text-black" : theme.input} ${uiStyle.title}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </header>

              {activeTab === "chat" && (
                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                  <div className={`flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-6 py-6 ${!isLightTheme ? "dark-scroll" : ""}`}>
                    {messages.map((msg, i) => (
                      <div key={i} className={`min-w-0 ${msg.role === "user" ? `ml-auto max-w-[85%] bg-white px-5 py-4 text-black ${uiStyle.card} ${currentStyle === "Gaming HUD" ? "border-2 border-white/70" : ""}` : `max-w-[85%] px-5 py-4 ${uiStyle.border} ${uiStyle.card} ${theme.bubble}`}`}>
                        <p className={`break-words text-sm ${msg.role === "user" ? "text-black" : textMain}`}>
                          {msg.content || (isLoading && i === messages.length - 1 ? "..." : "")}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className={`border-t p-5 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                    <div className={`flex items-end gap-3 p-3 ${uiStyle.border} ${uiStyle.card} ${theme.input}`}>
                      <div className="relative flex flex-1">
                        <textarea
                          ref={chatInputRef}
                          value={inputText}
                          onChange={(e) => onInputChange(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendMessage(); } }}
                          className={`min-h-[56px] flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none ${isLightTheme ? "text-neutral-800 placeholder:text-neutral-400" : "text-white/90 placeholder:text-white/35"}`}
                          placeholder="Message your AI bot..."
                        />
                        <ContextIndicator 
                          messages={messages} 
                          inputText={inputText} 
                          systemPrompt={settingValues["System Prompt"]} 
                          contextLimit={parseInt(settingValues["Context Window"] || "32768", 10)} 
                          maxOutputTokens={parseInt(settingValues["Max Output Tokens"] || "4096", 10)}
                          isLightTheme={isLightTheme}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={onSendMessage} className={`bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 ${uiStyle.button} relative`}>
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                              {messageQueueCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] text-white">
                                  {messageQueueCount}
                                </span>
                              )}
                            </div>
                          ) : "Send"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="h-full min-h-0 p-6">
                  <div className={`flex h-full min-h-0 flex-col p-5 ${uiStyle.border} ${uiStyle.panel} ${theme.bubble}`}>
                    <div className={`flex items-start justify-between border-b pb-4 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                      <div>
                        <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>{currentSection.label}</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${textMain} ${uiStyle.title}`}>{currentSection.label} Settings</h3>
                        <p className={`mt-2 max-w-2xl text-sm ${textSub}`}>{currentSection.description}</p>
                      </div>
                      <button onClick={handleSaveSettings} className={`px-4 py-2 text-sm font-medium transition ${uiStyle.border} ${uiStyle.button} ${settingsSaved ? "bg-green-500/20 text-green-400" : "bg-white text-black hover:opacity-90"}`}>
                        {settingsSaved ? "Saved!" : "Save"}
                      </button>
                    </div>
                    <div className={`mt-5 min-h-0 flex-1 overflow-y-auto pr-1 ${!isLightTheme ? "dark-scroll" : ""}`}>
                      <div className="space-y-3 pb-6">
                        {currentSection.items.map((item) => (
                          <SettingRow
                            key={item.name}
                            item={item}
                            currentValue={settingValues[item.name] ?? item.value}
                            onAction={() => {
                              if (item.name === "Edit Long-Term Memory") {
                                onOpenMemoryEditor();
                                setMemoryEditorOpen(true);
                              }
                              if (item.name === "Screen Capture Settings") setScreenCaptureSettingsOpen(true);
                              if (item.name === "System Prompt") setSystemPromptEditorOpen(true);
                            }}
                            onValueChange={(v) => handleSettingChange(item.name, v)}
                            inputBg={theme.input}
                            cardBg={theme.bubble}
                            textMain={textMain}
                            textSub={textSub}
                            radiusClass={uiStyle.button}
                            borderClass={uiStyle.border}
                            titleClass={uiStyle.title}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "log" && (
                <div className="flex h-full min-h-0 flex-col p-6">
                  <div className={`flex h-full min-h-0 flex-col p-5 ${uiStyle.border} ${uiStyle.panel} ${theme.bubble}`}>
                    <div className={`flex items-center justify-between border-b pb-4 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                      <div>
                        <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>Activity</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${textMain} ${uiStyle.title}`}>LM Studio / App Log</h3>
                        <p className={`mt-2 text-sm ${textSub}`}>Requests, responses, and errors</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => onGetLogs().then(setLogEntries)} className={`px-4 py-2 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} bg-white text-black`}>
                          Refresh
                        </button>
                        <button onClick={handleClearLogs} className={`px-4 py-2 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}>
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className={`mt-4 min-h-0 flex-1 overflow-auto font-mono text-xs ${isLightTheme ? "text-neutral-700" : "text-white/80"}`}>
                      {!hasElectronAPI ? (
                        <p className={textSub}>Electron API not available.</p>
                      ) : logEntries.length === 0 ? (
                        <p className={textSub}>No logs yet. Send a message to generate activity.</p>
                      ) : (
                        <div className="space-y-1">
                          {[...logEntries].reverse().map((e, i) => (
                            <div key={i} className={`flex gap-3 ${e.level === "error" ? "text-red-400" : e.level === "warn" ? "text-amber-400" : ""}`}>
                              <span className="shrink-0 opacity-70">[{e.time}]</span>
                              <span className="shrink-0 font-semibold">{e.message}</span>
                              <span>{e.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>

            {avatarPanelEnabled && <div onMouseDown={handleResizeStart} className="cursor-col-resize bg-white/[0.04] transition hover:bg-white/[0.14]" title="Resize avatar panel" />}

            {avatarPanelEnabled && <aside className={`flex min-h-0 flex-col border-l p-5 ${theme.panel} ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
              <div className={`p-5 shadow-[0_0_40px_rgba(255,255,255,0.03)] ${uiStyle.border} ${uiStyle.panel} ${theme.bubble}`}>
                <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>Bot Profile</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className={`h-16 w-16 bg-gradient-to-br from-white/30 to-white/5 ${uiStyle.button}`} />
                  <div>
                    <h3 className={`text-lg font-semibold ${textMain} ${uiStyle.title}`}>Nova</h3>
                    <p className={`text-sm ${textSub}`}>Smart desktop assistant</p>
                  </div>
                </div>
              </div>
              <div className={`mt-5 flex-1 bg-gradient-to-b p-5 ${uiStyle.border} ${uiStyle.panel} ${theme.avatar}`}>
                <div className={`relative flex h-full min-h-[420px] items-center justify-center overflow-hidden ${uiStyle.border} ${uiStyle.panel} ${isLightTheme ? "border-black/10 bg-white/40" : "border-white/8 bg-gradient-to-b from-white/[0.06] to-black/10"}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(34,211,238,0.14),_transparent_30%)]" />
                  <div className={`relative h-[78%] w-[78%] ${uiStyle.border} ${uiStyle.card} ${isLightTheme ? "border-black/10 bg-black/[0.02]" : "border-white/10 bg-black/10"}`} />
                </div>
              </div>
            </aside>}
          </div>

          {screenCaptureSettingsOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
              <div className={`flex h-[72vh] w-full max-w-4xl flex-col overflow-hidden ${uiStyle.border} ${uiStyle.shell} ${theme.shell} shadow-2xl`}>
                <div className={`flex items-center justify-between border-b px-6 py-5 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>Tool Settings</p>
                    <h3 className={`mt-2 text-2xl font-semibold ${textMain} ${uiStyle.title}`}>Screen Capture Settings</h3>
                  </div>
                  <button onClick={() => setScreenCaptureSettingsOpen(false)} className={`px-4 py-2 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}>Close</button>
                </div>
                <div className={`min-h-0 flex-1 overflow-y-auto p-6 ${!isLightTheme ? "dark-scroll" : ""}`}>
                  <p className={textSub}>Screen capture coming soon.</p>
                </div>
              </div>
            </div>
          )}

          {systemPromptEditorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: isLightTheme ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.85)" }} onClick={(e) => e.target === e.currentTarget && setSystemPromptEditorOpen(false)}>
              <div className={`flex h-[min(96vh,960px)] w-[min(98vw,1100px)] flex-col overflow-hidden rounded-2xl border shadow-2xl ${isLightTheme ? "border-neutral-200 bg-white" : "border-violet-500/30 bg-zinc-900"}`} onClick={(e) => e.stopPropagation()}>
                <div className={`flex shrink-0 items-center justify-between border-b px-6 py-4 ${isLightTheme ? "border-neutral-200 bg-neutral-50" : "border-zinc-700/50 bg-zinc-800/80"}`}>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wider ${isLightTheme ? "text-neutral-500" : "text-zinc-400"}`}>LLM</p>
                    <h3 className={`mt-1 text-lg font-semibold ${isLightTheme ? "text-neutral-900" : "text-white"}`}>System Prompt Library</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { handleSettingChange("System Prompt", systemPromptDraft); setSystemPromptEditorOpen(false); }} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500">Set as Active & Close</button>
                    <button onClick={() => setSystemPromptEditorOpen(false)} className={`rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 ${isLightTheme ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300" : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"}`}>Cancel</button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1">
                  {/* Left Sidebar: Library */}
                  <div className={`flex w-72 flex-col border-r ${isLightTheme ? "border-neutral-200 bg-neutral-50" : "border-zinc-700/50 bg-zinc-800/30"}`}>
                    <div className={`p-4 border-b ${isLightTheme ? "border-neutral-200" : "border-zinc-700/50"}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>System Presets</p>
                      <div className="mt-3 flex flex-col gap-1">
                        {["Default", "Coder", "Creative", "Assistant"].map((label) => {
                          const presets = { Default: "You are a helpful AI assistant.", Coder: "You are an expert programmer. Help with code, debugging, architecture, and technical questions. Be precise and include examples when useful.", Creative: "You are a creative assistant. Help with writing, stories, ideas, and brainstorming. Be imaginative and engaging.", Assistant: "You are a helpful desktop assistant. Be concise, practical, and focused on getting things done." };
                          return (
                            <button key={label} type="button" onClick={() => { setPromptNameDraft(""); setSystemPromptDraft(presets[label]); }} className={`truncate rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:opacity-90 ${isLightTheme ? "text-neutral-700 hover:bg-neutral-200/50" : "text-zinc-200 hover:bg-zinc-700/50"}`}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col p-4">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>Custom Prompts</p>
                      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
                        {customPrompts.length === 0 ? (
                          <p className={`text-xs italic ${textSub}`}>No custom prompts saved.</p>
                        ) : (
                          customPrompts.map((p) => (
                            <div key={p.id} className={`group flex items-center justify-between rounded-lg px-3 py-2 transition ${isLightTheme ? "hover:bg-neutral-200/50" : "hover:bg-zinc-700/50"}`}>
                              <button onClick={() => { setPromptNameDraft(p.name); setSystemPromptDraft(p.content); }} className={`truncate text-left text-sm font-medium ${textMain}`}>
                                {p.name}
                              </button>
                              <button onClick={() => deletePromptFromLibrary(p.id)} className={`text-xs opacity-0 transition group-hover:opacity-100 ${isLightTheme ? "text-red-500 hover:text-red-700" : "text-red-400 hover:text-red-300"}`} title="Delete">
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Content: Editor */}
                  <div className="flex min-h-0 flex-1 flex-col p-6">
                    <div className="mb-4 flex gap-3">
                      <input
                        value={promptNameDraft}
                        onChange={(e) => setPromptNameDraft(e.target.value)}
                        placeholder="Name this prompt (e.g., Code Reviewer)"
                        className={`flex-1 rounded-xl px-4 py-2 text-sm outline-none ${isLightTheme ? "border border-neutral-200 bg-neutral-50 text-neutral-800 placeholder:text-neutral-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400" : "border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"}`}
                      />
                      <button
                        onClick={savePromptToLibrary}
                        disabled={!systemPromptDraft.trim()}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${isLightTheme ? "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50" : "border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"}`}>
                        Save to Library
                      </button>
                    </div>
                    <textarea value={systemPromptDraft} onChange={(e) => setSystemPromptDraft(e.target.value)} placeholder="Enter system prompt instructions here..." className={`h-full w-full resize-none rounded-xl px-4 py-4 text-sm outline-none ${isLightTheme ? "border border-neutral-200 bg-neutral-50 text-neutral-800 placeholder:text-neutral-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400" : "border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"}`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {personaEditorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: isLightTheme ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.85)" }} onClick={(e) => e.target === e.currentTarget && setPersonaEditorOpen(false)}>
              <div className={`flex h-[min(96vh,960px)] w-[min(98vw,1100px)] flex-col overflow-hidden rounded-2xl border shadow-2xl ${isLightTheme ? "border-neutral-200 bg-white" : "border-violet-500/30 bg-zinc-900"}`} onClick={(e) => e.stopPropagation()}>
                <div className={`flex shrink-0 items-center justify-between border-b px-6 py-4 ${isLightTheme ? "border-neutral-200 bg-neutral-50" : "border-zinc-700/50 bg-zinc-800/80"}`}>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wider ${isLightTheme ? "text-neutral-500" : "text-zinc-400"}`}>Configuration</p>
                    <h3 className={`mt-1 text-lg font-semibold ${isLightTheme ? "text-neutral-900" : "text-white"}`}>Persona Manager</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => savePersonaToLibrary(true)} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90">Save & Use Now</button>
                    <button onClick={() => savePersonaToLibrary(false)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500">Save Persona</button>
                    <button onClick={() => setPersonaEditorOpen(false)} className={`rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 ${isLightTheme ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300" : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"}`}>Cancel</button>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1">
                  {/* Left Sidebar: Personas List */}
                  <div className={`flex w-72 flex-col border-r ${isLightTheme ? "border-neutral-200 bg-neutral-50" : "border-zinc-700/50 bg-zinc-800/30"}`}>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>Library</p>
                        <button 
                          onClick={() => setPersonaDraft({ name: "New Persona", prompt: "", model: settingValues["Model Name"], temperature: 0.7, topP: 0.95, maxTokens: 4096, contextWindow: parseInt(settingValues["Context Window"] || "32768", 10) })}
                          className={`text-[10px] font-bold uppercase text-violet-500 hover:text-violet-400`}
                        >
                          + Create
                        </button>
                      </div>
                      <div className={`mt-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1 ${!isLightTheme ? "dark-scroll" : ""}`}>
                        {personas.length === 0 ? (
                          <p className={`text-xs italic ${textSub}`}>No personas saved yet.</p>
                        ) : (
                          personas.map((p) => (
                            <div 
                              key={p.id} 
                              onClick={() => setPersonaDraft(p)}
                              className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition ${isLightTheme ? "hover:bg-neutral-200/50" : "hover:bg-zinc-700/50"} ${personaDraft.id === p.id ? (isLightTheme ? "bg-violet-100/70" : "bg-violet-900/30 ring-1 ring-violet-500/50") : ""}`}
                            >
                              <div className={`truncate text-sm font-medium ${personaDraft.id === p.id ? "text-violet-500" : textMain}`}>
                                {p.name}
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deletePersonaFromLibrary(p.id); }} 
                                className={`flex h-6 w-6 items-center justify-center rounded-md text-xs opacity-0 transition group-hover:opacity-100 ${isLightTheme ? "text-red-500 hover:bg-red-50" : "text-red-400 hover:bg-red-900/30"}`} 
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Content: Details Editor */}
                  <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto p-6 ${!isLightTheme ? "dark-scroll" : ""}`}>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2 space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Name</label>
                        <input
                          value={personaDraft.name}
                          onChange={(e) => setPersonaDraft(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Python Expert"
                          className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition ${isLightTheme ? "border border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-violet-400" : "border border-zinc-600 bg-zinc-800 text-zinc-100 focus:border-violet-500"}`}
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>System Prompt</label>
                        <textarea 
                          value={personaDraft.prompt} 
                          onChange={(e) => setPersonaDraft(prev => ({ ...prev, prompt: e.target.value }))} 
                          placeholder="Define the Persona's behavior and personality..." 
                          className={`h-48 w-full resize-none rounded-xl px-4 py-4 text-sm outline-none transition ${isLightTheme ? "border border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-violet-400" : "border border-zinc-600 bg-zinc-800 text-zinc-100 focus:border-violet-500"}`} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Preferred Model</label>
                        <select
                          value={personaDraft.model}
                          onChange={(e) => setPersonaDraft(prev => ({ ...prev, model: e.target.value }))}
                          className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition ${isLightTheme ? "border border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-violet-400" : "border border-zinc-600 bg-zinc-800 text-zinc-100 focus:border-violet-500"}`}
                        >
                          <option value="">Use Default Setting</option>
                          {availableModels.map(m => (
                            <option key={m.id || m} value={m.id || m}>{m.id || m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Temperature ({personaDraft.temperature})</label>
                        <input 
                          type="range" min="0" max="2" step="0.1"
                          value={personaDraft.temperature}
                          onChange={(e) => setPersonaDraft(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Top P ({personaDraft.topP})</label>
                        <input 
                          type="range" min="0" max="1" step="0.01"
                          value={personaDraft.topP}
                          onChange={(e) => setPersonaDraft(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Max Output Tokens</label>
                        <input
                          type="number"
                          value={personaDraft.maxTokens}
                          onChange={(e) => setPersonaDraft(prev => ({ ...prev, maxTokens: parseInt(e.target.value, 10) }))}
                          className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition ${isLightTheme ? "border border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-violet-400" : "border border-zinc-600 bg-zinc-800 text-zinc-100 focus:border-violet-500"}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Context Window</label>
                        <input
                          type="number"
                          value={personaDraft.contextWindow || 32768}
                          onChange={(e) => setPersonaDraft(prev => ({ ...prev, contextWindow: parseInt(e.target.value, 10) }))}
                          className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition ${isLightTheme ? "border border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-violet-400" : "border border-zinc-600 bg-zinc-800 text-zinc-100 focus:border-violet-500"}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {memoryEditorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: isLightTheme ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.85)" }} onClick={(e) => e.target === e.currentTarget && setMemoryEditorOpen(false)}>
              <div className={`flex h-[min(96vh,960px)] w-[min(98vw,1200px)] flex-col overflow-hidden rounded-2xl border shadow-2xl ${isLightTheme ? "border-neutral-200 bg-white" : "border-violet-500/30 bg-zinc-900"}`} onClick={(e) => e.stopPropagation()}>
                <div className={`flex shrink-0 items-center justify-between border-b px-6 py-4 ${isLightTheme ? "border-neutral-200 bg-neutral-50" : "border-zinc-700/50 bg-zinc-800/80"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isLightTheme ? "bg-violet-100 text-violet-600" : "bg-violet-500/20 text-violet-400"}`}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                    </div>
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-wider ${isLightTheme ? "text-neutral-500" : "text-zinc-400"}`}>Memory Database</p>
                      <h3 className={`text-lg font-semibold ${isLightTheme ? "text-neutral-900" : "text-white"}`}>Long-Term Memory Editor</h3>
                    </div>
                  </div>
                  <button onClick={() => setMemoryEditorOpen(false)} className={`rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 ${isLightTheme ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300" : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"}`}>Close</button>
                </div>

                <div className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-4 ${isLightTheme ? "border-neutral-200 bg-white" : "border-zinc-700/50 bg-zinc-900"}`}>
                  <div className="flex items-center gap-2">
                    <input value={memorySearch} onChange={(e) => setMemorySearch(e.target.value)} placeholder="Search memory..." className={`w-44 rounded-lg px-3 py-2.5 text-sm outline-none ${isLightTheme ? "border border-neutral-300 bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-400" : "border border-zinc-600 bg-zinc-800 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"}`} />
                    <button onClick={toggleSelectAll} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition hover:opacity-90 ${isLightTheme ? "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50" : "border border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"}`}>
                      {filteredMemoryRows.length > 0 && filteredMemoryRows.every((r) => selectedMemoryIds.has(r.id)) ? "Unselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={addMemoryRow} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500">Add Memory</button>
                    <button onClick={deleteSelected} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition hover:opacity-90 ${isLightTheme ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" : "border border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-950/50"}`}>Delete Selected</button>
                  </div>
                </div>

                <div className={`min-h-0 flex-1 overflow-auto p-6 ${!isLightTheme ? "dark-scroll" : ""}`}>
                  <div className={`w-full overflow-x-auto rounded-xl border ${isLightTheme ? "border-neutral-200 bg-neutral-50" : "border-zinc-700/50 bg-zinc-800/50"}`}>
                    <table className="w-full min-w-[500px] border-collapse">
                      <thead>
                        <tr className={`text-left text-xs font-semibold uppercase tracking-wider ${isLightTheme ? "border-b border-neutral-200 bg-neutral-100 text-neutral-600" : "border-b border-zinc-700 bg-zinc-800/80 text-zinc-400"}`}>
                          <th className="w-12 px-4 py-3">Select</th>
                          <th className="w-24 px-4 py-3">User</th>
                          <th className="min-w-[220px] px-4 py-3">Memory Content</th>
                          <th className="w-28 px-4 py-3">Time</th>
                          <th className="w-20 px-4 py-3">Score</th>
                          <th className="w-24 px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMemoryRows.map((row) => (
                          <tr key={row.id} className={`transition ${isLightTheme ? "border-b border-neutral-100 hover:bg-neutral-50" : "border-b border-zinc-700/30 hover:bg-zinc-800/50"}`}>
                            <td className="px-4 py-3"><input type="checkbox" checked={selectedMemoryIds.has(row.id)} onChange={() => toggleRow(row.id)} className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500" /></td>
                            <td className={`px-4 py-3 text-sm font-medium ${isLightTheme ? "text-neutral-800" : "text-zinc-200"}`}>{row.user}</td>
                            <td className="px-4 py-3">
                              <textarea value={row.content} onChange={(e) => updateMemoryContent(row.id, e.target.value)} className={`min-h-[56px] w-full min-w-[200px] resize-none rounded-lg px-3 py-2 text-sm outline-none ${isLightTheme ? "border border-neutral-200 bg-white text-neutral-800 focus:border-violet-400 focus:ring-1 focus:ring-violet-400" : "border border-zinc-600 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"}`} />
                            </td>
                            <td className={`px-4 py-3 text-sm ${isLightTheme ? "text-neutral-500" : "text-zinc-400"}`}>{row.time}</td>
                            <td className={`px-4 py-3 text-sm font-medium ${isLightTheme ? "text-neutral-700" : "text-zinc-300"}`}>{(row.score ?? 0).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => onMemoryDelete(row.id)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition hover:opacity-90 ${isLightTheme ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-red-950/40 text-red-400 hover:bg-red-950/60"}`}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextIndicator({ messages, inputText, systemPrompt, contextLimit, maxOutputTokens = 0, isLightTheme }) {
  const totalChars = (systemPrompt || "").length + messages.reduce((acc, m) => acc + (m.content || "").length, 0) + (inputText || "").length;
  const estimatedTokens = Math.ceil(totalChars / 4);
  const safeLimit = Math.max(0, contextLimit - maxOutputTokens);
  const isClogged = safeLimit < 100; // Warning threshold: less than 100 tokens left for history
  const percentage = Math.min(100, Math.round((estimatedTokens / (safeLimit || 1)) * 100));
  
  // Circular progress params
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="group absolute bottom-3 right-3 flex items-center justify-center">
      {/* Tooltip on hover */}
      <div className={`absolute bottom-full mb-2 hidden w-48 rounded-lg p-2 text-center text-[10px] shadow-xl group-hover:block ${isLightTheme ? "bg-neutral-800 text-white" : "bg-white text-neutral-800"}`}>
        {isClogged ? (
          <p className="font-bold text-red-500">Configuration Error</p>
        ) : (
          <p className="font-bold">{estimatedTokens.toLocaleString()} / {safeLimit.toLocaleString()}</p>
        )}
        <p className="opacity-70 text-[8px]">tokens used (History)</p>
        <div className="mt-1 border-t border-white/10 pt-1 text-[8px] space-y-0.5">
          <div className="flex justify-between px-1"><span>Reserved for AI:</span><span>{maxOutputTokens.toLocaleString()}</span></div>
          <div className="flex justify-between px-1"><span>Context Window:</span><span>{contextLimit.toLocaleString()}</span></div>
        </div>
        {isClogged && <p className="mt-1 text-[7px] text-amber-500 leading-tight">History slot is too small! Lower "Max Output Tokens" or increase "Context Window".</p>}
        <div className={`absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent ${isLightTheme ? "border-t-neutral-800" : "border-t-white"}`}></div>
      </div>

      <div className="relative h-8 w-8 cursor-help">
        <svg className="h-full w-full rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={`${isLightTheme ? "text-black/5" : "text-white/5"}`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset }}
            className={`transition-all duration-500 ease-out ${isClogged || percentage > 90 ? "text-red-500" : percentage > 70 ? "text-amber-500" : "text-violet-500"}`}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${isLightTheme ? "text-neutral-500" : (isClogged ? "text-red-500" : "text-neutral-400")}`}>
          {isClogged ? "!!" : `${percentage}%`}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ item, currentValue, onAction, onValueChange, inputBg, cardBg, textMain, textSub, radiusClass, borderClass, titleClass }) {
  const isToggleOn = ["Enabled", "On", "Allowed", "Available"].includes(currentValue);

  return (
    <div className={`px-4 py-4 ${borderClass} ${radiusClass} ${cardBg}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm font-medium ${textMain} ${titleClass}`}>{item.name}</p>
          {item.hint && <p className={`mt-1 text-xs ${textSub}`}>{item.hint}</p>}
        </div>
        <div className={item.type === "prompt-trigger" ? "min-w-[200px] max-w-md" : "min-w-[240px]"}>
          {item.type === "select" && (
            <select 
              value={currentValue} 
              onChange={(e) => (item.onValueChange ? item.onValueChange(e.target.value) : onValueChange(e.target.value))} 
              className={`w-full px-3 py-2 text-sm outline-none ${borderClass} ${radiusClass} ${inputBg}`}
            >
              {(item.options ?? []).map((opt) => {
                const val = typeof opt === "object" ? opt[item.valueKey || "id"] : opt;
                const lab = typeof opt === "object" ? opt[item.labelKey || "name"] : opt;
                return <option key={val} value={val}>{lab}</option>;
              })}
            </select>
          )}
          {item.type === "input" && (
            <input 
              value={currentValue} 
              onChange={(e) => onValueChange(e.target.value)} 
              disabled={item.name === "Context Window" && item.provider === "LM Studio"}
              className={`w-full px-3 py-2 text-sm outline-none ${borderClass} ${radiusClass} ${inputBg} ${(item.name === "Context Window" && item.provider === "LM Studio") ? "opacity-30 cursor-not-allowed" : ""}`} 
            />
          )}
          {item.type === "prompt-trigger" && (
            <button 
              type="button" 
              onClick={item.disabled ? undefined : (item.onAction ?? onAction)} 
              disabled={item.disabled}
              className={`w-full truncate px-3 py-2.5 text-left text-sm transition ${item.disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"} ${borderClass} ${radiusClass} ${inputBg}`}
            >
              <span className="block truncate">{(currentValue || "").slice(0, 60)}{(currentValue || "").length > 60 ? "…" : ""}</span>
              <span className="mt-1 block text-xs opacity-70">{item.disabled ? "Managed by active Persona" : "Click to edit"}</span>
            </button>
          )}
          {item.type === "slider" && (
            <div className={`space-y-2 px-3 py-3 ${borderClass} ${radiusClass} ${inputBg}`}>
              <div className="flex items-center justify-between text-sm">
                <span>{currentValue}</span>
                <span className={textSub}>{item.min} - {item.max}</span>
              </div>
              <input type="range" min={item.min} max={item.max} step={item.name === "Avatar Panel Width" ? 1 : item.max === 1 || item.max === 2 ? 0.01 : 1} value={Number(currentValue)} onChange={(e) => onValueChange(e.target.value)} className="w-full" />
            </div>
          )}
          {item.type === "toggle" && (
            <button onClick={() => onValueChange(isToggleOn ? (currentValue === "Allowed" ? "Blocked" : "Off") : currentValue === "Blocked" ? "Allowed" : "On")} className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:opacity-90 ${borderClass} ${radiusClass} ${inputBg}`}>
              <span>{currentValue}</span>
              <span className={`h-3 w-3 rounded-full ${isToggleOn ? "bg-white" : "bg-white/20"}`} />
            </button>
          )}
          {item.type === "action" && (
            <button onClick={item.onAction ?? onAction} className={`w-full bg-white px-3 py-2 text-sm font-medium text-black transition hover:opacity-90 ${radiusClass}`}>
              {item.buttonLabel ?? "Open"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
