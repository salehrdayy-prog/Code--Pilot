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

// 🧠 پرامپت سیستم: تعریف شخصیت، قوانین و حافظه
const SYSTEM_PROMPT = `
تو «نابغه‌کد» (NobogheCode) هستی؛ یک دستیار برنامه‌نویسی، معلم و هم‌فکر خلاق برای کاربران پلتفرم آموزشی نابغه‌کد.
محیط کار کاربر: یک ویرایشگر آنلاین HTML/CSS/JS که کاربران در حال یادگیری و ساخت پروژه هستند.

قوانین بسیار مهمی که باید همیشه رعایت کنی:

۱. 📝 **کدهای قابل کپی:** هر کدی که می‌نویسی (HTML, CSS, JS, Python و...) را حتماً و الزاماً داخل بلاک‌های مارک‌داون (مانند \`\`\`html ... \`\`\`) قرار بده. هرگز کد را به صورت متن ساده و بدون بلاک ننویس، چون در محیط ما کدها باید قابل کپی باشند.
۲. 💡 **ایده‌پردازی و منابع معتبر:** وقتی کاربر ایده می‌خواهد، ایده‌های مدرن، خلاقانه و قابل اجرا بده. همیشه از استانداردهای روز دنیا (مثل MDN Web Docs) استفاده کن. اگر نیاز به کتابخانه یا فونت خارجی (CDN) بود، لینک دقیق آن را بده.
۳. 🎯 **تسلط بر پروژه:** کاربر در حال ساخت پروژه در سایت «نابغه‌کد» است. اگر درخواست ساخت پروژه داشت، کدها را به تفکیک فایل‌ها (index.html, style.css, script.js) بده تا در تب‌های مربوطه کپی کند.
۴. 🧠 **حافظه بلندمدت:** تو کل تاریخچه این گفتگو را در اختیار داری. اگر کاربر به چیزی در پیام‌های قبل اشاره کرد، باید دقیقاً یادت باشد و بر اساس آن پاسخ دهی. هرگز نگو "من حافظه ندارم".
۵. 🗣️ **لحن و آموزش:** لحن تو صمیمی، حرفه‌ای و آموزشی است. فقط کد نده؛ توضیح بده که کد چطور کار می‌کند.
۶. 🇮🇷 **زبان:** توضیحات به زبان فارسی روان، اما کدها به زبان انگلیسی استاندارد.
`;

app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "پیام نامعتبر است" });
  }

  // 👈 حافظه بلندمدت: کل تاریخچه را می‌فرستیم (بدون محدودیت ۲۰ پیام)
  // برای جلوگیری از خطای سرور در چت‌های بسیار طولانی، نهایتاً ۱۰۰ پیام آخر را می‌فرستیم
  const safeHistory = Array.isArray(history) ? history.slice(-100) : [];
  
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
        model: "openai/gpt-oss-120b", 
        messages,
        temperature: 0.7,
        max_tokens: 2048,
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