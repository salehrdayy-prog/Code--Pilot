// ============================================================
//  api-client.js — ارتباط مرورگر با سرور AI
//  کلید هرگز اینجا نیست؛ فقط به سرور خودت وصل می‌شود.
// ============================================================

const AI_ENDPOINT =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api/chat"
    : "https://YOUR-SERVER.onrender.com/api/chat";

/**
 * ارسال پیام به سرور AI
 * @param {string} message
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @returns {Promise<{ok: boolean, reply?: string, error?: string}>}
 */
async function askAI(message, history = []) {
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: data.error || `خطای ${res.status}` };
    }
    if (!data.reply) {
      return { ok: false, error: "پاسخ خالی" };
    }
    return { ok: true, reply: data.reply };
  } catch (err) {
    return { ok: false, error: "اتصال به سرور برقرار نشد" };
  }
}