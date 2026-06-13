// ============================================
// 🏠 ACCESS PAGE - SCRIPT
// File: access-script.js
// Version: 2.0 - Speed + Smooth + Professional
//
// 🔥 Firebase: Loaded from firebase-config.js
// 📦 Available globals: db, getCurrentUser(), logout(), DATABASES,
//                       checkDBAccess(), getAccessibleDatabases()
// ============================================

let currentUser = null;

const ACCESS_CACHE_KEY  = 'buono_access_user_v2';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────
// ⏱️ PERF TRACKER (lightweight inline)
// ─────────────────────────────────────────
const Perf = {
    _marks: {},
    start(label) { this._marks[label] = performance.now(); },
    end(label) {
        const t = performance.now() - (this._marks[label] || 0);
        console.log(`⚡ [Access] ${label}: ${t.toFixed(1)}ms`);
        return t;
    }
};

// ─────────────────────────────────────────
// 🗄️ SIMPLE CACHE HELPERS
// ─────────────────────────────────────────
function cacheSet(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch(e) {}
}

function cacheGet(key, maxAge = CACHE_DURATION_MS) {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > maxAge) { sessionStorage.removeItem(key); return null; }
        return data;
    } catch(e) { return null; }
}

// ─────────────────────────────────────────
// 🚀 INIT
// ─────────────────────────────────────────
async function init() {
    Perf.start('Total Init');

    const stored = sessionStorage.getItem('loggedInUser');
    if (!stored) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(stored);

    // ── Try cache first (instant!) ──
    const cached = cacheGet(ACCESS_CACHE_KEY);
    if (cached) {
        console.log('✅ [Access] Using cached permissions');
        currentUser.permissions = cached.permissions;
        currentUser.access      = cached.access;
        currentUser.name        = cached.name;
        currentUser.nickname    = cached.nickname;
        renderAll();
        Perf.end('Total Init');
        // Silently refresh in background
        refreshPermissionsBackground();
        return;
    }

    // ── No cache → fetch from Firebase ──
    Perf.start('Firebase Fetch');
    try {
        const userDoc = await db.collection('employees').doc(currentUser.id).get();
        if (userDoc.exists) {
            const fresh = userDoc.data();
            currentUser.permissions = fresh.permissions || {};
            currentUser.access      = fresh.access      || currentUser.access;
            currentUser.name        = fresh.name        || currentUser.name;
            currentUser.nickname    = fresh.nickname    || currentUser.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(currentUser));
            cacheSet(ACCESS_CACHE_KEY, {
                permissions: currentUser.permissions,
                access:      currentUser.access,
                name:        currentUser.name,
                nickname:    currentUser.nickname
            });
        }
    } catch(e) {
        console.warn('⚠️ [Access] Could not refresh permissions:', e);
    }
    Perf.end('Firebase Fetch');

    renderAll();
    Perf.end('Total Init');
}

// ─────────────────────────────────────────
// 🔄 BACKGROUND PERMISSION REFRESH
// ─────────────────────────────────────────
async function refreshPermissionsBackground() {
    try {
        const userDoc = await db.collection('employees').doc(currentUser.id).get();
        if (userDoc.exists) {
            const fresh = userDoc.data();
            currentUser.permissions = fresh.permissions || {};
            currentUser.access      = fresh.access      || currentUser.access;
            currentUser.name        = fresh.name        || currentUser.name;
            currentUser.nickname    = fresh.nickname    || currentUser.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(currentUser));
            cacheSet(ACCESS_CACHE_KEY, {
                permissions: currentUser.permissions,
                access:      currentUser.access,
                name:        currentUser.name,
                nickname:    currentUser.nickname
            });
        }
    } catch(e) {}
}

// ─────────────────────────────────────────
// 🎨 RENDER ALL
// ─────────────────────────────────────────
function renderAll() {
    setupUI();
    buildDatabaseCards();
    revealPage();
}

// ─────────────────────────────────────────
// ✨ REVEAL PAGE (smooth fade-in)
// ─────────────────────────────────────────
function revealPage() {
    // Hide loading overlay
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');

    // Fade in main content
    const main = document.getElementById('mainContent');
    if (main) {
        main.style.opacity = '1';
    }

    // Stagger stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 80);
    });

    // Stagger db cards
    const dbCards = document.querySelectorAll('.db-card:not(.skeleton-db-card)');
    dbCards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), 200 + i * 90);
    });
}

