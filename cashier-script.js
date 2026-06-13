// ═══════════════════════════════════════════════════════════
// 💰 BUONO - DAY END REPORTS DATABASE
// File: cashier-script.js
// Version: 11.0 - Speed + Smooth + Professional
// ⭐ Uses global DATABASES from firebase-config.js
// ⭐ Original logic 100% preserved + enhancements
// ═══════════════════════════════════════════════════════════

let currentUser = null;
let myPerms = null;
let deleteReportId = null;
let expenseRowCount = 1;
let depositRowCount = 1;

// ─── Pagination state ───
const REPORTS_PAGE_SIZE = 20;
let allReportsCache = [];
let reportsLoaded = false;
let reportsDisplayed = 0;

// ─── Cache keys ───
const USER_CACHE_KEY    = 'buono_cashier_user_v1';
const REPORTS_CACHE_KEY = 'buono_cashier_reports_v1';
const CACHE_DURATION_MS = 5 * 60 * 1000;       // 5 min for user
const REPORTS_CACHE_MS  = 2 * 60 * 1000;       // 2 min for reports

// ─── Perf tracker ───
const Perf = {
    _marks: {},
    start(label) { this._marks[label] = performance.now(); },
    end(label) {
        const t = performance.now() - (this._marks[label] || 0);
        console.log(`⚡ [Cashier] ${label}: ${t.toFixed(1)}ms`);
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
function cacheRemove(key) {
    try { sessionStorage.removeItem(key); } catch (e) {}
}

// ═══════════════════════════════════════════════════════════
// 🚀 INITIALIZE APP
// ═══════════════════════════════════════════════════════════
async function initializeApp() {
    Perf.start('Total Init');

    const userData = getCurrentUser();
    if (!userData) { window.location.href = "login.html"; return; }

    // ── Try cache first ──
    const cached = cacheGet(USER_CACHE_KEY, CACHE_DURATION_MS);
    if (cached) {
        console.log('✅ [Cashier] Using cached user permissions');
        userData.access      = cached.access;
        userData.permissions = cached.permissions;
        userData.name        = cached.name;
        userData.nickname    = cached.nickname;
        applyUserData(userData);
        // Background refresh
        refreshUserBackground(userData.id);
    } else {
        Perf.start('Firebase User Fetch');
        try {
            const userDoc = await db.collection('employees').doc(userData.id).get();
            if (userDoc.exists) {
                const latestData = userDoc.data();
                userData.access      = latestData.access;
                userData.permissions = latestData.permissions || {};
                userData.name        = latestData.name;
                userData.nickname    = latestData.nickname;
                sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
                cacheSet(USER_CACHE_KEY, {
                    access:      userData.access,
                    permissions: userData.permissions,
                    name:        userData.name,
                    nickname:    userData.nickname
                });
            }
        } catch (error) {
            console.error('Could not fetch latest user data:', error);
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
            const latest = userDoc.data();
            const merged = {
                access:      latest.access,
                permissions: latest.permissions || {},
                name:        latest.name,
                nickname:    latest.nickname
            };
            cacheSet(USER_CACHE_KEY, merged);
        }
    } catch (e) {}
}

function applyUserData(userData) {
    const isAdmin = userData.access === 'Admin';
    const perms   = userData.permissions?.dayEndReportDB || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView || perms.edit || perms.delete;

    if (!hasAccess) {
        alert('⛔ ඔයාට Day End Reports database එකට access නැහැ!');
        window.location.href = "access.html";
        return;
    }

    myPerms = isAdmin
        ? { add: true, view: true, selfView: true, edit: true, delete: true }
        : perms;

    currentUser = userData;

    document.getElementById('welcomeUser').textContent     = `👋 Welcome, ${userData.name} (${userData.access})`;
    document.getElementById('reportCashier').value         = userData.name;

    buildDBSwitcherDropdown();
    setupUI();
    fillStatCards();
    loadReportCount();
    revealPage();
}

// ═══════════════════════════════════════════════════════════
// ✨ REVEAL PAGE (smooth fade-in)
// ═══════════════════════════════════════════════════════════
function revealPage() {
    const overlay = document.getElementById('cashierLoadingOverlay');
    if (overlay) overlay.classList.add('hidden');

    const main = document.getElementById('cashierMainContent');
    if (main) main.style.opacity = '1';

    // Stagger stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 80);
    });
}

