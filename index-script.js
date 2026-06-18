// ═══════════════════════════════════════════════════════════
// 🍴 BUONO - EMPLOYEE DATABASE (HR Module)
// File: index-script.js
// Version: 3.3 - Section Nav Smooth Scroll Fix
// ═══════════════════════════════════════════════════════════

window.initIndex = function () {
    'use strict';

    let allEmployees = [];
    let deleteDocId = '';
    let currentUser = null;
    let myPerms = null;

    const EMP_PAGE_SIZE = 50;
    let empDisplayed = 0;
    let lastRenderList = [];
    let searchTimer = null;

    const PERM_KEYS = ['add', 'view', 'selfView', 'edit', 'delete'];
    const USER_CACHE_KEY = 'buono_index_user_v1';
    const CACHE_DURATION_MS = 5 * 60 * 1000;
    const IDX_DATABASES = (typeof DATABASES !== 'undefined') ? DATABASES : [];

    const Perf = {
        _marks: {},
        start(label) { this._marks[label] = performance.now(); },
        end(label) {
            const t = performance.now() - (this._marks[label] || 0);
            console.log(`⚡ [Index] ${label}: ${t.toFixed(1)}ms`);
            return t;
        }
    };

    function cacheSet(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
        } catch (e) {}
    }

    function cacheGet(key, maxAge) {
        try {
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts > maxAge) {
                sessionStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (e) { return null; }
    }

    // ═══════════════════════════════════════════════════════════
    // 🪟 MODAL HELPERS (with body scroll lock)
    // ═══════════════════════════════════════════════════════════
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }
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

    function hidePageLoader() {
        document.body.classList.add('buono-ready');
        const loader = document.getElementById('pageLoader');
        setTimeout(() => {
            if (loader) loader.classList.add('hidden');
        }, 400);
    }

    function waitForFirebase(callback, retries = 0) {
        if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
            callback();
            return;
        }
        if (retries > 50) {
            console.error('❌ [Index] Firebase failed!');
            hidePageLoader();
            return;
        }
        setTimeout(() => waitForFirebase(callback, retries + 1), 100);
    }

    function checkAuth() {
        const user = sessionStorage.getItem('loggedInUser');
        const student = sessionStorage.getItem('loggedInStudent');
        if (!user && !student) {
            window.location.replace('welcome.html');
            return false;
        }
        if (!user) {
            window.location.replace('login.html');
            return false;
        }
        return true;
    }

    window.logout = function () {
        if (confirm('🚪 Logout?')) {
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    };

    async function initializeApp() {
        Perf.start('Total Init');

        if (!checkAuth()) return;

        const user = sessionStorage.getItem('loggedInUser');
        const userData = JSON.parse(user);

        const cached = cacheGet(USER_CACHE_KEY, CACHE_DURATION_MS);
        if (cached) {
            console.log('✅ [Index] Using cached user');
            userData.access = cached.access;
            userData.permissions = cached.permissions;
            userData.name = cached.name;
            userData.nickname = cached.nickname;
            applyUserData(userData);
            refreshUserBackground(userData.id);
        } else {
            Perf.start('Firebase User Fetch');
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
            } catch (e) {
                console.error(e);
            }
            Perf.end('Firebase User Fetch');
            applyUserData(userData);
        }

        Perf.end('Total Init');
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
        } catch (e) {}
    }

    function applyUserData(userData) {
        const isAdmin = userData.access === 'Admin';
        const perms = userData.permissions?.employeeDB || {};
        const hasAccess = isAdmin || perms.add || perms.view ||
                          perms.selfView || perms.edit || perms.delete;

        if (!hasAccess) {
            alert('⛔ No access!');
            window.location.href = 'access.html';
            return;
        }

        myPerms = isAdmin
            ? { add: true, view: true, selfView: true, edit: true, delete: true }
            : perms;
        currentUser = userData;

        const welcomeEl = document.getElementById('welcomeUser');
        if (welcomeEl) {
            welcomeEl.textContent = `👋 Welcome, ${userData.name} (${userData.access})`;
        }

        fillStatCards();
        buildPermissionsUI();
        setupActionButtons();
        revealPage();
        startEmployeeListener();
    }

    function revealPage() {
        hidePageLoader();
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, i) => {
            setTimeout(() => card.classList.add('visible'), 200 + i * 80);
        });
    }

    function fillStatCards() {
        document.getElementById('totalEmployees').textContent = '0';

        const now = new Date();
        document.getElementById('todayDate').textContent = now.toLocaleDateString('en-US', {
            month: 'short', day: '2-digit'
        });
        document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });
        document.getElementById('myAccess').textContent = currentUser.access;
    }

    function updateDateTime() {
        const now = new Date();
        const dateEl = document.getElementById('todayDate');
        if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {
            month: 'short', day: '2-digit'
        });
        const timeEl = document.getElementById('currentTime');
        if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });
    }
    setInterval(updateDateTime, 1000);

    function buildPermissionsUI() {
        const container = document.getElementById('permissionsContainer');
        if (!container) return;
        container.innerHTML = IDX_DATABASES.map(d => buildPermissionBlock(d)).join('');
    }

    function buildPermissionBlock(database) {
        const prefix = database.permPrefix;
        const borderStyle = database.permBorderColor
            ? ` style="border: 2px solid ${database.permBorderColor};"` : '';
        const titleStyle = database.permTitleColor
            ? ` style="color: ${database.permTitleColor};"` : '';
        const subtitle = database.permSubtitle
            ? ` <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">${database.permSubtitle}</span>` : '';
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

    function getBadgeClass(access) {
        switch (access) {
            case 'Admin':              return 'badge-red';
            case 'Manager':            return 'badge-blue';
            case 'Cashier':            return 'badge-green';
            case 'Purchasing Officer': return 'badge-orange';
            case 'Head Chef':          return 'badge-purple';
            case 'Call Operator':      return 'badge-blue';
            case 'Waiter':             return 'badge-gray';
            default:                   return 'badge-gray';
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

    function setupActionButtons() {
        if (myPerms.add) {
            const addBtn = document.getElementById('addBtn');
            if (addBtn) addBtn.style.display = 'inline-flex';

            const addLink = document.getElementById('addSectionLink');
            if (addLink) addLink.style.display = 'none';
        }

        if (myPerms.view) {
            document.getElementById('empListTitle').textContent = '👥 All Employees';
        } else if (myPerms.selfView) {
            document.getElementById('empListTitle').textContent = '👤 My Profile';
            const searchBar = document.getElementById('searchBar');
            if (searchBar) searchBar.style.display = 'none';
        }
    }

    function startEmployeeListener() {
        Perf.start('Employees Snapshot');
        db.collection('employees').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
            allEmployees = [];
            snapshot.forEach((doc) => {
                allEmployees.push({ id: doc.id, ...doc.data() });
            });

            let visibleEmployees = [];
            if (myPerms.view) {
                visibleEmployees = allEmployees;
            } else if (myPerms.selfView) {
                visibleEmployees = allEmployees.filter(emp => emp.id === currentUser.id);
            }

            const totalEl = document.getElementById('totalEmployees');
            if (totalEl) totalEl.textContent = visibleEmployees.length;

            const badgeEl = document.getElementById('empCountBadge');
            if (badgeEl) badgeEl.textContent = visibleEmployees.length;

            renderEmployees(visibleEmployees);
            Perf.end('Employees Snapshot');
        });
    }

    function renderEmployees(employees) {
        lastRenderList = employees;
        const tbody = document.getElementById('employeeTableBody');

        if (employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-title">No employees found</div>
                            <div class="empty-state-text">Try adjusting your search</div>
                        </div>
                    </td>
                </tr>`;
            document.getElementById('empPaginationWrap').style.display = 'none';
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

            let actionsHtml = '<div class="action-buttons">';
            if (myPerms.edit) {
                actionsHtml += `<button class="btn btn-secondary btn-sm" onclick="editEmployee('${emp.id}')">✏️ Edit</button>`;
            }
            if (myPerms.delete && myPerms.view) {
                actionsHtml += `<button class="btn btn-danger btn-sm" onclick="openDeleteModal('${emp.id}', '${escapeQuotes(emp.name)}')">🗑️ Delete</button>`;
            }
            actionsHtml += '</div>';
            if (!myPerms.edit && !myPerms.delete) {
                actionsHtml = `<span style="color: var(--text-muted); font-size:12px;">View only</span>`;
            }

            html += `
                <tr>
                    <td data-label="#">${count}</td>
                    <td data-label="Name">${emp.name}</td>
                    <td data-label="Nickname">${emp.nickname}</td>
                    <td data-label="Access"><span class="badge ${badgeClass}">${emp.access}</span></td>
                    <td data-label="Permissions" style="color: ${permColor}; font-size: 13px; font-weight: 600;">${permText}</td>
                    <td data-label="Actions">${actionsHtml}</td>
                </tr>`;
        });

        tbody.innerHTML = html;

        const paginationWrap = document.getElementById('empPaginationWrap');
        const counter = document.getElementById('empCounter');
        const loadMoreBtn = document.getElementById('btnLoadMoreEmp');
        const total = employees.length;
        const shown = toShow.length;

        if (total > EMP_PAGE_SIZE) {
            paginationWrap.style.display = 'block';
            if (shown >= total) {
                loadMoreBtn.style.display = 'none';
                counter.textContent = `✅ All ${total} loaded`;
            } else {
                loadMoreBtn.style.display = 'inline-flex';
                counter.textContent = `Showing ${shown} of ${total}`;
                loadMoreBtn.textContent = `⬇️ Load More (${total - shown} remaining)`;
            }
        } else {
            paginationWrap.style.display = 'none';
        }
    }

    window.loadMoreEmployees = function () {
        empDisplayed += EMP_PAGE_SIZE;
        renderEmployees(lastRenderList);
    };

    function escapeQuotes(str) {
        return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    window.onSearchKeyup = function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(searchEmployees, 200);
    };

    function searchEmployees() {
        const searchText = document.getElementById('searchEmployee').value.toLowerCase();
        let visible = myPerms.view
            ? allEmployees
            : allEmployees.filter(e => e.id === currentUser.id);

        if (!searchText) {
            empDisplayed = EMP_PAGE_SIZE;
            renderEmployees(visible);
            return;
        }

        const filtered = visible.filter(emp =>
            (emp.name || '').toLowerCase().includes(searchText) ||
            (emp.nickname || '').toLowerCase().includes(searchText) ||
            (emp.access || '').toLowerCase().includes(searchText)
        );

        empDisplayed = filtered.length;
        renderEmployees(filtered);
    }

    window.autoCheckSelfView = function (prefix) {
        const addCheck = document.getElementById(prefix + '_add');
        const viewCheck = document.getElementById(prefix + '_view');
        const selfViewCheck = document.getElementById(prefix + '_selfView');
        if (addCheck && viewCheck && selfViewCheck) {
            if (addCheck.checked || viewCheck.checked) selfViewCheck.checked = true;
        }
    };

    window.handleAccessChange = function () {
        const access = document.getElementById('empAccess').value;
        const permissionsSection = document.getElementById('permissionsSection');

        if (access === 'Admin') {
            checkAllPermissions(true);
            permissionsSection.style.opacity = '0.6';
            permissionsSection.style.pointerEvents = 'none';
            return;
        }

        checkAllPermissions(false);
        permissionsSection.style.opacity = '1';
        permissionsSection.style.pointerEvents = 'auto';

        IDX_DATABASES.forEach(d => {
            const roleDefaults = d.defaultPermsForRole && d.defaultPermsForRole[access];
            if (roleDefaults) {
                PERM_KEYS.forEach(key => {
                    if (roleDefaults[key]) setChecked(`${d.permPrefix}_${key}`, true);
                });
            }
        });
    };

    function checkAllPermissions(checked) {
        IDX_DATABASES.forEach(d => {
            PERM_KEYS.forEach(key => {
                const cb = document.getElementById(`${d.permPrefix}_${key}`);
                if (cb) cb.checked = checked;
            });
        });
    }

    window.openAddModal = function () {
        document.getElementById('modalTitle').textContent = '➕ Add New Employee';
        document.getElementById('saveBtn').textContent = '💾 Save';
        document.getElementById('empName').value = '';
        document.getElementById('empNickname').value = '';
        document.getElementById('empPassword').value = '';
        document.getElementById('empAccess').value = '';
        document.getElementById('editDocId').value = '';
        checkAllPermissions(false);
        document.getElementById('permissionsSection').style.opacity = '1';
        document.getElementById('permissionsSection').style.pointerEvents = 'auto';
        showModal('employeeModal');
    };

    window.editEmployee = function (docId) {
        const emp = allEmployees.find(e => e.id === docId);
        if (!emp) return;

        if (!myPerms.view && emp.id !== currentUser.id) {
            alert('⛔ No permission!');
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

        if (currentUser.access !== 'Admin' && currentUser.access !== 'Manager') {
            document.getElementById('empAccess').disabled = true;
            document.getElementById('permissionsSection').style.opacity = '0.5';
            document.getElementById('permissionsSection').style.pointerEvents = 'none';
        } else {
            document.getElementById('empAccess').disabled = false;
        }

        showModal('employeeModal');
    };

    function setChecked(id, value) {
        const el = document.getElementById(id);
        if (el) el.checked = value || false;
    }

    window.closeModal = function () {
        hideModal('employeeModal');
        document.getElementById('empAccess').disabled = false;
    };

    window.saveEmployee = async function () {
        const name = document.getElementById('empName').value.trim();
        const nickname = document.getElementById('empNickname').value.trim();
        const password = document.getElementById('empPassword').value.trim();
        const access = document.getElementById('empAccess').value;
        const editDocId = document.getElementById('editDocId').value;

        if (!name || !nickname || !password || !access) {
            alert('⚠️ Please fill all fields!');
            return;
        }

        const permissions = {};
        IDX_DATABASES.forEach(d => {
            const dbPerms = {};
            PERM_KEYS.forEach(key => {
                dbPerms[key] = getChecked(`${d.permPrefix}_${key}`);
            });
            permissions[d.id] = dbPerms;
        });

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

        try {
            if (editDocId) {
                if (currentUser.access !== 'Admin' && currentUser.access !== 'Manager') {
                    await db.collection('employees').doc(editDocId).update({
                        name, nickname, password
                    });
                } else {
                    await db.collection('employees').doc(editDocId).update({
                        name, nickname, password, access, permissions
                    });
                }
                alert('✅ Employee updated!');
            } else {
                const existCheck = await db.collection('employees')
                    .where('nickname', '==', nickname).get();
                if (!existCheck.empty) {
                    alert('⚠️ Nickname already exists!');
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText;
                    return;
                }
                await db.collection('employees').add({
                    name, nickname, password, access, permissions,
                    createdAt: getServerTimestamp()
                });
                alert('✅ Employee added!');
            }
            window.closeModal();
        } catch (error) {
            console.error('Save error:', error);
            alert('❌ Error: ' + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    };

    function getChecked(id) {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    }

    window.openDeleteModal = function (docId, name) {
        if (docId === currentUser.id) {
            alert('⛔ Cannot delete your own profile!');
            return;
        }
        deleteDocId = docId;
        document.getElementById('deleteEmpName').textContent = name;
        showModal('deleteModal');
    };

    window.closeDeleteModal = function () {
        hideModal('deleteModal');
        deleteDocId = '';
    };

    window.confirmDelete = async function () {
        if (!deleteDocId) return;
        try {
            await db.collection('employees').doc(deleteDocId).delete();
            alert('✅ Deleted!');
            window.closeDeleteModal();
        } catch (error) {
            alert('❌ Error: ' + error.message);
        }
    };

    // Click outside modal to close
    document.addEventListener('click', function (event) {
        if (event.target.classList && event.target.classList.contains('modal-overlay')) {
            event.target.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    });

    // ESC key to close modal
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay.show');
            openModals.forEach(m => {
                m.classList.remove('show');
                document.body.classList.remove('modal-open');
            });
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 📍 SECTION NAV SMOOTH SCROLL (Sticky Topbar Aware) v3.3
    // ═══════════════════════════════════════════════════════════
    function setupSectionNav() {
        const navItems = document.querySelectorAll('.section-nav-item');
        const sections = document.querySelectorAll('.page-section');

        if (navItems.length === 0) return;

        // Smooth scroll on click with topbar offset
        navItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (!targetId || !targetId.startsWith('#')) return;

                const target = document.querySelector(targetId);
                if (!target) return;

                // Calculate offset = topbar + section-nav + gap
                const topbar = document.querySelector('.topbar');
                const nav = document.querySelector('.section-nav');
                const topbarH = topbar ? topbar.offsetHeight : 64;
                const navH = nav ? nav.offsetHeight : 60;
                const gap = 30;
                const offset = topbarH + navH + gap;  // Same, just bigger gap

                const targetY = target.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetY,
                    behavior: 'smooth'
                });

                // Update active state immediately
                navItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');

                // Update URL hash without scroll jump
                history.replaceState(null, '', targetId);
            });
        });

        // Auto-update active pill on scroll
        let scrollTimer = null;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const topbar = document.querySelector('.topbar');
                const nav = document.querySelector('.section-nav');
                const topbarH = topbar ? topbar.offsetHeight : 64;
                const navH = nav ? nav.offsetHeight : 60;
                const triggerOffset = topbarH + navH + 50;

                let currentSection = null;
                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= triggerOffset && rect.bottom > triggerOffset) {
                        currentSection = section.id;
                    }
                });

                if (currentSection) {
                    navItems.forEach(item => {
                        const href = item.getAttribute('href');
                        if (href === '#' + currentSection) {
                            item.classList.add('active');
                        } else {
                            item.classList.remove('active');
                        }
                    });
                }
            }, 50);
        }, { passive: true });
    }

    // Initialize section nav after DOM ready
    setTimeout(setupSectionNav, 500);

    waitForFirebase(initializeApp);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initIndex());
} else {
    window.initIndex();
}