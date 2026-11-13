// ============================================================
//  store.js - سیستم کامل فروشگاه (نسخه ضد کرش)
// ============================================================

const storeData = {
    themes: [
        { id: "theme-ocean", name: "آبی دریا", icon: "🌊", price: 50, desc: "تم آبی آرام‌بخش", color: "#0a192f", primary: "#64ffda" },
        { id: "theme-royal", name: "بنفش سلطنتی", icon: "👑", price: 100, desc: "تم بنفش شیک", color: "#1a0b2e", primary: "#a855f7" },
        { id: "theme-dark", name: "تاریک پیشرفته", icon: "🌙", price: 200, desc: "تم تاریک حرفه‌ای", color: "#02030a", primary: "#8b5cf6" }
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
function getCoins() { return parseInt(localStorage.getItem('userCoins')) || 0; }
function setCoins(amount) { localStorage.setItem('userCoins', amount.toString()); updateHeaderCoins(); }
function getOwnedItems() { try { return JSON.parse(localStorage.getItem('owned_items')) || []; } catch { return []; } }
function saveOwnedItems(items) { localStorage.setItem('owned_items', JSON.stringify(items)); }
function getActiveBoosters() { try { return JSON.parse(localStorage.getItem('active_boosters')) || {}; } catch { return {}; } }
function saveActiveBoosters(boosters) { localStorage.setItem('active_boosters', JSON.stringify(boosters)); }

function updateHeaderCoins() {
    const el = document.getElementById('headerCoins');
    if (el) el.innerHTML = `<i class="fas fa-coins"></i> ${getCoins()}`;
}

// ===== همگام‌سازی سکه‌ها (با چک کردن امن) =====
async function syncUserData() {
    // اگه api.js لود نشده بود، بی‌خیال شو که کرش نکنه
    if (typeof apiRequest !== 'function') {
        console.warn("api.js لود نشده است. از سکه‌های محلی استفاده می‌شود.");
        return;
    }
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.id) return;

    try {
        const res = await apiRequest(`/user/${session.id}`);
        if (res.ok && res.data.user) {
            localStorage.setItem('userCoins', res.data.user.coins || 0);
            localStorage.setItem('userXP', res.data.user.xp || 0);
            updateHeaderCoins();
        }
    } catch (e) {
        console.warn("خطا در دریافت از دیتابیس:", e);
    }
}

// ===== خرید کالا =====
function buyItem(category, itemId) {
    const item = storeData[category]?.find(i => i.id === itemId);
    if (!item) return alert("❌ کالا پیدا نشد!");
    
    const owned = getOwnedItems();
    if (owned.includes(itemId)) return alert("✅ این کالا را قبلاً خریده‌اید!");
    
    const coins = getCoins();
    if (coins < item.price) return alert(`❌ سکه کافی نیست! نیاز به ${item.price} سکه دارید.`);
    
    if (!confirm(`آیا مطمئنید که می‌خواهید "${item.name}" را با ${item.price} سکه بخرید؟`)) return;

    setCoins(coins - item.price);
    owned.push(itemId);
    saveOwnedItems(owned);

    if (category === 'themes') applyTheme(itemId);
    if (category === 'boosters') activateBooster(itemId);

    alert(`✅ "${item.name}" با موفقیت خریداری شد!`);
    renderStore();
}

// ===== اعمال تم =====
function applyTheme(themeId) {
    const owned = getOwnedItems();
    if (!owned.includes(themeId)) return alert("❌ این قالب را نخریده‌اید!");
    const theme = storeData.themes.find(t => t.id === themeId);
    if (!theme) return;

    localStorage.setItem('active_theme', themeId);
    document.documentElement.style.setProperty('--bg', theme.color);
    document.documentElement.style.setProperty('--primary', theme.primary);
    alert(`🎨 قالب "${theme.name}" روی کل سایت اعمال شد!`);
    renderStore();
}

// ===== غیرفعال کردن تم =====
function removeTheme() {
    localStorage.removeItem('active_theme');
    document.documentElement.style.setProperty('--bg', '#02030a');
    document.documentElement.style.setProperty('--primary', '#8b5cf6');
    alert('🎨 تم به حالت پیش‌فرض برگشت.');
    renderStore();
}

// ===== فعال‌سازی تقویت‌کننده =====
function activateBooster(boosterId) {
    const boosters = getActiveBoosters();
    const now = Date.now();
    if (boosters[boosterId] && boosters[boosterId] > now) return alert("⏳ این تقویت‌کننده هنوز فعال است!");
    boosters[boosterId] = now + 3600000;
    saveActiveBoosters(boosters);
    alert(`✅ تقویت‌کننده فعال شد! (۱ ساعت)`);
}

// ===== رندر کامل فروشگاه =====
function renderStore() {
    updateHeaderCoins();
    const owned = getOwnedItems();

    // ۱. قالب‌ها
    const themesGrid = document.getElementById('themesGrid');
    if (themesGrid) {
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
                        ? `<button class="btn-buy ${isActive ? 'owned' : ''}" onclick="applyTheme('${item.id}')">${isActive ? '✅ فعال' : 'فعال کردن'}</button>
                           ${isActive ? `<button class="btn-buy" style="background:#ef4444; margin-top:5px;" onclick="removeTheme()">❌ غیرفعال</button>` : ''}`
                        : `<button class="btn-buy" onclick="buyItem('themes','${item.id}')">خرید</button>`
                    }
                </div>
            `;
        });
    }

    // ۲. نشان‌ها
    const badgesGrid = document.getElementById('badgesGrid');
    if (badgesGrid) {
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
    }

    // ۳. تقویت‌کننده‌ها
    const boostersGrid = document.getElementById('boostersGrid');
    if (boostersGrid) {
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
    }

    // ۴. تمرین‌ها
    const exercisesGrid = document.getElementById('exercisesGrid');
    if (exercisesGrid) {
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
    }

    // ۵. هوش مصنوعی
    const aiGrid = document.getElementById('aiGrid');
    if (aiGrid) {
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
}

// ===== بارگذاری اولیه =====
document.addEventListener('DOMContentLoaded', async () => {
    await syncUserData(); // اول تلاش میکنه سکه رو آپدیت کنه

    if (!localStorage.getItem('userCoins')) localStorage.setItem('userCoins', '0');
    
    // اعمال تم
    const activeThemeId = localStorage.getItem('active_theme');
    if (activeThemeId) {
        const theme = storeData.themes.find(t => t.id === activeThemeId);
        if (theme) {
            document.documentElement.style.setProperty('--bg', theme.color);
            document.documentElement.style.setProperty('--primary', theme.primary);
        }
    }
    
    renderStore(); // در هر صورت لیست رو نشون بده
});