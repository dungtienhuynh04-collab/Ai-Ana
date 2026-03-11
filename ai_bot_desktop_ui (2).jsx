import { useMemo, useState } from "react";

type SettingFieldType = "select" | "input" | "slider" | "toggle" | "action";

type SettingItem = {
  name: string;
  value: string;
  hint?: string;
  type: SettingFieldType;
  options?: string[];
  min?: number;
  max?: number;
  buttonLabel?: string;
};

type SettingSection = {
  id: string;
  label: string;
  description: string;
  items: SettingItem[];
};

type MemoryRecord = {
  id: number;
  user: string;
  content: string;
  time: string;
  score: number;
  selected?: boolean;
};

type MainTab = "chat" | "settings";
type SettingValues = Record<string, string>;

export default function AIBotDesktopUI() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("chat");
  const [activeSettingsSection, setActiveSettingsSection] = useState("general");
  const [rightPanelWidth, setRightPanelWidth] = useState(420);
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryEditorOpen, setMemoryEditorOpen] = useState(false);
  const [screenCaptureSettingsOpen, setScreenCaptureSettingsOpen] = useState(false);
  const [settingValues, setSettingValues] = useState<SettingValues>({
    "UI Language": "English",
    Theme: "Midnight Glass",
    "UI Style": "Rounded Modern",
    "Accent Color": "Violet",
    "Sidebar Style": "Panel",
    "Startup Page": "Last Session",
    Notifications: "On",
    "Compact Mode": "Off",
    "Avatar Panel Width": "420",
    Provider: "Local / Ollama",
    Endpoint: "http://localhost:11434",
    "Model Name": "qwen2.5-coder:latest",
    "Fallback Model": "llama3.1:8b",
    "Auto Connect": "Enabled",
    Temperature: "0.7",
    "Top P": "0.95",
    "Max Output Tokens": "4096",
    "Context Window": "32768",
    "System Prompt": "Custom",
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
  });

  const [memoryRows, setMemoryRows] = useState<MemoryRecord[]>([
    {
      id: 1,
      user: "Tien",
      content: "Prefers practical step-by-step guidance for Unity and AI workflows.",
      time: "2026-03-11 19:42",
      score: 0.92,
    },
    {
      id: 2,
      user: "Tien",
      content: "Uses local providers like Ollama and compares cloud AI coding tools.",
      time: "2026-03-11 18:05",
      score: 0.88,
    },
    {
      id: 3,
      user: "Tien",
      content: "Interested in avatar-based desktop AI assistant UI with a large visual panel.",
      time: "2026-03-10 22:17",
      score: 0.81,
    },
    {
      id: 4,
      user: "Tien",
      content: "Wants long-term memory records to be editable and reviewable before saving.",
      time: "2026-03-10 21:03",
      score: 0.95,
    },
  ]);

  const chats = [
    "General Assistant",
    "Code Helper",
    "Study Notes",
    "Creative Ideas",
    "Image Prompting",
  ];

  const settingSections: SettingSection[] = useMemo(
    () => [
      {
        id: "general",
        label: "General",
        description: "Core app preferences and interface behavior.",
        items: [
          {
            name: "UI Language",
            value: "English",
            hint: "Switch app language",
            type: "select",
            options: ["English", "Vietnamese"],
          },
          {
            name: "Theme",
            value: "Midnight Glass",
            hint: "Visual appearance preset",
            type: "select",
            options: [
              "Midnight Glass",
              "Pure Dark",
              "Soft Light",
              "Cyber Neon",
              "Soft Violet",
              "Ocean Blue",
            ],
          },
          {
            name: "UI Style",
            value: "Rounded Modern",
            hint: "Overall component style",
            type: "select",
            options: [
              "Rounded Modern",
              "Minimal Flat",
              "Dense Pro",
              "Floating Glass",
              "Gaming HUD",
              "Soft Card",
              "Luxury Panel",
            ],
          },
          {
            name: "Accent Color",
            value: "Violet",
            hint: "Primary highlight color",
            type: "select",
            options: ["White", "Violet", "Blue", "Cyan", "Green", "Orange", "Rose"],
          },
          {
            name: "Sidebar Style",
            value: "Panel",
            hint: "Navigation presentation",
            type: "select",
            options: ["Panel", "Floating", "Compact Rail", "Blur Strip"],
          },
          {
            name: "Startup Page",
            value: "Last Session",
            hint: "Open on launch",
            type: "select",
            options: ["Last Session", "Chat", "Settings"],
          },
          { name: "Notifications", value: "On", hint: "Desktop alerts", type: "toggle" },
          { name: "Compact Mode", value: "Off", hint: "Dense layout", type: "toggle" },
          {
            name: "Avatar Panel Width",
            value: String(rightPanelWidth),
            hint: "Resize visual area",
            type: "slider",
            min: 280,
            max: 680,
          },
        ],
      },
      {
        id: "provider",
        label: "Provider",
        description: "Connect cloud or local inference backends.",
        items: [
          {
            name: "Provider",
            value: "Local / Ollama",
            hint: "Choose runtime source",
            type: "select",
            options: ["Local / Ollama", "LM Studio", "OpenAI API", "Anthropic API"],
          },
          { name: "Endpoint", value: "http://localhost:11434", hint: "Local server URL", type: "input" },
          {
            name: "Model Name",
            value: "qwen2.5-coder:latest",
            hint: "Primary model",
            type: "select",
            options: ["qwen2.5-coder:latest", "llama3.1:8b", "deepseek-coder", "gemma3:12b"],
          },
          {
            name: "Fallback Model",
            value: "llama3.1:8b",
            hint: "Used when primary fails",
            type: "select",
            options: ["None", "llama3.1:8b", "qwen2.5:7b", "gemma3:12b"],
          },
          { name: "Auto Connect", value: "Enabled", hint: "Reconnect on app launch", type: "toggle" },
        ],
      },
      {
        id: "llm",
        label: "LLM",
        description: "Tune generation, context, and reasoning behavior.",
        items: [
          { name: "Temperature", value: "0.7", hint: "Creativity level", type: "slider", min: 0, max: 2 },
          { name: "Top P", value: "0.95", hint: "Probability mass", type: "slider", min: 0, max: 1 },
          { name: "Max Output Tokens", value: "4096", hint: "Response limit", type: "input" },
          { name: "Context Window", value: "32768", hint: "Conversation memory size", type: "input" },
          {
            name: "System Prompt",
            value: "Custom",
            hint: "Assistant persona",
            type: "select",
            options: ["Default", "Custom", "Coder", "Creative", "Assistant"],
          },
          { name: "Streaming", value: "Enabled", hint: "Render tokens live", type: "toggle" },
        ],
      },
      {
        id: "stt",
        label: "STT",
        description: "Speech-to-text input configuration.",
        items: [
          {
            name: "STT Provider",
            value: "Local / Whisper",
            hint: "Speech recognition backend",
            type: "select",
            options: ["Local / Whisper", "OpenAI API", "Deepgram API", "Azure Speech"],
          },
          {
            name: "STT Model",
            value: "faster-whisper-large-v3",
            hint: "Transcription model",
            type: "select",
            options: ["faster-whisper-small", "faster-whisper-medium", "faster-whisper-large-v3", "gpt-4o-mini-transcribe"],
          },
          {
            name: "STT Language",
            value: "Auto Detect",
            hint: "Recognition language",
            type: "select",
            options: ["Auto Detect", "English", "Vietnamese", "Dutch", "Japanese"],
          },
          {
            name: "Microphone Device",
            value: "Default Input",
            hint: "Audio input source",
            type: "select",
            options: ["Default Input", "Headset Mic", "USB Microphone", "Virtual Cable"],
          },
          { name: "Push To Talk", value: "On", hint: "Manual voice activation", type: "toggle" },
          { name: "API Endpoint", value: "http://localhost:8000/stt", hint: "Optional custom endpoint", type: "input" },
        ],
      },
      {
        id: "tts",
        label: "TTS",
        description: "Text-to-speech voice output configuration.",
        items: [
          {
            name: "TTS Provider",
            value: "Local / Kokoro",
            hint: "Speech synthesis backend",
            type: "select",
            options: ["Local / Kokoro", "XTTS v2", "OpenAI API", "ElevenLabs API"],
          },
          {
            name: "TTS Model",
            value: "kokoro-en-v1",
            hint: "Voice generation model",
            type: "select",
            options: ["kokoro-en-v1", "xtts-v2", "gpt-4o-mini-tts", "eleven_turbo_v2"],
          },
          {
            name: "Voice",
            value: "Nova",
            hint: "Voice preset",
            type: "select",
            options: ["Nova", "Alloy", "Echo", "Luna", "Custom Clone"],
          },
          {
            name: "TTS Language",
            value: "English",
            hint: "Output language",
            type: "select",
            options: ["English", "Vietnamese", "Dutch", "Japanese"],
          },
          { name: "Speech Speed", value: "1.0", hint: "Playback rate", type: "slider", min: 0.5, max: 2 },
          { name: "API Endpoint", value: "http://localhost:8001/tts", hint: "Optional custom endpoint", type: "input" },
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
          {
            name: "Memory Provider",
            value: "Local Vector Store",
            hint: "Storage backend",
            type: "select",
            options: ["Local Vector Store", "Supabase", "Pinecone", "SQLite"],
          },
          {
            name: "Auto Save Memories",
            value: "Review First",
            hint: "Approval mode",
            type: "select",
            options: ["Off", "Always", "Review First"],
          },
          {
            name: "Memory Retrieval",
            value: "Balanced",
            hint: "Recall aggressiveness",
            type: "select",
            options: ["Precise", "Balanced", "Aggressive"],
          },
          {
            name: "Edit Long-Term Memory",
            value: "Open memory database",
            hint: "Review saved memory records",
            type: "action",
            buttonLabel: "Edit Memory",
          },
        ],
      },
      {
        id: "tools",
        label: "Tools",
        description: "Control file access, search, and tool calling.",
        items: [
          { name: "Tool Calling", value: "Allowed", hint: "Enable tool use", type: "toggle" },
          {
            name: "Local Files",
            value: "Ask First",
            hint: "Permission mode",
            type: "select",
            options: ["Off", "Ask First", "Always Allow"],
          },
          { name: "Web Search", value: "Enabled", hint: "Online lookup", type: "toggle" },
          { name: "Code Execution", value: "Enabled", hint: "Runtime access", type: "toggle" },
          { name: "Screen Capture", value: "Off", hint: "Allow assistant screen observation", type: "toggle" },
          {
            name: "Screen Capture Settings",
            value: "Open detailed capture controls",
            hint: "Provider, mode, target, and frame rate",
            type: "action",
            buttonLabel: "Open Capture Settings",
          },
          { name: "Image Generation", value: "Available", hint: "Visual generation tools", type: "toggle" },
        ],
      },
    ],
    [rightPanelWidth]
  );

  const currentSection =
    settingSections.find((section) => section.id === activeSettingsSection) ?? settingSections[0];

  const filteredMemoryRows = memoryRows.filter((row) => {
    const q = memorySearch.toLowerCase();
    return (
      row.user.toLowerCase().includes(q) ||
      row.content.toLowerCase().includes(q) ||
      row.time.toLowerCase().includes(q)
    );
  });

  const selectedCount = memoryRows.filter((row) => row.selected).length;
  const currentTheme = settingValues.Theme ?? "Midnight Glass";
  const currentStyle = settingValues["UI Style"] ?? "Rounded Modern";
  const currentAccent = settingValues["Accent Color"] ?? "Violet";
  const screenCaptureEnabled = settingValues["Screen Capture"] === "On";
  const isLightTheme = currentTheme === "Soft Light";

  const themeMap: Record<string, { app: string; shell: string; panel: string; bubble: string; input: string; avatar: string }> = {
    "Midnight Glass": {
      app: "bg-neutral-950 text-white",
      shell: "border-white/10 bg-white/5",
      panel: "bg-black/20 border-white/10",
      bubble: "bg-white/[0.04] border-white/10",
      input: "bg-black/20 border-white/10 text-white/80",
      avatar: "from-violet-500/[0.08] via-cyan-400/[0.04] to-transparent",
    },
    "Pure Dark": {
      app: "bg-black text-white",
      shell: "border-white/10 bg-black",
      panel: "bg-neutral-950 border-white/10",
      bubble: "bg-neutral-900 border-white/10",
      input: "bg-neutral-950 border-white/10 text-white/80",
      avatar: "from-white/[0.03] via-transparent to-transparent",
    },
    "Soft Light": {
      app: "bg-stone-200 text-neutral-900",
      shell: "border-black/10 bg-stone-100",
      panel: "bg-stone-50 border-black/10",
      bubble: "bg-white border-black/10",
      input: "bg-white border-black/10 text-neutral-800",
      avatar: "from-stone-300/30 via-white/40 to-stone-100/20",
    },
    "Cyber Neon": {
      app: "bg-slate-950 text-cyan-50",
      shell: "border-cyan-400/20 bg-slate-950",
      panel: "bg-slate-900 border-cyan-400/20",
      bubble: "bg-slate-900 border-cyan-400/20",
      input: "bg-slate-950 border-cyan-400/20 text-cyan-50",
      avatar: "from-cyan-400/[0.16] via-fuchsia-500/[0.09] to-transparent",
    },
    "Soft Violet": {
      app: "bg-[#171325] text-violet-50",
      shell: "border-violet-300/10 bg-[#1b1730]",
      panel: "bg-[#221c3b] border-violet-200/10",
      bubble: "bg-[#261f45] border-violet-200/10",
      input: "bg-[#201a38] border-violet-200/10 text-violet-50",
      avatar: "from-violet-400/[0.16] via-pink-300/[0.06] to-transparent",
    },
    "Ocean Blue": {
      app: "bg-[#071826] text-sky-50",
      shell: "border-sky-300/10 bg-[#0a2031]",
      panel: "bg-[#0e2940] border-sky-200/10",
      bubble: "bg-[#12304b] border-sky-200/10",
      input: "bg-[#0b2438] border-sky-200/10 text-sky-50",
      avatar: "from-sky-400/[0.14] via-cyan-300/[0.07] to-transparent",
    },
  };

  const styleMap: Record<string, { shell: string; panel: string; button: string; card: string; border: string; title: string }> = {
    "Rounded Modern": {
      shell: "rounded-[28px]",
      panel: "rounded-[28px]",
      button: "rounded-2xl",
      card: "rounded-[24px]",
      border: "border",
      title: "",
    },
    "Minimal Flat": {
      shell: "rounded-[10px]",
      panel: "rounded-[10px]",
      button: "rounded-md",
      card: "rounded-lg",
      border: "border",
      title: "",
    },
    "Dense Pro": {
      shell: "rounded-[14px]",
      panel: "rounded-[14px]",
      button: "rounded-lg",
      card: "rounded-xl",
      border: "border",
      title: "tracking-tight",
    },
    "Floating Glass": {
      shell: "rounded-[34px]",
      panel: "rounded-[32px]",
      button: "rounded-[22px]",
      card: "rounded-[28px]",
      border: "border",
      title: "",
    },
    "Gaming HUD": {
      shell: "rounded-[6px]",
      panel: "rounded-[6px]",
      button: "rounded-none",
      card: "rounded-[4px]",
      border: "border-2",
      title: "uppercase tracking-[0.12em] font-mono",
    },
    "Soft Card": {
      shell: "rounded-[24px]",
      panel: "rounded-[26px]",
      button: "rounded-[20px]",
      card: "rounded-[22px]",
      border: "border",
      title: "",
    },
    "Luxury Panel": {
      shell: "rounded-[18px]",
      panel: "rounded-[16px]",
      button: "rounded-[10px]",
      card: "rounded-[12px]",
      border: "border",
      title: "tracking-[0.03em]",
    },
  };

  const accentMap: Record<string, string> = {
    White: "shadow-[0_0_28px_rgba(255,255,255,0.08)]",
    Violet: "shadow-[0_0_28px_rgba(139,92,246,0.18)]",
    Blue: "shadow-[0_0_28px_rgba(59,130,246,0.18)]",
    Cyan: "shadow-[0_0_28px_rgba(34,211,238,0.18)]",
    Green: "shadow-[0_0_28px_rgba(34,197,94,0.18)]",
    Orange: "shadow-[0_0_28px_rgba(249,115,22,0.18)]",
    Rose: "shadow-[0_0_28px_rgba(244,63,94,0.18)]",
  };

  const theme = themeMap[currentTheme] ?? themeMap["Midnight Glass"];
  const uiStyle = styleMap[currentStyle] ?? styleMap["Rounded Modern"];
  const accentGlow = accentMap[currentAccent] ?? accentMap.Violet;

  const textMain = isLightTheme ? "text-neutral-900" : "text-white";
  const textSub = isLightTheme ? "text-neutral-500" : "text-white/45";
  const sidebarTextMuted = isLightTheme ? "text-neutral-600" : "text-white/65";

  const handleSettingChange = (name: string, value: string) => {
    setSettingValues((prev) => ({ ...prev, [name]: value }));
    if (name === "Avatar Panel Width") {
      const width = Number(value);
      if (!Number.isNaN(width)) setRightPanelWidth(width);
    }
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const container = (event.currentTarget.parentElement as HTMLDivElement | null)?.getBoundingClientRect();
    if (!container) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(680, Math.max(280, container.right - moveEvent.clientX));
      setRightPanelWidth(nextWidth);
      setSettingValues((prev) => ({ ...prev, "Avatar Panel Width": String(nextWidth) }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const toggleSelectAll = () => {
    const shouldSelectAll = memoryRows.some((row) => !row.selected);
    setMemoryRows((rows) => rows.map((row) => ({ ...row, selected: shouldSelectAll })));
  };

  const toggleRow = (id: number) => {
    setMemoryRows((rows) => rows.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row)));
  };

  const deleteSelected = () => {
    setMemoryRows((rows) => rows.filter((row) => !row.selected));
  };

  const addMemoryRow = () => {
    const nextId = Math.max(0, ...memoryRows.map((row) => row.id)) + 1;
    setMemoryRows((rows) => [
      {
        id: nextId,
        user: "Tien",
        content: "New long-term memory entry.",
        time: "2026-03-11 22:00",
        score: 0.5,
      },
      ...rows,
    ]);
    setMemoryEditorOpen(true);
  };

  const updateMemoryContent = (id: number, content: string) => {
    setMemoryRows((rows) => rows.map((row) => (row.id === id ? { ...row, content } : row)));
  };

  return (
    <div className={`min-h-screen w-full p-6 ${theme.app}`}>
      <div className={`mx-auto h-[90vh] max-w-7xl overflow-hidden ${uiStyle.border} ${uiStyle.shell} ${theme.shell} shadow-2xl backdrop-blur ${accentGlow}`}>
        <div className="relative h-full">
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className={`absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center ${uiStyle.border} ${uiStyle.button} ${theme.input} text-sm shadow-lg transition hover:opacity-90`}
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <span aria-hidden="true">→</span>
            </button>
          )}

          <div
            className="grid h-full transition-[grid-template-columns] duration-150"
            style={{
              gridTemplateColumns: sidebarCollapsed
                ? `0px minmax(0,1fr) 10px ${rightPanelWidth}px`
                : `260px minmax(0,1fr) 10px ${rightPanelWidth}px`,
            }}
          >
            <aside className={`overflow-hidden ${uiStyle.border} border-r ${theme.panel} transition-all duration-300 ${sidebarCollapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}>
              <div className="flex h-full flex-col p-4">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center bg-white/10 text-lg font-bold ${uiStyle.button}`}>
                      AI
                    </div>
                    <div>
                      <p className={`text-sm ${textSub}`}>Desktop App</p>
                      <h1 className={`text-lg font-semibold ${textMain} ${uiStyle.title}`}>Nova Bot</h1>
                    </div>
                  </div>

                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className={`px-3 py-2 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}
                    title="Hide sidebar"
                    aria-label="Hide sidebar"
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                </div>

                <button className={`mb-5 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 ${uiStyle.button} bg-white`}>
                  {activeTab === "chat" ? "+ New Chat" : "Search Settings"}
                </button>

                <div className="min-h-0 flex-1 pr-1">
                  {activeTab === "chat" ? (
                    <div className="flex h-full min-h-0 flex-col gap-4">
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="space-y-2">
                          {chats.map((item, i) => (
                            <button
                              key={item}
                              className={`w-full px-4 py-3 text-left text-sm transition ${uiStyle.button} ${
                                i === 0
                                  ? isLightTheme
                                    ? "bg-black/10 text-neutral-900"
                                    : "bg-white/12 text-white"
                                  : `${sidebarTextMuted} hover:bg-white/8 hover:text-inherit`
                              } ${uiStyle.title}`}
                            >
                              {item}
                            </button>
                          ))}
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
                          <button
                            key={section.id}
                            onClick={() => setActiveSettingsSection(section.id)}
                            className={`w-full px-4 py-4 text-left transition ${uiStyle.button} ${uiStyle.border} ${
                              currentSection.id === section.id ? "bg-white text-black" : `${theme.bubble} ${textMain}`
                            } ${uiStyle.title}`}
                          >
                            <div className="text-sm font-medium">{section.label}</div>
                            <div className={`mt-1 text-xs ${currentSection.id === section.id ? "text-black/65" : textSub}`}>
                              {section.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </aside>

            <main className={`flex min-h-0 flex-col bg-gradient-to-b ${isLightTheme ? "from-black/[0.02] to-transparent" : "from-white/[0.03] to-transparent"}`}>
              <header className={`flex items-center justify-between border-b px-6 py-4 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                <div>
                  <p className={`text-sm ${textSub}`}>{activeTab === "chat" ? "Current workspace" : "System preferences"}</p>
                  <h2 className={`text-xl font-semibold ${textMain} ${uiStyle.title}`}>
                    {activeTab === "chat" ? "General Assistant" : `${currentSection.label} Settings`}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {(["chat", "settings"] as MainTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm transition ${uiStyle.border} ${uiStyle.button} ${
                        activeTab === tab ? "bg-white text-black" : theme.input
                      } ${uiStyle.title}`}
                    >
                      {tab === "chat" ? "Chat" : "Settings"}
                    </button>
                  ))}
                </div>
              </header>

              {activeTab === "chat" && (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                    <div className={`max-w-[75%] px-5 py-4 ${uiStyle.border} ${uiStyle.card} ${theme.bubble}`}>
                      <p className={`text-sm ${textMain}`}>
                        Hey! I’m your AI bot. I can help with writing, coding, planning, or just vibing through ideas.
                      </p>
                    </div>

                    <div className={`ml-auto max-w-[70%] bg-white px-5 py-4 text-black ${uiStyle.card} ${currentStyle === "Gaming HUD" ? "border-2 border-white/70" : ""}`}>
                      <p className="text-sm">Create a clean desktop UI concept for an AI bot app with a modern look.</p>
                    </div>

                    <div className={`max-w-[75%] px-5 py-4 ${uiStyle.border} ${uiStyle.card} ${theme.bubble}`}>
                      <p className={`text-sm ${textMain}`}>
                        Done. I’d suggest a three-panel layout: navigation on the left, chat in the center, and profile info with a large avatar stage on the right.
                      </p>
                    </div>
                  </div>

                  <div className={`border-t p-5 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                    <div className={`flex items-end gap-3 p-3 ${uiStyle.border} ${uiStyle.card} ${theme.input}`}>
                      <textarea
                        className={`min-h-[56px] flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none ${isLightTheme ? "text-neutral-800 placeholder:text-neutral-400" : "text-white/90 placeholder:text-white/35"}`}
                        placeholder="Message your AI bot..."
                      />
                      <button className={`bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 ${uiStyle.button}`}>
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="h-full min-h-0 p-6">
                  <div className={`flex h-full min-h-0 flex-col p-5 ${uiStyle.border} ${uiStyle.panel} ${theme.bubble}`}>
                    <div className={`border-b pb-4 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                      <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>{currentSection.label}</p>
                      <h3 className={`mt-2 text-2xl font-semibold ${textMain} ${uiStyle.title}`}>{currentSection.label} Settings</h3>
                      <p className={`mt-2 max-w-2xl text-sm ${textSub}`}>{currentSection.description}</p>
                    </div>

                    <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                      <div className="space-y-3 pb-6">
                        {currentSection.items.map((item) => (
                          <SettingRow
                            key={item.name}
                            item={item}
                            currentValue={settingValues[item.name] ?? item.value}
                            onAction={() => {
                              if (item.name === "Edit Long-Term Memory") setMemoryEditorOpen(true);
                              if (item.name === "Screen Capture Settings") setScreenCaptureSettingsOpen(true);
                            }}
                            onValueChange={(value) => handleSettingChange(item.name, value)}
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
            </main>

            <div
              onMouseDown={handleResizeStart}
              className="cursor-col-resize bg-white/[0.04] transition hover:bg-white/[0.14]"
              title="Resize avatar panel"
            />

            <aside className={`flex min-h-0 flex-col border-l p-5 ${theme.panel} ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
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
                  <div className="absolute inset-8 border border-dashed border-white/10 pointer-events-none" />
                  <div className={`relative h-[78%] w-[78%] ${uiStyle.border} ${uiStyle.card} ${isLightTheme ? "border-black/10 bg-black/[0.02]" : "border-white/10 bg-black/10"}`} />
                </div>
              </div>
            </aside>
          </div>

          {screenCaptureSettingsOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
              <div className={`flex h-[72vh] w-full max-w-4xl flex-col overflow-hidden ${uiStyle.border} ${uiStyle.shell} ${theme.shell} shadow-2xl`}>
                <div className={`flex items-center justify-between border-b px-6 py-5 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>Tool Settings</p>
                    <h3 className={`mt-2 text-2xl font-semibold ${textMain} ${uiStyle.title}`}>Screen Capture Settings</h3>
                  </div>
                  <button
                    onClick={() => setScreenCaptureSettingsOpen(false)}
                    className={`px-4 py-2 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}
                  >
                    Close
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {[
                      {
                        name: "Capture Provider",
                        value: "Local Desktop Capture",
                        hint: "Source for screen stream",
                        type: "select" as const,
                        options: ["Local Desktop Capture", "OBS Virtual Camera", "Browser Extension", "API Stream"],
                      },
                      {
                        name: "Capture Mode",
                        value: "Window",
                        hint: "Pick what to observe",
                        type: "select" as const,
                        options: ["Window", "Monitor", "Region"],
                      },
                      {
                        name: "Target Window",
                        value: "Primary App Window",
                        hint: "Observed source",
                        type: "select" as const,
                        options: ["Primary App Window", "Desktop 1", "Desktop 2", "Game Window"],
                      },
                      {
                        name: "Frame Rate",
                        value: "15",
                        hint: "Frames per second",
                        type: "slider" as const,
                        min: 1,
                        max: 30,
                      },
                      {
                        name: "Auto Observe Screen",
                        value: "Off",
                        hint: "Assistant watches live feed",
                        type: "toggle" as const,
                      },
                    ].map((item) => (
                      <SettingRow
                        key={item.name}
                        item={item}
                        currentValue={item.value}
                        onAction={() => {}}
                        onValueChange={() => {}}
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

          {memoryEditorOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
              <div className={`flex h-[78vh] w-full max-w-6xl flex-col overflow-hidden ${uiStyle.border} ${uiStyle.shell} ${theme.shell} shadow-2xl`}>
                <div className={`flex items-center justify-between border-b px-6 py-5 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.2em] ${textSub}`}>Memory Database</p>
                    <h3 className={`mt-2 text-2xl font-semibold ${textMain} ${uiStyle.title}`}>Long-Term Memory Editor</h3>
                  </div>
                  <button
                    onClick={() => setMemoryEditorOpen(false)}
                    className={`px-4 py-2 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}
                  >
                    Close
                  </button>
                </div>

                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4 ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                  <div className="flex items-center gap-3">
                    <input
                      value={memorySearch}
                      onChange={(e) => setMemorySearch(e.target.value)}
                      placeholder="Search memory..."
                      className={`w-[300px] px-4 py-3 text-sm outline-none ${uiStyle.border} ${uiStyle.button} ${theme.input}`}
                    />
                    <button
                      onClick={toggleSelectAll}
                      className={`px-4 py-3 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}
                    >
                      {selectedCount === memoryRows.length && memoryRows.length > 0 ? "Unselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={addMemoryRow} className={`bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 ${uiStyle.button}`}>
                      Add Memory
                    </button>
                    <button onClick={deleteSelected} className={`px-4 py-3 text-sm transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}>
                      Delete Selected
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-6">
                  <div className={`min-w-[980px] overflow-hidden ${uiStyle.border} ${uiStyle.panel} ${theme.bubble}`}>
                    <div className={`grid grid-cols-[52px_100px_minmax(420px,1fr)_160px_90px_90px] border-b px-4 py-4 text-xs uppercase tracking-[0.2em] ${textSub} ${isLightTheme ? "border-black/10" : "border-white/10"}`}>
                      <div>Select</div>
                      <div>User</div>
                      <div>Memory Content</div>
                      <div>Time</div>
                      <div>Score</div>
                      <div>Actions</div>
                    </div>

                    <div className="max-h-[52vh] overflow-auto">
                      {filteredMemoryRows.map((row) => (
                        <div key={row.id} className={`grid grid-cols-[52px_100px_minmax(420px,1fr)_160px_90px_90px] items-start gap-3 border-b px-4 py-4 ${isLightTheme ? "border-black/6" : "border-white/6"}`}>
                          <div>
                            <input type="checkbox" checked={!!row.selected} onChange={() => toggleRow(row.id)} className="mt-1 h-4 w-4" />
                          </div>
                          <div className={`text-sm ${textMain}`}>{row.user}</div>
                          <div>
                            <textarea
                              value={row.content}
                              onChange={(e) => updateMemoryContent(row.id, e.target.value)}
                              className={`min-h-[86px] w-full resize-none px-3 py-3 text-sm outline-none ${uiStyle.border} ${uiStyle.button} ${theme.input}`}
                            />
                          </div>
                          <div className={`text-sm ${textSub}`}>{row.time}</div>
                          <div className={`text-sm ${textMain}`}>{row.score.toFixed(2)}</div>
                          <div>
                            <button
                              onClick={() => setMemoryRows((rows) => rows.filter((item) => item.id !== row.id))}
                              className={`px-3 py-2 text-xs transition hover:opacity-90 ${uiStyle.border} ${uiStyle.button} ${theme.input}`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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

function SettingRow({
  item,
  currentValue,
  onAction,
  onValueChange,
  inputBg,
  cardBg,
  textMain,
  textSub,
  radiusClass,
  borderClass,
  titleClass,
}: {
  item: SettingItem;
  currentValue: string;
  onAction: () => void;
  onValueChange: (value: string) => void;
  inputBg: string;
  cardBg: string;
  textMain: string;
  textSub: string;
  radiusClass: string;
  borderClass: string;
  titleClass: string;
}) {
  const isToggleOn = ["Enabled", "On", "Allowed", "Available"].includes(currentValue);

  return (
    <div className={`px-4 py-4 ${borderClass} ${radiusClass} ${cardBg}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm font-medium ${textMain} ${titleClass}`}>{item.name}</p>
          {item.hint && <p className={`mt-1 text-xs ${textSub}`}>{item.hint}</p>}
        </div>

        <div className="min-w-[240px]">
          {item.type === "select" && (
            <select
              value={currentValue}
              onChange={(e) => onValueChange(e.target.value)}
              className={`w-full px-3 py-2 text-sm outline-none ${borderClass} ${radiusClass} ${inputBg}`}
            >
              {(item.options ?? []).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}

          {item.type === "input" && (
            <input
              value={currentValue}
              onChange={(e) => onValueChange(e.target.value)}
              className={`w-full px-3 py-2 text-sm outline-none ${borderClass} ${radiusClass} ${inputBg}`}
            />
          )}

          {item.type === "slider" && (
            <div className={`space-y-2 px-3 py-3 ${borderClass} ${radiusClass} ${inputBg}`}>
              <div className="flex items-center justify-between text-sm">
                <span>{currentValue}</span>
                <span className={textSub}>{item.min} - {item.max}</span>
              </div>
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.name === "Avatar Panel Width" ? 1 : item.max === 1 || item.max === 2 ? 0.01 : 1}
                value={Number(currentValue)}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {item.type === "toggle" && (
            <button
              onClick={() => onValueChange(isToggleOn ? (currentValue === "Allowed" ? "Blocked" : "Off") : currentValue === "Blocked" ? "Allowed" : "On")}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:opacity-90 ${borderClass} ${radiusClass} ${inputBg}`}
            >
              <span>{currentValue}</span>
              <span className={`h-3 w-3 rounded-full ${isToggleOn ? "bg-white" : "bg-white/20"}`} />
            </button>
          )}

          {item.type === "action" && (
            <button
              onClick={onAction}
              className={`w-full bg-white px-3 py-2 text-sm font-medium text-black transition hover:opacity-90 ${radiusClass}`}
            >
              {item.buttonLabel ?? "Open"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
