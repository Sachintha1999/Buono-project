/* ═══════════════════════════════════════════════════
   BUONO - SIGN UP SCRIPT
   File: signup-script.js
   Version: 2.1 - Loader-Safe + FOUC Boot Loader
   ═══════════════════════════════════════════════════ */

window.initSignupPage = function() {
  'use strict';

  const startTime = performance.now();
  console.log('☕ [SIGNUP] Initializing...');

  // ============ WAIT FOR FIREBASE ============
  function waitForFirebase(callback, attempts = 0) {
    if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
      callback();
    } else if (attempts < 50) {
      setTimeout(() => waitForFirebase(callback, attempts + 1), 100);
    } else {
      console.error('❌ [SIGNUP] Firebase not available after 5s');
      hideBootLoader(); // Still hide loader so user can see error
    }
  }

  // ============ FOUC BOOT LOADER ============
  function hideBootLoader() {
    const boot = document.getElementById('signupBootLoader');
    if (boot) {
      boot.classList.add('hidden');
      setTimeout(() => boot.remove(), 300);
    }
    document.body.classList.add('buono-ready');
  }

  // ============ CONFIGURATION ============
  const CONFIG = {
    MIN_PASSWORD_LENGTH: 8,
    MAX_NICKNAME_LENGTH: 30,
    MIN_NICKNAME_LENGTH: 3,
    PROMO_CODE_PATTERN: /^BUONO-EMP-\d{4}-[A-Z0-9]{4}$/,
    NIC_OLD_PATTERN: /^\d{9}[VvXx]$/,
    NIC_NEW_PATTERN: /^\d{12}$/,
    PHONE_PATTERN: /^(\+94|0)?[1-9]\d{8}$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  };

  // ============ STATE ============
  const state = {
    accountType: 'student',
    promoCodeValid: false,
    promoCodeData: null,
    termsAccepted: false,
    isSubmitting: false,
    promoCheckTimeout: null
  };

  // ============ DOM CACHE ============
  const el = {
    form:                document.getElementById('signupForm'),
    submitButton:        document.getElementById('submitButton'),
    promoCode:           document.getElementById('promoCode'),
    promoStatus:         document.getElementById('promoStatus'),
    employeeFields:      document.getElementById('employeeFields'),
    nickname:            document.getElementById('nickname'),
    nicknameError:       document.getElementById('nicknameError'),
    fullName:            document.getElementById('fullName'),
    fullNameError:       document.getElementById('fullNameError'),
    nic:                 document.getElementById('nic'),
    nicError:            document.getElementById('nicError'),
    email:               document.getElementById('email'),
    emailError:          document.getElementById('emailError'),
    phone:               document.getElementById('phone'),
    phoneError:          document.getElementById('phoneError'),
    dob:                 document.getElementById('dob'),
    address:             document.getElementById('address'),
    hearAboutUs:         document.getElementById('hearAboutUs'),
    hearAboutUsError:    document.getElementById('hearAboutUsError'),
    password:            document.getElementById('password'),
    passwordError:       document.getElementById('passwordError'),
    confirmPassword:     document.getElementById('confirmPassword'),
    confirmPasswordError:document.getElementById('confirmPasswordError'),
    togglePassword:      document.getElementById('togglePassword'),
    toggleConfirmPassword:document.getElementById('toggleConfirmPassword'),
    passwordStrength:    document.getElementById('passwordStrength'),
    strengthFill:        document.getElementById('strengthFill'),
    strengthText:        document.getElementById('strengthText'),
    termsCheckbox:       document.getElementById('termsCheckbox'),
    termsError:          document.getElementById('termsError'),
    successOverlay:      document.getElementById('successOverlay'),
    successMessage:      document.getElementById('successMessage'),
    confettiContainer:   document.getElementById('confettiContainer'),
    toast:               document.getElementById('toast'),
    toastIcon:           document.getElementById('toastIcon'),
    toastMessage:        document.getElementById('toastMessage')
  };

  // ============ TOAST ============
  let toastTimer = null;

  function showToast(message, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    el.toast.className = `toast ${type} active`;
    el.toastIcon.textContent = icons[type] || icons.info;
    el.toastMessage.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('active'), 4000);
  }

  // ============ FIELD HELPERS ============
  function showFieldError(field, errorEl, message) {
    field.classList.add('error');
    if (message) errorEl.textContent = message;
    errorEl.classList.add('active');
  }

  function clearFieldError(field, errorEl) {
    field.classList.remove('error');
    errorEl.classList.remove('active');
  }

  // ============ VALIDATORS ============
  function validateFullName() {
    const v = el.fullName.value.trim();
    if (!v || v.length < 3) {
      showFieldError(el.fullName, el.fullNameError,
        !v ? 'Please enter your full name' : 'Name must be at least 3 characters');
      return false;
    }
    clearFieldError(el.fullName, el.fullNameError);
    return true;
  }

  function validateNIC() {
    const v = el.nic.value.trim();
    if (!v) {
      showFieldError(el.nic, el.nicError, 'Please enter your NIC number');
      return false;
    }
    if (!CONFIG.NIC_OLD_PATTERN.test(v) && !CONFIG.NIC_NEW_PATTERN.test(v)) {
      showFieldError(el.nic, el.nicError,
        'Invalid NIC format (e.g., 200012345678 or 991234567V)');
      return false;
    }
    clearFieldError(el.nic, el.nicError);
    return true;
  }

  function validateEmail() {
    const v = el.email.value.trim();
    if (!v || !CONFIG.EMAIL_PATTERN.test(v)) {
      showFieldError(el.email, el.emailError,
        !v ? 'Please enter your email' : 'Invalid email format');
      return false;
    }
    clearFieldError(el.email, el.emailError);
    return true;
  }

  function validatePhone() {
    const v = el.phone.value.trim().replace(/\s/g, '');
    if (!v || !CONFIG.PHONE_PATTERN.test(v)) {
      showFieldError(el.phone, el.phoneError,
        !v ? 'Please enter your phone number'
           : 'Invalid phone (e.g., +94771234567 or 0771234567)');
      return false;
    }
    clearFieldError(el.phone, el.phoneError);
    return true;
  }

  function validateHearAboutUs() {
    if (!el.hearAboutUs.value) {
      showFieldError(el.hearAboutUs, el.hearAboutUsError, 'Please select an option');
      return false;
    }
    clearFieldError(el.hearAboutUs, el.hearAboutUsError);
    return true;
  }

  function validateNickname() {
    if (state.accountType !== 'employee') return true;
    const v = el.nickname.value.trim();
    if (!v) {
      showFieldError(el.nickname, el.nicknameError, 'Nickname is required for employees');
      return false;
    }
    if (v.length < CONFIG.MIN_NICKNAME_LENGTH) {
      showFieldError(el.nickname, el.nicknameError,
        `Minimum ${CONFIG.MIN_NICKNAME_LENGTH} characters`);
      return false;
    }
    if (v.length > CONFIG.MAX_NICKNAME_LENGTH) {
      showFieldError(el.nickname, el.nicknameError,
        `Maximum ${CONFIG.MAX_NICKNAME_LENGTH} characters`);
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(v)) {
      showFieldError(el.nickname, el.nicknameError,
        'Only letters, numbers and underscore');
      return false;
    }
    clearFieldError(el.nickname, el.nicknameError);
    return true;
  }

  function validatePassword() {
    const v = el.password.value;
    if (!v) {
      showFieldError(el.password, el.passwordError, 'Please enter a password');
      return false;
    }
    if (v.length < CONFIG.MIN_PASSWORD_LENGTH) {
      showFieldError(el.password, el.passwordError,
        `Minimum ${CONFIG.MIN_PASSWORD_LENGTH} characters required`);
      return false;
    }
    clearFieldError(el.password, el.passwordError);
    return true;
  }

  function validateConfirmPassword() {
    const pw  = el.password.value;
    const cpw = el.confirmPassword.value;
    if (!cpw) {
      showFieldError(el.confirmPassword, el.confirmPasswordError,
        'Please confirm your password');
      return false;
    }
    if (pw !== cpw) {
      showFieldError(el.confirmPassword, el.confirmPasswordError,
        'Passwords do not match');
      return false;
    }
    clearFieldError(el.confirmPassword, el.confirmPasswordError);
    return true;
  }

  function validateTerms() {
    if (!state.termsAccepted) {
      el.termsError.classList.add('active');
      return false;
    }
    el.termsError.classList.remove('active');
    return true;
  }

  function validateAll() {
    const results = [
      validateFullName(),
      validateNIC(),
      validateEmail(),
      validatePhone(),
      validateHearAboutUs(),
      validateNickname(),
      validatePassword(),
      validateConfirmPassword(),
      validateTerms()
    ];
    return results.every(Boolean);
  }

  // ============ PASSWORD STRENGTH ============
  function updatePasswordStrength() {
    const pw = el.password.value;

    if (!pw) {
      el.passwordStrength.classList.remove('active');
      return;
    }

    el.passwordStrength.classList.add('active');

    let score = 0;
    if (pw.length >= 8)  score += 25;
    if (pw.length >= 12) score += 15;
    if (/[a-z]/.test(pw))        score += 15;
    if (/[A-Z]/.test(pw))        score += 15;
    if (/\d/.test(pw))           score += 15;
    if (/[^a-zA-Z\d]/.test(pw)) score += 15;

    let cls, label;
    if (score < 40)      { cls = 'weak';   label = 'Weak password';    }
    else if (score < 75) { cls = 'medium'; label = 'Medium strength';  }
    else                 { cls = 'strong'; label = 'Strong password';   }

    el.strengthFill.className = `strength-fill ${cls}`;
    el.strengthText.className = `strength-text ${cls}`;
    el.strengthText.textContent = label;
  }

  // ============ PROMO CODE ============
  async function verifyPromoCode(code) {
    if (!code) { resetPromoCode(); return; }

    const upper = code.toUpperCase().trim();

    if (!CONFIG.PROMO_CODE_PATTERN.test(upper)) {
      el.promoCode.classList.remove('valid');
      el.promoCode.classList.add('invalid');
      showPromoStatus('Invalid code format', 'error');
      hideEmployeeFields();
      return;
    }

    showPromoStatus('🔍 Verifying code...', 'success');

    try {
      const snap = await db.collection('promoCodes')
        .where('code', '==', upper)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snap.empty) {
        el.promoCode.classList.remove('valid');
        el.promoCode.classList.add('invalid');
        showPromoStatus('❌ Invalid or expired code', 'error');
        hideEmployeeFields();
        state.promoCodeValid = false;
        state.promoCodeData  = null;
        return;
      }

      const doc  = snap.docs[0];
      const data = doc.data();

      // Expiry check
      if (data.expiresAt) {
        const expiry = data.expiresAt.toDate
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt);
        if (expiry < new Date()) {
          showPromoStatus('❌ Code has expired', 'error');
          el.promoCode.classList.add('invalid');
          hideEmployeeFields();
          return;
        }
      }

      // Usage limit check
      if (data.maxUses && data.currentUses >= data.maxUses) {
        showPromoStatus('❌ Code usage limit reached', 'error');
        el.promoCode.classList.add('invalid');
        hideEmployeeFields();
        return;
      }

      // ✅ Valid!
      el.promoCode.classList.remove('invalid');
      el.promoCode.classList.add('valid');
      showPromoStatus('✅ Valid employee code! Welcome aboard!', 'success');

      state.promoCodeValid = true;
      state.promoCodeData  = { id: doc.id, ...data };
      state.accountType    = 'employee';
      showEmployeeFields();

    } catch (err) {
      console.error('❌ [PROMO] Error:', err);
      showPromoStatus('⚠️ Error verifying code. Try again.', 'error');
      el.promoCode.classList.add('invalid');
      hideEmployeeFields();
    }
  }

  function showPromoStatus(message, type) {
    el.promoStatus.className = `promo-status ${type}`;
    el.promoStatus.textContent = message;
  }

  function resetPromoCode() {
    el.promoCode.classList.remove('valid', 'invalid');
    el.promoStatus.className   = 'promo-status';
    el.promoStatus.textContent = '';
    hideEmployeeFields();
    state.promoCodeValid = false;
    state.promoCodeData  = null;
    state.accountType    = 'student';
  }

  function showEmployeeFields() {
    el.employeeFields.classList.add('active');
    setTimeout(() => el.nickname && el.nickname.focus(), 300);
  }

  function hideEmployeeFields() {
    el.employeeFields.classList.remove('active');
    state.accountType = 'student';
    if (el.nickname) {
      el.nickname.value = '';
      clearFieldError(el.nickname, el.nicknameError);
    }
  }

  // ============ DUPLICATE CHECK ============
  async function checkDuplicates(email, nic, nickname) {
    const checks = [
      db.collection('employees').where('email', '==', email).limit(1).get(),
      db.collection('students').where('email',  '==', email).limit(1).get(),
      db.collection('students').where('nic',    '==', nic).limit(1).get()
    ];

    if (state.accountType === 'employee' && nickname) {
      checks.push(
        db.collection('employees').where('nickname', '==', nickname).limit(1).get()
      );
    }

    const results = await Promise.all(checks);

    if (!results[0].empty || !results[1].empty)
      return { duplicate: true, field: 'email',    message: 'Email already registered' };
    if (!results[2].empty)
      return { duplicate: true, field: 'nic',      message: 'NIC already registered'   };
    if (state.accountType === 'employee' && results[3] && !results[3].empty)
      return { duplicate: true, field: 'nickname', message: 'Nickname already taken'   };

    return { duplicate: false };
  }

  // ============ CONFETTI ============
  function showConfetti() {
    const colors  = ['#D4AF37','#F4D03F','#6F4E37','#8B6F47','#FFF8DC'];
    const container = el.confettiContainer;

    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.cssText = [
        `left: ${Math.random() * 100}%`,
        `background: ${colors[Math.floor(Math.random() * colors.length)]}`,
        `animation-delay: ${Math.random() * 0.5}s`,
        `animation-duration: ${2 + Math.random() * 2}s`,
        `width: ${5 + Math.random() * 10}px`,
        `height: ${5 + Math.random() * 10}px`
      ].join(';');
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 4500);
    }
  }

  // ============ FIREBASE ACCOUNT CREATION ============
  async function createAccount(formData) {
    try {
      console.log('🔐 [SIGNUP] Creating Auth account...');

      const cred = await firebase.auth()
        .createUserWithEmailAndPassword(formData.email, formData.password);
      const user = cred.user;
      console.log('✅ [SIGNUP] Auth created:', user.uid);

      await user.sendEmailVerification();
      console.log('📧 [SIGNUP] Verification email sent');

      const baseData = {
        authUid:        user.uid,
        email:          formData.email,
        emailVerified:  false,
        approvalStatus: 'pending',
        signupDate:     firebase.firestore.FieldValue.serverTimestamp(),
        name:           formData.fullName,
        nic:            formData.nic,
        phone:          formData.phone,
        dob:            formData.dob     || '',
        address:        formData.address || '',
        hearAboutUs:    formData.hearAboutUs,
        createdAt:      firebase.firestore.FieldValue.serverTimestamp(),
        createdBy:      'Self Signup',
        createdById:    'self',
        updatedAt:      firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy:      'Self Signup',
        updatedById:    'self'
      };

      if (state.accountType === 'employee') {
        await db.collection('employees').doc(user.uid).set({
          ...baseData,
          nickname:         formData.nickname,
          access:           null,
          permissions:      {},
          signupPromoCode:  state.promoCodeData.code,
          promoCodeId:      state.promoCodeData.id,
          status:           'Pending',
          password:         '***ENCRYPTED***'
        });
        console.log('✅ [SIGNUP] Employee doc created');

        await db.collection('promoCodes')
          .doc(state.promoCodeData.id)
          .update({
            currentUses: firebase.firestore.FieldValue.increment(1),
            usedBy: firebase.firestore.FieldValue.arrayUnion({
              uid:    user.uid,
              email:  formData.email,
              name:   formData.fullName,
              usedAt: new Date().toISOString()
            })
          });
        console.log('✅ [SIGNUP] Promo usage updated');

      } else {
        await db.collection('students').doc(user.uid).set({
          ...baseData,
          studentId:     '',
          courseId:      '',
          courseName:    '',
          batchNumber:   '',
          academy:       '',
          totalFee:      0,
          totalPaid:     0,
          balance:       0,
          paymentStatus: 'Not Started',
          payments:      [],
          status:        'Pending',
          password:      '***ENCRYPTED***'
        });
        console.log('✅ [SIGNUP] Student doc created');
      }

      return { success: true, uid: user.uid };

    } catch (err) {
      console.error('❌ [SIGNUP] Error:', err);

      let msg = 'Sign up failed. Please try again.';
      switch (err.code) {
        case 'auth/email-already-in-use':
          msg = 'Email already registered. Try logging in.';
          showFieldError(el.email, el.emailError, msg);
          break;
        case 'auth/invalid-email':
          msg = 'Invalid email address';
          showFieldError(el.email, el.emailError, msg);
          break;
        case 'auth/weak-password':
          msg = 'Password is too weak';
          showFieldError(el.password, el.passwordError, msg);
          break;
        case 'auth/network-request-failed':
          msg = 'Network error. Check your connection.';
          break;
      }
      return { success: false, error: msg };
    }
  }

  // ============ SUBMIT ============
  async function handleSubmit(e) {
    e.preventDefault();
    if (state.isSubmitting) return;

    console.log('🚀 [SIGNUP] Form submitted');

    if (!validateAll()) {
      showToast('Please fix the errors in the form', 'error');
      const firstErr = document.querySelector('.form-input.error, .form-select.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    let phone = el.phone.value.trim().replace(/\s/g, '');
    if (phone.startsWith('0'))         phone = '+94' + phone.substring(1);
    else if (!phone.startsWith('+94')) phone = '+94' + phone;

    const formData = {
      fullName:    el.fullName.value.trim(),
      nic:         el.nic.value.trim().toUpperCase(),
      email:       el.email.value.trim().toLowerCase(),
      phone,
      dob:         el.dob.value,
      address:     el.address.value.trim(),
      hearAboutUs: el.hearAboutUs.value,
      password:    el.password.value,
      nickname:    state.accountType === 'employee'
                   ? el.nickname.value.trim()
                   : null
    };

    state.isSubmitting = true;
    el.submitButton.classList.add('loading');
    el.submitButton.disabled = true;

    try {
      showToast('🔍 Checking your details...', 'info');
      const dup = await checkDuplicates(formData.email, formData.nic, formData.nickname);

      if (dup.duplicate) {
        showToast(dup.message, 'error');
        if (dup.field === 'email')
          showFieldError(el.email,    el.emailError,    dup.message);
        else if (dup.field === 'nic')
          showFieldError(el.nic,      el.nicError,      dup.message);
        else if (dup.field === 'nickname')
          showFieldError(el.nickname, el.nicknameError, dup.message);
        resetSubmitButton();
        return;
      }

      showToast('☕ Creating your account...', 'info');
      const result = await createAccount(formData);

      if (result.success) {
        console.log('🎉 [SIGNUP] Success!');
        await firebase.auth().signOut();

        const typeText = state.accountType === 'employee' ? 'Employee' : 'Student';
        el.successMessage.textContent =
          `Your ${typeText} account has been created successfully. ` +
          `Please check your email for verification, then wait for admin approval.`;

        el.successOverlay.classList.add('active');
        showConfetti();

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`✨ [SIGNUP] Total time: ${elapsed}ms`);

      } else {
        showToast(result.error, 'error');
        resetSubmitButton();
      }

    } catch (err) {
      console.error('❌ [SIGNUP] Unexpected error:', err);
      showToast('An unexpected error occurred', 'error');
      resetSubmitButton();
    }
  }

  function resetSubmitButton() {
    state.isSubmitting = false;
    el.submitButton.classList.remove('loading');
    el.submitButton.disabled = false;
  }

  // ============ EVENT LISTENERS ============
  function attachEvents() {
    el.form.addEventListener('submit', handleSubmit);

    el.promoCode.addEventListener('input', (e) => {
      const code = e.target.value;
      if (code !== code.toUpperCase()) e.target.value = code.toUpperCase();

      clearTimeout(state.promoCheckTimeout);
      if (!code.trim()) { resetPromoCode(); return; }

      state.promoCheckTimeout = setTimeout(() => verifyPromoCode(code), 500);
    });

    el.fullName.addEventListener('blur',    validateFullName);
    el.nic.addEventListener('blur',         validateNIC);
    el.email.addEventListener('blur',       validateEmail);
    el.phone.addEventListener('blur',       validatePhone);
    el.hearAboutUs.addEventListener('change', validateHearAboutUs);
    el.nickname?.addEventListener('blur',   validateNickname);

    el.password.addEventListener('input',   updatePasswordStrength);
    el.password.addEventListener('blur',    validatePassword);
    el.confirmPassword.addEventListener('blur', validateConfirmPassword);

    el.togglePassword.addEventListener('click', () => {
      const show = el.password.type === 'password';
      el.password.type = show ? 'text' : 'password';
      el.togglePassword.textContent = show ? '🙈' : '👁️';
    });

    el.toggleConfirmPassword.addEventListener('click', () => {
      const show = el.confirmPassword.type === 'password';
      el.confirmPassword.type = show ? 'text' : 'password';
      el.toggleConfirmPassword.textContent = show ? '🙈' : '👁️';
    });

    el.termsCheckbox.addEventListener('click', toggleTerms);
    el.termsCheckbox.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleTerms();
      }
    });

    document.getElementById('termsLink')
      ?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Terms & Conditions coming soon', 'info');
      });

    document.getElementById('privacyLink')
      ?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Privacy Policy coming soon', 'info');
      });
  }

  function toggleTerms() {
    state.termsAccepted = !state.termsAccepted;
    el.termsCheckbox.classList.toggle('checked', state.termsAccepted);
    el.termsCheckbox.setAttribute('aria-checked', state.termsAccepted);
    if (state.termsAccepted) el.termsError.classList.remove('active');
  }

   // ============ INIT ============
  function init() {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 5);
    el.dob.max = maxDate.toISOString().split('T')[0];

    attachEvents();

    // ✅ Hide FOUC boot loader & show page
    hideBootLoader();

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`✅ [SIGNUP] Ready in ${elapsed}ms`);
    console.log('☕ [SIGNUP] Buono Sign Up System v2.1');
  }

  // Wait for Firebase then init
  waitForFirebase(init);
};

// ═══════════════════════════════════════════════════
// AUTO-EXECUTE: Run when DOM ready
// ═══════════════════════════════════════════════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.initSignupPage());
} else {
  window.initSignupPage();
}