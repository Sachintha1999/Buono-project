// ═══════════════════════════════════════════════════════════
// 🍴 BUONO - EMPLOYEE DATABASE (HR Module)
// File: index-script.js
// Version: 9.7 - Global Firebase Config!
//
// 🔥 Firebase: Loaded from firebase-config.js
// 📦 Available globals: db, getCurrentUser(), logout(), formatDate()
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════
// 📂 DATABASES LIST (For Switcher)
// ═══════════════════════════════════════════
const DATABASES = [
    { id: 'employeeDB', name: 'Employee Database', icon: '👥', url: 'index.html' },
    { id: 'dayEndReportDB', name: 'Day End Reports', icon: '💰', url: 'cashier.html' },
    { id: 'inventoryDB', name: 'Inventory Database', icon: '📦', url: 'inventory.html' },
    { id: 'kitchenDB', name: 'Kitchen Database', icon: '🍳', url: 'kitchen.html' },
    { id: 'purchasingDB', name: 'Purchasing Database', icon: '🛒', url: 'purchasing.html' },
    { id: 'reportsDB', name: 'Reports Database', icon: '📊', url: 'reports.html', adminManagerOnly: true }
];


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
        const isCurrent = d.id === 'employeeDB';
        html += `<a href="${d.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}"><span>${d.icon}</span><span>${d.name}</span>${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}</a>`;
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
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
updateDateTime();
setInterval(updateDateTime, 1000);


