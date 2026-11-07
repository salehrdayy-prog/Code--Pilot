import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ OPENAI_API_KEY در Environment Variables تنظیم نشده است");
  process.exit(1);
}

// ==========================================
// ⚙️ تنظیمات پایه
// ==========================================
// فعلاً به همه دامنه‌ها اجازه دسترسی می‌دیم تا تست‌ها بدون ارور CORS انجام بشن
app.use(cors()); 
app.use(express.json({ limit: "1mb" }));

// ==========================================
// 🚦 Rate Limit ساده (جلوگیری از اسپم)
// ==========================================
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

// ==========================================
// ❤️ Health Check (برای تست آنلاین بودن سرور)
// ==========================================
app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "Live", model: "gpt-4o-mini" });
});

// ==========================================
// 💬 مسیر اصلی چت
// ==========================================
app.post("/api/chat", async (req, res) => {
  if (!allow(req.ip)) {
    return res.status(429).json({ error: "خیلی سریع پیام می‌دهی، یک دقیقه صبر کن." });
  }

  const { message, history } = req.body || {};

  if (typeof message !== "string" || !message.trim() || message.length > 2000) {
    return res.status(400).json({ error: "پیام نامعتبر است (حداکثر 2000 کاراکتر)" });
  }

  // بررسی و مرتب‌سازی تاریخچه چت
  const safeHistory = Array.isArray(history)
    ? history
        .slice(-10) // فقط 10 پیام آخر برای صرفه‌جویی در توکن
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
        "تو «نابغه‌کد» هستی، یک دستیار برنامه‌نویسی فارسی‌زبان. کوتاه، دقیق و با مثال جواب بده. کدها را حتماً داخل بلوک کد (```) قرار بده.",
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
        max_tokens: 1000,
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
    res.status(500).json({ error: "خطای داخلی سرور" });
  }
});

// ==========================================
// 🚀 اجرای سرور
// ==========================================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 POST /api/chat  |  GET /health`);
});