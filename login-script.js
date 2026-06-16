// ============================================
// 🔐 LOGIN PAGE - LOADER SAFE SCRIPT
// File: login-script.js
// Version: 4.0 - Theme-Aware + Loader Safe
// ============================================

// ─── Perf Tracker ───
const Perf = {
    _marks: {},
    start(label) {
        this._marks[label] = performance.now();
    },
    end(label) {
        const t = performance.now() - (this._marks[label] || 0);
        console.log(`⚡ [LOGIN] ${label}: ${t.toFixed(1)}ms`);
        return t;
    }
};

Perf.start('Total Init');

let loginPageInitialized = false;

// ===================================
// 🔧 HELPERS
// ===================================
function hasLoginDependencies() {
    return (
        typeof db !== 'undefined' &&
        typeof getCurrentUser === 'function' &&
        typeof isStudentLogin === 'function'
    );
}

function getLoginElements() {
    return {
        overlay: document.getElementById('loginLoadingOverlay'),
        content: document.getElementById('loginMainContent'),
        errorEl: document.getElementById('loginError'),
        loginBtn: document.getElementById('loginBtn'),
        nicknameInput: document.getElementById('loginNickname'),
        passwordInput: document.getElementById('loginPassword'),
        pendingOverlay: document.getElementById('pendingModalOverlay'),
        pendingMessage: document.getElementById('pendingMessage'),
        emailVerifyStatus: document.getElementById('emailVerifyStatus'),
        pendingAppliedDate: document.getElementById('pendingAppliedDate')
    };
}

function resetLoginButtonState() {
    const { loginBtn } = getLoginElements();
    if (!loginBtn) return;

    loginBtn.classList.remove('login-btn-success-employee', 'login-btn-success-student');
}

function setLoginButtonSuccess(type, text) {
    const { loginBtn } = getLoginElements();
    if (!loginBtn) return;

    resetLoginButtonState();

    if (type === 'employee') {
        loginBtn.classList.add('login-btn-success-employee');
    } else if (type === 'student') {
        loginBtn.classList.add('login-btn-success-student');
    }

    loginBtn.textContent = text;
}

// ===================================
// 👁️ REVEAL PAGE
// ===================================
function revealLoginPage() {
    Perf.end('Total Init');

    const { overlay, content } = getLoginElements();

    if (overlay) {
        overlay.classList.add('hidden');
    }

    if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }

    console.log('✅ [LOGIN] Page ready!');
}

// ===================================
// ⚠️ ERROR UI
// ===================================
function showError(message) {
    const { errorEl } = getLoginElements();
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.classList.remove('show');
    void errorEl.offsetWidth;
    errorEl.classList.add('show');
}

function hideError() {
    const { errorEl } = getLoginElements();
    if (!errorEl) return;

    errorEl.classList.remove('show');
}

// ===================================
// 🔘 BUTTON STATE
// ===================================
function setButtonLoading(isLoading) {
    const { loginBtn } = getLoginElements();
    if (!loginBtn) return;

    if (isLoading) {
        resetLoginButtonState();
        loginBtn.disabled = true;
        loginBtn.textContent = '⏳ Checking...';
    } else {
        loginBtn.disabled = false;
        loginBtn.textContent = '🔐 Login';
        resetLoginButtonState();
    }
}

// ===================================
// 🚀 AUTO REDIRECT
// ===================================
function checkExistingLogin() {
    Perf.start('Auto-redirect Check');

    if (!hasLoginDependencies()) {
        console.error('❌ [LOGIN] Core dependencies not ready');
        Perf.end('Auto-redirect Check');
        setTimeout(revealLoginPage, 50);
        return;
    }

    // Employee session
    if (getCurrentUser()) {
        console.log('✅ [LOGIN] Employee already logged in → access.html');
        Perf.end('Auto-redirect Check');
        window.location.href = 'access.html';
        return;
    }

    // Student session
    const existingStudent = sessionStorage.getItem('loggedInStudent');
    if (existingStudent) {
        try {
            const student = JSON.parse(existingStudent);
            console.log('✅ [LOGIN] Student already logged in:', student.studentId);
            Perf.end('Auto-redirect Check');
            window.location.href = 'student-portal.html';
            return;
        } catch (error) {
            sessionStorage.removeItem('loggedInStudent');
        }
    }

    Perf.end('Auto-redirect Check');
    setTimeout(revealLoginPage, 50);
}

