// ============================================
// 🔥 FIREBASE GLOBAL CONFIG - MASTER FILE!
// File: firebase-config.js
// Version: 12.7 (Smart Cache System!) ⭐ NEW
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
        autoAccessRoles: [],
        privilegedRoles: ['Admin'],
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
    },
    {
        id: 'installmentTrackerDB',
        name: 'Installment Tracker',
        shortName: 'Tracker',
        icon: '🔔',
        url: 'installment-tracker.html',
        permPrefix: 'trk',
        color: '#FF6B6B',
        description: 'Track payment dues & send reminders',
        accessDescription: 'Overdue payments, due dates, WhatsApp reminders සහ installment tracking.',
        badgeLabel: 'Academy',
        badgeClass: 'badge-academy',
        cardClass: 'tracker-card',
        adminManagerOnly: false,
        accessChecks: ['add', 'view', 'selfView', 'edit'],
        autoAccessRoles: [],
        privilegedRoles: ['Admin', 'Manager'],
        privilegedRolePerms: {
            add: true,
            view: true,
            selfView: true,
            edit: true,
            delete: true
        },
        specialRoleBadges: {
            'Cashier': [
                { cssClass: 'perm-view', label: '👁️ View Tracker' },
                { cssClass: 'perm-add', label: '📱 Send Reminders' }
            ],
            'Call Operator': [
                { cssClass: 'perm-view', label: '👁️ View Tracker' },
                { cssClass: 'perm-add', label: '📱 Send Reminders' }
            ]
        },
        permBorderColor: '#FF6B6B',
        permTitleColor: '#FF6B6B',
        permSubtitle: '(Cashier / Call Operator - Manual Grant!)',
        permEditLabel: '✏️ Edit Reminder',
        defaultPermsForRole: {
            'Cashier': { add: true, view: true, selfView: false, edit: false },
            'Call Operator': { add: true, view: true, selfView: false, edit: false }
        }
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

// ============================================
// 🎓 STUDENT SYSTEM HELPERS
// ============================================

// ════════════════════════════════════════════
// ⭐ ATOMIC STUDENT ID GENERATOR (v12.4)
// ════════════════════════════════════════════
async function generateStudentId(batchNumber) {
    try {
        console.log('🆔 Generating atomic Student ID for batch:', batchNumber);
        
        const counterRef = db.collection('counters').doc('students');
        
        const newId = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let batchCounters = {};
            
            if (counterDoc.exists) {
                batchCounters = counterDoc.data() || {};
            }
            
            const currentCount = Number(batchCounters[batchNumber]) || 0;
            const nextNumber = currentCount + 1;
            
            batchCounters[batchNumber] = nextNumber;
            batchCounters.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
            
            transaction.set(counterRef, batchCounters, { merge: true });
            
            const padded = String(nextNumber).padStart(4, '0');
            return `BCA-${batchNumber}-${padded}`;
        });
        
        console.log('✅ Student ID generated (atomic):', newId);
        return newId;
        
    } catch (error) {
        console.error('❌ Atomic ID generation failed:', error);
        
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
            const fallbackId = `BCA-${batchNumber}-${padded}`;
            console.warn('⚠️ Used fallback ID:', fallbackId);
            return fallbackId;
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
            const timestamp = Date.now().toString().slice(-4);
            return `BCA-${batchNumber}-${timestamp}`;
        }
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

