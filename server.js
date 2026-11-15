import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcrypt";

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const SETUP_KEY = process.env.SETUP_KEY;

if (!GROQ_API_KEY) { console.error("❌ GROQ_API_KEY تنظیم نشده است"); process.exit(1); }
if (!SUPABASE_DB_URL) { console.error("❌ SUPABASE_DB_URL تنظیم نشده است"); process.exit(1); }

const pool = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log("✅ Connected to Supabase (PostgreSQL)"))
  .catch(err => console.error("❌ Supabase Connection Error:", err));

// ================== ساخت جدول‌ها ==================
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, name VARCHAR(255), phone VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE, password VARCHAR(255), role VARCHAR(50) DEFAULT 'user',
        coins INT DEFAULT 0, xp INT DEFAULT 0, plan VARCHAR(50) DEFAULT 'free'
      );
    `);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_plain VARCHAR(255);`);
    
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
        text TEXT, is_read BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW()
      );
    `);

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
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS link_code VARCHAR(50) UNIQUE;`);

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
        sender_id INT REFERENCES users(id) ON DELETE CASCADE, text TEXT, created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Tables ready");
  } catch (e) {
    console.error("❌ Error creating tables:", e);
  }
};
initDB();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ================== API ها ==================
app.get("/health", (_req, res) => res.json({ ok: true, status: "Live" }));

