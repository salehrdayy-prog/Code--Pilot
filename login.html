document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const form = $('loginForm');
  if (!form) return;

  const loginInput = $('loginInput');
  const passwordInput = $('password');
  const messageBox = $('loginMessage');
  const submitBtn = form.querySelector('button[type="submit"]');

  function showMessage(message, type = 'error') {
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.style.color = type === 'success' ? '#69db91' : '#ff8a80';
  }

  function setBusy(btn, busy, text) {
    if (!btn) return;
    btn.disabled = busy;
    btn.textContent = busy ? 'در حال بررسی...' : text;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginValue = loginInput?.value.trim() || '';
    const password = passwordInput?.value || '';

    if (!loginValue || !password) {
      showMessage('شماره/ایمیل و رمز عبور را وارد کنید.');
      return;
    }

    if (typeof loginUser !== 'function') {
      showMessage('تابع loginUser در api.js پیدا نشد.');
      return;
    }

    setBusy(submitBtn, true);
    showMessage('در حال ورود...', 'info');

    try {
      const result = await loginUser(loginValue, password);

      // ✅ دقت: نتیجه از apiRequest همیشه { ok, data } یا { ok:false, error } هست
      if (!result || !result.ok) {
        const msg = result?.error || result?.data?.error || 'خطا در ورود';
        showMessage(msg);
        setBusy(submitBtn, false, 'ورود');
        return;
      }

      // ✅ data مستقیم user هست (چون server.js این‌طوری برمی‌گردونه)
      const user = result.data?.user || result.data;

      if (!user || !user.id) {
        showMessage('پاسخ سرور معتبر نیست.');
        setBusy(submitBtn, false, 'ورود');
        return;
      }

      // ذخیره در localStorage
      localStorage.setItem('session', JSON.stringify({
        id: user.id,
        role: user.role || 'user'
      }));
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      localStorage.setItem('username', user.name || 'کاربر');
      localStorage.setItem('userXP', String(user.xp ?? 0));
      localStorage.setItem('userCoins', String(user.coins ?? 0));
      localStorage.setItem('userPlan', user.plan || 'free');
      localStorage.setItem('userLevel', user.role === 'admin' ? '🛡️ ادمین' : '🟢 مبتدی');
      localStorage.setItem('loggedIn', 'true');

      showMessage('ورود موفق! در حال انتقال...', 'success');

      setTimeout(() => {
        window.location.href = user.role === 'admin' ? 'admin.html' : 'ideas.html';
      }, 500);

    } catch (err) {
      console.error('Login error:', err);
      showMessage('خطای غیرمنتظره: ' + (err.message || err));
      setBusy(submitBtn, false, 'ورود');
    }
  });
});
