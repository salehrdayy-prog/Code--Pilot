document.addEventListener("DOMContentLoaded", () => {

  const passwordInput = document.getElementById("newpass");
  const rulesBox = document.querySelector(".password-rules");

  // اول مخفی
  rulesBox.style.display = "none";

  function toggleRule(id, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.color = ok ? "#00c853" : "#ff3d00";
  }

  // فوکوس
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

  });

  // خروج
  passwordInput.addEventListener("blur", () => {
    if (!passwordInput.value) {
      rulesBox.style.display = "none";
    }
  });

});


// ======================
// 🔁 ریست پسورد
// ======================
function resetPass(){

  const contact = document.getElementById("contact").value.trim();
  const newpass = document.getElementById("newpass").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  let user = users.find(u => 
    u.phone === contact || u.email === contact
  );

  if(!user){
    alert("کاربری پیدا نشد");
    return;
  }

  user.password = newpass;

  localStorage.setItem("users", JSON.stringify(users));

  alert("رمز با موفقیت تغییر کرد");

  window.location.href = "login.html";
}