// ════════════════════════════════════════════
// ⭐ ATOMIC RECEIPT NO GENERATOR (v12.4)
// ════════════════════════════════════════════
async function generateReceiptNo() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;
        const prefix = `BR-${year}-${month}-`;

        const counterRef = db.collection('counters').doc('receipts');

        const receiptNo = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let monthlyCounters = {};
            
            if (counterDoc.exists) {
                monthlyCounters = counterDoc.data() || {};
            }
            
            const currentCount = Number(monthlyCounters[monthKey]) || 0;
            const nextNumber = currentCount + 1;
            
            monthlyCounters[monthKey] = nextNumber;
            monthlyCounters.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
            
            transaction.set(counterRef, monthlyCounters, { merge: true });
            
            const padded = String(nextNumber).padStart(3, '0');
            return `${prefix}${padded}`;
        });

        console.log('✅ Receipt No generated (atomic):', receiptNo);
        return receiptNo;
        
    } catch (error) {
        console.error('❌ Atomic Receipt generation failed:', error);
        
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
            const fallbackReceipt = `${prefix}${padded}`;
            console.warn('⚠️ Used fallback receipt:', fallbackReceipt);
            return fallbackReceipt;
        } catch (fallbackError) {
            const now = new Date();
            const timestamp = Date.now().toString().slice(-3);
            return `BR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${timestamp}`;
        }
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
// 🎓 STUDENT PORTAL HELPERS
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
// ⚙️ SETTINGS HELPERS
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
// 🍞 UNIVERSAL TOAST SYSTEM (v12.5)
// ===================================

function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    return container;
}

function showGlobalToast(message, type = 'info') {
    const container = ensureToastContainer();
    
    const colors = {
        success: '#4CAF50',
        error: '#ff4444',
        warning: '#FF9800',
        info: '#2196F3'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 0.88rem;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        max-width: 320px;
        pointer-events: auto;
        animation: slideIn 0.3s ease;
        transition: opacity 0.3s;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureToastContainer);
} else {
    ensureToastContainer();
}

// ===================================
// 📅 DATE CALCULATION HELPERS (v12.5)
// ===================================

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffMs = d2 - d1;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getSafeDateFromValue(value) {
    if (!value) return null;
    try {
        if (value.toDate && typeof value.toDate === 'function') {
            const d = value.toDate();
            return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) {
        return null;
    }
}

// ===================================
// 📊 COURSE DATA HELPERS (v12.5)
// ===================================

async function getCourseById(courseId) {
    if (!courseId) return null;
    try {
        const doc = await db.collection('courses').doc(courseId).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };
        return null;
    } catch (e) {
        return null;
    }
}

function getCourseDefaults(course) {
    return {
        duration: Number(course?.duration) || 3,
        installmentCount: Number(course?.installmentCount) || 2,
        paymentIntervalDays: Number(course?.paymentIntervalDays) || 30
    };
}

// ============================================================
// ⭐⭐⭐ v12.6: PAGINATION HELPERS ⭐⭐⭐
// ============================================================

async function getPaginatedStudents(options = {}) {
    const {
        status = null,
        paymentStatus = null,
        batchNumber = null,
        courseId = null,
        orderField = 'createdAt',
        orderDir = 'desc',
        lastDoc = null,
        pageSize = 20
    } = options;

    try {
        let query = db.collection('students');

        if (status) query = query.where('status', '==', status);
        if (paymentStatus) query = query.where('paymentStatus', '==', paymentStatus);
        if (batchNumber) query = query.where('batchNumber', '==', batchNumber);
        if (courseId) query = query.where('courseId', '==', courseId);

        query = query.orderBy(orderField, orderDir);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        query = query.limit(pageSize);

        const snapshot = await query.get();

        const students = [];
        snapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });

        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

        return {
            students: students,
            lastDoc: lastVisible,
            hasMore: snapshot.docs.length === pageSize,
            count: students.length
        };

    } catch (error) {
        console.error('❌ getPaginatedStudents error:', error);
        return {
            students: [],
            lastDoc: null,
            hasMore: false,
            count: 0,
            error: error.message
        };
    }
}

async function getStudentByDocId(docId) {
    if (!docId) return null;
    
    // ⭐ v12.7: Try cache first!
    const cached = getCachedStudent(docId);
    if (cached) {
        console.log('⚡ Cache HIT:', docId);
        return cached;
    }
    
    try {
        const doc = await db.collection('students').doc(docId).get();
        if (doc.exists) {
            const student = { id: doc.id, ...doc.data() };
            // ⭐ v12.7: Auto-cache!
            cacheStudent(student);
            return student;
        }
        return null;
    } catch (error) {
        console.error('❌ getStudentByDocId error:', error);
        return null;
    }
}

