const session = JSON.parse(localStorage.getItem('session'));
const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
let activeChat = null; 
let pollInterval = null;
let currentTab = 'chats';
let allUsersList = [];
let currentMsgId = null;
let currentMsgIsMine = false;
let activeReply = null;

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
    await loadChats();
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

// 👈 بارگذاری تبلیغات
async function loadAdvertisements() {
    listContainer.innerHTML = '<p style="text-align:center; color:#8aa3c9; padding:20px;">در حال دریافت تبلیغات...</p>';
    const res = await getAdvertisements();
    
    if (!res.ok || !res.data.ads || res.data.ads.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:30px 15px; color:#8aa3c9;">
                <i class="fas fa-bullhorn" style="font-size:40px; opacity:0.3; margin-bottom:10px; display:block;"></i>
                <p style="font-size:13px;">هنوز تبلیغی ثبت نشده است.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = res.data.ads.map(ad => {
        let badgeColor = '#8b5cf6';
        let badgeText = 'تبلیغ';
        if (ad.type === 'کانال') { badgeColor = '#3b82f6'; badgeText = 'کانال'; }
        if (ad.type === 'گروه') { badgeColor = '#10b981'; badgeText = 'گروه'; }
        if (ad.type === 'پروژه') { badgeColor = '#f59e0b'; badgeText = 'پروژه'; }
        if (ad.type === 'ربات') { badgeColor = '#ec4899'; badgeText = 'ربات'; }

        return `
        <div class="ad-card">
            <div class="ad-badge" style="background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">
                ${badgeText}
            </div>
            <h3 class="ad-title">${ad.title}</h3>
            <p class="ad-desc">${ad.description}</p>
            <a href="${ad.link || '#'}" class="ad-btn" target="_blank" style="background: linear-gradient(135deg, ${badgeColor}, #6d28d9);">
                مشاهده / ورود <i class="fas fa-arrow-left" style="margin-right: 5px;"></i>
            </a>
        </div>
        `;
    }).join('');
}

async function loadChats() {
    const res = await getSocialChats(session.id);
    if (!res.ok) return;

    const chats = res.data.chats;
    if (chats.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:30px 15px; color:#8aa3c9;"><i class="fas fa-inbox" style="font-size:40px; opacity:0.3; margin-bottom:10px; display:block;"></i><p style="font-size:13px;">هنوز چتی نداری.</p></div>`;
        return;
    }

    listContainer.innerHTML = chats.map(c => {
        const isRoom = c.chat_type === 'room';
        const icon = isRoom ? (c.role === 'channel' ? '📢' : '👥') : '👤';
        const badge = c.role === 'admin' && !isRoom ? '<span class="admin-badge">ادمین</span>' : '';
        
        const pinActionText = c.is_pinned ? 'لغو سنجاق' : 'سنجاق کردن';
        const pinActionIcon = c.is_pinned ? 'fa-thumbtack-slash' : 'fa-thumbtack';
        
        const blockActionText = c.is_blocked ? 'لغو بلاک' : 'بلاک کردن';
        const blockActionIcon = c.is_blocked ? 'fa-user-check' : 'fa-ban';

        return `
        <div class="contact-item ${activeChat && activeChat.id === c.id ? 'active' : ''}" onclick="openChat(${c.id}, '${c.name.replace(/'/g, "\\'")}', '${c.chat_type}', '${c.role}', '${c.link_code || ''}')">
            <div class="contact-avatar ${!isRoom ? 'online' : ''}">${icon}</div>
            <div class="contact-info">
                <div class="contact-name">${c.name} ${badge}</div>
                <div class="contact-last-msg">${c.last_message || '...'}</div>
            </div>
            ${c.unread_count > 0 ? `<div class="unread-badge">${c.unread_count}</div>` : ''}
            ${c.is_pinned ? `<i class="fas fa-thumbtack pin-icon"></i>` : ''}
            
            ${!isRoom ? `
            <button class="chat-actions-btn" onclick="toggleDropdown(event, ${c.id})"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-menu" id="dropdown-${c.id}">
                <button onclick="event.stopPropagation(); pinUser(${c.id})"><i class="fas ${pinActionIcon}"></i> ${pinActionText}</button>
                <button class="danger" onclick="event.stopPropagation(); toggleBlock(${c.id}, ${c.is_blocked})"><i class="fas ${blockActionIcon}"></i> ${blockActionText}</button>
                <button class="danger" onclick="event.stopPropagation(); reportUser(${c.id})"><i class="fas fa-exclamation-triangle"></i> گزارش</button>
            </div>
            ` : ''}
        </div>
    `}).join('');
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
        if (!confirm('آیا از لغو بلاک مطمئن هستید؟')) return;
        const res = await unblockSocialUser(session.id, targetId);
        if (res.ok) { alert('✅ کاربر از بلاک خارج شد.'); loadChats(); }
    } else {
        if (!confirm('آیا از بلاک کردن مطمئن هستید؟')) return;
        const res = await blockSocialUser(session.id, targetId);
        if (res.ok) { alert('🚫 کاربر بلاک شد.'); loadChats(); }
    }
}

