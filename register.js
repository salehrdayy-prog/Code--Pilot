document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const form = $('registerForm');
  if (!form) return;

  const nameInput = $('name');
  const phoneInput = $('phone');
  const emailInput = $('email');
  const codeInput = $('code');
  const informationStep = $('informationStep');
  const verificationStep = $('verificationStep');
  const requestCodeBtn = $('requestCodeBtn');
  const verifyCodeBtn = $('verifyCodeBtn');
  const backBtn = $('backBtn');
  const subtitle = document.querySelector('.subtitle');

  if (!nameInput || !phoneInput || !emailInput || !codeInput ||
      !informationStep || !verificationStep || !requestCodeBtn ||
      !verifyCodeBtn || !backBtn) {
    console.error('Register form markup is incomplete.');
    return;
  }

  let registrationDetails = null;
  let requestInProgress = false;
  let verifyInProgress = false;

  function normalizeDigits(value) {
    return String(value || '')
      .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  }

  function setError(id, input, message = '') {
    const errorElement = $(id);
    if (errorElement) errorElement.textContent = message;
    if (input) {
      input.classList.toggle('invalid', Boolean(message));
      if (!message) input.classList.remove('invalid');
    }
  }

  function showStatus(message, isError = false) {
    if (!subtitle) return;
    subtitle.textContent = message;
    subtitle.style.color = isError ? '#ff8a70' : '#aaa';
  }

  function setBusy(button, busy, busyText, normalText) {
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
  }

  function validateDetails() {
    const name = nameInput.value.trim();
    const phone = normalizeDigits(phoneInput.value).replace(/\s+/g, '');
    const email = emailInput.value.trim().toLowerCase();
    let valid = true;

    setError('name-error', nameInput);
    setError('phone-error', phoneInput);
    setError('email-error', emailInput);

    if (name.length < 3 || name.length > 50) {
      setError('name-error', nameInput, 'نام باید بین ۳ تا ۵۰ نویسه باشد.');
      valid = false;
    }

    if (!/^09\d{9}$/.test(phone)) {
      setError('phone-error', phoneInput, 'شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.');
      valid = false;
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email-error', emailInput, 'آدرس ایمیل معتبر نیست.');
      valid = false;
    }

    return { valid, name, phone, email };
  }

  [nameInput, phoneInput, emailInput].forEach(input => {
    input.addEventListener('input', () => {
      if (input === phoneInput) input.value = normalizeDigits(input.value);
      setError(`${input.id}-error`, input);
    });
  });

  codeInput.addEventListener('input', () => {
    codeInput.value = normalizeDigits(codeInput.value).replace(/\D/g, '').slice(0, 6);
    setError('code-error', codeInput);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (requestInProgress || verifyInProgress) return;

    const details = validateDetails();
    if (!details.valid) return;

    if (typeof requestRegistrationCode !== 'function') {
      showStatus('تابع ارسال کد در api.js پیدا نشد.', true);
      return;
    }

    registrationDetails = details;
    requestInProgress = true;
    setBusy(requestCodeBtn, true, 'در حال ارسال...', 'ارسال کد تأیید');
    showStatus('در حال ارسال کد تأیید به ایمیل شما...');

    try {
      const result = await requestRegistrationCode(details.name, details.phone, details.email);
      if (!result?.ok) {
        showStatus(result?.error || result?.data?.error || 'ارسال کد انجام نشد.', true);
        return;
      }

      informationStep.classList.add('hidden');
      verificationStep.classList.remove('hidden');
      codeInput.value = '';
      showStatus('کد ۶ رقمی به ایمیل شما ارسال شد. اعتبار کد ۵ دقیقه است؛ آن را در اختیار دیگران قرار ندهید.');
      codeInput.focus();
    } catch (error) {
      console.error('Registration code request failed:', error);
      showStatus(error.message || 'ارتباط با سرور برقرار نشد.', true);
    } finally {
      requestInProgress = false;
      setBusy(requestCodeBtn, false, 'در حال ارسال...', 'ارسال کد تأیید');
    }
  });

  backBtn.addEventListener('click', () => {
    if (requestInProgress || verifyInProgress) return;
    verificationStep.classList.add('hidden');
    informationStep.classList.remove('hidden');
    setError('code-error', codeInput);
    codeInput.value = '';
    showStatus('برای دریافت کد تأیید، اطلاعات خود را وارد کنید.');
  });

  verifyCodeBtn.addEventListener('click', async () => {
    if (verifyInProgress || requestInProgress) return;

    const code = normalizeDigits(codeInput.value).replace(/\D/g, '');
    setError('code-error', codeInput);

    if (!registrationDetails) {
      showStatus('ابتدا اطلاعات ثبت‌نام را وارد و کد تأیید را درخواست کنید.', true);
      verificationStep.classList.add('hidden');
      informationStep.classList.remove('hidden');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError('code-error', codeInput, 'کد تأیید باید دقیقاً ۶ رقم باشد.');
      codeInput.focus();
      return;
    }

    if (typeof verifyRegistrationCode !== 'function') {
      showStatus('تابع تأیید کد در api.js پیدا نشد.', true);
      return;
    }

    verifyInProgress = true;
    setBusy(verifyCodeBtn, true, 'در حال بررسی...', 'تأیید و ساخت حساب');
    backBtn.disabled = true;
    showStatus('در حال بررسی کد تأیید...');

    try {
      const result = await verifyRegistrationCode(registrationDetails.email, code);
      if (!result?.ok) {
        setError('code-error', codeInput,
          result?.error || result?.data?.error || 'کد تأیید اشتباه است یا اعتبار آن تمام شده است.');
        return;
      }

      const data = result.data?.data || result.data || result;
      const user = data?.user || data;

      if (!user?.id) {
        showStatus('پاسخ سرور معتبر نیست؛ اطلاعات حساب دریافت نشد.', true);
        return;
      }

      const safeUser = { ...user, role: 'user' };

      localStorage.removeItem('authToken');
      localStorage.setItem('session', JSON.stringify({ id: user.id, role: 'user' }));
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('loggedInUser', JSON.stringify(safeUser));
      localStorage.setItem('username', user.name || registrationDetails.name);
      localStorage.setItem('userXP', String(user.xp ?? 0));
      localStorage.setItem('userCoins', String(user.coins ?? 0));
      localStorage.setItem('userPlan', user.plan || 'free');
      localStorage.setItem('userLevel', '🟢 مبتدی');

      showStatus('حساب شما با موفقیت ساخته شد؛ در حال انتقال...', false);
      window.location.href = 'assessment.html';
    } catch (error) {
      console.error('Registration verification failed:', error);
      showStatus(error.message || 'ارتباط با سرور برقرار نشد.', true);
    } finally {
      verifyInProgress = false;
      setBusy(verifyCodeBtn, false, 'در حال بررسی...', 'تأیید و ساخت حساب');
      backBtn.disabled = false;
    }
  });
});