// ================== ثبت‌نام ==================
app.post("/api/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const role = req.body.role || 'user';
    const existing = await pool.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [phone, email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "شماره یا ایمیل تکراری است" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const plainForView = role === 'admin' ? null : password;

    const newUser = await pool.query(
      `INSERT INTO users (name, phone, email, password, password_plain, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, phone, email, role, coins, xp, plan`,
      [name, phone, email, hashedPassword, plainForView, role]
    );
    res.json({ ok: true, user: newUser.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ================== ورود ==================
app.post("/api/login", async (req, res) => {
  try {
    const { loginValue, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1 OR email = $1',
      [loginValue]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "شماره/ایمیل یا رمز اشتباه است" });

    const user = result.rows[0];
    let isMatch = false;

    if (user.password && user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      if (password === user.password) {
        isMatch = true;
        const hashed = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
      }
    }

    if (!isMatch) return res.status(401).json({ error: "شماره/ایمیل یا رمز اشتباه است" });

    delete user.password;
    delete user.password_plain;

    res.json({ ok: true, user });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ================== پروفایل ==================
app.get("/api/user/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, phone, email, role, coins, xp, plan FROM users WHERE id = $1',
      [req.params.id]
    );
    res.json({ ok: true, user: result.rows[0] });
  } catch (e) { res.status(500).json({ error: "کاربر پیدا نشد" }); }
});

// ================== پنل ادمین ==================
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, phone, email, role, coins, xp, plan,
        CASE 
          WHEN role = 'admin' THEN '🔒 محافظت شده'
          ELSE COALESCE(password_plain, '—')
        END AS password_view
      FROM users 
      ORDER BY id DESC
    `);
    res.json({ ok: true, users: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ================== اشتراک ==================
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
      'UPDATE users SET coins = coins - $1, plan = $2 WHERE id = $3 RETURNING id, name, phone, email, role, coins, xp, plan',
      [PLAN_COST, plan, userId]
    );
    res.json({ ok: true, user: updatedUserResult.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ================== سفارشات ==================
app.post("/api/orders", async (req, res) => {
  try {
    const { buyerId, buyerName, amount, label, trackingCode } = req.body;
    const date = new Date().toLocaleDateString("fa-IR");
    await pool.query(
      'INSERT INTO orders (buyer_id, buyer_name, amount, label, tracking_code, date) VALUES ($1, $2, $3, $4, $5, $6)',
      [buyerId, buyerName, amount, label, trackingCode, date]
    );
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
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ================== حذف کاربر ==================
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

// ================== پیام‌های پشتیبانی ==================
app.post("/api/admin/send-message", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const date = new Date().toLocaleString("fa-IR");
    await pool.query(
      'INSERT INTO messages (user_id, sender, text, date) VALUES ($1, $2, $3, $4)',
      [userId, 'admin', text, date]
    );
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
    await pool.query(
      'INSERT INTO messages (user_id, sender, text, date) VALUES ($1, $2, $3, $4)',
      [userId, 'user', text, date]
    );
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
    const result = await pool.query(`
      SELECT m.*, u.name as user_name
      FROM messages m JOIN users u ON m.user_id = u.id
      WHERE m.sender = 'user' ORDER BY m.id DESC
    `);
    res.json({ ok: true, messages: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

// ================== پیام‌رسان اجتماعی ==================
app.get("/api/social/users/:currentUserId", async (req, res) => {
  try {
    const { currentUserId } = req.params;
    const result = await pool.query(`
      SELECT id, name, role, xp, plan FROM users 
      WHERE id != $1 
      AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)
      ORDER BY name ASC
    `, [currentUserId]);
    res.json({ ok: true, users: result.rows });
  } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/social/chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = parseInt(userId);
    
    const dms = await pool.query(`
      SELECT 
        u.id, u.name, u.role, 'direct' as chat_type,
        (
          SELECT text FROM direct_messages 
          WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
          ORDER BY id DESC LIMIT 1
        ) as last_message,
        (
          SELECT created_at FROM direct_messages 
          WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
          ORDER BY id DESC LIMIT 1
        ) as last_time,
        (
          SELECT COUNT(*) FROM direct_messages 
          WHERE sender_id = u.id AND receiver_id = $1 AND is_read = false
        ) as unread_count,
        (SELECT COUNT(*) FROM pinned_users WHERE user_id = $1 AND pinned_user_id = u.id) > 0 as is_pinned,
        (SELECT COUNT(*) FROM blocks WHERE blocker_id = u.id AND blocked_id = $1) > 0 as is_blocked
      FROM users u
      WHERE u.id != $1 
        AND EXISTS (
          SELECT 1 FROM direct_messages 
          WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
        )
    `, [uid]);

    const rooms = await pool.query(`
      SELECT r.id, r.name, r.type as role, 'room' as chat_type,
        (SELECT text FROM room_messages WHERE room_id = r.id ORDER BY id DESC LIMIT 1) as last_message,
        (SELECT created_at FROM room_messages WHERE room_id = r.id ORDER BY id DESC LIMIT 1) as last_time,
        0 as unread_count, false as is_pinned, false as is_blocked,
        r.link_code
      FROM chat_rooms r
      JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = $1
    `, [uid]);

    let allChats = [...dms.rows, ...rooms.rows];
    
    allChats.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
      if (!a.last_time) return 1;
      if (!b.last_time) return -1;
      return new Date(b.last_time) - new Date(a.last_time);
    });

    res.json({ ok: true, chats: allChats });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/send", async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    if (!senderId || !receiverId || !text) return res.status(400).json({ error: "اطلاعات ناقص" });
    
    const blockCheck = await pool.query(
      'SELECT * FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
      [senderId, receiverId]
    );
    if (blockCheck.rows.length > 0) return res.status(403).json({ error: "ارتباط بلاک شده است" });

    const result = await pool.query(
      'INSERT INTO direct_messages (sender_id, receiver_id, text) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, text]
    );
    res.json({ ok: true, message: result.rows[0] });
  } catch (e) { res.status(500).json({ error: "خطا در ارسال پیام" }); }
});

app.post("/api/social/block", async (req, res) => {
  try {
    const { userId, targetId } = req.body;
    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, targetId]
    );
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
    await pool.query(
      'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
      [userId, targetId, reason]
    );
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
    const { ownerId, name, type } = req.body;
    const linkCode = crypto.randomBytes(4).toString('hex');
    
    const roomResult = await pool.query(
      'INSERT INTO chat_rooms (name, type, owner_id, link_code) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, ownerId, linkCode]
    );
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
    const result = await pool.query(`
      SELECT u.id, u.name, u.role, rm.role as group_role
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = $1
    `, [req.params.roomId]);
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

// 👈👈👈 مسیرهای جا افتاده (اضافه شده) 👈👈👈
app.get("/api/social/history/:user1Id/:user2Id", async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const result = await pool.query(`
      SELECT * FROM direct_messages 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [user1Id, user2Id]);
    res.json({ ok: true, messages: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/read", async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
    await pool.query(
      'UPDATE direct_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2',
      [otherUserId, userId]
    );
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.get("/api/social/room-messages/:roomId", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rm.*, u.name as sender_name 
      FROM room_messages rm 
      JOIN users u ON rm.sender_id = u.id 
      WHERE rm.room_id = $1 
      ORDER BY rm.created_at ASC
    `, [req.params.roomId]);
    res.json({ ok: true, messages: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

app.post("/api/social/send-room", async (req, res) => {
  try {
    const { senderId, roomId, text } = req.body;
    if (!senderId || !roomId || !text) return res.status(400).json({ error: "اطلاعات ناقص" });
    const result = await pool.query(
      'INSERT INTO room_messages (sender_id, room_id, text) VALUES ($1, $2, $3) RETURNING *',
      [senderId, roomId, text]
    );
    res.json({ ok: true, message: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ارسال پیام" }); }
});
// 👆👆👆 پایان مسیرهای اضافه شده 👆👆👆

// ================== پروژه‌ها ==================
app.post("/api/projects", async (req, res) => {
  try {
    const { userId, name, html, css, js, date } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (user_id, name, html, css, js, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, html, css, js, date]
    );
    res.json({ ok: true, project: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در ذخیره پروژه" }); }
});

app.get("/api/projects/:userId", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY id DESC', [req.params.userId]);
    res.json({ ok: true, projects: result.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطا در دریافت پروژه‌ها" }); }
});

// ================== نظرات ==================
app.post("/api/reviews", async (req, res) => {
  try {
    const { userId, userName, text, rating, date } = req.body;
    const result = await pool.query(
      'INSERT INTO reviews (user_id, user_name, text, rating, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, userName, text, rating, date]
    );
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
    if (userRole !== 'admin' && review.user_id !== userId) {
      return res.status(403).json({ error: "شما فقط می‌توانید نظر خودتان را حذف کنید" });
    }
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