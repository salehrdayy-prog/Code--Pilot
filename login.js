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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = "در حال بررسی...";

    const loginValue = loginInput.value.trim();
    const password = passwordInput.value;

    // فراخوانی تابع از فایل api.js
    const result = await loginUser(loginValue, password);

    if (!result.ok) {
      alert(result.error);
      btn.disabled = false;
      btn.textContent = "ورود";
      return;
    }

    const user = result.data.user;

    // ذخیره سشن و اطلاعات کاربر در مرورگر
    localStorage.setItem('session', JSON.stringify({ id: user.id, role: user.role }));
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    localStorage.setItem('username', user.name || 'کاربر');
    localStorage.setItem('userXP', user.xp || 0);
    localStorage.setItem('userCoins', user.coins || 0);

    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "ideas.html";
    }
  });
});