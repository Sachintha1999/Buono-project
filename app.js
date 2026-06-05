// ═══════════════════════════════════════════
// BUONO - ADMIN DASHBOARD (app.js)
// Admin Dashboard එකට විතරක් use වෙනවා
// Manager Dashboard එකේ script එක manager.html ඇතුලේ තියෙනවා
// ═══════════════════════════════════════════

// ===================================
// Firebase Config - ඔයාගේ project settings
// ===================================
const firebaseConfig = {
    apiKey: "AIzaSyBkXBs5GrfnMIFnJLJWkSMULYxGKz0Shtk",
    authDomain: "buono-project-927b8.firebaseapp.com",
    projectId: "buono-project-927b8",
    storageBucket: "buono-project-927b8.firebasestorage.app",
    messagingSenderId: "706681135399",
    appId: "1:706681135399:web:c15f197f1efe3a64f00902"
};

// Firebase Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===================================
// LOGIN CHECK - Admin ද බලනවා
// Dashboard open කරද්දී check කරනවා
// ===================================
function checkLogin() {
    const user = sessionStorage.getItem('loggedInUser');

    if (!user) {
        // Login නැත්නම් login page ට යවනවා
        window.location.href = "login.html";
        return null;
    }

    const userData = JSON.parse(user);

    // Admin විතරක් access දෙනවා admin dashboard ට
    if (userData.access !== 'Admin') {
        alert('⛔ You do not have Admin access!');
        sessionStorage.removeItem('loggedInUser');
        window.location.href = "login.html";
        return null;
    }

    // Welcome message update
    const welcomeEl = document.getElementById('welcomeUser');
    if (welcomeEl) {
        welcomeEl.textContent = `👋 Welcome, ${userData.name} (${userData.access})`;
    }

    // Access level card update
    const accessEl = document.getElementById('myAccess');
    if (accessEl) {
        accessEl.textContent = userData.access;
    }

    return userData;
}

// Page load වෙද්දී login check
const currentUser = checkLogin();

// ===================================
// LOGOUT FUNCTION
// ===================================
function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = "login.html";
}

// ===================================
// DATE & TIME UPDATE - ඉහළ cards වල
// ===================================
function updateDateTime() {
    const now = new Date();
    
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    const dateEl = document.getElementById('todayDate');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', options);
    
    const timeEl = document.getElementById('currentTime');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

updateDateTime();
setInterval(updateDateTime, 1000);

// ===================================
// ADD EMPLOYEE FUNCTION
// Form එකෙන් data ගන්නවා + Firebase ට save කරනවා
// ===================================
async function addEmployee() {
    const name = document.getElementById('empName').value.trim();
    const nickname = document.getElementById('empNickname').value.trim();
    const password = document.getElementById('empPassword').value.trim();
    const access = document.getElementById('empAccess').value;

    // Validation - හිස්ද බලනවා
    if (!name || !nickname || !password || !access) {
        alert('⚠️ Please fill all fields!');
        return;
    }

    try {
        // Nickname duplicate check
        const existCheck = await db.collection('employees')
            .where('nickname', '==', nickname).get();
        
        if (!existCheck.empty) {
            alert('⚠️ This nickname already exists!');
            return;
        }

        // Firebase ට add කරනවා
        await db.collection('employees').add({
            name: name,
            nickname: nickname,
            password: password,
            access: access,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('✅ Employee added successfully!');

        // Form clear කරනවා
        document.getElementById('empName').value = '';
        document.getElementById('empNickname').value = '';
        document.getElementById('empPassword').value = '';
        document.getElementById('empAccess').value = '';

    } catch (error) {
        console.error("Error adding employee:", error);
        alert('❌ Error adding employee!');
    }
}

// ===================================
// DELETE EMPLOYEE FUNCTION
// ===================================
async function deleteEmployee(docId, empName) {
    const confirmDelete = confirm(`⚠️ Are you sure you want to delete "${empName}"?`);
    
    if (!confirmDelete) return;

    try {
        await db.collection('employees').doc(docId).delete();
        alert('✅ Employee deleted!');
    } catch (error) {
        console.error("Error deleting:", error);
        alert('❌ Error deleting employee!');
    }
}

// ===================================
// BADGE COLOR FUNCTION
// Access type එක අනුව badge color දෙනවා
// ===================================
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

// ===================================
// LOAD EMPLOYEES - Real-time Firebase listener
// Employees collection එකේ changes ආවම auto update වෙනවා
// ===================================
db.collection('employees').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    const tbody = document.getElementById('employeeTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Total count update
    const totalEl = document.getElementById('totalEmployees');
    if (totalEl) totalEl.textContent = snapshot.size;

    if (snapshot.empty) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #888;">
                    📭 No employees found.
                </td>
            </tr>`;
        return;
    }

    let count = 0;
    snapshot.forEach((doc) => {
        count++;
        const emp = doc.data();
        const badgeClass = getBadgeClass(emp.access);

        tbody.innerHTML += `
            <tr>
                <td>${count}</td>
                <td>${emp.name}</td>
                <td>${emp.nickname}</td>
                <td><span class="badge ${badgeClass}">${emp.access}</span></td>
                <td>
                    <button class="btn-delete" onclick="deleteEmployee('${doc.id}', '${emp.name}')">🗑️ Delete</button>
                </td>
            </tr>`;
    });
});