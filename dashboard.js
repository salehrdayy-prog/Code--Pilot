// ============================================================
// dashboard.js - متصل به دیتابیس ابری (با پیام‌رسانی)
// ============================================================

// ===== ۱. منوی کناری =====
function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    if (menu) {
        menu.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

// ===== ۲. اطلاعات کاربر =====
async function loadUserData() {
    const session = JSON.parse(localStorage.getItem('session'));
    if (session && session.id) {
        try {
            const res = await apiRequest(`/user/${session.id}`);
            if (res.ok && res.data.user) {
                const user = res.data.user;
                localStorage.setItem('userCoins', user.coins || 0);
                localStorage.setItem('userXP', user.xp || 0);
                localStorage.setItem('username', user.name || 'کاربر');
            }
        } catch (err) { console.warn("خطا در همگام‌سازی:", err); }
    }

    const name = localStorage.getItem('username') || 'کاربر';
    const level = localStorage.getItem('userLevel') || '🟢 مبتدی';
    const xp = localStorage.getItem('userXP') || '۰';
    const coins = localStorage.getItem('userCoins') || '۰';

    const elName = document.getElementById('profile-name');
    const elLevel = document.getElementById('profile-level');
    const elMenuName = document.getElementById('menu-username');
    const elMenuLevel = document.getElementById('menu-level');
    const elXp = document.getElementById('profile-xp');
    const elCoins = document.getElementById('profile-coins');

    if (elName) elName.textContent = name;
    if (elLevel) elLevel.textContent = level;
    if (elMenuName) elMenuName.textContent = name;
    if (elMenuLevel) elMenuLevel.textContent = level;
    if (elXp) elXp.textContent = xp;
    if (elCoins) elCoins.textContent = coins;
}

// ===== ۳. آواتار =====
function loadAvatar() {
    const saved = localStorage.getItem('userAvatar');
    const avatar = document.getElementById('dashboard-avatar');
    if (!avatar) return;
    
    if (saved) {
        avatar.style.backgroundImage = `url(${saved})`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.style.backgroundColor = 'transparent';
        avatar.innerText = '';
    } else {
        avatar.style.backgroundImage = 'none';
        avatar.style.backgroundColor = '#1a1a2e';
        avatar.innerText = '👤';
    }
}

// ===== ۴. پروژه‌ها =====
async function loadDashboardProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;

    const session = JSON.parse(localStorage.getItem('session'));

    if (!session || !session.id) {
        const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        renderProjectsList(localProjects);
        return;
    }

    const result = await getUserProjects(session.id);
    if (result.ok) {
        renderProjectsList(result.data.projects);
    } else {
        const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        renderProjectsList(localProjects);
    }
}

function renderProjectsList(projects) {
    const container = document.getElementById('projects-list');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <p>هنوز پروژه‌ای نساختی!</p>
                <a href="ideas.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i> ساخت اولین پروژه
                </a>
            </div>
        `;
        const countEl = document.getElementById('profile-projects');
        if (countEl) countEl.innerText = '۰';
        return;
    }

    container.innerHTML = '';
    
    projects.forEach((project, index) => {
        const div = document.createElement('div');
        div.className = 'project-card';
        div.innerHTML = `
            <div class="project-info">
                <h4>${project.name || 'بی‌نام'}</h4>
                <p>${project.date || 'تاریخ نامشخص'}</p>
            </div>
            <div class="project-actions">
                <button class="open-btn" onclick="openProjectFromDB(${index})">
                    <i class="fas fa-folder-open"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });

    const countEl = document.getElementById('profile-projects');
    if (countEl) countEl.innerText = projects.length;
}

window.openProjectFromDB = async function(index) {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.id) return alert('لطفاً دوباره وارد شوید.');

    const result = await getUserProjects(session.id);
    if (result.ok && result.data.projects[index]) {
        const project = result.data.projects[index];
        localStorage.setItem('currentProject', JSON.stringify(project));
        localStorage.setItem('html', project.html || '');
        localStorage.setItem('css', project.css || '');
        localStorage.setItem('js', project.js || '');
        window.location.href = 'build.html';
    }
};

