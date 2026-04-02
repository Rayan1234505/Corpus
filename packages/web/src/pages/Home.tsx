import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      navigate(`/session/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to upload paper.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: "100%",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 48,
            letterSpacing: "-0.02em",
          }}
        >
          Corpus
        </h1>

        <div
          style={{
            background: "#ffffff",
            border: `2px dashed ${dragActive ? "#3b82f6" : "#e5e7eb"}`,
            borderRadius: 16,
            padding: "64px 20px",
            cursor: "pointer",
            transition: "all 0.2s",
            backgroundColor: dragActive ? "#eff6ff" : "#ffffff",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          {file ? (
            <div>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#111827",
                  margin: "0 0 8px",
                }}
              >
                {file.name}
              </p>
              <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px" }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={loading}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "12px 32px",
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                }}
              >
                {loading ? "Analyzing Document..." : "Start Chat"}
              </button>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#374151",
                  margin: "0 0 8px",
                }}
              >
                Click to upload or drag and drop
              </p>
              <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
                PDF files up to 50MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
