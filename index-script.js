// ═══════════════════════════════════════════════════════════
// 🍴 BUONO - EMPLOYEE DATABASE (HR Module)
// File: index-script.js
// Version: 11.0 - Speed + Smooth + Professional
// ⭐ Original logic 100% preserved + enhancements
// ═══════════════════════════════════════════════════════════

// ─── Globals ───
let allEmployees = [];
let deleteDocId = '';
let currentUser = null;
let myPerms = null;

// ─── Pagination ───
const EMP_PAGE_SIZE = 50;
let empDisplayed = 0;
let lastRenderList = [];

// ─── Search debounce ───
let searchTimer = null;

const PERM_KEYS = ['add', 'view', 'selfView', 'edit', 'delete'];

// ─── Cache keys ───
const USER_CACHE_KEY    = 'buono_index_user_v1';
const CACHE_DURATION_MS = 5 * 60 * 1000;

// ─── Perf tracker ───
const Perf = {
    _marks: {},
    start(label) { this._marks[label] = performance.now(); },
    end(label) {
        const t = performance.now() - (this._marks[label] || 0);
        console.log(`⚡ [Index] ${label}: ${t.toFixed(1)}ms`);
        return t;
    }
};

// ─── Cache helpers ───
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
        if (Date.now() - ts > maxAge) { sessionStorage.removeItem(key); return null; }
        return data;
    } catch (e) { return null; }
}

// ═══════════════════════════════════════════════════════════
// 🚀 INITIALIZE APP
// ═══════════════════════════════════════════════════════════
async function initializeApp() {
    Perf.start('Total Init');

    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    const userData = JSON.parse(user);

    // ── Try cache first ──
    const cached = cacheGet(USER_CACHE_KEY, CACHE_DURATION_MS);
    if (cached) {
        console.log('✅ [Index] Using cached user permissions');
        userData.access      = cached.access;
        userData.permissions = cached.permissions;
        userData.name        = cached.name;
        userData.nickname    = cached.nickname;
        applyUserData(userData);
        refreshUserBackground(userData.id);
    } else {
        Perf.start('Firebase User Fetch');
        try {
            const userDoc = await db.collection('employees').doc(userData.id).get();
            if (userDoc.exists) {
                const d = userDoc.data();
                userData.access      = d.access;
                userData.permissions = d.permissions || {};
                userData.name        = d.name;
                userData.nickname    = d.nickname;
                sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
                cacheSet(USER_CACHE_KEY, {
                    access:      userData.access,
                    permissions: userData.permissions,
                    name:        userData.name,
                    nickname:    userData.nickname
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
                access:      d.access,
                permissions: d.permissions || {},
                name:        d.name,
                nickname:    d.nickname
            });
        }
    } catch (e) {}
}

function applyUserData(userData) {
    const isAdmin = userData.access === 'Admin';
    const perms = userData.permissions?.employeeDB || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView || perms.edit || perms.delete;

    if (!hasAccess) {
        alert('⛔ ඔයාට Employee Database එකට access නැහැ!');
        window.location.href = "access.html";
        return;
    }

    myPerms = isAdmin ? { add: true, view: true, selfView: true, edit: true, delete: true } : perms;
    currentUser = userData;

    document.getElementById('welcomeUser').textContent = `👋 Welcome, ${userData.name} (${userData.access})`;

    fillStatCards();
    buildDatabaseSwitcher();
    buildPermissionsUI();
    setupActionButtons();
    revealPage();
    startEmployeeListener();
}

// ═══════════════════════════════════════════════════════════
// ✨ REVEAL PAGE
// ═══════════════════════════════════════════════════════════
function revealPage() {
    const overlay = document.getElementById('idxLoadingOverlay');
    if (overlay) overlay.classList.add('hidden');

    const main = document.getElementById('idxMainContent');
    if (main) main.style.opacity = '1';

    // Stagger stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 80);
    });
}

