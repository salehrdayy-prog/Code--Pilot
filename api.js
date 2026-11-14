const API_BASE_URL = "https://code-pilot-5.onrender.com/api";

// 👈 اضافه کردن Timeout و مدیریت خطای HTML
async function apiRequest(endpoint, method = "GET", body = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // ۶۰ ثانیه صبر برای بیدار شدن سرور

  try {
    const options = { 
        method, 
        headers: { "Content-Type": "application/json" },
        signal: controller.signal 
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    clearTimeout(timeoutId);
    
    // اول پاسخ رو به صورت متن می‌گیریم تا اگه HTML بود کرش نکنه
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (parseError) {
        // اگر پاسخ HTML بود (مثل خطای 502 رندر)
        console.error(`API Error on ${endpoint}:`, text.substring(0, 100));
        if (res.status === 502 || res.status === 503) {
            return { ok: false, error: "سرور در دسترس نیست (احتمالاً در حال بیدار شدن است). لطفاً کمی بعد تلاش کنید." };
        }
        return { ok: false, error: "پاسخ نامعتبر از سرور دریافت شد." };
    }

    if (!res.ok) return { ok: false, error: data.error || "خطا در ارتباط با سرور" };
    return { ok: true, data };

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
        return { ok: false, error: "سرور پاسخ نداد (احتمالاً در حال بیدار شدن است). لطفاً دوباره تلاش کنید." };
    }
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

async function sendMessageToUser(userId, text) { return await apiRequest("/admin/send-message", "POST", { userId, text }); }
async function getUserMessages(userId) { return await apiRequest(`/messages/${userId}`); }
async function markMessageAsRead(messageId) { return await apiRequest("/messages/read", "POST", { messageId }); }
async function replyToAdmin(userId, text) { return await apiRequest("/messages/reply", "POST", { userId, text }); }
async function deleteUserMessage(messageId) { return await apiRequest("/messages/delete", "POST", { messageId }); }
async function getAllUserMessages() { return await apiRequest("/admin/messages"); }

async function getSocialUsers(currentUserId) { return await apiRequest(`/social/users/${currentUserId}`); }
async function getSocialChats(userId) { return await apiRequest(`/social/chats/${userId}`); }
async function getSocialHistory(user1Id, user2Id) { return await apiRequest(`/social/history/${user1Id}/${user2Id}`); }
async function sendSocialMessage(senderId, receiverId, text) { return await apiRequest("/social/send", "POST", { senderId, receiverId, text }); }
async function markSocialAsRead(userId, otherUserId) { return await apiRequest("/social/read", "POST", { userId, otherUserId }); }

async function blockSocialUser(userId, targetId) { return await apiRequest("/social/block", "POST", { userId, targetId }); }
async function unblockSocialUser(userId, targetId) { return await apiRequest("/social/unblock", "POST", { userId, targetId }); }
async function reportSocialUser(userId, targetId, reason) { return await apiRequest("/social/report", "POST", { userId, targetId, reason }); }
async function pinSocialUser(userId, targetId) { return await apiRequest("/social/pin", "POST", { userId, targetId }); }

async function createSocialRoom(ownerId, name, type) { return await apiRequest("/social/create-room", "POST", { ownerId, name, type }); }
async function joinSocialRoom(userId, linkCode) { return await apiRequest("/social/join-room", "POST", { userId, linkCode }); }
async function getRoomMembers(roomId) { return await apiRequest(`/social/room-members/${roomId}`); }
async function deleteSocialRoom(roomId, userId) { return await apiRequest(`/social/room/${roomId}`, "DELETE", { userId }); }

async function getRoomMessages(roomId) { return await apiRequest(`/social/room-messages/${roomId}`); }
async function sendRoomMessage(senderId, roomId, text) { return await apiRequest("/social/send-room", "POST", { senderId, roomId, text }); }