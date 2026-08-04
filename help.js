// ================= HELP PRO (FIXED) =================

// باز و بسته (فقط اگر acc-header وجود داشت)
document.addEventListener("click", function(e){

  const header = e.target.closest(".acc-header");
  if(!header) return;

  const item = header.parentElement;

  document.querySelectorAll(".acc-item").forEach(i=>{
    if(i !== item) i.classList.remove("active");
  });

  item.classList.toggle("active");
});


// 🔍 جستجو (سازگار با acc-item و step-card)
function searchHelp(){

  const input = document.getElementById("help-search");
  if(!input) return;

  const value = input.value.toLowerCase();

  // هر دو حالت رو پشتیبانی کن
  const items = document.querySelectorAll(".acc-item, .step-card");

  items.forEach(item=>{

    const text = item.innerText.toLowerCase();

    item.style.display = text.includes(value) ? "block" : "none";
  });
}


// 📌 باز کردن سریع (بدون باگ index)
function openPinned(index){

  const items = document.querySelectorAll(".acc-item");

  if(!items[index]) return;

  // بقیه رو ببند
  items.forEach(i=> i.classList.remove("active"));

  // همونو باز کن
  items[index].classList.add("active");

  items[index].scrollIntoView({
    behavior:"smooth",
    block:"center"
  });
}


// 💬 رفتن به تماس (ایمن‌تر)
function goToContact(){
  window.location.href = "contact.html";
}