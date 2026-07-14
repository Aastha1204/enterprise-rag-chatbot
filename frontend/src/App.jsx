import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import "./App.css";

const STORAGE_KEY = "rag_chat_sessions_v1";

const currentTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const makeSession = () => ({
  id: newId(),
  title: "New Chat",
  messages: [],
  selectedDoc: null,
});

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.log("Failed to load sessions:", e);
  }
  return [makeSession()];
}

export default function App() {

  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0].id);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("/documents");
      setDocuments(res.data.documents);
    } catch (e) {
      console.log("Failed to fetch documents:", e);
    }
  };

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const updateSession = (sessionId, updater) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? updater(s) : s))
    );
  };

  const updateMessage = (sessionId, messageId, updater) => {
    updateSession(sessionId, (s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === messageId ? updater(m) : m
      ),
    }));
  };

  const handleNewChat = () => {
    const session = makeSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
  };

  const handleSwitchSession = (id) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      const next = remaining.length > 0 ? remaining : [makeSession()];
      if (id === activeSessionId) {
        setActiveSessionId(next[0].id);
      }
      return next;
    });
  };

  const handleSelectDoc = (filename) => {
    updateSession(activeSessionId, (s) => ({ ...s, selectedDoc: filename }));
  };

  const handleDocumentsChanged = (uploadedFilename, deletedFilename) => {
    fetchDocuments();

    if (uploadedFilename) {
      updateSession(activeSessionId, (s) => ({
        ...s,
        selectedDoc: uploadedFilename,
      }));
    }

    if (deletedFilename) {
      setSessions((prev) =>
        prev.map((s) =>
          s.selectedDoc === deletedFilename ? { ...s, selectedDoc: null } : s
        )
      );
    }
  };

  const handleSend = async (question) => {
    const sessionId = activeSessionId;
    const session = sessions.find((s) => s.id === sessionId);
    const selectedDoc = session.selectedDoc;

    const userMsgId = newId();
    const aiMsgId = newId();

    updateSession(sessionId, (s) => ({
      ...s,
      title:
        s.title === "New Chat"
          ? question.slice(0, 40) + (question.length > 40 ? "…" : "")
          : s.title,
      messages: [
        ...s.messages,
        { id: userMsgId, role: "user", content: question, time: currentTime() },
        {
          id: aiMsgId,
          role: "ai",
          content: "",
          time: currentTime(),
          citations: [],
          streaming: true,
        },
      ],
    }));

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, source: selectedDoc }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;

          const payload = JSON.parse(part.slice(6));

          if (payload.type === "citations") {
            updateMessage(sessionId, aiMsgId, (m) => ({
              ...m,
              citations: payload.citations,
            }));
          } else if (payload.type === "token") {
            updateMessage(sessionId, aiMsgId, (m) => ({
              ...m,
              content: m.content + payload.content,
            }));
          } else if (payload.type === "done") {
            updateMessage(sessionId, aiMsgId, (m) => ({
              ...m,
              streaming: false,
            }));
          } else if (payload.type === "error") {
            updateMessage(sessionId, aiMsgId, (m) => ({
              ...m,
              content: payload.message,
              streaming: false,
            }));
          }
        }
      }
    } catch (error) {
      console.log(error);
      updateMessage(sessionId, aiMsgId, (m) => ({
        ...m,
        content: "Backend crashed 😭",
        streaming: false,
      }));
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSwitchSession={handleSwitchSession}
        onDeleteSession={handleDeleteSession}
        documents={documents}
        selectedDoc={activeSession.selectedDoc}
        onSelectDoc={handleSelectDoc}
        onDocumentsChanged={handleDocumentsChanged}
      />
      <ChatWindow session={activeSession} onSend={handleSend} />
    </div>
  );
}
