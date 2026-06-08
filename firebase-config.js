// ============================================
// 🔥 FIREBASE GLOBAL CONFIG
// File: firebase-config.js
// Used by ALL pages!
// ============================================

// ===================================
// 🔥 Firebase Configuration
// ===================================
const firebaseConfig = {
    apiKey: "AIzaSyBkXBs5GrfnMIFnJLJWkSMULYxGKz0Shtk",
    authDomain: "buono-project-927b8.firebaseapp.com",
    projectId: "buono-project-927b8",
    storageBucket: "buono-project-927b8.firebasestorage.app",
    messagingSenderId: "706681135399",
    appId: "1:706681135399:web:c15f197f1efe3a64f00902"
};

// ===================================
// 🚀 Initialize Firebase
// ===================================
firebase.initializeApp(firebaseConfig);

// ===================================
// 📊 Firebase Services (Global!)
// ===================================
const db = firebase.firestore();

// ⚠️ Storage requires firebase-storage.js SDK
// Add when needed in HTML:
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
// Then uncomment: const storage = firebase.storage();

// ===================================
// 🎯 GLOBAL HELPER FUNCTIONS
// ===================================

function getCurrentUser() {
    const user = sessionStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function logout() {
    if (confirm('🚪 Logout කරන්න ඕනද?')) {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    }
}

function checkAccessLevel(allowedAccess) {
    const user = checkAuth();
    if (!user) return null;

    if (!allowedAccess.includes(user.access)) {
        alert('⛔ You do not have permission to access this page!');
        window.location.href = 'access.html';
        return null;
    }
    return user;
}

function hasPermission(dbName) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.access === 'Admin') return true;
    if (user.permissions && user.permissions[dbName]) {
        return user.permissions[dbName].view === true;
    }
    return false;
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

function formatTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(date) {
    if (!date) return '-';
    return formatDate(date) + ' ' + formatTime(date);
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'Rs. 0.00';
    return 'Rs. ' + Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getServerTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

function showTableLoading(tbodyId, cols = 5) {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${cols}" style="text-align: center; padding: 20px; color: #888;">
                    ⏳ Loading...
                </td>
            </tr>`;
    }
}

function showTableEmpty(tbodyId, cols = 5, message = 'No data found') {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${cols}" style="text-align: center; padding: 20px; color: #888;">
                    📭 ${message}
                </td>
            </tr>`;
    }
}

// ===================================
// ✅ Firebase Ready!
// ===================================
console.log('🔥 Firebase initialized successfully!');