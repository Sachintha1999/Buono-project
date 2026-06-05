import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 👇 මේකට ඔයාගේ firebaseConfig එක දාන්න (Step 1 එකේ copy කරපු එක)
const firebaseConfig = {
  apiKey: "AIzaSyC1r8M_Gb2-TWbEXViM4DLpKil3mduMWOU",
  authDomain: "buono-project-927b8.firebaseapp.com",
  projectId: "buono-project-927b8",
  storageBucket: "buono-project-927b8.firebasestorage.app",
  messagingSenderId: "706681135399",
  appId: "1:706681135399:web:c15f197f1efe3a64f00902"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add Employee
window.addEmployee = async function() {
  const name = document.getElementById("empName").value;
  const nick = document.getElementById("nickName").value;
  const pass = document.getElementById("password").value;
  const access = document.getElementById("access").value;

  if (!name || !nick || !pass || !access) {
    alert("Please fill all fields!");
    return;
  }

  try {
    await addDoc(collection(db, "employees"), {
      name: name,
      nickname: nick,
      password: pass,
      access: access,
      createdAt: new Date()
    });
    alert("✅ Employee added successfully!");
    document.getElementById("empName").value = "";
    document.getElementById("nickName").value = "";
    document.getElementById("password").value = "";
    document.getElementById("access").value = "";
  } catch (e) {
    alert("❌ Error: " + e.message);
  }
};

// Delete Employee
window.deleteEmployee = async function(id) {
  if (confirm("Delete this employee?")) {
    await deleteDoc(doc(db, "employees", id));
  }
};

// Load Employees (real-time)
onSnapshot(collection(db, "employees"), (snapshot) => {
  const list = document.getElementById("empList");
  list.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    list.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.nickname}</td>
        <td>${d.password}</td>
        <td>${d.access}</td>
        <td><button class="delete-btn" onclick="deleteEmployee('${docSnap.id}')">🗑️</button></td>
      </tr>
    `;
  });
});