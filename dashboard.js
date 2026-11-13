// ============================================================
// dashboard.js - متصل به دیتابیس ابری (با همگام‌سازی سکه‌ها)
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

// ===== ۲. اطلاعات کاربر (با دریافت از دیتابیس) =====
async function loadUserData() {
    // 👈 اول از دیتابیس اطلاعات جدید رو بگیر
    const session = JSON.parse(localStorage.getItem('session'));
    if (session && session.id) {
        try {
            const res = await apiRequest(`/user/${session.id}`);
            if (res.ok && res.data.user) {
                const user = res.data.user;
                // آپدیت حافظه مرورگر با اطلاعات جدید
                localStorage.setItem('userCoins', user.coins || 0);
                localStorage.setItem('userXP', user.xp || 0);
                localStorage.setItem('username', user.name || 'کاربر');
            }
        } catch (err) {
            console.warn("خطا در همگام‌سازی اطلاعات کاربر:", err);
        }
    }

    // 👈 حالا اطلاعات رو از حافظه بخون و نمایش بده
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

// ===== ۴. پروژه‌ها (از دیتابیس ابری) =====
async function loadDashboardProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;

    const session = JSON.parse(localStorage.getItem('session'));

    // اگر لاگین نبود، از حافظه محلی می‌خونیم
    if (!session || !session.id) {
        const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        renderProjectsList(localProjects);
        return;
    }

    // دریافت از دیتابیس ابری (تابع getUserProjects از api.js میاد)
    const result = await getUserProjects(session.id);
    
    if (result.ok) {
        renderProjectsList(result.data.projects);
    } else {
        console.warn('خطا در دریافت پروژه‌ها از دیتابیس:', result.error);
        const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        renderProjectsList(localProjects);
    }
}

// تابع کمکی برای نمایش لیست
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

// تابع باز کردن پروژه از دیتابیس
window.openProjectFromDB = async function(index) {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.id) return alert('لطفاً دوباره وارد شوید.');

    const result = await getUserProjects(session.id);
    if (result.ok && result.data.projects[index]) {
        const project = result.data.projects[index];
        
        // ذخیره اطلاعات پروژه برای build.html
        localStorage.setItem('currentProject', JSON.stringify(project));
        localStorage.setItem('html', project.html || '');
        localStorage.setItem('css', project.css || '');
        localStorage.setItem('js', project.js || '');
        
        window.location.href = 'build.html';
    }
};

// ===== ۸. اجرا پس از بارگذاری =====
document.addEventListener('DOMContentLoaded', function() {
    // اجرای توابع
    loadUserData();
    loadAvatar();
    loadDashboardProjects();

    // مدیریت آپلود عکس پروفایل
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { 
                alert('لطفاً یک تصویر انتخاب کنید.'); 
                return; 
            }

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