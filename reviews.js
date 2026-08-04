// ================= REVIEW SYSTEM =================

let rating = 0;

function setRating(r){
  rating = r;

  document.querySelectorAll(".stars span").forEach((s,i)=>{
    s.classList.toggle("active", i < r);
  });
}

function getReviews(){
  return JSON.parse(localStorage.getItem("reviews")) || [];
}

function saveReviews(data){
  localStorage.setItem("reviews", JSON.stringify(data));
}

function addReview(){

  const text = document.getElementById("review-input")?.value;
  const name = document.getElementById("review-name")?.value || "👤 کاربر";

  if(!text || !text.trim()){
    showToast("یه چیزی بنویس 😑","error");
    return;
  }

  const reviews = getReviews();

  reviews.push({
    name,
    text,
    rating,
    likes:0,
    liked:false,
    date:new Date().toLocaleString("fa-IR")
  });

  saveReviews(reviews);

  document.getElementById("review-input").value="";
  rating=0;

  loadReviews();
}

function loadReviews(){

  const list = document.getElementById("reviews-list");
  if(!list) return;

  const reviews = getReviews();

  list.innerHTML="";

  reviews
    .map((r,i)=>({...r, realIndex:i}))
    .reverse()
    .forEach(r=>{

      const div=document.createElement("div");
      div.className="review-card";

      div.innerHTML=`
        <div class="review-header">
          <b>${r.name}</b>
          <div class="review-actions">
            <span class="like ${r.liked?'active':''}" onclick="likeReview(${r.realIndex})">❤️ ${r.likes}</span>
            <span onclick="deleteReview(${r.realIndex})">🗑</span>
          </div>
        </div>

        <div>${"⭐".repeat(r.rating)}</div>

        <p>${r.text}</p>

        <small>${r.date}</small>
      `;

      list.appendChild(div);
    });
}

function likeReview(i){
  let reviews=getReviews();

  reviews[i].liked=!reviews[i].liked;
  reviews[i].likes+=reviews[i].liked?1:-1;

  saveReviews(reviews);
  loadReviews();
}

function deleteReview(i){
  let reviews=getReviews();

  reviews.splice(i,1);

  saveReviews(reviews);
  loadReviews();
}

// اجرا فقط اگر صفحه reviews باشه
document.addEventListener("DOMContentLoaded", ()=>{
  loadReviews();
});