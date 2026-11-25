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

if (!GROQ_API_KEY) { console.error("❌ GROQ_API_KEY تنظیم نشده است"); process.exit(1); }
if (!SUPABASE_DB_URL) { console.error("❌ SUPABASE_DB_URL تنظیم نشده است"); process.exit(1); }

const pool = new Pool({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

pool.connect().then(() => console.log("✅ Connected to Supabase (PostgreSQL)")).catch(err => console.error("❌ Supabase Connection Error:", err));

const initDB = async () => {
  try {
    // جدول کاربران
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
    
    // ... (بقیه جدول‌ها: orders, projects, reviews, messages, direct_messages, blocks, reports, pinned_users)

    // 👈 جدول گروه‌ها با ستون‌های جدید
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY, name VARCHAR(255), type VARCHAR(50) DEFAULT 'group',
        owner_id INT REFERENCES users(id) ON DELETE CASCADE, link_code VARCHAR(50) UNIQUE,
        avatar TEXT DEFAULT '', description TEXT DEFAULT '', created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS link_code VARCHAR(50) UNIQUE;`);
    // 👈 اضافه کردن ستون‌های جدید به جدول موجود
    await pool.query(`ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);

    // ... (بقیه جدول‌ها: room_members, room_messages, deleted_messages, reactions, advertisements, ad_requests)

    console.log("✅ Tables ready");
  } catch (e) { console.error("❌ Error creating tables:", e); }
};
initDB();

// ... (تنظیمات express و cors)

// ================== API ها ==================

// 👈 API آپدیت پروفایل کاربر (اصلاح شده)
app.post("/api/user/update-profile", async (req, res) => {
  try {
    const { userId, name, bio, avatar } = req.body;
    const result = await pool.query(
      `UPDATE users SET 
        name = COALESCE(NULLIF($1, ''), name), 
        bio = COALESCE($2, bio), 
        avatar = COALESCE($3, avatar) 
       WHERE id = $4 
       RETURNING id, name, phone, email, role, coins, xp, plan, bio, avatar`,
      [name, bio, avatar, userId]
    );
    res.json({ ok: true, user: result.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// 👈 API ساخت گروه (اصلاح شده)
app.post("/api/social/create-room", async (req, res) => {
  try {
    const { ownerId, name, type, description, avatar } = req.body;
    const linkCode = crypto.randomBytes(4).toString('hex');
    const roomResult = await pool.query(
      'INSERT INTO chat_rooms (name, type, owner_id, link_code, description, avatar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, type, ownerId, linkCode, description || '', avatar || '']
    );
    const room = roomResult.rows[0];
    await pool.query('INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3)', [room.id, ownerId, 'admin']);
    res.json({ ok: true, room });
  } catch (e) { console.error(e); res.status(500).json({ error: "خطای سرور" }); }
});

// ... (بقیه API ها: send, receive, block, report, pin, etc.)
