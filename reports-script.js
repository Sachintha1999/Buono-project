/* ═══════════════════════════════════════════════════════════ */
/* ⚙️ REPORTS DATABASE - COMPLETE JAVASCRIPT                   */
/* Buono Cafe + Academy - Reports DB                           */
/* Updated: 2026-06-08 (v9.3 - Credit Auto-Deduct!)            */
/* ═══════════════════════════════════════════════════════════ */

// ❌ REMOVED: firebaseConfig block (now in firebase-config.js!)
// ✅ Using globals: db, getCurrentUser(), logout()

// 📂 DATABASES LIST
const DATABASES = [
    { id: 'employeeDB', name: 'Employee Database', icon: '👥', url: 'index.html' },
    { id: 'dayEndReportDB', name: 'Day End Reports', icon: '💰', url: 'cashier.html' },
    { id: 'inventoryDB', name: 'Inventory Database', icon: '📦', url: 'inventory.html' },
    { id: 'kitchenDB', name: 'Kitchen Database', icon: '🍳', url: 'kitchen.html' },
    { id: 'purchasingDB', name: 'Purchasing Database', icon: '🛒', url: 'purchasing.html' },
    { id: 'reportsDB', name: 'Reports Database', icon: '📊', url: 'reports.html', adminManagerOnly: true }
];

// 🌐 GLOBAL VARIABLES
let currentUser = null;
let allDayEndReports = [];
let allEmployees = [];
let allStockIssues = [];
let allStockCounts = [];
let allStaffMeals = [];
let allWastage = [];
let allPurchases = [];
let allSuppliers = [];
let allInventoryItems = [];
let allPurchaseReturns = [];
let filteredReports = [];
let filteredIssues = [];
let currentIssueStatus = 'pending';
let currentSCRTab = 'approved';
let currentPendingTab = 'stock';
let currentCRTab = 'overdue';
let expandedBillId = null;
let markPaidBillId = '';
// ⭐ Storage + Payment Proof
const storage = firebase.storage();
let rptPaymentProofPhotoUrl = '';
let rptPaymentProofPhotoPath = '';

/* ─────────────────────────────────────────────────────────── */
/* 🛠️ HELPER FUNCTIONS                                        */
/* ─────────────────────────────────────────────────────────── */
function fmt(amount) {
    if (amount === undefined || amount === null) return 'Rs. 0';
    return 'Rs. ' + Number(amount).toLocaleString('en-LK');
}

function fmtQty(num) {
    if (num === null || num === undefined || isNaN(num)) return 0;
    return Math.round(num * 1000) / 1000;
}

function dispQty(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return (Math.round(num * 1000) / 1000).toString();
}

function formatTimestamp(ts) {
    if (!ts) return 'N/A';
    if (typeof ts === 'string') return ts;
    if (ts.toDate) {
        const d = ts.toDate();
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'N/A';
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateCreditNoteNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 900 + 100);
    return `SCN-${datePart}-${rand}`;
}

function getNetPayable(p) {
    const billTotal = p.billTotal || 0;
    const returnedValue = p.returnedValue || 0;
    return Math.max(0, billTotal - returnedValue);
}

/* ─────────────────────────────────────────────────────────── */
/* 🚀 INITIALIZATION                                          */
/* ─────────────────────────────────────────────────────────── */
async function initializeApp() {
    // ✅ Global getCurrentUser() use කරනවා
    const userData = getCurrentUser();
    if (!userData) { window.location.href = 'login.html'; return; }
    currentUser = userData;

    try {
        const userDoc = await db.collection('employees').doc(currentUser.id).get();
        if (userDoc.exists) {
            const d = userDoc.data();
            currentUser.access = d.access;
            currentUser.permissions = d.permissions || {};
            currentUser.name = d.name;
            currentUser.nickname = d.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(currentUser));
        }
    } catch (e) { console.warn(e); }

    if (!['Admin', 'Manager'].includes(currentUser.access)) {
        document.getElementById('rptAccessDenied').style.display = 'flex';
        document.getElementById('reportsSidebar').style.display = 'none';
        document.querySelectorAll('.rpt-section').forEach(s => s.style.display = 'none');
        return;
    }

    document.getElementById('rptUserName').textContent = currentUser.name || currentUser.nickname;
    document.getElementById('rptUserBadge').textContent = currentUser.access;
    const badgeColors = { 'Admin': '#ff4444', 'Manager': '#2196F3' };
    document.getElementById('rptUserBadge').style.background = badgeColors[currentUser.access] || '#f0a500';

    buildSwitcher();

    loadDayEndReports();
    loadStockIssues();
    loadStockCounts();
    loadStaffMealsData();
    loadWastageData();
    loadPurchasesData();
    loadSuppliersData();
    loadInventoryItemsData();
    loadPurchaseReturnsData();

    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const thirtyAgoStr = thirtyAgo.toISOString().split('T')[0];

    ['smrFromDate', 'wrFromDate', 'scrFromDate', 'prFromDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = thirtyAgoStr;
    });
    ['smrToDate', 'wrToDate', 'scrToDate', 'prToDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });

    if (window.location.hash === '#pendingapprovals') showSection('pendingapprovals');
    else if (window.location.hash === '#stockissues' || window.location.hash === '#stockcountreport') showSection('stockcountreport');
    else if (window.location.hash === '#credittracking') showSection('creditTracking');
    else if (window.location.hash === '#purchasereports') showSection('purchaseReports');
    else if (window.location.hash === '#returns') {
        showSection('pendingapprovals');
        setTimeout(() => {
            showPendingTab('returns', document.getElementById('ptab-returns'));
        }, 300);
    }
}
initializeApp();

/* ─────────────────────────────────────────────────────────── */
/* 📂 DATABASE SWITCHER                                       */
/* ─────────────────────────────────────────────────────────── */
function buildSwitcher() {
    const dropdown = document.getElementById('rptSwitcherDropdown');
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    dropdown.innerHTML = '';

    const homeLink = document.createElement('a');
    homeLink.href = 'access.html';
    homeLink.innerHTML = '🏠 Access Home';
    dropdown.appendChild(homeLink);

    DATABASES.forEach(d => {
        if (d.adminManagerOnly && !isAdminOrMgr) return;
        const isAdmin = currentUser.access === 'Admin';
        const dp = currentUser.permissions?.[d.id] || {};
        const hasAccess = isAdmin || dp.add || dp.view || dp.selfView || dp.edit || dp.delete;
        if (!d.adminManagerOnly && !hasAccess) return;
        const a = document.createElement('a');
        a.href = d.url;
        a.innerHTML = `${d.icon} ${d.name}`;
        if (d.url === 'reports.html') a.classList.add('current');
        dropdown.appendChild(a);
    });

    document.getElementById('rptSwitcherBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });
}

/* ─────────────────────────────────────────────────────────── */
/* 🧭 NAVIGATION                                              */
/* ─────────────────────────────────────────────────────────── */
function showSection(name) {
    document.querySelectorAll('.rpt-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
    const section = document.getElementById('section-' + name);
    if (section) section.style.display = 'block';
    const menu = document.getElementById('menu-' + name);
    if (menu) menu.classList.add('active');

    if (name === 'employees' && allEmployees.length === 0) loadEmployeeReports();
    if (name === 'pendingapprovals') { updatePendingStats(); renderPendingTab(); }
    if (name === 'stockcountreport') { updateSCRSummary(); renderSCRContent(); }
    if (name === 'staffmealsreport') loadStaffMealsReport();
    if (name === 'wastagereport') loadWastageReport();
    if (name === 'purchaseReports') loadPurchaseReports();
    if (name === 'creditTracking') { updateCRStats(); renderCRTab(); }
    if (name === 'supplierReports') loadSupplierAnalysis();

    closeSidebarMobile();
}

function toggleSidebar() {
    document.getElementById('reportsSidebar').classList.toggle('open');
}

function closeSidebarMobile() {
    if (window.innerWidth <= 768) document.getElementById('reportsSidebar').classList.remove('open');
}

// ✅ Global logout() use කරනවා - firebase-config.js වල!
// function logout() { ... } ← REMOVED!

/* ─────────────────────────────────────────────────────────── */
/* 📋 DAY END REPORTS                                         */
/* ─────────────────────────────────────────────────────────── */
async function loadDayEndReports() {
    try {
        const snap = await db.collection('dayEndReports').orderBy('date', 'desc').get();
        allDayEndReports = [];
        snap.forEach(doc => allDayEndReports.push({ id: doc.id, ...doc.data() }));
        buildCashierDropdown();
        filteredReports = [...allDayEndReports];
        renderDayEndReports(filteredReports);
        updateDayEndSummary(filteredReports);
    } catch (e) {
        document.getElementById('dayendReportsList').innerHTML = `<div class="rpt-empty">⚠️ Error loading.</div>`;
    }
}

function buildCashierDropdown() {
    const select = document.getElementById('filterCashier');
    const names = [...new Set(allDayEndReports.map(r => r.cashierName).filter(Boolean))].sort();
    select.innerHTML = '<option value="">All</option>';
    names.forEach(name => { select.innerHTML += `<option value="${name}">${name}</option>`; });
}

function updateDayEndSummary(reports) {
    document.getElementById('scTotalReports').textContent = reports.length;
    document.getElementById('scTotalPOS').textContent = fmt(reports.reduce((s, r) => s + (r.posSale || 0), 0));
    document.getElementById('scTotalExpenses').textContent = fmt(reports.reduce((s, r) => s + (r.totalExpenses || 0), 0));
    document.getElementById('scTotalDeposits').textContent = fmt(reports.reduce((s, r) => s + (r.totalDeposits || 0), 0));
}

function renderDayEndReports(reports) {
    const container = document.getElementById('dayendReportsList');
    document.getElementById('rptCountBadge').textContent = `${reports.length} reports`;
    if (reports.length === 0) {
        container.innerHTML = `<div class="rpt-empty">📋 No reports.</div>`;
        return;
    }
    let html = '';
    reports.forEach(r => {
        const se = r.shortExcess || 0;
        let seClass = 'perfect', seLabel = '✅ Perfect';
        if (se > 0) { seClass = 'excess'; seLabel = `⬆️ +${fmt(se)}`; }
        else if (se < 0) { seClass = 'short'; seLabel = `⬇️ ${fmt(se)}`; }
        html += `<div class="rpt-item" id="rpt-${r.id}"><div class="rpt-item-header" onclick="toggleRpt('${r.id}')"><div class="rpt-date-badge">📅 ${r.date}</div><div class="rpt-cashier-info"><div class="rci-name">👤 ${r.cashierName}</div><div class="rci-shift">🌅 ${r.shiftType}</div></div><div class="rpt-amounts"><div class="ra-pos">${fmt(r.posSale)}</div><div class="ra-label">POS</div></div><div class="se-mini ${seClass}">${seLabel}</div><div class="rpt-expand-icon">▼</div></div><div class="rpt-item-details"><div class="rpt-details-grid"><div class="rpt-detail-box"><h4>💵 Cash Flow</h4><div class="rpt-d-row"><span class="dl">Starting</span><span class="dv">${fmt(r.startingCash)}</span></div><div class="rpt-d-row"><span class="dl">POS</span><span class="dv green">${fmt(r.posSale)}</span></div><div class="rpt-d-row"><span class="dl">Day End</span><span class="dv orange">${fmt(r.dayEndCash)}</span></div></div><div class="rpt-detail-box"><h4>📊 Summary</h4><div class="rpt-d-row"><span class="dl">Expected</span><span class="dv">${fmt(r.expectedCash)}</span></div><div class="rpt-d-row"><span class="dl"><strong>S/E</strong></span><span class="dv ${se === 0 ? 'green' : se > 0 ? 'orange' : 'red'}"><strong>${se >= 0 ? '+' : ''}${fmt(se)}</strong></span></div></div></div></div></div>`;
    });
    container.innerHTML = html;
}

function applyFilters() {
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    const cashier = document.getElementById('filterCashier').value;
    const shift = document.getElementById('filterShift').value;
    filteredReports = allDayEndReports.filter(r => {
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        if (cashier && r.cashierName !== cashier) return false;
        if (shift && r.shiftType !== shift) return false;
        return true;
    });
    renderDayEndReports(filteredReports);
    updateDayEndSummary(filteredReports);
}

function resetFilters() {
    ['filterFromDate', 'filterToDate'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('filterCashier').value = '';
    document.getElementById('filterShift').value = '';
    filteredReports = [...allDayEndReports];
    renderDayEndReports(filteredReports);
    updateDayEndSummary(filteredReports);
}

function toggleRpt(id) {
    document.getElementById('rpt-' + id).classList.toggle('expanded');
}

/* ─────────────────────────────────────────────────────────── */
/* 👥 EMPLOYEE REPORTS                                        */
/* ─────────────────────────────────────────────────────────── */
async function loadEmployeeReports() {
    try {
        const snap = await db.collection('employees').get();
        allEmployees = [];
        snap.forEach(doc => allEmployees.push({ id: doc.id, ...doc.data() }));
        renderEmpStats();
        renderEmpTable(allEmployees);
    } catch (e) { console.error(e); }
}

function renderEmpStats() {
    const total = allEmployees.length;
    document.getElementById('esTotal').textContent = total;
    document.getElementById('esAdmin').textContent = allEmployees.filter(e => e.access === 'Admin').length;
    document.getElementById('esManager').textContent = allEmployees.filter(e => e.access === 'Manager').length;
    document.getElementById('esCashier').textContent = allEmployees.filter(e => e.access === 'Cashier').length;
    const others = total - allEmployees.filter(e => ['Admin', 'Manager', 'Cashier'].includes(e.access)).length;
    document.getElementById('esOther').textContent = others > 0 ? others : 0;
}

function renderEmpTable(employees) {
    const tbody = document.getElementById('empTableBody');
    if (employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#888;">No employees.</td></tr>`;
        return;
    }
    const colors = { 'Admin': '#ff4444', 'Manager': '#2196F3', 'Cashier': '#4CAF50' };
    tbody.innerHTML = '';
    employees.forEach((emp, i) => {
        const color = colors[emp.access] || '#607D8B';
        const dbCount = Object.keys(emp.permissions || {}).length;
        tbody.innerHTML += `<tr><td>${i+1}</td><td><strong>${emp.name}</strong></td><td>${emp.nickname}</td><td><span style="background:${color}22; color:${color}; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600;">${emp.access}</span></td><td>${dbCount} DBs</td></tr>`;
    });
}

function filterEmpTable() {
    const q = document.getElementById('empSearchInput').value.toLowerCase();
    renderEmpTable(allEmployees.filter(e => (e.name || '').toLowerCase().includes(q) || (e.nickname || '').toLowerCase().includes(q)));
}

/* ─────────────────────────────────────────────────────────── */
/* 📊 LOADERS                                                 */
/* ─────────────────────────────────────────────────────────── */
function loadStockCounts() {
    db.collection('stockCounts').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allStockCounts = [];
        snap.forEach(doc => allStockCounts.push({ id: doc.id, ...doc.data() }));
        updateSidebarBadges();
        updatePendingStats();
        renderPendingTab();
        updateSCRSummary();
        renderSCRContent();
    });
}

function loadPurchasesData() {
    db.collection('purchases').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allPurchases = [];
        snap.forEach(doc => allPurchases.push({ id: doc.id, ...doc.data() }));
        updateSidebarBadges();
        updatePendingStats();
        renderPendingTab();
        updateCRStats();
        if (document.getElementById('section-purchaseReports').style.display === 'block') loadPurchaseReports();
        if (document.getElementById('section-creditTracking').style.display === 'block') renderCRTab();
    });
}

