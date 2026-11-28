document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById('loginForm');
const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('password');
const btn = form.querySelector('button');
const toggle = document.querySelector('.toggle-password');

// ===== نمایش پیام =====
function showMessage(text, type = 'error') {
let msgBox = document.getElementById('login-msg');
if (!msgBox) {
msgBox = document.createElement('div');
msgBox.id = 'login-msg';
msgBox.style.cssText = margin-top:15px;padding:12px 16px;border-radius:10px;font-size:14px;text-align:center;font-weight:500;transition:0.3s;line-height:1.6;display:none;;
form.appendChild(msgBox);
}
const styles = {
error: ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.4)', '#f87171'],
success: ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.4)', '#4ade80'],
info: ['rgba(139,92,246,0.15)', 'rgba(139,92,246,0.4)', '#c4b5fd']
};
const [bg, border, color] = styles[type] || styles.error;
msgBox.style.background = bg;
msgBox.style.border = 1px solid ${border};
msgBox.style.color = color;
msgBox.textContent = text;
msgBox.style.display = text ? 'block' : 'none';
}

// ===== فیلد کد امنیتی (مخفی به طور پیش‌فرض) =====
function ensureAdminSecretField() {
let field = document.getElementById('adminSecretWrap');
if (!field) {
field = document.createElement('div');
field.id = 'adminSecretWrap';
field.style.cssText = 'margin-top: 15px; display: none;';
field.innerHTML =   <input type="password" id="adminSecret" placeholder="🔐 کد امنیتی ۶ رقمی ادمین"    style="width:100%;padding:12px 16px;border-radius:10px;border:1px solid rgba(139,92,246,0.5);background:rgba(139,92,246,0.1);color:#e8edf5;font-size:14px;outline:none;font-family:inherit;">  ;
form.appendChild(field);
}
return field;
}

// ===== نمایش/مخفی رمز =====
if (toggle) {
toggle.addEventListener('click', () => {
if (passwordInput.type === "password") {
passwordInput.type = "text";
toggle.textContent = "🙈";
} else {
passwordInput.type = "password";
toggle.textContent = "👁️";
}
});
}

// ===== ارسال فرم =====
form.addEventListener('submit', async (e) => {
e.preventDefault();
if (btn.disabled) return;
showMessage('');

const rawLogin = loginInput.value.trim();  
const password = passwordInput.value;  
const adminSecretEl = document.getElementById('adminSecret');  
const adminSecret = adminSecretEl ? adminSecretEl.value.trim() : '';  

if (!rawLogin) return showMessage('⚠️ ایمیل یا شماره موبایل را وارد کنید', 'error');  
if (!password) return showMessage('⚠️ رمز عبور را وارد کنید', 'error');  

const loginValue = rawLogin.includes('@') ? rawLogin : rawLogin.replace(/\s/g, '');  

if (typeof loginUser !== 'function') {  
  return showMessage('❌ api.js لود نشده. صفحه را رفرش کنید.', 'error');  
}  

btn.disabled = true;  
btn.textContent = "در حال بررسی...";  
showMessage('⏳ در حال اتصال به سرور...', 'info');  

try {  
  // ارسال درخواست با کد امنیتی (اگه وجود داشت)  
  const controller = new AbortController();  
  const timeoutId = setTimeout(() => controller.abort(), 60000);  

  let result;  
  try {  
    const res = await fetch("https://code-pilot-5.onrender.com/api/login", {  
      method: "POST",  
      headers: { "Content-Type": "application/json" },  
      body: JSON.stringify({ loginValue, password, adminSecret }),  
      signal: controller.signal  
    });  
    clearTimeout(timeoutId);  
    const data = await res.json().catch(() => ({}));  
      
    // اگه سرور کد امنیتی خواست، فیلد رو نشون بده  
    if (res.status === 403 && data.needAdminSecret) {  
      const field = ensureAdminSecretField();  
      field.style.display = 'block';  
      document.getElementById('adminSecret').focus();  
      showMessage('🔐 این حساب ادمین است. لطفاً کد امنیتی را وارد کنید.', 'info');  
      btn.disabled = false;  
      btn.textContent = "ورود";  
      return;  
    }  

    if (!res.ok) {  
      result = { ok: false, error: data.error || "خطا در ارتباط با سرور" };  
    } else {  
      result = { ok: true, data };  
    }  
  } catch (fetchErr) {  
    clearTimeout(timeoutId);  
    if (fetchErr.name === 'AbortError') {  
      result = { ok: false, error: "سرور پاسخ نداد (احتمالاً در حال بیدار شدن است). لطفاً دوباره تلاش کنید." };  
    } else {  
      throw fetchErr;  
    }  
  }  

  if (!result.ok) {  
    return showMessage('❌ ' + result.error, 'error');  
  }  

  const user = result.data && result.data.user;  
  if (!user || !user.id) {  
    return showMessage('❌ پاسخ سرور نامعتبر است.', 'error');  
  }  

  // ذخیره در حافظه  
  localStorage.setItem('session', JSON.stringify({ id: user.id, role: user.role || 'user' }));  
  localStorage.setItem('loggedInUser', JSON.stringify(user));  
  localStorage.setItem('username', user.name || 'کاربر');  
  localStorage.setItem('userXP', user.xp || 0);  
  localStorage.setItem('userCoins', user.coins || 0);  
  localStorage.setItem('userPlan', user.plan || 'free');  
  localStorage.setItem('userLevel', user.role === 'admin' ? '🛡️ ادمین' : '🟢 مبتدی');  
  localStorage.setItem('loggedIn', 'true');  

  showMessage('✅ ورود موفق! در حال انتقال...', 'success');  

  setTimeout(() => {  
    if (user.role === "admin") window.location.href = "admin.html";  
    else window.location.href = "ideas.html";  
  }, 500);  

} catch (err) {  
  console.error('🔴 خطا:', err);  
  showMessage('❌ خطای شبکه: ' + err.message, 'error');  
} finally {  
  btn.disabled = false;  
  btn.textContent = "ورود";  
}

});
});
