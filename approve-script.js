/* ═══════════════════════════════════════════════════════════
   ☕ BUONO APPROVALS - SCRIPT
   File: approve-script.js
   Version: 2.1 (DATABASES conflict fixed)
   ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────
// 🗄️ DATABASE LIST (uses global DATABASES if available)
// ─────────────────────────────────────────
const APPROVE_DATABASES = (typeof DATABASES !== 'undefined' && Array.isArray(DATABASES))
    ? DATABASES.map(d => ({
        id: d.id || d.collection || d.name,
        shortName: d.shortName || d.name || d.id,
        icon: d.icon || '📁'
    }))
    : [
        { id: 'employeeDB',           shortName: 'Employee DB',    icon: '👥' },
        { id: 'dayEndReportDB',       shortName: 'Day End Report', icon: '📊' },
        { id: 'inventoryDB',          shortName: 'Inventory',      icon: '📦' },
        { id: 'kitchenDB',            shortName: 'Kitchen',        icon: '🍳' },
        { id: 'purchasingDB',         shortName: 'Purchasing',     icon: '🛒' },
        { id: 'callCenterDB',         shortName: 'Call Center',    icon: '📞' },
        { id: 'reportsDB',            shortName: 'Reports',        icon: '📈' },
        { id: 'studentDB',            shortName: 'Student DB',     icon: '🎓' },
        { id: 'paymentDB',            shortName: 'Payment',        icon: '💳' },
        { id: 'settingsDB',           shortName: 'Settings',       icon: '⚙️' },
        { id: 'installmentTrackerDB', shortName: 'Installment',    icon: '📅' }
    ];

// ─────────────────────────────────────────
// 🏷️ ROLE PERMISSIONS
// ─────────────────────────────────────────
const ROLE_PERMISSIONS = {
    'Admin': {
        employeeDB:           { add: true, view: true, selfView: true, edit: true, delete: true },
        dayEndReportDB:       { add: true, view: true, selfView: true, edit: true, delete: true },
        inventoryDB:          { add: true, view: true, selfView: true, edit: true, delete: true },
        kitchenDB:            { add: true, view: true, selfView: true, edit: true, delete: true },
        purchasingDB:         { add: true, view: true, selfView: true, edit: true, delete: true },
        callCenterDB:         { add: true, view: true, selfView: true, edit: true, delete: true },
        reportsDB:            { add: true, view: true, selfView: true, edit: true, delete: true },
        studentDB:            { add: true, view: true, selfView: true, edit: true, delete: true },
        paymentDB:            { add: true, view: true, selfView: true, edit: true, delete: true },
        settingsDB:           { add: true, view: true, selfView: true, edit: true, delete: true },
        installmentTrackerDB: { add: true, view: true, selfView: true, edit: true, delete: true }
    },
    'Manager': {
        employeeDB:           { add: true,  view: true, selfView: true, edit: true,  delete: false },
        dayEndReportDB:       { add: true,  view: true, selfView: true, edit: true,  delete: false },
        inventoryDB:          { add: true,  view: true, selfView: true, edit: true,  delete: false },
        kitchenDB:            { add: true,  view: true, selfView: true, edit: true,  delete: false },
        purchasingDB:         { add: true,  view: true, selfView: true, edit: true,  delete: false },
        callCenterDB:         { add: true,  view: true, selfView: true, edit: true,  delete: false },
        reportsDB:            { view: true },
        studentDB:            { view: true, edit: true },
        paymentDB:            { add: true,  view: true, edit: true },
        settingsDB:           { view: true },
        installmentTrackerDB: { add: true,  view: true, edit: true }
    },
    'Cashier': {
        dayEndReportDB:       { add: true,  view: true, selfView: true, edit: false, delete: false },
        paymentDB:            { add: true,  view: true, selfView: false, edit: false, delete: false },
        studentDB:            { view: true },
        installmentTrackerDB: { add: true,  view: true, edit: false }
    },
    'Purchasing Officer': {
        purchasingDB:         { add: true,  view: true, selfView: true, edit: true, delete: false },
        inventoryDB:          { add: true,  view: true, selfView: true, edit: true, delete: false }
    },
    'Head Chef': {
        kitchenDB:            { add: true,  view: true, selfView: true, edit: true, delete: false },
        inventoryDB:          { view: true, selfView: true },
        purchasingDB:         { view: true }
    },
    'Call Operator': {
        callCenterDB:         { add: true,  view: true, selfView: true, edit: true, delete: false },
        paymentDB:            { add: true,  view: true, edit: false },
        studentDB:            { view: true },
        installmentTrackerDB: { add: true,  view: true, edit: false }
    },
    'Waiter': {
        kitchenDB:            { selfView: true }
    }
};

// ─────────────────────────────────────────
// 🚀 MAIN INIT (Buono Loader pattern)
// ─────────────────────────────────────────
window.initApprovePage = function() {
    'use strict';

    const startTime = performance.now();
    console.log('☕ [APPROVE] Initializing v2.1...');

    // ─────────────────────────────────────
    // 🎯 STATE
    // ─────────────────────────────────────
    const state = {
        currentUser:      null,
        activeTab:        'employees',
        activeFilter:     'all',
        searchQuery:      '',
        pendingEmployees: [],
        pendingStudents:  [],
        selectedUser:     null,
        unsubscribers:    [],
        customPermsMode:  false
    };

    // ─────────────────────────────────────
    // 🌐 DOM CACHE
    // ─────────────────────────────────────
    const el = {
        pageLoader:    document.getElementById('pageLoader'),
        mainContent:   document.getElementById('mainContent'),
        userName:      document.getElementById('userName'),

        // Stats
        empCount:      document.getElementById('empCount'),
        stdCount:      document.getElementById('stdCount'),
        totalCount:    document.getElementById('totalCount'),
        todayCount:    document.getElementById('todayCount'),
        tabBadgeEmp:   document.getElementById('tabBadgeEmp'),
        tabBadgeStd:   document.getElementById('tabBadgeStd'),

        // Search & Filter
        searchInput:   document.getElementById('searchInput'),
        searchClear:   document.getElementById('searchClear'),

        // Lists
        employeesList: document.getElementById('employeesList'),
        studentsList:  document.getElementById('studentsList'),
        tabEmployees:  document.getElementById('tabEmployees'),
        tabStudents:   document.getElementById('tabStudents'),

        // View Modal
        viewModal:          document.getElementById('viewModal'),
        viewModalIcon:      document.getElementById('viewModalIcon'),
        viewModalTitle:     document.getElementById('viewModalTitle'),
        viewModalBody:      document.getElementById('viewModalBody'),

        // Approve Employee Modal
        approveEmpModal:        document.getElementById('approveEmpModal'),
        approveEmpInfo:         document.getElementById('approveEmpInfo'),
        roleSelect:             document.getElementById('roleSelect'),
        permissionsPreview:     document.getElementById('permissionsPreview'),
        permissionsGrid:        document.getElementById('permissionsGrid'),
        customizeBtnText:       document.getElementById('customizeBtnText'),
        customPermsPanel:       document.getElementById('customPermsPanel'),
        customPermsList:        document.getElementById('customPermsList'),
        confirmApproveEmpBtn:   document.getElementById('confirmApproveEmpBtn'),

        // Approve Student Modal
        approveStdModal:  document.getElementById('approveStdModal'),
        approveStdInfo:   document.getElementById('approveStdInfo'),

        // Reject Modal
        rejectModal:       document.getElementById('rejectModal'),
        rejectUserInfo:    document.getElementById('rejectUserInfo'),
        rejectReason:      document.getElementById('rejectReason'),
        reasonCharCount:   document.getElementById('reasonCharCount'),
        confirmRejectBtn:  document.getElementById('confirmRejectBtn'),

        // Toast
        toast:        document.getElementById('toast'),
        toastIcon:    document.getElementById('toastIcon'),
        toastMessage: document.getElementById('toastMessage')
    };

    // ─────────────────────────────────────
    // 🍞 TOAST
    // ─────────────────────────────────────
    function showToast(message, type = 'info') {
        const icons = {
            success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️'
        };
        el.toast.className = `toast ${type} active`;
        el.toastIcon.textContent = icons[type] || icons.info;
        el.toastMessage.textContent = message;
        setTimeout(() => el.toast.classList.remove('active'), 4000);
    }

    // ─────────────────────────────────────
    // 🔓 HIDE LOADER
    // ─────────────────────────────────────
    function hidePageLoader() {
        // 1. Reveal body
        document.body.classList.add('buono-ready');

        // 2. Hide loader after short delay
        setTimeout(() => {
            if (el.pageLoader) el.pageLoader.classList.add('hidden');
        }, 400);
    }

    // ─────────────────────────────────────
    // 🔐 AUTH CHECK
    // ─────────────────────────────────────
    function checkAdminAuth() {
        const user = getCurrentUser();

        if (!user) {
            console.warn('⚠️ [APPROVE] Not logged in');
            window.location.href = 'login.html';
            return false;
        }

        if (user.access !== 'Admin') {
            console.warn('⛔ [APPROVE] Not admin, access denied');
            alert('⛔ Admin access required!');
            window.location.href = 'access.html';
            return false;
        }

        state.currentUser = user;
        console.log('✅ [APPROVE] Admin authenticated:', user.name || user.nickname);
        return true;
    }

    // ─────────────────────────────────────
    // 🔥 WAIT FOR FIREBASE
    // ─────────────────────────────────────
    function waitForFirebase(callback, retries = 0) {
        if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
            callback();
            return;
        }
        if (retries > 50) {
            console.error('❌ [APPROVE] Firebase not loaded!');
            showToast('Firebase connection failed', 'error');
            return;
        }
        setTimeout(() => waitForFirebase(callback, retries + 1), 100);
    }

    // ─────────────────────────────────────
    // 🚀 SETUP
    // ─────────────────────────────────────
    function setup() {
        if (!checkAdminAuth()) {
            hidePageLoader();
            return;
        }

        el.userName.textContent = 
            state.currentUser.name || 
            state.currentUser.nickname || 
            'Admin';

        attachEventListeners();
        startRealtimeListeners();
        hidePageLoader();

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`✅ [APPROVE] Ready! (${elapsed}ms)`);
    }

    // ─────────────────────────────────────
    // 📡 REAL-TIME LISTENERS
    // ─────────────────────────────────────
    function startRealtimeListeners() {
        // Employees
        const empUnsub = db.collection('employees')
            .where('approvalStatus', '==', 'pending')
            .onSnapshot(snapshot => {
                const wasEmpty = state.pendingEmployees.length === 0;
                state.pendingEmployees = [];
                snapshot.forEach(doc => {
                    state.pendingEmployees.push({ id: doc.id, ...doc.data() });
                });
                state.pendingEmployees.sort((a, b) => 
                    getDate(b.signupDate) - getDate(a.signupDate)
                );
                if (!wasEmpty && snapshot.docChanges().some(c => c.type === 'added')) {
                    showToast('🔔 New employee signup!', 'info');
                }
                updateStats();
                renderEmployees();
            }, err => {
                console.error('❌ [APPROVE] Employees error:', err);
                showToast('Failed to load employees', 'error');
            });

        state.unsubscribers.push(empUnsub);

        // Students
        const stdUnsub = db.collection('students')
            .where('approvalStatus', '==', 'pending')
            .onSnapshot(snapshot => {
                const wasEmpty = state.pendingStudents.length === 0;
                state.pendingStudents = [];
                snapshot.forEach(doc => {
                    state.pendingStudents.push({ id: doc.id, ...doc.data() });
                });
                state.pendingStudents.sort((a, b) => 
                    getDate(b.signupDate) - getDate(a.signupDate)
                );
                if (!wasEmpty && snapshot.docChanges().some(c => c.type === 'added')) {
                    showToast('🔔 New student signup!', 'info');
                }
                updateStats();
                renderStudents();
            }, err => {
                console.error('❌ [APPROVE] Students error:', err);
                showToast('Failed to load students', 'error');
            });

        state.unsubscribers.push(stdUnsub);
    }

    // ─────────────────────────────────────
    // 📊 STATS
    // ─────────────────────────────────────
    function updateStats() {
        const empCount = state.pendingEmployees.length;
        const stdCount = state.pendingStudents.length;
        const total    = empCount + stdCount;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCount = [...state.pendingEmployees, ...state.pendingStudents]
            .filter(u => {
                const d = getDate(u.signupDate);
                return d && d >= today;
            }).length;

        el.empCount.textContent   = empCount;
        el.stdCount.textContent   = stdCount;
        el.totalCount.textContent = total;
        el.todayCount.textContent = todayCount;
        el.tabBadgeEmp.textContent = empCount;
        el.tabBadgeStd.textContent = stdCount;
    }

    // ─────────────────────────────────────
    // 🔍 FILTERS
    // ─────────────────────────────────────
    function applyFilters(users) {
        let filtered = [...users];

        if (state.activeFilter === 'verified') {
            filtered = filtered.filter(u => u.emailVerified);
        } else if (state.activeFilter === 'unverified') {
            filtered = filtered.filter(u => !u.emailVerified);
        }

        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                (u.name     || '').toLowerCase().includes(q) ||
                (u.email    || '').toLowerCase().includes(q) ||
                (u.phone    || '').toLowerCase().includes(q) ||
                (u.nickname || '').toLowerCase().includes(q) ||
                (u.nic      || '').toLowerCase().includes(q)
            );
        }

        return filtered;
    }

    // ─────────────────────────────────────
    // 🎨 RENDER CARDS
    // ─────────────────────────────────────
    function renderEmployees() {
        const filtered = applyFilters(state.pendingEmployees);
        el.employeesList.innerHTML = filtered.length
            ? filtered.map(e => renderCard(e, 'employee')).join('')
            : renderEmpty('employees');
    }

    function renderStudents() {
        const filtered = applyFilters(state.pendingStudents);
        el.studentsList.innerHTML = filtered.length
            ? filtered.map(s => renderCard(s, 'student')).join('')
            : renderEmpty('students');
    }

    function renderCard(user, type) {
        const isEmp   = type === 'employee';
        const avatar  = (user.name || 'U').charAt(0).toUpperCase();
        const timeAgo = getTimeAgo(getDate(user.signupDate));

        const badges = [];
        if (isEmp) {
            badges.push('<span class="badge badge-employee">👔 Employee</span>');
            if (user.signupPromoCode) {
                badges.push(`<span class="badge badge-promo">🎫 ${esc(user.signupPromoCode)}</span>`);
            }
        } else {
            badges.push('<span class="badge badge-student">🎓 Student</span>');
        }
        badges.push(user.emailVerified
            ? '<span class="badge badge-verified">✅ Verified</span>'
            : '<span class="badge badge-unverified">⚠️ Unverified</span>'
        );

        return `
            <div class="user-card type-${type}">
                <div class="user-card-header">
                    <div class="user-avatar">${avatar}</div>
                    <div class="user-card-badges">${badges.join('')}</div>
                </div>

                <div class="user-card-name">${esc(user.name || 'Unnamed')}</div>

                <div class="user-card-info">
                    <div class="user-info-item">
                        <span class="icon">📧</span>
                        <span class="value">${esc(user.email || 'No email')}</span>
                    </div>
                    <div class="user-info-item">
                        <span class="icon">📱</span>
                        <span class="value">${esc(user.phone || 'No phone')}</span>
                    </div>
                    ${isEmp && user.nickname ? `
                    <div class="user-info-item">
                        <span class="icon">👤</span>
                        <span class="value">@${esc(user.nickname)}</span>
                    </div>` : ''}
                    ${!isEmp && user.nic ? `
                    <div class="user-info-item">
                        <span class="icon">🆔</span>
                        <span class="value">${esc(user.nic)}</span>
                    </div>` : ''}
                </div>

                <div class="user-card-meta">
                    <span>📅 Applied: ${timeAgo}</span>
                    <span>${user.hearAboutUs ? '📢 ' + esc(user.hearAboutUs) : ''}</span>
                </div>

                <div class="user-card-actions">
                    <button class="action-btn action-btn-view"
                        onclick="window.openViewModal('${user.id}','${type}')">
                        👁️ View
                    </button>
                    <button class="action-btn action-btn-approve"
                        onclick="window.openApproveModal('${user.id}','${type}')">
                        ✅ Approve
                    </button>
                    <button class="action-btn action-btn-reject"
                        onclick="window.openRejectModal('${user.id}','${type}')">
                        ❌ Reject
                    </button>
                </div>
            </div>
        `;
    }

    function renderEmpty(type) {
        const msg = type === 'employees'
            ? 'No pending employee approvals'
            : 'No pending student approvals';
        return `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3 class="empty-title">All caught up!</h3>
                <p class="empty-message">${msg}</p>
                <div class="empty-decoration">☕ ✨ ☕</div>
            </div>
        `;
    }

    // ─────────────────────────────────────
    // 🗂️ TAB SWITCHING
    // ─────────────────────────────────────
    window.switchTab = function(tabName) {
        state.activeTab = tabName;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        el.tabEmployees.classList.toggle('active', tabName === 'employees');
        el.tabStudents.classList.toggle('active',  tabName === 'students');
    };

    window.applyFilter = function(filter) {
        state.activeFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        renderEmployees();
        renderStudents();
    };

    window.clearSearch = function() {
        el.searchInput.value = '';
        state.searchQuery = '';
        el.searchClear.style.display = 'none';
        renderEmployees();
        renderStudents();
    };

    // ─────────────────────────────────────
    // 👁️ VIEW MODAL
    // ─────────────────────────────────────
    window.openViewModal = function(userId, type) {
        const list = type === 'employee'
            ? state.pendingEmployees
            : state.pendingStudents;
        const user = list.find(u => u.id === userId);
        if (!user) { showToast('User not found', 'error'); return; }

        state.selectedUser = { ...user, type };
        el.viewModalIcon.textContent  = type === 'employee' ? '👔' : '🎓';
        el.viewModalTitle.textContent = type === 'employee' ? 'Employee Details' : 'Student Details';
        el.viewModalBody.innerHTML    = buildDetailsHtml(user, type);
        el.viewModal.classList.add('active');
    };

    window.closeViewModal = function() {
        el.viewModal.classList.remove('active');
    };

    function buildDetailsHtml(user, type) {
        const isEmp     = type === 'employee';
        const signupDate = getDate(user.signupDate);

        return `
            <div class="approve-user-info">
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${esc(user.name || '-')}</span>
                </div>
                ${isEmp && user.nickname ? `
                <div class="info-row">
                    <span class="info-label">Nickname:</span>
                    <span class="info-value">@${esc(user.nickname)}</span>
                </div>` : ''}
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${esc(user.email || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${esc(user.phone || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">NIC:</span>
                    <span class="info-value">${esc(user.nic || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">DOB:</span>
                    <span class="info-value">${esc(user.dob || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${esc(user.address || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Heard via:</span>
                    <span class="info-value">${esc(user.hearAboutUs || '-')}</span>
                </div>
                ${isEmp && user.signupPromoCode ? `
                <div class="info-row">
                    <span class="info-label">Promo Code:</span>
                    <span class="info-value">🎫 ${esc(user.signupPromoCode)}</span>
                </div>` : ''}
                <div class="info-row">
                    <span class="info-label">Email Verified:</span>
                    <span class="info-value">${user.emailVerified ? '✅ Yes' : '⚠️ No'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Signup Date:</span>
                    <span class="info-value">
                        ${signupDate ? signupDate.toLocaleString() : '-'}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Auth UID:</span>
                    <span class="info-value" 
                          style="font-size:11px;font-family:monospace;">
                        ${esc(user.authUid || '-')}
                    </span>
                </div>
            </div>
        `;
    }

    window.approveFromView = function() {
        if (!state.selectedUser) return;
        closeViewModal();
        window.openApproveModal(state.selectedUser.id, state.selectedUser.type);
    };

    window.rejectFromView = function() {
        if (!state.selectedUser) return;
        closeViewModal();
        window.openRejectModal(state.selectedUser.id, state.selectedUser.type);
    };

    // ─────────────────────────────────────
    // ✅ APPROVE MODALS
    // ─────────────────────────────────────
    window.openApproveModal = function(userId, type) {
        const list = type === 'employee'
            ? state.pendingEmployees
            : state.pendingStudents;
        const user = list.find(u => u.id === userId);
        if (!user) { showToast('User not found', 'error'); return; }

        state.selectedUser = { ...user, type };

        if (type === 'employee') {
            el.approveEmpInfo.innerHTML = `
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${esc(user.name)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nickname:</span>
                    <span class="info-value">@${esc(user.nickname || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${esc(user.email)}</span>
                </div>
            `;
            el.roleSelect.value = '';
            el.permissionsPreview.style.display = 'none';
            el.customPermsPanel.style.display   = 'none';
            el.confirmApproveEmpBtn.disabled     = true;
            state.customPermsMode                = false;
            el.approveEmpModal.classList.add('active');
        } else {
            el.approveStdInfo.innerHTML = `
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${esc(user.name)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${esc(user.email)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${esc(user.phone)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">NIC:</span>
                    <span class="info-value">${esc(user.nic || '-')}</span>
                </div>
            `;
            el.approveStdModal.classList.add('active');
        }
    };

    window.closeApproveEmpModal = function() {
        el.approveEmpModal.classList.remove('active');
    };

    window.closeApproveStdModal = function() {
        el.approveStdModal.classList.remove('active');
    };

    // ─────────────────────────────────────
    // 🎭 ROLE CHANGE → PERMISSIONS PREVIEW
    // ─────────────────────────────────────
    window.onRoleChange = function() {
        const role = el.roleSelect.value;
        if (!role) {
            el.permissionsPreview.style.display = 'none';
            el.customPermsPanel.style.display   = 'none';
            el.confirmApproveEmpBtn.disabled     = true;
            return;
        }
        el.permissionsPreview.style.display = 'block';
        renderPermissionsPreview(role);
        renderCustomPermsList(role);
        el.confirmApproveEmpBtn.disabled = false;
    };

    function renderPermissionsPreview(role) {
        const perms = ROLE_PERMISSIONS[role] || {};
        el.permissionsGrid.innerHTML = APPROVE_DATABASES.map(dbDef => {
            const p = perms[dbDef.id];
            if (!p) {
                return `
                    <div class="permission-item" style="opacity:0.4;">
                        <span class="perm-name">${dbDef.icon} ${dbDef.shortName}</span>
                        <span style="color:var(--text-muted,#6C757D);font-size:11px;">
                            No access
                        </span>
                    </div>
                `;
            }
            let tags = '';
            if (p.add)    tags += '<span class="perm-tag perm-tag-add">Add</span>';
            if (p.view)   tags += '<span class="perm-tag perm-tag-view">View</span>';
            if (p.edit)   tags += '<span class="perm-tag perm-tag-edit">Edit</span>';
            if (p.delete) tags += '<span class="perm-tag perm-tag-delete">Delete</span>';

            return `
                <div class="permission-item">
                    <span class="perm-name">${dbDef.icon} ${dbDef.shortName}</span>
                    <div class="perm-actions">
                        ${tags || '<span style="color:var(--text-muted,#6C757D);font-size:11px;">View only</span>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderCustomPermsList(role) {
        const perms = ROLE_PERMISSIONS[role] || {};
        el.customPermsList.innerHTML = APPROVE_DATABASES.map(dbDef => {
            const p = perms[dbDef.id] || {};
            return `
                <div class="perm-row">
                    <span class="perm-row-label">${dbDef.icon} ${dbDef.shortName}</span>
                    <div class="perm-checkboxes">
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${dbDef.id}" 
                                   data-action="add" ${p.add ? 'checked' : ''}>
                            Add
                        </label>
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${dbDef.id}" 
                                   data-action="view" ${p.view ? 'checked' : ''}>
                            View
                        </label>
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${dbDef.id}" 
                                   data-action="edit" ${p.edit ? 'checked' : ''}>
                            Edit
                        </label>
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${dbDef.id}" 
                                   data-action="delete" ${p.delete ? 'checked' : ''}>
                            Delete
                        </label>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.toggleCustomPerms = function() {
        state.customPermsMode = !state.customPermsMode;
        el.customPermsPanel.style.display = state.customPermsMode ? 'block' : 'none';
        el.customizeBtnText.textContent   = state.customPermsMode
            ? '✅ Use Default Permissions'
            : '📝 Customize Permissions';
    };

    // ─────────────────────────────────────
    // ✅ CONFIRM APPROVE EMPLOYEE
    // ─────────────────────────────────────
    window.confirmApproveEmployee = async function() {
        if (!state.selectedUser) return;

        const role = el.roleSelect.value;
        if (!role) { showToast('Please select a role', 'error'); return; }

        const btn = el.confirmApproveEmpBtn;
        btn.disabled    = true;
        btn.textContent = '⏳ Approving...';

        try {
            const permissions = state.customPermsMode
                ? collectCustomPermissions()
                : ROLE_PERMISSIONS[role] || {};

            await db.collection('employees')
                .doc(state.selectedUser.id)
                .update({
                    approvalStatus: 'approved',
                    access:         role,
                    permissions:    permissions,
                    status:         'Active',
                    approvedAt:     firebase.firestore.FieldValue.serverTimestamp(),
                    approvedBy:     state.currentUser.name || state.currentUser.nickname,
                    approvedById:   state.currentUser.id
                });

            showToast(`✅ ${state.selectedUser.name} approved as ${role}!`, 'success');
            window.closeApproveEmpModal();
            state.selectedUser = null;

        } catch (err) {
            console.error('❌ [APPROVE] Approve employee error:', err);
            showToast('Failed to approve. Try again.', 'error');
            btn.disabled    = false;
            btn.textContent = '✅ Approve Employee';
        }
    };

    function collectCustomPermissions() {
        const perms = {};
        el.customPermsList
            .querySelectorAll('input[type="checkbox"]')
            .forEach(cb => {
                const dbId   = cb.dataset.db;
                const action = cb.dataset.action;
                if (!perms[dbId]) perms[dbId] = {};
                perms[dbId][action] = cb.checked;
            });

        // Remove all-false entries
        Object.keys(perms).forEach(dbId => {
            if (!Object.values(perms[dbId]).some(v => v)) delete perms[dbId];
        });

        return perms;
    }

    // ─────────────────────────────────────
    // ✅ CONFIRM APPROVE STUDENT
    // ─────────────────────────────────────
    window.confirmApproveStudent = async function() {
        if (!state.selectedUser) return;

        try {
            await db.collection('students')
                .doc(state.selectedUser.id)
                .update({
                    approvalStatus: 'approved',
                    status:         'Pending',
                    approvedAt:     firebase.firestore.FieldValue.serverTimestamp(),
                    approvedBy:     state.currentUser.name || state.currentUser.nickname,
                    approvedById:   state.currentUser.id
                });

            showToast(
                `✅ ${state.selectedUser.name} approved! Call Operator can now enroll.`,
                'success'
            );
            window.closeApproveStdModal();
            state.selectedUser = null;

        } catch (err) {
            console.error('❌ [APPROVE] Approve student error:', err);
            showToast('Failed to approve. Try again.', 'error');
        }
    };

    // ─────────────────────────────────────
    // ❌ REJECT MODAL
    // ─────────────────────────────────────
    window.openRejectModal = function(userId, type) {
        const list = type === 'employee'
            ? state.pendingEmployees
            : state.pendingStudents;
        const user = list.find(u => u.id === userId);
        if (!user) { showToast('User not found', 'error'); return; }

        state.selectedUser = { ...user, type };

        el.rejectUserInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">Type:</span>
                <span class="info-value">
                    ${type === 'employee' ? '👔 Employee' : '🎓 Student'}
                </span>
            </div>
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${esc(user.name)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${esc(user.email)}</span>
            </div>
        `;

        el.rejectReason.value        = '';
        el.reasonCharCount.textContent = '0';
        el.confirmRejectBtn.disabled   = true;
        el.rejectModal.classList.add('active');
    };

    window.closeRejectModal = function() {
        el.rejectModal.classList.remove('active');
    };

    window.useQuickReason = function(reason) {
        el.rejectReason.value          = reason;
        el.reasonCharCount.textContent = reason.length;
        el.confirmRejectBtn.disabled   = reason.length < 10;
    };

    window.confirmReject = async function() {
        if (!state.selectedUser) return;

        const reason = el.rejectReason.value.trim();
        if (reason.length < 10) {
            showToast('Reason must be at least 10 characters', 'error');
            return;
        }

        const btn = el.confirmRejectBtn;
        btn.disabled    = true;
        btn.textContent = '⏳ Rejecting...';

        try {
            const col = state.selectedUser.type === 'employee'
                ? 'employees' : 'students';

            await db.collection(col)
                .doc(state.selectedUser.id)
                .update({
                    approvalStatus:  'rejected',
                    rejectionReason: reason,
                    rejectedAt:      firebase.firestore.FieldValue.serverTimestamp(),
                    rejectedBy:      state.currentUser.name || state.currentUser.nickname,
                    rejectedById:    state.currentUser.id
                });

            showToast(`❌ ${state.selectedUser.name} rejected`, 'warning');
            window.closeRejectModal();
            state.selectedUser = null;

        } catch (err) {
            console.error('❌ [APPROVE] Reject error:', err);
            showToast('Failed to reject. Try again.', 'error');
            btn.disabled    = false;
            btn.textContent = '❌ Confirm Rejection';
        }
    };

    // ─────────────────────────────────────
    // 🧭 NAVIGATION
    // ─────────────────────────────────────
    window.goHome = function() {
        state.unsubscribers.forEach(u => u());
        window.location.href = 'access.html';
    };

    window.handleLogout = function() {
        if (confirm('🚪 Logout කරන්න ඕනද?')) {
            state.unsubscribers.forEach(u => u());
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'welcome.html';
        }
    };

    // ─────────────────────────────────────
    // 🎯 EVENT LISTENERS
    // ─────────────────────────────────────
    function attachEventListeners() {
        // Search
        el.searchInput.addEventListener('input', e => {
            state.searchQuery = e.target.value.trim();
            el.searchClear.style.display = state.searchQuery ? 'block' : 'none';
            renderEmployees();
            renderStudents();
        });

        // Reject char count
        el.rejectReason.addEventListener('input', e => {
            const len = e.target.value.length;
            el.reasonCharCount.textContent = len;
            el.confirmRejectBtn.disabled   = len < 10;
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });

        // ESC to close modals
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active')
                    .forEach(m => m.classList.remove('active'));
            }
        });

        // Cleanup on unload
        window.addEventListener('beforeunload', () => {
            state.unsubscribers.forEach(u => u());
        });
    }

    // ─────────────────────────────────────
    // 🛠️ UTILITIES
    // ─────────────────────────────────────
    function esc(text) {
        if (!text) return '';
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    function getDate(ts) {
        if (!ts) return null;
        try {
            if (ts.toDate) return ts.toDate();
            return new Date(ts);
        } catch { return null; }
    }

    function getTimeAgo(date) {
        if (!date) return 'Unknown';
        const sec = Math.floor((Date.now() - date.getTime()) / 1000);
        if (sec < 60)     return 'Just now';
        if (sec < 3600)   return `${Math.floor(sec / 60)}m ago`;
        if (sec < 86400)  return `${Math.floor(sec / 3600)}h ago`;
        if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    // ─────────────────────────────────────
    // 🏁 KICK OFF
    // ─────────────────────────────────────
    waitForFirebase(setup);

    console.log('☕ [APPROVE] Buono Approvals v2.1 loaded');
};

// ─────────────────────────────────────────
// ⚡ AUTO-EXECUTE
// ─────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initApprovePage());
} else {
    window.initApprovePage();
}