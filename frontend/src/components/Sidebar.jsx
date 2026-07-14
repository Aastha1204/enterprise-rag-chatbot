import { useState } from "react";
import axios from "axios";

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  documents,
  selectedDoc,
  onSelectDoc,
  onDocumentsChanged,
}) {

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const doUpload = async (targetFile) => {
    if (!targetFile) return;

    const formData = new FormData();
    formData.append("file", targetFile);

    setUploading(true);

    try {
      const response = await axios.post("/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(response.data.message);
      onDocumentsChanged(targetFile.name);
      setFile(null);

    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      alert("Upload failed 😭");
    }

    setUploading(false);
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Delete "${filename}"?`)) return;

    try {
      const response = await axios.delete(`/documents/${encodeURIComponent(filename)}`);
      alert(response.data.message);
      onDocumentsChanged(null, filename);
    } catch (error) {
      console.log("DELETE ERROR:", error);
      alert("Delete failed 😭");
    }
  };

  return (
    <div className="sidebar">

      <div className="brand">
        <div className="brand-badge">🚀</div>
        Enterprise AI
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
      </button>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Chats</div>
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`session-item ${s.id === activeSessionId ? "active" : ""}`}
            onClick={() => onSwitchSession(s.id)}
          >
            <span className="session-title">💬 {s.title}</span>
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(s.id);
              }}
              title="Delete chat"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Upload Document</div>

        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) doUpload(dropped);
          }}
        >
          <p>📂 Drag & Drop PDF</p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <button
          className="upload-btn"
          disabled={!file || uploading}
          onClick={() => doUpload(file)}
        >
          {uploading ? "Uploading…" : "+ Upload PDF"}
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Documents</div>

        {documents.length === 0 ? (
          <div className="empty-hint">No PDFs uploaded yet.</div>
        ) : (
          <div className="doc-list">

            <div
              className={`doc-item ${selectedDoc === null ? "active" : ""}`}
              onClick={() => onSelectDoc(null)}
            >
              <div className="doc-info">
                <div className="doc-name">🗂️ All Documents</div>
              </div>
            </div>

            {documents.map((doc) => (
              <div
                key={doc.filename}
                className={`doc-item ${selectedDoc === doc.filename ? "active" : ""}`}
                onClick={() => onSelectDoc(doc.filename)}
              >
                <div className="doc-info">
                  <div className="doc-name">📄 {doc.filename}</div>
                  <div className="doc-meta">{doc.chunks} chunks · {formatSize(doc.size)}</div>
                </div>
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.filename);
                  }}
                  title="Delete document"
                >
                  ✕
                </button>
              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
}
