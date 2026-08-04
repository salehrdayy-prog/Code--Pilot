// ============================================================
//  store.js - سیستم کامل فروشگاه
// ============================================================

// ===== داده‌های فروشگاه =====
const storeData = {
    themes: [
        { id: "theme-ocean", name: "آبی دریا", icon: "🌊", price: 50, desc: "تم آبی آرام‌بخش" },
        { id: "theme-royal", name: "بنفش سلطنتی", icon: "👑", price: 100, desc: "تم بنفش شیک" },
        { id: "theme-dark", name: "تاریک پیشرفته", icon: "🌙", price: 200, desc: "تم تاریک حرفه‌ای" }
    ],
    badges: [
        { id: "badge-novice", name: "تازه‌کار", icon: "🌱", price: 50, desc: "اولین قدم‌ها" },
        { id: "badge-pro", name: "سازنده حرفه‌ای", icon: "🔥", price: 150, desc: "ساخت ۱۰ پروژه" },
        { id: "badge-genius", name: "نابغه کد", icon: "🧠", price: 300, desc: "ساخت ۵۰ پروژه" }
    ],
    boosters: [
        { id: "boost-xp2", name: "دو برابر XP", icon: "⚡", price: 20, desc: "برای ۱ ساعت" },
        { id: "boost-coins2", name: "دو برابر سکه", icon: "💰", price: 30, desc: "برای ۱ ساعت" },
        { id: "boost-level", name: "پرش سطح", icon: "🚀", price: 50, desc: "مبتدی ➜ متوسط" }
    ],
    exercises: [
        { id: "ex-intermediate", name: "تمرین‌های متوسط", icon: "🟡", price: 50, desc: "باز کردن سطح متوسط" },
        { id: "ex-advanced", name: "تمرین‌های پیشرفته", icon: "🔴", price: 100, desc: "باز کردن سطح پیشرفته" }
    ],
    ai: [
        { id: "ai-debug", name: "تحلیل و رفع باگ", icon: "🐞", price: 10, desc: "برای هر بار استفاده" },
        { id: "ai-generate", name: "تولید کد کامل", icon: "✨", price: 20, desc: "بر اساس توضیح" },
        { id: "ai-optimize", name: "بهینه‌سازی کد", icon: "🚀", price: 30, desc: "بهبود عملکرد" }
    ]
};

// ===== ذخیره‌سازی =====
function getCoins() {
    return parseInt(localStorage.getItem('userCoins')) || 0;
}
function setCoins(amount) {
    localStorage.setItem('userCoins', amount.toString());
    updateHeaderCoins();
}

function getOwnedItems() {
    try {
        return JSON.parse(localStorage.getItem('owned_items')) || [];
    } catch {
        return [];
    }
}
function saveOwnedItems(items) {
    localStorage.setItem('owned_items', JSON.stringify(items));
}

function getActiveBoosters() {
    try {
        return JSON.parse(localStorage.getItem('active_boosters')) || {};
    } catch {
        return {};
    }
}
function saveActiveBoosters(boosters) {
    localStorage.setItem('active_boosters', JSON.stringify(boosters));
}

// ===== نمایش سکه در هدر =====
function updateHeaderCoins() {
    const el = document.getElementById('headerCoins');
    if (el) el.innerHTML = `<i class="fas fa-coins"></i> ${getCoins()}`;
}

// ===== خرید کالا =====
function buyItem(category, itemId) {
    const item = storeData[category]?.find(i => i.id === itemId);
    if (!item) {
        alert("❌ کالا پیدا نشد!");
        return;
    }

    const owned = getOwnedItems();
    if (owned.includes(itemId)) {
        alert("✅ این کالا را قبلاً خریده‌اید!");
        return;
    }

    const coins = getCoins();
    if (coins < item.price) {
        alert(`❌ سکه کافی نیست! نیاز به ${item.price} سکه دارید.`);
        return;
    }

    if (!confirm(`آیا مطمئنید که می‌خواهید "${item.name}" را با ${item.price} سکه بخرید؟`)) return;

    // کسر سکه
    setCoins(coins - item.price);

    // ذخیره در لیست خریدها
    owned.push(itemId);
    saveOwnedItems(owned);

    alert(`✅ "${item.name}" با موفقیت خریداری شد!`);

    // بازسازی صفحه
    renderStore();
}

// ===== فعال‌سازی تقویت‌کننده =====
function activateBooster(boosterId) {
    const boosters = getActiveBoosters();
    const now = Date.now();

    if (boosters[boosterId] && boosters[boosterId] > now) {
        alert("⏳ این تقویت‌کننده هنوز فعال است!");
        return;
    }

    // مدت زمان: ۱ ساعت
    boosters[boosterId] = now + 3600000;
    saveActiveBoosters(boosters);

    alert(`✅ تقویت‌کننده فعال شد! (۱ ساعت)`);
    renderStore();
}