// ===================================
// 🔐 LOGIN ENTRY
// ===================================
async function loginUser() {
    if (!hasLoginDependencies()) {
        showError("⚠️ System still loading. Please wait...");
        return;
    }

    const { nicknameInput, passwordInput } = getLoginElements();

    const userId = nicknameInput ? nicknameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    hideError();

    if (!userId || !password) {
        showError("⚠️ Please enter ID/Nickname and Password!");
        return;
    }

    setButtonLoading(true);
    Perf.start('Login Attempt');

    try {
        if (isStudentLogin(userId)) {
            console.log('🎓 [LOGIN] Student login detected:', userId);
            await loginAsStudent(userId.toUpperCase(), password);
        } else {
            console.log('👤 [LOGIN] Employee login detected:', userId);
            await loginAsEmployee(userId, password);
        }
    } catch (error) {
        console.error("❌ [LOGIN] Error:", error);
        showError("❌ Connection error! Try again.");
        setButtonLoading(false);
    }
}

// ===================================
// 👤 EMPLOYEE LOGIN
// ===================================
async function loginAsEmployee(nickname, password) {
    console.log('🔍 [LOGIN] Searching employee:', nickname);

    const snapshot = await db.collection('employees')
        .where('nickname', '==', nickname)
        .get();

    if (snapshot.empty) {
        showError("❌ Nickname not found!");
        setButtonLoading(false);
        return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
        showError("❌ Wrong Password!");
        setButtonLoading(false);
        return;
    }

    if (userData.approvalStatus === 'pending') {
        console.log('⏳ [LOGIN] Account pending approval');
        showPendingModal({
            name: userData.name || nickname,
            email: userData.email || '',
            emailVerified: userData.emailVerified || false,
            signupDate: userData.signupDate,
            type: 'employee'
        });
        setButtonLoading(false);
        return;
    }

    if (userData.approvalStatus === 'rejected') {
        showError("❌ Your application was rejected. Contact admin.");
        setButtonLoading(false);
        return;
    }

    if (userData.status === 'Suspended') {
        showError("⛔ Account suspended! Contact admin.");
        setButtonLoading(false);
        return;
    }

    const userInfo = {
        id: userDoc.id,
        name: userData.name,
        nickname: userData.nickname,
        access: userData.access,
        permissions: userData.permissions || {}
    };

    sessionStorage.setItem('loggedInUser', JSON.stringify(userInfo));

    setLoginButtonSuccess('employee', '✅ Welcome ' + userData.nickname + '!');

    Perf.end('Login Attempt');
    console.log('🎉 [LOGIN] Employee success:', userData.nickname);

    setTimeout(() => {
        window.location.href = 'access.html';
    }, 800);
}

// ===================================
// 🎓 STUDENT LOGIN
// ===================================
async function loginAsStudent(studentId, password) {
    console.log('🔍 [LOGIN] Searching student:', studentId);

    const snapshot = await db.collection('students')
        .where('studentId', '==', studentId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        showError("❌ Student ID not found!");
        setButtonLoading(false);
        return;
    }

    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data();

    if (studentData.password !== password) {
        showError("❌ Wrong Password!");
        setButtonLoading(false);
        return;
    }

    if (studentData.approvalStatus === 'pending') {
        console.log('⏳ [LOGIN] Student account pending approval');
        showPendingModal({
            name: studentData.name,
            email: studentData.email || '',
            emailVerified: studentData.emailVerified || false,
            signupDate: studentData.signupDate,
            type: 'student'
        });
        setButtonLoading(false);
        return;
    }

    if (studentData.approvalStatus === 'rejected') {
        showError("❌ Your application was rejected. Contact admin.");
        setButtonLoading(false);
        return;
    }

    if (studentData.status === 'Suspended') {
        showError("⛔ Account suspended! Contact admin.");
        setButtonLoading(false);
        return;
    }

    const studentInfo = {
        docId: studentDoc.id,
        studentId: studentData.studentId,
        name: studentData.name,
        phone: studentData.phone,
        email: studentData.email || '',
        courseName: studentData.courseName || '',
        academy: studentData.academy || '',
        batchNumber: studentData.batchNumber || '',
        loginTime: new Date().toISOString(),
        sessionType: 'student'
    };

    sessionStorage.setItem('loggedInStudent', JSON.stringify(studentInfo));

    setLoginButtonSuccess('student', '🎓 Welcome ' + studentData.name + '!');

    Perf.end('Login Attempt');
    console.log('🎉 [LOGIN] Student success:', studentData.studentId);

    setTimeout(() => {
        window.location.href = 'student-portal.html';
    }, 1000);
}