// ═══════════════════════════════════════════
// 🎨 BADGE & PERMISSION HELPERS
// ═══════════════════════════════════════════
function getBadgeClass(access) {
    switch(access) {
        case 'Admin': return 'badge-admin';
        case 'Manager': return 'badge-manager';
        case 'Cashier': return 'badge-cashier';
        case 'Purchasing Officer': return 'badge-purchasing';
        case 'Head Chef': return 'badge-chef';
        case 'Call Operator': return 'badge-operator';
        case 'Waiter': return 'badge-waiter';
        default: return 'badge-default';
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
    if (addCheck.checked || viewCheck.checked) selfViewCheck.checked = true;
}

function handleAccessChange() {
    const access = document.getElementById('empAccess').value;
    const permissionsSection = document.getElementById('permissionsSection');
    if (access === 'Admin') {
        checkAllPermissions(true);
        permissionsSection.style.opacity = '0.6';
        permissionsSection.style.pointerEvents = 'none';
    } else {
        permissionsSection.style.opacity = '1';
        permissionsSection.style.pointerEvents = 'auto';
    }
}

// ⭐ All 6 databases included!
function checkAllPermissions(checked) {
    const ids = [
        // Employee DB
        'emp_add','emp_view','emp_selfView','emp_edit','emp_delete',
        // Day End Report DB
        'der_add','der_view','der_selfView','der_edit','der_delete',
        // Inventory DB
        'inv_add','inv_view','inv_selfView','inv_edit','inv_delete',
        // Kitchen DB
        'kit_add','kit_view','kit_selfView','kit_edit','kit_delete',
        // Purchasing DB
        'pur_add','pur_view','pur_selfView','pur_edit','pur_delete',
        // Reports DB
        'rep_add','rep_view','rep_selfView','rep_edit','rep_delete'
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
// ✏️ EDIT EMPLOYEE - All 6 DBs!
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

    checkAllPermissions(false);

    if (emp.permissions) {
        // Employee DB
        if (emp.permissions.employeeDB) {
            document.getElementById('emp_add').checked = emp.permissions.employeeDB.add || false;
            document.getElementById('emp_view').checked = emp.permissions.employeeDB.view || false;
            document.getElementById('emp_selfView').checked = emp.permissions.employeeDB.selfView || false;
            document.getElementById('emp_edit').checked = emp.permissions.employeeDB.edit || false;
            document.getElementById('emp_delete').checked = emp.permissions.employeeDB.delete || false;
        }
        // Day End Report DB
        if (emp.permissions.dayEndReportDB) {
            document.getElementById('der_add').checked = emp.permissions.dayEndReportDB.add || false;
            document.getElementById('der_view').checked = emp.permissions.dayEndReportDB.view || false;
            document.getElementById('der_selfView').checked = emp.permissions.dayEndReportDB.selfView || false;
            document.getElementById('der_edit').checked = emp.permissions.dayEndReportDB.edit || false;
            document.getElementById('der_delete').checked = emp.permissions.dayEndReportDB.delete || false;
        }
        // Inventory DB
        if (emp.permissions.inventoryDB) {
            document.getElementById('inv_add').checked = emp.permissions.inventoryDB.add || false;
            document.getElementById('inv_view').checked = emp.permissions.inventoryDB.view || false;
            document.getElementById('inv_selfView').checked = emp.permissions.inventoryDB.selfView || false;
            document.getElementById('inv_edit').checked = emp.permissions.inventoryDB.edit || false;
            document.getElementById('inv_delete').checked = emp.permissions.inventoryDB.delete || false;
        }
        // Kitchen DB
        if (emp.permissions.kitchenDB) {
            document.getElementById('kit_add').checked = emp.permissions.kitchenDB.add || false;
            document.getElementById('kit_view').checked = emp.permissions.kitchenDB.view || false;
            document.getElementById('kit_selfView').checked = emp.permissions.kitchenDB.selfView || false;
            document.getElementById('kit_edit').checked = emp.permissions.kitchenDB.edit || false;
            document.getElementById('kit_delete').checked = emp.permissions.kitchenDB.delete || false;
        }
        // Purchasing DB
        if (emp.permissions.purchasingDB) {
            document.getElementById('pur_add').checked = emp.permissions.purchasingDB.add || false;
            document.getElementById('pur_view').checked = emp.permissions.purchasingDB.view || false;
            document.getElementById('pur_selfView').checked = emp.permissions.purchasingDB.selfView || false;
            document.getElementById('pur_edit').checked = emp.permissions.purchasingDB.edit || false;
            document.getElementById('pur_delete').checked = emp.permissions.purchasingDB.delete || false;
        }
        // Reports DB
        if (emp.permissions.reportsDB) {
            document.getElementById('rep_add').checked = emp.permissions.reportsDB.add || false;
            document.getElementById('rep_view').checked = emp.permissions.reportsDB.view || false;
            document.getElementById('rep_selfView').checked = emp.permissions.reportsDB.selfView || false;
            document.getElementById('rep_edit').checked = emp.permissions.reportsDB.edit || false;
            document.getElementById('rep_delete').checked = emp.permissions.reportsDB.delete || false;
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


// ═══════════════════════════════════════════
// ❌ CLOSE MODAL
// ═══════════════════════════════════════════
function closeModal() {
    document.getElementById('employeeModal').style.display = 'none';
    document.getElementById('empAccess').disabled = false;
}


// ═══════════════════════════════════════════
// 💾 SAVE EMPLOYEE - All 6 DBs!
// ═══════════════════════════════════════════
async function saveEmployee() {
    const name = document.getElementById('empName').value.trim();
    const nickname = document.getElementById('empNickname').value.trim();
    const password = document.getElementById('empPassword').value.trim();
    const access = document.getElementById('empAccess').value;
    const editDocId = document.getElementById('editDocId').value;

    if (!name || !nickname || !password || !access) {
        alert('⚠️ Please fill all fields!');
        return;
    }

    // ⭐ All 6 databases permissions!
    const permissions = {
        employeeDB: {
            add: document.getElementById('emp_add').checked,
            view: document.getElementById('emp_view').checked,
            selfView: document.getElementById('emp_selfView').checked,
            edit: document.getElementById('emp_edit').checked,
            delete: document.getElementById('emp_delete').checked
        },
        dayEndReportDB: {
            add: document.getElementById('der_add').checked,
            view: document.getElementById('der_view').checked,
            selfView: document.getElementById('der_selfView').checked,
            edit: document.getElementById('der_edit').checked,
            delete: document.getElementById('der_delete').checked
        },
        inventoryDB: {
            add: document.getElementById('inv_add').checked,
            view: document.getElementById('inv_view').checked,
            selfView: document.getElementById('inv_selfView').checked,
            edit: document.getElementById('inv_edit').checked,
            delete: document.getElementById('inv_delete').checked
        },
        kitchenDB: {
            add: document.getElementById('kit_add').checked,
            view: document.getElementById('kit_view').checked,
            selfView: document.getElementById('kit_selfView').checked,
            edit: document.getElementById('kit_edit').checked,
            delete: document.getElementById('kit_delete').checked
        },
        purchasingDB: {
            add: document.getElementById('pur_add').checked,
            view: document.getElementById('pur_view').checked,
            selfView: document.getElementById('pur_selfView').checked,
            edit: document.getElementById('pur_edit').checked,
            delete: document.getElementById('pur_delete').checked
        },
        reportsDB: {
            add: document.getElementById('rep_add').checked,
            view: document.getElementById('rep_view').checked,
            selfView: document.getElementById('rep_selfView').checked,
            edit: document.getElementById('rep_edit').checked,
            delete: document.getElementById('rep_delete').checked
        }
    };

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
}