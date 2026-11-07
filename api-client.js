// ============================================================
//  api-client.js — ارتباط مرورگر با سرور AI
// ============================================================

const AI_ENDPOINT = "https://code-pilot-1-34qk.onrender.com/api/chat";

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