// ═══════════════════════════════════════════════════════════
// 📊 FILL STAT CARDS (remove skeleton state)
// ═══════════════════════════════════════════════════════════
function fillStatCards() {
    // Cashier card
    _fillStat('statCardCashier', '👤', currentUser.name, 'Cashier');

    // Date card
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
    _fillStat('statCardDate', '📅', dateStr, 'Today');

    // Time card (will auto-update via setInterval)
    const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    _fillStat('statCardTime', '⏰', timeStr, 'Current Time', 'currentTime');

    // Reports card (count loaded later)
    const reportsLabel = myPerms.view ? 'Total Reports' : 'My Reports';
    _fillStat('statCardReports', '📋', '0', reportsLabel, 'totalReportsCard');
}

function _fillStat(cardId, icon, value, label, valueId = null) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.remove('skeleton-stat');
    const valueHTML = valueId ? `<h3 id="${valueId}">${value}</h3>` : `<h3>${value}</h3>`;
    card.innerHTML = `
        <div class="stat-icon">${icon}</div>
        <div class="stat-info">
            ${valueHTML}
            <p>${label}</p>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════
// 🔄 DB SWITCHER DROPDOWN
// ═══════════════════════════════════════════════════════════
function buildDBSwitcherDropdown() {
    const list = document.getElementById('dbDropdownList');
    if (!list) return;

    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';

    DATABASES.forEach(database => {
        if (database.adminManagerOnly && !isAdminOrMgr) return;

        const isAdmin = currentUser.access === 'Admin';
        const dbPerms = currentUser.permissions?.[database.id] || {};
        const hasAccess = isAdmin || dbPerms.add || dbPerms.view || dbPerms.selfView || dbPerms.edit || dbPerms.delete;

        if (!database.adminManagerOnly && !hasAccess) return;

        const isCurrent = database.id === 'dayEndReportDB';

        html += `
            <a href="${database.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}">
                <span>${database.icon}</span>
                <span>${database.name}</span>
                ${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}
            </a>
        `;
    });

    list.innerHTML = html;

    const switcher = document.getElementById('dbSwitcher');
    if (switcher) {
        switcher.addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('dbDropdown').classList.toggle('show');
        });
    }

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('dbDropdown');
        if (dropdown && !dropdown.contains(e.target) && !e.target.closest('#dbSwitcher')) {
            dropdown.classList.remove('show');
        }
    });
}

// ═══════════════════════════════════════════════════════════
// 🎨 SETUP UI
// ═══════════════════════════════════════════════════════════
function setupUI() {
    if (!myPerms.add) {
        document.getElementById('tab-new-btn').style.display = 'none';
        showSection('myReports', document.getElementById('tab-reports-btn'));
    }

    if (myPerms.view) {
        document.getElementById('reportsTitle').textContent = '📋 All Reports';
    } else if (myPerms.selfView) {
        document.getElementById('reportsTitle').textContent = '📋 My Reports';
    }
}

// ═══════════════════════════════════════════════════════════
// 🕒 DATE / TIME UPDATER
// ═══════════════════════════════════════════════════════════
function updateDateTime() {
    const now = new Date();

    const dateEl = document.getElementById('todayDate');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
    }

    const timeEl = document.getElementById('currentTime');
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    }
}

function setupReportDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateEl = document.getElementById('reportDate');
    if (dateEl) dateEl.value = `${yyyy}-${mm}-${dd}`;
}

// Start ticking immediately
setInterval(updateDateTime, 1000);
setupReportDate();

// ═══════════════════════════════════════════════════════════
// 📑 SECTION SWITCHING
// ═══════════════════════════════════════════════════════════
function showSection(sectionName, btnEl) {
    document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('section-' + sectionName).classList.add('active');
    if (btnEl) btnEl.classList.add('active');
    if (sectionName === 'myReports') loadReports();
}

// ═══════════════════════════════════════════════════════════
// ➕ EXPENSE / DEPOSIT ROWS
// ═══════════════════════════════════════════════════════════
function addExpenseRow() {
    const container = document.getElementById('expensesContainer');
    const rowId = 'expense-row-' + expenseRowCount;
    const row = document.createElement('div');
    row.className = 'multi-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" placeholder="Description (උදා: Milk, Gas...)" class="expense-desc">
        <input type="number" placeholder="Amount" class="expense-amount amount-input" oninput="calculateShortExcess()">
        <button type="button" class="btn-remove-row" onclick="removeRow('${rowId}')">✕</button>
    `;
    container.appendChild(row);
    expenseRowCount++;
}

