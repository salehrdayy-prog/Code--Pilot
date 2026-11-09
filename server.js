import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY تنظیم نشده است");
  process.exit(1);
}

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, status: "Live" }));

app.post("/api/chat", async (req, res) => {
  const { message, history, codeContext } = req.body || {};

  if (!message) return res.status(400).json({ error: "پیام نامعتبر است" });

  const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
  
  // 👈 اگر کد ارسال شده بود، به پرامپت اضافه می‌شود
  let userContent = message;
  if (codeContext) {
      userContent = `${message}\n\n[اطلاعات محیط کاربر]\n${codeContext}`;
  }

  const SYSTEM_PROMPT = `تو «نابغه‌کد» هستی؛ یک دستیار برنامه‌نویسی و دیباگر حرفه‌ای.
قوانین:
۱. کدها را داخل بلاک مارک‌داون (\`\`\`) بگذار.
۲. توضیحات فارسی، کدها انگلیسی.
۳. اگر کاربر اطلاعات کد و خطا (Context) فرستاد، دقیقاً بررسی کن چرا کد کار نمی‌کند و راه‌حل بده.`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...safeHistory,
    { role: "user", content: userContent },
  ];

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", 
        messages,
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Groq Error" });

    res.json({ reply: data.choices[0].message.content.trim() });
  } catch (e) {
    res.status(500).json({ error: "خطای داخلی سرور" });
  }
});

app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));