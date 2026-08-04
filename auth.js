// ==================== AUTH SYSTEM ====================

let authState = {
    contact: '',
    type: '',
    code: '',
    expires: 0
};

// ==================== REGISTER ====================
function handleRegister(e, type) {
    e.preventDefault();

    let value;

    if (type === 'email') {
        value = document.getElementById('email').value.trim();

        if (!value.includes('@')) {
            alert('ایمیل معتبر وارد کن');
            return;
        }
    }

    if (type === 'phone') {
        value = document.getElementById('phone').value.trim();

        if (!/^[0-9]{10}$/.test(value)) {
            alert('شماره معتبر وارد کن (مثلاً 9121234567)');
            return;
        }

        value = '+98' + value;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    authState = {
        contact: value,
        type: type,
        code: code,
        expires: Date.now() + 120000
    };

    localStorage.setItem('auth', JSON.stringify(authState));

    console.log("SEND TO:", value);
    console.log("CODE:", code);

    alert(`کد برای ${type === 'phone' ? 'شماره' : 'ایمیل'} ارسال شد:\n${code}`);

    window.location.href = "verify.html";
}

// ==================== VERIFY PAGE ====================
document.addEventListener('DOMContentLoaded', () => {

    const inputs = document.querySelectorAll('.code-input');
    if (!inputs.length) return;

    const verifyBtn = document.getElementById('verify-btn');
    const resendBtn = document.getElementById('resend-btn');
    const timerEl = document.getElementById('timer-count');
    const resendTimerEl = document.getElementById('resend-timer');
    const contactEl = document.getElementById('verify-contact');

    let authData = JSON.parse(localStorage.getItem('auth'));

    if (!authData) {
        alert('خطا: اطلاعات یافت نشد');
        window.location.href = 'register.html';
        return;
    }

    // نمایش بهتر
    contactEl.textContent =
        authData.type === 'phone'
            ? 'شماره: ' + maskPhone(authData.contact)
            : 'ایمیل: ' + authData.contact;

    // ================= TIMER =================
    let timer;
    function startTimer() {
        clearInterval(timer);

        let timeLeft = Math.max(0, Math.floor((authData.expires - Date.now()) / 1000));

        timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert('کد منقضی شد');
                return;
            }

            const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            const sec = String(timeLeft % 60).padStart(2, '0');
            timerEl.textContent = `${min}:${sec}`;

            timeLeft--;
        }, 1000);
    }

    startTimer();

    // ================= INPUT =================
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {

            input.value = input.value.replace(/[^0-9]/g, '');

            if (input.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            const code = Array.from(inputs).map(i => i.value).join('');
            verifyBtn.disabled = code.length !== 6;
        });
    });

    // ================= VERIFY =================
    verifyBtn.addEventListener('click', () => {

        const code = Array.from(inputs).map(i => i.value).join('');

        authData = JSON.parse(localStorage.getItem('auth')); // 👈 همیشه جدید بگیر

        if (Date.now() > authData.expires) {
            alert('کد منقضی شده');
            return;
        }

        if (code === authData.code) {

            const user = {
                contact: authData.contact,
                type: authData.type,
                is_verified: true,
                created_at: new Date().toISOString()
            };

            localStorage.setItem('ai_coder_user', JSON.stringify(user));
            localStorage.setItem('loggedIn', 'true');
            localStorage.removeItem('auth');

            alert('ورود موفق ✅');

            // ========== تنظیم مقدار اولیه XP و سکه ==========
            if (!localStorage.getItem('userXP')) {
                localStorage.setItem('userXP', '0');
            }
            if (!localStorage.getItem('userCoins')) {
                localStorage.setItem('userCoins', '0');
            }
            if (!localStorage.getItem('username')) {
                localStorage.setItem('username', 'کاربر');
            }
            // ============================================

            window.location.href = 'assessment.html';

        } else {
            alert('کد اشتباه است');
        }
    });

    // ================= RESEND =================
    resendBtn.addEventListener('click', () => {

        authData = JSON.parse(localStorage.getItem('auth')); // 👈 مهم

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newAuth = {
            ...authData,
            code: newCode,
            expires: Date.now() + 120000
        };

        localStorage.setItem('auth', JSON.stringify(newAuth));
        authData = newAuth;

        alert('کد جدید: ' + newCode);

        // ریست تایمر اصلی
        startTimer();

        // تایمر resend
        resendBtn.disabled = true;
        let resendTime = 60;

        const newTimer = setInterval(() => {
            if (resendTime <= 0) {
                clearInterval(newTimer);
                resendBtn.disabled = false;
                resendBtn.textContent = 'ارسال مجدد کد';
                return;
            }

            resendTimerEl.textContent = resendTime;
            resendTime--;
        }, 1000);
    });

});

// ================= HELPERS =================
function maskPhone(phone) {
    return phone.slice(0, 4) + '****' + phone.slice(-2);
}

function switchTab(tab) {

    const emailForm = document.getElementById('email-form');
    const phoneForm = document.getElementById('phone-form');

    const tabs = document.querySelectorAll('.auth-tab');

    // حذف active از همه
    tabs.forEach(btn => btn.classList.remove('active'));

    if (tab === 'email') {
        emailForm.style.display = 'block';
        phoneForm.style.display = 'none';

        tabs[0].classList.add('active');
    } else {
        emailForm.style.display = 'none';
        phoneForm.style.display = 'block';

        tabs[1].classList.add('active');
    }
}