// ===== اعمال قالب =====
function applyTheme(themeId) {
    const owned = getOwnedItems();
    if (!owned.includes(themeId)) {
        alert("❌ این قالب را نخریده‌اید!");
        return;
    }
    localStorage.setItem('active_theme', themeId);
    alert(`✅ قالب "${storeData.themes.find(t => t.id === themeId).name}" اعمال شد!`);
    renderStore();
}

// ===== بررسی قفل تمرین‌ها =====
function isExerciseUnlocked(level) {
    const owned = getOwnedItems();
    if (level === 'intermediate') return owned.includes('ex-intermediate');
    if (level === 'advanced') return owned.includes('ex-advanced');
    return true; // مبتدی همیشه باز است
}

// ===== بررسی قفل هوش مصنوعی =====
function isAIAvailable(aiId) {
    const owned = getOwnedItems();
    return owned.includes(aiId);
}

// ===== رندر فروشگاه =====
function renderStore() {
    updateHeaderCoins();
    const owned = getOwnedItems();

    // قالب‌ها
    const themesGrid = document.getElementById('themesGrid');
    themesGrid.innerHTML = '';
    storeData.themes.forEach(item => {
        const isOwned = owned.includes(item.id);
        const isActive = localStorage.getItem('active_theme') === item.id;
        themesGrid.innerHTML += `
            <div class="card">
                <span class="icon">${item.icon}</span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <span class="price">${isOwned ? '✔️ خریداری شده' : `${item.price} 🪙`}</span>
                ${isOwned 
                    ? `<button class="btn-buy ${isActive ? 'owned' : ''}" onclick="applyTheme('${item.id}')">${isActive ? '✅ فعال' : 'فعال کردن'}</button>`
                    : `<button class="btn-buy" onclick="buyItem('themes','${item.id}')">خرید</button>`
                }
            </div>
        `;
    });

    // نشان‌ها
    const badgesGrid = document.getElementById('badgesGrid');
    badgesGrid.innerHTML = '';
    storeData.badges.forEach(item => {
        const isOwned = owned.includes(item.id);
        badgesGrid.innerHTML += `
            <div class="card">
                <span class="icon">${item.icon}</span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <span class="price">${isOwned ? '✔️ خریداری شده' : `${item.price} 🪙`}</span>
                <button class="btn-buy ${isOwned ? 'owned' : ''}" onclick="${isOwned ? '' : `buyItem('badges','${item.id}')`}">${isOwned ? '✅ دارید' : 'خرید'}</button>
            </div>
        `;
    });

    // تقویت‌کننده‌ها
    const boostersGrid = document.getElementById('boostersGrid');
    boostersGrid.innerHTML = '';
    const activeBoosters = getActiveBoosters();
    const now = Date.now();
    storeData.boosters.forEach(item => {
        const isActive = activeBoosters[item.id] && activeBoosters[item.id] > now;
        const isOwned = owned.includes(item.id);
        boostersGrid.innerHTML += `
            <div class="card">
                <span class="icon">${item.icon}</span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <span class="price">${isOwned ? '✔️ خریداری شده' : `${item.price} 🪙`}</span>
                ${isOwned 
                    ? `<button class="btn-buy ${isActive ? 'owned' : ''}" onclick="activateBooster('${item.id}')">${isActive ? '✅ فعال' : 'فعال‌سازی'}</button>`
                    : `<button class="btn-buy" onclick="buyItem('boosters','${item.id}')">خرید</button>`
                }
            </div>
        `;
    });

    // تمرین‌های پیشرفته
    const exercisesGrid = document.getElementById('exercisesGrid');
    exercisesGrid.innerHTML = '';
    storeData.exercises.forEach(item => {
        const isOwned = owned.includes(item.id);
        exercisesGrid.innerHTML += `
            <div class="card">
                <span class="icon">${item.icon}</span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <span class="price">${isOwned ? '✔️ باز شده' : `${item.price} 🪙`}</span>
                <button class="btn-buy ${isOwned ? 'owned' : ''}" onclick="${isOwned ? '' : `buyItem('exercises','${item.id}')`}">${isOwned ? '✅ باز است' : 'باز کردن'}</button>
            </div>
        `;
    });

    // هوش مصنوعی
    const aiGrid = document.getElementById('aiGrid');
    aiGrid.innerHTML = '';
    storeData.ai.forEach(item => {
        const isOwned = owned.includes(item.id);
        aiGrid.innerHTML += `
            <div class="card">
                <span class="icon">${item.icon}</span>
                <h4>${item.name}</h4>
                <p>${item.desc}</p>
                <span class="price">${isOwned ? '✔️ خریداری شده' : `${item.price} 🪙`}</span>
                <button class="btn-buy ${isOwned ? 'owned' : ''}" onclick="${isOwned ? '' : `buyItem('ai','${item.id}')`}">${isOwned ? '✅ دارید' : 'خرید'}</button>
            </div>
        `;
    });
}

// ===== بارگذاری اولیه =====
document.addEventListener('DOMContentLoaded', () => {
    // اگر سکه وجود ندارد، مقدار اولیه تنظیم کن
    if (!localStorage.getItem('userCoins')) {
        localStorage.setItem('userCoins', '0');
    }
    renderStore();
});