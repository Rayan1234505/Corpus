import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

export const Workspace = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
        setMessages(data.conversationHistory || []);
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = async (text: string) => {
    if (!text.trim()) return;

    setQuestion("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, id: Date.now().toString() },
    ]);
    setLoading(true);

    try {
      const res = await fetch(`/api/sessions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error communicating with agent.",
          id: Date.now().toString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk(question);
  };

  const requestSummary = () => {
    handleAsk("Please provide a detailed, structured summary of this paper.");
  };

  if (!session)
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#666",
        }}
      >
        <p style={{ fontSize: 18 }}>Loading workspace...</p>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#f9fafb",
      }}
    >
      {/* LEFT PANE: PDF Viewer */}
      <div
        style={{
          flex: 1,
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: "#111827",
                fontWeight: 600,
              }}
            >
              {session.paperMetadata.title || "Untitled Paper"}
            </h2>
          </div>
        </div>
        <div style={{ flex: 1, background: "#e5e7eb" }}>
          <iframe
            src={`/api/sessions/${session.id}/pdf`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="PDF Viewer"
          />
        </div>
      </div>

      {/* RIGHT PANE: Chat UI */}
      <div
        style={{
          width: 450,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          position: "relative",
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, color: "#374151" }}>Chat</h3>
          {messages.length === 0 && (
            <button
              onClick={requestSummary}
              style={{
                padding: "6px 12px",
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              ✨ Generate Summary
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            background: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#9ca3af",
                marginTop: "40px",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#4b5563",
                }}
              >
                Chat with your document
              </p>
              <p style={{ margin: "8px 0 20px", fontSize: 13 }}>
                Ask any question or get a quick summary.
              </p>
              <button
                onClick={requestSummary}
                style={{
                  padding: "10px 20px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                  fontWeight: 500,
                  boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                }}
              >
                Summarize Document
              </button>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "12px 16px",
                    borderRadius: isUser
                      ? "16px 16px 0 16px"
                      : "16px 16px 16px 0",
                    background: isUser ? "#3b82f6" : "#ffffff",
                    color: isUser ? "#ffffff" : "#1f2937",
                    border: isUser ? "none" : "1px solid #e5e7eb",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "16px 16px 16px 0",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  color: "#6b7280",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: "#9ca3af",
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: "#9ca3af",
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite 0.2s",
                  }}
                />
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: "#9ca3af",
                    borderRadius: "50%",
                    animation: "pulse 1.5s infinite 0.4s",
                  }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "20px",
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <form
            onSubmit={onSubmit}
            style={{ display: "flex", position: "relative" }}
          >
            <input
              style={{
                flex: 1,
                padding: "14px 48px 14px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: 24,
                fontSize: 14,
                outline: "none",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                background: "#f9fafb",
              }}
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              style={{
                position: "absolute",
                right: 6,
                top: 6,
                bottom: 6,
                width: 36,
                border: "none",
                borderRadius: "50%",
                background: question.trim() && !loading ? "#3b82f6" : "#e5e7eb",
                color: "white",
                cursor: question.trim() && !loading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              AI answers can make mistakes. Verify important info.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
