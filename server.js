import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL; // 👈 اسم متغیر رو عوض کردیم

if (!GROQ_API_KEY) { console.error("❌ GROQ_API_KEY تنظیم نشده است"); process.exit(1); }
if (!SUPABASE_DB_URL) { console.error("❌ SUPABASE_DB_URL تنظیم نشده است"); process.exit(1); }

// اتصال به دیتابیس PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false } // برای اتصال امن به Supabase
});

pool.connect()
  .then(() => console.log("✅ Connected to Supabase (PostgreSQL)"))
  .catch(err => console.error("❌ Supabase Connection Error:", err));

// ساخت جدول‌ها (اگر وجود نداشته باشن)
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      phone VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      coins INT DEFAULT 0,
      xp INT DEFAULT 0
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      buyer_id INT REFERENCES users(id),
      buyer_name VARCHAR(255),
      amount INT,
      label VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      date VARCHAR(255)
    );
  `);
  console.log("✅ Tables ready");
};
initDB();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: "10mb" }));

// ================== API ها ==================
app.get("/health", (_req, res) => res.json({ ok: true, status: "Live" }));

// ۱. ثبت نام
app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const existing = await pool.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [phone, email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "شماره یا ایمیل تکراری است" });
    const newUser = await pool.query(
      'INSERT INTO users (name, phone, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email, password, 'user']
    );
    res.json({ ok: true, user: newUser.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ۲. ورود
app.post("/api/login", async (req, res) => {
  try {
    const { loginValue, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM users WHERE (phone = $1 OR email = $1) AND password = $2',
      [loginValue, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "اطلاعات اشتباه است" });
    res.json({ ok: true, user: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ۳. دریافت اطلاعات کاربر
app.get("/api/user/:id", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true, user: result.rows[0] });
  } catch (e) { res.status(500).json({ error: "کاربر پیدا نشد" }); }
});

// ۴. ثبت سفارش سکه
app.post("/api/orders", async (req, res) => {
  try {
    const { buyerId, buyerName, amount, label } = req.body;
    const date = new Date().toLocaleDateString("fa-IR");
    await pool.query(
      'INSERT INTO orders (buyer_id, buyer_name, amount, label, date) VALUES ($1, $2, $3, $4, $5)',
      [buyerId, buyerName, amount, label, date]
    );
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ثبت سفارش" }); }
});

// ۵. دریافت همه سفارشات (ادمین)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json({ ok: true, orders: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ۶. تایید سفارش (اضافه کردن سکه)
app.post("/api/admin/approve", async (req, res) => {
  try {
    const { orderId } = req.body;
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 AND status = $2', [orderId, 'pending']);
    if (orderResult.rows.length === 0) return res.status(400).json({ error: "سفارش نامعتبر" });
    
    const order = orderResult.rows[0];
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['approved', orderId]);
    await pool.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [order.amount, order.buyer_id]);
    
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ۷. دریافت لیست کاربران (ادمین)
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json({ ok: true, users: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ================== هوش مصنوعی ==================
const SYSTEM_PROMPT = `تو «نابغه‌کد» هستی؛ یک مشاور، ایده‌پرداز و مربی برنامه‌نویسی. ۱. ⛔ هرگز سلام تکراری نکن. ۲. 😊 از ایموجی استفاده کن. ۳. 🧠 اول نیاز کاربر رو بپرس، بعد کد بده. ۴. 💻 کدها رو داخل بلاک مارک‌داون بذار.`;

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