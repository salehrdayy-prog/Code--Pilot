const AI_ENDPOINT = "https://code-pilot-1-34qk.onrender.com/api/chat";

async function askAI(message, history = []) {
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true, reply: data.reply };
  } catch (err) {
    // این خط، دلیل دقیق بلاک شدن رو بهت میگه
    return { ok: false, error: "خطای شبکه (CORS یا قطعی): " + err.message };
  }
}