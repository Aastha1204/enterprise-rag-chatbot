import { useState, useRef, useEffect } from "react";
import Message from "./Message.jsx";

export default function ChatWindow({ session, onSend }) {

  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  const isStreaming = session.messages.some((m) => m.streaming);

  const handleSend = () => {
    if (!message.trim() || isStreaming) return;
    onSend(message);
    setMessage("");
  };

  return (
    <div className="chat-main">

      <div className="chat-header">
        <h1>Enterprise Knowledge Assistant 🤖</h1>
        <div className="scope-pill">
          {session.selectedDoc ? `📄 ${session.selectedDoc}` : "🗂️ All Documents"}
        </div>
      </div>

      <div className="messages">

        <div className="welcome-card">
          👋 Hello! Ask me anything about uploaded company documents.
        </div>

        {session.messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <div className="chat-input-row">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your question..."
            disabled={isStreaming}
          />
          <button className="send-btn" onClick={handleSend} disabled={isStreaming}>
            {isStreaming ? (
              <span className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </span>
            ) : "Send"}
          </button>
        </div>
      </div>

    </div>
  );
}