async function reportUser(targetId) {
    const reason = prompt('دلیل گزارش خود را بنویسید:');
    if (reason) { const res = await reportSocialUser(session.id, targetId, reason); if (res.ok) alert('⚠️ گزارش شما ثبت شد.'); }
}

let currentRoomMembers = [];
async function openRoomInfo() {
    if (!activeChat || activeChat.type !== 'room') return;
    document.getElementById('roomInfoModal').classList.add('show');
    document.getElementById('roomInfoTitle').innerText = `اطلاعات ${activeChat.role === 'channel' ? 'کانال' : 'گروه'} ${activeChat.name}`;
    document.getElementById('roomLinkCode').innerText = activeChat.link_code;
    const res = await getRoomMembers(activeChat.id);
    if (res.ok) {
        currentRoomMembers = res.data.members;
        document.getElementById('roomMembersCount').innerText = currentRoomMembers.length;
        document.getElementById('roomMembersList').innerHTML = currentRoomMembers.map(m => `
            <div class="member-item"><div class="member-avatar">👤</div><div class="member-name">${m.name}</div>
                ${m.group_role === 'admin' ? '<span class="member-role">ادمین</span>' : ''}
            </div>
        `).join('');
    }
}
function closeRoomInfo() { document.getElementById('roomInfoModal').classList.remove('show'); }
function copyInviteLink() { navigator.clipboard.writeText(activeChat.link_code); alert('📋 کد دعوت کپی شد.'); }
async function deleteRoom() {
    if (!confirm('آیا از حذف این گروه مطمئن هستید؟')) return;
    const res = await deleteSocialRoom(activeChat.id, session.id);
    if (res.ok) {
        alert('🗑 گروه حذف شد.'); closeRoomInfo();
        document.getElementById('sidebar').classList.remove('hidden');
        chatHeader.style.display = 'none'; chatMessages.style.display = 'none'; chatInputArea.style.display = 'none';
        activeChat = null; loadChats();
    } else { alert('❌ ' + res.error); }
}

function openCreateRoomModal() { document.getElementById('createRoomModal').classList.add('show'); }
function closeCreateRoomModal() { document.getElementById('createRoomModal').classList.remove('show'); }
async function createRoom() {
    const name = document.getElementById('roomName').value.trim();
    const type = document.getElementById('roomType').value;
    if (!name) return alert('نام را وارد کنید.');
    const res = await createSocialRoom(session.id, name, type);
    if (res.ok) { alert('✅ ساخته شد!'); closeCreateRoomModal(); loadChats(); } else alert('❌ خطا');
}

function openJoinModal() { document.getElementById('joinModal').classList.add('show'); }
function closeJoinModal() { document.getElementById('joinModal').classList.remove('show'); }
async function joinRoom() {
    const code = document.getElementById('joinLinkCode').value.trim();
    if (!code) return alert('کد دعوت را وارد کنید.');
    const res = await joinSocialRoom(session.id, code);
    if (res.ok) { alert('✅ با موفقیت عضو شدید!'); closeJoinModal(); loadChats(); } else alert('❌ ' + res.error);
}