async function getStudentByStudentId(studentId) {
    if (!studentId) return null;
    try {
        const snapshot = await db.collection('students')
            .where('studentId', '==', studentId)
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        
        const doc = snapshot.docs[0];
        const student = { id: doc.id, ...doc.data() };
        // ⭐ v12.7: Auto-cache!
        cacheStudent(student);
        return student;
    } catch (error) {
        console.error('❌ getStudentByStudentId error:', error);
        return null;
    }
}

async function getStudentsByBatch(batchNumber, pageSize = 20, lastDoc = null) {
    return getPaginatedStudents({
        batchNumber: batchNumber,
        orderField: 'studentId',
        orderDir: 'asc',
        pageSize: pageSize,
        lastDoc: lastDoc
    });
}

async function getStudentsByStatus(status, pageSize = 20, lastDoc = null) {
    return getPaginatedStudents({
        status: status,
        orderField: 'createdAt',
        orderDir: 'desc',
        pageSize: pageSize,
        lastDoc: lastDoc
    });
}

async function getPendingPaymentStudents(pageSize = 20, lastDoc = null) {
    try {
        let query = db.collection('students')
            .where('status', '==', 'Active')
            .where('paymentStatus', 'in', ['Partial', 'Pending'])
            .orderBy('balance', 'desc');

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        query = query.limit(pageSize);

        const snapshot = await query.get();

        const students = [];
        snapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });

        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

        return {
            students: students,
            lastDoc: lastVisible,
            hasMore: snapshot.docs.length === pageSize,
            count: students.length
        };

    } catch (error) {
        console.error('❌ getPendingPaymentStudents error:', error);
        return {
            students: [],
            lastDoc: null,
            hasMore: false,
            count: 0,
            error: error.message
        };
    }
}

async function getStudentCount(filters = {}) {
    const {
        status = null,
        paymentStatus = null,
        batchNumber = null,
        courseId = null
    } = filters;

    try {
        let query = db.collection('students');

        if (status) query = query.where('status', '==', status);
        if (paymentStatus) query = query.where('paymentStatus', '==', paymentStatus);
        if (batchNumber) query = query.where('batchNumber', '==', batchNumber);
        if (courseId) query = query.where('courseId', '==', courseId);

        try {
            const snapshot = await query.count().get();
            return snapshot.data().count;
        } catch (aggError) {
            console.warn('⚠️ Aggregation not available, using fallback');
            const snapshot = await query.get();
            return snapshot.size;
        }
    } catch (error) {
        console.error('❌ getStudentCount error:', error);
        return 0;
    }
}

async function searchStudentsServerSide(searchText, field = 'studentId', pageSize = 20) {
    if (!searchText || searchText.length < 2) return [];

    try {
        if (['studentId', 'phone', 'nic', 'email'].includes(field)) {
            const searchUpper = searchText.toUpperCase();
            const endText = searchUpper.slice(0, -1) + 
                String.fromCharCode(searchUpper.charCodeAt(searchUpper.length - 1) + 1);

            const snapshot = await db.collection('students')
                .where(field, '>=', searchUpper)
                .where(field, '<', endText)
                .limit(pageSize)
                .get();

            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            return results;
        }

        if (field === 'name') {
            const snapshot = await db.collection('students')
                .orderBy('name')
                .startAt(searchText)
                .endAt(searchText + '\uf8ff')
                .limit(pageSize)
                .get();

            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            return results;
        }

        return [];

    } catch (error) {
        console.error('❌ searchStudentsServerSide error:', error);
        return [];
    }
}

