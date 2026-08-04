
// ==================== CONFIG ====================
const API_URL = "https://your-api.com";


// ==================== TOAST ====================
function showToast(message, type="info"){
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add("show"));

  setTimeout(()=>{
    toast.classList.remove("show");
    setTimeout(()=>toast.remove(),300);
  },2500);
}


// ==================== AVATAR ====================
document.addEventListener("DOMContentLoaded", ()=>{
  const avatarInput = document.getElementById("avatar-input");

  avatarInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      document.querySelectorAll(".user-avatar").forEach(a=>{
        a.style.backgroundImage = `url(${e.target.result})`;
      });

      localStorage.setItem("avatar", e.target.result);
      showToast("عکس ذخیره شد ✅","success");
    };

    reader.readAsDataURL(file);
  });
});

function loadAvatar(){
  const saved = localStorage.getItem("avatar");
  if(!saved) return;

  document.querySelectorAll(".user-avatar").forEach(a=>{
    a.style.backgroundImage = `url(${saved})`;
  });
}


// ==================== MENU ====================
function toggleMenu(){
  const menu = document.getElementById("side-menu");
  let overlay = document.getElementById("menu-overlay");

  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "menu-overlay";
    overlay.className = "menu-overlay";
    overlay.onclick = toggleMenu;
    document.body.appendChild(overlay);
  }

  menu?.classList.toggle("active");
  overlay.classList.toggle("active");
}


// ==================== LOGOUT ====================
function logout(){
  localStorage.clear();
  showToast("خارج شدی 👋");

  setTimeout(()=>{
    window.location.href = "index.html";
  },800);
}


// ==================== STORAGE ====================
function getProjects(){
  try{
    return JSON.parse(localStorage.getItem("projects")) || [];
  }catch{
    return [];
  }
}

function saveProjects(data){
  localStorage.setItem("projects", JSON.stringify(data));
}


// ==================== PROJECTS ====================
function loadProjects(){
  const list = document.getElementById("projects-list");
  if(!list) return;

  const projects = getProjects();

  if(!projects.length){
    list.innerHTML = `<div class="empty-state">📭 پروژه‌ای نیست</div>`;
    return;
  }

  list.innerHTML = "";

  projects.forEach((p,i)=>{
    const div = document.createElement("div");
    div.className = "project-card";

    div.innerHTML = `
      <h4>${p.name}</h4>
      <p>${p.date || "بدون تاریخ"}</p>
      <button class="delete-btn">🗑</button>
    `;

    div.querySelector("h4").onclick = ()=>openProject(i);
    div.querySelector(".delete-btn").onclick = ()=>deleteProject(i);

    list.appendChild(div);
  });
}

function deleteProject(i){
  const p = getProjects();
  p.splice(i,1);
  saveProjects(p);

  showToast("حذف شد 🗑","error");
  loadProjects();
  updateXP();
}

function openProject(i){
  const p = getProjects()[i];
  localStorage.setItem("selectedIdea", p.name);

  showToast("باز شد: " + p.name);

  setTimeout(()=>location.href="build.html",300);
}


// ==================== XP ====================
function updateXP(){
  const xp = getProjects().length * 10;

  let level="🟢 مبتدی";
  if(xp>=50) level="🔵 متوسط";
  if(xp>=100) level="🟣 حرفه‌ای";

  document.getElementById("menu-level")?.innerText=level;
}


// ==================== THEME ====================
function toggleTheme(){
  document.body.classList.toggle("dark");

  localStorage.setItem("theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );

  showToast("تم تغییر کرد 🎨");
}

function loadTheme(){
  if(localStorage.getItem("theme")==="dark"){
    document.body.classList.add("dark");
  }
}


// ==================== USER ====================
function loadUser(){
  try{
    const data = JSON.parse(localStorage.getItem("ai_coder_user"));
    if(!data) return;

    document.getElementById("menu-username")?.innerText =
      data.contact || "کاربر";
  }catch{}
}


// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", ()=>{
  loadUser();
  loadProjects();
  updateXP();
  loadTheme();
  loadAvatar();
});