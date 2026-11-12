document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById('registerForm');

  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const rulesBox = document.querySelector(".password-rules");

  // ======================
  // 👑 ساخت ادمین (همون کد قبلی)
  // ======================
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
          role: 'admin'
        });
        console.log('✅ Default admin created');
      }
    }
  }
  createDefaultAdmin();

  // ======================
  // 🎯 helper
  // ======================
  function setMessage(el, input, text, status) {
    if (!el || !input) return;
    el.textContent = text;
    el.style.color = status === "valid" ? "#00c853" : "#ff3d00";

    input.classList.remove("valid", "invalid");
    input.classList.add(status);
  }

  // ======================
  // 👤 NAME (اعتبارسنجی زنده)
  // ======================
  nameInput.addEventListener("input", async () => {
    const name = nameInput.value.trim();
    const rule = document.getElementById("name-error");

    if (!name) {
      setMessage(rule, nameInput, "", "");
      return;
    }

    if (name.length < 3) {
      setMessage(rule, nameInput, "نام باید حداقل ۳ حرف باشد", "invalid");
      return;
    }

    // چک کردن تکراری بودن از دیتابیس ابری
    const res = await apiRequest('/admin/users');
    if (res.ok && res.data.users) {
      const isDuplicate = res.data.users.some(u => u.name === name);
      if (isDuplicate) {
        setMessage(rule, nameInput, "نام تکراری است", "invalid");
      } else {
        setMessage(rule, nameInput, "✔️ قابل استفاده است", "valid");
      }
    }
  });

  // ======================
  // 📱 PHONE (اعتبارسنجی زنده)
  // ======================
  phoneInput.addEventListener("input", async () => {
    const phone = phoneInput.value.replace(/\s/g, '');
    const rule = document.getElementById("phone-error");

    if (!phone) {
      setMessage(rule, phoneInput, "", "");
      return;
    }

    if (!/^09\d{9}$/.test(phone)) {
      setMessage(rule, phoneInput, "شماره معتبر نیست", "invalid");
      return;
    }

    // چک کردن تکراری بودن از دیتابیس ابری
    const res = await apiRequest('/admin/users');
    if (res.ok && res.data.users) {
      const isDuplicate = res.data.users.some(u => u.phone === phone);
      if (isDuplicate) {
        setMessage(rule, phoneInput, "شماره تکراری است", "invalid");
      } else {
        setMessage(rule, phoneInput, "✔️ شماره معتبر است", "valid");
      }
    }
  });

  // ======================
  // 📧 EMAIL (اعتبارسنجی زنده)
  // ======================
  emailInput.addEventListener("input", async () => {
    const email = emailInput.value.trim();
    const rule = document.getElementById("email-error");

    if (!email) {
      setMessage(rule, emailInput, "", "");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage(rule, emailInput, "ایمیل معتبر نیست", "invalid");
      return;
    }

    // چک کردن تکراری بودن از دیتابیس ابری
    const res = await apiRequest('/admin/users');
    if (res.ok && res.data.users) {
      const isDuplicate = res.data.users.some(u => u.email === email);
      if (isDuplicate) {
        setMessage(rule, emailInput, "ایمیل تکراری است", "invalid");
      } else {
        setMessage(rule, emailInput, "✔️ ایمیل معتبر است", "valid");
      }
    }
  });

  // ======================
  // 🔐 PASSWORD (اعتبارسنجی زنده)
  // ======================
  rulesBox.style.display = "none";

  passwordInput.addEventListener("focus", () => {
    if (passwordInput.value) rulesBox.style.display = "block";
  });

  passwordInput.addEventListener("input", () => {
    const value = passwordInput.value;

    if (!value) {
      rulesBox.style.display = "none";
      passwordInput.classList.remove("valid", "invalid");
      return;
    }

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

    if (Object.values(rules).every(v => v)) {
      passwordInput.classList.add("valid");
      passwordInput.classList.remove("invalid");
    } else {
      passwordInput.classList.add("invalid");
      passwordInput.classList.remove("valid");
    }
  });

  passwordInput.addEventListener("blur", () => {
    if (!passwordInput.value) rulesBox.style.display = "none";
  });

  // ======================
  // 🚀 SUBMIT
  // ======================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const phone = phoneInput.value.replace(/\s/g, '');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const submitBtn = form.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.textContent = "در حال ثبت...";

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