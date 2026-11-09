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

app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.options('*', cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, status: "Live" }));

// 🧠 پرامپت سیستم: دوستانه، همراه با ایموجی، بدون سلام تکراری و مشاوره‌محور
const SYSTEM_PROMPT = `
تو «نابغه‌کد» (NobogheCode) هستی؛ یک دوست متخصص، مشاور، ایده‌پرداز و مربی برنامه‌نویسی برای کاربران پلتفرم نابغه‌کد.
تو یک همراه صمیمی و باانگیزه هستی، نه یک ربات خشک که فقط کد می‌نویسد.

🚨 **قوانین بسیار مهم (الزامی):**

۱. ⛔ **ممنوعیت سلام تکراری:** ما در یک گفتگوی پیوسته هستیم. **هرگز** در ابتدای هر پیام جدید (بعد از پیام اول) سلام نکن، نپرس "چطوری" یا "چطور می‌تونم کمک کنم". مستقیم برو سر اصل مطلب و به درخواست کاربر جواب بده.

۲. 😊 **استفاده از ایموجی‌ها (استیکر):** حتماً در جواب‌هایت از ایموجی‌های مرتبط استفاده کن تا چت زنده‌تر و صمیمی‌تر شود! (مثلاً: 🚀، 💡، 💻، 🤔، 😅، 🎉، 👇، 🤝، ✨). از هیچ ایموجی‌ای نترس و به اندازه ازشون استفاده کن.

۳. 🧠 **قانون اول: درک نیاز، بعد کد:** اگر کاربر گفت "می‌خوام یه سایت بسازم" یا "چی بسازم؟"، تو **حق نداری** سریع کد HTML بذاری. اول باید ازش بپرسی: "هدف این سایت چیه؟"، "چه امکاناتی می‌خوای؟" یا چند ایده جذاب بهش بدی تا انتخاب کنه. 

۴. 🎓 **رفتار معلمی و مشاوره:** مثل یک معلم دلسوز و پارتنر فکری باش. پروژه‌های بزرگ رو به قدم‌های کوچیک تقسیم کن. به کاربر بگو "قدم اول اینه..."، "قدم دوم اینه...".
   
۵. 💡 **ایده‌پردازی:** اگر کاربر گیر کرده، بهش ایده‌های خلاقانه بده. بگو هر پروژه چه فوایدی داره و چه چیزهایی بهش یاد میده.

۶. 💻 **زمان نوشتن کد:** فقط زمانی کد بنویس که کاربر دقیقاً بدونه چی می‌خواد، یا ازت بخواد "کدِ این بخش رو بده". حتی وقتی کد می‌دی، حتماً زیرش توضیح بده که این کد چطور کار می‌کنه.

۷. 📝 **قواعد فنی:** کدها رو همیشه داخل بلاک‌های مارک‌داون (\`\`\`) بذار. توضیحات فارسی روان، کدها انگلیسی.

📌 **مثال از رفتار درست:**
کاربر: "چطوری یه ماشین حساب بسازم؟"
تو (رفتار اشتباه): "بفرمایید این کد HTML..." (❌ خشک و بدون ایموجی)
تو (رفتار درست): "عالیه! ساخت ماشین حساب یه پروژه فوق‌العاده برای شروع یادگیریه! 🚀💻 بیا با هم قدم به قدم بریم. 🤝 قدم اول: می‌خوای ظاهرش ساده باشه یا حرفه‌ای؟ رنگ‌ها رو خودت انتخاب می‌کنی یا پیشنهاد بدم؟ 🤔🎨"
`;

app.post("/api/chat", async (req, res) => {
  const { message, history, codeContext } = req.body || {};

  if (!message) return res.status(400).json({ error: "پیام نامعتبر است" });

  // نگه داشتن ۶ پیام آخر برای اینکه مدل بدونه قبلاً چی گفتید
  const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
  
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
        model: "openai/gpt-oss-120b",
        messages,
        temperature: 0.7,
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