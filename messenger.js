function readStoredJSON(key, fallback = null) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch (error) { console.warn(`داده ذخیره‌شده ${key} معتبر نیست.`, error); return fallback; }
}
const session = readStoredJSON('session');
const currentUser = readStoredJSON('loggedInUser');
let activeChat = null; 
let pollInterval = null;
let currentTab = 'chats';
let allUsersList = [];
let currentMsgId = null;
let currentMsgIsMine = false;
let activeReply = null;
let pendingImageBase64 = null;
let currentProfile = { name: '', bio: '', avatar: '' };
let activeChatRequestKey = 0;
let lastRenderedMessagesSignature = '';
let messagesLoadSequence = 0;
let chatsLoadSequence = 0;
let isSendingMessage = false;
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function safeImageUrl(value) {
    const url = String(value || '').trim();
    return /^(https?:\/\/|data:image\/(png|jpeg|jpg|gif|webp);base64,)/i.test(url) ? url : '';
}
function syncChatInputHeight() {
    if (chatInputArea && chatMessages) {
        const inputHeight = Math.ceil(chatInputArea.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--chat-input-height', `${inputHeight}px`);
    }
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${Math.ceil(viewportHeight)}px`);
}

const listContainer = document.getElementById('listContainer');
const chatMessages = document.getElementById('chatMessages');
const chatHeader = document.getElementById('chatHeader');
const chatInputArea = document.getElementById('chatInputArea');
const messageInput = document.getElementById('messageInput');
const emptyChat = document.getElementById('emptyChat');
const chatName = document.getElementById('chatName');
const chatAvatar = document.getElementById('chatAvatar');
const chatStatus = document.getElementById('chatStatus');
const memberCountSpan = document.getElementById('memberCount');
const searchBox = document.getElementById('searchBox');

document.addEventListener('DOMContentLoaded', async () => {
    if (!session || !currentUser) { window.location.href = 'login.html'; return; }
    await loadCurrentProfile();
    await loadChats();
    document.querySelectorAll('.toggle-switch').forEach(el => el.classList.toggle('on', localStorage.getItem(el.id) === 'true'));
    if ('ResizeObserver' in window && chatInputArea) new ResizeObserver(syncChatInputHeight).observe(chatInputArea);
    window.addEventListener('resize', syncChatInputHeight);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', syncChatInputHeight);
    syncChatInputHeight();
    setInterval(() => { if (currentTab === 'chats') loadChats(); }, 5000);
});

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tabChats').classList.toggle('active', tab === 'chats');
    document.getElementById('tabUsers').classList.toggle('active', tab === 'users');
    document.getElementById('tabAds').classList.toggle('active', tab === 'ads');
    if (tab === 'users') { searchBox.style.display = 'block'; loadAllUsers(); }
    else if (tab === 'chats') { searchBox.style.display = 'none'; loadChats(); }
    else if (tab === 'ads') { searchBox.style.display = 'none'; loadAdvertisements(); }
}

// ==================== تبلیغات ====================
async function loadAdvertisements() {
    listContainer.innerHTML = '<p style="text-align:center; color:#8aa3c9; padding:20px;">در حال دریافت...</p>';
    
    let html = `
        <div class="ad-card" style="background: linear-gradient(145deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05)); border-color: rgba(16,185,129,0.3);">
            <div class="ad-badge" style="background: #10b98120; color: #10b981; border: 1px solid #10b98140;">💼 درخواست تبلیغات</div>
            <h3 class="ad-title">تبلیغات شما در نابغه‌کد</h3>
            <p class="ad-desc">می‌خوای گروه، کانال، ربات یا پروژه‌ت رو اینجا تبلیغ کنی؟ درخواست بده تا ادمین باهات هماهنگ کنه.</p>
            <button class="ad-btn request" onclick="openAdRequestModal()">+ درخواست تبلیغات</button>
        </div>
    `;

    const res = await getAdvertisements();
    if (res.ok && res.data.ads && res.data.ads.length > 0) {
        html += res.data.ads.map(ad => {
            let badgeColor = '#8b5cf6';
            let badgeText = 'تبلیغ';
            if (ad.type === 'کانال') { badgeColor = '#3b82f6'; badgeText = 'کانال'; }
            if (ad.type === 'گروه') { badgeColor = '#10b981'; badgeText = 'گروه'; }
            if (ad.type === 'پروژه') { badgeColor = '#f59e0b'; badgeText = 'پروژه'; }
            if (ad.type === 'ربات') { badgeColor = '#ec4899'; badgeText = 'ربات'; }
            if (ad.type === 'تبلیغ کاربر') { badgeColor = '#facc15'; badgeText = 'ویژه'; }

            return `
            <div class="ad-card">
                <div class="ad-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">${badgeText}</div>
                <h3 class="ad-title">${escapeHTML(ad.title)}</h3>
                <p class="ad-desc">${escapeHTML(ad.description)}</p>
                <a href="${escapeHTML((/^https?:\/\//i.test(String(ad.link || '')) || String(ad.link || '').startsWith('/')) ? ad.link : '#')}" class="ad-btn" style="background: linear-gradient(135deg, ${badgeColor}, #6d28d9);">
                    مشاهده <i class="fas fa-arrow-left" style="margin-right: 5px;"></i>
                </a>
            </div>
            `;
        }).join('');
    }
    listContainer.innerHTML = html;
}

function openAdRequestModal() { document.getElementById('adRequestModal').classList.add('show'); }
function closeAdRequestModal() { document.getElementById('adRequestModal').classList.remove('show'); }
async function submitAdRequest() {
    const content = document.getElementById('adContent').value.trim();
    const price = parseInt(document.getElementById('adPrice').value) || 0;
    if (!content) return alert('متن تبلیغ را وارد کنید');
    const res = await requestAdvertisement(session.id, currentProfile.name || 'کاربر', currentUser.phone || '', content, price);
    if (res.ok) {
        alert('✅ درخواست ارسال شد. ادمین به زودی بررسی می‌کند.');
        closeAdRequestModal();
        document.getElementById('adContent').value = '';
        document.getElementById('adPrice').value = '';
    } else { alert('❌ ' + res.error); }
}

// ==================== پروفایل ====================
async function loadCurrentProfile() {
    const res = await apiRequest(`/user/${session.id}`);
    if (res.ok && res.data.user) {
        currentProfile = {
            name: res.data.user.name || '',
            bio: res.data.user.bio || '',
            avatar: res.data.user.avatar || ''
        };
    }
}

function openSettingsModal() {
    document.getElementById('settingsName').value = currentProfile.name;
    document.getElementById('settingsBio').value = currentProfile.bio;
    const av = document.getElementById('settingsAvatar');
    if (currentProfile.avatar) {
        av.style.backgroundImage = `url("${safeImageUrl(currentProfile.avatar)}")`;
        av.style.backgroundSize = 'cover'; av.innerText = '';
    } else { av.style.backgroundImage = ''; av.innerText = '👤'; }
    document.getElementById('settingsModal').classList.add('show');
}
function closeSettingsModal() { document.getElementById('settingsModal').classList.remove('show'); }

function handleAvatarUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { alert('فقط فایل تصویری مجاز است.'); event.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { alert('حجم عکس پروفایل باید کمتر از ۲ مگابایت باشد.'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onerror = () => alert('خواندن تصویر ناموفق بود.');
    reader.onload = e => {
        currentProfile.avatar = e.target.result;
        const av = document.getElementById('settingsAvatar');
        av.style.backgroundImage = `url("${currentProfile.avatar}")`;
        av.style.backgroundSize = 'cover'; av.innerText = '';
    };
    reader.readAsDataURL(file);
}

async function saveProfile() {
    const name = document.getElementById('settingsName').value.trim();
    const bio = document.getElementById('settingsBio').value.trim();
    const res = await updateUserProfile(session.id, name, bio, currentProfile.avatar);
    if (res.ok) {
        localStorage.setItem('loggedInUser', JSON.stringify(res.data.user));
        alert('✅ پروفایل ذخیره شد');
        closeSettingsModal();
    } else { alert('❌ ' + res.error); }
}

function toggleSetting(id) {
    const el = document.getElementById(id);
    el.classList.toggle('on');
    localStorage.setItem(id, el.classList.contains('on') ? 'true' : 'false');
}

// ==================== چت‌ها ====================
async function loadChats() {
    const requestId = ++chatsLoadSequence;
    try {
    const res = await getSocialChats(session.id);
    if (requestId !== chatsLoadSequence || !res || !res.ok) return;
    const chats = Array.isArray(res.data?.chats) ? res.data.chats : [];
    if (!chats.length) {
        listContainer.innerHTML = `<div style="text-align:center;padding:30px 15px;color:#8aa3c9;"><i class="fas fa-inbox" style="font-size:40px;opacity:.3;margin-bottom:10px;display:block;"></i><p style="font-size:13px;">هنوز چتی نداری.</p></div>`;
        return;
    }
    listContainer.innerHTML = chats.map(c => {
        const isRoom = c.chat_type === 'room', id = Number(c.id);
        if (!Number.isSafeInteger(id)) return '';
        const icon = isRoom ? (c.role === 'channel' ? '📢' : '👥') : '👤';
        const avatar = safeImageUrl(c.avatar);
        const avatarHTML = avatar && !isRoom ? `<div class="contact-avatar" style="background-image:url('${escapeHTML(avatar)}');background-size:cover;"></div>` : `<div class="contact-avatar ${!isRoom ? 'online' : ''}">${icon}</div>`;
        const badge = c.role === 'admin' && !isRoom ? '<span class="admin-badge">ادمین</span>' : '';
        return `<div class="contact-item ${activeChat && activeChat.id === id ? 'active' : ''}" data-chat-id="${id}" data-chat-name="${escapeHTML(c.name)}" data-chat-type="${isRoom ? 'room' : 'direct'}" data-chat-role="${escapeHTML(c.role)}" data-link-code="${escapeHTML(c.link_code || '')}">
            ${avatarHTML}<div class="contact-info"><div class="contact-name">${escapeHTML(c.name)} ${badge}</div><div class="contact-last-msg">${escapeHTML(c.last_message || '...')}</div></div>
            ${c.unread_count > 0 ? `<div class="unread-badge">${Number(c.unread_count) || 0}</div>` : ''}
            ${c.is_pinned ? '<i class="fas fa-thumbtack pin-icon"></i>' : ''}
            ${!isRoom ? `<button class="chat-actions-btn" onclick="toggleDropdown(event,${id})" aria-label="گزینه‌های گفتگو"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-menu" id="dropdown-${id}">
            <button onclick="event.stopPropagation();pinUser(${id})"><i class="fas fa-thumbtack"></i> ${c.is_pinned ? 'لغو سنجاق' : 'سنجاق'}</button>
            <button class="danger" onclick="event.stopPropagation();toggleBlock(${id},${Boolean(c.is_blocked)})"><i class="fas fa-ban"></i> ${c.is_blocked ? 'لغو بلاک' : 'بلاک'}</button>
            <button class="danger" onclick="event.stopPropagation();reportUser(${id})"><i class="fas fa-exclamation-triangle"></i> گزارش</button></div>` : ''}
        </div>`;
    }).join('');
    listContainer.querySelectorAll('[data-chat-id]').forEach(item => item.addEventListener('click', e => {
        if (e.target.closest('.chat-actions-btn,.dropdown-menu')) return;
        openChat(Number(item.dataset.chatId), item.dataset.chatName, item.dataset.chatType, item.dataset.chatRole, item.dataset.linkCode);
    }));
    } catch (error) { console.error('خطا در دریافت گفتگوها:', error); }
}

function toggleDropdown(event, userId) {
    event.stopPropagation();
    document.querySelectorAll('.dropdown-menu').forEach(d => { if (d.id !== `dropdown-${userId}`) d.classList.remove('show'); });
    document.getElementById(`dropdown-${userId}`).classList.toggle('show');
}
document.addEventListener('click', () => { document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show')); });

async function pinUser(targetId) { const res = await pinSocialUser(session.id, targetId); if (res.ok) loadChats(); }
async function toggleBlock(targetId, isBlocked) {
    if (isBlocked) {
        if (!confirm('لغو بلاک؟')) return;
        const res = await unblockSocialUser(session.id, targetId);
        if (res.ok) { alert('✅ آنبلاک شد'); loadChats(); }
    } else {
        if (!confirm('بلاک کنم؟')) return;
        const res = await blockSocialUser(session.id, targetId);
        if (res.ok) { alert('🚫 بلاک شد'); loadChats(); }
    }
}
async function reportUser(targetId) {
    const reason = prompt('دلیل گزارش:');
    if (reason) { const res = await reportSocialUser(session.id, targetId, reason); if (res.ok) alert('⚠️ گزارش ثبت شد.'); }
}

let currentRoomMembers = [];
async function openRoomInfo() {
    if (!activeChat || activeChat.type !== 'room') return;
    document.getElementById('roomInfoModal').classList.add('show');
    document.getElementById('roomInfoTitle').innerText = `اطلاعات ${activeChat.role === 'channel' ? 'کانال' : 'گروه'}`;
    document.getElementById('roomLinkCode').innerText = activeChat.link_code;
    const res = await getRoomMembers(activeChat.id);
    if (res.ok) {
        document.getElementById('roomMembersCount').innerText = res.data.members.length;
        document.getElementById('roomMembersList').innerHTML = res.data.members.map(m => `
            <div class="member-item"><div class="member-avatar">👤</div><div class="member-name">${escapeHTML(m.name)}</div>
                ${m.group_role === 'admin' ? '<span class="member-role">ادمین</span>' : ''}
            </div>
        `).join('');
    }
}
function closeRoomInfo() { document.getElementById('roomInfoModal').classList.remove('show'); }
async function copyInviteLink() {
    const code = String(activeChat?.link_code || '');
    if (!code) return alert('کد دعوت در دسترس نیست.');
    try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code);
        else { const field = document.createElement('textarea'); field.value = code; document.body.appendChild(field); field.select(); document.execCommand('copy'); field.remove(); }
        alert('📋 کپی شد.');
    } catch (error) { alert('کپی خودکار ممکن نشد؛ کد دعوت را دستی کپی کنید: ' + code); }
}
async function deleteRoom() {
    if (!confirm('حذف گروه؟')) return;
    const res = await deleteSocialRoom(activeChat.id, session.id);
    if (res.ok) {
        alert('🗑 حذف شد'); closeRoomInfo();
        ++activeChatRequestKey; ++messagesLoadSequence;
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        activeChat = null; lastRenderedMessagesSignature = '';
        document.getElementById('sidebar').classList.remove('hidden');
        chatHeader.style.display = 'none'; chatMessages.style.display = 'none'; chatInputArea.style.display = 'none';
        loadChats();
    } else { alert('❌ ' + res.error); }
}

function openCreateRoomModal() { document.getElementById('createRoomModal').classList.add('show'); }
function closeCreateRoomModal() { document.getElementById('createRoomModal').classList.remove('show'); }
async function createRoom() {
    const name = document.getElementById('roomName').value.trim();
    const type = document.getElementById('roomType').value;
    if (!name) return alert('نام گروه');
    const res = await createSocialRoom(session.id, name, type);
    if (res.ok) { alert('✅ ساخته شد'); closeCreateRoomModal(); loadChats(); }
}
function openJoinModal() { document.getElementById('joinModal').classList.add('show'); }
function closeJoinModal() { document.getElementById('joinModal').classList.remove('show'); }
async function joinRoom() {
    const code = document.getElementById('joinLinkCode').value.trim();
    if (!code) return alert('کد دعوت');
    const res = await joinSocialRoom(session.id, code);
    if (res.ok) { alert('✅ عضو شدید'); closeJoinModal(); loadChats(); }
    else alert('❌ ' + res.error);
}

async function loadAllUsers() {
    listContainer.innerHTML = '<p style="text-align:center; color:#8aa3c9; padding:20px;">در حال دریافت...</p>';
    try {
        const res = await getSocialUsers(session.id);
        if (!res || !res.ok) { listContainer.innerHTML = '<p style="text-align:center;color:#f87171;padding:20px;">دریافت کاربران ناموفق بود.</p>'; return; }
        allUsersList = Array.isArray(res.data?.users) ? res.data.users : [];
        renderUsersList(allUsersList);
    } catch (error) { console.error(error); listContainer.innerHTML = '<p style="text-align:center;color:#f87171;padding:20px;">خطا در دریافت کاربران.</p>'; }
}
function renderUsersList(users) {
    if (!users.length) { listContainer.innerHTML = '<p style="text-align:center;color:#8aa3c9;padding:20px;">کاربری نیست</p>'; return; }
    listContainer.innerHTML = users.map(u => {
        const id = Number(u.id); if (!Number.isSafeInteger(id)) return '';
        const avatar = safeImageUrl(u.avatar);
        const av = avatar ? `<div class="contact-avatar" style="background-image:url('${escapeHTML(avatar)}');background-size:cover;"></div>` : '<div class="contact-avatar">👤</div>';
        return `<div class="contact-item" data-user-id="${id}" data-user-name="${escapeHTML(u.name)}" data-user-role="${escapeHTML(u.role)}">${av}
            <div class="contact-info"><div class="contact-name">${escapeHTML(u.name)} ${u.role === 'admin' ? '<span class="admin-badge">ادمین</span>' : ''}</div>
            <div class="contact-last-msg">${escapeHTML(u.bio || (u.plan === 'pro' ? '👑 ویژه' : '🟢 رایگان'))}</div></div></div>`;
    }).join('');
    listContainer.querySelectorAll('[data-user-id]').forEach(item => item.addEventListener('click', () =>
        openChat(Number(item.dataset.userId), item.dataset.userName, 'direct', item.dataset.userRole, '')));
}

function filterUsers() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!term) { renderUsersList(allUsersList); return; }
    renderUsersList(allUsersList.filter(u => String(u.name || '').toLowerCase().includes(term)));
}

function showSidebar() {
    ++activeChatRequestKey;
    ++messagesLoadSequence;
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    activeChat = null; lastRenderedMessagesSignature = '';
    document.getElementById('sidebar').classList.remove('hidden');
    chatHeader.style.display = 'none'; chatMessages.style.display = 'none'; chatInputArea.style.display = 'none';
    memberCountSpan.innerText = '';
    cancelReply();
}

async function openChat(id, name, type, role, linkCode) {
    const requestKey = ++activeChatRequestKey;
    ++messagesLoadSequence;
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    activeChat = { id, name, type, role, link_code: linkCode };
    lastRenderedMessagesSignature = '';
    cancelReply();
    chatName.innerText = name;
    chatAvatar.innerText = type === 'room' ? (role === 'channel' ? '📢' : '👥') : (role === 'admin' ? '🛡️' : '👤');
    chatStatus.innerText = type === 'room' ? 'گروه' : 'آنلاین';
    
    if (type === 'room') {
        const memRes = await getRoomMembers(id);
        if (requestKey !== activeChatRequestKey) return;
        memberCountSpan.innerText = memRes.ok ? `(${memRes.data.members.length} عضو)` : '';
    } else { memberCountSpan.innerText = ''; }

    document.getElementById('sidebar').classList.add('hidden');
    chatHeader.style.display = 'flex'; chatMessages.style.display = 'flex'; chatInputArea.style.display = 'flex';
    emptyChat.style.display = 'none';

    await loadMessages();
    if (requestKey !== activeChatRequestKey) return;
    if (requestKey !== activeChatRequestKey) return;
    pollInterval = setInterval(() => { if (activeChat && requestKey === activeChatRequestKey) loadMessages(); }, 3000);
}

// 👈 بهینه‌سازی رندر پیام‌ها
async function loadMessages() {
    if (!activeChat) return;
    const chat = { ...activeChat }, requestKey = activeChatRequestKey;
    const loadId = ++messagesLoadSequence;
    try {
    const res = chat.type === 'direct' ? await getSocialHistory(session.id, chat.id) : await getRoomMessages(chat.id, session.id);
    if (loadId !== messagesLoadSequence || requestKey !== activeChatRequestKey || !activeChat || activeChat.id !== chat.id || activeChat.type !== chat.type) return;
    if (!res || !res.ok) return;
    const msgs = Array.isArray(res.data?.messages) ? res.data.messages : [];
    if (chat.type === 'direct' && msgs.some(m => Number(m.sender_id) !== Number(session.id) && !m.is_read)) {
        await markSocialAsRead(session.id, chat.id);
        if (loadId !== messagesLoadSequence || requestKey !== activeChatRequestKey) return;
    }
    const signature = JSON.stringify(msgs);
    if (signature === lastRenderedMessagesSignature) return;
    const wasAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100;
    chatMessages.innerHTML = '';
    if (!msgs.length) {
        chatMessages.innerHTML = '<p style="text-align:center;color:#8aa3c9;font-size:13px;margin-top:20px;">شروع کن!</p>';
        lastRenderedMessagesSignature = signature; return;
    }
    msgs.forEach(m => {
        const mine = Number(m.sender_id) === Number(session.id);
        const time = m.created_at ? new Date(m.created_at).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}) : '';
        const sender = chat.type === 'room' && !mine ? `<span class="msg-sender-name">${escapeHTML(m.sender_name)}</span>` : '';
        const checks = mine && chat.type === 'direct' ? (m.is_read ? '<span style="color:#4ade80;margin-right:4px;font-size:12px;">✓✓</span>' : '<span style="color:#8aa3c9;margin-right:4px;font-size:12px;">✓</span>') : '';
        const reply = m.reply_to_id && m.reply_text ? `<div class="reply-quote"><span class="reply-name">${escapeHTML(m.reply_sender_name)}</span><span class="reply-text">${escapeHTML(String(m.reply_text).slice(0,50))}${String(m.reply_text).length > 50 ? '...' : ''}</span></div>` : '';
        const grouped = {};
        if (Array.isArray(m.reactions)) m.reactions.forEach(r => { const e = String(r.emoji || ''); grouped[e] = (grouped[e] || 0) + 1; });
        const reactions = Object.entries(grouped).length ? `<div class="msg-reactions">${Object.entries(grouped).map(([e,n]) => `<span class="reaction-badge">${escapeHTML(e)} ${n}</span>`).join('')}</div>` : '';
        const image = safeImageUrl(m.image_url);
        const img = image ? `<img src="${escapeHTML(image)}" class="msg-img" alt="تصویر پیام" loading="lazy">` : '';
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${mine ? 'outgoing' : 'incoming'}`;
        bubble.dataset.msgId = String(m.id);
        bubble.innerHTML = `${sender}${reply}${img}<div style="word-wrap:break-word;white-space:pre-wrap;">${escapeHTML(m.text || '')}</div>
            <div style="display:flex;justify-content:flex-end;align-items:center;gap:4px;margin-top:4px;"><span class="msg-time" style="position:static;">${escapeHTML(time)}</span>${checks}</div>${reactions}`;
        const imageElement = bubble.querySelector('.msg-img');
        if (imageElement) imageElement.addEventListener('click', e => { e.stopPropagation(); window.open(image,'_blank','noopener,noreferrer'); });
        bubble.addEventListener('click', e => { if (!e.target.closest('a,button,img')) showMsgOptions(m.id,mine,m.text || ''); });
        chatMessages.appendChild(bubble);
    });
    lastRenderedMessagesSignature = signature;
    if (wasAtBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) { console.error('خطا در دریافت پیام‌ها:', error); }
}

