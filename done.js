<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>پروژه آماده شد</title>

<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="themes.css">

<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:'Vazirmatn',sans-serif;
}

body{
  background: radial-gradient(circle at top,#0a0a0a,#000);
  color:white;
  overflow-x:hidden;
}

canvas{
  position:fixed;
  top:0;
  left:0;
  z-index:0;
}

/* آواتار */
.avatar{
  position:fixed;
  top:15px;
  left:15px;
  width:45px;
  height:45px;
  border-radius:50%;
  background:#222;
  display:flex;
  align-items:center;
  justify-content:center;
  background-size:cover;
  background-position:center;
  z-index:10;
  overflow:hidden;
  font-size:24px;
  cursor:pointer;
}

/* منو همبرگر */
.menu-toggle{
  position:fixed;
  top:15px;
  right:15px;
  width:45px;
  height:45px;
  border-radius:12px;
  background:#111;
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:10;
  cursor:pointer;
  font-size:24px;
  border:none;
  color:white;
}

/* منوی کناری */
.side-menu{
  position:fixed;
  top:0;
  right:-280px;
  width:260px;
  height:100%;
  background:#111;
  padding:20px;
  z-index:20;
  transition:0.3s;
  overflow-y:auto;
  border-left:1px solid #333;
}

.side-menu.open{
  right:0;
}

.menu-overlay{
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background:rgba(0,0,0,0.6);
  z-index:15;
  display:none;
}

.menu-overlay.show{
  display:block;
}

.menu-header{
  margin-bottom:20px;
  padding-bottom:15px;
  border-bottom:1px solid #333;
}

.menu-header span{
  display:block;
  margin:5px 0;
}

.menu-level{
  font-size:14px;
  color:#aaa;
}

.side-menu a{
  display:block;
  padding:12px 0;
  color:#ddd;
  text-decoration:none;
  border-bottom:1px solid #222;
  transition:0.2s;
}

.side-menu a:hover{
  color:#a855f7;
  padding-right:10px;
}

/* بقیه استایل‌ها */
.container{
  position:relative;
  z-index:2;
  text-align:center;
  padding:80px 15px 30px;
}

.emoji{
  font-size:60px;
  margin-bottom:10px;
}

h1{
  font-size:32px;
}

.subtitle{
  margin-top:10px;
  color:#ccc;
}

.project{
  margin:25px auto;
  padding:18px;
  width:90%;
  border-radius:20px;
  background:rgba(128,0,255,0.15);
  border:1px solid rgba(180,100,255,0.4);
  backdrop-filter: blur(10px);
  box-shadow:0 0 20px rgba(140,0,255,0.4);
}

.section-title{
  margin-top:30px;
}

#scores{
  display:flex;
  gap:10px;
  margin-top:15px;
  overflow-x:auto;
  justify-content:center;
  flex-wrap:wrap;
}

.score-card{
  min-width:110px;
  background:#111;
  border-radius:15px;
  padding:15px;
  text-align:center;
  flex:1;
}

.score-bar{
  height:6px;
  margin-top:10px;
  border-radius:10px;
  background:#333;
}

.score-fill{
  height:100%;
  border-radius:10px;
  background:linear-gradient(90deg,#6a00ff,#b100ff);
}

#filesContainer{
  margin-top:15px;
  background:#111;
  border-radius:15px;
  padding:10px;
}

.file-item{
  display:flex;
  justify-content:space-between;
  padding:12px;
  border-bottom:1px solid #222;
}

.btn{
  width:95%;
  padding:15px;
  margin-top:15px;
  border-radius:14px;
  border:none;
  font-size:16px;
  cursor:pointer;
  transition:0.2s;
}

.primary{
  background:linear-gradient(45deg,#6a00ff,#b100ff);
  color:white;
}

.outline{
  background:#111;
  border:1px solid #333;
  color:white;
}

#soundBtn{
  position:fixed;
  bottom:20px;
  left:20px;
  z-index:5;
  background:#111;
  color:white;
  border:none;
  padding:10px;
  border-radius:10px;
  cursor:pointer;
}
</style>
</head>
<body>

