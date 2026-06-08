// ═══════════════════════════════════════════════════════════
// 🍴 BUONO - EMPLOYEE DATABASE (HR Module)
// File: index-script.js
// Version: 9.9 - Call Center DB Added!
//
// 🔥 Firebase: Loaded from firebase-config.js
// 📦 Available globals: db, getCurrentUser(), logout(), formatDate()
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════
// 📂 DATABASES - Global from firebase-config.js!
// ═══════════════════════════════════════════
// No local array - uses global DATABASES


// ═══════════════════════════════════════════
// 🌐 GLOBAL VARIABLES
// ═══════════════════════════════════════════
let allEmployees = [];
let deleteDocId = '';
let currentUser = null;
let myPerms = null;


// ═══════════════════════════════════════════
// 🚀 INITIALIZE APP
// ═══════════════════════════════════════════
async function initializeApp() {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    const userData = JSON.parse(user);

    // Refresh user data from Firebase
    try {
        const userDoc = await db.collection('employees').doc(userData.id).get();
        if (userDoc.exists) {
            const d = userDoc.data();
            userData.access = d.access;
            userData.permissions = d.permissions || {};
            userData.name = d.name;
            userData.nickname = d.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
        }
    } catch (e) {
        console.error(e);
    }

    // Check access
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
    document.getElementById('myAccess').textContent = userData.access;

    buildDatabaseSwitcher();
    setupActionButtons();
    startEmployeeListener();
}

// Start the app
initializeApp();


// ═══════════════════════════════════════════
// 📂 DATABASE SWITCHER
// ═══════════════════════════════════════════
function buildDatabaseSwitcher() {
    const list = document.getElementById('dbDropdownList');
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';

    DATABASES.forEach(d => {
        if (d.adminManagerOnly && !isAdminOrMgr) return;
        const isAdmin = currentUser.access === 'Admin';
        const dp = currentUser.permissions?.[d.id] || {};
        const hasAccess = isAdmin || dp.add || dp.view || dp.selfView || dp.edit || dp.delete;
        if (!d.adminManagerOnly && !hasAccess) return;

        // Call Center - Call Operator also gets access
        if (d.id === 'callCenterDB' && currentUser.access === 'Call Operator') {
            // Allow
        } else if (!d.adminManagerOnly && !hasAccess) return;

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


// ═══════════════════════════════════════════
// 📅 DATE & TIME UPDATER
// ═══════════════════════════════════════════
function updateDateTime() {
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    const dateEl = document.getElementById('todayDate');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', options);
    const timeEl = document.getElementById('currentTime');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
updateDateTime();
setInterval(updateDateTime, 1000);


// ═══════════════════════════════════════════
// 🎨 BADGE & PERMISSION HELPERS
// ═══════════════════════════════════════════
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


// ═══════════════════════════════════════════
// 🔘 SETUP ACTION BUTTONS
// ═══════════════════════════════════════════
function setupActionButtons() {
    if (myPerms.add) document.getElementById('addBtn').style.display = 'inline-block';

    if (myPerms.view) {
        document.getElementById('empListTitle').textContent = '👥 All Employees';
    } else if (myPerms.selfView) {
        document.getElementById('empListTitle').textContent = '👤 My Profile';
        document.getElementById('searchBar').style.display = 'none';
    }
}


// ═══════════════════════════════════════════
// 🔄 REAL-TIME EMPLOYEE LISTENER
// ═══════════════════════════════════════════
function startEmployeeListener() {
    db.collection('employees').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        allEmployees = [];
        snapshot.forEach((doc) => {
            allEmployees.push({ id: doc.id, ...doc.data() });
        });

        let visibleEmployees = [];
        if (myPerms.view) visibleEmployees = allEmployees;
        else if (myPerms.selfView) visibleEmployees = allEmployees.filter(emp => emp.id === currentUser.id);

        document.getElementById('totalEmployees').textContent = visibleEmployees.length;
        renderEmployees(visibleEmployees);
    });
}


// ═══════════════════════════════════════════
// 📋 RENDER EMPLOYEE TABLE
// ═══════════════════════════════════════════
function renderEmployees(employees) {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">📭 No employees to display.</td></tr>`;
        return;
    }

    let count = 0;
    employees.forEach((emp) => {
        count++;
        const badgeClass = getBadgeClass(emp.access);
        const permCount = getPermissionCount(emp.permissions);
        const permColor = emp.access === 'Admin' ? '#4CAF50' : (permCount > 0 ? '#f0a500' : '#888');
        const permText = emp.access === 'Admin' ? '🌟 ALL (Admin)' : `🔐 ${permCount} permissions`;

        let actionsHtml = '';
        if (myPerms.edit) actionsHtml += `<button class="btn-edit" onclick="editEmployee('${emp.id}')">✏️ Edit</button>`;
        if (myPerms.delete && myPerms.view) actionsHtml += `<button class="btn-delete" onclick="openDeleteModal('${emp.id}', '${emp.name}')">🗑️ Delete</button>`;
        if (!actionsHtml) actionsHtml = '<span style="color:#666; font-size:12px;">View only</span>';

        tbody.innerHTML += `
            <tr>
                <td data-label="#">${count}</td>
                <td data-label="Name">${emp.name}</td>
                <td data-label="Nickname">${emp.nickname}</td>
                <td data-label="Access"><span class="badge ${badgeClass}">${emp.access}</span></td>
                <td data-label="Permissions" style="color: ${permColor}; font-size: 13px; font-weight: 600;">${permText}</td>
                <td data-label="Actions" class="action-buttons">${actionsHtml}</td>
            </tr>`;
    });
}


// ═══════════════════════════════════════════
// 🔍 SEARCH EMPLOYEES
// ═══════════════════════════════════════════
function searchEmployees() {
    const searchText = document.getElementById('searchEmployee').value.toLowerCase();
    let visible = myPerms.view ? allEmployees : allEmployees.filter(e => e.id === currentUser.id);
    const filtered = visible.filter(emp =>
        emp.name.toLowerCase().includes(searchText) ||
        emp.nickname.toLowerCase().includes(searchText) ||
        emp.access.toLowerCase().includes(searchText)
    );
    renderEmployees(filtered);
}


// ═══════════════════════════════════════════
// ✅ PERMISSION HELPERS
// ═══════════════════════════════════════════
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
    } else if (access === 'Call Operator') {
        // Call Operator defaults - only callCenterDB access
        checkAllPermissions(false);
        setCallCenterDefaults();
        permissionsSection.style.opacity = '1';
        permissionsSection.style.pointerEvents = 'auto';
    } else {
        permissionsSection.style.opacity = '1';
        permissionsSection.style.pointerEvents = 'auto';
    }
}

