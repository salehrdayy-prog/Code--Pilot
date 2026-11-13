let rating = 0;
let currentUser = null;

function setRating(r){
  rating = r;
  document.querySelectorAll(".stars span").forEach((s,i)=>{
    s.classList.toggle("active", i < r);
  });
}

// ================= ثبت نظر =================
async function addReview(){
  const text = document.getElementById("review-input")?.value;
  let name = document.getElementById("review-name")?.value;
  
  if (!name && currentUser) name = currentUser.name;
  if (!name) name = "👤 کاربر";

  if(!text || !text.trim()){
    showToast("یه چیزی بنویس 😑","error");
    return;
  }

  const userId = currentUser ? currentUser.id : null;
  const date = new Date().toLocaleString("fa-IR");

  const btn = document.querySelector('.review-box button');
  if(btn) { btn.disabled = true; btn.innerText = "در حال ارسال..."; }

  const result = await submitReview(userId, name, text, rating, date);

  if (result.ok) {
    document.getElementById("review-input").value="";
    rating=0;
    document.querySelectorAll(".stars span").forEach(s => s.classList.remove("active"));
    loadReviews();
    if(btn) { btn.disabled = false; btn.innerText = "ارسال نظر 🚀"; }
  } else {
    alert("خطا در ارسال نظر: " + result.error);
    if(btn) { btn.disabled = false; btn.innerText = "ارسال نظر 🚀"; }
  }
}

// ================= نمایش نظرات =================
async function loadReviews(){
  const list = document.getElementById("reviews-list");
  if(!list) return;

  currentUser = JSON.parse(localStorage.getItem('loggedInUser'));

  list.innerHTML = `<p style="text-align:center; color:#aaa;">در حال دریافت نظرات...</p>`;

  const result = await getAllReviews();
  
  if (!result.ok) {
    list.innerHTML = `<p style="text-align:center; color:#f85149;">خطا در دریافت نظرات</p>`;
    return;
  }

  const reviews = result.data.reviews;
  list.innerHTML = "";

  if (reviews.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:#aaa;">هنوز نظری ثبت نشده است.</p>`;
    return;
  }

  reviews.forEach(r => {
    const isOwner = currentUser && (currentUser.id === r.user_id || currentUser.role === 'admin');
    const isLiked = r.likes > 0; // برای سادگی، اگر لایک داشت قرمز نشون میدیم
    
    const div = document.createElement("div");
    div.className = "review-card";
    div.innerHTML = `
      <div class="review-header">
        <b>${r.user_name}</b>
        <div class="review-actions">
          <span class="like ${isLiked ? 'liked' : ''}" onclick="likeReview(${r.id}, ${r.likes})">❤️ ${r.likes}</span>
          ${isOwner ? `<span onclick="deleteMyReview(${r.id})" style="cursor:pointer; color:#f85149; font-weight:bold; margin-right:10px;" title="حذف نظر">🗑</span>` : ''}
        </div>
      </div>
      <div>${"⭐".repeat(r.rating)}</div>
      <p>${r.text}</p>
      <small>${r.date}</small>
    `;
    list.appendChild(div);
  });
}

// ================= حذف نظر =================
async function deleteMyReview(reviewId) {
  if (!confirm('آیا از حذف این نظر مطمئن هستید؟')) return;

  const userId = currentUser ? currentUser.id : null;
  const userRole = currentUser ? currentUser.role : 'user';

  const result = await deleteReview(reviewId, userId, userRole);

  if (result.ok) {
    showToast('🗑️ نظر شما حذف شد', 'success');
    loadReviews();
  } else {
    alert('خطا در حذف: ' + result.error);
  }
}

// ================= لایک =================
async function likeReview(id, currentLikes){
  const isLiked = event.target.classList.contains('liked');
  const action = isLiked ? 'unlike' : 'like';
  
  const result = await likeReviewAPI(id, action);

  if (result.ok) {
    event.target.classList.toggle('liked');
    event.target.innerText = `❤️ ${result.data.likes}`;
  } else {
    alert("خطا در ثبت لایک");
  }
}

// اجرا فقط اگر صفحه reviews باشه
document.addEventListener("DOMContentLoaded", ()=>{
  loadReviews();
});