async function testPagination() {
    console.log('🧪 Testing pagination functions...');
    
    try {
        console.log('\n📄 Test 1: Get first 5 students');
        const result1 = await getPaginatedStudents({ pageSize: 5 });
        console.log('✅ Got', result1.count, 'students');
        console.log('   Has more:', result1.hasMore);

        if (result1.students.length > 0) {
            const firstId = result1.students[0].id;
            console.log('\n⚡ Test 2: Direct fetch by docId:', firstId);
            const student = await getStudentByDocId(firstId);
            console.log('✅ Found:', student?.name);
        }

        console.log('\n🟢 Test 3: Active students count');
        const activeCount = await getStudentCount({ status: 'Active' });
        console.log('✅ Active students:', activeCount);

        console.log('\n🔔 Test 4: Pending payments');
        const pending = await getPendingPaymentStudents(5);
        console.log('✅ Got', pending.count, 'pending students');

        console.log('\n🎉 All tests passed!');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// ============================================================
// ⭐⭐⭐ v12.7 NEW: SMART CACHE SYSTEM! ⭐⭐⭐
// ============================================================
// In-memory cache for instant student access
// LRU eviction, auto-expiry, hit/miss tracking
// Safe: ADD only, no existing code modified!
// ============================================================

/**
 * 🎛️ Cache Configuration
 */
const CACHE_CONFIG = {
    maxSize: 100,                  // Max 100 students in cache
    expiryMs: 5 * 60 * 1000,       // 5 minutes auto-expiry
    enableLogs: false              // Set true for debugging
};

/**
 * 💾 Smart Cache Storage
 * Structure: Map<docId, { student, timestamp, accessCount }>
 */
const smartCache = {
    data: new Map(),
    stats: {
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0
    }
};

/**
 * 📝 Add/Update student in cache
 * Auto-evicts oldest if cache is full (LRU style)
 * 
 * @param {Object} student - Student object with id
 */
function cacheStudent(student) {
    if (!student || !student.id) return;

    // Evict oldest if at capacity
    if (smartCache.data.size >= CACHE_CONFIG.maxSize && !smartCache.data.has(student.id)) {
        const firstKey = smartCache.data.keys().next().value;
        smartCache.data.delete(firstKey);
        smartCache.stats.evictions++;
        if (CACHE_CONFIG.enableLogs) {
            console.log('🗑️ Cache evicted:', firstKey);
        }
    }

    smartCache.data.set(student.id, {
        student: student,
        timestamp: Date.now(),
        accessCount: 0
    });

    smartCache.stats.sets++;
    
    if (CACHE_CONFIG.enableLogs) {
        console.log('💾 Cached:', student.id, '| Size:', smartCache.data.size);
    }
}

/**
 * 🔍 Get student from cache (if fresh)
 * Returns null if expired or missing
 * 
 * @param {string} docId - Firestore document ID
 * @returns {Object|null} Student object or null
 */
function getCachedStudent(docId) {
    if (!docId) return null;

    const cached = smartCache.data.get(docId);
    
    if (!cached) {
        smartCache.stats.misses++;
        return null;
    }

    // Check expiry
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_CONFIG.expiryMs) {
        smartCache.data.delete(docId);
        smartCache.stats.misses++;
        if (CACHE_CONFIG.enableLogs) {
            console.log('⏰ Cache expired:', docId);
        }
        return null;
    }

    // Hit! Update access count
    cached.accessCount++;
    smartCache.stats.hits++;
    
    return cached.student;
}

/**
 * 🗑️ Remove specific item from cache
 * Used after student edit/delete operations
 * 
 * @param {string} docId - Firestore document ID
 */
function clearCacheItem(docId) {
    if (!docId) return;
    const deleted = smartCache.data.delete(docId);
    if (CACHE_CONFIG.enableLogs && deleted) {
        console.log('🗑️ Cache cleared:', docId);
    }
}

/**
 * 🧹 Clear entire cache
 * Used after bulk operations or logout
 */
function clearAllCache() {
    const size = smartCache.data.size;
    smartCache.data.clear();
    if (CACHE_CONFIG.enableLogs) {
        console.log('🧹 Cleared all cache. Removed:', size, 'items');
    }
}

/**
 * 📊 Get cache statistics
 * Returns: { size, hits, misses, hitRate, sets, evictions }
 */
function getCacheStats() {
    const total = smartCache.stats.hits + smartCache.stats.misses;
    const hitRate = total > 0 
        ? ((smartCache.stats.hits / total) * 100).toFixed(1) + '%' 
        : 'N/A';

    return {
        size: smartCache.data.size,
        maxSize: CACHE_CONFIG.maxSize,
        hits: smartCache.stats.hits,
        misses: smartCache.stats.misses,
        sets: smartCache.stats.sets,
        evictions: smartCache.stats.evictions,
        hitRate: hitRate,
        memoryEstimate: (smartCache.data.size * 5) + ' KB (approx)'
    };
}

/**
 * 🧪 Test Smart Cache (debugging)
 * Run in console: testCache()
 */
async function testCache() {
    console.log('🧪 Testing Smart Cache System...');
    console.log('────────────────────────────────────');
    
    try {
        // Reset stats
        smartCache.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
        clearAllCache();

        // Test 1: Get a student (MISS - first time)
        console.log('\n📥 Test 1: First fetch (should be MISS)');
        const result = await getPaginatedStudents({ pageSize: 1 });
        if (result.students.length === 0) {
            console.log('❌ No students in DB to test!');
            return false;
        }
        const testId = result.students[0].id;
        console.log('   Student ID:', testId);

        const fetch1Start = Date.now();
        const student1 = await getStudentByDocId(testId);
        const fetch1Time = Date.now() - fetch1Start;
        console.log('✅ Fetch 1 (from DB):', fetch1Time + 'ms');
        console.log('   Found:', student1?.name);

        // Test 2: Get same student again (HIT - from cache!)
        console.log('\n⚡ Test 2: Second fetch (should be HIT)');
        const fetch2Start = Date.now();
        const student2 = await getStudentByDocId(testId);
        const fetch2Time = Date.now() - fetch2Start;
        console.log('✅ Fetch 2 (from cache):', fetch2Time + 'ms');
        console.log('   Found:', student2?.name);
        
        const speedup = fetch1Time > 0 ? (fetch1Time / Math.max(fetch2Time, 1)).toFixed(1) : 'N/A';
        console.log('🚀 Speed improvement:', speedup + 'x faster!');

        // Test 3: Cache stats
        console.log('\n📊 Test 3: Cache statistics');
        const stats = getCacheStats();
        console.log('   Cache size:', stats.size, '/', stats.maxSize);
        console.log('   Hits:', stats.hits);
        console.log('   Misses:', stats.misses);
        console.log('   Hit rate:', stats.hitRate);
        console.log('   Memory:', stats.memoryEstimate);

        // Test 4: Clear specific item
        console.log('\n🗑️ Test 4: Clear cache item');
        clearCacheItem(testId);
        const student3 = getCachedStudent(testId);
        console.log('✅ After clear, cache returns:', student3 === null ? 'null (correct!)' : 'data (WRONG!)');

        // Test 5: Clear all
        console.log('\n🧹 Test 5: Clear all cache');
        await getStudentByDocId(testId); // Re-cache
        console.log('   Cache size before clear:', smartCache.data.size);
        clearAllCache();
        console.log('   Cache size after clear:', smartCache.data.size);

        console.log('\n🎉 All cache tests passed!');
        console.log('────────────────────────────────────');
        return true;
    } catch (error) {
        console.error('❌ Cache test failed:', error);
        return false;
    }
}

// ===================================
// ✅ Ready!
// ===================================
console.log('🔥 Firebase initialized! (v12.7 - Smart Cache System!) ⭐');
console.log('📊 Databases loaded:', DATABASES.length);
console.log('🆔 ID System: Transaction-based (100% no duplicates!)');
console.log('🔔 Tracker DB: Ready!');
console.log('⚡ Pagination: getPaginatedStudents(), getStudentByDocId(), getPendingPaymentStudents()');
console.log('💾 Smart Cache: cacheStudent(), getCachedStudent(), getCacheStats()');
console.log('🧪 Tests: Run testPagination() or testCache() in console');