// Call Operator default permissions
function setCallCenterDefaults() {
    // Only callCenterDB checked by default
    const cc_add = document.getElementById('cc_add');
    const cc_view = document.getElementById('cc_view');
    const cc_selfView = document.getElementById('cc_selfView');
    const cc_edit = document.getElementById('cc_edit');
    if (cc_add)     cc_add.checked = true;
    if (cc_view)    cc_view.checked = true;
    if (cc_selfView) cc_selfView.checked = true;
    if (cc_edit)    cc_edit.checked = true;
}

// ⭐ All 7 databases included! (+ callCenterDB)
function checkAllPermissions(checked) {
    const ids = [
        // Employee DB
        'emp_add', 'emp_view', 'emp_selfView', 'emp_edit', 'emp_delete',
        // Day End Report DB
        'der_add', 'der_view', 'der_selfView', 'der_edit', 'der_delete',
        // Inventory DB
        'inv_add', 'inv_view', 'inv_selfView', 'inv_edit', 'inv_delete',
        // Kitchen DB
        'kit_add', 'kit_view', 'kit_selfView', 'kit_edit', 'kit_delete',
        // Purchasing DB
        'pur_add', 'pur_view', 'pur_selfView', 'pur_edit', 'pur_delete',
        // ⭐ Call Center DB - NEW!
        'cc_add', 'cc_view', 'cc_selfView', 'cc_edit', 'cc_delete',
        // Reports DB
        'rep_add', 'rep_view', 'rep_selfView', 'rep_edit', 'rep_delete'
    ];
    ids.forEach(id => {
        const cb = document.getElementById(id);
        if (cb) cb.checked = checked;
    });
}


// ═══════════════════════════════════════════
// ➕ OPEN ADD MODAL
// ═══════════════════════════════════════════
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