// ─────────────────────────────────────────
// 🎨 SETUP UI
// ─────────────────────────────────────────
function setupUI() {
    const badgeColors = {
        'Admin':              '#ff4444',
        'Manager':            '#2196F3',
        'Cashier':            '#4CAF50',
        'Purchasing Officer': '#FF9800',
        'Head Chef':          '#9C27B0',
        'Call Operator':      '#00BCD4',
        'Waiter':             '#607D8B'
    };

    // User badge
    const badge = document.getElementById('userBadge');
    if (badge) {
        badge.textContent  = currentUser.access || 'User';
        badge.style.background = badgeColors[currentUser.access] || '#607D8B';
    }

    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const welcomeEl = document.getElementById('welcomeGreeting');
    if (welcomeEl) {
        welcomeEl.textContent = `${greeting}, ${currentUser.name || currentUser.nickname}! 👋`;
    }

    // Stat cards - replace skeletons with real content
    _fillStatCard('statCard1', '👤', currentUser.name || currentUser.nickname, 'Logged In User');
    _fillStatCard('statCard2', '🏷️', currentUser.access || 'N/A', 'Access Level');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
    _fillStatCard('statCard3', '📅', dateStr, 'Today\'s Date');
    // statCard4 (DB count) filled after buildDatabaseCards
}

function _fillStatCard(id, icon, value, label) {
    const card = document.getElementById(id);
    if (!card) return;
    card.classList.remove('skeleton-card');
    card.innerHTML = `
        <div class="stat-icon">${icon}</div>
        <div class="stat-info">
            <div class="stat-value" id="${id}_val">${value}</div>
            <div class="stat-label">${label}</div>
        </div>
    `;
}

// ─────────────────────────────────────────
// 🏗️ BUILD DATABASE CARDS
// ─────────────────────────────────────────
function buildDatabaseCards() {
    const grid = document.getElementById('dbCardsGrid');
    if (!grid) return;

    const accessibleDatabases = getAccessibleDatabases(currentUser);

    // Fill DB count stat card
    _fillStatCard('statCard4', '🗄️', accessibleDatabases.length, 'Databases Available');

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

    grid.innerHTML = accessibleDatabases.map(db => buildDatabaseCard(db)).join('');
}

function buildDatabaseCard(database) {
    const cardClass   = database.cardClass ? ` ${database.cardClass}` : '';
    const permission  = (currentUser.permissions && currentUser.permissions[database.id]) || {};
    const permBadges  = getPermissionBadgesHTML(database, permission);

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

// ─────────────────────────────────────────
// 🏷️ PERMISSION BADGES
// ─────────────────────────────────────────
function getPermissionBadgesHTML(database, permission) {
    const role = currentUser.access || '';

    if (Array.isArray(database.customPermBadges) && database.customPermBadges.length > 0) {
        return buildCustomPermBadges(database.customPermBadges);
    }
    if (database.specialRoleBadges && database.specialRoleBadges[role]) {
        return buildCustomPermBadges(database.specialRoleBadges[role]);
    }
    if (
        Array.isArray(database.privilegedRoles) &&
        database.privilegedRoles.includes(role) &&
        database.privilegedRolePerms
    ) {
        return buildPermBadges(database.privilegedRolePerms);
    }
    if (role === 'Admin') {
        return buildPermBadges({ add: true, view: true, selfView: true, edit: true, delete: true });
    }
    return buildPermBadges(permission);
}

function buildCustomPermBadges(badges) {
    return badges.map(b => `<span class="perm-badge ${b.cssClass || ''}">${b.label || ''}</span>`).join('');
}

function buildPermBadges(perm) {
    let html = '';
    if (perm.add)                html += `<span class="perm-badge perm-add">➕ Add</span>`;
    if (perm.view)               html += `<span class="perm-badge perm-view">👁️ View All</span>`;
    if (perm.selfView && !perm.view) html += `<span class="perm-badge perm-self">👤 Self View</span>`;
    if (perm.edit)               html += `<span class="perm-badge perm-edit">✏️ Edit</span>`;
    if (perm.delete)             html += `<span class="perm-badge perm-delete">🗑️ Delete</span>`;
    return html;
}

// ─────────────────────────────────────────
// 🚀 START!
// ─────────────────────────────────────────
init();