async function loadAllUsers() {
    listContainer.innerHTML = '<p style="text-align:center; color:#8aa3c9; padding:20px;">در حال دریافت...</p>';
    const res = await getSocialUsers(session.id);
    if (!res.ok) return;
    allUsersList = res.data.users;
    renderUsersList(allUsersList);
}

function renderUsersList(users) {
    if (users.length === 0) { listContainer.innerHTML = '<p style="text-align:center; color:#8aa3c9; padding:20px;">کاربری پیدا نشد</p>'; return; }
    listContainer.innerHTML = users.map(u => `
        <div class="contact-item" onclick="openChat(${u.id}, '${u.name.replace(/'/g, "\\'")}', 'direct', '${u.role}', '')">
            <div class="contact-avatar">👤</div>
            <div class="contact-info">
                <div class="contact-name">${u.name} ${u.role === 'admin' ? '<span class="admin-badge">ادمین</span>' : ''}</div>
                <div class="contact-last-msg">${u.plan === 'pro' ? '👑 کاربر ویژه' : '🟢 کاربر رایگان'}</div>
            </div>
        </div>
    `).join('');
}

function filterUsers() {
    const term = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!term) { renderUsersList(allUsersList); return; }
    renderUsersList(allUsersList.filter(u => u.name.toLowerCase().includes(term)));
}

function showSidebar() {
    document.getElementById('sidebar').classList.remove('hidden');
    chatHeader.style.display = 'none'; chatMessages.style.display = 'none'; chatInputArea.style.display = 'none';
    memberCountSpan.innerText = '';
    cancelReply();
}

async function openChat(id, name, type, role, linkCode) {
    activeChat = { id, name, type, role, link_code: linkCode };
    cancelReply();
    chatName.innerText = name;
    chatAvatar.innerText = type === 'room' ? (role === 'channel' ? '📢' : '👥') : (role === 'admin' ? '🛡️' : '👤');
    chatStatus.innerText = type === 'room' ? 'گروه' : 'آنلاین';
    
    if (type === 'room') {
        const memRes = await getRoomMembers(id);
        memberCountSpan.innerText = memRes.ok ? `(${memRes.data.members.length} عضو)` : '';
    } else { memberCountSpan.innerText = ''; }

    document.getElementById('sidebar').classList.add('hidden');
    chatHeader.style.display = 'flex'; chatMessages.style.display = 'flex'; chatInputArea.style.display = 'flex';
    emptyChat.style.display = 'none';

    await loadMessages();
    if (type === 'direct') await markSocialAsRead(session.id, id);

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(loadMessages, 3000);
}

