const htmlEl = document.getElementById("html");
const cssEl = document.getElementById("css");
const jsEl = document.getElementById("js");

// ===== LOAD =====
window.onload = function(){
  const project = JSON.parse(localStorage.getItem("project"));

  if(project){
    htmlEl.value = project.html;
    cssEl.value = project.css;
    jsEl.value = project.js;
  }else{
    htmlEl.value = "<h1>Hello 👋</h1>";
  }

  run();
};


// ===== TABS =====
function showTab(tab,btn){
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");

  document.querySelectorAll("textarea").forEach(t=>t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
}


// ===== RUN (LIVE PREVIEW) =====
function run(){
  const code = `
  <html>
  <style>${cssEl.value}</style>
  <body>
  ${htmlEl.value}
  <script>${jsEl.value}<\/script>
  </body>
  </html>
  `;

  document.getElementById("frame").srcdoc = code;
}


// ===== AUTO LIVE (🔥 حرفه‌ای) =====
[htmlEl, cssEl, jsEl].forEach(el=>{
  el.addEventListener("input", ()=>{
    run();
  });
});


// ===== SAVE =====
function save(){
  const project = {
    html: htmlEl.value,
    css: cssEl.value,
    js: jsEl.value
  };

  localStorage.setItem("project", JSON.stringify(project));

  alert("✅ ذخیره شد");
}


// ===== THEME =====
function toggleTheme(){
  document.body.classList.toggle("light");
}