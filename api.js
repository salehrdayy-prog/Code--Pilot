const API_BASE_URL = "https://code-pilot-5.onrender.com/api";

async function apiRequest(endpoint, method = "GET", body = null) {
  try {
    const options = { method, headers: { "Content-Type": "application/json" } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "خطا در ارتباط با سرور" };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: "خطا در شبکه: " + err.message };
  }
}

async function registerUser(name, phone, email, password) { return await apiRequest("/register", "POST", { name, phone, email, password }); }
async function loginUser(loginValue, password) { return await apiRequest("/login", "POST", { loginValue, password }); }
async function getAllUsers() { return await apiRequest("/admin/users"); }
async function createCoinOrder(buyerId, buyerName, amount, label, trackingCode) { return await apiRequest("/orders", "POST", { buyerId, buyerName, amount, label, trackingCode }); }
async function getAllOrders() { return await apiRequest("/admin/orders"); }
async function approveCoinOrder(orderId) { return await apiRequest("/admin/approve", "POST", { orderId }); }
async function deleteOrderAPI(orderId) { return await apiRequest("/admin/orders/delete", "POST", { orderId }); }
async function deleteUserAPI(userId) { return await apiRequest("/admin/users/delete", "POST", { userId }); }
async function saveProjectToDB(userId, name, html, css, js, date) { return await apiRequest("/projects", "POST", { userId, name, html, css, js, date }); }
async function getUserProjects(userId) { return await apiRequest(`/projects/${userId}`); }
async function submitReview(userId, userName, text, rating, date) { return await apiRequest("/reviews", "POST", { userId, userName, text, rating, date }); }
async function getAllReviews() { return await apiRequest("/reviews"); }
async function deleteReview(reviewId, userId, userRole) { return await apiRequest("/reviews/delete", "POST", { reviewId, userId, userRole }); }
async function likeReviewAPI(reviewId, action) { return await apiRequest("/reviews/like", "POST", { reviewId, action }); }
async function upgradeSubscription(userId, plan) { return await apiRequest("/subscribe", "POST", { userId, plan }); }

// 👈 توابع جدید پیام‌ها
async function sendMessageToUser(userId, text) { return await apiRequest("/admin/send-message", "POST", { userId, text }); }
async function getUserMessages(userId) { return await apiRequest(`/messages/${userId}`); }
async function markMessageAsRead(messageId) { return await apiRequest("/messages/read", "POST", { messageId }); }
async function replyToAdmin(userId, text) { return await apiRequest("/messages/reply", "POST", { userId, text }); }
async function deleteUserMessage(messageId) { return await apiRequest("/messages/delete", "POST", { messageId }); }
async function getAllUserMessages() { return await apiRequest("/admin/messages"); }