
import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";

export default function ShareModal({ song, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !song) return null;

  const handleCopyLink = () => {
    const text = `Listening to "${song.title}" by ${song.artist} on Sonari`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        style={{
          background: "#18181c",
          border: "1px solid #2d2d35",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "360px",
          padding: "24px",
          position: "relative",
          color: "#fff",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)"
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close share dialog"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#27272a",
            border: "none",
            color: "#a1a1aa",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <X size={18} />
        </button>

        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "16px",
            textAlign: "center"
          }}
        >
          Share Track
        </h3>

        {/* Branded Share Card Preview */}
        <div
          style={{
            background: "linear-gradient(145deg, #1e1b4b, #3b0764)",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            textAlign: "center",
            marginBottom: "20px"
          }}
        >
          <img
            src={song.image}
            alt={song.title}
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "12px",
              objectFit: "cover",
              margin: "0 auto 14px auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
            }}
          />

          <h4
            style={{
              fontSize: "16px",
              fontWeight: "700",
              margin: "0 0 4px 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {song.title}
          </h4>

          <p
            style={{
              fontSize: "13px",
              color: "#d8b4fe",
              margin: "0 0 14px 0"
            }}
          >
            {song.artist}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(0,0,0,0.4)",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: "600",
              letterSpacing: "1px",
              color: "#e9d5ff"
            }}
          >
            <span
              className="sonari-sparkle"
              aria-hidden="true"
              style={{ color: "#e9d5ff", fontSize: "12px" }}
            >
              ✦
            </span>
            SONARI MUSIC
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          style={{
            width: "100%",
            background: "#9333ea",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "12px",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "Copied to Clipboard!" : "Copy Share Link"}
        </button>
      </div>
    </div>
  );
}
