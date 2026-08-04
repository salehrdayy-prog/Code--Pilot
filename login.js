document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById('loginForm');
  const loginInput = document.getElementById('loginInput');
  const passwordInput = document.getElementById('password');
  const btn = form.querySelector('button');
  
  const toggle = document.querySelector('.toggle-password');

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

  // ======================
  // 🧠 Storage
  // ======================
  const Storage = {
    getUsers: () => JSON.parse(localStorage.getItem('users')) || [],
    saveSession: (session) => localStorage.setItem('session', JSON.stringify(session)),
    saveCurrentUser: (user) => localStorage.setItem('loggedInUser', JSON.stringify(user))
  };

  // ======================
  // 🚀 Login
  // ======================
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    btn.disabled = true;

    const loginValue = loginInput.value.trim();
    const password = passwordInput.value;

    const users = Storage.getUsers();

    // 🔍 پیدا کردن کاربر
    const user = users.find(u =>
      (u.email === loginValue || u.phone === loginValue) &&
      u.password === password
    );

    // ❌ اگر پیدا نشد
    if (!user) {
      alert("اطلاعات ورود اشتباه است");
      btn.disabled = false;
      return;
    }

    // ❌ اگر بلاک بود
    if (user.status === "blocked") {
      alert("اکانت شما مسدود شده");
      btn.disabled = false;
      return;
    }

    // ✅ ساخت سشن
    const session = {
      id: user.id,
      role: user.role,
      loginTime: Date.now()
    };

    Storage.saveSession(session);
    Storage.saveCurrentUser(user);

    // 👑 ادمین
    if (user.role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    // ========== تنظیم مقدار اولیه XP و سکه ==========
    // اگر کاربر جدید است و این مقادیر وجود ندارند، تنظیم کن
    if (!localStorage.getItem('userXP')) {
        localStorage.setItem('userXP', '0');
    }
    if (!localStorage.getItem('userCoins')) {
        localStorage.setItem('userCoins', '0');
    }
    if (!localStorage.getItem('username')) {
        localStorage.setItem('username', user.name || 'کاربر');
    }
    // ============================================

    // ✅ کاربر عادی ➜ مستقیم ideas
    window.location.href = "ideas.html";

  });

});