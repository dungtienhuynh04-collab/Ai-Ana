import { useEffect, useState, useCallback } from "react";
import AIBotDesktopUI from "./components/AIBotDesktopUI";
import { webApi } from "./api/webApi";

const DEFAULT_SETTINGS = {
  "UI Language": "English",
  Theme: "Midnight Glass",
  "UI Style": "Rounded Modern",
  "Accent Color": "Violet",
  "Sidebar Style": "Panel",
  "Startup Page": "Last Session",
  Notifications: "On",
  "Compact Mode": "Off",
  "Avatar Panel": "On",
  "Avatar Panel Width": "420",
  "Chat Ratio": "0.7",
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
};

const CHATS_KEY = "nova-chats";
const DEFAULT_CHAT = { id: "1", title: "General Assistant", messages: [{ role: "assistant", content: "Hey! I'm your AI bot. I can help with writing, coding, planning, or just vibing through ideas." }] };

function loadChats() {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((c, i) =>
          typeof c === "object" && c.id
            ? c
            : { id: String(Date.now() + i), title: typeof c === "string" ? c : "Chat", messages: [] }
        );
      }
    }
  } catch (_) {}
  return [DEFAULT_CHAT];
}

function saveChats(chats) {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (_) {}
}

const electronApi = typeof window !== "undefined" && window.electronAPI ? window.electronAPI : null;
const api = electronApi || webApi;