// ═══════════════════════════════════════════════════════════
// 📊 FILL STAT CARDS
// ═══════════════════════════════════════════════════════════
function fillStatCards() {
    _fillStat('idxStatCard1', '👥', '0', 'Total Employees', 'totalEmployees');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
    _fillStat('idxStatCard2', '📅', dateStr, 'Today', 'todayDate');

    const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    _fillStat('idxStatCard3', '⏰', timeStr, 'Current Time', 'currentTime');

    _fillStat('idxStatCard4', '🔑', currentUser.access, 'Access Level', 'myAccess');
}

function _fillStat(cardId, icon, value, label, valueId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.remove('skeleton-stat');
    card.innerHTML = `
        <div class="stat-icon">${icon}</div>
        <div class="stat-info">
            <h3 id="${valueId}">${value}</h3>
            <p>${label}</p>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════
// 📅 DATE & TIME UPDATER
// ═══════════════════════════════════════════════════════════
function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('todayDate');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
    const timeEl = document.getElementById('currentTime');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
setInterval(updateDateTime, 1000);

// ═══════════════════════════════════════════════════════════
// 📂 DATABASE SWITCHER
// ═══════════════════════════════════════════════════════════
function buildDatabaseSwitcher() {
    const list = document.getElementById('dbDropdownList');
    const accessible = getAccessibleDatabases(currentUser);
    let html = '';

    accessible.forEach(d => {
        const isCurrent = d.id === 'employeeDB';
        html += `
            <a href="${d.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}">
                <span>${d.icon}</span>
                <span>${d.name}</span>
                ${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}
            </a>
        `;
    });

    list.innerHTML = html;

    document.getElementById('dbSwitcher').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('dbDropdown').classList.toggle('show');
    });
    document.addEventListener('click', function(e) {
        const dd = document.getElementById('dbDropdown');
        if (dd && !dd.contains(e.target) && !e.target.closest('#dbSwitcher')) dd.classList.remove('show');
    });
}

// ═══════════════════════════════════════════════════════════
// ⭐ BUILD PERMISSIONS UI
// ═══════════════════════════════════════════════════════════
function buildPermissionsUI() {
    const container = document.getElementById('permissionsContainer');
    if (!container) return;
    container.innerHTML = DATABASES.map(d => buildPermissionBlock(d)).join('');
}

function buildPermissionBlock(database) {
    const prefix = database.permPrefix;
    const borderStyle = database.permBorderColor
        ? ` style="border: 2px solid ${database.permBorderColor};"` : '';
    const titleStyle = database.permTitleColor
        ? ` style="color: ${database.permTitleColor};"` : '';
    const subtitle = database.permSubtitle
        ? ` <span style="font-size: 11px; color: #888; font-weight: normal;">${database.permSubtitle}</span>` : '';
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

// ═══════════════════════════════════════════════════════════
// 🎨 BADGE & PERMISSION HELPERS
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// 🔘 SETUP ACTION BUTTONS
// ═══════════════════════════════════════════════════════════
function setupActionButtons() {
    if (myPerms.add) document.getElementById('addBtn').style.display = 'inline-block';

    if (myPerms.view) {
        document.getElementById('empListTitle').textContent = '👥 All Employees';
    } else if (myPerms.selfView) {
        document.getElementById('empListTitle').textContent = '👤 My Profile';
        document.getElementById('searchBar').style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 🔄 REAL-TIME EMPLOYEE LISTENER
// ═══════════════════════════════════════════════════════════
function startEmployeeListener() {
    Perf.start('Employees Snapshot');
    db.collection('employees').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        allEmployees = [];
        snapshot.forEach((doc) => {
            allEmployees.push({ id: doc.id, ...doc.data() });
        });

        let visibleEmployees = [];
        if (myPerms.view) visibleEmployees = allEmployees;
        else if (myPerms.selfView) visibleEmployees = allEmployees.filter(emp => emp.id === currentUser.id);

        const totalEl = document.getElementById('totalEmployees');
        if (totalEl) totalEl.textContent = visibleEmployees.length;

        renderEmployees(visibleEmployees);
        Perf.end('Employees Snapshot');
    });
}

// ═══════════════════════════════════════════════════════════
// 📋 RENDER EMPLOYEE TABLE (with pagination)
// ═══════════════════════════════════════════════════════════
function renderEmployees(employees) {
    lastRenderList = employees;
    const tbody = document.getElementById('employeeTableBody');

    if (employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">📭 No employees to display.</td></tr>`;
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
        const permColor = emp.access === 'Admin' ? '#4CAF50' : (permCount > 0 ? '#f0a500' : '#888');
        const permText = emp.access === 'Admin' ? '🌟 ALL (Admin)' : `🔐 ${permCount} permissions`;

        let actionsHtml = '';
        if (myPerms.edit) actionsHtml += `<button class="btn-edit" onclick="editEmployee('${emp.id}')">✏️ Edit</button>`;
        if (myPerms.delete && myPerms.view) actionsHtml += `<button class="btn-delete" onclick="openDeleteModal('${emp.id}', '${escapeQuotes(emp.name)}')">🗑️ Delete</button>`;
        if (!actionsHtml) actionsHtml = '<span style="color:#666; font-size:12px;">View only</span>';

        html += `
            <tr>
                <td data-label="#">${count}</td>
                <td data-label="Name">${emp.name}</td>
                <td data-label="Nickname">${emp.nickname}</td>
                <td data-label="Access"><span class="badge ${badgeClass}">${emp.access}</span></td>
                <td data-label="Permissions" style="color: ${permColor}; font-size: 13px; font-weight: 600;">${permText}</td>
                <td data-label="Actions" class="action-buttons">${actionsHtml}</td>
            </tr>`;
    });

    tbody.innerHTML = html;

    // Stagger row animations
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
        setTimeout(() => row.classList.add('visible'), i * 25);
    });

    // Pagination UI
    const paginationWrap = document.getElementById('empPaginationWrap');
    const counter = document.getElementById('empCounter');
    const loadMoreBtn = document.getElementById('btnLoadMoreEmp');
    const total = employees.length;
    const shown = toShow.length;

    if (total > EMP_PAGE_SIZE) {
        paginationWrap.style.display = 'block';
        if (shown >= total) {
            loadMoreBtn.style.display = 'none';
            counter.textContent = `✅ All ${total} employees loaded`;
        } else {
            loadMoreBtn.style.display = 'inline-block';
            counter.textContent = `Showing ${shown} of ${total} employees`;
            loadMoreBtn.textContent = `⬇️ Load More (${total - shown} remaining)`;
        }
    } else {
        paginationWrap.style.display = 'none';
    }
}

