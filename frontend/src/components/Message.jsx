import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Message({ message }) {

  const [showCitations, setShowCitations] = useState(false);

  if (message.role === "user") {
    return (
      <div className="message-row user">
        <div className="bubble user">
          <div>{message.content}</div>
          <div className="bubble-time">{message.time}</div>
        </div>
      </div>
    );
  }

  const hasCitations = message.citations && message.citations.length > 0;

  return (
    <div className="message-row ai">
      <div className="bubble ai">

        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content || " "}
          </ReactMarkdown>
          {message.streaming && <span className="streaming-cursor"></span>}
        </div>

        {!message.streaming && (
          <div className="bubble-time">{message.time}</div>
        )}

        {!message.streaming && hasCitations && (
          <div className="citations">
            <div
              className="citations-label"
              onClick={() => setShowCitations((v) => !v)}
            >
              {showCitations ? "▾" : "▸"} 📄 {message.citations.length} source{message.citations.length > 1 ? "s" : ""}
            </div>

            {showCitations && message.citations.map((c, i) => (
              <div className="citation-card" key={i}>
                <div className="citation-source">
                  {c.source.replace(/^data\//, "")} · Page {c.page}
                </div>
                <div className="citation-snippet">{c.snippet}…</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
