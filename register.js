document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById('registerForm');

  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const rulesBox = document.querySelector(".password-rules");

  // ======================
  // 🧠 Storage
  // ======================
  const Storage = {
    getUsers: () => JSON.parse(localStorage.getItem('users')) || [],
    saveUsers: (users) => localStorage.setItem('users', JSON.stringify(users)),
  };

  // ======================
  // 👑 ساخت ادمین
  // ======================
  let users = Storage.getUsers();

  if (!users.some(u => u.role === 'admin')) {
    users.push({
      id: 1,
      name: "Admin",
      phone: "09876543210",
      email: "admin@gmail.com",
      password: "654321",
      role: "admin",
      status: "active",
      createdAt: new Date().toLocaleDateString('fa-IR')
    });

    Storage.saveUsers(users);
  }

  // ======================
  // 🎯 helper
  // ======================
  function setMessage(el, input, text, status) {
    el.textContent = text;
    el.style.color = status === "valid" ? "#00c853" : "#ff3d00";

    input.classList.remove("valid", "invalid");
    input.classList.add(status);
  }

  function toggleRule(id, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.color = ok ? "#00c853" : "#ff3d00";
  }

  // ======================
  // 👤 NAME
  // ======================
  nameInput.addEventListener("input", () => {

    const name = nameInput.value.trim();
    const users = Storage.getUsers();
    const rule = document.getElementById("name-error");

    if (!name) {
      rule.textContent = "";
      nameInput.classList.remove("valid","invalid");
      return;
    }

    if (users.some(u => u.name === name)) {
      setMessage(rule, nameInput, "نام تکراری است", "invalid");
    } else {
      setMessage(rule, nameInput, "✔️ قابل استفاده است", "valid");
    }

  });

  // ======================
  // 📱 PHONE
  // ======================
  phoneInput.addEventListener("input", () => {

    const phone = phoneInput.value.replace(/\s/g,'');
    const users = Storage.getUsers();
    const rule = document.getElementById("phone-error");

    if (!phone) {
      rule.textContent="";
      phoneInput.classList.remove("valid","invalid");
      return;
    }

    if (!/^09\d{9}$/.test(phone)) {
      setMessage(rule, phoneInput, "شماره معتبر نیست", "invalid");
    } 
    else if (users.some(u => u.phone === phone)) {
      setMessage(rule, phoneInput, "شماره تکراری است", "invalid");
    } 
    else {
      setMessage(rule, phoneInput, "✔️ شماره معتبر است", "valid");
    }

  });

  // ======================
  // 📧 EMAIL
  // ======================
  emailInput.addEventListener("input", () => {

    const email = emailInput.value.trim();
    const users = Storage.getUsers();
    const rule = document.getElementById("email-error");

    if (!email) {
      rule.textContent="";
      emailInput.classList.remove("valid","invalid");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage(rule, emailInput, "ایمیل معتبر نیست", "invalid");
    } 
    else if (users.some(u => u.email === email)) {
      setMessage(rule, emailInput, "ایمیل تکراری است", "invalid");
    } 
    else {
      setMessage(rule, emailInput, "✔️ ایمیل معتبر است", "valid");
    }

  });

  // ======================
  // 🔐 PASSWORD (نسخه نهایی واقعی)
  // ======================

  // اول مخفی
  rulesBox.style.display = "none";

  // وقتی فوکوس کرد
  passwordInput.addEventListener("focus", () => {
    if (passwordInput.value) {
      rulesBox.style.display = "block";
    }
  });

  // تایپ
  passwordInput.addEventListener("input", () => {

    const value = passwordInput.value;

    if (!value) {
      rulesBox.style.display = "none";
      passwordInput.classList.remove("valid","invalid");
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

  // وقتی خارج شد
  passwordInput.addEventListener("blur", () => {
    if (!passwordInput.value) {
      rulesBox.style.display = "none";
    }
  });

  // ======================
  // 🚀 SUBMIT
  // ======================
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const phone = phoneInput.value.replace(/\s/g,'');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let users = Storage.getUsers();

    if (
      users.some(u =>
        u.phone === phone ||
        u.email === email ||
        u.name === name
      )
    ) {
      alert("اطلاعات تکراری است");
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      phone,
      email,
      password,
      role: "user",
      status: "active",
      createdAt: new Date().toLocaleDateString('fa-IR')
    };

    users.push(newUser);
    Storage.saveUsers(users);

    const session = {
      id: newUser.id,
      role: newUser.role,
      loginTime: Date.now()
    };

    localStorage.setItem('session', JSON.stringify(session));

    // ========== تنظیم مقدار اولیه XP و سکه ==========
    if (!localStorage.getItem('userXP')) {
        localStorage.setItem('userXP', '0');
    }
    if (!localStorage.getItem('userCoins')) {
        localStorage.setItem('userCoins', '0');
    }
    if (!localStorage.getItem('username')) {
        localStorage.setItem('username', name || 'کاربر');
    }
    // ============================================

    window.location.href = "assessment.html";
  });

});