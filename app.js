// ==================== CONFIG ====================
// (اگر API_URL رو جایی استفاده می‌کنی، اینجا تنظیمش کن. فعلاً خالیه)
const API_URL = "";

// ==================== TOAST ====================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ==================== AVATAR ====================
document.addEventListener("DOMContentLoaded", () => {
  const avatarInput = document.getElementById("avatar-input");

  if (avatarInput) {
    avatarInput.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = function (e) {
        document.querySelectorAll(".user-avatar").forEach(a => {
          a.style.backgroundImage = `url(${e.target.result})`;
        });

        localStorage.setItem("avatar", e.target.result);
        showToast("عکس ذخیره شد ✅", "success");
      };

      reader.readAsDataURL(file);
    });
  }
});

function loadAvatar() {
  const saved = localStorage.getItem("avatar");
  if (!saved) return;

  document.querySelectorAll(".user-avatar").forEach(a => {
    a.style.backgroundImage = `url(${saved})`;
  });
}

// ==================== MENU ====================
function toggleMenu() {
  const menu = document.getElementById("side-menu");
  let overlay = document.getElementById("menu-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "menu-overlay";
    overlay.className = "menu-overlay";
    overlay.onclick = toggleMenu;
    document.body.appendChild(overlay);
  }

  if (menu) menu.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
}

// ==================== LOGOUT (اصلاح شده) ====================
function logout() {
  // پاک کردن اطلاعات ورود
  localStorage.removeItem('session');
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('username');
  localStorage.removeItem('userXP');
  localStorage.removeItem('userCoins');

  // انتقال به صفحه اصلی
  window.location.href = "index.html";
}

// ==================== STORAGE ====================
function getProjects() {
  try {
    return JSON.parse(localStorage.getItem("projects")) || [];
  } catch {
    return [];
  }
}

function saveProjects(data) {
  localStorage.setItem("projects", JSON.stringify(data));
}

// ==================== PROJECTS ====================
function loadProjects() {
  const list = document.getElementById("projects-list");
  if (!list) return;

  const projects = getProjects();

  if (!projects.length) {
    list.innerHTML = `<div class="empty-state">📭 پروژه‌ای نیست</div>`;
    return;
  }

  list.innerHTML = "";

  projects.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "project-card";

    div.innerHTML = `
      <h4>${p.name}</h4>
      <p>${p.date || "بدون تاریخ"}</p>
      <button class="delete-btn">🗑</button>
    `;

    const title = div.querySelector("h4");
    if (title) title.onclick = () => openProject(i);

    const delBtn = div.querySelector(".delete-btn");
    if (delBtn) delBtn.onclick = () => deleteProject(i);

    list.appendChild(div);
  });
}

function deleteProject(i) {
  const p = getProjects();
  p.splice(i, 1);
  saveProjects(p);

  showToast("حذف شد 🗑", "error");
  loadProjects();
  updateXP();
}

function openProject(i) {
  const p = getProjects()[i];
  if (!p) return;
  
  localStorage.setItem("selectedIdea", p.name);
  showToast("باز شد: " + p.name);

  setTimeout(() => {
    window.location.href = "build.html";
  }, 300);
}

// ==================== XP ====================
function updateXP() {
  const xp = getProjects().length * 10;

  let level = "🟢 مبتدی";
  if (xp >= 50) level = "🔵 متوسط";
  if (xp >= 100) level = "🟣 حرفه‌ای";

  const levelEl = document.getElementById("menu-level");
  if (levelEl) levelEl.innerText = level;
}

// ==================== THEME ====================
function toggleTheme() {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );

  showToast("تم تغییر کرد 🎨");
}

function loadTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
}

// ==================== USER ====================
function loadUser() {
  try {
    const data = JSON.parse(localStorage.getItem("ai_coder_user"));
    if (!data) return;

    const usernameEl = document.getElementById("menu-username");
    if (usernameEl) {
      usernameEl.innerText = data.contact || "کاربر";
    }
  } catch (e) {
    console.error("Error loading user:", e);
  }
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
  loadProjects();
  updateXP();
  loadTheme();
  loadAvatar();
});