function loadMoreEmployees() {
    empDisplayed += EMP_PAGE_SIZE;
    renderEmployees(lastRenderList);
}

function escapeQuotes(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════
// 🔍 SEARCH EMPLOYEES (debounced)
// ═══════════════════════════════════════════════════════════
function onSearchKeyup() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(searchEmployees, 200);
}

function searchEmployees() {
    const searchText = document.getElementById('searchEmployee').value.toLowerCase();
    let visible = myPerms.view ? allEmployees : allEmployees.filter(e => e.id === currentUser.id);

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

    // Show all search results (no pagination during search)
    empDisplayed = filtered.length;
    renderEmployees(filtered);
}

// ═══════════════════════════════════════════════════════════
// ✅ PERMISSION HELPERS
// ═══════════════════════════════════════════════════════════
function autoCheckSelfView(prefix) {
    const addCheck = document.getElementById(prefix + '_add');
    const viewCheck = document.getElementById(prefix + '_view');
    const selfViewCheck = document.getElementById(prefix + '_selfView');
    if (addCheck && viewCheck && selfViewCheck) {
        if (addCheck.checked || viewCheck.checked) selfViewCheck.checked = true;
    }
}

function handleAccessChange() {
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

    DATABASES.forEach(d => {
        const roleDefaults = d.defaultPermsForRole && d.defaultPermsForRole[access];
        if (roleDefaults) {
            PERM_KEYS.forEach(key => {
                if (roleDefaults[key]) setChecked(`${d.permPrefix}_${key}`, true);
            });
        }
    });
}

