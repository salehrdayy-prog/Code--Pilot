document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rulesBox = document.querySelector(".password-rules");

  // 👈 تابع ساخت ادمین پیش‌فرض
  async function createDefaultAdmin() {
    const res = await apiRequest('/admin/users');
    if (res.ok && res.data.users) {
      const hasAdmin = res.data.users.find(u => u.role === 'admin');
      if (!hasAdmin) {
        await apiRequest('/register', 'POST', {
          name: 'Admin',
          phone: '09876543210',
          email: 'admin@gmail.com',
          password: '654321',
          role: 'admin' // نقش ادمین رو به سرور می‌فرستیم
        });
        console.log('✅ Default admin created');
      }
    }
  }
  createDefaultAdmin();

  // ===== قوانین پسورد =====
  if (passwordInput) {
    passwordInput.addEventListener("focus", () => {
      if (passwordInput.value) rulesBox.style.display = "block";
    });

    passwordInput.addEventListener("input", () => {
      const value = passwordInput.value;
      if (!value) { rulesBox.style.display = "none"; return; }
      rulesBox.style.display = "block";

      const rules = {
        length: value.length >= 8,
        lower: /[a-z]/.test(value),
        upper: /[A-Z]/.test(value),
        number: /\d/.test(value),
        special: /[@#$%^&*!?]/.test(value),
      };

      const toggleRule = (id, ok) => {
        const el = document.getElementById(id);
        if (el) el.style.color = ok ? "#00c853" : "#ff3d00";
      };

      toggleRule("rule-length", rules.length);
      toggleRule("rule-lower", rules.lower);
      toggleRule("rule-upper", rules.upper);
      toggleRule("rule-number", rules.number);
      toggleRule("rule-special", rules.special);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.textContent = "در حال ثبت...";

    const name = nameInput.value.trim();
    const phone = phoneInput.value.replace(/\s/g, '');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const result = await registerUser(name, phone, email, password);

    if (!result.ok) {
      alert(result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = "ثبت نام";
      return;
    }

    const user = result.data.user;

    localStorage.setItem('session', JSON.stringify({ id: user.id, role: user.role }));
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    localStorage.setItem('username', user.name);
    localStorage.setItem('userXP', 0);
    localStorage.setItem('userCoins', 0);

    window.location.href = "assessment.html";
  });
});