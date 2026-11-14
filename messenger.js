// ============================================================
// messenger.js - پیام‌رسان اجتماعی بین برنامه‌نویسان
// ============================================================

const session = JSON.parse(localStorage.getItem('session'));
const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
let activeChatUserId = null;
let pollInterval = null;
let currentTab = 'chats';
let allUsersList = [];

// المان‌ها
const listContainer = document.getElementById('listContainer');
const chatMessages = document.getElementById('chatMessages');
const chatHeader = document.getElementById('chatHeader');
const chatInputArea = document.getElementById('chatInputArea');
const messageInput = document.getElementById('messageInput');
const emptyChat = document.getElementById('emptyChat');
const chatName = document.getElementById('chatName');
const chatAvatar = document.getElementById('chatAvatar');
const searchBox = document.getElementById('searchBox');

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    if (!session || !currentUser) {
        window.location.href = 'login.html';
        return;
    }
    await loadChats();
    // هر ۵ ثانیه لیست چت‌ها رو آپدیت کن
    setInterval(() => {
        if (currentTab === 'chats') loadChats();
    }, 5000);
});

// ==================== TAB SWITCH ====================
function switchTab(tab) {
    currentTab = tab;
    
    document.getElementById('tabChats').classList.toggle('active', tab === 'chats');
    document.getElementById('tabUsers').classList.toggle('active', tab === 'users');
    
    if (tab === 'users') {
        searchBox.style.display = 'block';
        loadAllUsers();
    } else {
        searchBox.style.display = 'none';
        loadChats();
    }
}

// ==================== LOAD CHATS ====================
async function loadChats() {
    const res = await getSocialChats(session.id);
    if (!res.ok) return;

    const chats = res.data.chats;

    if (chats.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:30px 15px; color:#8aa3c9;">
                <i class="fas fa-inbox" style="font-size:40px; opacity:0.3; margin-bottom:10px; display:block;"></i>
                <p style="font-size:13px;">هنوز چتی نداری.</p>
                <p style="font-size:12px; margin-top:5px;">از تب «کاربران» شروع کن!</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = chats.map(c => `
        <div class="contact-item ${c.id === activeChatUserId ? 'active' : ''}" onclick="openChat(${c.id}, '${c.name.replace(/'/g, "\\'")}', '${c.role}')">
            <div class="contact-avatar online">👤</div>
            <div class="contact-info">
                <div class="contact-name">
                    ${c.name}
                    ${c.role === 'admin' ? '<span class="admin-badge">ادمین</span>' : ''}
                </div>
                <div class="contact-last-msg">${c.last_message || '...'}</div>
            </div>
            ${c.unread_count > 0 ? `<div class="unread-badge">${c.unread_count}</div>` : ''}
        </div>
    `).join('');
}

// ==================== LOAD ALL USERS ====================
async function loadAllUsers() {
    listContainer.innerHTML = '<p style="text-align:center; color:#8aa3c9; padding:20px;">در حال دریافت...</p>';
    
    const res = await getSocialUsers(session.id);
    if (!res.ok) {
        listContainer.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">خطا در دریافت کاربران</p>';
        return;
    }

    allUsersList = res.data.users;
    renderUsersList(allUsersList);
}

function renderUsersList(users) {
    if (users.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#8aa3c9; padding:20px;">کاربری پیدا نشد</p>';
        return;
    }

    listContainer.innerHTML = users.map(u => `
        <div class="contact-item" onclick="openChat(${u.id}, '${u.name.replace(/'/g, "\\'")}', '${u.role}')">
            <div class="contact-avatar">👤</div>
            <div class="contact-info">
                <div class="contact-name">
                    ${u.name}
                    ${u.role === 'admin' ? '<span class="admin-badge">ادمین</span>' : ''}
                </div>
                <div class="contact-last-msg">
                    ${u.plan === 'pro' ? '👑 کاربر ویژه' : '🟢 کاربر رایگان'}
                </div>
            </div>
        </div>
    `).join('');
}

function filterUsers() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!term) {
        renderUsersList(allUsersList);
        return;
    }
    const filtered = allUsersList.filter(u => u.name.toLowerCase().includes(term));
    renderUsersList(filtered);
}

// ==================== SIDEBAR (موبایل) ====================
function showSidebar() {
    document.getElementById('sidebar').classList.remove('hidden');
    chatHeader.style.display = 'none';
    chatMessages.style.display = 'none';
    chatInputArea.style.display = 'none';
}

// ==================== OPEN CHAT ====================
async function openChat(userId, userName, userRole) {
    activeChatUserId = userId;
    chatName.innerText = userName;
    chatAvatar.innerText = userRole === 'admin' ? '🛡️' : '👤';

    document.getElementById('sidebar').classList.add('hidden');
    chatHeader.style.display = 'flex';
    chatMessages.style.display = 'flex';
    chatInputArea.style.display = 'flex';
    emptyChat.style.display = 'none';

    await loadMessages();
    
    // علامت‌گذاری پیام‌ها به عنوان خوانده شده
    await markSocialAsRead(session.id, activeChatUserId);

    // پاک کردن Polling قبلی و شروع مجدد
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(loadMessages, 3000);
}

// ==================== LOAD MESSAGES ====================
async function loadMessages() {
    if (!activeChatUserId) return;

    const res = await getSocialHistory(session.id, activeChatUserId);
    if (!res.ok) return;

    const msgs = res.data.messages;

    // چک کن تعداد پیام‌ها تغییر کرده یا نه (برای جلوگیری از پرش)
    const currentCount = chatMessages.querySelectorAll('.msg-bubble').length;
    if (currentCount === msgs.length) return;

    chatMessages.innerHTML = '';

    if (msgs.length === 0) {
        chatMessages.innerHTML = '<p style="text-align:center; color:#8aa3c9; font-size:13px; margin-top:20px;">شروع کن! اولین پیام را بفرست.</p>';
        return;
    }

    msgs.forEach(m => {
        const isMine = m.sender_id === session.id;
        const time = new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${isMine ? 'outgoing' : 'incoming'}`;
        bubble.innerHTML = `
            ${m.text}
            <span class="msg-time">${time}</span>
        `;
        chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================== SEND MESSAGE ====================
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeChatUserId) return;

    messageInput.value = '';
    messageInput.focus();

    const res = await sendSocialMessage(session.id, activeChatUserId, text);

    if (res.ok) {
        // پاک کردن تعداد برای اجبار به رفرش
        const bubbles = chatMessages.querySelectorAll('.msg-bubble');
        if (bubbles.length > 0) {
            // فقط آخرین پیام رو اضافه کن برای سرعت
            const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            const bubble = document.createElement('div');
            bubble.className = 'msg-bubble outgoing';
            bubble.innerHTML = `${text}<span class="msg-time">${time}</span>`;
            chatMessages.appendChild(bubble);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            loadMessages();
        }
    } else {
        alert('خطا در ارسال پیام');
    }
}