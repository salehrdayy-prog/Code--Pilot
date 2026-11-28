// api.js — نسخه اصلاح‌شده و کامل
const API_BASE_URL = "https://code-pilot-5.onrender.com/api";

async function apiRequest(endpoint, method = "GET", body = null, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeout || 60000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const reqOptions = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    };
    if (body) reqOptions.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE_URL}${endpoint}`, reqOptions);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        return { ok: false, error: "سرور در حال بیدار شدن است." };
      }
      return { ok: false, error: "پاسخ نامعتبر از سرور." };
    }

    if (!res.ok) return { ok: false, error: data.error || "خطا در ارتباط با سرور", data };
    return { ok: true, data };
  } catch (err) {
    if (err.name === "AbortError") return { ok: false, error: "سرور پاسخ نداد." };
    return { ok: false, error: "خطا در شبکه: " + err.message };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============ Auth ============
async function registerUser(name, phone, email, password) {
  return await apiRequest("/register", "POST", { name, phone, email, password });
}
async function loginUser(loginValue, password) {
  return await apiRequest("/login", "POST", { loginValue, password });
}

// ============ Admin: Users ============
async function getAllUsers() { return await apiRequest("/admin/users"); }
async function deleteUserAPI(userId) { return await apiRequest("/admin/users/delete", "POST", { userId }); }

// ============ Admin: Orders ============
async function createCoinOrder(buyerId, buyerName, amount, label, trackingCode) {
  return await apiRequest("/orders", "POST", { buyerId, buyerName, amount, label, trackingCode });
}
async function getAllOrders() { return await apiRequest("/admin/orders"); }
async function approveCoinOrder(orderId) { return await apiRequest("/admin/approve", "POST", { orderId }); }
async function deleteOrderAPI(orderId) { return await apiRequest("/admin/orders/delete", "POST", { orderId }); }

// ============ Projects ============
async function saveProjectToDB(userId, name, html, css, js, date) {
  return await apiRequest("/projects", "POST", { userId, name, html, css, js, date });
}
async function getUserProjects(userId) { return await apiRequest(`/projects/${userId}`); }

// ============ Reviews ============
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

// ============ Subscription ============
async function upgradeSubscription(userId, plan) {
  return await apiRequest("/subscribe", "POST", { userId, plan });
}

// ============ Profile ============
async function updateUserProfile(userId, name, bio, avatar) {
  return await apiRequest("/user/update-profile", "POST", { userId, name, bio, avatar });
}

// ============ Ads ============
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
async function getAdvertisements() { return await apiRequest("/ads"); }

// ============ Admin Messages ============
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

// ============ Social: Users ============
async function getSocialUsers(currentUserId) { return await apiRequest(`/social/users/${currentUserId}`); }

// ============ Social: Chats ============
async function getSocialChats(userId) { return await apiRequest(`/social/chats/${userId}`); }
async function getSocialHistory(user1Id, user2Id) { return await apiRequest(`/social/history/${user1Id}/${user2Id}`); }
async function sendSocialMessage(senderId, receiverId, text, replyToId = null, imageUrl = null) {
  return await apiRequest("/social/send", "POST", { senderId, receiverId, text, replyToId, imageUrl });
}
async function markSocialAsRead(userId, otherUserId) {
  return await apiRequest("/social/read", "POST", { userId, otherUserId });
}

// ============ Social: Block / Report / Pin ============
async function blockSocialUser(userId, targetId) { return await apiRequest("/social/block", "POST", { userId, targetId }); }
async function unblockSocialUser(userId, targetId) { return await apiRequest("/social/unblock", "POST", { userId, targetId }); }
async function reportSocialUser(userId, targetId, reason) { return await apiRequest("/social/report", "POST", { userId, targetId, reason }); }
async function pinSocialUser(userId, targetId) { return await apiRequest("/social/pin", "POST", { userId, targetId }); }

// ============ Social: Rooms ============
async function createSocialRoom(ownerId, name, type, description = '', avatar = '') {
  return await apiRequest("/social/create-room", "POST", { ownerId, name, type, description, avatar });
}
async function joinSocialRoom(userId, linkCode) { return await apiRequest("/social/join-room", "POST", { userId, linkCode }); }
async function getRoomMembers(roomId) { return await apiRequest(`/social/room-members/${roomId}`); }
async function deleteSocialRoom(roomId, userId) {
  return await apiRequest(`/social/room/${roomId}`, "DELETE", { userId });
}
async function changeRoomLink(roomId, userId, newLink) {
  return await apiRequest("/social/room/change-link", "POST", { roomId, userId, newLink });
}
async function getRoomMessages(roomId, userId) {
  const query = userId ? `?userId=${userId}` : '';
  return await apiRequest(`/social/room-messages/${roomId}${query}`);
}
async function sendRoomMessage(senderId, roomId, text, replyToId = null, imageUrl = null) {
  return await apiRequest("/social/send-room", "POST", { senderId, roomId, text, replyToId, imageUrl });
}

// ============ Social: Message Actions ============
async function deleteMessageForMe(messageId, messageType, userId) {
  return await apiRequest("/social/delete-for-me", "POST", { messageId, messageType, userId });
}
async function deleteMessageForEveryone(messageId, messageType, userId) {
  return await apiRequest("/social/delete-for-everyone", "POST", { messageId, messageType, userId });
}
async function reactToMessage(messageId, messageType, userId, emoji) {
  return await apiRequest("/social/react", "POST", { messageId, messageType, userId, emoji });
}
