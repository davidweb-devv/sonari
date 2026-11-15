import { Bot } from "lucide-react";

export default function AiPage() {
  return (
    <main
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "16px",
        paddingBottom: "130px",
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 100px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "16px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #9333ea, #c084fc)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            className="sonari-sparkle"
            aria-hidden="true"
            style={{ color: "#fff", fontSize: "24px" }}
          >
            ✦
          </span>
        </div>

        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              margin: 0,
            }}
          >
            Sonari AI
          </h1>

          <p
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              margin: "2px 0 0",
            }}
          >
            Your personal music intelligence
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "36px 18px",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            width: "76px",
            height: "76px",
            borderRadius: "26px",
            background:
              "linear-gradient(145deg, rgba(147, 51, 234, 0.2), rgba(192, 132, 252, 0.08))",
            border: "1px solid rgba(192, 132, 252, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
          }}
        >
          <span
            className="sonari-sparkle"
            aria-hidden="true"
            style={{ fontSize: "38px" }}
          >
            ✦
          </span>
        </div>

        <div
          style={{
            padding: "7px 13px",
            borderRadius: "20px",
            background: "rgba(147, 51, 234, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.25)",
            color: "#c084fc",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.2px",
            marginBottom: "18px",
          }}
        >
          COMING SOON
        </div>

        <h2
          style={{
            fontSize: "30px",
            fontWeight: "700",
            lineHeight: "1.2",
            letterSpacing: "-0.8px",
            margin: "0 0 14px",
            maxWidth: "420px",
          }}
        >
          Music that gets
          <span style={{ color: "#c084fc" }}> you.</span>
        </h2>

        <p
          style={{
            color: "var(--muted)",
            fontSize: "14px",
            lineHeight: "1.7",
            maxWidth: "370px",
            margin: "0 0 30px",
          }}
        >
          We're building a more personal way to discover and experience
          music. An AI that learns what you want, instead of guessing.
        </p>

        <div
          style={{
            width: "100%",
            maxWidth: "360px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(147, 51, 234, 0.13)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c084fc",
              flexShrink: 0,
            }}
          >
            <Bot size={20} />
          </div>

          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                margin: "0 0 4px",
              }}
            >
              Something special is in the works
            </p>

            <p
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              Sonari AI isn't connected yet. We'll introduce it when it's
              ready.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}