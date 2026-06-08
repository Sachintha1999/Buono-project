// ============================================
// 🏠 ACCESS PAGE - SCRIPT
// File: access-script.js
//
// 🔥 Firebase: Loaded from firebase-config.js
// 📦 Available globals: db, getCurrentUser(), logout(), DATABASES,
//                       checkDBAccess(), getAccessibleDatabases()
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
    if (badge) {
        badge.textContent = currentUser.access || 'User';
        badge.style.background = badgeColors[currentUser.access] || '#607D8B';
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const welcomeGreeting = document.getElementById('welcomeGreeting');
    if (welcomeGreeting) {
        welcomeGreeting.textContent = `${greeting}, ${currentUser.name || currentUser.nickname}! 👋`;
    }

    const statUser = document.getElementById('statUser');
    if (statUser) {
        statUser.textContent = currentUser.name || currentUser.nickname;
    }

    const statAccess = document.getElementById('statAccess');
    if (statAccess) {
        statAccess.textContent = currentUser.access || 'N/A';
    }

    const now = new Date();
    const statDate = document.getElementById('statDate');
    if (statDate) {
        statDate.textContent = now.toLocaleDateString('en-LK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// ===================================
// 🏗️ BUILD DATABASE CARDS (AUTO!)
// ===================================
function buildDatabaseCards() {
    const grid = document.getElementById('dbCardsGrid');
    if (!grid) return;

    const accessibleDatabases = getAccessibleDatabases(currentUser);

    document.getElementById('statDBCount').textContent = accessibleDatabases.length;

    if (accessibleDatabases.length === 0) {
        grid.innerHTML = `
            <div class="no-access-msg">
                <div class="na-icon">🔒</div>
                <h3>No Database Access</h3>
                <p>ඔයාට databases access කිරීමට permission නෑ.<br>Admin ට contact කරන්න.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = accessibleDatabases.map(database => buildDatabaseCard(database)).join('');
}

function buildDatabaseCard(database) {
    const cardClass = database.cardClass ? ` ${database.cardClass}` : '';
    const permission = (currentUser.permissions && currentUser.permissions[database.id]) || {};
    const permBadges = getPermissionBadgesHTML(database, permission);

    return `
        <a class="db-card${cardClass}" href="${database.url}">
            <div class="db-card-header">
                <div class="db-card-icon">${database.icon}</div>
                <span class="db-card-badge ${database.badgeClass || 'badge-entry'}">
                    ${database.badgeLabel || 'Database'}
                </span>
            </div>
            <div class="db-card-title">${database.name}</div>
            <div class="db-card-desc">${database.accessDescription || database.description || ''}</div>
            <div class="perm-badges">${permBadges}</div>
            <div class="db-card-arrow">→</div>
        </a>
    `;
}

// ===================================
// 🏷️ DATABASE-SPECIFIC PERMISSION BADGES
// ===================================
function getPermissionBadgesHTML(database, permission) {
    const role = currentUser.access || '';

    // Custom badges (example: Reports DB)
    if (Array.isArray(database.customPermBadges) && database.customPermBadges.length > 0) {
        return buildCustomPermBadges(database.customPermBadges);
    }

    // Special role badges (example: Call Operator → Call Center)
    if (database.specialRoleBadges && database.specialRoleBadges[role]) {
        return buildCustomPermBadges(database.specialRoleBadges[role]);
    }

    // Privileged role custom permission set (example: Admin/Manager → Call Center)
    if (
        Array.isArray(database.privilegedRoles) &&
        database.privilegedRoles.includes(role) &&
        database.privilegedRolePerms
    ) {
        return buildPermBadges(database.privilegedRolePerms);
    }

    // Default Admin full access badges
    if (role === 'Admin') {
        return buildPermBadges({
            add: true,
            view: true,
            selfView: true,
            edit: true,
            delete: true
        });
    }

    // Normal permission badges from employee permissions
    return buildPermBadges(permission);
}

function buildCustomPermBadges(badges) {
    return badges.map(badge => {
        return `<span class="perm-badge ${badge.cssClass || ''}">${badge.label || ''}</span>`;
    }).join('');
}

// ===================================
// 🏷️ BUILD STANDARD PERMISSION BADGES
// ===================================
function buildPermBadges(perm) {
    let html = '';
    if (perm.add) html += `<span class="perm-badge perm-add">➕ Add</span>`;
    if (perm.view) html += `<span class="perm-badge perm-view">👁️ View All</span>`;
    if (perm.selfView && !perm.view) html += `<span class="perm-badge perm-self">👤 Self View</span>`;
    if (perm.edit) html += `<span class="perm-badge perm-edit">✏️ Edit</span>`;
    if (perm.delete) html += `<span class="perm-badge perm-delete">🗑️ Delete</span>`;
    return html;
}

// ===================================
// 🚀 START!
// ===================================
init();