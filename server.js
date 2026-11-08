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

app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "Live", provider: "Groq" });
});

const SYSTEM_PROMPT = `
تو «نابغه‌کد» (NobogheCode) هستی؛ یک دستیار برنامه‌نویسی، معلم و هم‌فکر خلاق برای کاربران پلتفرم آموزشی نابغه‌کد.
محیط کار کاربر: یک ویرایشگر آنلاین HTML/CSS/JS.

قوانین:
۱. 📝 هر کدی می‌نویسی را داخل بلاک‌های مارک‌داون (\`\`\`) قرار بده.
۲. 💡 ایده‌های مدرن بده و از منابع معتبر استفاده کن.
۳. 🧠 تو کل تاریخچه این گفتگو را در اختیار داری. به پیام‌های قبلی دقت کن.
۴. 🗣️ لحن تو صمیمی، حرفه‌ای و آموزشی باشد. کدها را توضیح بده.
۵. 🇮🇷 توضیحات به فارسی، کدها به انگلیسی استاندارد.
`;

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "پیام نامعتبر است" });
  }

  // 👈 کاهش تاریخچه به ۶ پیام آخر تا فضای کافی برای جواب‌های طولانی بمونه
  const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
  
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
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
        // 👈 برگشت به مدل متنی با سقف بالا
        model: "openai/gpt-oss-120b", 
        messages,
        temperature: 0.7,
        // 👈 افزایش سقف خروجی به 3000 توکن (کدهای طولانی)
        max_tokens: 3000, 
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