function addDepositRow() {
    const container = document.getElementById('depositsContainer');
    const rowId = 'deposit-row-' + depositRowCount;
    const row = document.createElement('div');
    row.className = 'multi-row';
    row.id = rowId;
    row.innerHTML = `
        <select class="deposit-bank">
            <option value="">-- Select Bank --</option>
            <option value="BOC">BOC</option>
            <option value="Commercial Bank">Commercial Bank</option>
            <option value="Sampath Bank">Sampath Bank</option>
            <option value="HNB">HNB</option>
            <option value="People's Bank">People's Bank</option>
        </select>
        <input type="number" placeholder="Amount" class="deposit-amount amount-input" oninput="calculateShortExcess()">
        <button type="button" class="btn-remove-row" onclick="removeRow('${rowId}')">✕</button>
    `;
    container.appendChild(row);
    depositRowCount++;
}

function removeRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    // Smooth remove animation
    row.classList.add('removing');
    setTimeout(() => {
        row.remove();
        calculateShortExcess();
    }, 220);
}

// ═══════════════════════════════════════════════════════════
// 💰 CALCULATE SHORT / EXCESS
// ═══════════════════════════════════════════════════════════
function calculateShortExcess() {
    const startingCash  = parseFloat(document.getElementById('startingCash').value)  || 0;
    const posSale       = parseFloat(document.getElementById('posSale').value)       || 0;
    const serviceCharge = parseFloat(document.getElementById('serviceCharge').value) || 0;
    const dayEndCash    = parseFloat(document.getElementById('dayEndCash').value)    || 0;

    let totalExpenses = 0;
    document.querySelectorAll('.expense-amount').forEach(input => {
        totalExpenses += parseFloat(input.value) || 0;
    });
    document.getElementById('totalExpenses').textContent = 'Rs. ' + totalExpenses.toFixed(2);

    let totalDeposits = 0;
    document.querySelectorAll('.deposit-amount').forEach(input => {
        totalDeposits += parseFloat(input.value) || 0;
    });
    document.getElementById('totalDeposits').textContent = 'Rs. ' + totalDeposits.toFixed(2);

    const expectedCash = startingCash + posSale + serviceCharge - totalExpenses - totalDeposits;
    const shortExcess  = dayEndCash - expectedCash;

    const box      = document.getElementById('shortExcessBox');
    const valueEl  = document.getElementById('shortExcessValue');
    const statusEl = document.getElementById('shortExcessStatus');

    box.className     = 'short-excess-box';
    valueEl.className = 'short-excess-value';

    if (dayEndCash === 0 && startingCash === 0 && posSale === 0) {
        valueEl.textContent = 'Rs. 0.00';
        statusEl.textContent = '⏳ Data enter කරන්න...';
        statusEl.style.color = '#888';
    } else if (Math.abs(shortExcess) < 0.01) {
        box.classList.add('perfect');
        valueEl.classList.add('perfect');
        valueEl.textContent = 'Rs. 0.00';
        statusEl.textContent = '✅ PERFECT! හරියටම ගැලපෙනවා!';
        statusEl.style.color = '#4CAF50';
    } else if (shortExcess > 0) {
        box.classList.add('excess');
        valueEl.classList.add('excess');
        valueEl.textContent = '+ Rs. ' + shortExcess.toFixed(2);
        statusEl.textContent = '⬆️ EXCESS - සල්ලි වැඩියි';
        statusEl.style.color = '#f0a500';
    } else {
        box.classList.add('short');
        valueEl.classList.add('short');
        valueEl.textContent = '- Rs. ' + Math.abs(shortExcess).toFixed(2);
        statusEl.textContent = '⬇️ SHORT - සල්ලි අඩුයි';
        statusEl.style.color = '#ff4444';
    }
}

