document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const $ = id => document.getElementById(id);

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

  function normalizeDigits(value) {
    return String(value || '')
      .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  }

  function setError(id, input, message = '') {
    const element = $(id);

    if (element) element.textContent = message;

    if (input) {
      input.classList.toggle('invalid', Boolean(message));
      if (!message) input.classList.remove('invalid');
    }
  }

  function showStatus(message, isError = false) {
    if (subtitle) {
      subtitle.textContent = message;
      subtitle.style.color = isError ? '#ff8a70' : '#aaa';
    }
  }

  function setBusy(button, busy, busyText, normalText) {
    if (!button) return;

    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
  }

  function validateDetails() {
    const name = nameInput.value.trim();
    const phone = normalizeDigits(phoneInput.value).replace(/\s+/g, '');
    const email = emailInput.value.trim().toLowerCase();

    let valid = true;

    setError('name-error', nameInput, '');
    setError('phone-error', phoneInput, '');
    setError('email-error', emailInput, '');

    if (name.length < 3) {
      setError('name-error', nameInput, 'نام باید حداقل ۳ حرف باشد.');
      valid = false;
    }

    if (!/^09\d{9}$/.test(phone)) {
      setError('phone-error', phoneInput, 'شماره موبایل معتبر نیست.');
      valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email-error', emailInput, 'ایمیل معتبر نیست.');
      valid = false;
    }

    return { valid, name, phone, email };
  }

  [nameInput, phoneInput, emailInput].forEach(input => {
    input?.addEventListener('input', () => {
      setError(`${input.id}-error`, input, '');

      if (input === phoneInput) {
        input.value = normalizeDigits(input.value);
      }
    });
  });

  codeInput?.addEventListener('input', () => {
    codeInput.value = normalizeDigits(codeInput.value)
      .replace(/\D/g, '')
      .slice(0, 6);

    setError('code-error', codeInput, '');
  });

  // مرحله اول: درخواست کد تأیید
  form.addEventListener('submit', async event => {
    event.preventDefault();

    const details = validateDetails();
    if (!details.valid) return;

    if (typeof requestRegistrationCode !== 'function') {
      showStatus('api.js بارگذاری نشده است.', true);
      return;
    }

    setBusy(
      requestCodeBtn,
      true,
      'در حال ارسال کد...',
      'ارسال کد تأیید'
    );

    try {
      const result = await requestRegistrationCode(
        details.name,
        details.phone,
        details.email
      );

      if (!result?.ok) {
        showStatus(
          result?.error || result?.data?.error || 'ارسال کد انجام نشد.',
          true
        );
        return;
      }

      informationStep.classList.add('hidden');
      verificationStep.classList.remove('hidden');

      showStatus('کد تأیید به ایمیل شما ارسال شد.');

      codeInput?.focus();

    } catch (error) {
      console.error(error);
      showStatus(error.message || 'ارتباط با سرور برقرار نشد.', true);

    } finally {
      setBusy(
        requestCodeBtn,
        false,
        'در حال ارسال کد...',
        'ارسال کد تأیید'
      );
    }
  });

  // بازگشت به مرحله اطلاعات
  backBtn?.addEventListener('click', () => {
    verificationStep.classList.add('hidden');
    informationStep.classList.remove('hidden');

    setError('code-error', codeInput, '');

    if (codeInput) codeInput.value = '';

    showStatus(
      'اطلاعات خود را وارد کنید تا کد تأیید به ایمیل شما ارسال شود.'
    );
  });

  // مرحله دوم: تأیید کد و ساخت حساب
  verifyCodeBtn?.addEventListener('click', async () => {
    const details = validateDetails();

    const code = normalizeDigits(codeInput?.value)
      .replace(/\D/g, '');

    setError('code-error', codeInput, '');

    if (!details.valid) {
      verificationStep.classList.add('hidden');
      informationStep.classList.remove('hidden');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError(
        'code-error',
        codeInput,
        'کد تأیید باید ۶ رقم باشد.'
      );
      return;
    }

    if (typeof verifyRegistrationCode !== 'function') {
      showStatus('تابع تأیید کد در api.js پیدا نشد.', true);
      return;
    }

    setBusy(
      verifyCodeBtn,
      true,
      'در حال بررسی...',
      'تأیید و ساخت حساب'
    );

    try {
      const result = await verifyRegistrationCode(
        details.email,
        code
      );

      if (!result?.ok) {
        setError(
          'code-error',
          codeInput,
          result?.error ||
          result?.data?.error ||
          'کد اشتباه است یا اعتبار آن تمام شده است.'
        );
        return;
      }

      const user =
        result.data?.user ||
        result.user ||
        result.data;

      if (!user?.id) {
        showStatus('پاسخ سرور معتبر نیست.', true);
        return;
      }

      const safeUser = {
        ...user,
        role: 'user'
      };

      localStorage.removeItem('authToken');

      localStorage.setItem(
        'session',
        JSON.stringify({
          id: user.id,
          role: 'user'
        })
      );

      localStorage.setItem('loggedIn', 'true');

      localStorage.setItem(
        'loggedInUser',
        JSON.stringify(safeUser)
      );

      localStorage.setItem(
        'username',
        user.name || details.name
      );

      localStorage.setItem(
        'userXP',
        String(user.xp ?? 0)
      );

      localStorage.setItem(
        'userCoins',
        String(user.coins ?? 0)
      );

      window.location.href = 'assessment.html';

    } catch (error) {
      console.error(error);
      showStatus(error.message || 'ارتباط با سرور برقرار نشد.', true);

    } finally {
      setBusy(
        verifyCodeBtn,
        false,
        'در حال بررسی...',
        'تأیید و ساخت حساب'
      );
    }
  });
});
