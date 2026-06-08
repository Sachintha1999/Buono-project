// ============================================
// MANAGER DASHBOARD - SCRIPT
// File: manager-script.js
// Version: 9.7 - Global Firebase Config!
// ============================================

// ❌ REMOVED: firebaseConfig block (now in firebase-config.js!)
// ✅ Using globals: db, getCurrentUser(), logout()

// ===================================
// GLOBAL VARIABLES
// ===================================
let deleteDocId = '';
let allEmployees = [];

// ===================================
// LOGIN CHECK
// ===================================
function checkLogin() {
    // ✅ Global getCurrentUser() use කරනවා
    const userData = getCurrentUser();

    if (!userData) {
        window.location.href = "login.html";
        return null;
    }

    if (userData.access !== 'Manager' && userData.access !== 'Admin') {
        alert('⛔ You do not have Manager access!');
        sessionStorage.removeItem('loggedInUser');
        window.location.href = "login.html";
        return null;
    }

    const welcomeEl = document.getElementById('welcomeUser');
    if (welcomeEl) {
        welcomeEl.textContent = `👋 Welcome, ${userData.name} (${userData.access})`;
    }

    document.getElementById('settingName').textContent = userData.name;
    document.getElementById('settingNickname').textContent = userData.nickname;
    document.getElementById('settingAccess').textContent = userData.access;
    document.getElementById('myAccess').textContent = userData.access;

    return userData;
}

const currentUser = checkLogin();

// ✅ Global logout() use කරනවා - firebase-config.js වල!
// function logout() { ... } ← REMOVED!

// ===================================
// SECTION SWITCHING
// ===================================
function showSection(sectionName, clickedTab) {
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
    });

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById('section-' + sectionName).classList.add('active');

    if (clickedTab) {
        clickedTab.classList.add('active');
    }
}

// ===================================
// DATE & TIME UPDATE
// ===================================
function updateDateTime() {
    const now = new Date();

    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    document.getElementById('todayDate').textContent =
        now.toLocaleDateString('en-US', options);

    document.getElementById('currentTime').textContent =
        now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
}

updateDateTime();
setInterval(updateDateTime, 1000);

// ===================================
// LOAD EMPLOYEES
// ===================================
function loadEmployees() {
    db.collection('employees')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {

        const tbody = document.getElementById('employeeTableBody');
        tbody.innerHTML = '';

        document.getElementById('totalEmployees').textContent = snapshot.size;

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:20px; color:#888;">
                        📭 No employees found. Click "Add Employee" to add one!
                    </td>
                </tr>`;
            return;
        }

        allEmployees = [];
        let count = 0;

        snapshot.forEach((doc) => {
            count++;
            const emp = doc.data();

            allEmployees.push({ id: doc.id, ...emp });

            const badgeClass = getBadgeClass(emp.access);

            tbody.innerHTML += `
                <tr>
                    <td>${count}</td>
                    <td>${emp.name}</td>
                    <td>${emp.nickname}</td>
                    <td><span class="badge ${badgeClass}">${emp.access}</span></td>
                    <td class="action-buttons">
                        <button class="btn-edit"
                            onclick="editEmployee(
                                '${doc.id}',
                                '${emp.name}',
                                '${emp.nickname}',
                                '${emp.password}',
                                '${emp.access}'
                            )">✏️ Edit</button>
                        <button class="btn-delete"
                            onclick="openDeleteModal('${doc.id}', '${emp.name}')">
                            🗑️ Delete</button>
                    </td>
                </tr>`;
        });
    });
}

loadEmployees();

// ===================================
// BADGE COLOR
// ===================================
function getBadgeClass(access) {
    switch(access) {
        case 'Admin':               return 'badge-admin';
        case 'Manager':             return 'badge-manager';
        case 'Cashier':             return 'badge-cashier';
        case 'Purchasing Officer':  return 'badge-purchasing';
        case 'Head Chef':           return 'badge-chef';
        case 'Call Operator':       return 'badge-operator';
        case 'Waiter':              return 'badge-waiter';
        default:                    return 'badge-default';
    }
}

// ===================================
// SEARCH EMPLOYEES
// ===================================
function searchEmployees() {
    const searchText = document.getElementById('searchEmployee').value.toLowerCase();
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    const filtered = allEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchText) ||
        emp.nickname.toLowerCase().includes(searchText) ||
        emp.access.toLowerCase().includes(searchText)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:20px; color:#888;">
                    🔍 No results found for "${searchText}"
                </td>
            </tr>`;
        return;
    }

    filtered.forEach((emp, index) => {
        const badgeClass = getBadgeClass(emp.access);
        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${emp.name}</td>
                <td>${emp.nickname}</td>
                <td><span class="badge ${badgeClass}">${emp.access}</span></td>
                <td class="action-buttons">
                    <button class="btn-edit"
                        onclick="editEmployee(
                            '${emp.id}',
                            '${emp.name}',
                            '${emp.nickname}',
                            '${emp.password}',
                            '${emp.access}'
                        )">✏️ Edit</button>
                    <button class="btn-delete"
                        onclick="openDeleteModal('${emp.id}', '${emp.name}')">
                        🗑️ Delete</button>
                </td>
            </tr>`;
    });
}

// ===================================
// OPEN ADD MODAL
// ===================================
function openAddModal() {
    document.getElementById('modalTitle').textContent = '➕ Add New Employee';
    document.getElementById('saveBtn').textContent = '💾 Save';
    document.getElementById('empName').value = '';
    document.getElementById('empNickname').value = '';
    document.getElementById('empPassword').value = '';
    document.getElementById('empAccess').value = '';
    document.getElementById('editDocId').value = '';
    document.getElementById('addModal').style.display = 'flex';
}

// ===================================
// EDIT EMPLOYEE
// ===================================
function editEmployee(docId, name, nickname, password, access) {
    document.getElementById('modalTitle').textContent = '✏️ Edit Employee';
    document.getElementById('saveBtn').textContent = '💾 Update';
    document.getElementById('empName').value = name;
    document.getElementById('empNickname').value = nickname;
    document.getElementById('empPassword').value = password;
    document.getElementById('empAccess').value = access;
    document.getElementById('editDocId').value = docId;
    document.getElementById('addModal').style.display = 'flex';
}

// ===================================
// CLOSE MODAL
// ===================================
function closeModal() {
    document.getElementById('addModal').style.display = 'none';
}

// ===================================
// SAVE / UPDATE EMPLOYEE
// ===================================
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

    try {
        if (editDocId) {
            await db.collection('employees').doc(editDocId).update({
                name: name,
                nickname: nickname,
                password: password,
                access: access
            });
            alert('✅ Employee updated successfully!');
        } else {
            const existCheck = await db.collection('employees')
                .where('nickname', '==', nickname).get();

            if (!existCheck.empty) {
                alert('⚠️ This nickname already exists! Please use a different one.');
                return;
            }

            await db.collection('employees').add({
                name: name,
                nickname: nickname,
                password: password,
                access: access,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('✅ Employee added successfully!');
        }

        closeModal();

    } catch (error) {
        console.error("Save error:", error);
        alert('❌ Error saving employee! Check console.');
    }
}

// ===================================
// DELETE MODAL
// ===================================
function openDeleteModal(docId, name) {
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
        alert('✅ Employee deleted successfully!');
        closeDeleteModal();
    } catch (error) {
        console.error("Delete error:", error);
        alert('❌ Error deleting employee!');
    }
}

// ===================================
// MODAL OUTSIDE CLICK - Close
// ===================================
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}