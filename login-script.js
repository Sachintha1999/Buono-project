// ============================================
// 🔐 LOGIN PAGE - SCRIPT (Smart Routing!)
// File: login-script.js
// Version: 2.0 (Employee + Student Support)
// 
// 🔥 Firebase: Loaded from firebase-config.js
// 📦 Available globals: db, getCurrentUser(), isStudentLogin()
// ============================================


// ===================================
// 🚀 AUTO-REDIRECT (Smart!)
// ===================================

// Check Employee Login
if (getCurrentUser()) {
    console.log('✅ Employee already logged in - redirecting to access.html');
    window.location.href = 'access.html';
}

// Check Student Login
const existingStudent = sessionStorage.getItem('loggedInStudent');
if (existingStudent) {
    try {
        const student = JSON.parse(existingStudent);
        console.log('✅ Student already logged in:', student.studentId);
        window.location.href = 'student-portal.html';
    } catch (e) {
        sessionStorage.removeItem('loggedInStudent');
    }
}


// ===================================
// 🔐 SMART LOGIN FUNCTION
// Auto-detect: Employee OR Student!
// ===================================
async function loginUser() {
    const userId = document.getElementById('loginNickname').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');

    // Error hide first
    errorEl.style.display = 'none';

    // ✅ Validation
    if (!userId || !password) {
        showError("⚠️ Please enter ID/Nickname and Password!");
        return;
    }

    // Button disable - prevent double-click
    setButtonLoading(true);

    try {
        // ═══════════════════════════════════════════
        // 🎯 SMART DETECTION:
        // BCA-XXX-XXXX → Student login
        // Otherwise   → Employee login
        // ═══════════════════════════════════════════
        
        if (isStudentLogin(userId)) {
            console.log('🎓 Student login detected:', userId);
            await loginAsStudent(userId.toUpperCase(), password);
        } else {
            console.log('👤 Employee login detected:', userId);
            await loginAsEmployee(userId, password);
        }

    } catch (error) {
        console.error("❌ Login error:", error);
        showError("❌ Connection error! Try again.");
        setButtonLoading(false);
    }
}


// ===================================
// 👤 EMPLOYEE LOGIN
// ===================================
async function loginAsEmployee(nickname, password) {
    console.log('🔍 Searching employee:', nickname);
    
    const snapshot = await db.collection('employees')
        .where('nickname', '==', nickname)
        .get();

    // Nickname not found
    if (snapshot.empty) {
        showError("❌ Nickname not found!");
        setButtonLoading(false);
        return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Password check
    if (userData.password !== password) {
        showError("❌ Wrong Password!");
        setButtonLoading(false);
        return;
    }

    // ✅ EMPLOYEE LOGIN SUCCESS - Save session
    const userInfo = {
        id: userDoc.id,
        name: userData.name,
        nickname: userData.nickname,
        access: userData.access,
        permissions: userData.permissions || {}
    };

    sessionStorage.setItem('loggedInUser', JSON.stringify(userInfo));

    // Success feedback
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = '✅ Welcome ' + userData.nickname + '!';
    loginBtn.style.background = 'linear-gradient(135deg, #4CAF50, #2e7d32)';

    console.log('🎉 Employee login success:', userData.nickname);

    // Redirect to access page
    setTimeout(() => {
        window.location.href = 'access.html';
    }, 800);
}


// ===================================
// 🎓 STUDENT LOGIN
// ===================================
async function loginAsStudent(studentId, password) {
    console.log('🔍 Searching student:', studentId);
    
    const snapshot = await db.collection('students')
        .where('studentId', '==', studentId)
        .limit(1)
        .get();

    // Student ID not found
    if (snapshot.empty) {
        showError("❌ Student ID not found!");
        setButtonLoading(false);
        return;
    }

    const studentDoc = snapshot.docs[0];
    const studentData = studentDoc.data();

    // Password check
    if (studentData.password !== password) {
        showError("❌ Wrong Password!");
        setButtonLoading(false);
        return;
    }

    // Account status check
    if (studentData.status === 'Suspended') {
        showError("⛔ Account suspended! Contact admin.");
        setButtonLoading(false);
        return;
    }

    // ✅ STUDENT LOGIN SUCCESS - Save session
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

    // Success feedback
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = '🎓 Welcome ' + studentData.name + '!';
    loginBtn.style.background = 'linear-gradient(135deg, #9C27B0, #6A1B9A)';

    console.log('🎉 Student login success:', studentData.studentId);

    // Redirect to student portal
    setTimeout(() => {
        window.location.href = 'student-portal.html';
    }, 1000);
}


// ===================================
// 🎨 HELPER FUNCTIONS
// ===================================

/**
 * Show error message
 */
function showError(message) {
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = message;
    errorEl.style.display = "block";
}

/**
 * Toggle login button loading state
 */
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
            // Auto-uppercase if looks like Student ID
            if (val.toUpperCase().startsWith('BCA') || val.toUpperCase().startsWith('B-')) {
                e.target.value = val.toUpperCase();
            }
        });
    }
});


console.log('🔐 Login script loaded! (v2.0 - Smart Routing: Employee + Student)');