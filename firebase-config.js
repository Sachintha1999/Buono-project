// ============================================
// 🔥 FIREBASE GLOBAL CONFIG - MASTER FILE!
// File: firebase-config.js
// Version: 10.3 (Phase 10 - Auto Permissions Ready!)
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
        accessDescription: 'Employee profiles, permissions සහ access management.',
        badgeLabel: 'Data Entry',
        badgeClass: 'badge-entry',
        cardClass: '',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'selfView', 'edit']
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
        accessDescription: 'Daily cashier reports, cash flow සහ bank deposits.',
        badgeLabel: 'Data Entry',
        badgeClass: 'badge-entry',
        cardClass: '',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'selfView']
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
        accessDescription: 'Stock management, items, categories සහ low stock alerts.',
        badgeLabel: 'Data Entry',
        badgeClass: 'badge-entry',
        cardClass: '',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'selfView', 'edit']
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
        accessDescription: 'Recipes, staff meals, wastage tracking සහ stock count.',
        badgeLabel: 'Kitchen',
        badgeClass: 'badge-kitchen',
        cardClass: '',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'selfView', 'edit']
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
        accessDescription: 'Supplier bills, purchase orders, payment tracking සහ stock IN.',
        badgeLabel: 'Purchasing',
        badgeClass: 'badge-purchasing',
        cardClass: 'purchasing-card',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'selfView', 'edit'],
        permBorderColor: '#FF9800',
        permTitleColor: '#FF9800'
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
        accessDescription: 'Academy lead management, call logs, follow-ups සහ enrollment tracking.',
        badgeLabel: 'Call Center',
        badgeClass: 'badge-callcenter',
        cardClass: 'callcenter-card',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'edit'],
        autoAccessRoles: ['Manager', 'Call Operator'],
        privilegedRoles: ['Admin', 'Manager'],
        privilegedRolePerms: {
            add: true,
            view: true,
            edit: true,
            delete: true
        },
        specialRoleBadges: {
            'Call Operator': [
                { cssClass: 'perm-add', label: '➕ Add' },
                { cssClass: 'perm-view', label: '👁️ View' },
                { cssClass: 'perm-edit', label: '✏️ Edit' }
            ]
        },
        permBorderColor: '#00BCD4',
        permTitleColor: '#00BCD4',
        permSubtitle: '(Call Operators)',
        defaultPermsForRole: {
            'Call Operator': { add: true, view: true, selfView: true, edit: true }
        }
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
        accessDescription: 'Business reports, analytics සහ management insights. Day End, Employee, Stock Count, Purchasing සහ P/L reports.',
        badgeLabel: 'Management',
        badgeClass: 'badge-management',
        cardClass: 'reports-card',
        adminManagerOnly: true,
        accessChecks: [],
        customPermBadges: [
            { cssClass: 'perm-reports', label: '📊 View Reports' },
            { cssClass: 'perm-reports', label: '⏳ Approvals' },
            { cssClass: 'perm-reports', label: '📋 All Data' }
        ],
        permBorderColor: '#2196F3',
        permTitleColor: '#2196F3',
        permSubtitle: '(Admin/Manager only)',
        permEditLabel: '✏️ Edit / Approve'
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

function checkDBAccess(dbId, userOverride = null) {
    const user = userOverride || getCurrentUser();
    if (!user) return false;

    const database = getDatabaseById(dbId);
    if (!database) return false;

    // Admin can access everything
    if (user.access === 'Admin') return true;

    // Admin/Manager only DBs
    if (database.adminManagerOnly) {
        return user.access === 'Manager';
    }

    // Role-based auto access (example: Call Operator → Call Center)
    if (database.autoAccessRoles && database.autoAccessRoles.includes(user.access)) {
        return true;
    }

    // Permission-based access
    const permissions = user.permissions || {};
    const dbPerm = permissions[dbId] || {};
    const accessChecks = Array.isArray(database.accessChecks) && database.accessChecks.length
        ? database.accessChecks
        : ['view'];

    return accessChecks.some(key => dbPerm[key] === true);
}

function getAccessibleDatabases(userOverride = null) {
    const user = userOverride || getCurrentUser();
    if (!user) return [];
    return DATABASES.filter(db => checkDBAccess(db.id, user));
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
console.log('🔥 Firebase initialized successfully! (v10.3 Master)');
console.log('📊 Databases loaded:', DATABASES.length);