<canvas id="confettiCanvas"></canvas>

<!-- آواتار و منو -->
<div class="avatar" id="page-avatar" onclick="goToProfile()">👤</div>
<button class="menu-toggle" onclick="toggleMenu()">☰</button>

<!-- منوی کناری -->
<div class="side-menu" id="side-menu">
  <div class="menu-header">
    <span id="menu-username">👤 کاربر</span>
    <span class="menu-level" id="menu-level">🟢 مبتدی</span>
  </div>
  <a href="dashboard.html">📁 پروژه‌های من</a>
  <a href="ideas.html">🏠 صفحه اصلی</a>
  <a href="practice.html">🎯 تمرین‌ها</a>
  <a href="reviews.html">📝 نظرات</a>
  <a href="contact.html">📞 ارتباط با ما</a>
  <a href="help.html">❓ راهنما</a>
  <a href="#" onclick="logout()">🚪 خروج</a>
</div>

<!-- اوورلی -->
<div class="menu-overlay" id="menu-overlay" onclick="toggleMenu()"></div>

<!-- دکمه صدا -->
<button id="soundBtn" onclick="toggleSound()">🔊</button>

<!-- محتوای اصلی -->
<div class="container">
  <div class="emoji">🎉</div>
  <h1>تبریک!</h1>
  <p class="subtitle">پروژه شما با موفقیت ساخته شد 🚀</p>

  <div class="project" id="projectName">سایت فروشگاهی</div>

  <h3 class="section-title">⭐ امتیازها</h3>
  <div id="scores"></div>

  <h3 class="section-title">📁 فایل‌ها</h3>
  <div id="filesContainer"></div>

  <button class="btn primary" onclick="downloadZip()">📥 دانلود ZIP</button>
  <button class="btn outline" onclick="saveProjectNow()">💾 ذخیره پروژه</button>
  <button class="btn outline" onclick="goHome()">🏠 بازگشت</button>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

<script>
// ========================
// 🚀 INIT
// ========================
window.onload = function() {
  loadProjectName();
  renderScores();
  renderFiles();
  startConfetti();
  loadAvatar();
  loadUserInfo();
};

// ========================
// 📌 PROJECT NAME
// ========================
function loadProjectName() {
  const name = localStorage.getItem("selectedIdea") || "پروژه من";
  document.getElementById("projectName").innerText = name;
}

// ========================
// 📊 SCORES
// ========================
function renderScores() {
  const scores = [
    { icon: "🎨", label: "خلاقیت", value: rand() },
    { icon: "⚡", label: "سرعت", value: rand() },
    { icon: "🎯", label: "دقت", value: rand() },
    { icon: "⭐", label: "امتیاز", value: rand() }
  ];

  const box = document.getElementById("scores");
  box.innerHTML = "";

  scores.forEach(s => {
    const el = document.createElement("div");
    el.className = "score-card";
    el.innerHTML = `
      <span>${s.icon}</span><br>
      <span>${s.label}</span><br>
      <span>${s.value}%</span>
      <div class="score-bar">
        <div class="score-fill" style="width:${s.value}%"></div>
      </div>
    `;
    box.appendChild(el);
  });
}

function rand() {
  return Math.floor(70 + Math.random() * 30);
}

// ========================
// 📦 FILES
// ========================
function renderFiles() {
  const html = localStorage.getItem("html") || "";
  const css = localStorage.getItem("css") || "";
  const js = localStorage.getItem("js") || "";

  const files = [
    { name: "index.html", size: getSize(html) },
    { name: "style.css", size: getSize(css) },
    { name: "script.js", size: getSize(js) }
  ];

  const container = document.getElementById("filesContainer");
  container.innerHTML = "";

  files.forEach(f => {
    const div = document.createElement("div");
    div.className = "file-item";
    div.innerHTML = `📄 ${f.name} <span>${f.size} KB</span>`;
    container.appendChild(div);
  });
}

