// ============================================================
// dashboard.js - کاملاً هماهنگ با dashboard.html
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
function loadUserData() {
    const name = localStorage.getItem('username') || 'کاربر';
    const level = localStorage.getItem('userLevel') || '🟢 مبتدی';
    const xp = localStorage.getItem('userXP') || '۰';
    const coins = localStorage.getItem('userCoins') || '۰';

    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-level').textContent = level;
    document.getElementById('menu-username').textContent = name;
    document.getElementById('menu-level').textContent = level;
    document.getElementById('profile-xp').textContent = xp;
    document.getElementById('profile-coins').textContent = coins;
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
function loadDashboardProjects() {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
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
        document.getElementById('profile-projects').innerText = '۰';
        return;
    }

    container.innerHTML = '';
    
    projects.forEach((project, index) => {
        const projectName = project.name || 'بی‌نام';
        const projectDate = project.date || 'تاریخ نامشخص';

        const div = document.createElement('div');
        div.className = 'project-card';
        
        div.innerHTML = `
            <div class="project-info">
                <h4>${projectName}</h4>
                <p>${projectDate}</p>
            </div>
            <div class="project-actions">
                <button class="open-btn" onclick="openProject(${index})">
                    <i class="fas fa-folder-open"></i>
                </button>
                <button class="delete-btn" onclick="deleteProject(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });

    document.getElementById('profile-projects').innerText = projects.length;
}

// ===== ۵. باز کردن پروژه (اصلاح شده) =====
function openProject(index) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    if (!projects[index]) {
        alert('❌ پروژه پیدا نشد!');
        return;
    }

    const project = projects[index];

    // ذخیره پروژه برای build.html
    localStorage.setItem('currentProject', JSON.stringify(project));
    localStorage.setItem('selectedIdea', project.name);
    
    // ذخیره کدها برای done.html
    localStorage.setItem('html', project.html || '');
    localStorage.setItem('css', project.css || '');
    localStorage.setItem('js', project.js || '');

    window.location.href = 'build.html';
}

// ===== ۶. حذف پروژه =====
function deleteProject(index) {
    if (!confirm('آیا مطمئنی که می‌خواهی این پروژه را حذف کنی؟')) return;
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    if (projects[index]) {
        projects.splice(index, 1);
        localStorage.setItem('projects', JSON.stringify(projects));
        loadDashboardProjects();
        alert('✅ پروژه حذف شد!');
    } else {
        alert('❌ پروژه پیدا نشد!');
    }
}

// ===== ۷. خروج =====
function logout() {
    if (confirm('آیا مطمئنی می‌خواهی خارج شوی؟')) {
        localStorage.removeItem('username');
        localStorage.removeItem('userAvatar');
        localStorage.removeItem('userLevel');
        localStorage.removeItem('projects');
        window.location.href = 'index.html';
    }
}

// ===== ۸. اجرا پس از بارگذاری کامل صفحه =====
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadAvatar();
    loadDashboardProjects();

    // مدیریت آپلود عکس
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('لطفاً یک تصویر انتخاب کنید.');
                this.value = '';
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