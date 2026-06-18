/* ═══════════════════════════════════════════════════════════════ */
/* 👥 BUONO - EMPLOYEES PAGE SCRIPT                                */
/* File: pages/hr/employees/employees-script.js                   */
/* Version: 1.0 - Adapted from index-script.js v3.3               */
/* Date: 2026-06-17                                                */
/*                                                                 */
/* Business Logic for Employees Page                               */
/*                                                                 */
/* Integration with Buono Component System:                        */
/*   - Auto-init on 'buono:page-ready' event                      */
/*   - Uses PerfTracker for timing                                 */
/*   - Uses SmartStorage for user cache                            */
/*   - Uses ApiCache for Firebase queries                          */
/*   - Uses BuonoPageBuilder for tabs/toolbar/sub-tabs            */
/*   - Defines callbacks: onTabChange, onSubTabChange, onSearch   */
/* ═══════════════════════════════════════════════════════════════ */

(function(window, document) {
    'use strict';

    // ═══════════════════════════════════════════
    // 📋 SECTION 1: STATE
    // ═══════════════════════════════════════════
    let allEmployees = [];
    let visibleEmployees = [];
    let deleteDocId = '';
    let currentUser = null;
    let myPerms = null;
    let unsubscribeListener = null;
    
    // Pagination
    const EMP_PAGE_SIZE = 50;
    let empDisplayed = 0;
    let lastRenderList = [];
    
    // Filters
    let currentSearchText = '';
    let currentSubTabFilter = 'all';
    
    // Constants
    const PERM_KEYS = ['add', 'view', 'selfView', 'edit', 'delete'];
    const USER_CACHE_KEY = 'employees_user_v1';
    const CACHE_DURATION_MS = 5 * 60 * 1000;
    const IDX_DATABASES = (typeof DATABASES !== 'undefined') ? DATABASES : [];

    // ═══════════════════════════════════════════
    // 📋 SECTION 2: LOGGER
    // ═══════════════════════════════════════════
    function log(...args) {
        console.log('[Employees]', ...args);
    }
    
    function warn(...args) {
        console.warn('[Employees]', ...args);
    }
    
    function error(...args) {
        console.error('[Employees]', ...args);
    }
    
    function perfStart(label) {
        if (window.PerfTracker) {
            try { window.PerfTracker.start(label); } catch(e) {}
        }
    }
    
    function perfEnd(label) {
        if (window.PerfTracker) {
            try { window.PerfTracker.end(label); } catch(e) {}
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 3: CACHE HELPERS
    // ═══════════════════════════════════════════
    function cacheSet(key, data) {
        if (window.SmartStorage) {
            try {
                window.SmartStorage.set(key, data, CACHE_DURATION_MS);
                return true;
            } catch(e) {}
        }
        // Fallback to sessionStorage
        try {
            sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
        } catch(e) {}
        return false;
    }
    
    function cacheGet(key) {
        if (window.SmartStorage) {
            try {
                const data = window.SmartStorage.get(key);
                if (data) return data;
            } catch(e) {}
        }
        // Fallback to sessionStorage
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts > CACHE_DURATION_MS) {
                sessionStorage.removeItem(key);
                return null;
            }
            return data;
        } catch(e) { return null; }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 4: AUTH CHECK
    // ═══════════════════════════════════════════
    function checkAuth() {
        const user = sessionStorage.getItem('loggedInUser');
        if (!user) {
            window.location.replace('../../../welcome.html');
            return false;
        }
        return true;
    }
    
    window.logout = function() {
        if (confirm('🚪 Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = '../../../login.html';
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 5: WAIT FOR FIREBASE
    // ═══════════════════════════════════════════
    function waitForFirebase(callback, retries = 0) {
        if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
            callback();
            return;
        }
        if (retries > 50) {
            error('Firebase failed to load!');
            return;
        }
        setTimeout(() => waitForFirebase(callback, retries + 1), 100);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 6: MAIN INIT
    // ═══════════════════════════════════════════
    async function initEmployees() {
        perfStart('Employees Init');
        
        if (!checkAuth()) return;
        
        const user = sessionStorage.getItem('loggedInUser');
        const userData = JSON.parse(user);
        
        // Try cache first
        const cached = cacheGet(USER_CACHE_KEY);
        if (cached) {
            log('✅ Using cached user');
            userData.access = cached.access;
            userData.permissions = cached.permissions;
            userData.name = cached.name;
            userData.nickname = cached.nickname;
            applyUserData(userData);
            refreshUserBackground(userData.id);
        } else {
            perfStart('Firebase User Fetch');
            try {
                const userDoc = await db.collection('employees').doc(userData.id).get();
                if (userDoc.exists) {
                    const d = userDoc.data();
                    userData.access = d.access;
                    userData.permissions = d.permissions || {};
                    userData.name = d.name;
                    userData.nickname = d.nickname;
                    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
                    cacheSet(USER_CACHE_KEY, {
                        access: userData.access,
                        permissions: userData.permissions,
                        name: userData.name,
                        nickname: userData.nickname
                    });
                }
            } catch(e) {
                error('Firebase fetch failed:', e);
            }
            perfEnd('Firebase User Fetch');
            applyUserData(userData);
        }
        
        perfEnd('Employees Init');
    }
    
    async function refreshUserBackground(uid) {
        try {
            const userDoc = await db.collection('employees').doc(uid).get();
            if (userDoc.exists) {
                const d = userDoc.data();
                cacheSet(USER_CACHE_KEY, {
                    access: d.access,
                    permissions: d.permissions || {},
                    name: d.name,
                    nickname: d.nickname
                });
            }
        } catch(e) {}
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 7: APPLY USER DATA
    // ═══════════════════════════════════════════
    function applyUserData(userData) {
        const isAdmin = userData.access === 'Admin';
        const perms = userData.permissions?.employeeDB || {};
        const hasAccess = isAdmin || perms.add || perms.view ||
                          perms.selfView || perms.edit || perms.delete;
        
        if (!hasAccess) {
            alert('⛔ You do not have access to this page!');
            window.location.href = '../../../access.html';
            return;
        }
        
        myPerms = isAdmin
            ? { add: true, view: true, selfView: true, edit: true, delete: true }
            : perms;
        currentUser = userData;
        
        // Update topbar welcome (handled by PageBuilder, but refresh)
        if (window.BuonoPageBuilder) {
            window.BuonoPageBuilder.updateWelcomeMessage();
        }
        
        // Fill overview stats
        fillOverviewStats();
        
        // Build permissions UI in modal
        buildPermissionsUI();
        
        // Show/hide add button based on permission
        const addBtn = document.getElementById('addEmployeeBtn');
        if (addBtn && !myPerms.add) {
            addBtn.style.display = 'none';
        }
        
        const quickAddBtn = document.getElementById('quickAddBtn');
        if (quickAddBtn && myPerms.add) {
            quickAddBtn.style.display = 'inline-flex';
        }
        
        // Update title based on permissions
        const titleEl = document.getElementById('empListTitle');
        if (titleEl) {
            if (myPerms.view) {
                titleEl.textContent = '👥 All Employees';
            } else if (myPerms.selfView) {
                titleEl.textContent = '👤 My Profile';
            }
        }
        
        // Start Firebase listener
        startEmployeeListener();
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 8: OVERVIEW STATS
    // ═══════════════════════════════════════════
    function fillOverviewStats() {
        const myAccessEl = document.getElementById('myAccess');
        if (myAccessEl && currentUser) {
            myAccessEl.textContent = currentUser.access || '--';
        }
        
        const totalEl = document.getElementById('totalEmployees');
        if (totalEl) totalEl.textContent = '0';
        
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }
    
    function updateDateTime() {
        const now = new Date();
        
        const dateEl = document.getElementById('todayDate');
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit'
            });
        }
        
        const timeEl = document.getElementById('currentTime');
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 9: BUILD PERMISSIONS UI
    // ═══════════════════════════════════════════
    function buildPermissionsUI() {
        const container = document.getElementById('permissionsContainer');
        if (!container) return;
        
        if (IDX_DATABASES.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); padding: 12px;">No databases configured</p>';
            return;
        }
        
        container.innerHTML = IDX_DATABASES.map(d => buildPermissionBlock(d)).join('');
    }
    
    function buildPermissionBlock(database) {
        const prefix = database.permPrefix;
        const borderStyle = database.permBorderColor
            ? ` style="border: 2px solid ${database.permBorderColor};"` : '';
        const titleStyle = database.permTitleColor
            ? ` style="color: ${database.permTitleColor};"` : '';
        const subtitle = database.permSubtitle
            ? ` <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">${database.permSubtitle}</span>` 
            : '';
        const editLabel = database.permEditLabel || '✏️ Edit';
        
        return `
            <div class="permission-block"${borderStyle}>
                <div class="permission-block-title"${titleStyle}>
                    ${database.icon} ${database.name}${subtitle}
                </div>
                <div class="permission-checkboxes">
                    <label class="perm-checkbox">
                        <input type="checkbox" id="${prefix}_add" onchange="autoCheckSelfView('${prefix}')">
                        <span>➕ Add Data</span>
                    </label>
                    <label class="perm-checkbox">
                        <input type="checkbox" id="${prefix}_view" onchange="autoCheckSelfView('${prefix}')">
                        <span>👁️ View All</span>
                    </label>
                    <label class="perm-checkbox">
                        <input type="checkbox" id="${prefix}_selfView">
                        <span>👤 Self View</span>
                    </label>
                    <label class="perm-checkbox">
                        <input type="checkbox" id="${prefix}_edit">
                        <span>${editLabel}</span>
                    </label>
                    <label class="perm-checkbox">
                        <input type="checkbox" id="${prefix}_delete">
                        <span>🗑️ Delete</span>
                    </label>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 10: FIREBASE LISTENER
    // ═══════════════════════════════════════════
    function startEmployeeListener() {
        perfStart('Employees Snapshot');
        
        if (unsubscribeListener) {
            unsubscribeListener();
        }
        
        unsubscribeListener = db.collection('employees')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                allEmployees = [];
                snapshot.forEach((doc) => {
                    allEmployees.push({ id: doc.id, ...doc.data() });
                });
                
                // Filter based on permissions
                if (myPerms.view) {
                    visibleEmployees = allEmployees;
                } else if (myPerms.selfView) {
                    visibleEmployees = allEmployees.filter(emp => emp.id === currentUser.id);
                }
                
                // Update stats
                updateAllStats();
                
                // Re-render with current filters
                applyFiltersAndRender();
                
                perfEnd('Employees Snapshot');
            }, (err) => {
                error('Snapshot error:', err);
            });
    }
    
    function updateAllStats() {
        // Overview total
        const totalEl = document.getElementById('totalEmployees');
        if (totalEl) totalEl.textContent = visibleEmployees.length;
        
        // Active today (TODO: implement based on attendance data)
        const activeTodayEl = document.getElementById('activeToday');
        if (activeTodayEl) activeTodayEl.textContent = visibleEmployees.length;
        
        // Tab badge counter
        const badgeEl = document.getElementById('empCountBadge');
        if (badgeEl) badgeEl.textContent = visibleEmployees.length;
        
        // Sub-tab counts (Active / Suspended / Leavers)
        updateSubTabCounts();
    }
    
    function updateSubTabCounts() {
        if (!window.BuonoPageBuilder) return;
        
        const counts = {
            all: visibleEmployees.length,
            active: visibleEmployees.filter(e => !e.status || e.status === 'active').length,
            suspended: visibleEmployees.filter(e => e.status === 'suspended').length,
            leavers: visibleEmployees.filter(e => e.status === 'leaver').length
        };
        
        window.BuonoPageBuilder.updateSubTabCounts('employees', counts);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 11: FILTERS + RENDER
    // ═══════════════════════════════════════════
    function applyFiltersAndRender() {
        let filtered = [...visibleEmployees];
        
        // Apply sub-tab filter
        if (currentSubTabFilter && currentSubTabFilter !== 'all') {
            filtered = filtered.filter(emp => {
                if (currentSubTabFilter === 'active') {
                    return !emp.status || emp.status === 'active';
                }
                return emp.status === currentSubTabFilter;
            });
        }
        
        // Apply search filter
        if (currentSearchText) {
            const search = currentSearchText.toLowerCase();
            filtered = filtered.filter(emp =>
                (emp.name || '').toLowerCase().includes(search) ||
                (emp.nickname || '').toLowerCase().includes(search) ||
                (emp.access || '').toLowerCase().includes(search)
            );
        }
        
        renderEmployees(filtered);
    }
    
    function renderEmployees(employees) {
        lastRenderList = employees;
        const tbody = document.getElementById('employeeTableBody');
        if (!tbody) return;
        
        if (employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 60px 20px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">📭</div>
                        <div style="color: var(--text-secondary); font-size: 16px; font-weight: 600; margin-bottom: 4px;">
                            No employees found
                        </div>
                        <div style="color: var(--text-muted); font-size: 13px;">
                            Try adjusting your search or filters
                        </div>
                    </td>
                </tr>
            `;
            const paginationWrap = document.getElementById('empPaginationWrap');
            if (paginationWrap) paginationWrap.style.display = 'none';
            return;
        }
        
        if (empDisplayed === 0) empDisplayed = EMP_PAGE_SIZE;
        const toShow = employees.slice(0, empDisplayed);
        
        let html = '';
        let count = 0;
        
        toShow.forEach((emp) => {
            count++;
            const badgeClass = getBadgeClass(emp.access);
            const permCount = getPermissionCount(emp.permissions);
            const permColor = emp.access === 'Admin'
                ? 'var(--color-success)'
                : (permCount > 0 ? 'var(--gold-primary)' : 'var(--text-muted)');
            const permText = emp.access === 'Admin'
                ? '🌟 ALL (Admin)'
                : `🔐 ${permCount} permissions`;
            
            let actionsHtml = '<div style="display: flex; gap: 6px;">';
            if (myPerms.edit) {
                actionsHtml += `
                    <button class="toolbar-btn toolbar-btn-secondary" 
                            style="padding: 6px 12px; font-size: 12px;"
                            onclick="editEmployee('${emp.id}')">
                        ✏️ Edit
                    </button>
                `;
            }
            if (myPerms.delete && myPerms.view) {
                actionsHtml += `
                    <button class="toolbar-btn toolbar-btn-danger" 
                            style="padding: 6px 12px; font-size: 12px;"
                            onclick="openDeleteModal('${emp.id}', '${escapeQuotes(emp.name)}')">
                        🗑️
                    </button>
                `;
            }
            actionsHtml += '</div>';
            
            if (!myPerms.edit && !myPerms.delete) {
                actionsHtml = `<span style="color: var(--text-muted); font-size: 12px;">View only</span>`;
            }
            
            const cellStyle = 'padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); font-size: 13px; color: var(--text-primary);';
            
            html += `
                <tr style="transition: background 0.2s;" 
                    onmouseover="this.style.background='rgba(212,175,55,0.05)'" 
                    onmouseout="this.style.background='transparent'">
                    <td data-label="#" style="${cellStyle} color: var(--text-muted);">${count}</td>
                    <td data-label="Name" style="${cellStyle} font-weight: 600;">${emp.name || '-'}</td>
                    <td data-label="Nickname" style="${cellStyle} color: var(--text-secondary);">${emp.nickname || '-'}</td>
                    <td data-label="Access" style="${cellStyle}">
                        <span class="badge ${badgeClass}">${emp.access || '-'}</span>
                    </td>
                    <td data-label="Permissions" style="${cellStyle} color: ${permColor}; font-weight: 600;">
                        ${permText}
                    </td>
                    <td data-label="Actions" style="${cellStyle}">${actionsHtml}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Pagination
        const paginationWrap = document.getElementById('empPaginationWrap');
        const counter = document.getElementById('empCounter');
        const loadMoreBtn = document.getElementById('btnLoadMoreEmp');
        const total = employees.length;
        const shown = toShow.length;
        
        if (paginationWrap) {
            if (total > EMP_PAGE_SIZE) {
                paginationWrap.style.display = 'block';
                if (shown >= total) {
                    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                    if (counter) counter.textContent = `✅ All ${total} loaded`;
                } else {
                    if (loadMoreBtn) {
                        loadMoreBtn.style.display = 'inline-flex';
                        loadMoreBtn.textContent = `⬇️ Load More (${total - shown} remaining)`;
                    }
                    if (counter) counter.textContent = `Showing ${shown} of ${total}`;
                }
            } else {
                paginationWrap.style.display = 'none';
            }
        }
    }
    
    window.loadMoreEmployees = function() {
        empDisplayed += EMP_PAGE_SIZE;
        renderEmployees(lastRenderList);
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 12: HELPER FUNCTIONS
    // ═══════════════════════════════════════════
    function escapeQuotes(str) {
        return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }
    
    function getBadgeClass(access) {
        switch (access) {
            case 'Admin':              return 'badge-admin';
            case 'Manager':            return 'badge-manager';
            case 'Cashier':            return 'badge-cashier';
            case 'Purchasing Officer': return 'badge-purchasing';
            case 'Head Chef':          return 'badge-chef';
            case 'Call Operator':      return 'badge-operator';
            case 'Waiter':             return 'badge-waiter';
            default:                   return 'badge-default';
        }
    }
    
    function getPermissionCount(permissions) {
        if (!permissions) return 0;
        let count = 0;
        Object.keys(permissions).forEach(dbKey => {
            Object.keys(permissions[dbKey]).forEach(perm => {
                if (permissions[dbKey][perm] === true) count++;
            });
        });
        return count;
    }
    
    function setChecked(id, value) {
        const el = document.getElementById(id);
        if (el) el.checked = value || false;
    }
    
    function getChecked(id) {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    }
    
    function checkAllPermissions(checked) {
        IDX_DATABASES.forEach(d => {
            PERM_KEYS.forEach(key => {
                const cb = document.getElementById(`${d.permPrefix}_${key}`);
                if (cb) cb.checked = checked;
            });
        });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 13: MODAL HELPERS
    // ═══════════════════════════════════════════
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }
    
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 14: PERMISSION CHECKBOX HELPERS
    // ═══════════════════════════════════════════
    window.autoCheckSelfView = function(prefix) {
        const addCheck = document.getElementById(prefix + '_add');
        const viewCheck = document.getElementById(prefix + '_view');
        const selfViewCheck = document.getElementById(prefix + '_selfView');
        if (addCheck && viewCheck && selfViewCheck) {
            if (addCheck.checked || viewCheck.checked) {
                selfViewCheck.checked = true;
            }
        }
    };
    
    window.handleAccessChange = function() {
        const access = document.getElementById('empAccess').value;
        const permissionsSection = document.getElementById('permissionsSection');
        
        if (access === 'Admin') {
            checkAllPermissions(true);
            if (permissionsSection) {
                permissionsSection.style.opacity = '0.6';
                permissionsSection.style.pointerEvents = 'none';
            }
            return;
        }
        
        checkAllPermissions(false);
        if (permissionsSection) {
            permissionsSection.style.opacity = '1';
            permissionsSection.style.pointerEvents = 'auto';
        }
        
        // Apply role defaults
        IDX_DATABASES.forEach(d => {
            const roleDefaults = d.defaultPermsForRole && d.defaultPermsForRole[access];
            if (roleDefaults) {
                PERM_KEYS.forEach(key => {
                    if (roleDefaults[key]) {
                        setChecked(`${d.permPrefix}_${key}`, true);
                    }
                });
            }
        });
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 15: ADD / EDIT MODAL
    // ═══════════════════════════════════════════
    window.openAddModal = function() {
        if (!myPerms.add) {
            alert('⛔ You do not have permission to add employees!');
            return;
        }
        
        document.getElementById('modalTitle').textContent = '➕ Add New Employee';
        document.getElementById('saveBtn').textContent = '💾 Save';
        document.getElementById('empName').value = '';
        document.getElementById('empNickname').value = '';
        document.getElementById('empPassword').value = '';
        document.getElementById('empAccess').value = '';
        document.getElementById('editDocId').value = '';
        
        checkAllPermissions(false);
        
        const permSection = document.getElementById('permissionsSection');
        if (permSection) {
            permSection.style.opacity = '1';
            permSection.style.pointerEvents = 'auto';
        }
        
        showModal('employeeModal');
    };
    
    window.editEmployee = function(docId) {
        const emp = allEmployees.find(e => e.id === docId);
        if (!emp) return;
        
        if (!myPerms.view && emp.id !== currentUser.id) {
            alert('⛔ You do not have permission to edit this employee!');
            return;
        }
        
        document.getElementById('modalTitle').textContent = '✏️ Edit Employee';
        document.getElementById('saveBtn').textContent = '💾 Update';
        document.getElementById('empName').value = emp.name || '';
        document.getElementById('empNickname').value = emp.nickname || '';
        document.getElementById('empPassword').value = emp.password || '';
        document.getElementById('empAccess').value = emp.access || '';
        document.getElementById('editDocId').value = docId;
        
        checkAllPermissions(false);
        
        if (emp.permissions) {
            IDX_DATABASES.forEach(d => {
                const dbPerms = emp.permissions[d.id];
                if (dbPerms) {
                    PERM_KEYS.forEach(key => {
                        setChecked(`${d.permPrefix}_${key}`, dbPerms[key]);
                    });
                }
            });
        }
        
        window.handleAccessChange();
        
        // Restrict if not admin/manager
        if (currentUser.access !== 'Admin' && currentUser.access !== 'Manager') {
            document.getElementById('empAccess').disabled = true;
            const permSection = document.getElementById('permissionsSection');
            if (permSection) {
                permSection.style.opacity = '0.5';
                permSection.style.pointerEvents = 'none';
            }
        } else {
            document.getElementById('empAccess').disabled = false;
        }
        
        showModal('employeeModal');
    };
    
    window.closeModal = function() {
        hideModal('employeeModal');
        document.getElementById('empAccess').disabled = false;
    };
    
    window.saveEmployee = async function() {
        const name = document.getElementById('empName').value.trim();
        const nickname = document.getElementById('empNickname').value.trim();
        const password = document.getElementById('empPassword').value.trim();
        const access = document.getElementById('empAccess').value;
        const editDocId = document.getElementById('editDocId').value;
        
        if (!name || !nickname || !password || !access) {
            alert('⚠️ Please fill all required fields!');
            return;
        }
        
        // Build permissions object
        const permissions = {};
        IDX_DATABASES.forEach(d => {
            const dbPerms = {};
            PERM_KEYS.forEach(key => {
                dbPerms[key] = getChecked(`${d.permPrefix}_${key}`);
            });
            permissions[d.id] = dbPerms;
        });
        
        // Admin gets all permissions
        if (access === 'Admin') {
            Object.keys(permissions).forEach(dbKey => {
                Object.keys(permissions[dbKey]).forEach(permKey => {
                    permissions[dbKey][permKey] = true;
                });
            });
        }
        
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Saving...';
        
        perfStart('Save Employee');
        
        try {
            if (editDocId) {
                // UPDATE
                if (currentUser.access !== 'Admin' && currentUser.access !== 'Manager') {
                    // Restricted users can only update basic info
                    await db.collection('employees').doc(editDocId).update({
                        name, nickname, password
                    });
                } else {
                    await db.collection('employees').doc(editDocId).update({
                        name, nickname, password, access, permissions
                    });
                }
                alert('✅ Employee updated successfully!');
            } else {
                // CREATE - check for duplicate nickname
                const existCheck = await db.collection('employees')
                    .where('nickname', '==', nickname).get();
                
                if (!existCheck.empty) {
                    alert('⚠️ Nickname already exists! Please choose another.');
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText;
                    perfEnd('Save Employee');
                    return;
                }
                
                await db.collection('employees').add({
                    name, nickname, password, access, permissions,
                    status: 'active',
                    createdAt: typeof getServerTimestamp === 'function' 
                        ? getServerTimestamp() 
                        : firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('✅ Employee added successfully!');
            }
            
            // Invalidate cache
            if (window.ApiCache) {
                window.ApiCache.invalidate('employees');
            }
            
            window.closeModal();
        } catch(err) {
            error('Save error:', err);
            alert('❌ Error: ' + err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            perfEnd('Save Employee');
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 16: DELETE MODAL
    // ═══════════════════════════════════════════
    window.openDeleteModal = function(docId, name) {
        if (!myPerms.delete) {
            alert('⛔ You do not have permission to delete employees!');
            return;
        }
        
        if (docId === currentUser.id) {
            alert('⛔ You cannot delete your own profile!');
            return;
        }
        
        deleteDocId = docId;
        document.getElementById('deleteEmpName').textContent = name;
        showModal('deleteModal');
    };
    
    window.closeDeleteModal = function() {
        hideModal('deleteModal');
        deleteDocId = '';
    };
    
    window.confirmDelete = async function() {
        if (!deleteDocId) return;
        
        perfStart('Delete Employee');
        
        try {
            await db.collection('employees').doc(deleteDocId).delete();
            
            // Invalidate cache
            if (window.ApiCache) {
                window.ApiCache.invalidate('employees');
            }
            
            alert('✅ Employee deleted successfully!');
            window.closeDeleteModal();
        } catch(err) {
            error('Delete error:', err);
            alert('❌ Error: ' + err.message);
        } finally {
            perfEnd('Delete Employee');
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 17: PAGE BUILDER CALLBACKS
    // (Called by buono-page-builder.js)
    // ═══════════════════════════════════════════
    
    // Called when user clicks a main tab
    window.onTabChange = function(tabId, tabConfig) {
        log(`Tab changed: ${tabId}`);
        
        // Reset sub-tab filter when switching tabs
        if (tabId !== 'employees') {
            currentSubTabFilter = 'all';
        }
        
        // Auto-focus search if tab has toolbar
        if (tabId === 'employees') {
            setTimeout(() => {
                const search = document.getElementById('employeeSearch');
                if (search && !document.activeElement.matches('input')) {
                    // Don't auto-focus - might be annoying
                }
            }, 100);
        }
    };
    
    // Called when user clicks a sub-tab (filter chip)
    window.onSubTabChange = function(subTabId, filter, tabId) {
        log(`Sub-tab changed: ${tabId} → ${subTabId} (filter: ${filter})`);
        
        if (tabId !== 'employees') return;
        
        currentSubTabFilter = filter || subTabId;
        empDisplayed = EMP_PAGE_SIZE; // Reset pagination
        applyFiltersAndRender();
    };
    
    // Called when user types in search
    window.onSearch = function(value, tabId) {
        log(`Search: "${value}" in tab "${tabId}"`);
        
        if (tabId !== 'employees') return;
        
        currentSearchText = value || '';
        empDisplayed = currentSearchText 
            ? Number.MAX_SAFE_INTEGER  // Show all results when searching
            : EMP_PAGE_SIZE;
        applyFiltersAndRender();
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 18: PLACEHOLDER FUNCTIONS
    // (For future tabs - prevent errors)
    // ═══════════════════════════════════════════
    window.exportAttendance = function() {
        alert('🚧 Attendance export coming soon!');
    };
    
    window.openSalaryModal = function() {
        alert('🚧 Salary module coming soon!');
    };
    
    window.openDateRangeModal = function() {
        alert('🚧 Date range picker coming soon!');
    };
    
    window.exportReport = function() {
        alert('🚧 Report export coming soon!');
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 19: MODAL OUTSIDE CLICK + ESC
    // ═══════════════════════════════════════════
    document.addEventListener('click', function(event) {
        if (event.target.classList && event.target.classList.contains('modal-overlay')) {
            event.target.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay.show');
            openModals.forEach(m => {
                m.classList.remove('show');
                document.body.classList.remove('modal-open');
            });
        }
    });

    // ═══════════════════════════════════════════
    // 🚀 SECTION 20: AUTO-INIT
    // ═══════════════════════════════════════════
    
    // Listen for page ready event from BuonoPageBuilder
    document.addEventListener('buono:page-ready', function(e) {
        log('🎬 Page ready event received');
        waitForFirebase(initEmployees);
    }, { once: true });
    
    // Fallback: If page builder isn't loaded, init directly
    setTimeout(function() {
        if (!currentUser) {
            log('⚠️ Fallback init (page-ready event not received)');
            waitForFirebase(initEmployees);
        }
    }, 2000);

    log('📄 Script loaded, waiting for page ready...');

})(window, document);

/* ═══════════════════════════════════════════════════════════════ */
/* 🏁 END OF EMPLOYEES-SCRIPT.JS v1.0                              */
/* Lines: ~850                                                     */
/* Sections: 20                                                    */
/* ═══════════════════════════════════════════════════════════════ */