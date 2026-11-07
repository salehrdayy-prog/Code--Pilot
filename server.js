import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ OPENAI_API_KEY در .env تنظیم نشده است");
  process.exit(1);
}

// دامنه‌های مجاز برای CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8080",
  // دامنه‌ی اصلی‌ات را اینجا اضافه کن، مثلاً:
  // "https://noboghecode.ir"
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("CORS blocked"));
  }
}));

app.use(express.json({ limit: "1mb" }));

// ================= Rate limit ساده =================
const hits = new Map();
function allow(ip) {
  const now = Date.now();
  const windowMs = 60_000; // 1 دقیقه
  const max = 20;          // حداکثر 20 پیام در دقیقه
  const d = hits.get(ip);
  if (!d || now > d.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (d.count >= max) return false;
  d.count++;
  return true;
}

// ================= Health check =================
app.get("/health", (_req, res) => {
  res.json({ ok: true, model: "gpt-4o-mini" });
});

// ================= چت =================
app.post("/api/chat", async (req, res) => {
  if (!allow(req.ip)) {
    return res.status(429).json({ error: "خیلی سریع پیام می‌دهی، یک دقیقه صبر کن." });
  }

  const { message, history } = req.body || {};

  if (typeof message !== "string" || !message.trim() || message.length > 2000) {
    return res.status(400).json({ error: "پیام نامعتبر است (حداکثر 2000 کاراکتر)" });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .slice(-10)
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
    : [];

  const messages = [
    {
      role: "system",
      content:
        "تو «نابغه‌کد» هستی، یک دستیار برنامه‌نویسی فارسی‌زبان. کوتاه، دقیق و با مثال جواب بده. کد را در بلوک کد بگذار.",
    },
    ...safeHistory,
    { role: "user", content: message },
  ];

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("OpenAI error:", r.status, err);
      return res.status(502).json({ error: "سرویس هوش مصنوعی پاسخ نداد" });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "پاسخ خالی از AI" });
    }

    res.json({ reply });
  } catch (e) {
    console.error("Server error:", e);
    res.status(500).json({ error: "خطای سرور" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 POST /api/chat  |  GET /health`);
});