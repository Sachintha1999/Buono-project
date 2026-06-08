// ============================================
// 🏠 ACCESS PAGE - SCRIPT
// File: access-script.js
// 
// 🔥 Firebase: Loaded from firebase-config.js
// 📦 Available globals: db, getCurrentUser(), logout()
// ============================================

let currentUser = null;

// ===================================
// 🚀 INIT
// ===================================
async function init() {
    const stored = sessionStorage.getItem('loggedInUser');
    if (!stored) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(stored);

    // Refresh permissions from Firebase
    try {
        const userDoc = await db.collection('employees').doc(currentUser.id).get();
        if (userDoc.exists) {
            const fresh = userDoc.data();
            currentUser.permissions = fresh.permissions || {};
            currentUser.access = fresh.access || currentUser.access;
            currentUser.name = fresh.name || currentUser.name;
            currentUser.nickname = fresh.nickname || currentUser.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(currentUser));
        }
    } catch (e) {
        console.warn('Could not refresh permissions:', e);
    }

    setupUI();
    buildDatabaseCards();
}

// ===================================
// 🎨 SETUP UI
// ===================================
function setupUI() {
    const badgeColors = {
        'Admin': '#ff4444',
        'Manager': '#2196F3',
        'Cashier': '#4CAF50',
        'Purchasing Officer': '#FF9800',
        'Head Chef': '#9C27B0',
        'Call Operator': '#00BCD4',
        'Waiter': '#607D8B'
    };

    const badge = document.getElementById('userBadge');
    badge.textContent = currentUser.access || 'User';
    badge.style.background = badgeColors[currentUser.access] || '#607D8B';

    const hour = new Date().getHours();
    let greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    document.getElementById('welcomeGreeting').textContent =
        `${greeting}, ${currentUser.name || currentUser.nickname}! 👋`;

    document.getElementById('statUser').textContent = currentUser.name || currentUser.nickname;
    document.getElementById('statAccess').textContent = currentUser.access || 'N/A';

    const now = new Date();
    document.getElementById('statDate').textContent =
        now.toLocaleDateString('en-LK', { year:'numeric', month:'short', day:'numeric' });
}