function checkAllPermissions(checked) {
    DATABASES.forEach(d => {
        PERM_KEYS.forEach(key => {
            const cb = document.getElementById(`${d.permPrefix}_${key}`);
            if (cb) cb.checked = checked;
        });
    });
}

// ═══════════════════════════════════════════════════════════
// ➕ OPEN ADD MODAL
// ═══════════════════════════════════════════════════════════
function openAddModal() {
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
    document.getElementById('employeeModal').style.display = 'flex';
}

// ═══════════════════════════════════════════════════════════
// ✏️ EDIT EMPLOYEE
// ═══════════════════════════════════════════════════════════
function editEmployee(docId) {
    const emp = allEmployees.find(e => e.id === docId);
    if (!emp) return;

    if (!myPerms.view && emp.id !== currentUser.id) {
        alert('⛔ ඔයාට මේ profile එක edit කරන්න permission නැහැ!');
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
        DATABASES.forEach(d => {
            const dbPerms = emp.permissions[d.id];
            if (dbPerms) {
                PERM_KEYS.forEach(key => {
                    setChecked(`${d.permPrefix}_${key}`, dbPerms[key]);
                });
            }
        });
    }

    handleAccessChange();

    if (currentUser.access !== 'Admin' && currentUser.access !== 'Manager') {
        document.getElementById('empAccess').disabled = true;
        document.getElementById('permissionsSection').style.opacity = '0.5';
        document.getElementById('permissionsSection').style.pointerEvents = 'none';
    } else {
        document.getElementById('empAccess').disabled = false;
    }

    document.getElementById('employeeModal').style.display = 'flex';
}

function setChecked(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = value || false;
}

// ═══════════════════════════════════════════════════════════
// ❌ CLOSE MODAL
// ═══════════════════════════════════════════════════════════
function closeModal() {
    document.getElementById('employeeModal').style.display = 'none';
    document.getElementById('empAccess').disabled = false;
}

// ═══════════════════════════════════════════════════════════
// 💾 SAVE EMPLOYEE
// ═══════════════════════════════════════════════════════════
async function saveEmployee() {
    const name      = document.getElementById('empName').value.trim();
    const nickname  = document.getElementById('empNickname').value.trim();
    const password  = document.getElementById('empPassword').value.trim();
    const access    = document.getElementById('empAccess').value;
    const editDocId = document.getElementById('editDocId').value;

    if (!name || !nickname || !password || !access) {
        alert('⚠️ Please fill all fields!');
        return;
    }

    const permissions = {};
    DATABASES.forEach(d => {
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
                await db.collection('employees').doc(editDocId).update({ name, nickname, password });
            } else {
                await db.collection('employees').doc(editDocId).update({ name, nickname, password, access, permissions });
            }
            alert('✅ Employee updated!');
        } else {
            const existCheck = await db.collection('employees').where('nickname', '==', nickname).get();
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
        closeModal();
    } catch (error) {
        console.error("Save error:", error);
        alert('❌ Error: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

function getChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

// ═══════════════════════════════════════════════════════════
// 🗑️ DELETE EMPLOYEE
// ═══════════════════════════════════════════════════════════
function openDeleteModal(docId, name) {
    if (docId === currentUser.id) {
        alert('⛔ ඔයාගේ ම profile එක delete කරන්න බෑ!');
        return;
    }
    deleteDocId = docId;
    document.getElementById('deleteEmpName').textContent = name;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteDocId = '';
}

async function confirmDelete() {
    if (!deleteDocId) return;
    try {
        await db.collection('employees').doc(deleteDocId).delete();
        alert('✅ Deleted!');
        closeDeleteModal();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════════════
// 🖱️ CLICK OUTSIDE MODAL TO CLOSE
// ═══════════════════════════════════════════════════════════
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
};

// ═══════════════════════════════════════════════════════════
// 🚀 START!
// ═══════════════════════════════════════════════════════════
initializeApp();