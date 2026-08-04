// ==================== UTILS ====================

// تولید UUID ساده
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// فرمت تاریخ شمسی ساده
function toPersianDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', calendar: 'persian' };
    
    try {
        return date.toLocaleDateString('fa-IR', options);
    } catch (e) {
        return date.toLocaleDateString('fa-IR');
    }
}

// کپی متن به کلیپبورد
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            return true;
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// throttle
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// تشخیص نوع پروژه از متن
function detectProjectType(text) {
    const t = text.toLowerCase();
    if (t.includes('بازی') || t.includes('game')) return 'بازی';
    if (t.includes('موبایل') || t.includes('اپ') || t.includes('android') || t.includes('ios')) return 'موبایل';
    if (t.includes('بات') || t.includes('ربات') || t.includes('bot')) return 'بات';
    if (t.includes('دسکتاپ') || t.includes('desktop')) return 'دسکتاپ';
    return 'وب';
}

// محاسبه سطح از XP
function calculateLevel(xp) {
    if (xp >= 10000) return { level: 8, title: '🌟 اسطوره', icon: '🌟' };
    if (xp >= 5000) return { level: 7, title: '👑 استاد بزرگ', icon: '👑' };
    if (xp >= 2000) return { level: 6, title: '🐉 اژدها', icon: '🐉' };
    if (xp >= 1000) return { level: 5, title: '🦅 عقاب', icon: '🦅' };
    if (xp >= 600) return { level: 4, title: '🦊 حیله‌گر', icon: '🦊' };
    if (xp >= 300) return { level: 3, title: '🐥 جوان', icon: '🐥' };
    if (xp >= 100) return { level: 2, title: '🐣 جوجه', icon: '🐣' };
    return { level: 1, title: '🥚 تازه‌کار', icon: '🥚' };
}

// نمایش نوتیفیکیشن
function showNotification(message, type = 'info') {
    // می‌تونیم از یه toast ساده استفاده کنیم
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideDown 0.3s ease;
        background: ${type === 'success' ? '#00B894' : type === 'error' ? '#E17055' : '#6C5CE7'};
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}