async function loadMessages() {
    if (!activeChat) return;
    let msgs = [];
    if (activeChat.type === 'direct') {
        const res = await getSocialHistory(session.id, activeChat.id);
        if (res.ok) msgs = res.data.messages;
    } else {
        const res = await getRoomMessages(activeChat.id, session.id);
        if (res.ok) msgs = res.data.messages;
    }

    const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100;
    const currentCount = chatMessages.querySelectorAll('.msg-bubble').length;
    if (currentCount === msgs.length && !chatMessages.querySelector('.msg-bubble[data-is-new="true"]')) return;

    chatMessages.innerHTML = '';
    if (msgs.length === 0) {
        chatMessages.innerHTML = '<p style="text-align:center; color:#8aa3c9; font-size:13px; margin-top:20px;">شروع کن!</p>';
        return;
    }

    msgs.forEach(m => {
        const isMine = m.sender_id === session.id;
        const time = new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const senderName = activeChat.type === 'room' && !isMine ? `<span class="msg-sender-name">${m.sender_name}</span>` : '';

        let checkmark = '';
        if (isMine && activeChat.type === 'direct') {
            checkmark = m.is_read 
                ? `<span style="color: #4ade80; margin-right: 4px; font-size: 12px;">✓✓</span>` 
                : `<span style="color: #8aa3c9; margin-right: 4px; font-size: 12px;">✓</span>`;
        }

        let replyHTML = '';
        if (m.reply_to_id && m.reply_text) {
            replyHTML = `
                <div class="reply-quote">
                    <span class="reply-name">${m.reply_sender_name}</span>
                    <span class="reply-text">${m.reply_text.substring(0, 50)}${m.reply_text.length > 50 ? '...' : ''}</span>
                </div>
            `;
        }

        let reactionsHTML = '';
        if (m.reactions && m.reactions.length > 0) {
            const counts = {};
            m.reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
            reactionsHTML = `<div class="msg-reactions">`;
            for (const [emoji, count] of Object.entries(counts)) {
                reactionsHTML += `<span class="reaction-badge">${emoji} ${count}</span>`;
            }
            reactionsHTML += `</div>`;
        }

        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${isMine ? 'outgoing' : 'incoming'}`;
        bubble.dataset.msgId = m.id;
        bubble.innerHTML = `
            ${senderName}
            ${replyHTML}
            <div style="word-wrap: break-word;">${m.text}</div>
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 4px;">
                <span class="msg-time" style="position: static;">${time}</span>
                ${checkmark}
            </div>
            ${reactionsHTML}
            <button class="msg-menu-btn" title="گزینه‌ها"><i class="fas fa-ellipsis-v"></i></button>
        `;
        
        bubble.querySelector('.msg-menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showMsgOptions(m.id, isMine, m.text);
        });
        
        chatMessages.appendChild(bubble);
    });
    
    if (isScrolledToBottom || currentCount === 0) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
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

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeChat) return;
    
    const replyId = activeReply ? activeReply.id : null;
    messageInput.value = '';
    cancelReply();
    messageInput.focus();

    if (activeChat.type === 'direct') {
        await sendSocialMessage(session.id, activeChat.id, text, replyId);
    } else {
        const res = await sendRoomMessage(session.id, activeChat.id, text, replyId);
        if (!res.ok) alert(res.error);
    }
    await loadMessages();
}

function showMsgOptions(msgId, isMine, text) {
    currentMsgId = msgId;
    currentMsgIsMine = isMine;
    document.getElementById('btnDeleteForEveryone').style.display = isMine ? 'flex' : 'none';
    document.getElementById('msgOptionsModal').dataset.msgText = text;
    const bubble = document.querySelector(`.msg-bubble[data-msg-id="${msgId}"]`);
    const senderName = bubble.querySelector('.msg-sender-name') ? bubble.querySelector('.msg-sender-name').innerText : (isMine ? "شما" : activeChat.name);
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

function copyMessageText() {
    navigator.clipboard.writeText(document.getElementById('msgOptionsModal').dataset.msgText).then(() => {
        alert('📋 متن کپی شد.'); closeMsgOptions();
    });
}

async function reactToCurrentMessage(emoji) {
    if (!currentMsgId) return;
    const msgType = activeChat.type === 'room' ? 'room' : 'direct';
    await reactToMessage(currentMsgId, msgType, session.id, emoji);
    closeMsgOptions();
    await loadMessages();
}

async function deleteForMe() {
    if (!currentMsgId) return;
    const msgType = activeChat.type === 'room' ? 'room' : 'direct';
    const res = await deleteMessageForMe(currentMsgId, msgType, session.id);
    if (res.ok) {
        closeMsgOptions();
        const bubble = document.querySelector(`.msg-bubble[data-msg-id="${currentMsgId}"]`);
        if (bubble) bubble.remove();
    } else { alert('❌ ' + res.error); }
}

async function deleteForEveryone() {
    if (!currentMsgId || !currentMsgIsMine) return;
    if (!confirm('آیا مطمئنید که می‌خواهید این پیام را برای همه حذف کنید؟')) return;
    const msgType = activeChat.type === 'room' ? 'room' : 'direct';
    const res = await deleteMessageForEveryone(currentMsgId, msgType, session.id);
    if (res.ok) {
        closeMsgOptions();
        const bubble = document.querySelector(`.msg-bubble[data-msg-id="${currentMsgId}"]`);
        if (bubble) bubble.remove();
    } else { alert('❌ ' + res.error); }
}