function loadSuppliersData() {
    db.collection('suppliers').orderBy('name').onSnapshot((snap) => {
        allSuppliers = [];
        snap.forEach(doc => allSuppliers.push({ id: doc.id, ...doc.data() }));
        updateSupplierFilters();
    });
}

function loadInventoryItemsData() {
    db.collection('inventoryItems').orderBy('itemName').onSnapshot((snap) => {
        allInventoryItems = [];
        snap.forEach(doc => allInventoryItems.push({ id: doc.id, ...doc.data() }));
    });
}

function loadPurchaseReturnsData() {
    db.collection('purchaseReturns').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allPurchaseReturns = [];
        snap.forEach(doc => allPurchaseReturns.push({ id: doc.id, ...doc.data() }));
        updateSidebarBadges();
        updatePendingStats();
        if (currentPendingTab === 'returns') renderPendingReturns();
    }, err => {
        console.error('Purchase Returns load error:', err);
    });
}

function updateSupplierFilters() {
    ['prSupplierFilter', 'crSupplierFilter'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = '<option value="">All Suppliers</option>';
        allSuppliers.forEach(s => sel.innerHTML += `<option value="${s.id}">${s.name}</option>`);
        sel.value = current;
    });
}

function updateSidebarBadges() {
    const stockPending = allStockCounts.filter(c => c.status === 'pending_approval').length;
    const purchasePending = allPurchases.filter(p => p.status === 'pending_approval').length;
    const returnsPending = allPurchaseReturns.filter(r => r.status === 'pending_return').length;
    const totalPending = stockPending + purchasePending + returnsPending;

    const badge = document.getElementById('sidebarPendingCount');
    if (badge) {
        badge.textContent = totalPending;
        badge.style.display = totalPending > 0 ? 'inline-block' : 'none';
    }

    const today = new Date().toISOString().split('T')[0];
    const overdueCount = allPurchases.filter(p =>
        p.status === 'approved' &&
        p.paymentStatus === 'unpaid' &&
        p.dueDate &&
        p.dueDate < today &&
        getNetPayable(p) > 0
    ).length;

    const creditBadge = document.getElementById('sidebarCreditCount');
    if (creditBadge) {
        creditBadge.textContent = overdueCount;
        creditBadge.style.display = overdueCount > 0 ? 'inline-block' : 'none';
    }
}

function updatePendingStats() {
    const stockPending = allStockCounts.filter(c => c.status === 'pending_approval');
    const purchasePending = allPurchases.filter(p => p.status === 'pending_approval');
    const returnsPending = allPurchaseReturns.filter(r => r.status === 'pending_return');

    const totalCritical = stockPending.reduce((s, c) => s + (c.criticalIssues || 0), 0);
    const totalValue = stockPending.reduce((s, c) => s + Math.abs(c.totalCostImpact || 0), 0)
                     + purchasePending.reduce((s, p) => s + (p.billTotal || 0), 0)
                     + returnsPending.reduce((s, r) => s + (r.returnTotal || 0), 0);

    const e1 = document.getElementById('scStockCountsPending');
    const e2 = document.getElementById('scPurchasesPending');
    const e3 = document.getElementById('scReturnsPending');
    const e4 = document.getElementById('scPendingCritical');
    const e5 = document.getElementById('scPendingImpact');
    if (e1) e1.textContent = stockPending.length;
    if (e2) e2.textContent = purchasePending.length;
    if (e3) e3.textContent = returnsPending.length;
    if (e4) e4.textContent = totalCritical;
    if (e5) e5.textContent = 'Rs. ' + totalValue.toLocaleString('en-LK', { maximumFractionDigits: 0 });

    const t1 = document.getElementById('ptabStockCount');
    const t2 = document.getElementById('ptabPurchaseCount');
    const t3 = document.getElementById('ptabReturnsCount');
    if (t1) t1.textContent = stockPending.length;
    if (t2) t2.textContent = purchasePending.length;
    if (t3) t3.textContent = returnsPending.length;
}

/* ─────────────────────────────────────────────────────────── */
/* ⏳ PENDING APPROVALS TABS                                   */
/* ─────────────────────────────────────────────────────────── */
function showPendingTab(name, btnEl) {
    currentPendingTab = name;
    document.querySelectorAll('.pending-content').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.pending-subtab').forEach(t => t.classList.remove('active'));

    if (name === 'stock') {
        document.getElementById('pendingStockList').style.display = 'block';
        renderPendingStock();
    } else if (name === 'purchase') {
        document.getElementById('pendingPurchaseList').style.display = 'block';
        renderPendingPurchase();
    } else if (name === 'returns') {
        document.getElementById('pendingReturnsList').style.display = 'block';
        renderPendingReturns();
    }

    if (btnEl) btnEl.classList.add('active');
}

function renderPendingTab() {
    if (currentPendingTab === 'stock') renderPendingStock();
    else if (currentPendingTab === 'purchase') renderPendingPurchase();
    else if (currentPendingTab === 'returns') renderPendingReturns();
}

/* ─────────────────────────────────────────────────────────── */
/* 📊 PENDING STOCK COUNTS                                    */
/* ─────────────────────────────────────────────────────────── */
function renderPendingStock() {
    const container = document.getElementById('pendingStockList');
    if (!container) return;
    const pending = allStockCounts.filter(c => c.status === 'pending_approval');
    if (pending.length === 0) {
        container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">✅</span>No pending stock counts!</div>`;
        return;
    }
    let html = '';
    pending.forEach(count => {
        const impactSign = count.totalCostImpact >= 0 ? '+' : '';
        const impactColor = count.totalCostImpact >= 0 ? '#4CAF50' : '#ff4444';
        const countItems = count.items || [];
        const diffItems = countItems.filter(i => i.status !== 'match');
        const matchItems = countItems.filter(i => i.status === 'match');
        const sortedItems = [...diffItems, ...matchItems];
        let itemsHtml = '';
        sortedItems.forEach(item => {
            const diffSign = item.difference >= 0 ? '+' : '';
            const diffColors = { match: '#4CAF50', surplus: '#2196F3', shortage: '#f0a500', critical: '#ff4444' };
            const statusLabels = { match: '✓ Match', surplus: '⬆️ Surplus', shortage: '⬇️ Short', critical: '⚠️ Critical' };
            itemsHtml += `<tr class="row-${item.status}"><td><strong>${item.itemName}</strong></td><td>${dispQty(item.systemStock)} ${item.unit}</td><td>${dispQty(item.physicalCount)} ${item.unit}</td><td style="color:${diffColors[item.status]}; font-weight:700;">${diffSign}${dispQty(item.difference)} ${item.unit}</td><td><span class="diff-badge ${item.status}">${statusLabels[item.status] || item.status}</span></td><td style="color:${(item.costImpact||0) >= 0 ? '#4CAF50' : '#ff4444'}; font-size:12px;">${(item.costImpact||0) >= 0 ? '+' : ''}Rs.${Math.abs(item.costImpact||0).toFixed(2)}</td></tr>`;
        });
        html += `<div class="approval-card"><div class="approval-card-header"><div class="approval-card-left"><span class="approval-date">📅 ${count.date}</span><span class="approval-submitted-by">👤 By: <strong>${count.performedByName}</strong></span></div><span class="status-badge pending_approval">⏳ Pending</span></div><div class="approval-stats-grid"><div class="approval-stat"><div class="as-value">${count.itemsCounted||0}</div><div class="as-label">📦 Counted</div></div><div class="approval-stat"><div class="as-value orange">${count.differencesFound||0}</div><div class="as-label">🔄 Diffs</div></div><div class="approval-stat"><div class="as-value red">${count.criticalIssues||0}</div><div class="as-label">⚠️ Critical</div></div><div class="approval-stat"><div class="as-value" style="color:${impactColor};">${impactSign}Rs.${Math.abs(count.totalCostImpact||0).toFixed(0)}</div><div class="as-label">💰 Impact</div></div></div><div style="overflow-x:auto; margin-bottom:16px;"><table class="approval-items-table"><thead><tr><th>Item</th><th>System</th><th>Physical</th><th>Difference</th><th>Status</th><th>Cost</th></tr></thead><tbody>${itemsHtml}</tbody></table></div><div class="approval-notes-box"><label>✅ Approval Notes (Optional)</label><textarea id="approvalNotes-${count.id}" placeholder="Notes..."></textarea></div><div class="reject-notes-box" id="suspiciousBox-${count.id}" style="background:rgba(255,152,0,0.05); border-color:rgba(255,152,0,0.3);"><label style="color:#FF9800;">⚠️ Suspicious Reason (Required)</label><textarea id="suspiciousReason-${count.id}" placeholder="Investigation reason..."></textarea></div><div class="reject-notes-box" id="rejectBox-${count.id}"><label>❌ Rejection Reason (Required)</label><textarea id="rejectReason-${count.id}" placeholder="Rejection reason..."></textarea></div><div class="approval-actions"><button class="btn-show-reject" onclick="toggleBox('rejectBox-${count.id}', 'confirmRejectBtn-${count.id}', 'suspiciousBox-${count.id}', 'confirmSuspiciousBtn-${count.id}')">❌ Reject</button><button id="confirmRejectBtn-${count.id}" style="display:none;" class="btn-reject-count" onclick="rejectStockCount('${count.id}')">❌ Confirm</button><button class="btn-suspicious-approve" onclick="toggleBox('suspiciousBox-${count.id}', 'confirmSuspiciousBtn-${count.id}', 'rejectBox-${count.id}', 'confirmRejectBtn-${count.id}')">⚠️ Suspicious</button><button id="confirmSuspiciousBtn-${count.id}" style="display:none;" class="btn-suspicious-approve" onclick="suspiciousApproveStockCount('${count.id}')">⚠️ Confirm</button><button class="btn-approve-count" onclick="approveStockCount('${count.id}')">✅ Approve</button></div></div>`;
    });
    container.innerHTML = html;
}

