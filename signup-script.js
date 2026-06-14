/* ═══════════════════════════════════════════════════
   BUONO - SIGN UP SCRIPT
   Logic + Firebase Auth + Validation + Animations
   Version: 1.0
   ═══════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Performance tracker
  const startTime = performance.now();
  console.log('☕ [SIGNUP] Script loading...');

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
    accountType: 'student', // default
    promoCodeValid: false,
    promoCodeData: null,
    termsAccepted: false,
    isSubmitting: false,
    promoCheckTimeout: null
  };

  // ============ DOM ELEMENTS ============
  let elements = {};

  function cacheElements() {
    elements = {
      // Form
      form: document.getElementById('signupForm'),
      submitButton: document.getElementById('submitButton'),
      
      // Promo code
      promoCode: document.getElementById('promoCode'),
      promoStatus: document.getElementById('promoStatus'),
      employeeFields: document.getElementById('employeeFields'),
      
      // Employee fields
      nickname: document.getElementById('nickname'),
      nicknameError: document.getElementById('nicknameError'),
      
      // Personal info
      fullName: document.getElementById('fullName'),
      fullNameError: document.getElementById('fullNameError'),
      nic: document.getElementById('nic'),
      nicError: document.getElementById('nicError'),
      email: document.getElementById('email'),
      emailError: document.getElementById('emailError'),
      phone: document.getElementById('phone'),
      phoneError: document.getElementById('phoneError'),
      dob: document.getElementById('dob'),
      address: document.getElementById('address'),
      hearAboutUs: document.getElementById('hearAboutUs'),
      hearAboutUsError: document.getElementById('hearAboutUsError'),
      
      // Password
      password: document.getElementById('password'),
      passwordError: document.getElementById('passwordError'),
      confirmPassword: document.getElementById('confirmPassword'),
      confirmPasswordError: document.getElementById('confirmPasswordError'),
      togglePassword: document.getElementById('togglePassword'),
      toggleConfirmPassword: document.getElementById('toggleConfirmPassword'),
      passwordStrength: document.getElementById('passwordStrength'),
      strengthFill: document.getElementById('strengthFill'),
      strengthText: document.getElementById('strengthText'),
      
      // Terms
      termsCheckbox: document.getElementById('termsCheckbox'),
      termsError: document.getElementById('termsError'),
      
      // Success
      successOverlay: document.getElementById('successOverlay'),
      successMessage: document.getElementById('successMessage'),
      confettiContainer: document.getElementById('confettiContainer'),
      
      // Toast
      toast: document.getElementById('toast'),
      toastIcon: document.getElementById('toastIcon'),
      toastMessage: document.getElementById('toastMessage')
    };
  }

  // ============ TOAST NOTIFICATIONS ============
  function showToast(message, type = 'info') {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    elements.toast.className = `toast ${type} active`;
    elements.toastIcon.textContent = icons[type] || icons.info;
    elements.toastMessage.textContent = message;
    
    setTimeout(() => {
      elements.toast.classList.remove('active');
    }, 4000);
  }

  // ============ FIELD VALIDATION ============
  function showFieldError(field, errorElement, message) {
    field.classList.add('error');
    if (message) errorElement.textContent = message;
    errorElement.classList.add('active');
  }

  function clearFieldError(field, errorElement) {
    field.classList.remove('error');
    errorElement.classList.remove('active');
  }

  function validateFullName() {
    const value = elements.fullName.value.trim();
    if (!value) {
      showFieldError(elements.fullName, elements.fullNameError, 'Please enter your full name');
      return false;
    }
    if (value.length < 3) {
      showFieldError(elements.fullName, elements.fullNameError, 'Name must be at least 3 characters');
      return false;
    }
    clearFieldError(elements.fullName, elements.fullNameError);
    return true;
  }

  function validateNIC() {
    const value = elements.nic.value.trim();
    if (!value) {
      showFieldError(elements.nic, elements.nicError, 'Please enter your NIC number');
      return false;
    }
    if (!CONFIG.NIC_OLD_PATTERN.test(value) && !CONFIG.NIC_NEW_PATTERN.test(value)) {
      showFieldError(elements.nic, elements.nicError, 'Invalid NIC format (e.g., 200012345678 or 991234567V)');
      return false;
    }
    clearFieldError(elements.nic, elements.nicError);
    return true;
  }

  function validateEmail() {
    const value = elements.email.value.trim();
    if (!value) {
      showFieldError(elements.email, elements.emailError, 'Please enter your email');
      return false;
    }
    if (!CONFIG.EMAIL_PATTERN.test(value)) {
      showFieldError(elements.email, elements.emailError, 'Invalid email format');
      return false;
    }
    clearFieldError(elements.email, elements.emailError);
    return true;
  }

  function validatePhone() {
    const value = elements.phone.value.trim().replace(/\s/g, '');
    if (!value) {
      showFieldError(elements.phone, elements.phoneError, 'Please enter your phone number');
      return false;
    }
    if (!CONFIG.PHONE_PATTERN.test(value)) {
      showFieldError(elements.phone, elements.phoneError, 'Invalid phone (e.g., +94771234567 or 0771234567)');
      return false;
    }
    clearFieldError(elements.phone, elements.phoneError);
    return true;
  }

  function validateHearAboutUs() {
    if (!elements.hearAboutUs.value) {
      showFieldError(elements.hearAboutUs, elements.hearAboutUsError, 'Please select an option');
      return false;
    }
    clearFieldError(elements.hearAboutUs, elements.hearAboutUsError);
    return true;
  }

  function validateNickname() {
    if (state.accountType !== 'employee') return true;
    
    const value = elements.nickname.value.trim();
    if (!value) {
      showFieldError(elements.nickname, elements.nicknameError, 'Nickname is required for employees');
      return false;
    }
    if (value.length < CONFIG.MIN_NICKNAME_LENGTH) {
      showFieldError(elements.nickname, elements.nicknameError, `Minimum ${CONFIG.MIN_NICKNAME_LENGTH} characters`);
      return false;
    }
    if (value.length > CONFIG.MAX_NICKNAME_LENGTH) {
      showFieldError(elements.nickname, elements.nicknameError, `Maximum ${CONFIG.MAX_NICKNAME_LENGTH} characters`);
      return false;
    }
    // Only alphanumeric + underscore
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      showFieldError(elements.nickname, elements.nicknameError, 'Only letters, numbers and underscore');
      return false;
    }
    clearFieldError(elements.nickname, elements.nicknameError);
    return true;
  }

  function validatePassword() {
    const value = elements.password.value;
    if (!value) {
      showFieldError(elements.password, elements.passwordError, 'Please enter a password');
      return false;
    }
    if (value.length < CONFIG.MIN_PASSWORD_LENGTH) {
      showFieldError(elements.password, elements.passwordError, `Minimum ${CONFIG.MIN_PASSWORD_LENGTH} characters required`);
      return false;
    }
    clearFieldError(elements.password, elements.passwordError);
    return true;
  }

  function validateConfirmPassword() {
    const password = elements.password.value;
    const confirm = elements.confirmPassword.value;
    
    if (!confirm) {
      showFieldError(elements.confirmPassword, elements.confirmPasswordError, 'Please confirm your password');
      return false;
    }
    if (password !== confirm) {
      showFieldError(elements.confirmPassword, elements.confirmPasswordError, 'Passwords do not match');
      return false;
    }
    clearFieldError(elements.confirmPassword, elements.confirmPasswordError);
    return true;
  }

  function validateTerms() {
    if (!state.termsAccepted) {
      elements.termsError.classList.add('active');
      return false;
    }
    elements.termsError.classList.remove('active');
    return true;
  }

  function validateAllFields() {
    const checks = [
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
    
    return checks.every(check => check === true);
  }

  // ============ PASSWORD STRENGTH ============
  function calculatePasswordStrength(password) {
    if (!password) return { score: 0, label: 'Enter a password', class: '' };
    
    let score = 0;
    
    // Length checks
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[^a-zA-Z\d]/.test(password)) score += 15;
    
    if (score < 40) return { score, label: 'Weak password', class: 'weak' };
    if (score < 75) return { score, label: 'Medium strength', class: 'medium' };
    return { score, label: 'Strong password', class: 'strong' };
  }

  function updatePasswordStrength() {
    const password = elements.password.value;
    
    if (!password) {
      elements.passwordStrength.classList.remove('active');
      return;
    }
    
    elements.passwordStrength.classList.add('active');
    const result = calculatePasswordStrength(password);
    
    elements.strengthFill.className = 'strength-fill ' + result.class;
    elements.strengthText.className = 'strength-text ' + result.class;
    elements.strengthText.textContent = result.label;
  }

  console.log('☕ [SIGNUP] Validators loaded ✓');

  // ============ EXPORTS FOR PART 2 ============
  window._signupHelpers = {
    cacheElements,
    elements: () => elements,
    state,
    CONFIG,
    showToast,
    showFieldError,
    clearFieldError,
    validateAllFields,
    updatePasswordStrength,
    startTime
  };

})();

/* ═══════════════════════════════════════════════════
   PART 2: Promo Code + Firebase Auth + Submit
   ═══════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Wait for Part 1 helpers
  if (!window._signupHelpers) {
    console.error('❌ [SIGNUP] Part 1 not loaded!');
    return;
  }

  const { 
    cacheElements, 
    elements: getElements, 
    state, 
    CONFIG, 
    showToast,
    showFieldError,
    clearFieldError,
    validateAllFields,
    updatePasswordStrength,
    startTime
  } = window._signupHelpers;

  let elements;

  // ============ PROMO CODE VERIFICATION ============
  async function verifyPromoCode(code) {
    if (!code) {
      resetPromoCode();
      return;
    }

    const upperCode = code.toUpperCase().trim();
    
    // Quick format check
    if (!CONFIG.PROMO_CODE_PATTERN.test(upperCode)) {
      elements.promoCode.classList.remove('valid');
      elements.promoCode.classList.add('invalid');
      showPromoStatus('Invalid code format', 'error');
      hideEmployeeFields();
      return;
    }

    showPromoStatus('🔍 Verifying code...', 'success');

    try {
      // Query promoCodes collection
      const snapshot = await db.collection('promoCodes')
        .where('code', '==', upperCode)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        elements.promoCode.classList.remove('valid');
        elements.promoCode.classList.add('invalid');
        showPromoStatus('❌ Invalid or expired code', 'error');
        hideEmployeeFields();
        state.promoCodeValid = false;
        state.promoCodeData = null;
        return;
      }

      const promoDoc = snapshot.docs[0];
      const promoData = promoDoc.data();

      // Check expiry
      if (promoData.expiresAt) {
        const expiryDate = promoData.expiresAt.toDate ? promoData.expiresAt.toDate() : new Date(promoData.expiresAt);
        if (expiryDate < new Date()) {
          showPromoStatus('❌ Code has expired', 'error');
          elements.promoCode.classList.add('invalid');
          hideEmployeeFields();
          return;
        }
      }

      // Check max uses
      if (promoData.maxUses && promoData.currentUses >= promoData.maxUses) {
        showPromoStatus('❌ Code usage limit reached', 'error');
        elements.promoCode.classList.add('invalid');
        hideEmployeeFields();
        return;
      }

      // ✅ Valid code!
      elements.promoCode.classList.remove('invalid');
      elements.promoCode.classList.add('valid');
      showPromoStatus('✅ Valid employee code! Welcome aboard!', 'success');
      
      state.promoCodeValid = true;
      state.promoCodeData = { id: promoDoc.id, ...promoData };
      state.accountType = 'employee';
      
      showEmployeeFields();
      
    } catch (error) {
      console.error('❌ [PROMO] Verification error:', error);
      showPromoStatus('⚠️ Error verifying code. Try again.', 'error');
      elements.promoCode.classList.add('invalid');
      hideEmployeeFields();
    }
  }

  function showPromoStatus(message, type) {
    elements.promoStatus.className = `promo-status ${type}`;
    elements.promoStatus.textContent = message;
  }

  function resetPromoCode() {
    elements.promoCode.classList.remove('valid', 'invalid');
    elements.promoStatus.className = 'promo-status';
    elements.promoStatus.textContent = '';
    hideEmployeeFields();
    state.promoCodeValid = false;
    state.promoCodeData = null;
    state.accountType = 'student';
  }

  function showEmployeeFields() {
    elements.employeeFields.classList.add('active');
    setTimeout(() => {
      elements.nickname.focus();
    }, 300);
  }

  function hideEmployeeFields() {
    elements.employeeFields.classList.remove('active');
    state.accountType = 'student';
    if (elements.nickname) {
      elements.nickname.value = '';
      clearFieldError(elements.nickname, elements.nicknameError);
    }
  }

  // ============ DUPLICATE CHECK ============
  async function checkDuplicates(email, nic, nickname) {
    const checks = [];
    
    // Check email in employees
    checks.push(
      db.collection('employees').where('email', '==', email).limit(1).get()
    );
    
    // Check email in students
    checks.push(
      db.collection('students').where('email', '==', email).limit(1).get()
    );
    
    // Check NIC in students
    checks.push(
      db.collection('students').where('nic', '==', nic).limit(1).get()
    );
    
    // Check nickname (employee only)
    if (state.accountType === 'employee' && nickname) {
      checks.push(
        db.collection('employees').where('nickname', '==', nickname).limit(1).get()
      );
    }
    
    const results = await Promise.all(checks);
    
    if (!results[0].empty || !results[1].empty) {
      return { duplicate: true, field: 'email', message: 'Email already registered' };
    }
    if (!results[2].empty) {
      return { duplicate: true, field: 'nic', message: 'NIC already registered' };
    }
    if (state.accountType === 'employee' && results[3] && !results[3].empty) {
      return { duplicate: true, field: 'nickname', message: 'Nickname already taken' };
    }
    
    return { duplicate: false };
  }

  // ============ CONFETTI EFFECT ============
  function showConfetti() {
    const colors = ['#D4AF37', '#F4D03F', '#6F4E37', '#8B6F47', '#FFF8DC'];
    const container = elements.confettiContainer;
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
      confetti.style.width = (5 + Math.random() * 10) + 'px';
      confetti.style.height = (5 + Math.random() * 10) + 'px';
      container.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 4000);
    }
  }

  // ============ FIREBASE AUTH + FIRESTORE ============
  async function createAccount(formData) {
    try {
      console.log('🔐 [SIGNUP] Creating Firebase Auth account...');
      
      // Step 1: Create Firebase Auth account
      const userCredential = await firebase.auth()
        .createUserWithEmailAndPassword(formData.email, formData.password);
      
      const user = userCredential.user;
      console.log('✅ [SIGNUP] Auth account created:', user.uid);
      
      // Step 2: Send verification email
      await user.sendEmailVerification();
      console.log('📧 [SIGNUP] Verification email sent');
      
      // Step 3: Prepare document data
      const baseData = {
        authUid: user.uid,
        email: formData.email,
        emailVerified: false,
        approvalStatus: 'pending',
        signupDate: firebase.firestore.FieldValue.serverTimestamp(),
        name: formData.fullName,
        nic: formData.nic,
        phone: formData.phone,
        dob: formData.dob || '',
        address: formData.address || '',
        hearAboutUs: formData.hearAboutUs,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: 'Self Signup',
        createdById: 'self',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'Self Signup',
        updatedById: 'self'
      };
      
      // Step 4: Save to appropriate collection
      if (state.accountType === 'employee') {
        const employeeData = {
          ...baseData,
          nickname: formData.nickname,
          access: null, // Admin will assign
          permissions: {}, // Admin will set
          signupPromoCode: state.promoCodeData.code,
          promoCodeId: state.promoCodeData.id,
          status: 'Pending',
          password: '***ENCRYPTED***' // Real password in Firebase Auth
        };
        
        await db.collection('employees').doc(user.uid).set(employeeData);
        console.log('✅ [SIGNUP] Employee doc created');
        
        // Increment promo code usage
        await db.collection('promoCodes').doc(state.promoCodeData.id).update({
          currentUses: firebase.firestore.FieldValue.increment(1),
          usedBy: firebase.firestore.FieldValue.arrayUnion({
            uid: user.uid,
            email: formData.email,
            name: formData.fullName,
            usedAt: new Date().toISOString()
          })
        });
        console.log('✅ [SIGNUP] Promo code usage updated');
        
      } else {
        // Student
        const studentData = {
          ...baseData,
          studentId: '', // Generated after approval
          courseId: '',
          courseName: '',
          batchNumber: '',
          academy: '',
          totalFee: 0,
          totalPaid: 0,
          balance: 0,
          paymentStatus: 'Not Started',
          payments: [],
          status: 'Pending',
          password: '***ENCRYPTED***'
        };
        
        await db.collection('students').doc(user.uid).set(studentData);
        console.log('✅ [SIGNUP] Student doc created');
      }
      
      return { success: true, uid: user.uid };
      
    } catch (error) {
      console.error('❌ [SIGNUP] Error:', error);
      
      let errorMessage = 'Sign up failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already registered. Try logging in.';
          showFieldError(elements.email, elements.emailError, errorMessage);
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          showFieldError(elements.email, elements.emailError, errorMessage);
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          showFieldError(elements.password, elements.passwordError, errorMessage);
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Check your connection.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // ============ SUBMIT HANDLER ============
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (state.isSubmitting) return;
    
    console.log('🚀 [SIGNUP] Form submitted');
    
    // Validate all fields
    if (!validateAllFields()) {
      showToast('Please fix the errors in the form', 'error');
      // Scroll to first error
      const firstError = document.querySelector('.form-input.error, .form-select.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Get form data
    const formData = {
      fullName: elements.fullName.value.trim(),
      nic: elements.nic.value.trim().toUpperCase(),
      email: elements.email.value.trim().toLowerCase(),
      phone: elements.phone.value.trim().replace(/\s/g, ''),
      dob: elements.dob.value,
      address: elements.address.value.trim(),
      hearAboutUs: elements.hearAboutUs.value,
      password: elements.password.value,
      nickname: state.accountType === 'employee' ? elements.nickname.value.trim() : null
    };
    
    // Format phone to +94
    if (formData.phone.startsWith('0')) {
      formData.phone = '+94' + formData.phone.substring(1);
    } else if (!formData.phone.startsWith('+94')) {
      formData.phone = '+94' + formData.phone;
    }
    
    // Start submission
    state.isSubmitting = true;
    elements.submitButton.classList.add('loading');
    elements.submitButton.disabled = true;
    
    try {
      // Check for duplicates
      showToast('🔍 Checking your details...', 'info');
      const dupCheck = await checkDuplicates(formData.email, formData.nic, formData.nickname);
      
      if (dupCheck.duplicate) {
        showToast(dupCheck.message, 'error');
        if (dupCheck.field === 'email') {
          showFieldError(elements.email, elements.emailError, dupCheck.message);
        } else if (dupCheck.field === 'nic') {
          showFieldError(elements.nic, elements.nicError, dupCheck.message);
        } else if (dupCheck.field === 'nickname') {
          showFieldError(elements.nickname, elements.nicknameError, dupCheck.message);
        }
        state.isSubmitting = false;
        elements.submitButton.classList.remove('loading');
        elements.submitButton.disabled = false;
        return;
      }
      
      // Create account
      showToast('☕ Creating your account...', 'info');
      const result = await createAccount(formData);
      
      if (result.success) {
        // 🎉 SUCCESS!
        console.log('🎉 [SIGNUP] Account created successfully!');
        
        // Sign out (so they need to verify + admin approve before login)
        await firebase.auth().signOut();
        
        // Show success
        const accountTypeText = state.accountType === 'employee' ? 'Employee' : 'Student';
        elements.successMessage.textContent = 
          `Your ${accountTypeText} account has been created successfully. Please check your email for verification, then wait for admin approval.`;
        
        elements.successOverlay.classList.add('active');
        showConfetti();
        
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`✨ [SIGNUP] Total time: ${elapsed}ms`);
        
      } else {
        showToast(result.error, 'error');
        state.isSubmitting = false;
        elements.submitButton.classList.remove('loading');
        elements.submitButton.disabled = false;
      }
      
    } catch (error) {
      console.error('❌ [SIGNUP] Unexpected error:', error);
      showToast('An unexpected error occurred', 'error');
      state.isSubmitting = false;
      elements.submitButton.classList.remove('loading');
      elements.submitButton.disabled = false;
    }
  }

  // ============ EVENT LISTENERS ============
  function attachEventListeners() {
    // Form submit
    elements.form.addEventListener('submit', handleSubmit);
    
    // Promo code with debounce
    elements.promoCode.addEventListener('input', (e) => {
      const code = e.target.value;
      
      // Auto uppercase
      if (code !== code.toUpperCase()) {
        e.target.value = code.toUpperCase();
      }
      
      clearTimeout(state.promoCheckTimeout);
      
      if (!code.trim()) {
        resetPromoCode();
        return;
      }
      
      state.promoCheckTimeout = setTimeout(() => {
        verifyPromoCode(code);
      }, 500); // 500ms debounce
    });
    
    // Field validation on blur
    elements.fullName.addEventListener('blur', validateFullName);
    elements.nic.addEventListener('blur', validateNIC);
    elements.email.addEventListener('blur', validateEmail);
    elements.phone.addEventListener('blur', validatePhone);
    elements.hearAboutUs.addEventListener('change', validateHearAboutUs);
    
    // Nickname validation
    if (elements.nickname) {
      elements.nickname.addEventListener('blur', validateNickname);
    }
    
    // Password strength
    elements.password.addEventListener('input', updatePasswordStrength);
    elements.password.addEventListener('blur', validatePassword);
    elements.confirmPassword.addEventListener('blur', validateConfirmPassword);
    
    // Password toggles
    elements.togglePassword.addEventListener('click', () => {
      const type = elements.password.type === 'password' ? 'text' : 'password';
      elements.password.type = type;
      elements.togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
    
    elements.toggleConfirmPassword.addEventListener('click', () => {
      const type = elements.confirmPassword.type === 'password' ? 'text' : 'password';
      elements.confirmPassword.type = type;
      elements.toggleConfirmPassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
    
    // Terms checkbox
    elements.termsCheckbox.addEventListener('click', () => {
      state.termsAccepted = !state.termsAccepted;
      elements.termsCheckbox.classList.toggle('checked', state.termsAccepted);
      elements.termsCheckbox.setAttribute('aria-checked', state.termsAccepted);
      if (state.termsAccepted) {
        elements.termsError.classList.remove('active');
      }
    });
    
    // Keyboard support for checkbox
    elements.termsCheckbox.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        elements.termsCheckbox.click();
      }
    });
    
    // Terms links (placeholder for now)
    document.getElementById('termsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Terms & Conditions coming soon', 'info');
    });
    
    document.getElementById('privacyLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Privacy Policy coming soon', 'info');
    });
  }

  // Re-define validators for this scope (they were in Part 1)
  function validateFullName() {
    return window._signupHelpers.validateAllFields ? 
      (() => {
        const v = elements.fullName.value.trim();
        if (!v || v.length < 3) {
          showFieldError(elements.fullName, elements.fullNameError, 'Name required (min 3 chars)');
          return false;
        }
        clearFieldError(elements.fullName, elements.fullNameError);
        return true;
      })() : true;
  }

  function validateNIC() {
    const v = elements.nic.value.trim();
    if (!v) {
      showFieldError(elements.nic, elements.nicError, 'NIC required');
      return false;
    }
    if (!CONFIG.NIC_OLD_PATTERN.test(v) && !CONFIG.NIC_NEW_PATTERN.test(v)) {
      showFieldError(elements.nic, elements.nicError, 'Invalid NIC format');
      return false;
    }
    clearFieldError(elements.nic, elements.nicError);
    return true;
  }

  function validateEmail() {
    const v = elements.email.value.trim();
    if (!v || !CONFIG.EMAIL_PATTERN.test(v)) {
      showFieldError(elements.email, elements.emailError, 'Valid email required');
      return false;
    }
    clearFieldError(elements.email, elements.emailError);
    return true;
  }

  function validatePhone() {
    const v = elements.phone.value.trim().replace(/\s/g, '');
    if (!v || !CONFIG.PHONE_PATTERN.test(v)) {
      showFieldError(elements.phone, elements.phoneError, 'Valid phone required');
      return false;
    }
    clearFieldError(elements.phone, elements.phoneError);
    return true;
  }

  function validateHearAboutUs() {
    if (!elements.hearAboutUs.value) {
      showFieldError(elements.hearAboutUs, elements.hearAboutUsError, 'Please select');
      return false;
    }
    clearFieldError(elements.hearAboutUs, elements.hearAboutUsError);
    return true;
  }

  function validateNickname() {
    if (state.accountType !== 'employee') return true;
    const v = elements.nickname.value.trim();
    if (!v || v.length < 3 || v.length > 30 || !/^[a-zA-Z0-9_]+$/.test(v)) {
      showFieldError(elements.nickname, elements.nicknameError, 'Valid nickname required (3-30 chars, letters/numbers/_)');
      return false;
    }
    clearFieldError(elements.nickname, elements.nicknameError);
    return true;
  }

  function validatePassword() {
    if (elements.password.value.length < CONFIG.MIN_PASSWORD_LENGTH) {
      showFieldError(elements.password, elements.passwordError, `Min ${CONFIG.MIN_PASSWORD_LENGTH} characters`);
      return false;
    }
    clearFieldError(elements.password, elements.passwordError);
    return true;
  }

  function validateConfirmPassword() {
    if (elements.password.value !== elements.confirmPassword.value) {
      showFieldError(elements.confirmPassword, elements.confirmPasswordError, 'Passwords do not match');
      return false;
    }
    clearFieldError(elements.confirmPassword, elements.confirmPasswordError);
    return true;
  }

  // ============ INITIALIZATION ============
  function init() {
    console.log('🚀 [SIGNUP] Initializing...');
    
    // Wait for Firebase
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
      console.log('⏳ [SIGNUP] Waiting for Firebase...');
      setTimeout(init, 100);
      return;
    }
    
    cacheElements();
    elements = getElements();
    
    attachEventListeners();
    
    // Set max date for DOB (must be 5+ years old)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 5);
    elements.dob.max = maxDate.toISOString().split('T')[0];
    
    const elapsed = Math.round(performance.now() - startTime);
    console.log(`✅ [SIGNUP] Ready! Init time: ${elapsed}ms`);
    console.log('☕ [SIGNUP] Buono Sign Up System v1.0');
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();