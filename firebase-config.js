// ============================================
// 🔥 FIREBASE GLOBAL CONFIG - MASTER FILE!
// File: firebase-config.js
// Version: 12.3 (Student DB Restricted - Admin Only!) ⭐ NEW
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
        accessDescription: 'Business reports, analytics සහ management insights.',
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
    },
    // ═══════════════════════════════════════════════════
    // ⭐ UPDATED v12.3 - STUDENT DATABASE
    // 🔒 RESTRICTED ACCESS - Admin Only Auto!
    // Manager/Cashier/Call Op → Need MANUAL permission!
    // ═══════════════════════════════════════════════════
    {
        id: 'studentDB',
        name: 'Student Database',
        shortName: 'Students',
        icon: '🎓',
        url: 'student-management.html',
        permPrefix: 'std',
        color: '#9C27B0',
        description: 'Students, payments & batches',
        accessDescription: 'Student profiles, payment history, batch management සහ student records. 🔒 Restricted access!',
        badgeLabel: 'Academy',
        badgeClass: 'badge-academy',
        cardClass: 'student-card',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'selfView', 'edit'],
        autoAccessRoles: [],  // ⚠️ NO auto access - Admin must grant manually!
        privilegedRoles: ['Admin'],  // Only Admin auto-access
        privilegedRolePerms: {
            add: true,
            view: true,
            selfView: true,
            edit: true,
            delete: true
        },
        specialRoleBadges: {
            'Manager': [
                { cssClass: 'perm-view', label: '👁️ View Students' },
                { cssClass: 'perm-edit', label: '✏️ Edit Details' }
            ],
            'Cashier': [
                { cssClass: 'perm-view', label: '👁️ View Only' }
            ],
            'Call Operator': [
                { cssClass: 'perm-view', label: '👁️ View Only' }
            ]
        },
        permBorderColor: '#9C27B0',
        permTitleColor: '#9C27B0',
        permSubtitle: '(🔒 Admin only - Manager/Staff need MANUAL grant!)',
        permEditLabel: '✏️ Edit Student',
        defaultPermsForRole: {
            'Manager': { add: false, view: false, selfView: false, edit: false },
            'Cashier': { add: false, view: false, selfView: false, edit: false },
            'Call Operator': { add: false, view: false, selfView: false, edit: false }
        }
    },
    {
        id: 'paymentDB',
        name: 'Payment Processing',
        shortName: 'Payment',
        icon: '💳',
        url: 'payment.html',
        permPrefix: 'pay',
        color: '#4CAF50',
        description: 'Process student payments & receipts',
        accessDescription: 'Quick payment processing, auto Student ID generation, receipt printing සහ WhatsApp delivery.',
        badgeLabel: 'Quick Pay',
        badgeClass: 'badge-payment',
        cardClass: 'payment-card',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'edit'],
        autoAccessRoles: [],
        privilegedRoles: ['Admin', 'Manager'],
        privilegedRolePerms: {
            add: true,
            view: true,
            edit: true
        },
        specialRoleBadges: {
            'Cashier': [
                { cssClass: 'perm-add', label: '💰 Process Payment' },
                { cssClass: 'perm-view', label: '🧾 View Receipts' }
            ],
            'Call Operator': [
                { cssClass: 'perm-add', label: '💰 Process Payment' },
                { cssClass: 'perm-view', label: '🧾 View Receipts' }
            ]
        },
        permBorderColor: '#4CAF50',
        permTitleColor: '#4CAF50',
        permSubtitle: '(Cashier / Call Operator - Manual Grant!)',
        permEditLabel: '✏️ Edit Payment',
        defaultPermsForRole: {
            'Cashier': { add: true, view: true, selfView: false, edit: false },
            'Call Operator': { add: true, view: true, selfView: false, edit: false }
        }
    },
    {
        id: 'settingsDB',
        name: 'System Settings',
        shortName: 'Settings',
        icon: '⚙️',
        url: 'settings.html',
        permPrefix: 'set',
        color: '#607D8B',
        description: 'Business config & templates',
        accessDescription: 'Business information, payment methods, discount codes, WhatsApp templates සහ academy configuration.',
        badgeLabel: 'System',
        badgeClass: 'badge-system',
        cardClass: 'settings-db-card',
        adminManagerOnly: true,
        accessChecks: [],
        customPermBadges: [
            { cssClass: 'perm-settings', label: '⚙️ Configure System' },
            { cssClass: 'perm-settings', label: '💼 Business Info' },
            { cssClass: 'perm-settings', label: '📱 WhatsApp Templates' }
        ],
        permBorderColor: '#607D8B',
        permTitleColor: '#607D8B',
        permSubtitle: '(Admin/Manager only)',
        permEditLabel: '⚙️ Configure'
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

    if (user.access === 'Admin') return true;

    if (database.adminManagerOnly) {
        return user.access === 'Manager';
    }

    if (database.autoAccessRoles && database.autoAccessRoles.includes(user.access)) {
        return true;
    }

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
                    <span class="user-name">👤 ${user.nickname || user.name}</span>
                    <span class="user-role">${user.access}</span>
                </div>
                <button class="btn-logout" onclick="logout()">🚪 Logout</button>
            </div>
        </div>
    `;
}

// ===================================
// ⭐ BUILD DATABASE SWITCHER
// ===================================

function buildDatabaseSwitcher(currentDbId) {
    const accessibleDbs = getAccessibleDatabases();

    if (accessibleDbs.length <= 1) return '';

    let optionsHTML = '';
    accessibleDbs.forEach(database => {
        if (database.id === currentDbId) return;
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
// ⭐ INIT PAGE (All-in-one!)
// ===================================

function initPage(dbId, allowedAccess) {
    const user = checkAuth();
    if (!user) return null;

    if (allowedAccess && !allowedAccess.includes(user.access)) {
        alert('⛔ You do not have permission to access this page!');
        window.location.href = 'access.html';
        return null;
    }

    if (dbId && !checkDBAccess(dbId)) {
        alert('⛔ You do not have permission for this database!');
        window.location.href = 'access.html';
        return null;
    }

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
        year: 'numeric', month: 'short', day: '2-digit'
    });
}

function formatTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
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
// 🎓 STUDENT SYSTEM HELPERS
// ===================================

async function generateStudentId(batchNumber) {
    try {
        const snap = await db.collection('students')
            .where('batchNumber', '==', batchNumber)
            .orderBy('studentId', 'desc')
            .limit(1)
            .get();

        let nextNumber = 1;
        if (!snap.empty) {
            const lastId = snap.docs[0].data().studentId;
            const parts = lastId.split('-');
            const lastNum = parseInt(parts[2]) || 0;
            nextNumber = lastNum + 1;
        }

        const padded = String(nextNumber).padStart(4, '0');
        return `BCA-${batchNumber}-${padded}`;
    } catch (error) {
        console.error('Error generating Student ID:', error);
        return `BCA-${batchNumber}-0001`;
    }
}

function generateStudentPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pwd = 'buono@';
    for (let i = 0; i < 6; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
}

async function generateReceiptNo() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `BR-${year}-${month}-`;

        const snap = await db.collection('students').get();
        let monthlyCount = 0;

        snap.forEach(doc => {
            const payments = doc.data().payments || [];
            payments.forEach(p => {
                if (p.receiptNo && p.receiptNo.startsWith(prefix)) {
                    monthlyCount++;
                }
            });
        });

        const nextNum = monthlyCount + 1;
        const padded = String(nextNum).padStart(3, '0');
        return `${prefix}${padded}`;
    } catch (error) {
        console.error('Error generating Receipt No:', error);
        const now = new Date();
        return `BR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-001`;
    }
}

function isStudentLogin(username) {
    return username && username.toUpperCase().startsWith('BCA-');
}

async function getCurrentBatch() {
    try {
        const doc = await db.collection('settings').doc('academy').get();
        if (doc.exists) {
            return doc.data().currentBatch || 'W1';
        }
        return 'W1';
    } catch (error) {
        return 'W1';
    }
}

// ===================================
// 🎓 STUDENT PORTAL HELPERS (v12.3 NEW!)
// ===================================

function getCurrentStudent() {
    const student = sessionStorage.getItem('loggedInStudent');
    return student ? JSON.parse(student) : null;
}

function checkStudentAuth() {
    const student = getCurrentStudent();
    if (!student) {
        window.location.href = 'login.html';
        return null;
    }
    return student;
}

function studentLogout() {
    if (confirm('🚪 Logout කරන්න ඕනද?')) {
        sessionStorage.removeItem('loggedInStudent');
        window.location.href = 'login.html';
    }
}

// ===================================
// ⚙️ SETTINGS HELPERS (v12.0)
// ===================================

async function getSystemSettings() {
    try {
        const doc = await db.collection('settings').doc('academy').get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (error) {
        console.error('Error loading settings:', error);
        return null;
    }
}

async function getSetting(key, defaultValue = null) {
    try {
        const settings = await getSystemSettings();
        return settings && settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

// ===================================
// 📊 TABLE HELPERS
// ===================================

function showTableLoading(tbodyId, cols = 5) {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${cols}" style="text-align:center;padding:20px;color:#888;">
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
                <td colspan="${cols}" style="text-align:center;padding:20px;color:#888;">
                    📭 ${message}
                </td>
            </tr>`;
    }
}

// ===================================
// ✅ Ready!
// ===================================
console.log('🔥 Firebase initialized! (v12.3 - Student DB Restricted + Portal Helpers!) ⭐');
console.log('📊 Databases loaded:', DATABASES.length);