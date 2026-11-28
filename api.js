const API_BASE_URL = "https://code-pilot-5.onrender.com/api";
const SERVER_BASE_URL = "https://code-pilot-5.onrender.com";

// بیدار کردن سرور Render قبل از درخواست اصلی
async function wakeUpServer() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);
    await fetch(`${SERVER_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeoutId);
    return true;
  } catch (e) {
    console.warn("wakeUpServer failed:", e.message);
    return false;
  }
}

// درخواست اصلی با تایم‌اوت ۹۰ ثانیه (سرور رو در نظر بگیر)
async function apiRequest(endpoint, method = "GET", body = null, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeout || 90000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const reqOptions = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      cache: "no-store"
    };

    if (body) reqOptions.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE_URL}${endpoint}`, reqOptions);
    const responseText = await res.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return { ok: false, error: "سرور در حال بیدار شدن است. لطفاً چند لحظه بعد دوباره تلاش کنید." };
      }
      return { ok: false, error: "پاسخ نامعتبر از سرور." };
    }

    if (!res.ok) {
      return {
        ok: false,
        data,
        status: res.status,
        error: data?.error || "خطا در ارتباط با سرور"
      };
    }

    return { ok: true, data };

  } catch (err) {
    if (err.name === "AbortError") {
      return { ok: false, error: "سرور پاسخ نداد. لطفاً چند لحظه بعد دوباره تلاش کنید." };
    }
    return { ok: false, error: "خطا در شبکه: " + err.message };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ====== احراز هویت ======
async function requestRegistrationCode(name, phone, email) {
  return await apiRequest("/auth/register/request", "POST", { name, phone, email }, { timeout: 90000 });
}

async function verifyRegistrationCode(email, code) {
  return await apiRequest("/auth/register/verify", "POST", { email, code }, { timeout: 60000 });
}

async function requestLoginCode(loginValue) {
  return await apiRequest("/auth/login/request", "POST", { loginValue }, { timeout: 90000 });
}

async function verifyLoginCode(loginValue, code) {
  return await apiRequest("/auth/login/verify", "POST", { loginValue, code }, { timeout: 60000 });
}

// ====== سازگاری با توابع قدیمی ======
async function registerUser(name, phone, email) {
  return await requestRegistrationCode(name, phone, email);
}
async function loginUser(loginValue) {
  return await requestLoginCode(loginValue);
}

// ====== مدیریت کاربران ======
async function getAllUsers() { return await apiRequest("/admin/users"); }
async function deleteUserAPI(userId) { return await apiRequest("/admin/users/delete", "POST", { userId }); }

// ====== سفارش سکه ======
async function createCoinOrder(buyerId, buyerName, amount, label, trackingCode) {
  return await apiRequest("/orders", "POST", { buyerId, buyerName, amount, label, trackingCode });
}
async function getAllOrders() { return await apiRequest("/admin/orders"); }
async function approveCoinOrder(orderId) { return await apiRequest("/admin/approve", "POST", { orderId }); }
async function deleteOrderAPI(orderId) { return await apiRequest("/admin/orders/delete", "POST", { orderId }); }

// ====== پروژه‌ها ======
async function saveProjectToDB(userId, name, html, css, js, date) {
  return await apiRequest("/projects", "POST", { userId, name, html, css, js, date });
}
async function getUserProjects(userId) { return await apiRequest(`/projects/${userId}`); }

// ====== نظرات ======
async function submitReview(userId, userName, text, rating, date) {
  return await apiRequest("/reviews", "POST", { userId, userName, text, rating, date });
}
async function getAllReviews() { return await apiRequest("/reviews"); }
async function deleteReview(reviewId, userId, userRole) {
  return await apiRequest("/reviews/delete", "POST", { reviewId, userId, userRole });
}
async function likeReviewAPI(reviewId, action) {
  return await apiRequest("/reviews/like", "POST", { reviewId, action });
}

// ====== اشتراک ======
async function upgradeSubscription(userId, plan) {
  return await apiRequest("/subscribe", "POST", { userId, plan });
}

// ====== پروفایل ======
async function updateUserProfile(userId, name, bio, avatar) {
  return await apiRequest("/user/update-profile", "POST", { userId, name, bio, avatar });
}

// ====== تبلیغات ======
async function requestAdvertisement(userId, userName, phone, content, price) {
  return await apiRequest("/ads/request", "POST", { userId, userName, phone, content, price });
}
async function getAdRequests() { return await apiRequest("/admin/ad-requests"); }
async function handleAdRequest(requestId, action) {
  return await apiRequest("/admin/ad-requests/action", "POST", { requestId, action });
}
async function deleteAdRequest(requestId) {
  return await apiRequest("/admin/ad-requests/delete", "POST", { requestId });
}

// ====== پیام‌های مدیر ======
async function sendMessageToUser(userId, text) {
  return await apiRequest("/admin/send-message", "POST", { userId, text });
}
async function getUserMessages(userId) { return await apiRequest(`/messages/${userId}`); }
async function markMessageAsRead(messageId) {
  return await apiRequest("/messages/read", "POST", { messageId });
}
async function replyToAdmin(userId, text) {
  return await apiRequest("/messages/reply", "POST", { userId, text });
}
async function deleteUserMessage(messageId) {
  return await apiRequest("/messages/delete", "POST", { messageId });
}
async function getAllUserMessages() { return await apiRequest("/admin/messages"); }

// ====== دریافت تبلیغات ======
async function getAdvertisements() { return await apiRequest("/ads"); }

// ====== چت اجتماعی ======
async function getSocialUsers(currentUserId) { return await apiRequest(`/social/users/${currentUserId}`); }
async function getSocialChats(userId) { return await apiRequest(`/social/chats/${userId}`); }
async function getSocialHistory(user1Id, user2Id) { return await apiRequest(`/social/history/${user1Id}/${user2Id}`); }
async function sendSocialMessage(senderId, receiverId, text, replyToId = null, imageUrl = null) {
  return await apiRequest("/social/send", "POST", { senderId, receiverId, text, replyToId, imageUrl });
}
async function markSocialAsRead(userId, otherUserId) {
  return await apiRequest("/social/read", "POST", { userId, otherUserId });
}
async function blockSocialUser(userId, targetId) {
  return await apiRequest("/social/block", "POST", { userId, targetId });
}
async function unblockSocialUser(userId, targetId) {
  return await apiRequest("/social/unblock", "POST", { userId, targetId });
}
async function reportSocialUser(userId, targetId, reason) {
  return await apiRequest("/social/report", "POST", { userId, targetId, reason });
}
async function pinSocialUser(userId, targetId) {
  return await apiRequest("/social/pin", "POST", { userId, targetId });
}

// ====== اتاق‌های گفتگو ======
async function createSocialRoom(ownerId, name, type) {
  return await apiRequest("/social/create-room", "POST", { ownerId, name, type });
}
async function joinSocialRoom(userId, linkCode) {
  return await apiRequest("/social/join-room", "POST", { userId, linkCode });
}
async function getRoomMembers(roomId) { return await apiRequest(`/social/room-members/${roomId}`); }
async function deleteSocialRoom(roomId, userId) {
  return await apiRequest(`/social/room/${roomId}`, "DELETE", { userId });
}
async function getRoomMessages(roomId, userId) {
  const query = userId ? `?userId=${userId}` : "";
  return await apiRequest(`/social/room-messages/${roomId}${query}`);
}
async function sendRoomMessage(senderId, roomId, text, replyToId = null, imageUrl = null) {
  return await apiRequest("/social/send-room", "POST", { senderId, roomId, text, replyToId, imageUrl });
}
async function deleteMessageForMe(messageId, messageType, userId) {
  return await apiRequest("/social/delete-for-me", "POST", { messageId, messageType, userId });
}
async function deleteMessageForEveryone(messageId, messageType, userId) {
  return await apiRequest("/social/delete-for-everyone", "POST", { messageId, messageType, userId });
}
async function reactToMessage(messageId, messageType, userId, emoji) {
  return await apiRequest("/social/react", "POST", { messageId, messageType, userId, emoji });
}