// ==============================
// BUONO EMPLOYEE MANAGEMENT SYSTEM
// app.js - Main Application Logic
// ==============================

// ----- Firebase Configuration -----
// ⚠️ මේ values ඔයාගේ Firebase project එකේ values වලින් replace කරන්න!
const firebaseConfig = {
  apiKey: "AIzaSyC1r8M_Gb2-TWbEXViM4DLpKil3mduMWOU",
  authDomain: "buono-project-927b8.firebaseapp.com",
  projectId: "buono-project-927b8",
  storageBucket: "buono-project-927b8.firebasestorage.app",
  messagingSenderId: "706681135399",
  appId: "1:706681135399:web:c15f197f1efe3a64f00902"
};


// Firebase Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==============================
// LOGIN CHECK - Dashboard open කරද්දී check කරනවා
// ==============================

function checkLogin() {
    const user = sessionStorage.getItem('loggedInUser');
    
    if (!user) {
        // Login වෙලා නැත්තං login page එකට යවනවා
        window.location.href = "login.html";
        return null;
    }
    
    const userData = JSON.parse(user);
    
    // Welcome message update
    const welcomeEl = document.getElementById('welcomeUser');
    if (welcomeEl) {
        welcomeEl.textContent = `👋 Welcome, ${userData.name} (${userData.access})`;
    }
    
    return userData;
}

// Page load වෙද්දී login check කරනවා
const currentUser = checkLogin();

// ==============================
// LOGOUT FUNCTION
// ==============================

function logoutUser() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = "login.html";
    }
}

// ==============================
// ADD EMPLOYEE FUNCTION
// ==============================

async function addEmployee() {
    const name = document.getElementById('empName').value.trim();
    const nickname = document.getElementById('empNickname').value.trim();
    const password = document.getElementById('empPassword').value.trim();
    const access = document.getElementById('empAccess').value;

    // Validation
    if (!name || !nickname || !password || !access) {
        alert("⚠️ Please fill all fields!");
        return;
    }

    // Nickname duplicate check
    try {
        const existing = await db.collection("employees")
            .where("nickname", "==", nickname)
            .get();
        
        if (!existing.empty) {
            alert("⚠️ This nickname already exists! Please use a different one.");
            return;
        }
    } catch (error) {
        console.error("Error checking nickname:", error);
    }

    // Add to Firestore
    try {
        await db.collection("employees").add({
            name: name,
            nickname: nickname,
            password: password,
            access: access,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear form
        document.getElementById('empName').value = '';
        document.getElementById('empNickname').value = '';
        document.getElementById('empPassword').value = '';
        document.getElementById('empAccess').value = '';

        alert("✅ Employee added successfully!");

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

// ==============================
// DELETE EMPLOYEE FUNCTION
// ==============================

async function deleteEmployee(id, name) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
        try {
            await db.collection("employees").doc(id).delete();
            alert("✅ Employee deleted!");
        } catch (error) {
            alert("❌ Error: " + error.message);
        }
    }
}

// ==============================
// GET ACCESS BADGE (Color coded)
// ==============================

function getAccessBadge(access) {
    const badges = {
        'Admin': 'badge-admin',
        'Manager': 'badge-manager',
        'Cashier': 'badge-cashier',
        'Purchasing Officer': 'badge-purchasing',
        'Head Chef': 'badge-headchef',
        'Call Operator': 'badge-calloperator',
        'Waiter': 'badge-waiter'
    };
    
    const badgeClass = badges[access] || 'badge-admin';
    return `<span class="badge ${badgeClass}">${access}</span>`;
}

// ==============================
// REAL-TIME DATA LOAD (Live updates)
// ==============================

db.collection("employees")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
        const employeeList = document.getElementById("employeeList");
        
        if (!employeeList) return; // Login page එකේ table නැහැ
        
        employeeList.innerHTML = "";

        if (snapshot.empty) {
            employeeList.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:#6b7a90; padding:30px;">
                        No employees found. Add your first employee above! 👆
                    </td>
                </tr>
            `;
            return;
        }

        snapshot.forEach((doc) => {
            const emp = doc.data();
            const row = document.createElement("tr");
            
            row.innerHTML = `
                <td>${emp.name || '-'}</td>
                <td>${emp.nickname || '-'}</td>
                <td>${emp.password || '-'}</td>
                <td>${getAccessBadge(emp.access)}</td>
                <td>
                    <button class="delete-btn" onclick="deleteEmployee('${doc.id}', '${emp.name}')">
                        🗑️ Delete
                    </button>
                </td>
            `;
            
            employeeList.appendChild(row);
        });
    }, (error) => {
        console.error("Error loading employees:", error);
    });