/* ─────────────────────────────────────────────────────────── */
/* 🛒 PENDING PURCHASE BILLS                                  */
/* ─────────────────────────────────────────────────────────── */
function renderPendingPurchase() {
    const container = document.getElementById('pendingPurchaseList');
    if (!container) return;
    const pending = allPurchases.filter(p => p.status === 'pending_approval');
    if (pending.length === 0) {
        container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">✅</span>No pending purchase bills!</div>`;
        return;
    }
    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank' };
    let html = '';
    pending.forEach(p => {
        let itemsHtml = '';
        (p.items || []).forEach(item => {
            const prevPrice = item.previousPrice || 0;
            const newPrice = item.pricePerUnit || 0;
            const priceDiff = newPrice - prevPrice;
            let priceBadge = '';
            if (prevPrice > 0) {
                if (priceDiff > 0) priceBadge = `<span class="price-change-badge up">▲ Rs.${priceDiff.toFixed(2)}</span>`;
                else if (priceDiff < 0) priceBadge = `<span class="price-change-badge down">▼ Rs.${Math.abs(priceDiff).toFixed(2)}</span>`;
                else priceBadge = `<span class="price-change-badge same">═ Same</span>`;
            } else priceBadge = `<span class="price-change-badge same">NEW</span>`;
            itemsHtml += `<tr><td><strong>${item.itemName}</strong></td><td>${dispQty(item.quantity)} ${item.unit}</td><td style="color:#FF9800;">Rs. ${newPrice.toFixed(2)}${priceBadge}</td><td>${prevPrice > 0 ? 'Rs. ' + prevPrice.toFixed(2) : '-'}</td><td style="color:#FF9800; font-weight:700;">Rs. ${(item.totalCost||0).toLocaleString('en-LK')}</td></tr>`;
        });
        let dueWarning = p.dueDate ? `<div style="padding:8px 12px; background:rgba(255,152,0,0.1); border:1px solid rgba(255,152,0,0.3); border-radius:6px; margin-top:10px; font-size:12px; color:#FF9800;">⏰ Payment Due: <strong>${p.dueDate}</strong></div>` : '';
        let photoSection = p.billPhotoUrl ? `<div style="margin-top:12px; text-align:center;"><img src="${p.billPhotoUrl}" style="max-width:200px; max-height:200px; border-radius:8px; cursor:pointer; border:2px solid rgba(255,152,0,0.3);" onclick="openPhotoFullscreen('${p.billPhotoUrl}')"><div style="font-size:11px; color:#888; margin-top:4px;">📸 Click to view full size</div></div>` : '';

        html += `<div class="approval-card purchasing"><div class="approval-card-header"><div class="approval-card-left"><span class="approval-bill-num">📄 ${p.billNumber}</span><span class="approval-date">📅 ${p.date}</span><span class="approval-payment ${p.paymentMethod}">${paymentIcons[p.paymentMethod] || p.paymentMethod}</span></div><span class="status-badge pending_approval">⏳ Pending</span></div><div style="font-size:15px; color:#e0e0e0; font-weight:600; margin-bottom:6px;">🏪 ${p.supplierName}${p.supplierPhone ? ` <span style="color:#888; font-size:12px;">📞 ${p.supplierPhone}</span>` : ''}</div><div style="font-size:12px; color:#888; margin-bottom:10px;">👤 Submitted by: <strong>${p.performedByName}</strong></div><div class="approval-stats-grid"><div class="approval-stat"><div class="as-value purchasing">${p.itemsCount||0}</div><div class="as-label">📦 Items</div></div><div class="approval-stat"><div class="as-value purchasing">Rs.${(p.billTotal||0).toLocaleString('en-LK')}</div><div class="as-label">💰 Bill Total</div></div></div><div style="overflow-x:auto; margin-bottom:14px;"><table class="approval-items-table"><thead><tr><th>Item</th><th>Qty</th><th>New Price/Unit</th><th>Previous Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table></div>${dueWarning}${photoSection}${p.notes ? `<div style="margin-top:10px; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:6px; font-size:12px; color:#aaa;">📝 ${p.notes}</div>` : ''}<div class="approval-notes-box" style="margin-top:14px;"><label>✅ Approval Notes (Optional)</label><textarea id="purApprovalNotes-${p.id}" placeholder="Notes..."></textarea></div><div class="reject-notes-box" id="purRejectBox-${p.id}"><label>❌ Rejection Reason (Required)</label><textarea id="purRejectReason-${p.id}" placeholder="Rejection reason..."></textarea></div><div class="approval-actions"><button class="btn-show-reject" onclick="togglePurBox('${p.id}')">❌ Reject</button><button id="purConfirmRejectBtn-${p.id}" style="display:none;" class="btn-reject-count" onclick="rejectPurchase('${p.id}')">❌ Confirm Reject</button><button class="btn-approve-count" onclick="approvePurchase('${p.id}')">✅ Approve & Add Stock</button></div></div>`;
    });
    container.innerHTML = html;
}

function togglePurBox(id) {
    const box = document.getElementById('purRejectBox-' + id);
    const btn = document.getElementById('purConfirmRejectBtn-' + id);
    if (box.classList.contains('show')) {
        box.classList.remove('show');
        btn.style.display = 'none';
    } else {
        box.classList.add('show');
        btn.style.display = 'flex';
    }
}

/* ─────────────────────────────────────────────────────────── */
/* 🔄 PENDING PURCHASE RETURNS                                 */
/* ─────────────────────────────────────────────────────────── */
function renderPendingReturns() {
    const container = document.getElementById('pendingReturnsList');
    if (!container) return;
    const pending = allPurchaseReturns.filter(r => r.status === 'pending_return');
    if (pending.length === 0) {
        container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">✅</span>No pending returns!</div>`;
        return;
    }
    let html = '';
    pending.forEach(r => {
        let itemsHtml = '';
        (r.items || []).forEach(item => {
            itemsHtml += `<tr><td><strong>${escapeHtml(item.itemName)}</strong></td><td>${dispQty(item.returnQuantity)} ${escapeHtml(item.unit || '')}</td><td style="color:#9C27B0;">Rs. ${(item.pricePerUnit || 0).toFixed(2)}</td><td style="color:#9C27B0; font-weight:700;">Rs. ${(item.returnCost || 0).toLocaleString('en-LK')}</td></tr>`;
        });
        const reasonBadge = `<span style="display:inline-block; background:rgba(156,39,176,0.15); color:#9C27B0; padding:3px 12px; border-radius:10px; font-size:11px; font-weight:700; text-transform:uppercase;">${escapeHtml(r.reasonText || 'N/A')}</span>`;
        html += `<div class="approval-card" style="border-left-color:#9C27B0;"><div class="approval-card-header"><div class="approval-card-left"><span class="approval-bill-num" style="background:rgba(156,39,176,0.15); color:#9C27B0;">🔄 ${escapeHtml(r.returnNumber || 'RET')}</span><span class="approval-date">📅 ${escapeHtml(r.originalPurchaseDate || '-')}</span>${reasonBadge}</div><span class="status-badge pending_approval">⏳ Pending</span></div><div style="font-size:15px; color:#e0e0e0; font-weight:600; margin-bottom:6px;">🏪 ${escapeHtml(r.supplierName)} <span style="color:#888; font-size:12px;">| 📄 Original Bill: ${escapeHtml(r.originalBillNumber)}</span></div><div style="font-size:12px; color:#888; margin-bottom:10px;">👤 Submitted by: <strong>${escapeHtml(r.performedByName)}</strong> | 🕐 ${formatTimestamp(r.createdAt)}</div><div class="approval-stats-grid"><div class="approval-stat"><div class="as-value" style="color:#9C27B0;">${r.itemsCount || 0}</div><div class="as-label">📦 Items</div></div><div class="approval-stat"><div class="as-value" style="color:#9C27B0;">Rs.${(r.returnTotal || 0).toLocaleString('en-LK')}</div><div class="as-label">💰 Return Total</div></div><div class="approval-stat"><div class="as-value">Rs.${(r.originalBillTotal || 0).toLocaleString('en-LK')}</div><div class="as-label">📄 Original Bill</div></div></div><div style="overflow-x:auto; margin-bottom:14px;"><table class="approval-items-table"><thead><tr style="background:rgba(156,39,176,0.1);"><th>Item</th><th>Return Qty</th><th>Per Unit</th><th>Return Cost</th></tr></thead><tbody>${itemsHtml}</tbody></table></div><div style="padding:10px 14px; background:rgba(156,39,176,0.08); border:1px solid rgba(156,39,176,0.2); border-radius:8px; margin-bottom:10px; font-size:13px; color:#d8b4e2;"><strong>❓ Reason:</strong> ${escapeHtml(r.reasonText || 'N/A')}</div>${r.notes ? `<div style="margin-top:10px; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:6px; font-size:12px; color:#aaa;">📝 ${escapeHtml(r.notes)}</div>` : ''}<div class="approval-notes-box" style="margin-top:14px;"><label>✅ Approval Notes (Optional)</label><textarea id="retApprovalNotes-${r.id}" placeholder="Notes..."></textarea></div><div class="reject-notes-box" id="retRejectBox-${r.id}"><label>❌ Rejection Reason (Required)</label><textarea id="retRejectReason-${r.id}" placeholder="Why are you rejecting this return?..."></textarea></div><div class="approval-actions"><button class="btn-show-reject" onclick="toggleRetBox('${r.id}')">❌ Reject</button><button id="retConfirmRejectBtn-${r.id}" style="display:none;" class="btn-reject-count" onclick="rejectPurchaseReturn('${r.id}')">❌ Confirm Reject</button><button class="btn-approve-count" style="background:#9C27B0;" onclick="approvePurchaseReturn('${r.id}')">✅ Approve & Stock OUT</button></div></div>`;
    });
    container.innerHTML = html;
}

function toggleRetBox(id) {
    const box = document.getElementById('retRejectBox-' + id);
    const btn = document.getElementById('retConfirmRejectBtn-' + id);
    if (box.classList.contains('show')) {
        box.classList.remove('show');
        btn.style.display = 'none';
    } else {
        box.classList.add('show');
        btn.style.display = 'flex';
    }
}

