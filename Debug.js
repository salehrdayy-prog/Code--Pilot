// debug.js - نمایش باگ‌ها روی خود صفحه
(function () {
  // پنل دیباگ رو می‌سازیم
  const panel = document.createElement('div');
  panel.id = '__debugPanel';
  panel.style.cssText = `
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-height: 45vh;
    background: #0a0a0a;
    color: #0f0;
    font-family: monospace;
    font-size: 11px;
    padding: 8px;
    overflow-y: auto;
    z-index: 999999;
    border-top: 2px solid #0f0;
    direction: ltr;
    text-align: left;
  `;
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <strong style="color:#0ff">🐛 DEBUG PANEL</strong>
      <span>
        <button id="__debugClear" style="background:#333;color:#fff;border:0;padding:3px 8px;border-radius:4px;font-size:10px;margin-left:4px">Clear</button>
        <button id="__debugClose" style="background:#c00;color:#fff;border:0;padding:3px 8px;border-radius:4px;font-size:10px">X</button>
      </span>
    </div>
    <div id="__debugLog"></div>
  `;

  function append(text, color) {
    const log = document.getElementById('__debugLog');
    if (!log) return;
    const line = document.createElement('div');
    line.style.color = color || '#0f0';
    line.style.margin = '2px 0';
    line.style.padding = '2px 4px';
    line.style.borderBottom = '1px solid #1a1a1a';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    panel.scrollTop = panel.scrollHeight;
  }

  // بعد از لود body اضافه می‌کنیم
  if (document.body) {
    document.body.appendChild(panel);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(panel));
  }

  document.getElementById('__debugClose').onclick = () => panel.remove();
  document.getElementById('__debugClear').onclick = () => {
    document.getElementById('__debugLog').innerHTML = '';
  };

  // ===== 1. گرفتن همه خطاهای JS =====
  window.addEventListener('error', (e) => {
    append(
      `❌ JS ERROR: ${e.message} @ ${e.filename ? e.filename.split('/').pop() : '?'}:${e.lineno}`,
      '#f55'
    );
  });

  // ===== 2. گرفتن خطاهای Promise =====
  window.addEventListener('unhandledrejection', (e) => {
    append(
      `❌ PROMISE REJECTION: ${e.reason?.message || e.reason}`,
      '#f55'
    );
  });

  // ===== 3. لاگ همه fetchها =====
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '?';
    const method = args[1]?.method || 'GET';
    append(`📤 ${method} ${url}`, '#0ff');

    try {
      const res = await originalFetch.apply(this, args);
      const cloned = res.clone();
      let bodyText = '';
      try {
        bodyText = await cloned.text();
      } catch (e) {}
      const shortBody = bodyText.length > 200 ? bodyText.substring(0, 200) + '...' : bodyText;

      if (res.ok) {
        append(`📥 ${res.status} ${url} → ${shortBody}`, '#0f0');
      } else {
        append(`⚠️ ${res.status} ${url} → ${shortBody}`, '#ff0');
      }
      return res;
    } catch (err) {
      append(`❌ FETCH FAIL: ${url} → ${err.message}`, '#f55');
      throw err;
    }
  };

  // ===== 4. بررسی وجود توابع مهم =====
  window.addEventListener('load', () => {
    setTimeout(() => {
      append('🔍 بررسی توابع:', '#0ff');
      const funcs = ['apiRequest', 'requestLoginCode', 'verifyLoginCode', 'requestRegistrationCode', 'verifyRegistrationCode', 'wakeUpServer'];
      funcs.forEach(fn => {
        const exists = typeof window[fn] === 'function';
        append(
          `${exists ? '✅' : '❌'} ${fn}: ${exists ? 'موجود' : 'تعریف نشده'}`,
          exists ? '#0f0' : '#f55'
        );
      });

      // چک وجود دکمه‌ها
      append('🔍 بررسی دکمه‌ها:', '#0ff');
      ['requestCodeBtn', 'verifyCodeBtn', 'registerForm', 'loginForm'].forEach(id => {
        const el = document.getElementById(id);
        append(
          `${el ? '✅' : '❌'} #${id}: ${el ? 'موجود' : 'پیدا نشد'}`,
          el ? '#0f0' : '#f55'
        );
      });
    }, 1500);
  });

  // ===== 5. کلیک روی هر دکمه =====
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (target) {
      append(`🖱️ کلیک: "${target.textContent.trim()}" (id: ${target.id || '—'}, disabled: ${target.disabled})`, '#ff0');
    }
  }, true);

  // ===== 6. رصد پاک شدن input =====
  document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT') {
      append(`⌨️ input #${e.target.id}: "${e.target.value}"`, '#aaa');
    }
  }, true);

  append('✅ دیباگر فعال شد. حالا روی دکمه‌ها بزن...', '#0ff');
})();