// ===================================
// ⌨️ ENTER KEY SUPPORT
// ===================================
function handleEnterKey(e) {
    if (e.key === 'Enter') {
        loginUser();
    }
}

// ===================================
// 🔠 AUTO UPPERCASE STUDENT IDs
// ===================================
function setupUppercaseInput() {
    const { nicknameInput } = getLoginElements();
    if (!nicknameInput) return;

    nicknameInput.addEventListener('input', function (e) {
        const val = e.target.value;
        if (val.toUpperCase().startsWith('BCA') || val.toUpperCase().startsWith('B-')) {
            e.target.value = val.toUpperCase();
        }
    });
}

// ===================================
// ⏳ PENDING MODAL
// ===================================
function showPendingModal(userData) {
    const {
        pendingOverlay,
        pendingMessage,
        emailVerifyStatus,
        pendingAppliedDate
    } = getLoginElements();

    if (!pendingOverlay || !pendingMessage || !emailVerifyStatus || !pendingAppliedDate) {
        console.warn('⚠️ [LOGIN] Pending modal elements not found');
        return;
    }

    const typeText = userData.type === 'employee' ? 'employee' : 'student';
    pendingMessage.textContent = `Hi ${userData.name}! Your ${typeText} account is under review by our admin team.`;

    emailVerifyStatus.classList.remove('email-verified');

    if (userData.emailVerified) {
        emailVerifyStatus.textContent = '✅ Email verified';
        emailVerifyStatus.classList.add('email-verified');
    } else {
        emailVerifyStatus.textContent = userData.email
            ? `Check ${userData.email} and verify`
            : 'Please verify your email';
    }

    if (userData.signupDate) {
        const date = userData.signupDate.toDate
            ? userData.signupDate.toDate()
            : new Date(userData.signupDate);

        pendingAppliedDate.textContent = `Applied: ${date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`;
    } else {
        pendingAppliedDate.textContent = 'Applied recently';
    }

    pendingOverlay.classList.add('active');
}

function closePendingModal() {
    const {
        pendingOverlay,
        nicknameInput,
        passwordInput
    } = getLoginElements();

    if (pendingOverlay) {
        pendingOverlay.classList.remove('active');
    }

    if (nicknameInput) nicknameInput.value = '';
    if (passwordInput) passwordInput.value = '';

    hideError();
    setButtonLoading(false);

    if (nicknameInput) {
        nicknameInput.focus();
    }
}

function setupPendingModalOverlay() {
    const { pendingOverlay } = getLoginElements();
    if (!pendingOverlay) return;

    pendingOverlay.addEventListener('click', function (e) {
        if (e.target === pendingOverlay) {
            closePendingModal();
        }
    });
}

// ===================================
// 🚀 INIT
// ===================================
function initLoginPage() {
    if (loginPageInitialized) return;
    loginPageInitialized = true;

    document.addEventListener('keypress', handleEnterKey);
    setupUppercaseInput();
    setupPendingModalOverlay();

    console.log('🔐 [LOGIN] Script loaded! v4.0 - Theme-Aware + Loader Safe');
    console.log('⏳ [LOGIN] Pending approval system ready');

    checkExistingLogin();
}

function waitForDomReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
            resolve();
        }
    });
}

function waitForBuonoReady() {
    if (window.BuonoReady === true) {
        return Promise.resolve();
    }

    if (window.BuonoLoader && typeof window.BuonoLoader.whenReady === 'function') {
        return window.BuonoLoader.whenReady();
    }

    return new Promise((resolve) => {
        let done = false;

        function finish() {
            if (done) return;
            done = true;
            resolve();
        }

        document.addEventListener('buono:ready', finish, { once: true });
        setTimeout(finish, 4000);
    });
}

// Inline onclick support
window.loginUser = loginUser;
window.closePendingModal = closePendingModal;

Promise.all([waitForDomReady(), waitForBuonoReady()])
    .then(() => {
        initLoginPage();
    })
    .catch((error) => {
        console.error('❌ [LOGIN] Init failed:', error);
        revealLoginPage();
        showError("❌ Page loading failed! Please refresh.");
    });