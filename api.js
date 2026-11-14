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

// 👈 توابع پیام‌رسان (کامل)
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