function setReply(msgId, senderName, text) {
    activeReply = { id: msgId, name: senderName, text: text };
    document.getElementById('replyPreviewName').innerText = senderName;
    document.getElementById('replyPreviewText').innerText = text.substring(0, 50) + (text.length > 50 ? '...' : '');
    document.getElementById('replyPreviewContainer').style.display = 'flex';
    messageInput.focus();
}
function cancelReply() {
    activeReply = null;
    document.getElementById('replyPreviewContainer').style.display = 'none';
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { alert('فقط فایل تصویری مجاز است.'); event.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { alert('عکس باید کمتر از ۵ مگابایت باشد'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onerror = () => alert('خواندن عکس ناموفق بود.');
    reader.onload = (e) => {
        pendingImageBase64 = e.target.result;
        sendMessage();
    };
    reader.readAsDataURL(file);
}

async function sendMessage() {
    const text = messageInput.value.trim(), imageUrl = pendingImageBase64;
    if (isSendingMessage || (!text && !imageUrl) || !activeChat) return;
    const chat = { ...activeChat }, replyId = activeReply ? activeReply.id : null;
    isSendingMessage = true;
    try {
        const res = chat.type === 'direct'
            ? await sendSocialMessage(session.id, chat.id, text, replyId, imageUrl)
            : await sendRoomMessage(session.id, chat.id, text, replyId, imageUrl);
        if (!res || !res.ok) { alert('❌ ' + (res?.error || 'ارسال پیام انجام نشد.')); return; }
        if (activeChat && activeChat.id === chat.id && activeChat.type === chat.type) {
            if (messageInput.value.trim() === text && pendingImageBase64 === imageUrl) {
                messageInput.value = ''; messageInput.style.height = '44px';
                pendingImageBase64 = null;
                const imageInput = document.getElementById('imageUpload');
                if (imageInput) imageInput.value = '';
                cancelReply(); syncChatInputHeight();
            }
            await loadMessages();
        }
    } catch (error) { console.error(error); alert('❌ خطا در ارسال پیام. متن شما حفظ شد.'); }
    finally { isSendingMessage = false; }
}

messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    syncChatInputHeight();
});

function showMsgOptions(msgId, isMine, text) {
    currentMsgId = msgId;
    currentMsgIsMine = isMine;
    document.getElementById('btnDeleteForEveryone').style.display = isMine ? 'flex' : 'none';
    document.getElementById('msgOptionsModal').dataset.msgText = text;
    const bubble = [...document.querySelectorAll('.msg-bubble')].find(el => el.dataset.msgId === String(msgId));
    const senderName = bubble?.querySelector('.msg-sender-name')?.innerText || (isMine ? "شما" : (activeChat?.name || 'کاربر'));
    document.getElementById('msgOptionsModal').dataset.senderName = senderName;
    document.getElementById('msgOptionsModal').classList.add('show');
}
function closeMsgOptions() {
    document.getElementById('msgOptionsModal').classList.remove('show');
    currentMsgId = null;
}
function replyToMessage() {
    const modal = document.getElementById('msgOptionsModal');
    setReply(currentMsgId, modal.dataset.senderName, modal.dataset.msgText);
    closeMsgOptions();
}
async function copyMessageText() {
    try { await navigator.clipboard.writeText(document.getElementById('msgOptionsModal').dataset.msgText || ''); alert('📋 کپی شد'); closeMsgOptions(); }
    catch (error) { alert('امکان کپی خودکار وجود ندارد؛ متن را انتخاب و کپی کنید.'); }
}
async function reactToCurrentMessage(emoji) {
    if (!currentMsgId || !activeChat) return;
    const msgType = activeChat.type === 'room' ? 'room' : 'direct';
    const res = await reactToMessage(currentMsgId, msgType, session.id, emoji);
    if (!res || !res.ok) { alert('❌ ' + (res?.error || 'ثبت واکنش انجام نشد.')); return; }
    closeMsgOptions();
    await loadMessages();
}
async function deleteForMe() {
    if (!currentMsgId) return;
    const msgType = activeChat.type === 'room' ? 'room' : 'direct';
    const res = await deleteMessageForMe(currentMsgId, msgType, session.id);
    if (res.ok) {
        const deletedId = currentMsgId;
        closeMsgOptions();
        const bubble = [...chatMessages.querySelectorAll('.msg-bubble')].find(el => el.dataset.msgId === String(deletedId));
        if (bubble) bubble.remove();
        lastRenderedMessagesSignature = '';
    } else alert('❌ ' + res.error);
}
async function deleteForEveryone() {
    if (!currentMsgId || !currentMsgIsMine) return;
    if (!confirm('حذف برای همه؟')) return;
    const msgType = activeChat.type === 'room' ? 'room' : 'direct';
    const res = await deleteMessageForEveryone(currentMsgId, msgType, session.id);
    if (res.ok) {
        const deletedId = currentMsgId;
        closeMsgOptions();
        const bubble = [...chatMessages.querySelectorAll('.msg-bubble')].find(el => el.dataset.msgId === String(deletedId));
        if (bubble) bubble.remove();
        lastRenderedMessagesSignature = '';
    } else alert('❌ ' + res.error);
}