// ═══════════════════════════════════════════
// ✏️ EDIT EMPLOYEE - All 7 DBs!
// ═══════════════════════════════════════════
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

    // Reset all checkboxes
    checkAllPermissions(false);

    if (emp.permissions) {
        // Employee DB
        if (emp.permissions.employeeDB) {
            setChecked('emp_add',      emp.permissions.employeeDB.add);
            setChecked('emp_view',     emp.permissions.employeeDB.view);
            setChecked('emp_selfView', emp.permissions.employeeDB.selfView);
            setChecked('emp_edit',     emp.permissions.employeeDB.edit);
            setChecked('emp_delete',   emp.permissions.employeeDB.delete);
        }
        // Day End Report DB
        if (emp.permissions.dayEndReportDB) {
            setChecked('der_add',      emp.permissions.dayEndReportDB.add);
            setChecked('der_view',     emp.permissions.dayEndReportDB.view);
            setChecked('der_selfView', emp.permissions.dayEndReportDB.selfView);
            setChecked('der_edit',     emp.permissions.dayEndReportDB.edit);
            setChecked('der_delete',   emp.permissions.dayEndReportDB.delete);
        }
        // Inventory DB
        if (emp.permissions.inventoryDB) {
            setChecked('inv_add',      emp.permissions.inventoryDB.add);
            setChecked('inv_view',     emp.permissions.inventoryDB.view);
            setChecked('inv_selfView', emp.permissions.inventoryDB.selfView);
            setChecked('inv_edit',     emp.permissions.inventoryDB.edit);
            setChecked('inv_delete',   emp.permissions.inventoryDB.delete);
        }
        // Kitchen DB
        if (emp.permissions.kitchenDB) {
            setChecked('kit_add',      emp.permissions.kitchenDB.add);
            setChecked('kit_view',     emp.permissions.kitchenDB.view);
            setChecked('kit_selfView', emp.permissions.kitchenDB.selfView);
            setChecked('kit_edit',     emp.permissions.kitchenDB.edit);
            setChecked('kit_delete',   emp.permissions.kitchenDB.delete);
        }
        // Purchasing DB
        if (emp.permissions.purchasingDB) {
            setChecked('pur_add',      emp.permissions.purchasingDB.add);
            setChecked('pur_view',     emp.permissions.purchasingDB.view);
            setChecked('pur_selfView', emp.permissions.purchasingDB.selfView);
            setChecked('pur_edit',     emp.permissions.purchasingDB.edit);
            setChecked('pur_delete',   emp.permissions.purchasingDB.delete);
        }
        // ⭐ Call Center DB - NEW!
        if (emp.permissions.callCenterDB) {
            setChecked('cc_add',       emp.permissions.callCenterDB.add);
            setChecked('cc_view',      emp.permissions.callCenterDB.view);
            setChecked('cc_selfView',  emp.permissions.callCenterDB.selfView);
            setChecked('cc_edit',      emp.permissions.callCenterDB.edit);
            setChecked('cc_delete',    emp.permissions.callCenterDB.delete);
        }
        // Reports DB
        if (emp.permissions.reportsDB) {
            setChecked('rep_add',      emp.permissions.reportsDB.add);
            setChecked('rep_view',     emp.permissions.reportsDB.view);
            setChecked('rep_selfView', emp.permissions.reportsDB.selfView);
            setChecked('rep_edit',     emp.permissions.reportsDB.edit);
            setChecked('rep_delete',   emp.permissions.reportsDB.delete);
        }
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

// Helper - safely set checkbox
function setChecked(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = value || false;
}


// ═══════════════════════════════════════════
// ❌ CLOSE MODAL
// ═══════════════════════════════════════════
function closeModal() {
    document.getElementById('employeeModal').style.display = 'none';
    document.getElementById('empAccess').disabled = false;
}


// ═══════════════════════════════════════════
// 💾 SAVE EMPLOYEE - All 7 DBs!
// ═══════════════════════════════════════════
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

    // ⭐ All 7 databases permissions!
    const permissions = {
        employeeDB: {
            add:      getChecked('emp_add'),
            view:     getChecked('emp_view'),
            selfView: getChecked('emp_selfView'),
            edit:     getChecked('emp_edit'),
            delete:   getChecked('emp_delete')
        },
        dayEndReportDB: {
            add:      getChecked('der_add'),
            view:     getChecked('der_view'),
            selfView: getChecked('der_selfView'),
            edit:     getChecked('der_edit'),
            delete:   getChecked('der_delete')
        },
        inventoryDB: {
            add:      getChecked('inv_add'),
            view:     getChecked('inv_view'),
            selfView: getChecked('inv_selfView'),
            edit:     getChecked('inv_edit'),
            delete:   getChecked('inv_delete')
        },
        kitchenDB: {
            add:      getChecked('kit_add'),
            view:     getChecked('kit_view'),
            selfView: getChecked('kit_selfView'),
            edit:     getChecked('kit_edit'),
            delete:   getChecked('kit_delete')
        },
        purchasingDB: {
            add:      getChecked('pur_add'),
            view:     getChecked('pur_view'),
            selfView: getChecked('pur_selfView'),
            edit:     getChecked('pur_edit'),
            delete:   getChecked('pur_delete')
        },
        // ⭐ Call Center DB - NEW!
        callCenterDB: {
            add:      getChecked('cc_add'),
            view:     getChecked('cc_view'),
            selfView: getChecked('cc_selfView'),
            edit:     getChecked('cc_edit'),
            delete:   getChecked('cc_delete')
        },
        reportsDB: {
            add:      getChecked('rep_add'),
            view:     getChecked('rep_view'),
            selfView: getChecked('rep_selfView'),
            edit:     getChecked('rep_edit'),
            delete:   getChecked('rep_delete')
        }
    };

    // Admin = all permissions true
    if (access === 'Admin') {
        Object.keys(permissions).forEach(dbKey => {
            Object.keys(permissions[dbKey]).forEach(permKey => {
                permissions[dbKey][permKey] = true;
            });
        });
    }

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
    }
}

// Helper - safely get checkbox value
function getChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}


// ═══════════════════════════════════════════
// 🗑️ DELETE EMPLOYEE
// ═══════════════════════════════════════════
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


// ═══════════════════════════════════════════
// 🖱️ CLICK OUTSIDE MODAL TO CLOSE
// ═══════════════════════════════════════════
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
};