function getSize(text) {
  return (new Blob([text]).size / 1024).toFixed(1);
}

// ========================
// 📥 DOWNLOAD ZIP
// ========================
async function downloadZip() {
  const zip = new JSZip();
  const html = localStorage.getItem("html") || "";
  const css = localStorage.getItem("css") || "";
  const js = localStorage.getItem("js") || "";
  const name = localStorage.getItem("selectedIdea") || "project";

  zip.file("index.html", wrapHtml(html, css, js));
  zip.file("style.css", css);
  zip.file("script.js", js);
  zip.file("README.txt", `پروژه: ${name}\nساخته شده با AI Builder 🚀`);

  const content = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = `${name}.zip`;
  a.click();
}

function wrapHtml(html, css, js) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${css}</style></head>
<body>${html}<script>${js}<\/script></body>
</html>`;
}

// ========================
// 💾 SAVE PROJECT
// ========================
function saveProjectNow() {
  let projects = JSON.parse(localStorage.getItem("projects") || "[]");
  const newProject = {
    name: localStorage.getItem("selectedIdea") || "پروژه جدید",
    html: localStorage.getItem("html") || "",
    css: localStorage.getItem("css") || "",
    js: localStorage.getItem("js") || "",
    date: new Date().toLocaleDateString("fa-IR")
  };
  projects.push(newProject);
  localStorage.setItem("projects", JSON.stringify(projects));
  alert("پروژه ذخیره شد 😎🔥");
}

// ========================
// 🏠 HOME
// ========================
function goHome() {
  window.location.href = "ideas.html";
}

// ========================
// 🎉 CONFETTI
// ========================
function startConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 6 + 3,
      speed: Math.random() * 3 + 1,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      p.y += p.speed;
      if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ========================
// 🔔 SOUND FUNCTIONS
// ========================
let isMuted = false;
const sound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

function playSound() {
  if (isMuted) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function toggleSound() {
  isMuted = !isMuted;
  document.getElementById("soundBtn").innerText = isMuted ? "🔇" : "🔊";
}

// ========================
// 🖼️ AVATAR
// ========================
function loadAvatar() {
  const avatarEl = document.getElementById("page-avatar");
  const saved = localStorage.getItem("userAvatar");
  if (saved) {
    avatarEl.style.backgroundImage = `url(${saved})`;
    avatarEl.style.backgroundSize = "cover";
    avatarEl.style.backgroundPosition = "center";
    avatarEl.style.backgroundColor = "transparent";
    avatarEl.innerText = "";
  } else {
    avatarEl.style.backgroundImage = "none";
    avatarEl.style.backgroundColor = "#222";
    avatarEl.innerText = "👤";
  }
}

function goToProfile() {
  window.location.href = "dashboard.html";
}

// ========================
// 👤 USER INFO
// ========================
function loadUserInfo() {
  const username = localStorage.getItem("username") || "کاربر";
  document.getElementById("menu-username").innerHTML = `👤 ${username}`;
  // سطح کاربری (مبتدی/پیشرفته)
  const level = localStorage.getItem("userLevel") || "🟢 مبتدی";
  document.getElementById("menu-level").innerText = level;
}

// ========================
// 📱 MENU TOGGLE
// ========================
function toggleMenu() {
  const menu = document.getElementById("side-menu");
  const overlay = document.getElementById("menu-overlay");
  menu.classList.toggle("open");
  overlay.classList.toggle("show");
}

// ========================
// 🚪 LOGOUT
// ========================
function logout() {
  localStorage.removeItem("username");
  localStorage.removeItem("userAvatar");
  localStorage.removeItem("userLevel");
  window.location.href = "index.html";
}

// ========================
// 🎵 AUTOPLAY (اولین کلیک)
// ========================
document.addEventListener("click", function() {
  playSound();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}, { once: true });

</script>
</body>
</html>