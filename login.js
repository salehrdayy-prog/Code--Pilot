document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const form = $('loginForm');
  if (!form) return;

  const loginInput = $('loginInput');
  const otpInput = $('otpCode');
  const detailsStep = $('loginDetailsStep');
  const otpStep = $('loginOtpStep');
  const requestBtn = $('requestCodeBtn');
  const verifyBtn = $('verifyCodeBtn');
  const backBtn = $('backToLoginBtn');
  const resendBtn = $('resendCodeBtn');
  const messageBox = $('loginMessage');
  const subtitle = $('loginSubtitle');

  let currentLoginValue = '';
  let requestInProgress = false;
  let verifyInProgress = false;

  function normalizeDigits(value) {
    return String(value || '')
      .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  }

  function showMessage(message, type = 'error') {
    messageBox.textContent = message;
    messageBox.className = `auth-message${type === 'error' ? '' : ` ${type}`}`;
  }

  function setBusy(button, busy, busyText, normalText) {
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
  }

  function normalizeLoginValue() {
    const value = normalizeDigits(loginInput.value).trim();
    return value.includes('@') ? value.toLowerCase() : value.replace(/\s+/g, '');
  }

  function validateLoginValue(value) {
    if (!value) {
      showMessage('ایمیل یا شماره موبایل را وارد کنید.');
      loginInput.focus();
      return false;
    }

    if (value.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        showMessage('آدرس ایمیل معتبر نیست.');
        loginInput.focus();
        return false;
      }
    } else if (!/^09\d{9}$/.test(value)) {
      showMessage('شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.');
      loginInput.focus();
      return false;
    }

    return true;
  }

  function extractData(result) {
    return result?.data?.data || result?.data || result;
  }

  async function requestCode() {
    if (requestInProgress) return;

    const loginValue = normalizeLoginValue();
    if (!validateLoginValue(loginValue)) return;

    if (typeof requestLoginCode !== 'function') {
      showMessage('تابع درخواست کد در api.js پیدا نشد.');
      return;
    }

    currentLoginValue = loginValue;
    requestInProgress = true;

    setBusy(requestBtn, true, 'در حال ارسال...', 'ارسال کد ورود');
    resendBtn.disabled = true;

    showMessage('در حال ارسال کد تأیید به ایمیل مرتبط با حساب...', 'info');

    try {
      const result = await requestLoginCode(currentLoginValue);

      if (!result?.ok) {
        showMessage(result?.error || result?.data?.error || 'ارسال کد انجام نشد.');
        return;
      }

      const data = extractData(result);

      detailsStep.classList.add('hidden');
      otpStep.classList.remove('hidden');

      subtitle.textContent =
        data?.message || 'کد ورود به ایمیل مرتبط با حساب شما ارسال شد.';

      showMessage('ایمیل خود را بررسی کنید و کد ۶ رقمی را وارد کنید.', 'success');

      otpInput.value = '';
      otpInput.focus();

    } catch (error) {
      console.error(error);
      showMessage(error.message || 'ارتباط با سرور برقرار نشد.');

    } finally {
      requestInProgress = false;
      setBusy(requestBtn, false, 'در حال ارسال...', 'ارسال کد ورود');
      resendBtn.disabled = false;
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    requestCode();
  });

  loginInput.addEventListener('input', () => {
    loginInput.value = normalizeDigits(loginInput.value);
    showMessage('');
  });

  otpInput.addEventListener('input', () => {
    otpInput.value = normalizeDigits(otpInput.value)
      .replace(/\D/g, '')
      .slice(0, 6);

    showMessage('');
  });

  backBtn.addEventListener('click', () => {
    if (verifyInProgress || requestInProgress) return;

    otpStep.classList.add('hidden');
    detailsStep.classList.remove('hidden');

    otpInput.value = '';
    currentLoginValue = '';

    subtitle.textContent =
      'ایمیل یا شماره موبایل خود را وارد کنید تا کد ورود برایتان ارسال شود.';

    showMessage('');
    loginInput.focus();
  });

  resendBtn.addEventListener('click', requestCode);

  verifyBtn.addEventListener('click', async () => {
    if (verifyInProgress) return;

    const code = normalizeDigits(otpInput.value).replace(/\D/g, '');

    if (!currentLoginValue) {
      showMessage('ابتدا درخواست کد ورود را انجام دهید.');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      showMessage('کد تأیید باید دقیقاً ۶ رقم باشد.');
      otpInput.focus();
      return;
    }

    if (typeof verifyLoginCode !== 'function') {
      showMessage('تابع تأیید کد در api.js پیدا نشد.');
      return;
    }

    verifyInProgress = true;

    setBusy(verifyBtn, true, 'در حال بررسی...', 'تأیید کد و ورود');
    backBtn.disabled = true;
    resendBtn.disabled = true;

    showMessage('در حال بررسی کد تأیید...', 'info');

    try {
      const result = await verifyLoginCode(currentLoginValue, code);

      if (!result?.ok) {
        showMessage(
          result?.error ||
          result?.data?.error ||
          'کد اشتباه است یا اعتبار آن تمام شده است.'
        );
        return;
      }

      const data = extractData(result);
      const user = data?.user || result?.user;
      const token = data?.token || result?.token;

      if (!user?.id) {
        showMessage('پاسخ سرور معتبر نیست؛ اطلاعات حساب دریافت نشد.');
        return;
      }

      const safeUser = { ...user };
      const session = {
        id: user.id,
        role: user.role || 'user'
      };

      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }

      localStorage.setItem('session', JSON.stringify(session));
      localStorage.setItem('loggedInUser', JSON.stringify(safeUser));
      localStorage.setItem('username', user.name || 'کاربر');
      localStorage.setItem('userXP', String(user.xp ?? 0));
      localStorage.setItem('userCoins', String(user.coins ?? 0));
      localStorage.setItem('userPlan', user.plan || 'free');
      localStorage.setItem(
        'userLevel',
        user.role === 'admin' ? '🛡️ ادمین' : '🟢 مبتدی'
      );
      localStorage.setItem('loggedIn', 'true');

      showMessage('ورود موفق بود؛ در حال انتقال...', 'success');

      window.setTimeout(() => {
        window.location.href =
          user.role === 'admin' ? 'admin.html' : 'ideas.html';
      }, 500);

    } catch (error) {
      console.error(error);
      showMessage(error.message || 'ارتباط با سرور برقرار نشد.');

    } finally {
      verifyInProgress = false;
      setBusy(verifyBtn, false, 'در حال بررسی...', 'تأیید کد و ورود');
      backBtn.disabled = false;
      resendBtn.disabled = false;
    }
  });
});