// ===================================
// 🏗️ BUILD DATABASE CARDS
// ===================================
function buildDatabaseCards() {
    const permissions  = currentUser.permissions || {};
    const access       = currentUser.access || '';
    const isAdmin      = access === 'Admin';
    const isAdminOrMgr = ['Admin', 'Manager'].includes(access);
    const grid         = document.getElementById('dbCardsGrid');
    grid.innerHTML     = '';
    let cardCount      = 0;

    // ── 1. EMPLOYEE DATABASE ──
    const empPerm = permissions.employeeDB || {};
    const empAccess = isAdmin || empPerm.add || empPerm.view || empPerm.selfView || empPerm.edit;
    if (empAccess) {
        const permBadges = buildPermBadges(isAdmin ? {add:true,view:true,selfView:true,edit:true,delete:true} : empPerm);
        grid.innerHTML += `
            <a class="db-card" href="index.html">
                <div class="db-card-header">
                    <div class="db-card-icon">👥</div>
                    <span class="db-card-badge badge-entry">Data Entry</span>
                </div>
                <div class="db-card-title">Employee Database</div>
                <div class="db-card-desc">Employee profiles, permissions සහ access management.</div>
                <div class="perm-badges">${permBadges}</div>
                <div class="db-card-arrow">→</div>
            </a>
        `;
        cardCount++;
    }

    // ── 2. DAY END REPORT DATABASE ──
    const dayPerm = permissions.dayEndReportDB || {};
    const dayAccess = isAdmin || dayPerm.add || dayPerm.view || dayPerm.selfView;
    if (dayAccess) {
        const permBadges = buildPermBadges(isAdmin ? {add:true,view:true,selfView:true,edit:true,delete:true} : dayPerm);
        grid.innerHTML += `
            <a class="db-card" href="cashier.html">
                <div class="db-card-header">
                    <div class="db-card-icon">💰</div>
                    <span class="db-card-badge badge-entry">Data Entry</span>
                </div>
                <div class="db-card-title">Day End Report Database</div>
                <div class="db-card-desc">Daily cashier reports, cash flow සහ bank deposits.</div>
                <div class="perm-badges">${permBadges}</div>
                <div class="db-card-arrow">→</div>
            </a>
        `;
        cardCount++;
    }

    // ── 3. INVENTORY DATABASE ──
    const invPerm = permissions.inventoryDB || {};
    const invAccess = isAdmin || invPerm.add || invPerm.view || invPerm.selfView || invPerm.edit;
    if (invAccess) {
        const permBadges = buildPermBadges(isAdmin ? {add:true,view:true,selfView:true,edit:true,delete:true} : invPerm);
        grid.innerHTML += `
            <a class="db-card" href="inventory.html">
                <div class="db-card-header">
                    <div class="db-card-icon">📦</div>
                    <span class="db-card-badge badge-entry">Data Entry</span>
                </div>
                <div class="db-card-title">Inventory Database</div>
                <div class="db-card-desc">Stock management, items, categories සහ low stock alerts.</div>
                <div class="perm-badges">${permBadges}</div>
                <div class="db-card-arrow">→</div>
            </a>
        `;
        cardCount++;
    }

    // ── 4. KITCHEN DATABASE ──
    const kitPerm = permissions.kitchenDB || {};
    const kitAccess = isAdmin || kitPerm.add || kitPerm.view || kitPerm.selfView || kitPerm.edit;
    if (kitAccess) {
        const permBadges = buildPermBadges(isAdmin ? {add:true,view:true,selfView:true,edit:true,delete:true} : kitPerm);
        grid.innerHTML += `
            <a class="db-card" href="kitchen.html">
                <div class="db-card-header">
                    <div class="db-card-icon">🍳</div>
                    <span class="db-card-badge badge-kitchen">Kitchen</span>
                </div>
                <div class="db-card-title">Kitchen Database</div>
                <div class="db-card-desc">Recipes, staff meals, wastage tracking සහ stock count.</div>
                <div class="perm-badges">${permBadges}</div>
                <div class="db-card-arrow">→</div>
            </a>
        `;
        cardCount++;
    }

    // ── 5. PURCHASING DATABASE ──
    const purPerm = permissions.purchasingDB || {};
    const purAccess = isAdmin || purPerm.add || purPerm.view || purPerm.selfView || purPerm.edit;
    if (purAccess) {
        const permBadges = buildPermBadges(isAdmin ? {add:true,view:true,selfView:true,edit:true,delete:true} : purPerm);
        grid.innerHTML += `
            <a class="db-card purchasing-card" href="purchasing.html">
                <div class="db-card-header">
                    <div class="db-card-icon">🛒</div>
                    <span class="db-card-badge badge-purchasing">Purchasing</span>
                </div>
                <div class="db-card-title">Purchasing Database</div>
                <div class="db-card-desc">Supplier bills, purchase orders, payment tracking සහ stock IN.</div>
                <div class="perm-badges">${permBadges}</div>
                <div class="db-card-arrow">→</div>
            </a>
        `;
        cardCount++;
    }

    // ── 6. CALL CENTER DATABASE ── ⭐ NEW!
    const callPerm = permissions.callCenterDB || {};
    const isCallOperator = access === 'Call Operator';
    const callAccess = isAdmin || isAdminOrMgr || isCallOperator ||
                       callPerm.add || callPerm.view || callPerm.edit;
    if (callAccess) {
        const permBadges = (isAdmin || isAdminOrMgr)
            ? buildPermBadges({add:true, view:true, edit:true, delete:true})
            : isCallOperator
                ? `<span class="perm-badge perm-add">➕ Add</span>
                   <span class="perm-badge perm-view">👁️ View</span>
                   <span class="perm-badge perm-edit">✏️ Edit</span>`
                : buildPermBadges(callPerm);

        grid.innerHTML += `
            <a class="db-card callcenter-card" href="callcenter.html">
                <div class="db-card-header">
                    <div class="db-card-icon">📞</div>
                    <span class="db-card-badge badge-callcenter">Call Center</span>
                </div>
                <div class="db-card-title">Call Center</div>
                <div class="db-card-desc">Academy lead management, call logs, follow-ups සහ enrollment tracking.</div>
                <div class="perm-badges">${permBadges}</div>
                <div class="db-card-arrow">→</div>
            </a>
        `;
        cardCount++;
    }

    // ── 7. REPORTS DATABASE (Admin/Manager only) ──
    if (isAdminOrMgr) {
        grid.innerHTML += `
            <a class="db-card reports-card" href="reports.html">
                <div class="db-card-header">
                    <div class="db-card-icon">📊</div>
                    <span class="db-card-badge badge-management">Management</span>
                </div>
                <div class="db-card-title">Reports Database</div>
                <div class="db-card-desc">
                    Business reports, analytics සහ management insights.
                    Day End, Employee, Stock Count, Purchasing සහ P/L reports.
                </div>
                <div class="perm-badges">
                    <span class="perm-badge perm-reports">📊 View Reports</span>
                    <span class="perm-badge perm-reports">⏳ Approvals</span>
                    <span class="perm-badge perm-reports">📋 All Data</span>
                </div>
                <div class="db-card-arrow">→</div>
            </a>
        `;
        cardCount++;
    }

    document.getElementById('statDBCount').textContent = cardCount;

    if (cardCount === 0) {
        grid.innerHTML = `
            <div class="no-access-msg">
                <div class="na-icon">🔒</div>
                <h3>No Database Access</h3>
                <p>ඔයාට databases access කිරීමට permission නෑ.<br>Admin ට contact කරන්න.</p>
            </div>
        `;
    }
}

// ===================================
// 🏷️ BUILD PERMISSION BADGES
// ===================================
function buildPermBadges(perm) {
    let html = '';
    if (perm.add)      html += `<span class="perm-badge perm-add">➕ Add</span>`;
    if (perm.view)     html += `<span class="perm-badge perm-view">👁️ View All</span>`;
    if (perm.selfView && !perm.view)
                       html += `<span class="perm-badge perm-self">👤 Self View</span>`;
    if (perm.edit)     html += `<span class="perm-badge perm-edit">✏️ Edit</span>`;
    if (perm.delete)   html += `<span class="perm-badge perm-delete">🗑️ Delete</span>`;
    return html;
}

// ===================================
// 🚀 START!
// ===================================
init();