// ═══════════════════════════════════════════════════════════
// 📤 SUBMIT REPORT
// ═══════════════════════════════════════════════════════════
async function submitReport() {
    if (!myPerms.add) {
        alert('⛔ ඔයාට Add permission නැහැ!');
        return;
    }

    const shiftType     = document.getElementById('shiftType').value;
    const startingCash  = parseFloat(document.getElementById('startingCash').value)  || 0;
    const posSale       = parseFloat(document.getElementById('posSale').value)       || 0;
    const serviceCharge = parseFloat(document.getElementById('serviceCharge').value) || 0;
    const cardMachine   = parseFloat(document.getElementById('cardMachine').value)   || 0;
    const dayEndCash    = parseFloat(document.getElementById('dayEndCash').value)    || 0;

    if (!shiftType) { alert('⚠️ Shift Type select කරන්න!'); return; }
    if (startingCash === 0 && posSale === 0 && dayEndCash === 0) { alert('⚠️ Values enter කරන්න!'); return; }

    const expenses = [];
    let totalExpenses = 0;
    document.querySelectorAll('.multi-row[id^="expense-row"]').forEach(row => {
        const desc   = row.querySelector('.expense-desc').value.trim();
        const amount = parseFloat(row.querySelector('.expense-amount').value) || 0;
        if (desc && amount > 0) {
            expenses.push({ description: desc, amount });
            totalExpenses += amount;
        }
    });

    const deposits = [];
    let totalDeposits = 0;
    document.querySelectorAll('.multi-row[id^="deposit-row"]').forEach(row => {
        const bank   = row.querySelector('.deposit-bank').value;
        const amount = parseFloat(row.querySelector('.deposit-amount').value) || 0;
        if (bank && amount > 0) {
            deposits.push({ bank, amount });
            totalDeposits += amount;
        }
    });

    const expectedCash = startingCash + posSale + serviceCharge - totalExpenses - totalDeposits;
    const shortExcess  = dayEndCash - expectedCash;

    const report = {
        date: document.getElementById('reportDate').value,
        cashierName:     currentUser.name,
        cashierNickname: currentUser.nickname,
        shiftType, startingCash, posSale, serviceCharge, cardMachine,
        expenses, totalExpenses, deposits, totalDeposits,
        dayEndCash, expectedCash, shortExcess,
        createdAt: getServerTimestamp(),
        createdBy: currentUser.nickname
    };

    const btn = document.getElementById('btnSubmit');
    btn.disabled    = true;
    btn.textContent = '⏳ Submitting...';

    try {
        await db.collection('dayEndReports').add(report);
        document.getElementById('successModal').style.display = 'flex';
        resetForm();
        btn.disabled    = false;
        btn.textContent = '✅ SUBMIT DAY END REPORT';

        // Invalidate caches
        cacheRemove(REPORTS_CACHE_KEY);
        reportsLoaded = false;

        loadReportCount();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
        btn.disabled    = false;
        btn.textContent = '✅ SUBMIT DAY END REPORT';
    }
}

