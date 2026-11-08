import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error("❌ GROQ_API_KEY تنظیم نشده است");
  process.exit(1);
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "Live", provider: "Groq" });
});

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "پیام نامعتبر است" });
  }

  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
  const messages = [
    { role: "system", content: "تو «نابغه‌کد» هستی، یک دستیار برنامه‌نویسی فارسی‌زبان. کوتاه و دقیق جواب بده." },
    ...safeHistory,
    { role: "user", content: message },
  ];

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 👈 مدل پایدار و فعال Groq
        model: "openai/gpt-oss-120b", 
        messages,
        temperature: 0.7,
      }),
    });

    const data = await r.json();
    
    if (!r.ok) {
      console.error("Groq Error:", data);
      return res.status(r.status).json({ error: data.error?.message || "Groq Error" });
    }

    res.json({ reply: data.choices[0].message.content.trim() });
  } catch (e) {
    console.error("Server Error:", e);
    res.status(500).json({ error: "خطای داخلی سرور: " + e.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));