// ===== ۵. پیام‌های ادمین (پاسخ و حذف) =====
async function loadMessages() {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.id) return;

    const res = await getUserMessages(session.id);
    const container = document.getElementById('adminMessages');
    const list = document.getElementById('messagesList');
    if (!container || !list) return;

    if (res.ok && res.data.messages.length > 0) {
        container.style.display = 'block';
        list.innerHTML = res.data.messages.map(m => {
            const isAdmin = m.sender === 'admin';
            const isRead = m.is_read;
            
            // اگر پیام از طرف ادمین بود و خوانده نشده بود، دکمه خواندم و پاسخ نشون بده
            const actions = isAdmin ? `
                <div style="display:flex; gap:5px; margin-top:10px;">
                    ${!isRead ? `<button onclick="readMessage(${m.id}, this)" style="background:#4ade80; color:#000; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;">خواندم</button>` : ''}
                    <button onclick="replyToMsg(${m.id})" style="background:#3b82f6; color:#fff; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;">پاسخ</button>
                    <button onclick="deleteMsg(${m.id})" style="background:#ef4444; color:#fff; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px;">حذف</button>
                </div>
            ` : '';

            return `
                <div id="msg-box-${m.id}" style="background: ${isAdmin ? 'rgba(250, 204, 21, 0.1)' : 'rgba(139, 92, 246, 0.1)'}; border: 1px solid ${isAdmin ? 'rgba(250, 204, 21, 0.3)' : 'rgba(139, 92, 246, 0.3)'}; padding: 15px; border-radius: 12px; margin-bottom: 10px; position: relative;">
                    <span style="font-size:11px; color:${isAdmin ? '#facc15' : '#8b5cf6'}; font-weight:bold;">${isAdmin ? '👤 پیام از طرف مدیریت' : '✉️ پاسخ شما'}</span>
                    <p style="color: #fff; margin: 8px 0;">${m.text}</p>
                    <small style="color: #8aa3c9;">${m.date}</small>
                    ${actions}
                    
                    <!-- فرم پاسخ (مخفی) -->
                    <div id="reply-form-${m.id}" style="display:none; margin-top:10px;">
                        <textarea id="reply-text-${m.id}" style="width:100%; padding:8px; border-radius:8px; background:rgba(0,0,0,0.3); border:1px solid #444; color:#fff; margin-bottom:5px; font-family:inherit;" rows="2" placeholder="پاسخ خود را بنویسید..."></textarea>
                        <button onclick="submitReply(${m.id})" style="background:#10b981; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px;">ارسال پاسخ</button>
                        <button onclick="closeReplyForm(${m.id})" style="background:#555; color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:12px;">انصراف</button>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.style.display = 'none';
    }
}

// خواندن پیام
async function readMessage(msgId, btn) {
    btn.innerText = '...';
    await markMessageAsRead(msgId);
    btn.remove(); // دکمه خواندم رو پاک میکنیم
}

// باز کردن فرم پاسخ
function replyToMsg(msgId) {
    const form = document.getElementById(`reply-form-${msgId}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if(form.style.display === 'block') {
            document.getElementById(`reply-text-${msgId}`).focus();
        }
    }
}

function closeReplyForm(msgId) {
    document.getElementById(`reply-form-${msgId}`).style.display = 'none';
}

// ارسال پاسخ
async function submitReply(msgId) {
    const text = document.getElementById(`reply-text-${msgId}`).value.trim();
    if (!text) return alert('لطفاً متن پاسخ را بنویسید.');
    
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.id) return;

    const res = await replyToAdmin(session.id, text);
    if (res.ok) {
        alert('✅ پاسخ شما ارسال شد.');
        loadMessages(); // رفرش لیست پیام‌ها
    } else {
        alert('❌ خطا در ارسال پاسخ');
    }
}

// حذف پیام
async function deleteMsg(msgId) {
    if (!confirm('آیا از حذف این پیام مطمئن هستید؟')) return;
    
    const res = await deleteUserMessage(msgId);
    if (res.ok) {
        const box = document.getElementById(`msg-box-${msgId}`);
        if (box) box.remove();
        // اگر همه پیام‌ها حذف شدن، مخفی کن
        if (document.getElementById('messagesList').children.length === 0) {
            document.getElementById('adminMessages').style.display = 'none';
        }
    } else {
        alert('❌ خطا در حذف پیام');
    }
}


// ===== ۸. اجرا پس از بارگذاری =====
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadAvatar();
    loadDashboardProjects();
    loadMessages(); // 👈 لود کردن پیام‌ها

    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { alert('لطفاً یک تصویر انتخاب کنید.'); return; }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                localStorage.setItem('userAvatar', base64);
                loadAvatar();
            };
            reader.readAsDataURL(file);
            this.value = '';
        });
    }
});