function resetForm() {
    document.getElementById('shiftType').value     = '';
    document.getElementById('startingCash').value  = '';
    document.getElementById('posSale').value       = '';
    document.getElementById('serviceCharge').value = '';
    document.getElementById('cardMachine').value   = '';
    document.getElementById('dayEndCash').value    = '';

    document.getElementById('expensesContainer').innerHTML = `
        <div class="multi-row" id="expense-row-0">
            <input type="text" placeholder="Description (උදා: Milk, Gas...)" class="expense-desc">
            <input type="number" placeholder="Amount" class="expense-amount amount-input" oninput="calculateShortExcess()">
            <button type="button" class="btn-remove-row" onclick="removeRow('expense-row-0')">✕</button>
        </div>
    `;
    expenseRowCount = 1;

    document.getElementById('depositsContainer').innerHTML = `
        <div class="multi-row" id="deposit-row-0">
            <select class="deposit-bank">
                <option value="">-- Select Bank --</option>
                <option value="BOC">BOC</option>
                <option value="Commercial Bank">Commercial Bank</option>
                <option value="Sampath Bank">Sampath Bank</option>
                <option value="HNB">HNB</option>
                <option value="People's Bank">People's Bank</option>
            </select>
            <input type="number" placeholder="Amount" class="deposit-amount amount-input" oninput="calculateShortExcess()">
            <button type="button" class="btn-remove-row" onclick="removeRow('deposit-row-0')">✕</button>
        </div>
    `;
    depositRowCount = 1;
    calculateShortExcess();
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
// 📋 LOAD REPORTS (with cache + pagination)
// ═══════════════════════════════════════════════════════════
async function loadReports(forceRefresh = false) {
    const container = document.getElementById('reportsList');

    // ── Try cache first ──
    if (!forceRefresh && reportsLoaded && allReportsCache.length > 0) {
        renderReports();
        return;
    }

    if (!forceRefresh) {
        const cached = cacheGet(REPORTS_CACHE_KEY, REPORTS_CACHE_MS);
        if (cached) {
            console.log('✅ [Cashier] Using cached reports');
            allReportsCache = cached;
            reportsLoaded   = true;
            renderReports();
            return;
        }
    }

    // Show skeleton if no data yet
    if (allReportsCache.length === 0) {
        container.innerHTML = `
            <div class="report-card sk-report-card">
                <div class="sk-text sk-medium" style="height:20px;margin-bottom:14px"></div>
                <div class="sk-text sk-long" style="margin-bottom:8px"></div>
                <div class="sk-text sk-long" style="margin-bottom:8px"></div>
                <div class="sk-text sk-short"></div>
            </div>
            <div class="report-card sk-report-card">
                <div class="sk-text sk-medium" style="height:20px;margin-bottom:14px"></div>
                <div class="sk-text sk-long" style="margin-bottom:8px"></div>
                <div class="sk-text sk-long" style="margin-bottom:8px"></div>
                <div class="sk-text sk-short"></div>
            </div>
            <div class="report-card sk-report-card">
                <div class="sk-text sk-medium" style="height:20px;margin-bottom:14px"></div>
                <div class="sk-text sk-long" style="margin-bottom:8px"></div>
                <div class="sk-text sk-long" style="margin-bottom:8px"></div>
                <div class="sk-text sk-short"></div>
            </div>
        `;
    }

    Perf.start('Reports Fetch');
    try {
        let query;
        if (myPerms.view) {
            query = db.collection('dayEndReports').orderBy('createdAt', 'desc');
        } else if (myPerms.selfView) {
            query = db.collection('dayEndReports').where('cashierNickname', '==', currentUser.nickname);
        } else {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">⛔ No view permission</div>';
            document.getElementById('reportsPaginationWrap').style.display = 'none';
            return;
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:#666;">
                    <div style="font-size:60px; margin-bottom:15px;">📭</div>
                    <div style="font-size:18px; color:#888;">තාම Reports නැහැ</div>
                </div>
            `;
            document.getElementById('reportsPaginationWrap').style.display = 'none';
            return;
        }

        let reports = [];
        snapshot.forEach(doc => reports.push({ id: doc.id, ...doc.data() }));
        reports.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        allReportsCache = reports;
        reportsLoaded   = true;
        cacheSet(REPORTS_CACHE_KEY, reports);

        renderReports();
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#666;">
                <div style="font-size:60px;">❌</div>
                <div style="color:#ff4444;">Reports load වුණේ නැහැ</div>
                <div style="color:#666; font-size:13px; margin-top:10px;">${error.message}</div>
            </div>
        `;
    }
    Perf.end('Reports Fetch');
}

// ═══════════════════════════════════════════════════════════
// 🎨 RENDER REPORTS (with pagination)
// ═══════════════════════════════════════════════════════════
function renderReports() {
    const container = document.getElementById('reportsList');
    const paginationWrap = document.getElementById('reportsPaginationWrap');
    const counter = document.getElementById('reportsCounter');
    const loadMoreBtn = document.getElementById('btnLoadMoreReports');

    if (reportsDisplayed === 0) reportsDisplayed = REPORTS_PAGE_SIZE;
    const toShow = allReportsCache.slice(0, reportsDisplayed);

    let html = '';
    toShow.forEach(r => {
        let seClass = 'perfect', seText = '✅ PERFECT', seValue = 'Rs. 0.00';
        if (Math.abs(r.shortExcess) < 0.01) {
            seClass = 'perfect'; seText = '✅ PERFECT'; seValue = 'Rs. 0.00';
        } else if (r.shortExcess > 0) {
            seClass = 'excess';  seText = '⬆️ EXCESS';  seValue = '+ Rs. ' + r.shortExcess.toFixed(2);
        } else {
            seClass = 'short';   seText = '⬇️ SHORT';   seValue = '- Rs. ' + Math.abs(r.shortExcess).toFixed(2);
        }

        let expensesHtml = '';
        if (r.expenses && r.expenses.length > 0) {
            r.expenses.forEach(exp => {
                expensesHtml += `<div class="expense-item"><span>${exp.description}</span><span>Rs. ${exp.amount.toFixed(2)}</span></div>`;
            });
        } else {
            expensesHtml = '<div style="color:#666; font-size:13px; padding:5px;">No expenses</div>';
        }

        let depositsHtml = '';
        if (r.deposits && r.deposits.length > 0) {
            r.deposits.forEach(dep => {
                depositsHtml += `<div class="deposit-item"><span>🏦 ${dep.bank}</span><span>Rs. ${dep.amount.toFixed(2)}</span></div>`;
            });
        } else {
            depositsHtml = '<div style="color:#666; font-size:13px; padding:5px;">No deposits</div>';
        }

        const deleteBtn = myPerms.delete
            ? `<button class="btn-delete" onclick="openDeleteReportModal('${r.id}')" style="margin-top:10px; width:100%;">🗑️ Delete Report</button>`
            : '';

        html += `
            <div class="report-card">
                <div class="report-card-header">
                    <div>
                        <span class="report-date">📅 ${r.date}</span>
                        <span style="color:#888; font-size:13px; margin-left:10px;">by ${r.cashierName}</span>
                    </div>
                    <span class="report-shift-badge ${r.shiftType.toLowerCase()}">${r.shiftType === 'Morning' ? '🌅' : '🌆'} ${r.shiftType}</span>
                </div>
                <div class="report-details-grid">
                    <div class="report-detail-item"><span class="report-detail-label">Starting Cash</span><span class="report-detail-value">Rs. ${r.startingCash.toFixed(2)}</span></div>
                    <div class="report-detail-item"><span class="report-detail-label">POS Sale</span><span class="report-detail-value">Rs. ${r.posSale.toFixed(2)}</span></div>
                    <div class="report-detail-item"><span class="report-detail-label">Service Charge</span><span class="report-detail-value">Rs. ${r.serviceCharge.toFixed(2)}</span></div>
                    <div class="report-detail-item"><span class="report-detail-label">Card Machine</span><span class="report-detail-value">Rs. ${r.cardMachine.toFixed(2)}</span></div>
                    <div class="report-detail-item"><span class="report-detail-label">Total Expenses</span><span class="report-detail-value" style="color:#ff4444;">Rs. ${r.totalExpenses.toFixed(2)}</span></div>
                    <div class="report-detail-item"><span class="report-detail-label">Total Deposits</span><span class="report-detail-value" style="color:#FF9800;">Rs. ${r.totalDeposits.toFixed(2)}</span></div>
                    <div class="report-detail-item"><span class="report-detail-label">Day End Cash</span><span class="report-detail-value">Rs. ${r.dayEndCash.toFixed(2)}</span></div>
                </div>
                <div class="report-short-excess ${seClass}">${seText}: ${seValue}</div>
                <button class="report-expand-btn" onclick="toggleExpand('${r.id}')">📋 View Details</button>
                <div class="report-expanded" id="expand-${r.id}">
                    <div class="detail-list"><h4>📤 Expenses</h4>${expensesHtml}</div>
                    <div class="detail-list"><h4>🏦 Bank Deposits</h4>${depositsHtml}</div>
                    ${deleteBtn}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Stagger card animations
    const cards = container.querySelectorAll('.report-card');
    cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 50);
    });

    // Pagination UI
    const total = allReportsCache.length;
    const shown = toShow.length;
    if (total > REPORTS_PAGE_SIZE) {
        paginationWrap.style.display = 'block';
        counter.textContent = `Showing ${shown} of ${total} reports`;
        if (shown >= total) {
            loadMoreBtn.style.display = 'none';
            counter.textContent = `✅ All ${total} reports loaded`;
        } else {
            loadMoreBtn.style.display = 'inline-block';
            loadMoreBtn.textContent = `⬇️ Load More (${total - shown} remaining)`;
        }
    } else {
        paginationWrap.style.display = 'none';
    }
}

function loadMoreReports() {
    reportsDisplayed += REPORTS_PAGE_SIZE;
    renderReports();
}

// ═══════════════════════════════════════════════════════════
// 📂 EXPAND / COLLAPSE
// ═══════════════════════════════════════════════════════════
function toggleExpand(docId) {
    const el = document.getElementById('expand-' + docId);
    el.classList.toggle('show');
}

// ═══════════════════════════════════════════════════════════
// 🔢 LOAD REPORT COUNT
// ═══════════════════════════════════════════════════════════
async function loadReportCount() {
    try {
        let query;
        if (myPerms.view) {
            query = db.collection('dayEndReports');
        } else {
            query = db.collection('dayEndReports').where('cashierNickname', '==', currentUser.nickname);
        }
        const snapshot = await query.get();
        const countEl = document.getElementById('totalReportsCard');
        if (countEl) countEl.textContent = snapshot.size;
    } catch (error) {
        console.error('Count error:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// 🗑️ DELETE REPORT
// ═══════════════════════════════════════════════════════════
function openDeleteReportModal(reportId) {
    deleteReportId = reportId;
    document.getElementById('deleteReportModal').style.display = 'flex';
}

function closeDeleteReportModal() {
    document.getElementById('deleteReportModal').style.display = 'none';
    deleteReportId = null;
}

async function confirmDeleteReport() {
    if (!deleteReportId) return;
    try {
        await db.collection('dayEndReports').doc(deleteReportId).delete();
        alert('✅ Report deleted!');
        closeDeleteReportModal();

        // Invalidate caches
        cacheRemove(REPORTS_CACHE_KEY);
        reportsLoaded = false;
        reportsDisplayed = 0;

        loadReports(true);
        loadReportCount();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// 🚀 START!
// ═══════════════════════════════════════════════════════════
initializeApp();