export default function App() {
  const [settingValues, setSettingValues] = useState(DEFAULT_SETTINGS);
  const [memoryRows, setMemoryRows] = useState([]);
  const [chats, setChats] = useState(loadChats);
  const [activeChatId, setActiveChatId] = useState(() => {
    const loaded = loadChats();
    return loaded[0]?.id ?? "1";
  });
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0];
  const messages = activeChat?.messages ?? [];

  // Load settings from backend
  useEffect(() => {
    api.settingsGetAll?.().then((s) => {
      if (s && Object.keys(s).length) setSettingValues((prev) => ({ ...prev, ...s }));
    }).catch(() => {});
  }, []);

  // Load memory from backend
  useEffect(() => {
    api.memoryGetAll?.().then((rows) => {
      if (rows?.length) setMemoryRows(rows.map((r) => ({ ...r, selected: false })));
    }).catch(() => {});
  }, []);

  const setMessages = useCallback(
    (updater) => {
      setChats((prev) => {
        const next = prev.map((c) =>
          c.id === activeChatId ? { ...c, messages: updater(c.messages ?? []) } : c
        );
        saveChats(next);
        return next;
      });
    },
    [activeChatId]
  );

  const handleNewChat = useCallback(() => {
    const id = String(Date.now());
    const newChat = { id, title: "New Chat", messages: [{ role: "assistant", content: "Hey! I'm your AI bot. How can I help?" }] };
    setChats((prev) => {
      const next = [newChat, ...prev];
      saveChats(next);
      return next;
    });
    setActiveChatId(id);
  }, []);

  const handleSelectChat = useCallback((id) => setActiveChatId(id), []);

  const handleDeleteChat = useCallback((id) => {
    let remaining = chats.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const newChat = { id: String(Date.now()), title: "New Chat", messages: [{ role: "assistant", content: "Hey! How can I help?" }] };
      remaining = [newChat];
    }
    setChats(remaining);
    saveChats(remaining);
    if (activeChatId === id) setActiveChatId(remaining[0].id);
  }, [chats, activeChatId]);

  const handleRenameChat = useCallback((id, title) => {
    setChats((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title } : c));
      saveChats(next);
      return next;
    });
  }, []);

  const handleSettingChange = useCallback(
    (name, value) => {
      setSettingValues((prev) => {
        const next = { ...prev, [name]: value };
        api.settingsSet?.(name, value).catch(() => {});
        return next;
      });
    },
    []
  );

  const handleSendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText("");
    const userMsg = { role: "user", content: text };
    const newMsgs = [...messages, userMsg, { role: "assistant", content: "" }];
    setChats((prev) => {
      const next = prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const title = c.title === "New Chat" ? text.slice(0, 32) + (text.length > 32 ? "…" : "") : c.title;
        return { ...c, messages: newMsgs, title };
      });
      saveChats(next);
      return next;
    });
    setIsLoading(true);

    const allMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    const chunkHandler = (chunk) => {
      setChats((prev) => {
        const next = prev.map((c) => {
          if (c.id !== activeChatId) return c;
          const m = c.messages ?? [];
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: (last.content || "") + chunk };
          return { ...c, messages: copy };
        });
        saveChats(next);
        return next;
      });
    };
    const doneHandler = () => {
      setIsLoading(false);
      electronApi?.removeChatListeners?.();
    };

    const llmOptions = {
      systemPrompt: settingValues["System Prompt"],
      temperature: settingValues["Temperature"],
      maxTokens: settingValues["Max Output Tokens"],
      topP: settingValues["Top P"],
      contextWindow: settingValues["Context Window"]
    };
    console.log("[DEBUG] Sending systemPrompt:", llmOptions.systemPrompt);

    if (electronApi?.chatStream) {
      electronApi.removeChatListeners?.();
      electronApi.onChatChunk?.(chunkHandler);
      electronApi.onChatDone?.(doneHandler);
      try {
        await electronApi.chatStream(allMessages, llmOptions);
      } catch (err) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: (last.content || "") + `\n[Error: ${err.message}]` };
          return copy;
        });
        setIsLoading(false);
        electronApi.removeChatListeners?.();
      }
    } else if (api.chatStream) {
      try {
        await api.chatStream(allMessages, llmOptions, chunkHandler, doneHandler);
      } catch (err) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: (last.content || "") + `\n[Error: ${err.message}]` };
          return copy;
        });
        setIsLoading(false);
      }
    } else {
      try {
        const res = await api.chat?.(allMessages, llmOptions) ?? "Backend not running. Run: npm run dev:web";
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: res };
          return copy;
        });
      } catch (err) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: `[Error: ${err.message}]` };
          return copy;
        });
      }
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, activeChatId, settingValues]);

  const handleMemoryAdd = useCallback((record) => {
    if (!api.memoryAdd) {
      const nextId = Math.max(0, ...memoryRows.map((r) => r.id || 0)) + 1;
      setMemoryRows((r) => [{ ...record, id: nextId }, ...r]);
      return;
    }
    api.memoryAdd(record).then((id) => {
      if (id) setMemoryRows((r) => [{ ...record, id }, ...r.map((x) => ({ ...x, selected: false }))]);
    }).catch(() => {
      const nextId = Math.max(0, ...memoryRows.map((r) => r.id || 0)) + 1;
      setMemoryRows((r) => [{ ...record, id: nextId }, ...r]);
    });
  }, [memoryRows]);

  const handleMemoryUpdate = useCallback((id, content) => {
    api?.memoryUpdate?.(id, content);
    setMemoryRows((r) => r.map((x) => (x.id === id ? { ...x, content } : x)));
  }, []);

  const handleMemoryDelete = useCallback((id) => {
    api?.memoryDelete?.(id);
    setMemoryRows((r) => r.filter((x) => x.id !== id));
  }, []);

  const handleMemoryDeleteMany = useCallback((ids) => {
    api?.memoryDeleteMany?.(ids);
    setMemoryRows((r) => r.filter((x) => !ids.includes(x.id)));
  }, []);

  const handleMemorySearch = useCallback((query) => {
    if (api?.memorySearch && query) {
      api.memorySearch(query).then((rows) => setMemoryRows(rows.map((r) => ({ ...r, selected: false }))));
    } else if (api?.memoryGetAll) {
      api.memoryGetAll().then((rows) => setMemoryRows(rows.map((r) => ({ ...r, selected: false }))));
    }
  }, []);

  const handleSaveSettings = useCallback(() => {
    if (api.settingsSetBulk) {
      api.settingsSetBulk(settingValues).then(() => {}).catch(() => {});
      return true;
    }
    return false;
  }, [settingValues]);

  const handleGetLogs = useCallback(() => api.logGetAll?.() ?? Promise.resolve([]), []);

  const handleClearLogs = useCallback(() => {
    api.logClear?.().catch(() => {});
  }, []);

  return (
    <AIBotDesktopUI
      hasElectronAPI={!!electronApi}
      hasWebAPI={!!(!electronApi && typeof window !== "undefined")}
      settingValues={settingValues}
      onSettingChange={handleSettingChange}
      memoryRows={memoryRows}
      onMemoryAdd={handleMemoryAdd}
      onMemoryUpdate={handleMemoryUpdate}
      onMemoryDelete={handleMemoryDelete}
      onMemoryDeleteMany={handleMemoryDeleteMany}
      onMemorySearch={handleMemorySearch}
      onSaveSettings={handleSaveSettings}
      onGetLogs={handleGetLogs}
      onClearLogs={handleClearLogs}
      messages={messages}
      inputText={inputText}
      onInputChange={setInputText}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      chats={chats}
      activeChatId={activeChatId}
      onNewChat={handleNewChat}
      onSelectChat={handleSelectChat}
      onDeleteChat={handleDeleteChat}
      onRenameChat={handleRenameChat}
    />
  );
}
