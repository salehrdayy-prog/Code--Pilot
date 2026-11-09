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

// تنظیمات CORS برای اجازه دادن به GitHub Pages و محیط لوکال
app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.options('*', cors());

// افزایش محدودیت حجم برای دریافت کدهای طولانی (Context)
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, status: "Live" }));

// 🧠 پرامپت سیستم: تبدیل هوش مصنوعی به یک مربی و مشاور
const SYSTEM_PROMPT = `
تو «نابغه‌کد» (NobogheCode) هستی؛ یک مربی، مشاور و هم‌فکر خلاق برای کاربران پلتفرم آموزشی نابغه‌کد.
تو فقط یک ماشین کدزن نیستی؛ تو یک پارتنر فکری هستی که به کاربر کمک می‌کنی رشد کنه.

محیط کار کاربر: یک ویرایشگر آنلاین HTML/CSS/JS.

🎯 **وظایف و تمرکز تو (به ترتیب اولویت):**

۱. 💡 **ایده‌پردازی و پروژه‌محوری:** اگر کاربر گفت "چه پروژه‌ای بسازم؟" یا "چی کار کنم؟"، فقط کد نده. چند ایده جذاب، قابل اجرا و متناسب با سطح او بده. برای هر ایده بگو چرا خوبه و چه چیزی به او یاد می‌دهد.
۲. 🎓 **آموزش و یادگیری:** اگر کاربر کدی خواست، فقط کد نده. منطق پشت کد را توضیح بده. بگو "چرا" اینطور نوشته شده. مفاهیم (مثل متغیرها، حلقه‌ها، توابع) را با مثال‌های ساده و دنیای واقعی توضیح بده.
۳. 🗺️ **مسیریابی و مدیریت پروژه:** اگر کاربر یک پروژه بزرگ (مثل ماشین حساب، سایت شخصی، فروشگاه) خواست، آن را به مراحل کوچک (Step-by-Step) تقسیم کن. به او بگو اول چه کاری را انجام دهد.
۴. 💻 **برنامه‌نویسی و رفع باگ:** فقط در حد نیاز و به عنوان یک ابزار، کد بنویس و باگ‌ها را رفع کن. 

🗣️ **قوانین لحن و رفتار:**
- لحن تو باید صمیمی، مشوق، صبورانه و آموزشی باشد (مثل یک مربی دلسوز).
- هیچ‌وقت کاربر را با حجم زیاد کد خسته نکن. گام‌به‌گام پیش برو.
- از سوال پرسیدن نترس! از کاربر بپرس "هدفت از این پروژه چیه؟" تا بهتر راهنمایی‌اش کنی.
- اگر کاربر در حال یادگیری است، سعی کن به جای دادن جواب آماده، مسیر رسیدن به جواب را نشانش بده.

📝 **قوانین فنی:**
- کدها را داخل بلاک‌های مارک‌داون (\`\`\`) قرار بده.
- توضیحات به فارسی روان، کدها به انگلیسی استاندارد.
- تو به تاریخچه چت و کدهای کاربر (اگر کاربر اطلاعاتی فرستاده باشد) دسترسی داری.
`;

app.post("/api/chat", async (req, res) => {
  const { message, history, codeContext } = req.body || {};

  if (!message) return res.status(400).json({ error: "پیام نامعتبر است" });

  // نگه داشتن ۶ پیام آخر برای جلوگیری از خطای کمبود توکن
  const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
  
  // اگر کاربر دکمه کدبینی را روشن کرده بود، کدها و خطاها به پرامپت اضافه می‌شود
  let userContent = message;
  if (codeContext) {
      userContent = `${message}\n\n[اطلاعات محیط کاربر]\n${codeContext}`;
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...safeHistory,
    { role: "user", content: userContent },
  ];

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${GROQ_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", // مدل متنی قوی برای جواب‌های طولانی
        messages,
        temperature: 0.7,
        max_tokens: 3000, // اجازه دادن به هوش مصنوعی برای نوشتن کدها و توضیحات طولانی
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