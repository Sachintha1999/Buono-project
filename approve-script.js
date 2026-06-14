/* ═══════════════════════════════════════════════════════════
   ☕ BUONO APPROVALS - SCRIPT
   File: approve-script.js
   Version: 1.0
   Features: Real-time + Admin only + Approve/Reject
   ═══════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // ─────────────────────────────────────────
    // ⏱️ PERFORMANCE TRACKER
    // ─────────────────────────────────────────
    const startTime = performance.now();
    console.log('☕ [APPROVE] Script loading...');

    // ─────────────────────────────────────────
    // 🎯 STATE
    // ─────────────────────────────────────────
    const state = {
        currentUser: null,
        activeTab: 'employees',
        activeFilter: 'all',
        searchQuery: '',
        pendingEmployees: [],
        pendingStudents: [],
        selectedUser: null,
        unsubscribers: [],
        customPermsMode: false
    };

    // ─────────────────────────────────────────
    // 🏷️ ROLE PERMISSIONS TEMPLATE
    // ─────────────────────────────────────────
    const ROLE_PERMISSIONS = {
        'Admin': {
            employeeDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            dayEndReportDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            inventoryDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            kitchenDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            purchasingDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            callCenterDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            reportsDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            studentDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            paymentDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            settingsDB: { add: true, view: true, selfView: true, edit: true, delete: true },
            installmentTrackerDB: { add: true, view: true, selfView: true, edit: true, delete: true }
        },
        'Manager': {
            employeeDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            dayEndReportDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            inventoryDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            kitchenDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            purchasingDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            callCenterDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            reportsDB: { view: true },
            studentDB: { view: true, edit: true },
            paymentDB: { add: true, view: true, edit: true },
            settingsDB: { view: true },
            installmentTrackerDB: { add: true, view: true, edit: true }
        },
        'Cashier': {
            dayEndReportDB: { add: true, view: true, selfView: true, edit: false, delete: false },
            paymentDB: { add: true, view: true, selfView: false, edit: false, delete: false },
            studentDB: { view: true },
            installmentTrackerDB: { add: true, view: true, edit: false }
        },
        'Purchasing Officer': {
            purchasingDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            inventoryDB: { add: true, view: true, selfView: true, edit: true, delete: false }
        },
        'Head Chef': {
            kitchenDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            inventoryDB: { view: true, selfView: true },
            purchasingDB: { view: true }
        },
        'Call Operator': {
            callCenterDB: { add: true, view: true, selfView: true, edit: true, delete: false },
            paymentDB: { add: true, view: true, edit: false },
            studentDB: { view: true },
            installmentTrackerDB: { add: true, view: true, edit: false }
        },
        'Waiter': {
            kitchenDB: { selfView: true }
        }
    };

    // ─────────────────────────────────────────
    // 🌐 DOM ELEMENTS
    // ─────────────────────────────────────────
    let elements = {};

    function cacheElements() {
        elements = {
            loadingOverlay: document.getElementById('loadingOverlay'),
            mainContent: document.getElementById('mainContent'),
            userName: document.getElementById('userName'),
            
            // Stats
            empCount: document.getElementById('empCount'),
            stdCount: document.getElementById('stdCount'),
            totalCount: document.getElementById('totalCount'),
            todayCount: document.getElementById('todayCount'),
            tabBadgeEmp: document.getElementById('tabBadgeEmp'),
            tabBadgeStd: document.getElementById('tabBadgeStd'),
            
            // Search & Filter
            searchInput: document.getElementById('searchInput'),
            searchClear: document.getElementById('searchClear'),
            
            // Lists
            employeesList: document.getElementById('employeesList'),
            studentsList: document.getElementById('studentsList'),
            
            // Tab contents
            tabEmployees: document.getElementById('tabEmployees'),
            tabStudents: document.getElementById('tabStudents'),
            
            // Modals
            viewModal: document.getElementById('viewModal'),
            viewModalIcon: document.getElementById('viewModalIcon'),
            viewModalTitle: document.getElementById('viewModalTitle'),
            viewModalBody: document.getElementById('viewModalBody'),
            
            approveEmpModal: document.getElementById('approveEmpModal'),
            approveEmpInfo: document.getElementById('approveEmpInfo'),
            roleSelect: document.getElementById('roleSelect'),
            permissionsPreview: document.getElementById('permissionsPreview'),
            permissionsGrid: document.getElementById('permissionsGrid'),
            customizeBtnText: document.getElementById('customizeBtnText'),
            customPermsPanel: document.getElementById('customPermsPanel'),
            customPermsList: document.getElementById('customPermsList'),
            confirmApproveEmpBtn: document.getElementById('confirmApproveEmpBtn'),
            
            approveStdModal: document.getElementById('approveStdModal'),
            approveStdInfo: document.getElementById('approveStdInfo'),
            
            rejectModal: document.getElementById('rejectModal'),
            rejectUserInfo: document.getElementById('rejectUserInfo'),
            rejectReason: document.getElementById('rejectReason'),
            reasonCharCount: document.getElementById('reasonCharCount'),
            confirmRejectBtn: document.getElementById('confirmRejectBtn'),
            
            // Toast
            toast: document.getElementById('toast'),
            toastIcon: document.getElementById('toastIcon'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    // ─────────────────────────────────────────
    // 🍞 TOAST
    // ─────────────────────────────────────────
    function showToast(message, type = 'info') {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        elements.toast.className = `toast ${type} active`;
        elements.toastIcon.textContent = icons[type] || icons.info;
        elements.toastMessage.textContent = message;
        setTimeout(() => elements.toast.classList.remove('active'), 4000);
    }

    // ─────────────────────────────────────────
    // 🔐 AUTH CHECK
    // ─────────────────────────────────────────
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

    // ─────────────────────────────────────────
    // 🚀 INIT
    // ─────────────────────────────────────────
    async function init() {
        console.log('🚀 [APPROVE] Initializing...');
        
        if (typeof firebase === 'undefined' || typeof db === 'undefined') {
            console.log('⏳ [APPROVE] Waiting for Firebase...');
            setTimeout(init, 100);
            return;
        }
        
        cacheElements();
        
        if (!checkAdminAuth()) return;
        
        // Update user name
        elements.userName.textContent = state.currentUser.name || state.currentUser.nickname || 'Admin';
        
        // Setup event listeners
        attachEventListeners();
        
        // Start real-time listeners
        startRealtimeListeners();
        
        // Reveal page
        revealPage();
        
        const elapsed = Math.round(performance.now() - startTime);
        console.log(`✅ [APPROVE] Ready! (${elapsed}ms)`);
    }

    function revealPage() {
        setTimeout(() => {
            elements.loadingOverlay.classList.add('hidden');
            elements.mainContent.style.opacity = '1';
        }, 400);
    }

    // ─────────────────────────────────────────
    // 🔥 REAL-TIME LISTENERS
    // ─────────────────────────────────────────
    function startRealtimeListeners() {
        console.log('📡 [APPROVE] Starting real-time listeners...');
        
        // Pending Employees
        const empUnsub = db.collection('employees')
            .where('approvalStatus', '==', 'pending')
            .onSnapshot(snapshot => {
                const wasEmpty = state.pendingEmployees.length === 0;
                state.pendingEmployees = [];
                
                snapshot.forEach(doc => {
                    state.pendingEmployees.push({ id: doc.id, ...doc.data() });
                });
                
                // Sort by signup date (newest first)
                state.pendingEmployees.sort((a, b) => {
                    const dateA = getDate(a.signupDate);
                    const dateB = getDate(b.signupDate);
                    return dateB - dateA;
                });
                
                console.log(`👔 [APPROVE] Pending employees: ${state.pendingEmployees.length}`);
                
                // Show notification if new signup arrived
                if (!wasEmpty && snapshot.docChanges().some(c => c.type === 'added')) {
                    showToast('🔔 New employee signup!', 'info');
                }
                
                updateStats();
                renderEmployees();
            }, error => {
                console.error('❌ [APPROVE] Employees listener error:', error);
                showToast('Failed to load employees', 'error');
            });
        
        state.unsubscribers.push(empUnsub);
        
        // Pending Students
        const stdUnsub = db.collection('students')
            .where('approvalStatus', '==', 'pending')
            .onSnapshot(snapshot => {
                const wasEmpty = state.pendingStudents.length === 0;
                state.pendingStudents = [];
                
                snapshot.forEach(doc => {
                    state.pendingStudents.push({ id: doc.id, ...doc.data() });
                });
                
                state.pendingStudents.sort((a, b) => {
                    const dateA = getDate(a.signupDate);
                    const dateB = getDate(b.signupDate);
                    return dateB - dateA;
                });
                
                console.log(`🎓 [APPROVE] Pending students: ${state.pendingStudents.length}`);
                
                if (!wasEmpty && snapshot.docChanges().some(c => c.type === 'added')) {
                    showToast('🔔 New student signup!', 'info');
                }
                
                updateStats();
                renderStudents();
            }, error => {
                console.error('❌ [APPROVE] Students listener error:', error);
                showToast('Failed to load students', 'error');
            });
        
        state.unsubscribers.push(stdUnsub);
    }

    // ─────────────────────────────────────────
    // 📊 UPDATE STATS
    // ─────────────────────────────────────────
    function updateStats() {
        const empCount = state.pendingEmployees.length;
        const stdCount = state.pendingStudents.length;
        const total = empCount + stdCount;
        
        // Today's signups
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = [...state.pendingEmployees, ...state.pendingStudents]
            .filter(u => {
                const signup = getDate(u.signupDate);
                return signup && signup >= today;
            }).length;
        
        elements.empCount.textContent = empCount;
        elements.stdCount.textContent = stdCount;
        elements.totalCount.textContent = total;
        elements.todayCount.textContent = todayCount;
        elements.tabBadgeEmp.textContent = empCount;
        elements.tabBadgeStd.textContent = stdCount;
    }

    // ─────────────────────────────────────────
    // 📋 RENDER EMPLOYEES
    // ─────────────────────────────────────────
    function renderEmployees() {
        const filtered = applyFilters(state.pendingEmployees);
        
        if (filtered.length === 0) {
            elements.employeesList.innerHTML = renderEmptyState('employees');
            return;
        }
        
        elements.employeesList.innerHTML = filtered.map(emp => 
            renderUserCard(emp, 'employee')
        ).join('');
    }

    // ─────────────────────────────────────────
    // 📋 RENDER STUDENTS
    // ─────────────────────────────────────────
    function renderStudents() {
        const filtered = applyFilters(state.pendingStudents);
        
        if (filtered.length === 0) {
            elements.studentsList.innerHTML = renderEmptyState('students');
            return;
        }
        
        elements.studentsList.innerHTML = filtered.map(std => 
            renderUserCard(std, 'student')
        ).join('');
    }

    // ─────────────────────────────────────────
    // 🎨 RENDER USER CARD
    // ─────────────────────────────────────────
    function renderUserCard(user, type) {
        const isEmployee = type === 'employee';
        const avatar = (user.name || 'U').charAt(0).toUpperCase();
        const signupDate = getDate(user.signupDate);
        const timeAgo = getTimeAgo(signupDate);
        const verified = user.emailVerified;
        
        const badges = [];
        if (isEmployee) {
            badges.push('<span class="badge badge-employee">👔 Employee</span>');
            if (user.signupPromoCode) {
                badges.push(`<span class="badge badge-promo">🎫 ${user.signupPromoCode}</span>`);
            }
        } else {
            badges.push('<span class="badge badge-student">🎓 Student</span>');
        }
        
        if (verified) {
            badges.push('<span class="badge badge-verified">✅ Verified</span>');
        } else {
            badges.push('<span class="badge badge-unverified">⚠️ Unverified</span>');
        }
        
        return `
            <div class="user-card type-${type}" data-id="${user.id}" data-type="${type}">
                <div class="user-card-header">
                    <div class="user-avatar">${avatar}</div>
                    <div class="user-card-badges">
                        ${badges.join('')}
                    </div>
                </div>
                
                <div class="user-card-name">${escapeHtml(user.name || 'Unnamed')}</div>
                
                <div class="user-card-info">
                    <div class="user-info-item">
                        <span class="icon">📧</span>
                        <span class="value">${escapeHtml(user.email || 'No email')}</span>
                    </div>
                    <div class="user-info-item">
                        <span class="icon">📱</span>
                        <span class="value">${escapeHtml(user.phone || 'No phone')}</span>
                    </div>
                    ${isEmployee && user.nickname ? `
                    <div class="user-info-item">
                        <span class="icon">👤</span>
                        <span class="value">@${escapeHtml(user.nickname)}</span>
                    </div>` : ''}
                    ${!isEmployee && user.nic ? `
                    <div class="user-info-item">
                        <span class="icon">🆔</span>
                        <span class="value">${escapeHtml(user.nic)}</span>
                    </div>` : ''}
                </div>
                
                <div class="user-card-meta">
                    <span>📅 Applied: ${timeAgo}</span>
                    <span>${user.hearAboutUs ? '📢 ' + escapeHtml(user.hearAboutUs) : ''}</span>
                </div>
                
                <div class="user-card-actions">
                    <button class="action-btn action-btn-view" onclick="window.openViewModal('${user.id}', '${type}')">
                        👁️ View
                    </button>
                    <button class="action-btn action-btn-approve" onclick="window.openApproveModal('${user.id}', '${type}')">
                        ✅ Approve
                    </button>
                    <button class="action-btn action-btn-reject" onclick="window.openRejectModal('${user.id}', '${type}')">
                        ❌ Reject
                    </button>
                </div>
            </div>
        `;
    }

    // ─────────────────────────────────────────
    // 🎉 EMPTY STATE
    // ─────────────────────────────────────────
    function renderEmptyState(type) {
        const messages = {
            employees: 'No pending employee approvals',
            students: 'No pending student approvals'
        };
        
        return `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3 class="empty-title">All caught up!</h3>
                <p class="empty-message">${messages[type]}</p>
                <div class="empty-decoration">☕ ✨ ☕</div>
            </div>
        `;
    }

    // ─────────────────────────────────────────
    // 🔍 APPLY FILTERS
    // ─────────────────────────────────────────
    function applyFilters(users) {
        let filtered = [...users];
        
        // Filter by verification
        if (state.activeFilter === 'verified') {
            filtered = filtered.filter(u => u.emailVerified);
        } else if (state.activeFilter === 'unverified') {
            filtered = filtered.filter(u => !u.emailVerified);
        }
        
        // Filter by search
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(u => 
                (u.name || '').toLowerCase().includes(query) ||
                (u.email || '').toLowerCase().includes(query) ||
                (u.phone || '').toLowerCase().includes(query) ||
                (u.nickname || '').toLowerCase().includes(query) ||
                (u.nic || '').toLowerCase().includes(query)
            );
        }
        
        return filtered;
    }

    // ─────────────────────────────────────────
    // 🗂️ TAB SWITCHING
    // ─────────────────────────────────────────
    window.switchTab = function(tabName) {
        state.activeTab = tabName;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        if (tabName === 'employees') {
            elements.tabEmployees.classList.add('active');
        } else {
            elements.tabStudents.classList.add('active');
        }
    };

    // ─────────────────────────────────────────
    // 🎚️ FILTERS
    // ─────────────────────────────────────────
    window.applyFilter = function(filter) {
        state.activeFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        renderEmployees();
        renderStudents();
    };

    window.clearSearch = function() {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClear.style.display = 'none';
        renderEmployees();
        renderStudents();
    };

    // ─────────────────────────────────────────
    // 👁️ VIEW MODAL
    // ─────────────────────────────────────────
    window.openViewModal = function(userId, type) {
        const list = type === 'employee' ? state.pendingEmployees : state.pendingStudents;
        const user = list.find(u => u.id === userId);
        
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
        
        state.selectedUser = { ...user, type };
        
        elements.viewModalIcon.textContent = type === 'employee' ? '👔' : '🎓';
        elements.viewModalTitle.textContent = type === 'employee' ? 'Employee Details' : 'Student Details';
        
        elements.viewModalBody.innerHTML = renderUserDetails(user, type);
        elements.viewModal.classList.add('active');
    };

    window.closeViewModal = function() {
        elements.viewModal.classList.remove('active');
    };

    function renderUserDetails(user, type) {
        const signupDate = getDate(user.signupDate);
        const isEmployee = type === 'employee';
        
        let html = `
            <div class="approve-user-info">
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${escapeHtml(user.name || '-')}</span>
                </div>
                ${isEmployee && user.nickname ? `
                <div class="info-row">
                    <span class="info-label">Nickname:</span>
                    <span class="info-value">@${escapeHtml(user.nickname)}</span>
                </div>` : ''}
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${escapeHtml(user.email || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${escapeHtml(user.phone || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">NIC:</span>
                    <span class="info-value">${escapeHtml(user.nic || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">DOB:</span>
                    <span class="info-value">${escapeHtml(user.dob || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${escapeHtml(user.address || '-')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Heard via:</span>
                    <span class="info-value">${escapeHtml(user.hearAboutUs || '-')}</span>
                </div>
                ${isEmployee && user.signupPromoCode ? `
                <div class="info-row">
                    <span class="info-label">Promo Code:</span>
                    <span class="info-value">🎫 ${escapeHtml(user.signupPromoCode)}</span>
                </div>` : ''}
                <div class="info-row">
                    <span class="info-label">Email Verified:</span>
                    <span class="info-value">${user.emailVerified ? '✅ Yes' : '⚠️ No'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Signup Date:</span>
                    <span class="info-value">${signupDate ? signupDate.toLocaleString() : '-'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Auth UID:</span>
                    <span class="info-value" style="font-size:11px;font-family:monospace;">${escapeHtml(user.authUid || '-')}</span>
                </div>
            </div>
        `;
        
        return html;
    }

    window.approveFromView = function() {
        if (!state.selectedUser) return;
        closeViewModal();
        openApproveModal(state.selectedUser.id, state.selectedUser.type);
    };

    window.rejectFromView = function() {
        if (!state.selectedUser) return;
        closeViewModal();
        openRejectModal(state.selectedUser.id, state.selectedUser.type);
    };

    // ─────────────────────────────────────────
    // ✅ APPROVE MODAL
    // ─────────────────────────────────────────
    window.openApproveModal = function(userId, type) {
        const list = type === 'employee' ? state.pendingEmployees : state.pendingStudents;
        const user = list.find(u => u.id === userId);
        
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
        
        state.selectedUser = { ...user, type };
        
        if (type === 'employee') {
            openApproveEmployeeModal(user);
        } else {
            openApproveStudentModal(user);
        }
    };

    function openApproveEmployeeModal(user) {
        elements.approveEmpInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${escapeHtml(user.name)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Nickname:</span>
                <span class="info-value">@${escapeHtml(user.nickname || '-')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${escapeHtml(user.email)}</span>
            </div>
        `;
        
        // Reset
        elements.roleSelect.value = '';
        elements.permissionsPreview.style.display = 'none';
        elements.customPermsPanel.style.display = 'none';
        elements.confirmApproveEmpBtn.disabled = true;
        state.customPermsMode = false;
        
        elements.approveEmpModal.classList.add('active');
    }

    function openApproveStudentModal(user) {
        elements.approveStdInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${escapeHtml(user.name)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${escapeHtml(user.email)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${escapeHtml(user.phone)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">NIC:</span>
                <span class="info-value">${escapeHtml(user.nic || '-')}</span>
            </div>
        `;
        
        elements.approveStdModal.classList.add('active');
    }

    window.closeApproveEmpModal = function() {
        elements.approveEmpModal.classList.remove('active');
    };

    window.closeApproveStdModal = function() {
        elements.approveStdModal.classList.remove('active');
    };

    // ─────────────────────────────────────────
    // 🎭 ROLE CHANGE
    // ─────────────────────────────────────────
    window.onRoleChange = function() {
        const role = elements.roleSelect.value;
        
        if (!role) {
            elements.permissionsPreview.style.display = 'none';
            elements.customPermsPanel.style.display = 'none';
            elements.confirmApproveEmpBtn.disabled = true;
            return;
        }
        
        // Show permissions preview
        elements.permissionsPreview.style.display = 'block';
        renderPermissionsPreview(role);
        renderCustomPermsList(role);
        
        elements.confirmApproveEmpBtn.disabled = false;
    };

    function renderPermissionsPreview(role) {
        const perms = ROLE_PERMISSIONS[role] || {};
        const dbList = DATABASES.map(d => ({ id: d.id, name: d.shortName, icon: d.icon }));
        
        let html = '';
        dbList.forEach(db => {
            const p = perms[db.id];
            if (!p) {
                html += `
                    <div class="permission-item" style="opacity:0.4;">
                        <span class="perm-name">${db.icon} ${db.name}</span>
                        <span style="color:var(--text-muted);font-size:11px;">No access</span>
                    </div>
                `;
                return;
            }
            
            let tags = '';
            if (p.add) tags += '<span class="perm-tag perm-tag-add">Add</span>';
            if (p.view) tags += '<span class="perm-tag perm-tag-view">View</span>';
            if (p.edit) tags += '<span class="perm-tag perm-tag-edit">Edit</span>';
            if (p.delete) tags += '<span class="perm-tag perm-tag-delete">Delete</span>';
            
            html += `
                <div class="permission-item">
                    <span class="perm-name">${db.icon} ${db.name}</span>
                    <div class="perm-actions">${tags || '<span style="color:var(--text-muted);font-size:11px;">View only</span>'}</div>
                </div>
            `;
        });
        
        elements.permissionsGrid.innerHTML = html;
    }

    function renderCustomPermsList(role) {
        const perms = ROLE_PERMISSIONS[role] || {};
        
        let html = '';
        DATABASES.forEach(db => {
            const p = perms[db.id] || {};
            html += `
                <div class="perm-row">
                    <span class="perm-row-label">${db.icon} ${db.shortName}</span>
                    <div class="perm-checkboxes">
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${db.id}" data-action="add" ${p.add ? 'checked' : ''}>
                            Add
                        </label>
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${db.id}" data-action="view" ${p.view ? 'checked' : ''}>
                            View
                        </label>
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${db.id}" data-action="edit" ${p.edit ? 'checked' : ''}>
                            Edit
                        </label>
                        <label class="perm-checkbox">
                            <input type="checkbox" data-db="${db.id}" data-action="delete" ${p.delete ? 'checked' : ''}>
                            Delete
                        </label>
                    </div>
                </div>
            `;
        });
        
        elements.customPermsList.innerHTML = html;
    }

    window.toggleCustomPerms = function() {
        state.customPermsMode = !state.customPermsMode;
        elements.customPermsPanel.style.display = state.customPermsMode ? 'block' : 'none';
        elements.customizeBtnText.textContent = state.customPermsMode 
            ? '✅ Use Default Permissions' 
            : '📝 Customize Permissions';
    };

    // ─────────────────────────────────────────
    // ✅ CONFIRM APPROVE EMPLOYEE
    // ─────────────────────────────────────────
    window.confirmApproveEmployee = async function() {
        if (!state.selectedUser) return;
        
        const role = elements.roleSelect.value;
        if (!role) {
            showToast('Please select a role', 'error');
            return;
        }
        
        const btn = elements.confirmApproveEmpBtn;
        btn.disabled = true;
        btn.textContent = '⏳ Approving...';
        
        try {
            // Get permissions (default or custom)
            let permissions;
            if (state.customPermsMode) {
                permissions = collectCustomPermissions();
            } else {
                permissions = ROLE_PERMISSIONS[role] || {};
            }
            
            // Update employee
            await db.collection('employees').doc(state.selectedUser.id).update({
                approvalStatus: 'approved',
                access: role,
                permissions: permissions,
                status: 'Active',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                approvedBy: state.currentUser.name || state.currentUser.nickname,
                approvedById: state.currentUser.id
            });
            
            console.log('✅ [APPROVE] Employee approved:', state.selectedUser.name);
            showToast(`✅ ${state.selectedUser.name} approved as ${role}!`, 'success');
            
            closeApproveEmpModal();
            state.selectedUser = null;
            
        } catch (error) {
            console.error('❌ [APPROVE] Error:', error);
            showToast('Failed to approve. Try again.', 'error');
            btn.disabled = false;
            btn.textContent = '✅ Approve Employee';
        }
    };

    function collectCustomPermissions() {
        const perms = {};
        const checkboxes = elements.customPermsList.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(cb => {
            const dbId = cb.dataset.db;
            const action = cb.dataset.action;
            
            if (!perms[dbId]) perms[dbId] = {};
            perms[dbId][action] = cb.checked;
        });
        
        // Remove empty perms (all false)
        Object.keys(perms).forEach(dbId => {
            const hasAny = Object.values(perms[dbId]).some(v => v === true);
            if (!hasAny) delete perms[dbId];
        });
        
        return perms;
    }

    // ─────────────────────────────────────────
    // ✅ CONFIRM APPROVE STUDENT
    // ─────────────────────────────────────────
    window.confirmApproveStudent = async function() {
        if (!state.selectedUser) return;
        
        try {
            await db.collection('students').doc(state.selectedUser.id).update({
                approvalStatus: 'approved',
                status: 'Pending', // Call Operator will activate after enrollment
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                approvedBy: state.currentUser.name || state.currentUser.nickname,
                approvedById: state.currentUser.id
            });
            
            console.log('✅ [APPROVE] Student approved:', state.selectedUser.name);
            showToast(`✅ ${state.selectedUser.name} approved! Call Operator can now enroll.`, 'success');
            
            closeApproveStdModal();
            state.selectedUser = null;
            
        } catch (error) {
            console.error('❌ [APPROVE] Error:', error);
            showToast('Failed to approve. Try again.', 'error');
        }
    };

    // ─────────────────────────────────────────
    // ❌ REJECT MODAL
    // ─────────────────────────────────────────
    window.openRejectModal = function(userId, type) {
        const list = type === 'employee' ? state.pendingEmployees : state.pendingStudents;
        const user = list.find(u => u.id === userId);
        
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
        
        state.selectedUser = { ...user, type };
        
        elements.rejectUserInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">Type:</span>
                <span class="info-value">${type === 'employee' ? '👔 Employee' : '🎓 Student'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${escapeHtml(user.name)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${escapeHtml(user.email)}</span>
            </div>
        `;
        
        // Reset
        elements.rejectReason.value = '';
        elements.reasonCharCount.textContent = '0';
        elements.confirmRejectBtn.disabled = true;
        
        elements.rejectModal.classList.add('active');
    };

    window.closeRejectModal = function() {
        elements.rejectModal.classList.remove('active');
    };

    window.useQuickReason = function(reason) {
        elements.rejectReason.value = reason;
        elements.reasonCharCount.textContent = reason.length;
        elements.confirmRejectBtn.disabled = reason.length < 10;
    };

    window.confirmReject = async function() {
        if (!state.selectedUser) return;
        
        const reason = elements.rejectReason.value.trim();
        if (reason.length < 10) {
            showToast('Reason must be at least 10 characters', 'error');
            return;
        }
        
        const btn = elements.confirmRejectBtn;
        btn.disabled = true;
        btn.textContent = '⏳ Rejecting...';
        
        try {
            const collection = state.selectedUser.type === 'employee' ? 'employees' : 'students';
            
            await db.collection(collection).doc(state.selectedUser.id).update({
                approvalStatus: 'rejected',
                rejectionReason: reason,
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rejectedBy: state.currentUser.name || state.currentUser.nickname,
                rejectedById: state.currentUser.id
            });
            
            console.log('❌ [APPROVE] User rejected:', state.selectedUser.name);
            showToast(`❌ ${state.selectedUser.name} rejected`, 'warning');
            
            closeRejectModal();
            state.selectedUser = null;
            
        } catch (error) {
            console.error('❌ [APPROVE] Error:', error);
            showToast('Failed to reject. Try again.', 'error');
            btn.disabled = false;
            btn.textContent = '❌ Confirm Rejection';
        }
    };

    // ─────────────────────────────────────────
    // 🧭 NAVIGATION
    // ─────────────────────────────────────────
    window.goHome = function() {
        // Cleanup listeners
        state.unsubscribers.forEach(unsub => unsub());
        window.location.href = 'access.html';
    };

        window.handleLogout = function() {
        if (confirm('🚪 Logout කරන්න ඕනද?')) {
            state.unsubscribers.forEach(unsub => unsub());
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'welcome.html';
        }
    };

    // ─────────────────────────────────────────
    // 🎯 EVENT LISTENERS
    // ─────────────────────────────────────────
    function attachEventListeners() {
        // Search
        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim();
            elements.searchClear.style.display = state.searchQuery ? 'block' : 'none';
            renderEmployees();
            renderStudents();
        });
        
        // Reject reason char count
        elements.rejectReason.addEventListener('input', (e) => {
            const len = e.target.value.length;
            elements.reasonCharCount.textContent = len;
            elements.confirmRejectBtn.disabled = len < 10;
        });
        
        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
        
        // ESC to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(m => {
                    m.classList.remove('active');
                });
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            state.unsubscribers.forEach(unsub => unsub());
        });
    }

    // ─────────────────────────────────────────
    // 🛠️ UTILITIES
    // ─────────────────────────────────────────
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getDate(timestamp) {
        if (!timestamp) return null;
        try {
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
            }
            return new Date(timestamp);
        } catch (e) {
            return null;
        }
    }

    function getTimeAgo(date) {
        if (!date) return 'Unknown';
        
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    // ─────────────────────────────────────────
    // 🚀 START
    // ─────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('☕ [APPROVE] Buono Approvals v1.0 loaded');
})();