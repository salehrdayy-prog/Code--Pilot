import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const otpTransporter = EMAIL_USER && EMAIL_PASS ? nodemailer.createTransport({ service: "gmail", auth: { user: EMAIL_USER, pass: EMAIL_PASS } }) : null;

if (!GROQ_API_KEY) { console.error("❌ GROQ_API_KEY تنظیم نشده است"); process.exit(1); }
if (!SUPABASE_DB_URL) { console.error("❌ SUPABASE_DB_URL تنظیم نشده است"); process.exit(1); }

const pool = new Pool({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

pool.connect().then(() => console.log("✅ Connected to Supabase (PostgreSQL)")).catch(err => console.error("❌ Supabase Connection Error:", err));

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, name VARCHAR(255), phone VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE, password VARCHAR(255), role VARCHAR(50) DEFAULT 'user',
        coins INT DEFAULT 0, xp INT DEFAULT 0, plan VARCHAR(50) DEFAULT 'free',
        bio TEXT DEFAULT '', avatar TEXT DEFAULT ''
      );
    `);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_plain VARCHAR(255);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';`);
    await pool.query(`CREATE TABLE IF NOT EXISTS email_otps (id BIGSERIAL PRIMARY KEY, email VARCHAR(254) NOT NULL, purpose VARCHAR(20) NOT NULL, code_hash TEXT NOT NULL, payload JSONB, expires_at TIMESTAMPTZ NOT NULL, attempts INT NOT NULL DEFAULT 0, last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
    await pool.query(`CREATE INDEX IF NOT EXISTS email_otps_lookup_idx ON email_otps(email, purpose, created_at DESC);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY, buyer_id INT REFERENCES users(id), buyer_name VARCHAR(255),
        amount INT, label VARCHAR(255), status VARCHAR(50) DEFAULT 'pending',
        tracking_code VARCHAR(255), date VARCHAR(255)
      );
    `);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(255);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), name VARCHAR(255),
        html TEXT, css TEXT, js TEXT, date VARCHAR(255)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), user_name VARCHAR(255),
        text TEXT, rating INT, likes INT DEFAULT 0, date VARCHAR(255)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id),
        sender VARCHAR(50) DEFAULT 'admin', text TEXT,
        is_read BOOLEAN DEFAULT false, date VARCHAR(255)
      );
    `);
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender VARCHAR(50) DEFAULT 'admin';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id SERIAL PRIMARY KEY, sender_id INT REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
        text TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW(),
        reply_to_id INT DEFAULT NULL, image_url TEXT DEFAULT NULL
      );
    `);
    await pool.query(`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id INT DEFAULT NULL;`);
    await pool.query(`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY, blocker_id INT REFERENCES users(id) ON DELETE CASCADE,
        blocked_id INT REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(blocker_id, blocked_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY, reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
        reported_id INT REFERENCES users(id) ON DELETE CASCADE, reason TEXT, created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pinned_users (
        id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
        pinned_user_id INT REFERENCES users(id) ON DELETE CASCADE, UNIQUE(user_id, pinned_user_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY, name VARCHAR(255), type VARCHAR(50) DEFAULT 'group',
        owner_id INT REFERENCES users(id) ON DELETE CASCADE, link_code VARCHAR(50) UNIQUE,
        avatar TEXT DEFAULT '', description TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS link_code VARCHAR(50) UNIQUE;`);
    await pool.query(`ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_members (
        id SERIAL PRIMARY KEY, room_id INT REFERENCES chat_rooms(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE, role VARCHAR(50) DEFAULT 'member',
        UNIQUE(room_id, user_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_messages (
        id SERIAL PRIMARY KEY, room_id INT REFERENCES chat_rooms(id) ON DELETE CASCADE,
        sender_id INT REFERENCES users(id) ON DELETE CASCADE, text TEXT, created_at TIMESTAMP DEFAULT NOW(),
        reply_to_id INT DEFAULT NULL, image_url TEXT DEFAULT NULL
      );
    `);
    await pool.query(`ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS reply_to_id INT DEFAULT NULL;`);
    await pool.query(`ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS deleted_messages (
        id SERIAL PRIMARY KEY, message_id INT NOT NULL, message_type VARCHAR(20) NOT NULL,
        user_id INT REFERENCES users(id) ON DELETE CASCADE, UNIQUE(message_id, message_type, user_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY, message_id INT NOT NULL, message_type VARCHAR(20) NOT NULL,
        user_id INT REFERENCES users(id) ON DELETE CASCADE, emoji VARCHAR(10) NOT NULL,
        UNIQUE(message_id, message_type, user_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT,
        link VARCHAR(255), image_url TEXT, type VARCHAR(50) DEFAULT 'general',
        price INT DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_requests (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(255), phone VARCHAR(255), content TEXT NOT NULL,
        price INT DEFAULT 0, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Tables ready");
  } catch (e) { console.error("❌ Error creating tables:", e); }
};

const initDBPromise = initDB();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, status: "Live" }));

// ================== تبلیغات ==================
app.get("/api/ads", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM advertisements WHERE is_active = true ORDER BY id DESC');
    res.json({ ok: true, ads: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/ads/request", async (req, res) => {
  try {
    const { userId, userName, phone, content, price } = req.body;
    if (!content) return res.status(400).json({ error: "متن تبلیغ را وارد کنید" });
    await pool.query('INSERT INTO ad_requests (user_id, user_name, phone, content, price) VALUES ($1, $2, $3, $4, $5)', [userId, userName, phone, content, price || 0]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/admin/ad-requests", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ad_requests ORDER BY id DESC');
    res.json({ ok: true, requests: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/admin/ad-requests/action", async (req, res) => {
  try {
    const { requestId, action } = req.body;
    if (action === 'approve') {
      const reqResult = await pool.query('SELECT * FROM ad_requests WHERE id = $1', [requestId]);
      if (reqResult.rows.length === 0) return res.status(404).json({ error: "درخواست یافت نشد" });
      const r = reqResult.rows[0];
      await pool.query(
        'INSERT INTO advertisements (title, description, link, type, price, is_active) VALUES ($1, $2, $3, $4, $5, true)',
        ['تبلیغ: ' + (r.user_name || 'کاربر'), r.content, '#', 'تبلیغ کاربر', r.price || 0]
      );
    }
    await pool.query('UPDATE ad_requests SET status = $1 WHERE id = $2', [action === 'approve' ? 'approved' : 'rejected', requestId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/admin/ad-requests/delete", async (req, res) => {
  try {
    const { requestId } = req.body;
    await pool.query('DELETE FROM ad_requests WHERE id = $1', [requestId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ================== احراز هویت با کد یک‌بارمصرف ایمیل ==================
const normalizeEmail = value => String(value || "").trim().toLowerCase();
const normalizePhone = value => String(value || "").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g, "");
const otpDigest = (email, purpose, code) => crypto.createHmac("sha256", EMAIL_PASS || SUPABASE_DB_URL).update(`${email}:${purpose}:${code}`).digest("hex");
async function sendEmailOtp(email, code, purpose) {
  if (!otpTransporter) throw new Error("تنظیمات ارسال ایمیل روی سرور کامل نیست (EMAIL_USER و EMAIL_PASS).");
  await otpTransporter.sendMail({
    from: `نابغه‌کد <${EMAIL_USER}>`, to: email,
    subject: purpose === "register" ? "کد تأیید ثبت‌نام نابغه‌کد" : "کد ورود به نابغه‌کد",
    text: `کد تأیید شما: ${code}\nاین کد تا ۵ دقیقه معتبر است. آن را در اختیار هیچ‌کس قرار ندهید.`,
    html: `<div dir="rtl" style="font-family:tahoma,sans-serif;background:#111827;color:#fff;padding:28px;border-radius:16px;text-align:center"><h2>نابغه‌کد</h2><p>کد تأیید شما</p><div style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#252b3b;padding:18px;border-radius:12px">${code}</div><p>این کد تا ۵ دقیقه معتبر است.</p><small>کد را با هیچ‌کس به اشتراک نگذارید؛ تیم نابغه‌کد هرگز کد شما را درخواست نمی‌کند.</small></div>`
  });
}
async function issueOtp(email, purpose, payload, res) {
  const recent = await pool.query(`SELECT created_at FROM email_otps WHERE email=$1 AND purpose=$2 ORDER BY created_at DESC LIMIT 1`, [email, purpose]);
  if (recent.rows[0] && Date.now() - new Date(recent.rows[0].created_at).getTime() < 60000) return res.status(429).json({ ok:false, error:"برای ارسال دوباره کد، ۶۰ ثانیه صبر کنید." });
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  await pool.query(`INSERT INTO email_otps(email,purpose,code_hash,payload,expires_at) VALUES($1,$2,$3,$4,NOW()+INTERVAL '5 minutes')`, [email,purpose,otpDigest(email,purpose,code),payload ? JSON.stringify(payload) : null]);
  try { await sendEmailOtp(email, code, purpose); }
  catch (error) { await pool.query(`DELETE FROM email_otps WHERE email=$1 AND purpose=$2 AND created_at > NOW()-INTERVAL '1 minute'`, [email,purpose]); throw error; }
  return res.json({ ok:true, message:"کد تأیید به ایمیل شما ارسال شد." });
}
async function verifyOtp(email, purpose, code) {
  const result = await pool.query(`SELECT * FROM email_otps WHERE email=$1 AND purpose=$2 AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1`, [email,purpose]);
  const row = result.rows[0];
  if (!row) return { error:"کد منقضی شده یا درخواست کد پیدا نشد." };
  if (row.attempts >= 5) { await pool.query(`DELETE FROM email_otps WHERE id=$1`, [row.id]); return { error:"تعداد تلاش بیش از حد مجاز است؛ کد جدید بگیرید." }; }
  if (!crypto.timingSafeEqual(Buffer.from(row.code_hash), Buffer.from(otpDigest(email,purpose,String(code || ""))))) {
    await pool.query(`UPDATE email_otps SET attempts=attempts+1 WHERE id=$1`, [row.id]); return { error:"کد تأیید اشتباه است." };
  }
  await pool.query(`DELETE FROM email_otps WHERE id=$1`, [row.id]);
  return { row };
}
app.post("/api/auth/register/request", async (req,res) => {
  try {
    const name=String(req.body?.name||"").trim(), phone=normalizePhone(req.body?.phone), email=normalizeEmail(req.body?.email);
    if(name.length<3 || name.length>50 || !/^09\d{9}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ok:false,error:"اطلاعات واردشده معتبر نیست."});
    const exists=await pool.query(`SELECT id FROM users WHERE phone=$1 OR LOWER(email)=LOWER($2) LIMIT 1`,[phone,email]);
    if(exists.rows.length) return res.status(409).json({ok:false,error:"این شماره موبایل یا ایمیل قبلاً ثبت شده است."});
    return await issueOtp(email,"register",{name,phone},res);
  } catch(e) { console.error("Register OTP error:",e); res.status(500).json({ok:false,error:e.message||"ارسال کد انجام نشد."}); }
});
app.post("/api/auth/register/verify", async(req,res)=>{
  try { const email=normalizeEmail(req.body?.email), code=String(req.body?.code||"").replace(/\D/g,"");
    const verified=await verifyOtp(email,"register",code); if(verified.error) return res.status(400).json({ok:false,error:verified.error});
    const data=verified.row.payload||{}; if(!data.name||!data.phone) return res.status(400).json({ok:false,error:"اطلاعات ثبت‌نام معتبر نیست؛ دوباره کد بگیرید."});
    const created=await pool.query(`INSERT INTO users(name,phone,email,password,password_plain,role) VALUES($1,$2,$3,NULL,NULL,'user') RETURNING id,name,phone,email,role,coins,xp,plan,bio,avatar`,[data.name,data.phone,email]);
    res.json({ok:true,user:created.rows[0]});
  } catch(e) { console.error("Register verify error:",e); res.status(500).json({ok:false,error:"ساخت حساب انجام نشد."}); }
});
app.post("/api/auth/login/request", async(req,res)=>{
  try { const value=String(req.body?.loginValue||"").trim(); if(!value) return res.status(400).json({ok:false,error:"ایمیل یا شماره موبایل را وارد کنید."});
    const phone=normalizePhone(value), email=normalizeEmail(value);
    const found=await pool.query(`SELECT email, role FROM users WHERE LOWER(email)=LOWER($1) OR phone=$2 LIMIT 1`,[email,phone]);
    if(!found.rows.length || !found.rows[0].email) return res.status(404).json({ok:false,error:"حسابی با این مشخصات پیدا نشد یا ایمیل ثبت نشده است."});
    if(found.rows[0].role === "admin") return res.status(403).json({ok:false,error:"ورود مدیر با ایمیل و رمز عبور انجام می‌شود."});
    return await issueOtp(normalizeEmail(found.rows[0].email),"login",{loginValue:value},res);
  } catch(e) { console.error("Login OTP error:",e); res.status(500).json({ok:false,error:e.message||"ارسال کد ورود انجام نشد."}); }
});
app.post("/api/auth/login/verify", async(req,res)=>{
  try { const value=String(req.body?.loginValue||"").trim(), phone=normalizePhone(value), email=normalizeEmail(value), code=String(req.body?.code||"").replace(/\D/g,"");
    const found=await pool.query(`SELECT * FROM users WHERE LOWER(email)=LOWER($1) OR phone=$2 LIMIT 1`,[email,phone]);
    if(!found.rows.length) return res.status(404).json({ok:false,error:"حساب کاربری پیدا نشد."});
    const user=found.rows[0];
    if(user.role === "admin") return res.status(403).json({ok:false,error:"ورود مدیر با ایمیل و رمز عبور انجام می‌شود."});
    const verified=await verifyOtp(normalizeEmail(user.email),"login",code); if(verified.error) return res.status(400).json({ok:false,error:verified.error});
    delete user.password; delete user.password_plain; res.json({ok:true,user});
  } catch(e) { console.error("Login verify error:",e); res.status(500).json({ok:false,error:"ورود انجام نشد."}); }
});

// مسیرهای قدیمی رمزعبور برای سازگاری موقت؛ نقش کاربر از سمت مرورگر پذیرفته نمی‌شود.
app.post("/api/register", async (_req, res) => {
  return res.status(410).json({ ok:false, error:"ثبت‌نام فقط با تأیید کد ایمیلی انجام می‌شود." });
});
app.post("/api/login", async (req,res)=>{
  try {
    const loginValue=String(req.body?.loginValue || "").trim();
    const password=String(req.body?.password || "");
    if(!loginValue || !password) return res.status(400).json({ok:false,error:"ایمیل و رمز عبور را وارد کنید."});
    const result=await pool.query(`SELECT * FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1`,[loginValue]);
    if(!result.rows.length) return res.status(401).json({ok:false,error:"ایمیل یا رمز عبور اشتباه است."});
    const user=result.rows[0];
    if(user.role !== "admin") return res.status(403).json({ok:false,error:"کاربران عادی باید با کد یک‌بارمصرف ایمیل وارد شوند."});
    let isMatch=false;
    if(user.password && /^\$2[aby]\$/.test(user.password)) {
      isMatch=await bcrypt.compare(password,user.password);
    } else if(password === user.password) {
      isMatch=true;
      const hashed=await bcrypt.hash(password,10);
      await pool.query(`UPDATE users SET password=$1, password_plain=NULL WHERE id=$2`,[hashed,user.id]);
    }
    if(!isMatch) return res.status(401).json({ok:false,error:"ایمیل یا رمز عبور اشتباه است."});
    delete user.password; delete user.password_plain;
    res.json({ok:true,user});
  } catch(e) {
    console.error("Admin login error:",e);
    res.status(500).json({ok:false,error:"خطای سرور در ورود مدیر."});
  }
});

app.get("/api/user/:id", async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, phone, email, role, coins, xp, plan, bio, avatar FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true, user: result.rows[0] });
  } catch (e) { res.status(500).json({ error: "کاربر پیدا نشد" }); }
});

app.post("/api/user/update-profile", async (req, res) => {
  try {
    const { userId, name, bio, avatar } = req.body;
    const result = await pool.query(
      `UPDATE users SET name = COALESCE(NULLIF($1, ''), name), bio = COALESCE($2, bio), avatar = COALESCE($3, avatar) WHERE id = $4 RETURNING id, name, phone, email, role, coins, xp, plan, bio, avatar`,
      [name, bio, avatar, userId]
    );
    res.json({ ok: true, user: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, phone, email, role, coins, xp, plan, bio,
        CASE WHEN role = 'admin' THEN '🔒 محافظت شده' ELSE COALESCE(password_plain, '—') END AS password_view
      FROM users ORDER BY id DESC
    `);
    res.json({ ok: true, users: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/subscribe", async (req, res) => {
  try {
    const { userId, plan } = req.body;
    const PLAN_COST = 1000;
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "کاربر پیدا نشد" });
    const user = userResult.rows[0];
    if (user.plan === 'pro') return res.status(400).json({ error: "شما از قبل کاربر ویژه هستید" });
    if (user.coins < PLAN_COST) return res.status(400).json({ error: "سکه کافی نیست!" });
    const updatedUserResult = await pool.query(
      'UPDATE users SET coins = coins - $1, plan = $2 WHERE id = $3 RETURNING id, name, phone, email, role, coins, xp, plan, bio, avatar',
      [PLAN_COST, plan, userId]
    );
    res.json({ ok: true, user: updatedUserResult.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { buyerId, buyerName, amount, label, trackingCode } = req.body;
    const date = new Date().toLocaleDateString("fa-IR");
    await pool.query('INSERT INTO orders (buyer_id, buyer_name, amount, label, tracking_code, date) VALUES ($1, $2, $3, $4, $5, $6)', [buyerId, buyerName, amount, label, trackingCode, date]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ثبت سفارش" }); }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json({ ok: true, orders: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

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

app.post("/api/admin/orders/delete", async (req, res) => {
  try {
    const { orderId } = req.body;
    await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/admin/users/delete", async (req, res) => {
  try {
    const { userId } = req.body;
    await pool.query('DELETE FROM orders WHERE buyer_id = $1', [userId]);
    await pool.query('DELETE FROM projects WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM reviews WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM messages WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/admin/send-message", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const date = new Date().toLocaleString("fa-IR");
    await pool.query('INSERT INTO messages (user_id, sender, text, date) VALUES ($1, $2, $3, $4)', [userId, 'admin', text, date]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ارسال پیام" }); }
});

app.get("/api/messages/:userId", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages WHERE user_id = $1 ORDER BY id DESC', [req.params.userId]);
    res.json({ ok: true, messages: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/messages/read", async (req, res) => {
  try {
    const { messageId } = req.body;
    await pool.query('UPDATE messages SET is_read = true WHERE id = $1', [messageId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/messages/reply", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const date = new Date().toLocaleString("fa-IR");
    await pool.query('INSERT INTO messages (user_id, sender, text, date) VALUES ($1, $2, $3, $4)', [userId, 'user', text, date]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ارسال پاسخ" }); }
});

app.post("/api/messages/delete", async (req, res) => {
  try {
    const { messageId } = req.body;
    await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطا در حذف پیام" }); }
});

app.get("/api/admin/messages", async (req, res) => {
  try {
    const result = await pool.query(`SELECT m.*, u.name as user_name FROM messages m JOIN users u ON m.user_id = u.id WHERE m.sender = 'user' ORDER BY m.id DESC`);
    res.json({ ok: true, messages: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ================== پیام‌رسان اجتماعی ==================
app.get("/api/social/users/:currentUserId", async (req, res) => {
  try {
    const { currentUserId } = req.params;
    const result = await pool.query(`
      SELECT id, name, role, xp, plan, bio, avatar FROM users 
      WHERE id != $1 AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1) ORDER BY name ASC
    `, [currentUserId]);
    res.json({ ok: true, users: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/social/chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = parseInt(userId);
    const dms = await pool.query(`
      SELECT u.id, u.name, u.role, u.avatar, 'direct' as chat_type,
        (SELECT text FROM direct_messages WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1) ORDER BY id DESC LIMIT 1) as last_message,
        (SELECT created_at FROM direct_messages WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1) ORDER BY id DESC LIMIT 1) as last_time,
        (SELECT COUNT(*) FROM direct_messages WHERE sender_id = u.id AND receiver_id = $1 AND is_read = false) as unread_count,
        (SELECT COUNT(*) FROM pinned_users WHERE user_id = $1 AND pinned_user_id = u.id) > 0 as is_pinned,
        (SELECT COUNT(*) FROM blocks WHERE blocker_id = u.id AND blocked_id = $1) > 0 as is_blocked
      FROM users u WHERE u.id != $1 AND EXISTS (SELECT 1 FROM direct_messages WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1))
    `, [uid]);

    const rooms = await pool.query(`
      SELECT r.id, r.name, r.type as role, 'room' as chat_type, r.avatar, r.description,
        (SELECT text FROM room_messages WHERE room_id = r.id ORDER BY id DESC LIMIT 1) as last_message,
        (SELECT created_at FROM room_messages WHERE room_id = r.id ORDER BY id DESC LIMIT 1) as last_time,
        0 as unread_count, false as is_pinned, false as is_blocked, r.link_code
      FROM chat_rooms r JOIN room_members rm ON r.id = rm.room_id WHERE rm.user_id = $1
    `, [uid]);

    let allChats = [...dms.rows, ...rooms.rows];
    allChats.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
      if (!a.last_time) return 1; if (!b.last_time) return -1;
      return new Date(b.last_time) - new Date(a.last_time);
    });
    res.json({ ok: true, chats: allChats });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/send", async (req, res) => {
  try {
    const { senderId, receiverId, text, replyToId, imageUrl } = req.body;
    if (!senderId || !receiverId || (!text && !imageUrl)) return res.status(400).json({ error: "اطلاعات ناقص" });
    const blockCheck = await pool.query('SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)', [senderId, receiverId]);
    if (blockCheck.rows.length > 0) return res.status(403).json({ error: "ارتباط بلاک شده است" });
    const result = await pool.query(
      'INSERT INTO direct_messages (sender_id, receiver_id, text, reply_to_id, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [senderId, receiverId, text || '', replyToId || null, imageUrl || null]
    );
    res.json({ ok: true, message: result.rows[0] });
  } catch (e) { res.status(500).json({ error: "خطا در ارسال پیام" }); }
});

app.post("/api/social/block", async (req, res) => {
  try {
    const { userId, targetId } = req.body;
    await pool.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, targetId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/unblock", async (req, res) => {
  try {
    const { userId, targetId } = req.body;
    await pool.query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [userId, targetId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/report", async (req, res) => {
  try {
    const { userId, targetId, reason } = req.body;
    await pool.query('INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)', [userId, targetId, reason]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/pin", async (req, res) => {
  try {
    const { userId, targetId } = req.body;
    const check = await pool.query('SELECT * FROM pinned_users WHERE user_id = $1 AND pinned_user_id = $2', [userId, targetId]);
    if (check.rows.length > 0) {
      await pool.query('DELETE FROM pinned_users WHERE user_id = $1 AND pinned_user_id = $2', [userId, targetId]);
      res.json({ ok: true, action: 'unpinned' });
    } else {
      await pool.query('INSERT INTO pinned_users (user_id, pinned_user_id) VALUES ($1, $2)', [userId, targetId]);
      res.json({ ok: true, action: 'pinned' });
    }
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/create-room", async (req, res) => {
  try {
    const { ownerId, name, type, description, avatar } = req.body;
    const linkCode = crypto.randomBytes(4).toString('hex');
    const roomResult = await pool.query('INSERT INTO chat_rooms (name, type, owner_id, link_code, description, avatar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, type, ownerId, linkCode, description || '', avatar || '']);
    const room = roomResult.rows[0];
    await pool.query('INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3)', [room.id, ownerId, 'admin']);
    res.json({ ok: true, room });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/join-room", async (req, res) => {
  try {
    const { userId, linkCode } = req.body;
    const roomResult = await pool.query('SELECT * FROM chat_rooms WHERE link_code = $1', [linkCode]);
    if (roomResult.rows.length === 0) return res.status(404).json({ error: "گروه پیدا نشد" });
    const room = roomResult.rows[0];
    const check = await pool.query('SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2', [room.id, userId]);
    if (check.rows.length > 0) return res.status(400).json({ error: "شما قبلاً عضو این گروه هستید" });
    await pool.query('INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3)', [room.id, userId, 'member']);
    res.json({ ok: true, room });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/social/room-members/:roomId", async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.id, u.name, u.role, rm.role as group_role FROM room_members rm JOIN users u ON rm.user_id = u.id WHERE rm.room_id = $1`, [req.params.roomId]);
    res.json({ ok: true, members: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.delete("/api/social/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    const check = await pool.query('SELECT * FROM chat_rooms WHERE id = $1 AND owner_id = $2', [roomId, userId]);
    if (check.rows.length === 0) return res.status(403).json({ error: "فقط سازنده می‌تواند گروه را حذف کند" });
    await pool.query('DELETE FROM chat_rooms WHERE id = $1', [roomId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/room/change-link", async (req, res) => {
  try {
    const { roomId, userId, newLink } = req.body;
    const check = await pool.query('SELECT * FROM chat_rooms WHERE id = $1 AND owner_id = $2', [roomId, userId]);
    if (check.rows.length === 0) return res.status(403).json({ error: "فقط سازنده می‌تواند لینک را تغییر دهد" });
    await pool.query('UPDATE chat_rooms SET link_code = $1 WHERE id = $2', [newLink, roomId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/social/history/:user1Id/:user2Id", async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;

    const result = await pool.query(`
      SELECT dm.*,
        (SELECT text FROM direct_messages WHERE id = dm.reply_to_id) AS reply_text,
        (SELECT u.name FROM direct_messages rdm JOIN users u ON rdm.sender_id = u.id WHERE rdm.id = dm.reply_to_id) AS reply_sender_name,
        (SELECT json_agg(json_build_object('emoji', r.emoji, 'user_id', r.user_id))
         FROM reactions r
         WHERE r.message_id = dm.id AND r.message_type = 'direct') AS reactions
      FROM direct_messages dm
      WHERE (
        (dm.sender_id = $1 AND dm.receiver_id = $2)
        OR
        (dm.sender_id = $2 AND dm.receiver_id = $1)
      )
      AND dm.id NOT IN (
        SELECT message_id
        FROM deleted_messages
        WHERE message_type = 'direct' AND user_id = $1
      )
      ORDER BY dm.created_at ASC
    `, [user1Id, user2Id]);

    res.json({ ok: true, messages: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "خطای سرور" });
  }
});

app.post("/api/social/read", async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
    await pool.query('UPDATE direct_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2', [otherUserId, userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/social/room-messages/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query;
    const result = await pool.query(`
      SELECT rm.*, u.name as sender_name,
        (SELECT text FROM room_messages WHERE id = rm.reply_to_id) as reply_text,
        (SELECT u2.name FROM room_messages rrm JOIN users u2 ON rrm.sender_id = u2.id WHERE rrm.id = rm.reply_to_id) as reply_sender_name,
        (SELECT json_agg(json_build_object('emoji', r.emoji, 'user_id', r.user_id)) FROM reactions r WHERE r.message_id = rm.id AND r.message_type = 'room') as reactions
      FROM room_messages rm JOIN users u ON rm.sender_id = u.id 
      WHERE rm.room_id = $1 AND rm.id NOT IN (SELECT message_id FROM deleted_messages WHERE message_type = 'room' AND user_id = $2)
      ORDER BY rm.created_at ASC
    `, [roomId, userId || 0]);
    res.json({ ok: true, messages: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/send-room", async (req, res) => {
  try {
    const { senderId, roomId, text, replyToId, imageUrl } = req.body;
    if (!senderId || !roomId || (!text && !imageUrl)) return res.status(400).json({ error: "اطلاعات ناقص" });
    const result = await pool.query(
      'INSERT INTO room_messages (sender_id, room_id, text, reply_to_id, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [senderId, roomId, text || '', replyToId || null, imageUrl || null]
    );
    res.json({ ok: true, message: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ارسال پیام" }); }
});

app.post("/api/social/react", async (req, res) => {
  try {
    const { messageId, messageType, userId, emoji } = req.body;
    if (!messageId || !messageType || !userId || !emoji) return res.status(400).json({ error: "اطلاعات ناقص" });
    const existing = await pool.query('SELECT * FROM reactions WHERE message_id = $1 AND message_type = $2 AND user_id = $3', [messageId, messageType, userId]);
    if (existing.rows.length > 0) {
      if (existing.rows[0].emoji === emoji) {
        await pool.query('DELETE FROM reactions WHERE id = $1', [existing.rows[0].id]);
      } else {
        await pool.query('UPDATE reactions SET emoji = $1 WHERE id = $2', [emoji, existing.rows[0].id]);
      }
    } else {
      await pool.query('INSERT INTO reactions (message_id, message_type, user_id, emoji) VALUES ($1, $2, $3, $4)', [messageId, messageType, userId, emoji]);
    }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/delete-for-me", async (req, res) => {
  try {
    const { messageId, messageType, userId } = req.body;
    await pool.query('INSERT INTO deleted_messages (message_id, message_type, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [messageId, messageType, userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/delete-for-everyone", async (req, res) => {
  try {
    const { messageId, messageType, userId } = req.body;
    const table = messageType === 'room' ? 'room_messages' : 'direct_messages';
    const check = await pool.query(`SELECT * FROM ${table} WHERE id = $1 AND sender_id = $2`, [messageId, userId]);
    if (check.rows.length === 0) return res.status(403).json({ error: "فقط فرستنده می‌تواند حذف کند" });
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [messageId]);
    await pool.query('DELETE FROM deleted_messages WHERE message_id = $1 AND message_type = $2', [messageId, messageType]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ================== گزارش‌های کاربران ==================
app.get("/api/admin/reports", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.reason, r.created_at,
        u1.name as reporter_name, u1.phone as reporter_phone,
        u2.name as reported_name, u2.id as reported_id, u2.phone as reported_phone
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      JOIN users u2 ON r.reported_id = u2.id
      ORDER BY r.created_at DESC
    `);
    res.json({ ok: true, reports: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/admin/reports/delete", async (req, res) => {
  try {
    const { reportId } = req.body;
    await pool.query('DELETE FROM reports WHERE id = $1', [reportId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ================== پروژه‌ها و نظرات ==================
app.post("/api/projects", async (req, res) => {
  try {
    const { userId, name, html, css, js, date } = req.body;
    const result = await pool.query('INSERT INTO projects (user_id, name, html, css, js, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [userId, name, html, css, js, date]);
    res.json({ ok: true, project: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ذخیره پروژه" }); }
});
app.get("/api/projects/:userId", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY id DESC', [req.params.userId]);
    res.json({ ok: true, projects: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در دریافت پروژه‌ها" }); }
});
app.post("/api/reviews", async (req, res) => {
  try {
    const { userId, userName, text, rating, date } = req.body;
    const result = await pool.query('INSERT INTO reviews (user_id, user_name, text, rating, date) VALUES ($1, $2, $3, $4, $5) RETURNING *', [userId, userName, text, rating, date]);
    res.json({ ok: true, review: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ثبت نظر" }); }
});
app.get("/api/reviews", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
    res.json({ ok: true, reviews: result.rows });
  } catch (e) { res.status(500).json({ error: "خطا در دریافت نظرات" }); }
});
app.post("/api/reviews/delete", async (req, res) => {
  try {
    const { reviewId, userId, userRole } = req.body;
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) return res.status(404).json({ error: "نظر پیدا نشد" });
    const review = reviewResult.rows[0];
    if (userRole !== 'admin' && review.user_id !== userId) return res.status(403).json({ error: "شما فقط می‌توانید نظر خودتان را حذف کنید" });
    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});
app.post("/api/reviews/like", async (req, res) => {
  try {
    const { reviewId, action } = req.body;
    const reviewResult = await pool.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) return res.status(404).json({ error: "نظر پیدا نشد" });
    const currentLikes = reviewResult.rows[0].likes || 0;
    const newLikes = action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    await pool.query('UPDATE reviews SET likes = $1 WHERE id = $2', [newLikes, reviewId]);
    res.json({ ok: true, likes: newLikes });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
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
      method: "POST", headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-oss-120b", messages, temperature: 0.7, max_tokens: 3000 }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Groq Error" });
    res.json({ reply: data.choices[0].message.content.trim() });
  } catch (e) { res.status(500).json({ error: "خطای داخلی سرور" }); }
});

initDBPromise.then(() => app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`))).catch(error => { console.error("❌ Database initialization failed:", error); process.exit(1); });