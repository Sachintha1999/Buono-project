// ============================================
// 🔥 FIREBASE GLOBAL CONFIG - MASTER FILE!
// File: firebase-config.js
// Version: 10.1 (Architecture Migration!)
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

// ===================================
// ⭐ MASTER DATABASES ARRAY!
// Single source of truth for ALL pages!
// To add new DB: just add 1 entry here!
// ===================================
const DATABASES = [
    {
        id: 'employeeDB',
        name: 'Employee Database',
        shortName: 'Employee',
        icon: '👥',
        url: 'index.html',
        permPrefix: 'emp',
        color: '#2196F3',
        description: 'Manage employees, roles & permissions',
        adminManagerOnly: false
    },
    {
        id: 'dayEndReportDB',
        name: 'Day End Reports',
        shortName: 'Cashier',
        icon: '💰',
        url: 'cashier.html',
        permPrefix: 'der',
        color: '#4CAF50',
        description: 'Daily sales & cash reports',
        adminManagerOnly: false
    },
    {
        id: 'inventoryDB',
        name: 'Inventory Database',
        shortName: 'Inventory',
        icon: '📦',
        url: 'inventory.html',
        permPrefix: 'inv',
        color: '#FF9800',
        description: 'Stock management & tracking',
        adminManagerOnly: false
    },
    {
        id: 'kitchenDB',
        name: 'Kitchen Database',
        shortName: 'Kitchen',
        icon: '🍳',
        url: 'kitchen.html',
        permPrefix: 'kit',
        color: '#f0a500',
        description: 'Recipes, meals & wastage',
        adminManagerOnly: false
    },
    {
        id: 'purchasingDB',
        name: 'Purchasing Database',
        shortName: 'Purchasing',
        icon: '🛒',
        url: 'purchasing.html',
        permPrefix: 'pur',
        color: '#9C27B0',
        description: 'Suppliers & purchase orders',
        adminManagerOnly: false
    },
    {
        id: 'callCenterDB',
        name: 'Call Center',
        shortName: 'Call Center',
        icon: '📞',
        url: 'callcenter.html',
        permPrefix: 'cc',
        color: '#00BCD4',
        description: 'Leads, courses & campaigns',
        adminManagerOnly: false
    },
    {
        id: 'reportsDB',
        name: 'Reports Database',
        shortName: 'Reports',
        icon: '📊',
        url: 'reports.html',
        permPrefix: 'rep',
        color: '#ff4444',
        description: 'Analytics & P/L reports',
        adminManagerOnly: true
    }
];

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

// ===================================
// ⭐ DATABASE ACCESS HELPERS
// ===================================

function getDatabaseById(dbId) {
    return DATABASES.find(db => db.id === dbId);
}

function checkDBAccess(dbId) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.access === 'Admin') return true;
    
    const database = getDatabaseById(dbId);
    if (!database) return false;
    
    // Admin/Manager only DBs
    if (database.adminManagerOnly) {
        return user.access === 'Admin' || user.access === 'Manager';
    }
    
    return hasPermission(dbId);
}

function getAccessibleDatabases() {
    return DATABASES.filter(db => checkDBAccess(db.id));
}

// ===================================
// ⭐ BUILD TOPBAR (Universal!)
// ===================================

function buildTopbar(currentDbId, options = {}) {
    const user = getCurrentUser();
    if (!user) return '';
    
    const currentDb = getDatabaseById(currentDbId);
    const dbIcon = currentDb ? currentDb.icon : '🍴';
    const dbName = currentDb ? currentDb.name : 'Buono';
    
    const customTitle = options.title || dbName;
    const showHomeBtn = options.showHomeBtn !== false;
    const extraButtons = options.extraButtons || '';
    
    return `
        <div class="topbar">
            <div class="topbar-left">
                <div class="logo">${dbIcon} ${customTitle}</div>
            </div>
            <div class="topbar-right">
                ${buildDatabaseSwitcher(currentDbId)}
                ${extraButtons}
                ${showHomeBtn ? `<button class="btn-home" onclick="window.location.href='access.html'">🏠 Home</button>` : ''}
                <div class="user-info">
                    <span class="user-name">👤 ${user.nickname || user.fullName}</span>
                    <span class="user-role">${user.access}</span>
                </div>
                <button class="btn-logout" onclick="logout()">🚪 Logout</button>
            </div>
        </div>
    `;
}

// ===================================
// ⭐ BUILD DATABASE SWITCHER (Universal!)
// Dropdown menu - shows accessible DBs only
// ===================================

function buildDatabaseSwitcher(currentDbId) {
    const accessibleDbs = getAccessibleDatabases();
    
    // If only 1 or no accessible DB, don't show switcher
    if (accessibleDbs.length <= 1) return '';
    
    let optionsHTML = '';
    accessibleDbs.forEach(database => {
        if (database.id === currentDbId) return; // skip current
        optionsHTML += `
            <a href="${database.url}" class="db-switch-item">
                <span class="db-switch-icon">${database.icon}</span>
                <span class="db-switch-name">${database.shortName}</span>
            </a>
        `;
    });
    
    if (!optionsHTML) return '';
    
    return `
        <div class="db-switcher">
            <button class="btn-db-switch" onclick="toggleDBSwitcher(event)">
                🔄 Switch DB ▼
            </button>
            <div class="db-switch-menu" id="dbSwitchMenu">
                ${optionsHTML}
            </div>
        </div>
    `;
}

function toggleDBSwitcher(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('dbSwitchMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Close switcher when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.getElementById('dbSwitchMenu');
    const btn = document.querySelector('.btn-db-switch');
    if (menu && menu.classList.contains('show')) {
        if (!menu.contains(e.target) && e.target !== btn) {
            menu.classList.remove('show');
        }
    }
});

// ===================================
// ⭐ INIT PAGE (All-in-one helper!)
// Use in every page script:
// const user = initPage('cashierDB', ['Admin','Manager','Cashier']);
// ===================================

function initPage(dbId, allowedAccess) {
    // Step 1: Check auth
    const user = checkAuth();
    if (!user) return null;
    
    // Step 2: Check access level
    if (allowedAccess && !allowedAccess.includes(user.access)) {
        alert('⛔ You do not have permission to access this page!');
        window.location.href = 'access.html';
        return null;
    }
    
    // Step 3: Check DB permission
    if (dbId && !checkDBAccess(dbId)) {
        alert('⛔ You do not have permission for this database!');
        window.location.href = 'access.html';
        return null;
    }
    
    // Step 4: Build topbar (if container exists)
    if (dbId) {
        const topbarContainer = document.getElementById('topbarContainer');
        if (topbarContainer) {
            topbarContainer.innerHTML = buildTopbar(dbId);
        }
    }
    
    return user;
}

// ===================================
// 📅 FORMAT HELPERS
// ===================================

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

// ===================================
// 📊 TABLE HELPERS
// ===================================

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
console.log('🔥 Firebase initialized successfully! (v10.1 Master)');
console.log('📊 Databases loaded:', DATABASES.length);