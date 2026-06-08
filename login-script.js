// ============================================
// 🔐 LOGIN PAGE - SCRIPT
// File: login-script.js
// 
// 🔥 Firebase: Loaded from firebase-config.js
// 📦 Available globals: db, getCurrentUser()
// ============================================


// ===================================
// 🚀 AUTO-REDIRECT
// දැනටමත් login නම් access.html ට
// ===================================
if (getCurrentUser()) {
    window.location.href = 'access.html';
}


// ===================================
// 🔐 LOGIN FUNCTION
// ===================================
async function loginUser() {
    const nickname = document.getElementById('loginNickname').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');

    // Error hide first
    errorEl.style.display = 'none';

    // ✅ Validation
    if (!nickname || !password) {
        showError("⚠️ Please enter Nickname and Password!");
        return;
    }

    // Button disable - double click වළකන්න
    setButtonLoading(true);

    try {
        // Firebase search
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

        // ✅ LOGIN SUCCESS - Save session
        const userInfo = {
            id: userDoc.id,
            name: userData.name,
            nickname: userData.nickname,
            access: userData.access,
            permissions: userData.permissions || {}
        };

        sessionStorage.setItem('loggedInUser', JSON.stringify(userInfo));

        // Success feedback
        loginBtn.textContent = '✅ Success! Redirecting...';

        // Redirect to access page
        window.location.href = 'access.html';

    } catch (error) {
        console.error("❌ Login error:", error);
        showError("❌ Connection error! Try again.");
        setButtonLoading(false);
    }
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