/* ─────────────────────────────────────────────────────────── */
/* ✅ APPROVE/REJECT PURCHASE RETURN                           */
/* ─────────────────────────────────────────────────────────── */
async function approvePurchaseReturn(returnId) {
    const r = allPurchaseReturns.find(x => x.id === returnId);
    if (!r) { alert('❌ Return not found!'); return; }
    if (r.status !== 'pending_return') { alert('⚠️ This return is already processed.'); return; }
    const notes = document.getElementById('retApprovalNotes-' + returnId)?.value.trim() || '';
    const confirmMsg = `✅ Approve Purchase Return?\n\n🔄 Return: ${r.returnNumber}\n🏪 Supplier: ${r.supplierName}\n📄 Original Bill: ${r.originalBillNumber}\n📦 Items: ${r.itemsCount}\n💰 Return Total: Rs. ${(r.returnTotal || 0).toLocaleString('en-LK')}\n\n📋 Actions:\n📉 Inventory stock OUT\n🧾 Supplier credit note create\n💵 Outstanding payment auto-adjust`;
    if (!confirm(confirmMsg)) return;
    try {
        const batch = db.batch();
        const returnRef = db.collection('purchaseReturns').doc(returnId);
        const creditNoteRef = db.collection('supplierCreditNotes').doc();
        const creditNoteNumber = generateCreditNoteNumber();
        batch.update(returnRef, {
            status: 'approved', actionBy: currentUser.nickname, actionByName: currentUser.name,
            actionAt: firebase.firestore.FieldValue.serverTimestamp(), approvalNotes: notes,
            rejectedReason: '', stockAdjusted: true, creditNoteCreated: true,
            creditNoteId: creditNoteRef.id, creditNoteNumber
        });
        batch.set(creditNoteRef, {
            creditNoteNumber, supplierId: r.supplierId || '', supplierName: r.supplierName,
            returnId, returnNumber: r.returnNumber || '', originalPurchaseId: r.originalPurchaseId,
            originalBillNumber: r.originalBillNumber, amount: fmtQty(r.returnTotal || 0),
            status: 'active', createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.nickname, createdByName: currentUser.name, notes: notes || ''
        });
        for (const item of (r.items || [])) {
            const inv = allInventoryItems.find(i => i.id === item.itemId);
            const prevStock = fmtQty(inv?.currentStock || 0);
            const newStock = fmtQty(Math.max(0, prevStock - (item.returnQuantity || 0)));
            const itemRef = db.collection('inventoryItems').doc(item.itemId);
            batch.update(itemRef, { currentStock: newStock, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: currentUser.nickname });
            const moveRef = db.collection('stockMovements').doc();
            batch.set(moveRef, {
                itemId: item.itemId, itemName: item.itemName, unit: item.unit || '',
                type: 'OUT', movementType: 'purchase_return',
                quantity: fmtQty(item.returnQuantity || 0),
                previousStock: prevStock, newStock,
                reason: `Purchase return to supplier - ${r.reasonText || 'N/A'}`,
                referenceId: returnId, referenceNumber: r.returnNumber || '',
                billNumber: r.originalBillNumber || '', supplierName: r.supplierName || '',
                date: r.originalPurchaseDate || new Date().toISOString().split('T')[0],
                notes: `Return: ${r.returnNumber} | Bill: ${r.originalBillNumber} | Reason: ${r.reasonText}`,
                handledBy: currentUser.nickname, handledByName: currentUser.name,
                performedBy: currentUser.nickname, performedByName: currentUser.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            if (inv) inv.currentStock = newStock;
        }
        await batch.commit();
        await recalculatePurchaseReturnStatus(r.originalPurchaseId);
        alert(`✅ Return Approved!\n\n📉 Stock reduced\n🧾 Credit note: ${creditNoteNumber}\n💵 Outstanding payment adjusted`);
    } catch (e) {
        console.error('Approve return error:', e);
        alert('❌ Approval failed: ' + e.message);
    }
}

async function rejectPurchaseReturn(returnId) {
    const r = allPurchaseReturns.find(x => x.id === returnId);
    if (!r) { alert('❌ Return not found!'); return; }
    if (r.status !== 'pending_return') { alert('⚠️ This return is already processed.'); return; }
    const reason = document.getElementById('retRejectReason-' + returnId)?.value.trim();
    if (!reason) { alert('⚠️ Rejection reason required!'); return; }
    if (!confirm(`❌ Reject this return?\n\n🔄 ${r.returnNumber}\n📝 Reason: ${reason}`)) return;
    try {
        await db.collection('purchaseReturns').doc(returnId).update({
            status: 'rejected', actionBy: currentUser.nickname, actionByName: currentUser.name,
            actionAt: firebase.firestore.FieldValue.serverTimestamp(), approvalNotes: '',
            rejectedReason: reason, stockAdjusted: false, creditNoteCreated: false,
            creditNoteId: '', creditNoteNumber: ''
        });
        alert('❌ Return Rejected!');
    } catch (e) { console.error(e); alert('❌ Reject failed: ' + e.message); }
}

async function recalculatePurchaseReturnStatus(purchaseId) {
    try {
        let purchase = allPurchases.find(p => p.id === purchaseId);
        if (!purchase) {
            const doc = await db.collection('purchases').doc(purchaseId).get();
            if (!doc.exists) return;
            purchase = { id: doc.id, ...doc.data() };
        }
        const approvedReturns = allPurchaseReturns.filter(r => r.originalPurchaseId === purchaseId && r.status === 'approved');
        const returnedValue = approvedReturns.reduce((sum, r) => sum + (r.returnTotal || 0), 0);
        const qtyMap = {};
        approvedReturns.forEach(r => { (r.items || []).forEach(item => { qtyMap[item.itemId] = fmtQty((qtyMap[item.itemId] || 0) + (item.returnQuantity || 0)); }); });
        let anyReturned = false; let fullyReturned = true;
        (purchase.items || []).forEach(item => {
            const returnedQty = qtyMap[item.itemId] || 0;
            if (returnedQty > 0) anyReturned = true;
            if (returnedQty + 0.0001 < (item.quantity || 0)) fullyReturned = false;
        });
        let returnStatus = 'none';
        if (anyReturned && fullyReturned) returnStatus = 'fully_returned';
        else if (anyReturned) returnStatus = 'partially_returned';
        const updateData = {
            hasReturns: anyReturned, returnStatus, returnedValue: fmtQty(returnedValue),
            lastReturnAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const billTotal = purchase.billTotal || 0;
        const newNetPayable = Math.max(0, billTotal - returnedValue);
        if (returnStatus === 'fully_returned' && purchase.paymentStatus === 'unpaid' && newNetPayable === 0) {
            updateData.paymentStatus = 'paid';
            updateData.paidDate = new Date().toISOString().split('T')[0];
            updateData.paidNotes = '🔄 Auto-settled via full return';
            updateData.paidAmount = 0;
            updateData.paidBy = currentUser.nickname;
            updateData.paidByName = currentUser.name + ' (Auto)';
            updateData.paidAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        await db.collection('purchases').doc(purchaseId).update(updateData);
    } catch (e) { console.error('recalculatePurchaseReturnStatus error:', e); }
}

/* ─────────────────────────────────────────────────────────── */
/* ✅ APPROVE/REJECT PURCHASE                                 */
/* ─────────────────────────────────────────────────────────── */
async function approvePurchase(billId) {
    const p = allPurchases.find(x => x.id === billId);
    if (!p) return;
    const notes = document.getElementById('purApprovalNotes-' + billId)?.value.trim() || 'Approved';
    let confirmMsg = `✅ Approve purchase bill?\n\n🏪 ${p.supplierName}\n📄 Bill #: ${p.billNumber}\n📦 Items: ${p.itemsCount}\n💰 Total: Rs. ${(p.billTotal||0).toLocaleString('en-LK')}\n\n📋 Actions:\n✅ Inventory stock IN\n✅ Unit prices update\n✅ Stock movements log`;
    if (!confirm(confirmMsg)) return;
    try {
        for (const item of (p.items || [])) {
            const itemDoc = await db.collection('inventoryItems').doc(item.itemId).get();
            if (!itemDoc.exists) continue;
            const itemData = itemDoc.data();
            const currentStock = fmtQty(itemData.currentStock || 0);
            const newStock = fmtQty(currentStock + item.quantity);
            await db.collection('inventoryItems').doc(item.itemId).update({
                currentStock: newStock, pricePerUnit: fmtQty(item.pricePerUnit),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: currentUser.nickname
            });
            await db.collection('stockMovements').add({
                itemId: item.itemId, itemName: item.itemName, type: 'IN',
                quantity: fmtQty(item.quantity),
                reason: `Purchase from ${p.supplierName} (Bill #${p.billNumber})`,
                previousStock: currentStock, newStock,
                previousPrice: fmtQty(item.previousPrice || 0), newPrice: fmtQty(item.pricePerUnit),
                date: p.date, handledBy: currentUser.nickname, handledByName: currentUser.name,
                purchaseId: billId, billNumber: p.billNumber, supplierName: p.supplierName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        if (p.supplierId) {
            const supDoc = await db.collection('suppliers').doc(p.supplierId).get();
            if (supDoc.exists) {
                const sup = supDoc.data();
                await db.collection('suppliers').doc(p.supplierId).update({
                    totalPurchases: (sup.totalPurchases || 0) + 1,
                    totalValue: (sup.totalValue || 0) + (p.billTotal || 0),
                    lastPurchaseDate: p.date,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        await db.collection('purchases').doc(billId).update({
            status: 'approved', approvalNotes: notes,
            approvedBy: currentUser.nickname, approvedByName: currentUser.name,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(), stockUpdated: true
        });
        alert(`✅ Purchase Approved!\n\n📦 Inventory updated.\n💰 Prices refreshed.\n📊 Stock movements logged.`);
    } catch (e) { console.error('Approve purchase error:', e); alert('❌ Error: ' + e.message); }
}
async function rejectPurchase(billId) {
    const reason = document.getElementById('purRejectReason-' + billId)?.value.trim();
    if (!reason) { alert('⚠️ Rejection reason!'); return; }
    if (!confirm('❌ Reject this purchase bill?')) return;
    try {
        await db.collection('purchases').doc(billId).update({
            status: 'rejected', rejectedReason: reason,
            approvedBy: currentUser.nickname,
            approvedByName: currentUser.name,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('❌ Rejected!');
    } catch (e) { alert('❌ ' + e.message); }
}

/* ─────────────────────────────────────────────────────────── */
/* 📊 STOCK COUNT APPROVE/REJECT/SUSPICIOUS                   */
/* ─────────────────────────────────────────────────────────── */
function toggleBox(showBoxId, showBtnId, hideBoxId, hideBtnId) {
    const showBox = document.getElementById(showBoxId);
    const showBtn = document.getElementById(showBtnId);
    const hideBox = document.getElementById(hideBoxId);
    const hideBtn = document.getElementById(hideBtnId);
    if (hideBox) hideBox.classList.remove('show');
    if (hideBtn) hideBtn.style.display = 'none';
    if (showBox.classList.contains('show')) {
        showBox.classList.remove('show');
        showBtn.style.display = 'none';
    } else {
        showBox.classList.add('show');
        showBtn.style.display = 'flex';
    }
}

async function approveStockCount(countId) {
    const count = allStockCounts.find(c => c.id === countId);
    if (!count) return;
    const notes = document.getElementById('approvalNotes-' + countId)?.value.trim() || 'Approved';
    if (!confirm(`✅ Approve stock count?\n📦 ${count.itemsCounted} items inventory update.`)) return;
    try {
        for (const item of (count.items || [])) {
            await db.collection('inventoryItems').doc(item.itemId).update({
                currentStock: fmtQty(item.physicalCount),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.nickname
            });
            if (item.difference !== 0) {
                await db.collection('stockMovements').add({
                    itemId: item.itemId, itemName: item.itemName,
                    type: item.difference > 0 ? 'IN' : 'OUT',
                    quantity: fmtQty(Math.abs(item.difference)),
                    reason: `Stock Count Approved (${count.date})`,
                    previousStock: fmtQty(item.systemStock),
                    newStock: fmtQty(item.physicalCount),
                    date: count.date,
                    handledBy: currentUser.nickname,
                    handledByName: currentUser.name,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        await db.collection('stockCounts').doc(countId).update({
            status: 'approved', approvalNotes: notes,
            approvedBy: currentUser.nickname,
            approvedByName: currentUser.name,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Approved!');
    } catch (e) { alert('❌ ' + e.message); }
}

async function suspiciousApproveStockCount(countId) {
    const count = allStockCounts.find(c => c.id === countId);
    if (!count) return;
    const suspiciousReason = document.getElementById('suspiciousReason-' + countId)?.value.trim();
    if (!suspiciousReason) { alert('⚠️ Suspicious reason!'); return; }
    const notes = document.getElementById('approvalNotes-' + countId)?.value.trim() || '';
    if (!confirm(`⚠️ Suspicious Approve?`)) return;
    try {
        for (const item of (count.items || [])) {
            await db.collection('inventoryItems').doc(item.itemId).update({
                currentStock: fmtQty(item.physicalCount),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.nickname
            });
            if (item.difference !== 0) {
                await db.collection('stockMovements').add({
                    itemId: item.itemId, itemName: item.itemName,
                    type: item.difference > 0 ? 'IN' : 'OUT',
                    quantity: fmtQty(Math.abs(item.difference)),
                    reason: `Stock Count Suspicious Approve`,
                    previousStock: fmtQty(item.systemStock),
                    newStock: fmtQty(item.physicalCount),
                    date: count.date,
                    handledBy: currentUser.nickname,
                    handledByName: currentUser.name,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            if (item.status !== 'match' && item.difference !== 0) {
                await db.collection('stockIssues').add({
                    type: 'stockCount', subType: 'suspicious',
                    relatedDocId: countId, date: count.date,
                    itemId: item.itemId, itemName: item.itemName,
                    requested: fmtQty(item.systemStock),
                    available: fmtQty(item.physicalCount),
                    shortage: fmtQty(Math.abs(item.difference)),
                    severity: item.status === 'critical' ? 'critical' : 'major',
                    unit: item.unit,
                    costLoss: fmtQty(Math.abs(item.costImpact || 0)),
                    reason: `⚠️ Suspicious: ${suspiciousReason}`,
                    reportedBy: currentUser.nickname,
                    reportedByName: currentUser.name,
                    status: 'pending',
                    resolvedBy: null, resolvedAt: null,
                    managerNotes: '', lossCategory: '',
                    lossAmount: fmtQty(Math.abs(item.costImpact || 0)),
                    plDeducted: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        await db.collection('stockCounts').doc(countId).update({
            status: 'suspicious_approved',
            approvalNotes: notes,
            suspiciousReason: suspiciousReason,
            approvedBy: currentUser.nickname,
            approvedByName: currentUser.name,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('⚠️ Suspicious Approved!');
    } catch (e) { alert('❌ ' + e.message); }
}

async function rejectStockCount(countId) {
    const reason = document.getElementById('rejectReason-' + countId)?.value.trim();
    if (!reason) { alert('⚠️ Reason!'); return; }
    if (!confirm('❌ Reject?')) return;
    try {
        await db.collection('stockCounts').doc(countId).update({
            status: 'rejected', rejectedReason: reason,
            approvedBy: currentUser.nickname,
            approvedByName: currentUser.name,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('❌ Rejected!');
    } catch (e) { alert('❌ ' + e.message); }
}

/* ─────────────────────────────────────────────────────────── */
/* 📊 STOCK COUNT REPORT (SCR)                                */
/* ─────────────────────────────────────────────────────────── */
function updateSCRSummary() {
    const approved = allStockCounts.filter(c => c.status === 'approved').length;
    const suspicious = allStockCounts.filter(c => c.status === 'suspicious_approved').length;
    const rejected = allStockCounts.filter(c => c.status === 'rejected').length;
    const issuesPending = allStockIssues.filter(i => i.status === 'pending').length;
    const totalLoss = allStockIssues.reduce((s, i) => s + (i.costLoss || 0), 0);

    const e1 = document.getElementById('scrApproved');
    const e2 = document.getElementById('scrSuspicious');
    const e3 = document.getElementById('scrRejected');
    const e4 = document.getElementById('scrIssues');
    const e5 = document.getElementById('scrTotalLoss');
    if (e1) e1.textContent = approved;
    if (e2) e2.textContent = suspicious;
    if (e3) e3.textContent = rejected;
    if (e4) e4.textContent = issuesPending;
    if (e5) e5.textContent = 'Rs. ' + totalLoss.toLocaleString('en-LK', { maximumFractionDigits: 0 });

    const c1 = document.getElementById('scrApprovedCount');
    const c2 = document.getElementById('scrSuspiciousCount');
    const c3 = document.getElementById('scrRejectedCount');
    const c4 = document.getElementById('scrIssuesCount');
    if (c1) c1.textContent = approved;
    if (c2) c2.textContent = suspicious;
    if (c3) c3.textContent = rejected;
    if (c4) c4.textContent = issuesPending;
}

function showSCRTab(name, btnEl) {
    currentSCRTab = name;
    document.querySelectorAll('.scr-content').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.scr-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('scrcontent-' + name).style.display = 'block';
    if (btnEl) btnEl.classList.add('active');
    renderSCRContent();
}

function renderSCRContent() {
    if (currentSCRTab === 'approved') renderApprovedCountsList();
    if (currentSCRTab === 'suspicious') renderSuspiciousCountsList();
    if (currentSCRTab === 'rejected') renderRejectedCountsList();
    if (currentSCRTab === 'issues') renderIssues();
}

function getFilteredCounts(status) {
    const from = document.getElementById('scrFromDate')?.value;
    const to = document.getElementById('scrToDate')?.value;
    return allStockCounts.filter(c => {
        if (c.status !== status) return false;
        if (from && c.date < from) return false;
        if (to && c.date > to) return false;
        return true;
    });
}

function buildCountCard(count, statusClass, badgeText, messageType, messageContent) {
    const sign = count.totalCostImpact >= 0 ? '+' : '';
    const color = count.totalCostImpact >= 0 ? '#4CAF50' : '#ff4444';
    return `<div class="count-result-card ${statusClass}"><div class="crc-header"><div class="crc-left"><span class="crc-date">📅 ${count.date}</span><span class="crc-status-badge ${statusClass}">${badgeText}</span></div><span style="font-size:11px; color:#888;">By: ${count.performedByName}</span></div><div class="crc-stats"><div class="crc-stat"><div class="crs-value">${count.itemsCounted||0}</div><div class="crs-label">Counted</div></div><div class="crc-stat"><div class="crs-value">${count.differencesFound||0}</div><div class="crs-label">Diffs</div></div><div class="crc-stat"><div class="crs-value" style="color:#ff4444;">${count.criticalIssues||0}</div><div class="crs-label">Critical</div></div><div class="crc-stat"><div class="crs-value" style="color:${color};">${sign}Rs.${Math.abs(count.totalCostImpact||0).toFixed(0)}</div><div class="crs-label">Impact</div></div></div><div class="crc-message ${messageType}">${messageContent}</div></div>`;
}

function renderApprovedCountsList() {
    const list = document.getElementById('approvedCountsList');
    if (!list) return;
    const approved = getFilteredCounts('approved');
    if (approved.length === 0) { list.innerHTML = `<div class="rpt-empty"><span class="empty-icon">📭</span>No approved counts.</div>`; return; }
    let html = '';
    approved.forEach(count => {
        const msg = `<strong>✅ Approved by ${count.approvedByName || 'Manager'}</strong>${count.approvalNotes ? `📝 ${count.approvalNotes}` : ''}<br>📅 ${formatTimestamp(count.approvedAt)}`;
        html += buildCountCard(count, 'approved', '✅ Approved', 'approve', msg);
    });
    list.innerHTML = html;
}

function renderSuspiciousCountsList() {
    const list = document.getElementById('suspiciousCountsList');
    if (!list) return;
    const suspicious = getFilteredCounts('suspicious_approved');
    if (suspicious.length === 0) { list.innerHTML = `<div class="rpt-empty"><span class="empty-icon">📭</span>No suspicious approvals.</div>`; return; }
    let html = '';
    suspicious.forEach(count => {
        const msg = `<strong>⚠️ Suspicious by ${count.approvedByName}</strong>🚨 ${count.suspiciousReason || 'N/A'}`;
        html += buildCountCard(count, 'suspicious_approved', '⚠️ Suspicious', 'suspicious', msg);
    });
    list.innerHTML = html;
}

function renderRejectedCountsList() {
    const list = document.getElementById('rejectedCountsList');
    if (!list) return;
    const rejected = getFilteredCounts('rejected');
    if (rejected.length === 0) { list.innerHTML = `<div class="rpt-empty"><span class="empty-icon">📭</span>No rejected counts.</div>`; return; }
    let html = '';
    rejected.forEach(count => {
        const msg = `<strong>❌ Rejected by ${count.approvedByName}</strong>📝 ${count.rejectedReason || 'No reason'}`;
        html += buildCountCard(count, 'rejected', '❌ Rejected', 'reject', msg);
    });
    list.innerHTML = html;
}

function resetSCRFilters() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    document.getElementById('scrFromDate').value = thirtyAgo.toISOString().split('T')[0];
    document.getElementById('scrToDate').value = today;
    renderSCRContent();
}

/* ─────────────────────────────────────────────────────────── */
/* 🚨 STOCK ISSUES                                            */
/* ─────────────────────────────────────────────────────────── */
function loadStockIssues() {
    db.collection('stockIssues').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allStockIssues = [];
        snap.forEach(doc => allStockIssues.push({ id: doc.id, ...doc.data() }));
        updateIssueStats();
        updateSidebarIssueBadge();
        updateSCRSummary();
        if (currentSCRTab === 'issues') renderIssues();
    });
}

function updateIssueStats() {
    const pending = allStockIssues.filter(i => i.status === 'pending').length;
    const noted = allStockIssues.filter(i => i.status === 'noted').length;
    const resolved = allStockIssues.filter(i => i.status === 'resolved').length;
    const e1 = document.getElementById('issuePendingCount');
    const e2 = document.getElementById('issueNotedCount');
    const e3 = document.getElementById('issueResolvedCount');
    if (e1) e1.textContent = pending;
    if (e2) e2.textContent = noted;
    if (e3) e3.textContent = resolved;
}

function updateSidebarIssueBadge() {
    const pending = allStockIssues.filter(i => i.status === 'pending').length;
    const badge = document.getElementById('sidebarIssuesCount');
    if (!badge) return;
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
}

function showIssueTab(status, btn) {
    currentIssueStatus = status;
    document.querySelectorAll('.issue-status-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderIssues();
}

function renderIssues() {
    const container = document.getElementById('issuesList');
    if (!container) return;
    filteredIssues = allStockIssues.filter(i => i.status === currentIssueStatus);
    if (filteredIssues.length === 0) {
        const msgs = { pending: ['✅', 'No pending issues!'], noted: ['📝', 'No noted.'], resolved: ['🎉', 'No resolved.'] };
        const [emoji, msg] = msgs[currentIssueStatus] || ['📭', 'No items.'];
        container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">${emoji}</span>${msg}</div>`;
        return;
    }
    const lossOpts = `<option value="">-- Select --</option><option value="lost">📦 LOST</option><option value="damaged">💔 DAMAGED</option><option value="theft">🚨 THEFT</option><option value="wastage">🔥 WASTAGE</option><option value="given">📤 GIVEN</option><option value="unknown">❓ UNKNOWN</option>`;
    let html = '';
    filteredIssues.forEach(issue => {
        let actions = '';
        if (issue.status === 'pending') {
            actions = `<div class="manager-notes-section" style="margin-top:12px;"><label>🏷️ Loss Category</label><select id="losscat-${issue.id}" style="margin-bottom:10px;">${lossOpts}</select><label>📝 Notes</label><textarea id="notes-${issue.id}" placeholder="Investigation notes..."></textarea></div><div class="issue-actions"><button class="issue-action-btn note" onclick="markIssue('${issue.id}', 'noted')">📝 Noted</button><button class="issue-action-btn resolve" onclick="resolveWithPL('${issue.id}')">✅ Resolve & P/L</button></div>`;
        } else if (issue.status === 'noted') {
            actions = `<div class="resolved-notes">📝 ${issue.managerNotes || 'No notes'}<div class="resolved-by">By: ${issue.resolvedByName} | ${formatTimestamp(issue.resolvedAt)}</div></div><div class="issue-actions"><button class="issue-action-btn reopen" onclick="reopenIssue('${issue.id}')">🔄 Reopen</button><button class="issue-action-btn resolve" onclick="resolveWithPL('${issue.id}')">✅ Resolve & P/L</button></div>`;
        } else {
            actions = `<div class="resolved-notes">✅ ${issue.managerNotes || 'No notes'}${issue.plDeducted ? `<br>📊 P/L: Rs. ${(issue.lossAmount||0).toFixed(2)}` : ''}<div class="resolved-by">By: ${issue.resolvedByName} | ${formatTimestamp(issue.resolvedAt)}</div></div><div class="issue-actions"><button class="issue-action-btn reopen" onclick="reopenIssue('${issue.id}')">🔄 Reopen</button></div>`;
        }
        html += `<div class="issue-card ${issue.status}"><div class="issue-card-header"><div class="issue-card-left"><span class="issue-date">📅 ${issue.date}</span><span class="severity-badge ${issue.severity}">${issue.severity}</span></div><span class="status-badge ${issue.status}">${issue.status}</span></div><div style="font-size:16px; font-weight:700; color:#e0e0e0; margin-bottom:8px;">📦 ${issue.itemName}</div><div class="issue-details-grid"><div class="issue-detail"><div class="id-label">System</div><div class="id-value orange">${issue.requested} ${issue.unit}</div></div><div class="issue-detail"><div class="id-label">Physical</div><div class="id-value">${issue.available} ${issue.unit}</div></div><div class="issue-detail"><div class="id-label">Diff</div><div class="id-value red">${issue.shortage} ${issue.unit}</div></div><div class="issue-detail"><div class="id-label">Cost</div><div class="id-value red">Rs. ${(issue.costLoss||0).toFixed(2)}</div></div></div><div class="issue-reason"><strong>Reason:</strong> ${issue.reason}</div>${actions}</div>`;
    });
    container.innerHTML = html;
}

async function markIssue(issueId, newStatus) {
    const notes = document.getElementById('notes-' + issueId)?.value.trim() || '';
    const lossCategory = document.getElementById('losscat-' + issueId)?.value || '';
    try {
        await db.collection('stockIssues').doc(issueId).update({
            status: newStatus, managerNotes: notes, lossCategory,
            resolvedBy: currentUser.nickname,
            resolvedByName: currentUser.name,
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`✅ ${newStatus}!`);
    } catch (e) { alert('❌ ' + e.message); }
}

async function resolveWithPL(issueId) {
    const issue = allStockIssues.find(i => i.id === issueId);
    if (!issue) return;
    const notes = document.getElementById('notes-' + issueId)?.value.trim() || issue.managerNotes || '';
    const lossCategory = document.getElementById('losscat-' + issueId)?.value || issue.lossCategory || '';
    if (!notes) { alert('⚠️ Notes!'); return; }
    if (!lossCategory) { alert('⚠️ Category!'); return; }
    const lossAmount = issue.costLoss || 0;
    if (!confirm(`✅ Resolve?`)) return;
    try {
        await db.collection('stockIssues').doc(issueId).update({
            status: 'resolved', managerNotes: notes, lossCategory, lossAmount,
            plDeducted: true,
            resolvedBy: currentUser.nickname,
            resolvedByName: currentUser.name,
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('plLossRecords').add({
            issueId, date: issue.date,
            itemId: issue.itemId, itemName: issue.itemName,
            lossCategory, lossAmount, unit: issue.unit,
            shortage: issue.shortage, department: issue.department || 'Kitchen',
            notes, recordedBy: currentUser.nickname,
            recordedByName: currentUser.name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`✅ Resolved!`);
    } catch (e) { alert('❌ ' + e.message); }
}

async function reopenIssue(issueId) {
    if (!confirm('🔄 Reopen?')) return;
    try {
        await db.collection('stockIssues').doc(issueId).update({
            status: 'pending', managerNotes: '', lossCategory: '',
            resolvedBy: null, resolvedByName: null, resolvedAt: null, plDeducted: false
        });
        alert('✅ Reopened!');
    } catch (e) { alert('❌ ' + e.message); }
}

/* ─────────────────────────────────────────────────────────── */
/* 🍽️ STAFF MEALS REPORT                                      */
/* ─────────────────────────────────────────────────────────── */
function loadStaffMealsData() {
    db.collection('staffMeals').orderBy('date', 'desc').onSnapshot((snap) => {
        allStaffMeals = [];
        snap.forEach(doc => allStaffMeals.push({ id: doc.id, ...doc.data() }));
    });
}

function loadStaffMealsReport() {
    const from = document.getElementById('smrFromDate')?.value;
    const to = document.getElementById('smrToDate')?.value;
    const container = document.getElementById('staffMealsReportList');
    let filtered = allStaffMeals;
    if (from) filtered = filtered.filter(m => m.date >= from);
    if (to) filtered = filtered.filter(m => m.date <= to);
    const totalCost = filtered.reduce((s, m) => s + (m.totalCost || 0), 0);
    const avgPerMeal = filtered.length ? totalCost / filtered.length : 0;
    const issues = filtered.filter(m => m.hasStockIssue).length;
    document.getElementById('smrTotal').textContent = filtered.length;
    document.getElementById('smrTotalCost').textContent = fmt(totalCost);
    document.getElementById('smrAvgPerMeal').textContent = fmt(avgPerMeal);
    document.getElementById('smrIssues').textContent = issues;
    if (filtered.length === 0) { container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">🍽️</span>No staff meals.</div>`; return; }
    let html = `<table class="rpt-data-table"><thead><tr><th>📅 Date</th><th>👥 Staff</th><th>🍽️ Menu</th><th>💰 Total</th><th>👤 Per Staff</th></tr></thead><tbody>`;
    filtered.forEach(m => {
        const staffNames = (m.staffNames || []).join(', ');
        const menuItems = (m.menuItems || []).map(mi => `${mi.recipeName} ×${mi.quantity}`).join(', ') || '-';
        const perStaff = (m.totalCost || 0) / ((m.staffIds || []).length || 1);
        html += `<tr><td><span class="rpt-date-badge">📅 ${m.date}</span></td><td>${staffNames || 'N/A'}</td><td style="font-size:12px; color:#aaa;">${menuItems}</td><td style="color:#ff4444; font-weight:700;">Rs. ${(m.totalCost||0).toFixed(2)}</td><td style="color:#f0a500;">Rs. ${perStaff.toFixed(2)}</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function resetSmrFilters() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    document.getElementById('smrFromDate').value = thirtyAgo.toISOString().split('T')[0];
    document.getElementById('smrToDate').value = today;
    loadStaffMealsReport();
}

/* ─────────────────────────────────────────────────────────── */
/* 🗑️ WASTAGE REPORT                                          */
/* ─────────────────────────────────────────────────────────── */
function loadWastageData() {
    db.collection('wastage').orderBy('date', 'desc').onSnapshot((snap) => {
        allWastage = [];
        snap.forEach(doc => allWastage.push({ id: doc.id, ...doc.data() }));
    });
}

function loadWastageReport() {
    const from = document.getElementById('wrFromDate')?.value;
    const to = document.getElementById('wrToDate')?.value;
    const reasonFilter = document.getElementById('wrReasonFilter')?.value;
    const container = document.getElementById('wastageReportList');
    let filtered = allWastage;
    if (from) filtered = filtered.filter(w => w.date >= from);
    if (to) filtered = filtered.filter(w => w.date <= to);
    if (reasonFilter) filtered = filtered.filter(w => w.reason === reasonFilter);
    const totalLoss = filtered.reduce((s, w) => s + (w.costLoss || 0), 0);
    const itemGroups = {};
    filtered.forEach(w => { itemGroups[w.itemName] = (itemGroups[w.itemName] || 0) + (w.costLoss || 0); });
    const topItem = Object.keys(itemGroups).sort((a, b) => itemGroups[b] - itemGroups[a])[0] || '-';
    const reasonGroups = {};
    filtered.forEach(w => { reasonGroups[w.reason] = (reasonGroups[w.reason] || 0) + 1; });
    const topReason = Object.keys(reasonGroups).sort((a, b) => reasonGroups[b] - reasonGroups[a])[0] || '-';
    document.getElementById('wrTotal').textContent = filtered.length;
    document.getElementById('wrTotalLoss').textContent = fmt(totalLoss);
    document.getElementById('wrTopItem').textContent = topItem;
    document.getElementById('wrTopReason').textContent = topReason;
    if (filtered.length === 0) { container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">🗑️</span>No wastage.</div>`; return; }
    let html = `<table class="rpt-data-table"><thead><tr><th>📅 Date</th><th>📦 Item</th><th>📊 Qty</th><th>🏷️ Reason</th><th>💸 Loss</th></tr></thead><tbody>`;
    filtered.forEach(w => {
        html += `<tr><td><span class="rpt-date-badge">📅 ${w.date}</span></td><td><strong>${w.itemName}</strong></td><td>${w.quantity} ${w.unit}</td><td>${w.reason}</td><td style="color:#ff4444; font-weight:700;">Rs. ${(w.costLoss||0).toFixed(2)}</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function resetWrFilters() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    document.getElementById('wrFromDate').value = thirtyAgo.toISOString().split('T')[0];
    document.getElementById('wrToDate').value = today;
    document.getElementById('wrReasonFilter').value = '';
    loadWastageReport();
}

/* ─────────────────────────────────────────────────────────── */
/* 🛒 PURCHASE REPORTS                                        */
/* ─────────────────────────────────────────────────────────── */
function loadPurchaseReports() {
    const from = document.getElementById('prFromDate')?.value;
    const to = document.getElementById('prToDate')?.value;
    const supplier = document.getElementById('prSupplierFilter')?.value;
    const payment = document.getElementById('prPaymentFilter')?.value;
    const container = document.getElementById('purchaseReportsList');

    let filtered = allPurchases.filter(p => p.status === 'approved' || p.status === 'rejected');
    if (from) filtered = filtered.filter(p => p.date >= from);
    if (to) filtered = filtered.filter(p => p.date <= to);
    if (supplier) filtered = filtered.filter(p => p.supplierId === supplier);
    if (payment) filtered = filtered.filter(p => p.paymentMethod === payment);

    const approvedFiltered = filtered.filter(p => p.status === 'approved');
    const totalValue = approvedFiltered.reduce((s, p) => s + (p.billTotal || 0), 0);

    document.getElementById('prTotal').textContent = filtered.length;
    document.getElementById('prTotalValue').textContent = 'Rs. ' + totalValue.toLocaleString('en-LK', { maximumFractionDigits: 0 });
    document.getElementById('prApproved').textContent = approvedFiltered.length;
    document.getElementById('prRejected').textContent = filtered.filter(p => p.status === 'rejected').length;

    if (filtered.length === 0) { container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">📋</span>No bills found.</div>`; return; }

    let html = '';
    filtered.forEach(p => { html += buildExpandableBillCard(p, 'report'); });
    container.innerHTML = html;
}

function resetPrFilters() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    document.getElementById('prFromDate').value = thirtyAgo.toISOString().split('T')[0];
    document.getElementById('prToDate').value = today;
    document.getElementById('prSupplierFilter').value = '';
    document.getElementById('prPaymentFilter').value = '';
    loadPurchaseReports();
}

function buildExpandableBillCard(p, cardType = 'report') {
    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank' };
    const today = new Date().toISOString().split('T')[0];
    const isExpanded = expandedBillId === p.id ? 'expanded' : '';
    const billTotal = p.billTotal || 0;
    const returnedValue = p.returnedValue || 0;
    const netPayable = getNetPayable(p);
    const hasReturns = returnedValue > 0;

    let statusClass = p.status;
    if (cardType === 'credit') {
        if (p.paymentStatus === 'paid') statusClass = 'paid';
        else if (p.dueDate && p.dueDate < today) statusClass = 'overdue';
        else if (p.dueDate === today) statusClass = 'today';
        else statusClass = 'approved';
    }

    let dueLabel = '', dueWarning = '';
    if (p.dueDate && p.paymentStatus === 'unpaid' && p.status === 'approved') {
        if (p.dueDate < today) {
            const daysOverdue = Math.floor((new Date(today) - new Date(p.dueDate)) / (1000 * 60 * 60 * 24));
            dueLabel = `🚨 OVERDUE by ${daysOverdue}d`;
            dueWarning = `<div class="pbill-due-warning overdue">🚨 OVERDUE by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} - Due was ${p.dueDate}</div>`;
        } else if (p.dueDate === today) {
            dueLabel = '⏰ TODAY';
            dueWarning = `<div class="pbill-due-warning today">⏰ DUE TODAY - ${p.dueDate}</div>`;
        } else {
            const daysLeft = Math.floor((new Date(p.dueDate) - new Date(today)) / (1000 * 60 * 60 * 24));
            dueLabel = `⏳ ${daysLeft}d left`;
            dueWarning = `<div class="pbill-due-warning upcoming">⏳ Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''} - ${p.dueDate}</div>`;
        }
    }
    if (p.paymentStatus === 'paid' && p.paidDate) {
        dueWarning = `<div class="pbill-due-warning paid">✅ PAID on ${p.paidDate}${p.paidAmount !== undefined ? ` - Rs. ${(p.paidAmount).toLocaleString('en-LK')}` : ''}${p.paidNotes ? `<br>📝 ${p.paidNotes}` : ''}</div>`;
    }

    let itemsHtml = '';
    (p.items || []).forEach(item => {
        itemsHtml += `<tr><td><strong>${item.itemName}</strong></td><td>${dispQty(item.quantity)} ${item.unit}</td><td style="color:#FF9800;">Rs. ${(item.pricePerUnit||0).toFixed(2)}</td><td style="color:#FF9800; font-weight:700;">Rs. ${(item.totalCost||0).toLocaleString('en-LK')}</td></tr>`;
    });
    itemsHtml += `<tr class="grand-total"><td colspan="3" style="text-align:right;">GRAND TOTAL:</td><td>Rs. ${billTotal.toLocaleString('en-LK')}</td></tr>`;

    let netPayableSection = '';
    if (hasReturns && cardType === 'credit') {
        netPayableSection = `<div style="background:rgba(76,175,80,0.08); border:1px solid rgba(76,175,80,0.3); padding:14px; border-radius:8px; margin-top:14px;"><div style="font-size:14px; color:#4CAF50; font-weight:700; margin-bottom:10px;">💰 Net Payment Calculation:</div><div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;"><span style="color:#aaa;">Original Bill:</span><span style="color:#e0e0e0;">Rs. ${billTotal.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;"><span style="color:#9C27B0;">🔄 Returned:</span><span style="color:#9C27B0;">- Rs. ${returnedValue.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:8px 0 4px; font-size:16px; border-top:1px solid rgba(76,175,80,0.3); margin-top:6px; font-weight:700;"><span style="color:#4CAF50;">💵 NET PAYABLE:</span><span style="color:#4CAF50;">Rs. ${netPayable.toLocaleString('en-LK')}</span></div></div>`;
    }

    let photoSection = '';
    if (p.billPhotoUrl) {
        photoSection = `<div class="pbill-photo"><img src="${p.billPhotoUrl}" onclick="openPhotoFullscreen('${p.billPhotoUrl}')"><div class="pp-label">📸 Click photo to view full size</div></div>`;
    }

    let statusBadge = '';
    if (cardType === 'credit') {
        if (p.paymentStatus === 'paid') statusBadge = '<span class="pbill-status approved">✅ PAID</span>';
        else if (p.dueDate && p.dueDate < today) statusBadge = `<span class="pbill-status rejected">${dueLabel}</span>`;
        else if (p.dueDate === today) statusBadge = `<span class="pbill-status" style="background:rgba(240,165,0,0.15); color:#f0a500;">${dueLabel}</span>`;
        else statusBadge = `<span class="pbill-status" style="background:rgba(33,150,243,0.15); color:#2196F3;">${dueLabel}</span>`;
    } else {
        const statusLabels = { approved: '✅ Approved', rejected: '❌ Rejected', pending_approval: '⏳ Pending' };
        statusBadge = `<span class="pbill-status ${p.status}">${statusLabels[p.status] || p.status}</span>`;
    }

    let actions = '';
    if (p.billPhotoUrl) actions += `<button class="pbill-btn photo" onclick="event.stopPropagation(); openPhotoFullscreen('${p.billPhotoUrl}')">📸 Full Photo</button>`;
    if (cardType === 'credit') {
        if (p.paymentStatus === 'unpaid') {
            actions += `<button class="pbill-btn markpaid" onclick="event.stopPropagation(); openMarkPaidModal('${p.id}')">💰 Mark Paid (Rs. ${netPayable.toLocaleString('en-LK')})</button>`;
        } else {
            actions += `<button class="pbill-btn markunpaid" onclick="event.stopPropagation(); markUnpaid('${p.id}')">🔄 Mark Unpaid</button>`;
        }
    }

    let rejectionInfo = '';
    if (p.status === 'rejected') {
        rejectionInfo = `<div style="padding:10px 14px; background:rgba(255,68,68,0.08); border:1px solid rgba(255,68,68,0.3); border-radius:8px; margin-top:12px; font-size:13px; color:#ff4444;"><strong>❌ Rejection Reason:</strong> ${p.rejectedReason || 'No reason given'}</div>`;
    }
    if (p.status === 'approved' && p.approvalNotes) {
        rejectionInfo = `<div style="padding:10px 14px; background:rgba(76,175,80,0.08); border:1px solid rgba(76,175,80,0.3); border-radius:8px; margin-top:12px; font-size:13px; color:#4CAF50;"><strong>✅ Approval Notes:</strong> ${p.approvalNotes}</div>`;
    }

    let returnsBadge = '';
    if (hasReturns) {
        returnsBadge = `<span style="background:rgba(156,39,176,0.15); color:#9C27B0; padding:3px 10px; border-radius:8px; font-size:11px; font-weight:700; margin-left:6px;">🔄 ${p.returnStatus === 'fully_returned' ? 'FULLY' : 'PARTIALLY'} RETURNED</span>`;
    }

    return `<div class="pbill-card ${statusClass} ${isExpanded}" id="pbill-${p.id}"><div class="pbill-header" onclick="toggleBillExpand('${p.id}')"><span class="pbill-date">📅 ${p.date}</span><div><div class="pbill-bill-num">📄 ${p.billNumber} ${returnsBadge}</div><div class="pbill-supplier">🏪 ${p.supplierName}</div></div><span class="pbill-payment ${p.paymentMethod}">${paymentIcons[p.paymentMethod] || p.paymentMethod}</span><span class="pbill-items">📦 ${p.itemsCount || 0}</span><span class="pbill-total">${hasReturns && cardType === 'credit' ? `<span style="text-decoration:line-through; opacity:0.5; font-size:11px;">Rs. ${billTotal.toLocaleString('en-LK')}</span><br>Rs. ${netPayable.toLocaleString('en-LK')}` : `Rs. ${billTotal.toLocaleString('en-LK')}`}</span><div style="display:flex; align-items:center; gap:8px;">${statusBadge}<span class="pbill-expand-icon">▼</span></div></div><div class="pbill-details"><div class="pbill-info-grid"><div class="pbill-info-item"><div class="pi-label">🏪 Supplier</div><div class="pi-value">${p.supplierName}</div></div><div class="pbill-info-item"><div class="pi-label">📞 Phone</div><div class="pi-value">${p.supplierPhone || 'N/A'}</div></div><div class="pbill-info-item"><div class="pi-label">📄 Bill Number</div><div class="pi-value orange">${p.billNumber}</div></div><div class="pbill-info-item"><div class="pi-label">💳 Payment Method</div><div class="pi-value">${paymentIcons[p.paymentMethod] || p.paymentMethod}</div></div>${p.dueDate ? `<div class="pbill-info-item"><div class="pi-label">📅 Due Date</div><div class="pi-value orange">${p.dueDate}</div></div>` : ''}<div class="pbill-info-item"><div class="pi-label">📦 Total Items</div><div class="pi-value">${p.itemsCount || 0}</div></div><div class="pbill-info-item"><div class="pi-label">💰 Bill Total</div><div class="pi-value orange">Rs. ${billTotal.toLocaleString('en-LK')}</div></div><div class="pbill-info-item"><div class="pi-label">📊 Stock Status</div><div class="pi-value ${p.stockUpdated ? 'green' : 'red'}">${p.stockUpdated ? '✅ Updated' : '❌ Not Updated'}</div></div>${hasReturns ? `<div class="pbill-info-item"><div class="pi-label">🔄 Returned Value</div><div class="pi-value" style="color:#9C27B0;">Rs. ${returnedValue.toLocaleString('en-LK')}</div></div>` : ''}${hasReturns ? `<div class="pbill-info-item"><div class="pi-label">💵 Net Payable</div><div class="pi-value" style="color:#4CAF50;">Rs. ${netPayable.toLocaleString('en-LK')}</div></div>` : ''}</div>${dueWarning}${netPayableSection}<h4 style="color:#FF9800; font-size:13px; margin-top:14px; margin-bottom:8px;">📦 Items:</h4><table class="pbill-items-table"><thead><tr><th>Item</th><th>Qty</th><th>Per Unit</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>${photoSection}${p.notes ? `<div class="pbill-notes-box"><strong style="color:#FF9800;">📝 Notes:</strong> ${p.notes}</div>` : ''}${rejectionInfo}<div class="pbill-meta-info">👤 <strong>Submitted by:</strong> ${p.performedByName} | 🕐 ${formatTimestamp(p.createdAt)}${p.approvedAt ? `<br>${p.status === 'approved' ? '✅ Approved' : '❌ Rejected'} by: <strong>${p.approvedByName}</strong> | 🕐 ${formatTimestamp(p.approvedAt)}` : ''}${p.paidAt ? `<br>💰 Paid by: <strong>${p.paidByName}</strong> | 🕐 ${formatTimestamp(p.paidAt)}${p.paidAmount !== undefined ? ` | Amount: Rs. ${p.paidAmount.toLocaleString('en-LK')}` : ''}` : ''}</div>${actions ? `<div class="pbill-actions">${actions}</div>` : ''}</div></div>`;
}

function toggleBillExpand(billId) {
    const card = document.getElementById('pbill-' + billId);
    if (!card) return;
    if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        expandedBillId = null;
    } else {
        document.querySelectorAll('.pbill-card.expanded').forEach(c => c.classList.remove('expanded'));
        card.classList.add('expanded');
        expandedBillId = billId;
    }
}

/* ─────────────────────────────────────────────────────────── */
/* 💳 CREDIT TRACKING                                         */
/* ─────────────────────────────────────────────────────────── */
function getCROverdue() {
    const today = new Date().toISOString().split('T')[0];
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate && p.dueDate < today && getNetPayable(p) > 0);
}
function getCRToday() {
    const today = new Date().toISOString().split('T')[0];
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate === today && getNetPayable(p) > 0);
}
function getCRUpcoming() {
    const today = new Date(); const todayStr = today.toISOString().split('T')[0];
    const sevenDays = new Date(); sevenDays.setDate(today.getDate() + 7);
    const sevenStr = sevenDays.toISOString().split('T')[0];
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate && p.dueDate > todayStr && p.dueDate <= sevenStr && getNetPayable(p) > 0);
}
function getCRAllUnpaid() { return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && getNetPayable(p) > 0); }
function getCRPaid() { return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'paid' && p.paymentMethod !== 'cash'); }

function updateCRStats() {
    const overdue = getCROverdue(); const today = getCRToday(); const upcoming = getCRUpcoming();
    const allUnpaid = getCRAllUnpaid(); const paid = getCRPaid();
    const totalUnpaid = allUnpaid.reduce((s, p) => s + getNetPayable(p), 0);
    const e1 = document.getElementById('crOverdueCount'); const e2 = document.getElementById('crTodayCount');
    const e3 = document.getElementById('crUpcomingCount'); const e4 = document.getElementById('crTotalUnpaid');
    const e5 = document.getElementById('crPaidCount');
    if (e1) e1.textContent = overdue.length;
    if (e2) e2.textContent = today.length;
    if (e3) e3.textContent = upcoming.length;
    if (e4) e4.textContent = 'Rs. ' + totalUnpaid.toLocaleString('en-LK', { maximumFractionDigits: 0 });
    if (e5) e5.textContent = paid.length;
    const setBadge = (id, count) => { const el = document.getElementById(id); if (!el) return; el.textContent = count; el.style.display = count > 0 ? 'inline-block' : 'none'; };
    setBadge('crOverdueBadge', overdue.length); setBadge('crTodayBadge', today.length);
    setBadge('crUpcomingBadge', upcoming.length); setBadge('crAllUnpaidBadge', allUnpaid.length); setBadge('crPaidBadge', paid.length);
}

function showCRTab(name, btnEl) {
    currentCRTab = name;
    document.querySelectorAll('#section-creditTracking .scr-tab').forEach(t => t.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderCRTab();
}

function renderCRTab() {
    const list = document.getElementById('creditTrackingList');
    if (!list) return;
    let bills = [], emptyMsg = '';
    if (currentCRTab === 'overdue') { bills = getCROverdue(); emptyMsg = '🎉 No overdue payments!'; }
    else if (currentCRTab === 'today') { bills = getCRToday(); emptyMsg = '✅ Nothing due today!'; }
    else if (currentCRTab === 'upcoming') { bills = getCRUpcoming(); emptyMsg = '📭 No upcoming bills.'; }
    else if (currentCRTab === 'all-unpaid') { bills = getCRAllUnpaid(); emptyMsg = '🎉 All paid!'; }
    else if (currentCRTab === 'paid') { bills = getCRPaid(); emptyMsg = '📭 No paid bills.'; }
    const supplier = document.getElementById('crSupplierFilter')?.value;
    const payment = document.getElementById('crPaymentFilter')?.value;
    if (supplier) bills = bills.filter(p => p.supplierId === supplier);
    if (payment) bills = bills.filter(p => p.paymentMethod === payment);
    if (bills.length === 0) { list.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">${emptyMsg}</div>`; return; }
    bills.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    let html = '';
    bills.forEach(p => { html += buildExpandableBillCard(p, 'credit'); });
    list.innerHTML = html;
}

function resetCRFilters() {
    document.getElementById('crSupplierFilter').value = '';
    document.getElementById('crPaymentFilter').value = '';
    renderCRTab();
}

/* ─────────────────────────────────────────────────────────── */
/* 💰 MARK PAID MODAL                                         */
/* ─────────────────────────────────────────────────────────── */
function openMarkPaidModal(billId) {
    const p = allPurchases.find(x => x.id === billId); if (!p) return;
    markPaidBillId = billId;
    const billTotal = p.billTotal || 0; const returnedValue = p.returnedValue || 0;
    const netPayable = getNetPayable(p); const hasReturns = returnedValue > 0;
    let bodyHtml = `<div style="background:#0f3460; padding:14px; border-radius:8px;"><div style="font-size:14px; color:#FF9800; font-weight:700; margin-bottom:8px;">🏪 ${escapeHtml(p.supplierName)}</div><div style="font-size:13px; color:#aaa;">📄 ${escapeHtml(p.billNumber)}</div>`;
    if (hasReturns) {
        bodyHtml += `<div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);"><div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span style="color:#aaa;">💰 Bill Total:</span><span>Rs. ${billTotal.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span style="color:#9C27B0;">🔄 Returned:</span><span style="color:#9C27B0;">- Rs. ${returnedValue.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:6px 0; font-size:16px; border-top:1px solid rgba(255,255,255,0.1); margin-top:4px; font-weight:700;"><span style="color:#4CAF50;">💵 NET PAYABLE:</span><span style="color:#4CAF50;">Rs. ${netPayable.toLocaleString('en-LK')}</span></div></div>`;
    } else {
        bodyHtml += `<div style="font-size:18px; color:#4CAF50; font-weight:700; margin-top:8px;">💰 Rs. ${netPayable.toLocaleString('en-LK')}</div>`;
    }
    bodyHtml += `</div>`;
    document.getElementById('markPaidBody').innerHTML = bodyHtml;
    document.getElementById('paidDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('paidNotesInput').value = '';
    // ⭐ Reset payment proof
    rptPaymentProofPhotoUrl = ''; rptPaymentProofPhotoPath = '';
    document.getElementById('rptPaymentProofUrl').value = '';
    document.getElementById('rptPaymentProofImg').src = '';
    document.getElementById('rptPaymentProofPreview').style.display = 'none';
    document.getElementById('rptPaymentProofProgress').style.display = 'none';
    document.getElementById('markPaidModal').classList.add('show');
}

function closeMarkPaidModal() { document.getElementById('markPaidModal').classList.remove('show'); }

async function confirmMarkPaid() {
    const paidDate = document.getElementById('paidDateInput').value;
    const paidNotes = document.getElementById('paidNotesInput').value.trim();
    if (!paidDate) { alert('⚠️ Payment date!'); return; }
    const p = allPurchases.find(x => x.id === markPaidBillId);
    const netPayable = p ? getNetPayable(p) : 0;
    // ⭐ Payment proof
    const proofUrl = rptPaymentProofPhotoUrl || document.getElementById('rptPaymentProofUrl').value.trim();
    try {
        await db.collection('purchases').doc(markPaidBillId).update({
            paymentStatus: 'paid', paidDate, paidNotes,
            paidAmount: fmtQty(netPayable),
            paidBy: currentUser.nickname, paidByName: currentUser.name,
            paidAt: firebase.firestore.FieldValue.serverTimestamp(),
            paymentProofUrl: proofUrl || '',
            paymentProofPath: rptPaymentProofPhotoPath || ''
        });
        alert(`✅ Marked as Paid!\n\n💰 Rs. ${netPayable.toLocaleString('en-LK')}${proofUrl ? '\n📸 Proof attached!' : ''}`);
        closeMarkPaidModal();
    } catch (e) { alert('❌ ' + e.message); }
}

async function markUnpaid(billId) {
    if (!confirm('🔄 Mark as UNPAID?')) return;
    try {
        await db.collection('purchases').doc(billId).update({
            paymentStatus: 'unpaid', paidDate: null, paidNotes: '',
            paidAmount: 0, paidBy: null, paidByName: null, paidAt: null
        });
        alert('✅ Marked as Unpaid!');
    } catch (e) { alert('❌ ' + e.message); }
}

/* ─────────────────────────────────────────────────────────── */
/* 📸 PHOTO FULLSCREEN                                        */
/* ─────────────────────────────────────────────────────────── */
function openPhotoFullscreen(src) {
    if (!src) return;
    document.getElementById('fullscreenImg').src = src;
    document.getElementById('photoFullscreenModal').classList.add('show');
}
// ════════════════════════════════════════════════════════════
// 📸 PAYMENT PROOF - REPORTS DB ⭐ NEW!
// ════════════════════════════════════════════════════════════
async function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            img.onerror = reject; img.src = e.target.result;
        };
        reader.onerror = reject; reader.readAsDataURL(file);
    });
}

async function handleRptPaymentProofFile(input) {
    const file = input.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { alert('⚠️ Image files only!'); return; }
    const progressWrap = document.getElementById('rptPaymentProofProgress');
    const progressBar = document.getElementById('rptPaymentProofBar');
    const progressPercent = document.getElementById('rptPaymentProofPercent');
    const status = document.getElementById('rptPaymentProofStatus');
    progressWrap.style.display = 'block'; progressBar.style.width = '0%'; progressPercent.textContent = '0%'; status.textContent = 'Compressing...';
    try {
        const compressedBlob = await compressImage(file);
        status.textContent = `Compressed: ${(file.size/1024).toFixed(0)}KB → ${(compressedBlob.size/1024).toFixed(0)}KB`;
        const timestamp = Date.now();
        const fileName = `payment-proofs/proof_${timestamp}_${currentUser.nickname}.jpg`;
        const storageRef = storage.ref(fileName);
        const uploadTask = storageRef.put(compressedBlob);
        uploadTask.on('state_changed',
            (snapshot) => { const progress = (snapshot.bytesTransferred/snapshot.totalBytes)*100; progressBar.style.width = progress+'%'; progressPercent.textContent = Math.round(progress)+'%'; },
            (error) => { console.error(error); progressWrap.style.display = 'none'; alert('❌ Upload failed!'); },
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                rptPaymentProofPhotoUrl = downloadURL; rptPaymentProofPhotoPath = fileName;
                document.getElementById('rptPaymentProofImg').src = downloadURL;
                document.getElementById('rptPaymentProofPreview').style.display = 'block';
                document.getElementById('rptPaymentProofUrl').value = downloadURL;
                setTimeout(() => { progressWrap.style.display = 'none'; }, 1000);
                status.textContent = '✅ Upload complete!';
            }
        );
    } catch (e) { console.error(e); progressWrap.style.display = 'none'; alert('❌ Error: ' + e.message); }
    input.value = '';
}

function previewRptPaymentProofUrl() {
    const url = document.getElementById('rptPaymentProofUrl').value.trim();
    if (!url) { removeRptPaymentProof(); return; }
    if (url === rptPaymentProofPhotoUrl) return;
    const img = document.getElementById('rptPaymentProofImg');
    img.src = url;
    img.onerror = function() { document.getElementById('rptPaymentProofPreview').style.display = 'none'; };
    img.onload = function() { document.getElementById('rptPaymentProofPreview').style.display = 'block'; rptPaymentProofPhotoUrl = url; rptPaymentProofPhotoPath = ''; };
}

async function removeRptPaymentProof() {
    if (rptPaymentProofPhotoPath) { try { await storage.ref(rptPaymentProofPhotoPath).delete(); } catch (e) { console.warn(e); } }
    document.getElementById('rptPaymentProofUrl').value = '';
    document.getElementById('rptPaymentProofImg').src = '';
    document.getElementById('rptPaymentProofPreview').style.display = 'none';
    rptPaymentProofPhotoUrl = ''; rptPaymentProofPhotoPath = '';
}
function closePhotoFullscreen() { document.getElementById('photoFullscreenModal').classList.remove('show'); }

window.onclick = function(event) {
    if (event.target.id === 'photoFullscreenModal') closePhotoFullscreen();
    if (event.target.id === 'markPaidModal') closeMarkPaidModal();
};

/* ─────────────────────────────────────────────────────────── */
/* 🏪 SUPPLIER ANALYSIS                                       */
/* ─────────────────────────────────────────────────────────── */
let expandedSupplierId = null;
let supplierSortBy = 'spend';

function loadSupplierAnalysis() {
    const from = document.getElementById('saFromDate')?.value;
    const to = document.getElementById('saToDate')?.value;
    const sortBy = document.getElementById('saSortBy')?.value || 'spend';
    supplierSortBy = sortBy;
    let filteredPurchases = allPurchases.filter(p => p.status === 'approved');
    if (from) filteredPurchases = filteredPurchases.filter(p => p.date >= from);
    if (to) filteredPurchases = filteredPurchases.filter(p => p.date <= to);
    const supplierStats = calculateSupplierStats(filteredPurchases);
    updateSupplierSummaryCards(supplierStats);
    renderTopSuppliers(supplierStats);
    renderAllSuppliers(supplierStats, filteredPurchases);
}

function calculateSupplierStats(purchases) {
    const stats = {};
    allSuppliers.forEach(sup => {
        stats[sup.id] = {
            id: sup.id, name: sup.name, phone: sup.phone || '',
            bills: [], totalBills: 0, totalSpend: 0, avgBillValue: 0,
            lastPurchaseDate: null, paidBills: 0, unpaidBills: 0,
            paidAmount: 0, unpaidAmount: 0,
            cashBills: 0, creditBills: 0, bankBills: 0, isActive: false
        };
    });
    purchases.forEach(p => {
        if (!p.supplierId) return;
        if (!stats[p.supplierId]) {
            stats[p.supplierId] = {
                id: p.supplierId, name: p.supplierName || 'Unknown', phone: p.supplierPhone || '',
                bills: [], totalBills: 0, totalSpend: 0, avgBillValue: 0,
                lastPurchaseDate: null, paidBills: 0, unpaidBills: 0,
                paidAmount: 0, unpaidAmount: 0,
                cashBills: 0, creditBills: 0, bankBills: 0, isActive: false
            };
        }
        const s = stats[p.supplierId];
        s.bills.push(p); s.totalBills++; s.totalSpend += (p.billTotal || 0);
        if (!s.lastPurchaseDate || p.date > s.lastPurchaseDate) s.lastPurchaseDate = p.date;
        if (p.paymentStatus === 'paid' || p.paymentMethod === 'cash') { s.paidBills++; s.paidAmount += (p.billTotal || 0); }
        else { s.unpaidBills++; s.unpaidAmount += getNetPayable(p); }
        if (p.paymentMethod === 'cash') s.cashBills++;
        else if (p.paymentMethod === 'credit') s.creditBills++;
        else if (p.paymentMethod === 'bank') s.bankBills++;
    });
    const today = new Date(); const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    Object.values(stats).forEach(s => {
        s.avgBillValue = s.totalBills > 0 ? s.totalSpend / s.totalBills : 0;
        s.isActive = s.lastPurchaseDate && s.lastPurchaseDate >= thirtyAgoStr;
    });
    return stats;
}

function updateSupplierSummaryCards(stats) {
    const all = Object.values(stats);
    const withBills = all.filter(s => s.totalBills > 0);
    const active = withBills.filter(s => s.isActive);
    const totalSpend = withBills.reduce((sum, s) => sum + s.totalSpend, 0);
    const topSupplier = [...withBills].sort((a, b) => b.totalSpend - a.totalSpend)[0];
    const e1 = document.getElementById('saTotalSuppliers'); const e2 = document.getElementById('saActiveSuppliers');
    const e3 = document.getElementById('saTotalSpend'); const e4 = document.getElementById('saTopSupplier');
    if (e1) e1.textContent = withBills.length;
    if (e2) e2.textContent = active.length;
    if (e3) e3.textContent = 'Rs. ' + totalSpend.toLocaleString('en-LK', { maximumFractionDigits: 0 });
    if (e4) e4.textContent = topSupplier ? topSupplier.name : '-';
}

function renderTopSuppliers(stats) {
    const container = document.getElementById('topSuppliersList');
    if (!container) return;
    const withBills = Object.values(stats).filter(s => s.totalBills > 0);
    const topSuppliers = withBills.sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);
    if (topSuppliers.length === 0) { container.innerHTML = `<div style="text-align:center; padding:30px; color:#888;">📭 No supplier data yet.</div>`; return; }
    const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
    const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-other', 'rank-other'];
    let html = '';
    topSuppliers.forEach((s, i) => {
        html += `<div class="top-supplier-card ${rankClasses[i]}"><div class="top-supplier-rank">${medals[i]}</div><div class="top-supplier-name">${s.name}</div><div class="top-supplier-phone">${s.phone ? '📞 ' + s.phone : '📞 N/A'}</div><div class="top-supplier-value">Rs. ${s.totalSpend.toLocaleString('en-LK', { maximumFractionDigits: 0 })}</div><div class="top-supplier-stats"><span>📋 ${s.totalBills} bills</span><span>📊 Avg: Rs. ${s.avgBillValue.toLocaleString('en-LK', { maximumFractionDigits: 0 })}</span></div></div>`;
    });
    container.innerHTML = html;
}

function renderAllSuppliers(stats, filteredPurchases) {
    const container = document.getElementById('allSuppliersList');
    const countEl = document.getElementById('allSuppliersCount');
    if (!container) return;
    let all = Object.values(stats).filter(s => s.totalBills > 0);
    if (supplierSortBy === 'spend') all.sort((a, b) => b.totalSpend - a.totalSpend);
    else if (supplierSortBy === 'bills') all.sort((a, b) => b.totalBills - a.totalBills);
    else if (supplierSortBy === 'recent') all.sort((a, b) => (b.lastPurchaseDate || '').localeCompare(a.lastPurchaseDate || ''));
    if (countEl) countEl.textContent = `${all.length} suppliers`;
    if (all.length === 0) { container.innerHTML = `<div class="rpt-empty"><span class="empty-icon">🏪</span>No supplier purchases found in selected date range.</div>`; return; }
    let html = '';
    all.forEach(s => {
        const isExpanded = expandedSupplierId === s.id ? 'expanded' : '';
        const statusBadge = s.isActive ? '<span class="supplier-status-badge active">✅ Active</span>' : '<span class="supplier-status-badge inactive">💤 Inactive</span>';
        const expandedContent = buildSupplierExpandedView(s);
        html += `<div class="supplier-card ${s.isActive ? '' : 'inactive'} ${isExpanded}" id="supcard-${s.id}"><div class="supplier-card-header" onclick="toggleSupplierExpand('${s.id}')"><div class="supplier-card-top"><div class="supplier-card-name">🏪 ${s.name}</div>${statusBadge}</div><div class="supplier-card-phone">${s.phone ? '📞 ' + s.phone : '📞 No phone'}</div><div class="supplier-card-stats"><div class="sup-stat"><div class="sup-stat-value">${s.totalBills}</div><div class="sup-stat-label">📋 Bills</div></div><div class="sup-stat green"><div class="sup-stat-value">Rs.${(s.totalSpend/1000).toFixed(0)}K</div><div class="sup-stat-label">💰 Spend</div></div><div class="sup-stat blue"><div class="sup-stat-value">Rs.${(s.avgBillValue/1000).toFixed(1)}K</div><div class="sup-stat-label">📊 Avg</div></div></div></div><div class="supplier-card-footer"><span>📅 Last: ${s.lastPurchaseDate || 'N/A'}</span><span class="supplier-expand-icon">▼</span></div><div class="supplier-details">${expandedContent}</div></div>`;
    });
    container.innerHTML = html;
}

function buildSupplierExpandedView(s) {
    const paymentBreakdown = `<div class="supplier-detail-section"><h4>💳 Payment Breakdown</h4><div class="payment-breakdown"><div class="payment-stat cash"><div class="payment-stat-value">${s.cashBills}</div><div class="payment-stat-label">💵 Cash Bills</div></div><div class="payment-stat credit"><div class="payment-stat-value">${s.creditBills}</div><div class="payment-stat-label">📋 Credit Bills</div></div><div class="payment-stat bank"><div class="payment-stat-value">${s.bankBills}</div><div class="payment-stat-label">🏦 Bank Bills</div></div><div class="payment-stat unpaid"><div class="payment-stat-value">Rs.${(s.unpaidAmount/1000).toFixed(0)}K</div><div class="payment-stat-label">⚠️ Net Unpaid</div></div></div></div>`;
    const itemFrequency = {};
    s.bills.forEach(bill => {
        (bill.items || []).forEach(item => {
            if (!itemFrequency[item.itemName]) { itemFrequency[item.itemName] = { name: item.itemName, count: 0, totalQty: 0, totalSpend: 0, unit: item.unit || '' }; }
            itemFrequency[item.itemName].count++;
            itemFrequency[item.itemName].totalQty += (item.quantity || 0);
            itemFrequency[item.itemName].totalSpend += (item.totalCost || 0);
        });
    });
    const topItems = Object.values(itemFrequency).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 10);
    let topItemsHtml = '';
    if (topItems.length > 0) {
        let rows = '';
        topItems.forEach(item => { rows += `<tr><td><strong>${item.name}</strong></td><td>${item.count}×</td><td>${dispQty(item.totalQty)} ${item.unit}</td><td style="color:#FF9800; font-weight:700;">Rs. ${item.totalSpend.toLocaleString('en-LK', { maximumFractionDigits: 0 })}</td></tr>`; });
        topItemsHtml = `<div class="supplier-detail-section"><h4>📦 Top Items Purchased</h4><table class="top-items-table"><thead><tr><th>Item</th><th>Times</th><th>Total Qty</th><th>Total Spend</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    const recentBills = [...s.bills].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    let recentBillsHtml = '';
    if (recentBills.length > 0) {
        let billsList = '';
        recentBills.forEach(bill => {
            const paymentLabel = bill.paymentMethod === 'cash' ? '💵 Cash' : bill.paymentMethod === 'credit' ? '📋 Credit' : '🏦 Bank';
            billsList += `<div class="recent-bill-item"><span class="recent-bill-date">📅 ${bill.date}</span><span class="recent-bill-num">📄 ${bill.billNumber}</span><span class="recent-bill-items">📦 ${bill.itemsCount || 0} items</span><span class="recent-bill-payment ${bill.paymentMethod}">${paymentLabel}</span><span class="recent-bill-total">Rs. ${(bill.billTotal || 0).toLocaleString('en-LK')}</span></div>`;
        });
        recentBillsHtml = `<div class="supplier-detail-section"><h4>🧾 Recent Bills (Last ${recentBills.length})</h4><div class="recent-bills-list">${billsList}</div></div>`;
    }
    if (s.bills.length === 0) { return `<div class="supplier-no-bills"><span class="nb-icon">📭</span>No bills in selected date range.</div>`; }
    return paymentBreakdown + topItemsHtml + recentBillsHtml;
}

function toggleSupplierExpand(supId) {
    const card = document.getElementById('supcard-' + supId);
    if (!card) return;
    if (card.classList.contains('expanded')) { card.classList.remove('expanded'); expandedSupplierId = null; }
    else { document.querySelectorAll('.supplier-card.expanded').forEach(c => c.classList.remove('expanded')); card.classList.add('expanded'); expandedSupplierId = supId; }
}

function resetSAFilters() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    document.getElementById('saFromDate').value = thirtyAgo.toISOString().split('T')[0];
    document.getElementById('saToDate').value = today;
    document.getElementById('saSortBy').value = 'spend';
    loadSupplierAnalysis();
}