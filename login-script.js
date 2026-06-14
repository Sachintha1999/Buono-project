// ============================================
// 🔐 LOGIN PAGE - OPTIMIZED SCRIPT
// File: login-script.js
// Version: 3.0 - Performance Optimized!
// ============================================

// ─── Perf Tracker ───
const Perf = {
    _marks: {},
    start(label) { this._marks[label] = performance.now(); },
    end(label) {
        const t = performance.now() - (this._marks[label] || 0);
        console.log(`⚡ [LOGIN] ${label}: ${t.toFixed(1)}ms`);
        return t;
    }
};

Perf.start('Total Init');

// ─── Reveal Page ───
function revealLoginPage() {
    Perf.end('Total Init');
    const overlay = document.getElementById('loginLoadingOverlay');
    const content = document.getElementById('loginMainContent');
    if (overlay) overlay.classList.add('hidden');
    if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }
    console.log('✅ [LOGIN] Page ready!');
}

// ─── Smart Error Display ───
function showError(message) {
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = message;
    errorEl.classList.remove('show');
    // Force reflow to restart animation
    void errorEl.offsetWidth;
    errorEl.classList.add('show');
}

function hideError() {
    const errorEl = document.getElementById('loginError');
    errorEl.classList.remove('show');
}

// ─── Button Loading ───
function setButtonLoading(isLoading) {
    const loginBtn = document.getElementById('loginBtn');
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.textContent = '⏳ Checking...';
    } else {
        loginBtn.disabled = false;
        loginBtn.textContent = '🔐 Login';
        loginBtn.style.background = '';
    }
}

// ===================================
// 🚀 AUTO-REDIRECT (Smart!)
// ===================================
(function checkExistingLogin() {
    Perf.start('Auto-redirect Check');

    // Check Employee Login
    if (getCurrentUser()) {
        console.log('✅ [LOGIN] Employee already logged in → access.html');
        Perf.end('Auto-redirect Check');
        window.location.href = 'access.html';
        return;
    }

    // Check Student Login
    const existingStudent = sessionStorage.getItem('loggedInStudent');
    if (existingStudent) {
        try {
            const student = JSON.parse(existingStudent);
            console.log('✅ [LOGIN] Student already logged in:', student.studentId);
            Perf.end('Auto-redirect Check');
            window.location.href = 'student-portal.html';
            return;
        } catch (e) {
            sessionStorage.removeItem('loggedInStudent');
        }
    }

    Perf.end('Auto-redirect Check');

    // No existing login - reveal page smoothly
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealLoginPage);
    } else {
        // Tiny delay for smooth transition
        setTimeout(revealLoginPage, 50);
    }
})();

// ===================================
// 🔐 SMART LOGIN FUNCTION
// ===================================
async function loginUser() {
    const userId = document.getElementById('loginNickname').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

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
// ===================================
// 👤 EMPLOYEE LOGIN (UPDATED!)
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

    // ⭐ NEW: APPROVAL STATUS CHECK
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

    // ⭐ NEW: SUSPENDED CHECK (employees)
    if (userData.status === 'Suspended') {
        showError("⛔ Account suspended! Contact admin.");
        setButtonLoading(false);
        return;
    }

    // ✅ EMPLOYEE LOGIN SUCCESS
    const userInfo = {
        id: userDoc.id,
        name: userData.name,
        nickname: userData.nickname,
        access: userData.access,
        permissions: userData.permissions || {}
    };

    sessionStorage.setItem('loggedInUser', JSON.stringify(userInfo));

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = '✅ Welcome ' + userData.nickname + '!';
    loginBtn.style.background = 'linear-gradient(135deg, #4CAF50, #2e7d32)';

    Perf.end('Login Attempt');
    console.log('🎉 [LOGIN] Employee success:', userData.nickname);

    setTimeout(() => {
        window.location.href = 'access.html';
    }, 800);
}
   

// ===================================
// 🎓 STUDENT LOGIN
// ===================================
// ===================================
// 🎓 STUDENT LOGIN (UPDATED!)
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

    // ⭐ NEW: APPROVAL STATUS CHECK
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

    // ✅ STUDENT LOGIN SUCCESS
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

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = '🎓 Welcome ' + studentData.name + '!';
    loginBtn.style.background = 'linear-gradient(135deg, #9C27B0, #6A1B9A)';

    Perf.end('Login Attempt');
    console.log('🎉 [LOGIN] Student success:', studentData.studentId);

    setTimeout(() => {
        window.location.href = 'student-portal.html';
    }, 1000);
}
      

// ===================================
// ⌨️ ENTER KEY SUPPORT
// ===================================
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loginUser();
    }
});

// ===================================
// 🔠 AUTO-UPPERCASE Student IDs
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    const idInput = document.getElementById('loginNickname');
    if (idInput) {
        idInput.addEventListener('input', function(e) {
            const val = e.target.value;
            if (val.toUpperCase().startsWith('BCA') || val.toUpperCase().startsWith('B-')) {
                e.target.value = val.toUpperCase();
            }
        });
    }
});

console.log('🔐 [LOGIN] Script loaded! v3.0 - Optimized');

// ═══════════════════════════════════════════════════
// ⭐ NEW: PENDING APPROVAL MODAL FUNCTIONS
// ═══════════════════════════════════════════════════

function showPendingModal(userData) {
    const overlay = document.getElementById('pendingModalOverlay');
    const messageEl = document.getElementById('pendingMessage');
    const emailVerifyEl = document.getElementById('emailVerifyStatus');
    const appliedDateEl = document.getElementById('pendingAppliedDate');
    
    if (!overlay) {
        console.warn('⚠️ [LOGIN] Pending modal element not found');
        return;
    }
    
    // Custom message
    const typeText = userData.type === 'employee' ? 'employee' : 'student';
    messageEl.textContent = `Hi ${userData.name}! Your ${typeText} account is under review by our admin team.`;
    
    // Email verification status
    if (userData.emailVerified) {
        emailVerifyEl.innerHTML = '✅ Email verified';
        emailVerifyEl.style.color = '#51CF66';
    } else {
        emailVerifyEl.textContent = `Check ${userData.email} and verify`;
    }
    
    // Applied date
    if (userData.signupDate) {
        const date = userData.signupDate.toDate 
            ? userData.signupDate.toDate() 
            : new Date(userData.signupDate);
        appliedDateEl.textContent = `Applied: ${date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`;
    } else {
        appliedDateEl.textContent = 'Applied recently';
    }
    
    overlay.classList.add('active');
}

function closePendingModal() {
    const overlay = document.getElementById('pendingModalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    // Clear form
    document.getElementById('loginNickname').value = '';
    document.getElementById('loginPassword').value = '';
}

// Close on overlay click
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('pendingModalOverlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closePendingModal();
            }
        });
    }
});

console.log('⏳ [LOGIN] Pending approval system ready');