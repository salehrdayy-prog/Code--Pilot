import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!GROQ_API_KEY) { console.error("❌ GROQ_API_KEY تنظیم نشده است"); process.exit(1); }
if (!MONGO_URI) { console.error("❌ MONGO_URI تنظیم نشده است"); process.exit(1); }

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: "10mb" }));

// ================== اتصال به دیتابیس ==================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ================== مدل‌های دیتابیس ==================
const UserSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  password: String,
  role: { type: String, default: "user" },
  coins: { type: Number, default: 0 },
  xp: { type: Number, default: 0 }
});
const User = mongoose.model("User", UserSchema);

const OrderSchema = new mongoose.Schema({
  buyerId: String,
  buyerName: String,
  amount: Number,
  label: String,
  status: { type: String, default: "pending" }, // pending, approved, rejected
  date: { type: String, default: () => new Date().toLocaleDateString("fa-IR") }
});
const Order = mongoose.model("Order", OrderSchema);

// ================== API ها ==================
app.get("/health", (_req, res) => res.json({ ok: true, status: "Live" }));

// ۱. ثبت نام
app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ phone }, { email }] });
    if (existing) return res.status(400).json({ error: "شماره یا ایمیل تکراری است" });
    const user = new User({ name, phone, email, password, role: "user" });
    await user.save();
    res.json({ ok: true, user });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ۲. ورود
app.post("/api/login", async (req, res) => {
  try {
    const { loginValue, password } = req.body;
    const user = await User.findOne({ 
      $or: [{ phone: loginValue }, { email: loginValue }],
      password: password 
    });
    if (!user) return res.status(401).json({ error: "اطلاعات اشتباه است" });
    if (user.status === "blocked") return res.status(403).json({ error: "حساب مسدود است" });
    res.json({ ok: true, user });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ۳. دریافت اطلاعات کاربر
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ ok: true, user });
  } catch (e) { res.status(500).json({ error: "کاربر پیدا نشد" }); }
});

// ۴. ثبت سفارش سکه
app.post("/api/orders", async (req, res) => {
  try {
    const { buyerId, buyerName, amount, label } = req.body;
    const order = new Order({ buyerId, buyerName, amount, label });
    await order.save();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطا در ثبت سفارش" }); }
});

// ۵. دریافت همه سفارشات (برای ادمین)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ _id: -1 });
    res.json({ ok: true, orders });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ۶. تایید سفارش (اضافه کردن سکه)
app.post("/api/admin/approve", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order || order.status !== "pending") return res.status(400).json({ error: "سفارش نامعتبر" });

    const user = await User.findById(order.buyerId);
    if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

    order.status = "approved";
    await order.save();

    user.coins += order.amount;
    await user.save();

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ۷. دریافت لیست کاربران (برای ادمین)
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ ok: true, users });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ================== هوش مصنوعی ==================
const SYSTEM_PROMPT = `
تو «نابغه‌کد» (NobogheCode) هستی؛ یک مشاور، ایده‌پرداز و مربی برنامه‌نویسی.
۱. ⛔ هرگز سلام تکراری نکن.
۲. 😊 از ایموجی‌ها به اندازه استفاده کن.
۳. 🧠 اول نیاز کاربر رو بپرس، بعد کد بده.
۴. 💻 کدها رو داخل بلاک مارک‌داون بذار.
`;

app.post("/api/chat", async (req, res) => {
  const { message, history, codeContext } = req.body || {};
  if (!message) return res.status(400).json({ error: "پیام نامعتبر است" });
  const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
  let userContent = message;
  if (codeContext) userContent = `${message}\n\n[اطلاعات محیط]\n${codeContext}`;

  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...safeHistory, { role: "user", content: userContent }];

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-oss-120b", messages, temperature: 0.7, max_tokens: 3000 }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Groq Error" });
    res.json({ reply: data.choices[0].message.content.trim() });
  } catch (e) { res.status(500).json({ error: "خطای داخلی سرور" }); }
});

app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));