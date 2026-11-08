import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ OPENAI_API_KEY تنظیم نشده است");
  process.exit(1);
}

// 🟢 فعال‌سازی کامل CORS برای همه دامنه‌ها (حل مشکل GitHub Pages)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // پاسخ به درخواست‌های پیش‌پرواز (Preflight)

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "Live" });
});

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "پیام نامعتبر است" });
  }

  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
  const messages = [
    { role: "system", content: "تو نابغه‌کد هستی. کوتاه و دقیق جواب بده." },
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
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "OpenAI Error");

    res.json({ reply: data.choices[0].message.content.trim() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "خطای سرور هوش مصنوعی" });
  }
});

app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));