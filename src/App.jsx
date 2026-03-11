import { useEffect, useState, useCallback } from "react";
import AIBotDesktopUI from "./components/AIBotDesktopUI";

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
  "System Prompt": "Custom",
  Streaming: "Enabled",
};

const api = typeof window !== "undefined" && window.electronAPI ? window.electronAPI : null;

export default function App() {
  const [settingValues, setSettingValues] = useState(DEFAULT_SETTINGS);
  const [memoryRows, setMemoryRows] = useState([]);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm your AI bot. I can help with writing, coding, planning, or just vibing through ideas." },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState(["General Assistant"]);

  // Load settings from backend
  useEffect(() => {
    if (api?.settingsGetAll) {
      api.settingsGetAll().then((s) => {
        if (s && Object.keys(s).length) setSettingValues((prev) => ({ ...prev, ...s }));
      });
    }
  }, []);

  // Load memory from backend
  useEffect(() => {
    if (api?.memoryGetAll) {
      api.memoryGetAll().then((rows) => {
        if (rows?.length) setMemoryRows(rows.map((r) => ({ ...r, selected: false })));
      });
    }
  }, []);

  const handleSettingChange = useCallback(
    (name, value) => {
      setSettingValues((prev) => {
        const next = { ...prev, [name]: value };
        api?.settingsSet?.(name, value);
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
    setMessages((m) => [...m, userMsg]);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    setIsLoading(true);

    const allMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    if (api?.chatStream) {
      api.removeChatListeners?.();
      const chunkHandler = (chunk) => {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: (last.content || "") + chunk };
          }
          return copy;
        });
      };
      const doneHandler = () => {
        setIsLoading(false);
        api.removeChatListeners?.();
      };
      api.onChatChunk?.(chunkHandler);
      api.onChatDone?.(doneHandler);
      try {
        await api.chatStream(allMessages);
      } catch (err) {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: (last.content || "") + `\n[Error: ${err.message}]` };
          }
          return copy;
        });
        setIsLoading(false);
        api.removeChatListeners?.();
      }
    } else {
      try {
        const res = await api?.chat?.(allMessages) || "Electron API not available. Run with: npm run electron:dev";
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
  }, [inputText, isLoading, messages]);

  const handleMemoryAdd = useCallback(
    (record) => {
      if (api?.memoryAdd) {
        api.memoryAdd(record).then((id) => {
          if (id) setMemoryRows((r) => [{ ...record, id }, ...r.map((x) => ({ ...x, selected: false }))]);
        });
      } else {
        const nextId = Math.max(0, ...memoryRows.map((r) => r.id || 0)) + 1;
        setMemoryRows((r) => [{ ...record, id: nextId }, ...r]);
      }
    },
    [memoryRows]
  );

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

  return (
    <AIBotDesktopUI
      settingValues={settingValues}
      onSettingChange={handleSettingChange}
      memoryRows={memoryRows}
      onMemoryAdd={handleMemoryAdd}
      onMemoryUpdate={handleMemoryUpdate}
      onMemoryDelete={handleMemoryDelete}
      onMemoryDeleteMany={handleMemoryDeleteMany}
      onMemorySearch={handleMemorySearch}
      messages={messages}
      inputText={inputText}
      onInputChange={setInputText}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      chats={chats}
    />
  );
}
