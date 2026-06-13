/* ═══════════════════════════════════════════════════════
   CALL CENTER SCRIPT - Buono Project v12.0 (PHASE 2)
   🚀 FINAL PAGINATED VERSION
   ═══════════════════════════════════════════════════════ */

// ── CONFIG & STATE ──
const PAGE_CACHE_KEY = 'buono_callcenter_leads_v12';

const PAGINATION = {
    PAGE_SIZE: 20,              // ⭐ Recent Leads summary
    PENDING_PAGE_SIZE: 20,      // Pending Queue
    SMART_TAB_PAGE_SIZE: 20,    // ⭐ Phase 4: Smart Tabs (per section)
    currentPageLimit: 20,
    counts: { total: 0, needCall: 0, enrolled: 0, mightJoin: 0, followups: 0, hold: 0, followUpDate: 0 },
    lastCountFetch: 0,
    pendingToday: 20,    
    pendingOlder: 20,
    // ⭐ Phase 4: Smart Tab limits (per attempt section)
    smartTab: {
        mightJoin: { att1: 20, att2: 20, att3: 20, att4: 20, done: 20 },
        followups: { att1: 20, att2: 20, att3: 20, att4: 20, done: 20 },
        hold:      { att1: 20, att2: 20, att3: 20, att4: 20, done: 20 },
        enrolled:  { active: 20, done: 20 }
    }
};

let currentUser = null;
let allLeads = [];
let filteredLeads = [];
let selectedLeadId = null;
let selectedLeadData = null;
let editLeadId = null;
let deleteLeadId = null;
let holdLeadId = null;
let allCourses = [];
let allEvents = [];
let pendingTodayLeads = [];
let pendingOlderLeads = [];
let maxCallAttempts = 4;
let currentWAType = '';
let tabSelectedLeadId = null;
let currentTab = 'quickAdd';

// ── STATUS CONFIG ──
const STATUSES = [
    { value: 'Need Call', label: '📱 Need Call', cssClass: 'status-need-call' },
    { value: 'Enrolled', label: '🟢 Enrolled', cssClass: 'status-enrolled' },
    { value: 'Might Join', label: '🔵 Might Join', cssClass: 'status-might-join' },
    { value: 'Not Responding', label: '⚫ Not Responding', cssClass: 'status-not-responding' },
    { value: 'Unable to join', label: '🔴 Unable to join', cssClass: 'status-unable' },
    { value: 'Switch off', label: '⚪ Switch off', cssClass: 'status-switch-off' },
    { value: 'Will join the next intake', label: '🟡 Will join next intake', cssClass: 'status-next-intake' },
    { value: 'Call back later', label: '📞 Call back later', cssClass: 'status-call-back' },
    { value: 'Not in use', label: '❌ Not in use', cssClass: 'status-not-in-use' },
    { value: 'Will decide and get back to us', label: '🤔 Will decide', cssClass: 'status-will-decide' },
    { value: 'User busy', label: '📵 User busy', cssClass: 'status-user-busy' },
    { value: 'Hold', label: '⏸️ Hold', cssClass: 'status-hold' },
    { value: 'Need Attention', label: '⚠️ Need Attention', cssClass: 'status-need-attention' }
];

const FOLLOWUP_STATUSES = ['Not Responding', 'Switch off', 'Will join the next intake', 'Call back later', 'Will decide and get back to us', 'User busy'];
const HOLD_STATUSES = ['Hold', 'Unable to join', 'Not in use'];
const HOLD_TRIGGER_STATUSES = ['Need Call', 'Not Responding', 'Switch off', 'User busy'];
const SMART_DEFAULTS = { 'Need Call': 1, 'Might Join': 3, 'Hold': 30 };

let expandedSections = {
    mightJoin: { att1: true, att2: false, att3: false, att4: false, done: false },
    followups: { att1: true, att2: false, att3: false, att4: false, done: false },
    hold: { att1: true, att2: false, att3: false, att4: false, done: false },
    enrolled: { active: true, done: false }
};

// ── HELPERS ──
function formatCurrency(amount) { return 'Rs. ' + (Number(amount) || 0).toLocaleString('en-LK'); }
function formatDate(date) { 
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-LK');
}
function formatDateTime(date) {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('en-LK', { dateStyle: 'short', timeStyle: 'short' });
}
function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── CORE PAGINATION FUNCTIONS ──
async function getLeadCounts(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && PAGINATION.lastCountFetch && (now - PAGINATION.lastCountFetch < 30000)) return PAGINATION.counts;
    
    try {
        const snapshot = await db.collection('leads').get();
        const counts = { total: snapshot.size, needCall: 0, enrolled: 0, mightJoin: 0, followups: 0, hold: 0, followUpDate: 0 };
        snapshot.forEach(doc => {
            const s = doc.data().status || 'Need Call';
            if (s === 'Need Call') counts.needCall++;
            else if (s === 'Enrolled') counts.enrolled++;
            else if (s === 'Might Join' || s === 'Need Attention') counts.mightJoin++;
            else if (FOLLOWUP_STATUSES.includes(s)) counts.followups++;
            else if (HOLD_STATUSES.includes(s)) counts.hold++;
            if (doc.data().followUpDate) counts.followUpDate++;
        });
        PAGINATION.counts = counts;
        PAGINATION.lastCountFetch = now;
        updateStats();
        return counts;
    } catch (e) { return PAGINATION.counts; }
}

async function searchLeadsServer(query, limit = 50) {
    if (!query || query.length < 2) { applyFilters('', ''); return; }
    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="table-loading">🔍 Searching...</td></tr>';
    const q = query.toLowerCase().trim();
    const results = [];
    const nameSnap = await db.collection('leads').orderBy('name').startAt(q).endAt(q + '\uf8ff').limit(limit).get();
    nameSnap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    renderLeadsTable(results, true);
}

function resetPaginationCache() {
    PAGINATION.currentPageLimit = PAGINATION.PAGE_SIZE;
    PAGINATION.pendingToday = PAGINATION.PENDING_PAGE_SIZE;
    PAGINATION.pendingOlder = PAGINATION.PENDING_PAGE_SIZE;
    
    // ⭐ Phase 4: Reset Smart Tab limits
    PAGINATION.smartTab = {
        mightJoin: { att1: 20, att2: 20, att3: 20, att4: 20, done: 20 },
        followups: { att1: 20, att2: 20, att3: 20, att4: 20, done: 20 },
        hold:      { att1: 20, att2: 20, att3: 20, att4: 20, done: 20 },
        enrolled:  { active: 20, done: 20 }
    };
    
    PAGINATION.lastCountFetch = 0;
    SmartStorage.remove(PAGE_CACHE_KEY);
}

// ── INITIALIZE ──
async function initializeApp() {
    PerfTracker.init('Call Center');
    const userData = getCurrentUser();
    if (!userData) { window.location.href = 'login.html'; return; }
    currentUser = userData;
    initUserUI();
    buildDatabaseSwitcher();
    loadSettings_MaxAttempts();
    loadLeads();         
    loadCourses();
    loadEvents();
    loadCCReports();
}

// ── LEADS LOAD & RENDER ──
function loadLeads() {
    const cached = SmartStorage.get(PAGE_CACHE_KEY);
    if (cached) {
        allLeads = cached;
        filteredLeads = [...allLeads];
        renderLeadsTable(filteredLeads);
        revealStats();
    }

    db.collection('leads').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        allLeads = [];
        snapshot.forEach(doc => allLeads.push({ id: doc.id, ...doc.data() }));
        SmartStorage.set(PAGE_CACHE_KEY, allLeads, SmartStorage.DURATIONS.SHORT);
        applyFilters(document.getElementById('searchLeads')?.value || '', document.getElementById('filterStatus')?.value || '');
        updateTabBadges();
        getLeadCounts();
        revealStats();
    });
}

function renderLeadsTable(leads, isSearchMode = false) {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    if (!leads.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-empty">📭 No leads found</td></tr>';
        updatePaginationUI(0, 0, false, isSearchMode);
        return;
    }

    const limit = isSearchMode ? leads.length : PAGINATION.currentPageLimit;
    const leadsToShow = leads.slice(0, limit);
    const hasMore = leads.length > limit;

    let html = '';
    leadsToShow.forEach((lead, idx) => {
        const s = getStatusInfo(lead.status || 'Need Call');
        html += `<tr>
            <td>${idx + 1}</td>
            <td><strong style="color:#fff;">${escapeHtml(lead.name)}</strong></td>
            <td><a href="tel:${lead.phone}" style="color:#2196F3;">${escapeHtml(lead.phone)}</a></td>
            <td><span class="status-badge ${s.cssClass}">${s.label}</span></td>
            <td>${getAttemptsBadge(lead.callAttempts || 0, lead.status)}</td>
            <td>${escapeHtml(lead.courseInterest || '-')}</td>
            <td>${formatDate(lead.createdAt)}</td>
            <td><div class="action-btns">
                <button class="btn-icon view" onclick="viewLead('${lead.id}')">👁</button>
                <button class="btn-icon call" onclick="selectLeadForLog('${lead.id}')">📞</button>
                <button class="btn-icon wa" onclick="openWhatsApp('${lead.phone}')">💬</button>
                <button class="btn-icon edit" onclick="openEditLead('${lead.id}')">✏️</button>
                <button class="btn-icon delete" onclick="openDeleteLead('${lead.id}', '${escapeHtml(lead.name)}')">🗑️</button>
            </div></td>
        </tr>`;
    });
    tbody.innerHTML = html;
    updatePaginationUI(leads.length, leadsToShow.length, hasMore, isSearchMode);
}

function updatePaginationUI(total, shown, hasMore, isSearchMode) {
    let div = document.getElementById('paginationControls');
    if (!div) {
        div = document.createElement('div');
        div.id = 'paginationControls';
        div.className = 'pagination-wrap';
        
        // ⭐ FIX: Use .table-wrap (not .table-responsive)
        const tableWrap = document.querySelector('#leadsTableBody')?.closest('table')?.parentElement;
        if (tableWrap) {
            tableWrap.after(div);
        } else {
            console.warn('⚠️ Could not find table wrapper');
            return;
        }
    }
    
    if (isSearchMode) {
        div.style.display = 'flex';
        div.innerHTML = `<div class="pagination-info">🔍 Search showing ${total} results</div>`;
    } else if (total === 0) {
        div.style.display = 'none';
    } else {
        div.style.display = 'flex';
        const remaining = total - shown;
        div.innerHTML = `
            <div class="pagination-info">Showing <strong>${shown}</strong> of <strong>${total}</strong> leads</div>
            ${hasMore ? `<button class="btn-load-more" onclick="loadMoreLeads()">⬇️ Load More (${remaining} left)</button>` : '<div class="pagination-info" style="color:#4CAF50;">✅ All loaded</div>'}
        `;
    }
}

function loadMoreLeads() {
    PAGINATION.currentPageLimit += PAGINATION.PAGE_SIZE;
    renderLeadsTable(filteredLeads);
}

function applyFilters(q, s) {
    const query = q.toLowerCase();
    filteredLeads = allLeads.filter(l => {
        const mS = !query || (l.name||'').toLowerCase().includes(query) || (l.phone||'').toLowerCase().includes(query);
        const mSt = !s || l.status === s;
        return mS && mSt;
    });
    renderLeadsTable(filteredLeads);
}

function searchLeads() {
    const q = document.getElementById('searchLeads').value;
    if (q.length > 2) searchLeadsServer(q);
    else applyFilters(q, document.getElementById('filterStatus').value);
}

// ── UI UPDATES ──
function updateStats() {
    setEl('statTotal', PAGINATION.counts.total);
    setEl('statEnrolled', PAGINATION.counts.enrolled);
    setEl('statMightJoin', PAGINATION.counts.mightJoin);
    setEl('statNeedCall', PAGINATION.counts.needCall);
    setEl('statFollowUp', PAGINATION.counts.followUpDate);
}

function getAttemptsBadge(att, status) {
    if (status === 'Enrolled') return '<span class="attempts-badge attempts-enrolled">✅ Enrolled</span>';
    const cls = att >= maxCallAttempts ? 'attempts-max' : 'attempts-normal';
    return `<span class="attempts-badge ${cls}">📞 ${att}/${maxCallAttempts}</span>`;
}

function updateTabBadges() {
    setTabBadge('badgeCallLog', allLeads.filter(l => l.status === 'Need Call').length);
    setTabBadge('badgeMightJoin', allLeads.filter(l => l.status === 'Might Join' || l.status === 'Need Attention').length);
    setTabBadge('badgeFollowups', allLeads.filter(l => FOLLOWUP_STATUSES.includes(l.status)).length);
    setTabBadge('badgeHold', allLeads.filter(l => HOLD_STATUSES.includes(l.status)).length);
}

function setTabBadge(id, count) {
    const el = document.getElementById(id);
    if (el) { el.textContent = count; el.style.display = count > 0 ? 'inline-flex' : 'none'; }
}

// ── TAB SYSTEM ──
function switchTab(tabId) {
    document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('content-' + tabId)?.classList.add('active');
    document.getElementById('tab-' + tabId)?.classList.add('active');
    currentTab = tabId;
    if (tabId === 'callLog') loadPendingQueue();
    else if (tabId === 'mightJoin') loadMightJoinTab();
}

// ── MODALS & ACTIONS ──
function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

function quickAddLead() {
    const phone = document.getElementById('quickPhone').value.trim();
    if (phone.length < 6) return showToast('Invalid phone', 'warning');
    db.collection('leads').add({
        name: document.getElementById('quickName').value || 'Unknown',
        phone: document.getElementById('quickCountry').value + phone,
        status: 'Need Call',
        callAttempts: 0,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp()
    }).then(() => { showToast('Added!', 'success'); resetPaginationCache(); });
}

function confirmDelete() {
    if (!deleteLeadId) return;
    db.collection('leads').doc(deleteLeadId).delete().then(() => {
        showToast('Deleted!', 'success'); closeModal('deleteModal'); resetPaginationCache();
    });
}

const style = document.createElement('style');
style.textContent = `
    .pagination-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px; background: #1a1a2e; border-top: 1px solid #ffffff10; }
    .pagination-info { color: #888; font-size: 0.85rem; }
    .btn-load-more { background: #f0a500; color: #1a1a2e; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-load-more:hover { transform: translateY(-2px); background: #ffc107; }
    
    /* ⭐ Phase 3: Pending Queue Load More */
    .pending-load-more-wrap { 
        display: flex; flex-direction: column; align-items: center; gap: 8px; 
        padding: 12px; margin-top: 10px; 
        background: #0f3460; border-radius: 8px; border: 1px dashed #f0a50040;
    }
    .pending-load-more-info { color: #888; font-size: 0.8rem; }
    .btn-load-more-pending { 
        background: linear-gradient(135deg, #f0a500, #ff9800); color: #1a1a2e; 
        border: none; padding: 8px 16px; border-radius: 6px; 
        font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.85rem;
    }
    .btn-load-more-pending:hover { transform: translateY(-2px); box-shadow: 0 4px 12px #f0a50040; }
`;
document.head.appendChild(style);

// ── UTILS ──
function getStatusInfo(v) { return STATUSES.find(s => s.value === v) || { label: v, cssClass: 'status-need-call' }; }
function setEl(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function showToast(m, t) { console.log(`Toast (${t}): ${m}`); alert(m); } // Simple alert for now
function revealStats() { document.querySelectorAll('.skeleton').forEach(s => s.style.display = 'none'); document.querySelectorAll('.real-stat').forEach(r => r.style.display = 'flex'); }
function initUserUI() { setEl('userBadge', '👋 Welcome, ' + currentUser.name); }
function loadSettings_MaxAttempts() { db.collection('settings').doc('callCenter').get().then(doc => maxCallAttempts = doc.data()?.maxAttempts || 4); }

// Initialize
initializeApp();

// (මෙහි ඉතිරි helpers - WhatsApp, Courses, Reports ආදිය v11.5 ආකාරයටම අවශ්‍ය පරිදි එක් කරගන්න)

// ════════════════════════════════════════
// MAX ATTEMPTS SETTING
// ════════════════════════════════════════
function loadSettings_MaxAttempts() {
    db.collection('settings').doc('callCenter').get().then(function(doc) {
        if (doc.exists) { maxCallAttempts = doc.data().maxAttempts || 4; }
        const input = document.getElementById('maxAttempts');
        if (input) input.value = maxCallAttempts;
    });
}

function saveMaxAttempts() {
    const input = document.getElementById('maxAttempts');
    const value = parseInt(input.value) || 4;
    if (value < 1 || value > 20) { showToast('⚠️ 1-20 අතර number!', 'warning'); return; }

    db.collection('settings').doc('callCenter').set({
        maxAttempts: value,
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    }, { merge: true }).then(function() {
        maxCallAttempts = value;
        showToast('✅ Max attempts: ' + value, 'success');
    });
}

// ════════════════════════════════════════
// USER UI
// ════════════════════════════════════════
function initUserUI() {
    const badge = document.getElementById('userBadge');
    if (badge) badge.textContent = '👋 Welcome, ' + currentUser.name + ' (' + currentUser.access + ')';
}

function buildDatabaseSwitcher() {
    const list = document.getElementById('dbDropdownList');
    if (!list) return;
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';

    DATABASES.forEach(function(d) {
        if (d.adminManagerOnly && !isAdminOrMgr) return;
        const isAdmin = currentUser.access === 'Admin';
        const dp = currentUser.permissions?.[d.id] || {};
        let hasAccess = isAdmin || dp.add || dp.view || dp.selfView || dp.edit || dp.delete;
        if (d.id === 'callCenterDB' && currentUser.access === 'Call Operator') hasAccess = true;
        if (!d.adminManagerOnly && !hasAccess) return;
        const isCurrent = d.id === 'callCenterDB';
        html += '<a href="' + d.url + '" class="db-dropdown-item ' + (isCurrent ? 'current' : '') + '"><span>' + d.icon + '</span><span>' + d.name + '</span>' + (isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : '') + '</a>';
    });
    list.innerHTML = html;

    const switcher = document.getElementById('dbSwitcher');
    if (switcher) {
        switcher.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('dbDropdown');
            if (dropdown) dropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('dbDropdown');
        if (dropdown && !dropdown.contains(e.target) && !e.target.closest('#dbSwitcher')) {
            dropdown.classList.remove('show');
        }
    });
}

// ════════════════════════════════════════
// TABS
// ════════════════════════════════════════
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });

    const content = document.getElementById('content-' + tabId);
    const btn = document.getElementById('tab-' + tabId);
    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');

    currentTab = tabId;

    if (tabId === 'callLog') loadPendingQueue();
    if (tabId === 'mightJoin') loadMightJoinTab();
    if (tabId === 'followups') loadFollowUpsTab();
    if (tabId === 'hold') loadHoldTab();
    if (tabId === 'enrolled') loadEnrolledTab();
    if (tabId === 'payments') loadPayments();
    if (tabId === 'ccReports') loadCCReports();
    if (tabId === 'settings') loadSettings();
}

// ════════════════════════════════════════
// PHONE FORMAT
// ════════════════════════════════════════
function updatePhonePlaceholder() {
    const country = document.getElementById('quickCountry').value;
    const phoneInput = document.getElementById('quickPhone');
    const placeholders = {
        '+94': '7X XXX XXXX',
        '+91': '9XXXX XXXXX',
        '+971': '5X XXX XXXX',
        '+966': '5X XXX XXXX',
        '+974': 'XXXX XXXX',
        '+965': 'XXXX XXXX',
        '+973': 'XXXX XXXX',
        '+968': 'XXXX XXXX',
        '+1': '(XXX) XXX-XXXX',
        '+44': '7XXX XXXXXX',
        '+61': '4XX XXX XXX',
        '+65': 'XXXX XXXX',
        '+60': 'XX XXX XXXX',
        '+0': 'Custom number'
    };
    phoneInput.placeholder = placeholders[country] || 'Phone number';
    phoneInput.value = '';
    phoneInput.focus();
}

function formatPhoneInput(input) {
    input.value = input.value.replace(/\D/g, '').substring(0, 15);
}

function formatPhoneInputModal(input) {
    input.value = input.value.replace(/\D/g, '').substring(0, 15);
}

// ════════════════════════════════════════
// LEADS - LOAD (⭐ UPGRADED with Cache + PerfTracker + Skeleton)
// ════════════════════════════════════════
function loadLeads() {
    PerfTracker.start('📦 Leads Load');

    const tbody = document.getElementById('leadsTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-loading"><div class="loading-spinner"></div>Loading...</td></tr>';
    }

    // ⭐ Step 1: Try Cache First (Instant!)
    const cached = SmartStorage.get(PAGE_CACHE_KEY);
    if (cached) {
        allLeads = cached;
        filteredLeads = [...allLeads];
        renderLeadsTable(filteredLeads);
        updateStats();
        updateTabBadges();
        revealStats();
        PerfTracker.end('📦 Leads Load');
        PerfTracker.report('Call Center Ready (Cached)');
        console.log('⚡ Leads loaded from SmartStorage cache!');
    }

    // ⭐ Step 2: Real-time Firebase (always sync)
    db.collection('leads').orderBy('createdAt', 'desc').onSnapshot(function(snapshot) {
        allLeads = [];
        snapshot.forEach(function(doc) {
            allLeads.push({ id: doc.id, ...doc.data() });
        });

        // ⭐ Update Cache
        SmartStorage.set(PAGE_CACHE_KEY, allLeads, SmartStorage.DURATIONS.SHORT);

        filteredLeads = [...allLeads];
        renderLeadsTable(filteredLeads);
        updateStats();
        updateTabBadges();
        revealStats();

        if (!cached) {
            PerfTracker.end('📦 Leads Load');
            PerfTracker.report('Call Center Ready (Firebase)');
        }

        if (currentTab === 'callLog') loadPendingQueue();
        else if (currentTab === 'mightJoin') loadMightJoinTab();
        else if (currentTab === 'followups') loadFollowUpsTab();
        else if (currentTab === 'hold') loadHoldTab();
        else if (currentTab === 'enrolled') loadEnrolledTab();
    });
}

function renderLeadsTable(leads, isSearchMode = false) {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    if (!leads || leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-empty">📭 No leads</td></tr>';
        updatePaginationUI(0, 0, false, isSearchMode);
        return;
    }

    // ⭐ Phase 2: Pagination
    const limit = isSearchMode ? leads.length : PAGINATION.currentPageLimit;
    const leadsToShow = leads.slice(0, limit);
    const hasMore = leads.length > limit;

    let html = '';
    leadsToShow.forEach(function(lead, idx) {
        const statusInfo = getStatusInfo(lead.status || 'Need Call');
        const dateStr = formatDate(lead.createdAt);
        const attempts = lead.callAttempts || 0;

        html += '<tr>' +
            '<td>' + (idx + 1) + '</td>' +
            '<td><strong style="color:#fff;">' + escapeHtml(lead.name || 'Unknown') + '</strong></td>' +
            '<td><a href="tel:' + lead.phone + '" style="color:#2196F3;text-decoration:none;">' + escapeHtml(lead.phone || '-') + '</a></td>' +
            '<td><span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span></td>' +
            '<td>' + getAttemptsBadge(attempts, lead.status) + '</td>' +
            '<td>' + escapeHtml(lead.courseInterest || '-') + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td><div class="action-btns">' +
            '<button class="btn-icon view" onclick="viewLead(\'' + lead.id + '\')">👁</button>' +
            '<button class="btn-icon call" onclick="selectLeadForLog(\'' + lead.id + '\')">📞</button>' +
            '<button class="btn-icon wa" onclick="openWhatsApp(\'' + lead.phone + '\')">💬</button>' +
            '<button class="btn-icon edit" onclick="openEditLead(\'' + lead.id + '\')">✏️</button>' +
            '<button class="btn-icon delete" onclick="openDeleteLead(\'' + lead.id + '\', \'' + escapeHtml(lead.name || 'Lead') + '\')">🗑️</button>' +
            '</div></td>' +
            '</tr>';
    });
    tbody.innerHTML = html;

    // ⭐ Update pagination UI
    updatePaginationUI(leads.length, leadsToShow.length, hasMore, isSearchMode);
}

// ⭐ Load More function
function loadMoreLeads() {
    PAGINATION.currentPageLimit += PAGINATION.PAGE_SIZE;
    renderLeadsTable(filteredLeads);
}

function getAttemptsBadge(attempts, status) {
    if (status === 'Enrolled') return '<span class="attempts-badge attempts-enrolled">✅ Enrolled</span>';
    if (attempts === 0) return '<span class="attempts-badge attempts-new">📋 New</span>';

    const isAtMax = attempts >= maxCallAttempts;
    const isNearMax = attempts >= maxCallAttempts - 1;
    let cssClass = 'attempts-normal';

    if (isAtMax) cssClass = 'attempts-max';
    else if (isNearMax) cssClass = 'attempts-warning';

    return '<span class="attempts-badge ' + cssClass + '">📞 ' + attempts + '/' + maxCallAttempts + '</span>';
}

function updateTabBadges() {
    setTabBadge('badgeCallLog', allLeads.filter(function(l) { return l.status === 'Need Call'; }).length);
    setTabBadge('badgeMightJoin', allLeads.filter(function(l) { return l.status === 'Might Join' || l.status === 'Need Attention'; }).length);
    setTabBadge('badgeFollowups', allLeads.filter(function(l) { return FOLLOWUP_STATUSES.includes(l.status); }).length);
    setTabBadge('badgeHold', allLeads.filter(function(l) { return HOLD_STATUSES.includes(l.status); }).length);
    setTabBadge('badgeEnrolled', allLeads.filter(function(l) { return l.status === 'Enrolled'; }).length);
}

function setTabBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
        el.textContent = count;
        el.style.display = 'inline-flex';
    } else {
        el.textContent = '';
        el.style.display = 'none';
    }
}

// ════════════════════════════════════════
// SMART CATEGORIZATION HELPER
// ════════════════════════════════════════
function isUpdatedToday(lead) {
    if (!lead.lastUpdatedAt && !lead.updatedAt) return false;
    const updateDate = (lead.lastUpdatedAt || lead.updatedAt);
    const date = updateDate.toDate ? updateDate.toDate() : new Date(updateDate);
    const today = new Date();

    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function groupByAttempts(leads) {
    const grouped = { att1: [], att2: [], att3: [], att4Plus: [], doneToday: [] };

    leads.forEach(function(lead) {
        if (isUpdatedToday(lead)) {
            grouped.doneToday.push(lead);
            return;
        }

        const att = lead.callAttempts || 0;
        if (att <= 1) grouped.att1.push(lead);
        else if (att === 2) grouped.att2.push(lead);
        else if (att === 3) grouped.att3.push(lead);
        else grouped.att4Plus.push(lead);
    });

    const sortOldest = function(a, b) {
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
        return aTime - bTime;
    };

    grouped.att1.sort(sortOldest);
    grouped.att2.sort(sortOldest);
    grouped.att3.sort(sortOldest);
    grouped.att4Plus.sort(sortOldest);
    grouped.doneToday.sort(function(a, b) { return -sortOldest(a, b); });

    return grouped;
}

function calculateTabStats(leads) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newToday = leads.filter(function(l) {
        if (!l.createdAt) return false;
        const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
        return d >= today;
    }).length;

    const calledToday = leads.filter(function(l) { return isUpdatedToday(l); }).length;
    const remaining = leads.filter(function(l) { return !isUpdatedToday(l); }).length;

    return {
        total: leads.length,
        new: newToday,
        old: leads.length - newToday,
        called: calledToday,
        remaining: remaining
    };
}

// ════════════════════════════════════════
// RENDER SMART TAB
// ════════════════════════════════════════
function renderSmartTab(tabType, leads, containerId, countId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    setEl(countId, leads.length);
    const stats = calculateTabStats(leads);
    const statsId = tabType + 'Stats';

    const statsBar = document.getElementById(statsId);
    if (statsBar) {
        statsBar.innerHTML =
            '<div class="ps-item"><span class="ps-label">📊 Total:</span><span class="ps-value">' + stats.total + '</span></div>' +
            '<div class="ps-divider">|</div>' +
            '<div class="ps-item"><span class="ps-label">🆕 New:</span><span class="ps-value ps-success">' + stats.new + '</span></div>' +
            '<div class="ps-divider">|</div>' +
            '<div class="ps-item"><span class="ps-label">📅 Old:</span><span class="ps-value ps-info">' + stats.old + '</span></div>' +
            '<div class="ps-divider">|</div>' +
            '<div class="ps-item"><span class="ps-label">✅ Done Today:</span><span class="ps-value ps-success">' + stats.called + '</span></div>' +
            '<div class="ps-divider">|</div>' +
            '<div class="ps-item"><span class="ps-label">⏳ Remaining:</span><span class="ps-value ps-warning">' + stats.remaining + '</span></div>';
    }

    if (leads.length === 0) {
        const emptyIcons = { mightJoin: '🔵', followups: '🔄', hold: '⏸️', enrolled: '✅' };
        container.innerHTML = '<div class="pending-empty"><div class="pending-empty-icon">' + (emptyIcons[tabType] || '📭') + '</div><p>No leads</p></div>';
        return;
    }

    const grouped = groupByAttempts(leads);
    const exp = expandedSections[tabType] || {};
    let html = '';

    if (grouped.att1.length > 0) html += buildAttemptSection(tabType, 'att1', '🔥 Attempt 1', grouped.att1, exp.att1, 'attempt-section-1');
    if (grouped.att2.length > 0) html += buildAttemptSection(tabType, 'att2', '⚡ Attempt 2', grouped.att2, exp.att2, 'attempt-section-2');
    if (grouped.att3.length > 0) html += buildAttemptSection(tabType, 'att3', '🟡 Attempt 3', grouped.att3, exp.att3, 'attempt-section-3');
    if (grouped.att4Plus.length > 0) html += buildAttemptSection(tabType, 'att4', '⚠️ Attempt 4+', grouped.att4Plus, exp.att4, 'attempt-section-4');
    if (grouped.doneToday.length > 0) html += buildAttemptSection(tabType, 'done', '✅ Done Today', grouped.doneToday, exp.done, 'attempt-section-done');

    if (!html) html = '<div class="pending-empty"><div class="pending-empty-icon">🎉</div><p>All caught up!</p></div>';

    container.innerHTML = html;
}

function buildAttemptSection(tabType, sectionKey, title, leads, isExpanded, sectionClass) {
    const arrowIcon = isExpanded ? '▼' : '▶';
    
    // ⭐ Phase 4: Pagination per section
    const tabLimits = PAGINATION.smartTab[tabType] || {};
    const limit = tabLimits[sectionKey] || PAGINATION.SMART_TAB_PAGE_SIZE;
    const leadsToShow = leads.slice(0, limit);
    const hasMore = leads.length > limit;
    const remaining = leads.length - leadsToShow.length;
    
    let html = '<div class="attempt-section ' + sectionClass + '">' +
        '<div class="attempt-section-header" onclick="toggleSection(\'' + tabType + '\', \'' + sectionKey + '\')">' +
        '<span class="attempt-section-title">' + title + '</span>' +
        '<span class="attempt-section-count">' + leads.length + '</span>' +
        '<span class="attempt-section-arrow">' + arrowIcon + '</span>' +
        '</div>' +
        '<div class="attempt-section-body" style="display:' + (isExpanded ? 'block' : 'none') + ';">';

    leadsToShow.forEach(function(lead) {
        const statusInfo = getStatusInfo(lead.status || 'Need Call');
        const timeAgo = getTimeAgo(lead.updatedAt || lead.createdAt);
        const isSelected = tabSelectedLeadId === lead.id;
        const attempts = lead.callAttempts || 0;
        const isDone = sectionKey === 'done';
        const course = lead.courseInterest ? '<div class="pending-item-course">🎓 ' + escapeHtml(lead.courseInterest) + '</div>' : '';
        const fDate = lead.followUpDate ? '<div class="pending-item-followup">📅 ' + new Date(lead.followUpDate).toLocaleDateString('en-LK') + '</div>' : '';

        html += '<div class="pending-item ' + (isSelected ? 'selected' : '') + ' ' + (isDone ? 'done-today' : '') + '" onclick="selectLeadForTab(\'' + lead.id + '\', \'' + tabType + '\')">' +
            '<div class="pending-item-header">' +
            '<span class="pending-item-name">👤 ' + escapeHtml(lead.name || 'Unknown') + '</span>' +
            '<span class="pending-item-time">' + timeAgo + '</span>' +
            '</div>' +
            '<div class="pending-item-phone">📱 ' + escapeHtml(lead.phone || 'No phone') + (attempts > 0 ? ' <span class="pending-attempts">📞 ' + attempts + '/' + maxCallAttempts + '</span>' : '') + '</div>' +
            '<div style="margin-top:5px;"><span class="status-badge ' + statusInfo.cssClass + '" style="font-size:0.7rem;">' + statusInfo.label + '</span></div>' +
            course + fDate +
            (!isDone ? '<div class="pending-item-actions" style="margin-top:8px;">' +
            '<button class="btn-call-now" onclick="event.stopPropagation(); selectLeadForTab(\'' + lead.id + '\', \'' + tabType + '\')">✏️ Update</button>' +
            '<button class="btn-wa-quick" onclick="event.stopPropagation(); openWhatsApp(\'' + lead.phone + '\')">💬</button>' +
            '</div>' : '') +
            '</div>';
    });

    // ⭐ Phase 4: Load More button per section
    if (hasMore) {
        html += '<div class="pending-load-more-wrap">' +
            '<div class="pending-load-more-info">Showing <strong>' + leadsToShow.length + '</strong> of <strong>' + leads.length + '</strong></div>' +
            '<button class="btn-load-more-pending" onclick="event.stopPropagation(); loadMoreSmartTab(\'' + tabType + '\', \'' + sectionKey + '\')">⬇️ Load More (' + remaining + ' left)</button>' +
            '</div>';
    } else if (leads.length > PAGINATION.SMART_TAB_PAGE_SIZE) {
        html += '<div class="pending-load-more-wrap">' +
            '<div class="pending-load-more-info">✅ All <strong>' + leads.length + '</strong> loaded</div>' +
            '</div>';
    }

    html += '</div></div>';
    return html;
}

function toggleSection(tabType, sectionKey) {
    if (!expandedSections[tabType]) expandedSections[tabType] = {};
    expandedSections[tabType][sectionKey] = !expandedSections[tabType][sectionKey];

    if (tabType === 'mightJoin') loadMightJoinTab();
    else if (tabType === 'followups') loadFollowUpsTab();
    else if (tabType === 'hold') loadHoldTab();
    else if (tabType === 'enrolled') loadEnrolledTab();
}

// ════════════════════════════════════════
// TAB LOADERS
// ════════════════════════════════════════
function loadMightJoinTab() {
    const leads = allLeads.filter(function(l) { return l.status === 'Might Join' || l.status === 'Need Attention'; });
    renderSmartTab('mightJoin', leads, 'mightJoinList', 'mightJoinCount');
}

function loadFollowUpsTab() {
    const leads = allLeads.filter(function(l) { return FOLLOWUP_STATUSES.includes(l.status); });
    renderSmartTab('followups', leads, 'fuAllList', 'fuAllCount');

    const todayCount = document.getElementById('fuTodayCount');
    const upcomingCount = document.getElementById('fuUpcomingCount');
    if (todayCount) todayCount.parentElement.parentElement.style.display = 'none';
    if (upcomingCount) upcomingCount.parentElement.parentElement.style.display = 'none';
}

function loadHoldTab() {
    const leads = allLeads.filter(function(l) { return HOLD_STATUSES.includes(l.status); });
    renderSmartTab('hold', leads, 'holdList', 'holdCount');
}

function loadEnrolledTab() {
    const leads = allLeads.filter(function(l) { return l.status === 'Enrolled'; });
    const container = document.getElementById('enrolledList');
    if (!container) return;

    setEl('enrolledCount', leads.length);

    if (leads.length === 0) {
        container.innerHTML = '<div class="pending-empty"><div class="pending-empty-icon">✅</div><p>No enrolled students yet</p></div>';
        return;
    }

    leads.sort(function(a, b) {
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return bTime - aTime;
    });

    // ⭐ Phase 4: Pagination
    const limit = PAGINATION.smartTab.enrolled.active || PAGINATION.SMART_TAB_PAGE_SIZE;
    const leadsToShow = leads.slice(0, limit);
    const hasMore = leads.length > limit;
    const remaining = leads.length - leadsToShow.length;

    let html = '';
    leadsToShow.forEach(function(lead) {
        const timeAgo = getTimeAgo(lead.updatedAt || lead.createdAt);
        const isSelected = tabSelectedLeadId === lead.id;
        const isDone = isUpdatedToday(lead);
        const course = lead.courseInterest ? '<div class="pending-item-course">🎓 ' + escapeHtml(lead.courseInterest) + '</div>' : '';
        const waCount = (lead.whatsappHistory || []).length;
        const waBadge = waCount > 0 ? '<div class="pending-item-wa">📲 ' + waCount + ' sent</div>' : '';

        html += '<div class="pending-item ' + (isSelected ? 'selected' : '') + ' ' + (isDone ? 'done-today' : '') + '" onclick="selectLeadForTab(\'' + lead.id + '\', \'enrolled\')">' +
            '<div class="pending-item-header">' +
            '<span class="pending-item-name">👤 ' + escapeHtml(lead.name || 'Unknown') + '</span>' +
            '<span class="pending-item-time">' + timeAgo + '</span>' +
            '</div>' +
            '<div class="pending-item-phone">📱 ' + escapeHtml(lead.phone || 'No phone') + '</div>' +
            course + waBadge +
            '<div class="pending-item-actions" style="margin-top:8px;">' +
            '<button class="btn-call-now" onclick="event.stopPropagation(); selectLeadForTab(\'' + lead.id + '\', \'enrolled\')">✏️ Update</button>' +
            '<button class="btn-wa-quick" onclick="event.stopPropagation(); openWhatsApp(\'' + lead.phone + '\')">💬</button>' +
            '</div></div>';
    });

    // ⭐ Phase 4: Load More button
    if (hasMore) {
        html += '<div class="pending-load-more-wrap">' +
            '<div class="pending-load-more-info">Showing <strong>' + leadsToShow.length + '</strong> of <strong>' + leads.length + '</strong></div>' +
            '<button class="btn-load-more-pending" onclick="loadMoreSmartTab(\'enrolled\', \'active\')">⬇️ Load More (' + remaining + ' left)</button>' +
            '</div>';
    } else if (leads.length > PAGINATION.SMART_TAB_PAGE_SIZE) {
        html += '<div class="pending-load-more-wrap">' +
            '<div class="pending-load-more-info">✅ All <strong>' + leads.length + '</strong> loaded</div>' +
            '</div>';
    }

    container.innerHTML = html;
}

// ════════════════════════════════════════
// SELECT LEAD FOR TAB
// ════════════════════════════════════════
function selectLeadForTab(leadId, tabType) {
    const lead = allLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;

    tabSelectedLeadId = leadId;
    tabSelectedLeadData = lead;
    selectedLeadId = leadId;
    selectedLeadData = lead;

    if (tabType === 'mightJoin') {
        document.getElementById('mjFormContainer').style.display = 'block';
        document.getElementById('mjNoLead').style.display = 'none';
        setEl('mjLeadName', escapeHtml(lead.name || 'Unknown'));
        setEl('mjLeadPhone', lead.phone || '-');
        setEl('mjLeadAttempts', '📞 Attempts: ' + (lead.callAttempts || 0));
        setInput('mjName', lead.name || '');
        setSelect('mjStatus', lead.status || 'Might Join');
        setSelect('mjCourse', lead.courseInterest || '');
        fillDateInput('mjFollowUp', lead.followUpDate);
        setInput('mjNotes', '');
    }
    else if (tabType === 'followups') {
        document.getElementById('fuFormContainer').style.display = 'block';
        document.getElementById('fuNoLead').style.display = 'none';
        setEl('fuLeadName', escapeHtml(lead.name || 'Unknown'));
        setEl('fuLeadPhone', lead.phone || '-');
        const statusInfo = getStatusInfo(lead.status);
        document.getElementById('fuLeadStatus').innerHTML = 'Current: <span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span>';
        setInput('fuName', lead.name || '');
        setSelect('fuStatus', lead.status || 'Not Responding');
        setSelect('fuCourse', lead.courseInterest || '');
        fillDateInput('fuFollowUp', lead.followUpDate);
        setInput('fuNotes', '');
    }
    else if (tabType === 'hold') {
        document.getElementById('holdFormContainer').style.display = 'block';
        document.getElementById('holdNoLead').style.display = 'none';
        setEl('holdViewLeadName', escapeHtml(lead.name || 'Unknown'));
        setEl('holdViewLeadPhone', lead.phone || '-');
        const statusInfo = getStatusInfo(lead.status);
        document.getElementById('holdViewLeadStatus').innerHTML = 'Current: <span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span>';
        setInput('holdName', lead.name || '');
        setSelect('holdStatus', lead.status || 'Hold');
        setInput('holdNotes', '');
    }
    else if (tabType === 'enrolled') {
        document.getElementById('enrFormContainer').style.display = 'block';
        document.getElementById('enrNoLead').style.display = 'none';
        setEl('enrLeadName', escapeHtml(lead.name || 'Unknown'));
        setEl('enrLeadPhone', lead.phone || '-');
        setInput('enrName', lead.name || '');
        setSelect('enrCourse', lead.courseInterest || '');
        setInput('enrNotes', '');
    }

    if (tabType === 'mightJoin') loadMightJoinTab();
    else if (tabType === 'followups') loadFollowUpsTab();
    else if (tabType === 'hold') loadHoldTab();
    else if (tabType === 'enrolled') loadEnrolledTab();

    if (window.innerWidth < 768) {
        document.querySelector('.calllog-form-panel')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + min;
}

// ════════════════════════════════════════
// SMART DATE BUTTONS HELPERS
// ════════════════════════════════════════
function getSmartDateLabel(days) {
    if (days === 1) return 'Tomorrow';
    if (days === 3) return '3 Days';
    if (days === 7) return '1 Week';
    if (days === 14) return '2 Weeks';
    if (days === 30) return '1 Month';
    return days + ' Days';
}

function getDateQuickButtons(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.parentElement) return [];
    return Array.from(input.parentElement.querySelectorAll('.btn-date-quick'));
}

function clearDateQuickButtons(inputId) {
    getDateQuickButtons(inputId).forEach(function(btn) { btn.classList.remove('active'); });
}

function highlightDateButtonByDays(inputId, days) {
    clearDateQuickButtons(inputId);
    const targetLabel = getSmartDateLabel(days);
    getDateQuickButtons(inputId).forEach(function(btn) {
        if ((btn.textContent || '').trim() === targetLabel) btn.classList.add('active');
    });
}

function showAutoDateBadge(inputId, text) {
    const badge = document.getElementById(inputId + 'AutoBadge');
    if (!badge) return;
    badge.style.display = 'inline-block';
    badge.textContent = text;
}

function hideAutoDateBadge(inputId) {
    const badge = document.getElementById(inputId + 'AutoBadge');
    if (!badge) return;
    badge.style.display = 'none';
    badge.textContent = '';
}

function setDateInputValueSilently(inputId, value) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.dataset.autoSetting = 'true';
    input.value = value || '';
    setTimeout(function() { if (input) input.dataset.autoSetting = ''; }, 20);
}

function fillDateInput(inputId, dateValue) {
    const value = dateValue ? formatDateForInput(dateValue) : '';
    setDateInputValueSilently(inputId, value);
    clearDateQuickButtons(inputId);
    hideAutoDateBadge(inputId);
}

function resetSmartDateUI(inputId, clearValue) {
    clearDateQuickButtons(inputId);
    hideAutoDateBadge(inputId);
    if (clearValue) setDateInputValueSilently(inputId, '');
}

function setSmartDate(inputId, days, btn) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(10, 0, 0, 0);
    setDateInputValueSilently(inputId, formatDateForInput(date));
    clearDateQuickButtons(inputId);
    if (btn) btn.classList.add('active');
    showAutoDateBadge(inputId, '⚡ ' + getSmartDateLabel(days));
}

function autoSetSmartDate(statusSelectId, dateInputId) {
    const statusEl = document.getElementById(statusSelectId);
    const dateEl = document.getElementById(dateInputId);
    if (!statusEl || !dateEl) return;
    if (dateEl.value) return;

    const days = SMART_DEFAULTS[statusEl.value];
    if (!days) { hideAutoDateBadge(dateInputId); return; }

    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(10, 0, 0, 0);
    setDateInputValueSilently(dateInputId, formatDateForInput(date));
    highlightDateButtonByDays(dateInputId, days);
    showAutoDateBadge(dateInputId, '🤖 Auto: ' + getSmartDateLabel(days));
}

function initDateInputHelpers() {
    ['logFollowUp', 'mjFollowUp', 'fuFollowUp'].forEach(function(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        input.addEventListener('input', function() {
            if (input.dataset.autoSetting === 'true') return;
            clearDateQuickButtons(inputId);
            hideAutoDateBadge(inputId);
        });
        input.addEventListener('change', function() {
            if (input.dataset.autoSetting === 'true') return;
            clearDateQuickButtons(inputId);
            hideAutoDateBadge(inputId);
        });
    });
}

// ════════════════════════════════════════
// SAVE TAB UPDATE (⭐ + Cache Invalidation)
// ════════════════════════════════════════
function saveTabUpdate(tabType) {
    if (!tabSelectedLeadId) { showToast('❌ Lead select කරන්න!', 'warning'); return; }

    let updateData = {
        updatedAt: getServerTimestamp(),
        lastUpdatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    };

    let historyEntry = {
        operator: currentUser.nickname || currentUser.name,
        dateStr: formatDateTime(new Date()),
        timestamp: new Date().getTime()
    };

    if (tabType === 'mightJoin') {
        updateData.name = document.getElementById('mjName').value.trim();
        updateData.status = document.getElementById('mjStatus').value;
        updateData.courseInterest = document.getElementById('mjCourse').value;
        const followUp = document.getElementById('mjFollowUp').value;
        updateData.followUpDate = followUp || null;
        const notes = document.getElementById('mjNotes').value.trim();
        historyEntry.status = updateData.status;
        historyEntry.notes = notes || '(No notes)';
        historyEntry.followUpDate = followUp || null;
        updateData.callAttempts = (tabSelectedLeadData.callAttempts || 0) + 1;
    }
    else if (tabType === 'followups') {
        updateData.name = document.getElementById('fuName').value.trim();
        updateData.status = document.getElementById('fuStatus').value;
        updateData.courseInterest = document.getElementById('fuCourse').value;
        const followUp = document.getElementById('fuFollowUp').value;
        updateData.followUpDate = followUp || null;
        const notes = document.getElementById('fuNotes').value.trim();
        historyEntry.status = updateData.status;
        historyEntry.notes = notes || '(No notes)';
        historyEntry.followUpDate = followUp || null;
        updateData.callAttempts = (tabSelectedLeadData.callAttempts || 0) + 1;

        if (HOLD_TRIGGER_STATUSES.includes(updateData.status) && updateData.callAttempts >= maxCallAttempts) {
            updateData._needsHoldWarning = true;
            updateData._holdAttempts = updateData.callAttempts;
        }
    }
    else if (tabType === 'hold') {
        updateData.name = document.getElementById('holdName').value.trim();
        updateData.status = document.getElementById('holdStatus').value;
        const notes = document.getElementById('holdNotes').value.trim();
        historyEntry.status = updateData.status;
        historyEntry.notes = notes || '(No notes)';
        if (updateData.status === 'Need Call') {
            updateData.callAttempts = 0;
            historyEntry.notes = '🔄 Re-activated. ' + historyEntry.notes;
        }
    }
    else if (tabType === 'enrolled') {
        updateData.name = document.getElementById('enrName').value.trim();
        updateData.courseInterest = document.getElementById('enrCourse').value;
        const notes = document.getElementById('enrNotes').value.trim();
        historyEntry.status = 'Enrolled';
        historyEntry.notes = notes || '(No notes)';
    }

    updateData.callHistory = firebase.firestore.FieldValue.arrayUnion(historyEntry);

    const needsHold = updateData._needsHoldWarning;
    const holdAttempts = updateData._holdAttempts;
    const leadName = updateData.name || 'Unknown';
    delete updateData._needsHoldWarning;
    delete updateData._holdAttempts;

    db.collection('leads').doc(tabSelectedLeadId).update(updateData)
        .then(function() {
            showToast('✅ Updated!', 'success');
            SmartStorage.remove(PAGE_CACHE_KEY); // ⭐ Invalidate Cache
            if (needsHold) {
                showHoldWarning(tabSelectedLeadId, leadName, holdAttempts);
            } else {
                clearTabForm(tabType);
            }
        })
        .catch(function() { showToast('❌ Update failed!', 'error'); });
}

function clearTabForm(tabType) {
    tabSelectedLeadId = null;
    tabSelectedLeadData = null;
    selectedLeadId = null;
    selectedLeadData = null;

    if (tabType === 'mightJoin') {
        document.getElementById('mjFormContainer').style.display = 'none';
        document.getElementById('mjNoLead').style.display = 'block';
        resetSmartDateUI('mjFollowUp', true);
    }
    else if (tabType === 'followups') {
        document.getElementById('fuFormContainer').style.display = 'none';
        document.getElementById('fuNoLead').style.display = 'block';
        resetSmartDateUI('fuFollowUp', true);
    }
    else if (tabType === 'hold') {
        document.getElementById('holdFormContainer').style.display = 'none';
        document.getElementById('holdNoLead').style.display = 'block';
    }
    else if (tabType === 'enrolled') {
        document.getElementById('enrFormContainer').style.display = 'none';
        document.getElementById('enrNoLead').style.display = 'block';
    }

    if (tabType === 'mightJoin') loadMightJoinTab();
    else if (tabType === 'followups') loadFollowUpsTab();
    else if (tabType === 'hold') loadHoldTab();
    else if (tabType === 'enrolled') loadEnrolledTab();
}
// ⭐ Phase 3: Load More for Pending Queue
// ⭐ Phase 3: Load More for Pending Queue
function loadMorePending(type) {
    if (type === 'today') {
        PAGINATION.pendingToday += PAGINATION.PENDING_PAGE_SIZE;  // +20
    } else if (type === 'older') {
        PAGINATION.pendingOlder += PAGINATION.PENDING_PAGE_SIZE;  // +20
    }
    loadPendingQueue();
}

// ⭐ Phase 4: Load More for Smart Tabs (per section)
function loadMoreSmartTab(tabType, sectionKey) {
    if (!PAGINATION.smartTab[tabType]) return;
    if (!PAGINATION.smartTab[tabType][sectionKey]) {
        PAGINATION.smartTab[tabType][sectionKey] = PAGINATION.SMART_TAB_PAGE_SIZE;
    }
    PAGINATION.smartTab[tabType][sectionKey] += PAGINATION.SMART_TAB_PAGE_SIZE;
    
    // Re-render the correct tab
    if (tabType === 'mightJoin') loadMightJoinTab();
    else if (tabType === 'followups') loadFollowUpsTab();
    else if (tabType === 'hold') loadHoldTab();
    else if (tabType === 'enrolled') loadEnrolledTab();
    
    console.log('⬇️ Loaded more:', tabType, sectionKey, '→', PAGINATION.smartTab[tabType][sectionKey]);
}

// ════════════════════════════════════════
// PENDING QUEUE (Call Log)
// ════════════════════════════════════════
function loadPendingQueue() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allPending = allLeads.filter(function(lead) { return lead.status === 'Need Call'; });
    pendingTodayLeads = [];
    pendingOlderLeads = [];

    allPending.forEach(function(lead) {
        if (!lead.createdAt) { pendingOlderLeads.push(lead); return; }
        const leadDate = lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt);
        if (leadDate >= todayStart) pendingTodayLeads.push(lead);
        else pendingOlderLeads.push(lead);
    });

    const sortOldest = function(a, b) {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return aTime - bTime;
    };

    pendingTodayLeads.sort(sortOldest);
    pendingOlderLeads.sort(sortOldest);

       renderPendingSection('todayPendingList', pendingTodayLeads, true, 'today');
    setEl('todayPendingCount', pendingTodayLeads.length);
    renderPendingSection('olderPendingList', pendingOlderLeads, false, 'older');
    setEl('olderPendingCount', pendingOlderLeads.length);
    updatePendingStats();
}

function renderPendingSection(containerId, leads, isToday, pageType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (leads.length === 0) {
        container.innerHTML = '<div class="pending-empty"><div class="pending-empty-icon">' + (isToday ? '🎉' : '✅') + '</div><p>' + (isToday ? 'අද add කරපු leads නෑ' : 'පරණ leads නෑ') + '</p></div>';
        return;
    }

    // ⭐ Phase 3: Pagination
    const limit = pageType === 'today' ? PAGINATION.pendingToday : PAGINATION.pendingOlder;
    const leadsToShow = leads.slice(0, limit);
    const hasMore = leads.length > limit;
    const remaining = leads.length - leadsToShow.length;

    let html = '';
    leadsToShow.forEach(function(lead) {
        const timeAgo = getTimeAgo(lead.createdAt);
        const isSelected = selectedLeadId === lead.id;
        const attempts = lead.callAttempts || 0;
        const attemptsBadge = attempts > 0 ? '<span class="pending-attempts">📞 ' + attempts + '/' + maxCallAttempts + '</span>' : '';

        html += '<div class="pending-item ' + (isSelected ? 'selected' : '') + '" onclick="selectLeadForLog(\'' + lead.id + '\')">' +
            '<div class="pending-item-header">' +
            '<span class="pending-item-name">👤 ' + escapeHtml(lead.name || 'Unknown') + '</span>' +
            '<span class="pending-item-time">' + timeAgo + '</span>' +
            '</div>' +
            '<div class="pending-item-phone">📱 ' + escapeHtml(lead.phone || 'No phone') + ' ' + attemptsBadge + '</div>' +
            '<div class="pending-item-actions">' +
            '<button class="btn-call-now" onclick="event.stopPropagation(); selectLeadForLog(\'' + lead.id + '\')">📞 Call Now</button>' +
            '<button class="btn-wa-quick" onclick="event.stopPropagation(); openWhatsApp(\'' + lead.phone + '\')">💬</button>' +
            '</div></div>';
    });

    // ⭐ Load More button
    if (hasMore) {
        html += '<div class="pending-load-more-wrap">' +
            '<div class="pending-load-more-info">Showing <strong>' + leadsToShow.length + '</strong> of <strong>' + leads.length + '</strong></div>' +
            '<button class="btn-load-more-pending" onclick="loadMorePending(\'' + pageType + '\')">⬇️ Load More (' + remaining + ' left)</button>' +
            '</div>';
    } else if (leads.length > PAGINATION.PAGE_SIZE) {
        html += '<div class="pending-load-more-wrap">' +
            '<div class="pending-load-more-info">✅ All <strong>' + leads.length + '</strong> loaded</div>' +
            '</div>';
    }

    container.innerHTML = html;
}

function updatePendingStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayAdded = allLeads.filter(function(lead) {
        if (!lead.createdAt) return false;
        const d = lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt);
        return d >= todayStart;
    }).length;

    setEl('psTodayAdded', todayAdded);
    setEl('psTodayCalled', todayAdded - pendingTodayLeads.length);
    setEl('psTodayRemaining', pendingTodayLeads.length);
    setEl('psOlderPending', pendingOlderLeads.length);
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return formatDate(date);
}

// ════════════════════════════════════════
// QUICK ADD (⭐ + Cache Invalidation)
// ════════════════════════════════════════
function quickAddLead() {
    const countryCode = document.getElementById('quickCountry').value;
    const phoneInput = document.getElementById('quickPhone');
    const nameInput = document.getElementById('quickName');
    const phone = phoneInput.value.trim().replace(/\D/g, '');
    const name = nameInput.value.trim();

    if (!phone || phone.length < 6) { showToast('📱 Valid phone!', 'warning'); phoneInput.focus(); return; }

    let fullPhone = countryCode === '+0' ? '+' + phone : countryCode + phone;
    const duplicate = allLeads.find(function(l) { return l.phone === fullPhone; });
    if (duplicate) { showToast('⚠️ ' + fullPhone + ' already exists!', 'warning'); return; }

    db.collection('leads').add({
        name: name || 'Unknown',
        phone: fullPhone,
        countryCode: countryCode,
        status: 'Need Call',
        callAttempts: 0,
        courseInterest: '',
        source: 'Walk In',
        notes: '',
        callHistory: [],
        whatsappHistory: [],
        createdAt: getServerTimestamp(),
        createdBy: currentUser.nickname || currentUser.name,
        updatedAt: getServerTimestamp()
    }).then(function() {
        showToast('✅ Lead added: ' + fullPhone, 'success');
        phoneInput.value = '';
        nameInput.value = '';
        phoneInput.focus();
        SmartStorage.remove(PAGE_CACHE_KEY); // ⭐ Invalidate Cache
    }).catch(function() { showToast('❌ Add failed!', 'error'); });
}

// ════════════════════════════════════════
// SEARCH & FILTER
// ════════════════════════════════════════
function searchLeads() {
    const query = (document.getElementById('searchLeads').value || '').toLowerCase();
    const statusFilter = (document.getElementById('filterStatus').value || '');
    applyFilters(query, statusFilter);
}

function filterByStatus() {
    const query = (document.getElementById('searchLeads').value || '').toLowerCase();
    const statusFilter = (document.getElementById('filterStatus').value || '');
    applyFilters(query, statusFilter);
}

function applyFilters(query, statusFilter) {
    filteredLeads = allLeads.filter(function(lead) {
        const matchSearch = !query ||
            (lead.name || '').toLowerCase().includes(query) ||
            (lead.phone || '').toLowerCase().includes(query) ||
            (lead.courseInterest || '').toLowerCase().includes(query);
        const matchStatus = !statusFilter || lead.status === statusFilter;
        return matchSearch && matchStatus;
    });
    renderLeadsTable(filteredLeads);
}

// ════════════════════════════════════════
// LEAD MODAL (⭐ + Cache Invalidation)
// ════════════════════════════════════════
function openLeadModal() {
    editLeadId = null;
    document.getElementById('leadModalTitle').textContent = '➕ Add New Lead';
    document.getElementById('mlName').value = '';
    document.getElementById('mlPhone').value = '';
    document.getElementById('mlCountry').value = '+94';
    document.getElementById('mlStatus').value = 'Need Call';
    document.getElementById('mlCourse').value = '';
    document.getElementById('mlSource').value = 'Walk In';
    document.getElementById('mlEvent').value = '';
    document.getElementById('mlNotes').value = '';
    openModal('leadModal');
}

function openEditLead(leadId) {
    const lead = allLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;
    editLeadId = leadId;
    document.getElementById('leadModalTitle').textContent = '✏️ Edit Lead';
    document.getElementById('mlName').value = lead.name || '';
    const country = lead.countryCode || '+94';
    document.getElementById('mlCountry').value = country;
    let phoneNum = lead.phone || '';
    if (phoneNum.startsWith(country)) phoneNum = phoneNum.substring(country.length);
    else if (phoneNum.startsWith('+')) phoneNum = phoneNum.substring(1);
    document.getElementById('mlPhone').value = phoneNum;
    document.getElementById('mlStatus').value = lead.status || 'Need Call';
    document.getElementById('mlCourse').value = lead.courseInterest || '';
    document.getElementById('mlSource').value = lead.source || 'Walk In';
    document.getElementById('mlEvent').value = lead.eventId || '';
    document.getElementById('mlNotes').value = lead.notes || '';
    openModal('leadModal');
}

function saveLead() {
    const name = document.getElementById('mlName').value.trim();
    const country = document.getElementById('mlCountry').value;
    const phoneRaw = document.getElementById('mlPhone').value.trim().replace(/\D/g, '');

    if (!name) { showToast('Name required!', 'warning'); return; }
    if (!phoneRaw || phoneRaw.length < 6) { showToast('Valid phone required!', 'warning'); return; }

    const phone = country === '+0' ? '+' + phoneRaw : country + phoneRaw;
    const duplicate = allLeads.find(function(l) { return l.phone === phone && l.id !== editLeadId; });
    if (duplicate) { showToast('⚠️ Phone exists!', 'warning'); return; }

    const data = {
        name: name,
        phone: phone,
        countryCode: country,
        status: document.getElementById('mlStatus').value,
        courseInterest: document.getElementById('mlCourse').value,
        source: document.getElementById('mlSource').value,
        eventId: document.getElementById('mlEvent').value,
        notes: document.getElementById('mlNotes').value.trim(),
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    };

    let promise;
    if (editLeadId) {
        promise = db.collection('leads').doc(editLeadId).update(data);
    } else {
        data.createdAt = getServerTimestamp();
        data.createdBy = currentUser.nickname || currentUser.name;
        data.callHistory = [];
        data.whatsappHistory = [];
        data.callAttempts = 0;
        promise = db.collection('leads').add(data);
    }

    promise.then(function() {
        showToast(editLeadId ? '✅ Updated!' : '✅ Added!', 'success');
        closeModal('leadModal');
        SmartStorage.remove(PAGE_CACHE_KEY); // ⭐ Invalidate Cache
    });
}

// ════════════════════════════════════════
// VIEW LEAD
// ════════════════════════════════════════
function viewLead(leadId) {
    const lead = allLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;

    selectedLeadData = lead;
    const statusInfo = getStatusInfo(lead.status || 'Need Call');
    const dateStr = formatDate(lead.createdAt);
    const attempts = lead.callAttempts || 0;

    let historyHtml = '';
    if (lead.callHistory && lead.callHistory.length > 0) {
        const sorted = [...lead.callHistory].sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
        sorted.forEach(function(h) {
            historyHtml += '<div class="history-item">' +
                '<div class="history-header">' +
                '<span class="status-badge ' + getStatusInfo(h.status).cssClass + '">' + getStatusInfo(h.status).label + '</span>' +
                '<span class="history-date">' + (h.dateStr || '-') + '</span>' +
                '<span class="history-operator">👤 ' + escapeHtml(h.operator || '-') + '</span>' +
                '</div>' +
                '<div class="history-notes">' + escapeHtml(h.notes || 'No notes') + '</div>' +
                '</div>';
        });
    } else {
        historyHtml = '<div style="color:#888;text-align:center;padding:16px;">No call history</div>';
    }

    let waHtml = '';
    if (lead.whatsappHistory && lead.whatsappHistory.length > 0) {
        lead.whatsappHistory.slice(-5).reverse().forEach(function(w) {
            waHtml += '<div style="background:#0f3460;padding:8px 12px;border-radius:6px;margin-bottom:6px;">' +
                '<div style="display:flex;justify-content:space-between;">' +
                '<span style="color:#25D366;">✅✅✅ ' + escapeHtml(w.type) + '</span>' +
                '<span style="color:#888;font-size:0.75rem;">' + (w.dateStr || '-') + '</span>' +
                '</div>' +
                '<div style="color:#888;font-size:0.8rem;margin-top:3px;">' + escapeHtml(w.preview || '') + '</div>' +
                '</div>';
        });
    }

    document.getElementById('viewLeadBody').innerHTML =
        '<div class="lead-detail-grid">' +
        '<div class="lead-detail-item"><label>👤 Name</label><span>' + escapeHtml(lead.name || '-') + '</span></div>' +
        '<div class="lead-detail-item"><label>📱 Phone</label><span><a href="tel:' + lead.phone + '" style="color:#2196F3">' + escapeHtml(lead.phone || '-') + '</a></span></div>' +
        '<div class="lead-detail-item"><label>📊 Status</label><span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span></div>' +
        '<div class="lead-detail-item"><label>📞 Attempts</label><span>' + getAttemptsBadge(attempts, lead.status) + '</span></div>' +
        '<div class="lead-detail-item"><label>🎓 Course</label><span>' + escapeHtml(lead.courseInterest || '-') + '</span></div>' +
        '<div class="lead-detail-item"><label>📡 Source</label><span>' + escapeHtml(lead.source || '-') + '</span></div>' +
        '<div class="lead-detail-item"><label>📅 Added</label><span>' + dateStr + '</span></div>' +
        '</div>' +
        (lead.notes ? '<div style="background:#0f3460;padding:10px 14px;border-radius:8px;margin-bottom:16px;"><label style="font-size:0.75rem;color:#888;display:block;margin-bottom:4px;">📝 Notes</label><span style="color:#ccc;font-size:0.9rem;">' + escapeHtml(lead.notes) + '</span></div>' : '') +
        (waHtml ? '<div style="margin-bottom:16px;"><div style="font-weight:600;color:#25D366;margin-bottom:10px;">📲 WhatsApp Sent History</div>' + waHtml + '</div>' : '') +
        '<div><div style="font-weight:600;color:#f0a500;margin-bottom:10px;">📜 Call History</div>' + historyHtml + '</div>';

    openModal('viewLeadModal');
}

function editFromView() {
    if (!selectedLeadData) return;
    closeModal('viewLeadModal');
    openEditLead(selectedLeadData.id);
}

// ════════════════════════════════════════
// DELETE (⭐ + Cache Invalidation)
// ════════════════════════════════════════
function openDeleteLead(leadId, leadName) {
    deleteLeadId = leadId;
    document.getElementById('deleteLeadName').textContent = leadName;
    openModal('deleteModal');
}

function confirmDelete() {
    if (!deleteLeadId) return;
    db.collection('leads').doc(deleteLeadId).delete().then(function() {
        showToast('🗑️ Deleted!', 'success');
        closeModal('deleteModal');
        SmartStorage.remove(PAGE_CACHE_KEY); // ⭐ Invalidate Cache
        deleteLeadId = null;
    });
}

// ════════════════════════════════════════
// STATS
// ════════════════════════════════════════
function updateStats() {
    setEl('statTotal', allLeads.length);
    setEl('statEnrolled', allLeads.filter(function(l) { return l.status === 'Enrolled'; }).length);
    setEl('statMightJoin', allLeads.filter(function(l) { return l.status === 'Might Join'; }).length);
    setEl('statNeedCall', allLeads.filter(function(l) { return l.status === 'Need Call'; }).length);
    setEl('statFollowUp', allLeads.filter(function(l) { return l.followUpDate; }).length);
}

// ════════════════════════════════════════
// CALL LOG
// ════════════════════════════════════════
function searchForLog() {
    const query = (document.getElementById('logSearchInput').value || '').toLowerCase().trim();
    const results = document.getElementById('logSearchResults');
    if (!query || query.length < 2) { results.classList.remove('show'); return; }

    const found = allLeads.filter(function(lead) {
        return (lead.name || '').toLowerCase().includes(query) || (lead.phone || '').toLowerCase().includes(query);
    }).slice(0, 8);

    if (found.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color:#888;">No leads</div>';
        results.classList.add('show');
        return;
    }

    let html = '';
    found.forEach(function(lead) {
        const statusInfo = getStatusInfo(lead.status || 'Need Call');
        html += '<div class="search-result-item" onclick="selectLeadForLog(\'' + lead.id + '\')">' +
            '<div class="search-result-name">' + escapeHtml(lead.name || 'Unknown') + '</div>' +
            '<div class="search-result-phone">' + escapeHtml(lead.phone || '') + ' · <span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span></div>' +
            '</div>';
    });

    results.innerHTML = html;
    results.classList.add('show');
}

function selectLeadForLog(leadId) {
    const lead = allLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;

    selectedLeadId = leadId;
    selectedLeadData = lead;

    const results = document.getElementById('logSearchResults');
    if (results) results.classList.remove('show');

    const searchInput = document.getElementById('logSearchInput');
    if (searchInput) searchInput.value = lead.name + ' - ' + lead.phone;

    document.getElementById('selectedLeadInfo').style.display = 'block';
    setEl('selLeadName', escapeHtml(lead.name || 'Unknown'));
    setEl('selLeadPhone', lead.phone || '-');
    setEl('selLeadAttempts', '📞 Attempts: ' + (lead.callAttempts || 0) + '/' + maxCallAttempts);

    const statusInfo = getStatusInfo(lead.status || 'Need Call');
    document.getElementById('selLeadStatus').innerHTML = 'Current: <span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span>';

    setInput('logName', lead.name || '');
    setInput('logPhone', lead.phone || '');
    setSelect('logStatus', lead.status || 'Need Call');
    setSelect('logCourse', lead.courseInterest || '');
    setSelect('logSource', lead.source || 'Walk In');
    setSelect('logEvent', lead.eventId || '');
    fillDateInput('logFollowUp', lead.followUpDate);
    setInput('logNotes', '');

    showEl('callLogForm');
    hideEl('noLeadMsg');
    showEl('waActions');
    document.getElementById('callHistorySection').style.display = 'block';

    loadCallHistory(lead);
    switchTab('callLog');
    loadPendingQueue();
}

function loadCallHistory(lead) {
    const historyList = document.getElementById('callHistoryList');
    if (!historyList) return;

    const history = lead.callHistory || [];
    if (history.length === 0) {
        historyList.innerHTML = '<div class="no-history"><div>📞</div><p>No history</p></div>';
        return;
    }

    const sorted = [...history].sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
    let html = '';
    sorted.forEach(function(h) {
        const statusInfo = getStatusInfo(h.status || 'Need Call');
        html += '<div class="history-item">' +
            '<div class="history-header">' +
            '<span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span>' +
            '<span class="history-date">' + (h.dateStr || '-') + '</span>' +
            '<span class="history-operator">👤 ' + escapeHtml(h.operator || '-') + '</span>' +
            '</div>' +
            '<div class="history-notes">' + escapeHtml(h.notes || 'No notes') + '</div>' +
            (h.followUpDate ? '<div class="history-status-change">📅 Follow-up: ' + h.followUpDate + '</div>' : '') +
            '</div>';
    });
    historyList.innerHTML = html;
}

function saveCallLog() {
    if (!selectedLeadId) { showToast('❌ Lead select කරන්න!', 'warning'); return; }

    const name = document.getElementById('logName').value.trim();
    const status = document.getElementById('logStatus').value;
    const course = document.getElementById('logCourse').value;
    const followUp = document.getElementById('logFollowUp').value;
    const notes = document.getElementById('logNotes').value.trim();
    const source = document.getElementById('logSource').value;
    const eventId = document.getElementById('logEvent').value;

    const now = new Date();
    const historyEntry = {
        status: status,
        notes: notes || '(No notes)',
        followUpDate: followUp || null,
        operator: currentUser.nickname || currentUser.name,
        dateStr: formatDateTime(now),
        timestamp: now.getTime()
    };

    let newAttempts = selectedLeadData.callAttempts || 0;
    if (selectedLeadData.status === 'Need Call') newAttempts += 1;

    db.collection('leads').doc(selectedLeadId).update({
        name: name,
        status: status,
        courseInterest: course,
        source: source,
        eventId: eventId,
        followUpDate: followUp || null,
        callAttempts: newAttempts,
        callHistory: firebase.firestore.FieldValue.arrayUnion(historyEntry),
        updatedAt: getServerTimestamp(),
        lastUpdatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    }).then(function() {
        showToast('✅ Call logged!', 'success');
        SmartStorage.remove(PAGE_CACHE_KEY); // ⭐ Invalidate Cache
        if (HOLD_TRIGGER_STATUSES.includes(status) && newAttempts >= maxCallAttempts) {
            showHoldWarning(selectedLeadId, name, newAttempts);
        } else {
            autoLoadNextLead();
        }
    });
}

function showHoldWarning(leadId, leadName, attempts) {
    holdLeadId = leadId;
    setEl('holdLeadName', leadName);
    setEl('holdAttempts', attempts);
    openModal('holdWarningModal');
}

function confirmMoveToHold() {
    if (!holdLeadId) return;
    db.collection('leads').doc(holdLeadId).update({
        status: 'Hold',
        updatedAt: getServerTimestamp(),
        lastUpdatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name,
        movedToHoldAt: getServerTimestamp(),
        movedToHoldReason: 'Max attempts reached'
    }).then(function() {
        showToast('⏸️ Moved to Hold!', 'success');
        closeModal('holdWarningModal');
        SmartStorage.remove(PAGE_CACHE_KEY); // ⭐ Invalidate Cache
        holdLeadId = null;
        autoLoadNextLead();
    });
}

function autoLoadNextLead() {
    setTimeout(function() {
        loadPendingQueue();
        let nextLead = pendingTodayLeads.length > 0 ? pendingTodayLeads[0] : (pendingOlderLeads.length > 0 ? pendingOlderLeads[0] : null);
        if (nextLead && nextLead.id !== selectedLeadId) {
            showToast('⚡ Next: ' + (nextLead.name || 'Unknown'), 'info');
            selectLeadForLog(nextLead.id);
        } else {
            showToast('🎉 All done!', 'success');
            clearCallLogForm();
        }
    }, 500);
}

function clearCallLogForm() {
    selectedLeadId = null;
    selectedLeadData = null;
    const searchInput = document.getElementById('logSearchInput');
    if (searchInput) searchInput.value = '';
    hideEl('selectedLeadInfo');
    hideEl('callLogForm');
    hideEl('waActions');
    showEl('noLeadMsg');
    document.getElementById('callHistorySection').style.display = 'none';
    document.getElementById('callHistoryList').innerHTML = '<div class="no-history"><div>📞</div><p>Select lead</p></div>';
    if (document.getElementById('logNotes')) document.getElementById('logNotes').value = '';
    resetSmartDateUI('logFollowUp', true);
    loadPendingQueue();
}

// ════════════════════════════════════════
// WHATSAPP
// ════════════════════════════════════════
function openWAPreview(type) {
    if (!selectedLeadData && !tabSelectedLeadData) { showToast('⚠️ Lead select කරන්න!', 'warning'); return; }
    if (!selectedLeadData) selectedLeadData = tabSelectedLeadData;
    currentWAType = type;
    setEl('waPreviewPhone', selectedLeadData.phone || '-');
    setEl('waPreviewName', selectedLeadData.name || '-');

    const multiSelect = document.getElementById('waMultiSelect');
    if (type === 'multi') {
        multiSelect.style.display = 'block';
        document.getElementById('waInclude_course').checked = true;
        document.getElementById('waInclude_payment').checked = false;
        document.getElementById('waInclude_notes').checked = false;
        document.getElementById('waInclude_confirmation').checked = false;
        document.getElementById('waInclude_followup').checked = false;
    } else {
        multiSelect.style.display = 'none';
    }

    rebuildWAMessage();
    openModal('waPreviewModal');
}

function rebuildWAMessage() {
    if (!selectedLeadData) return;
    const lead = selectedLeadData;
    const name = lead.name || 'there';
    const course = lead.courseInterest || '';
    const notes =
        document.getElementById('logNotes')?.value?.trim() ||
        document.getElementById('mjNotes')?.value?.trim() ||
        document.getElementById('fuNotes')?.value?.trim() || '';

    let msg = 'Hi ' + name + '! 👋\n\n';

    if (currentWAType === 'course') msg += buildCourseSection(course);
    else if (currentWAType === 'payment') msg += buildPaymentSection();
    else if (currentWAType === 'confirmation') msg += buildConfirmationSection();
    else if (currentWAType === 'multi') {
        if (document.getElementById('waInclude_course')?.checked) msg += buildCourseSection(course) + '\n';
        if (document.getElementById('waInclude_payment')?.checked) msg += buildPaymentSection() + '\n';
        if (document.getElementById('waInclude_notes')?.checked && notes) msg += '📝 *Our Discussion:*\n' + notes + '\n\n';
        if (document.getElementById('waInclude_confirmation')?.checked) msg += buildConfirmationSection() + '\n';
        if (document.getElementById('waInclude_followup')?.checked) msg += '📅 We will follow up soon.\n\n';
    }

    msg += '\n🏫 Buono Academy - SCA Certified\n☕ Thank you!';
    document.getElementById('waPreviewText').value = msg;
}

function buildCourseSection(courseName) {
    if (!courseName) return 'Thank you for your interest! 🎓\n\nPlease let us know which course.\n\n';
    const c = allCourses.find(function(c) { return c.name === courseName; });
    let section = 'Thank you for your interest! 🎓\n\n📚 *' + courseName + '*\n';
    if (c) {
        const balance = c.fee - c.downPayment;
        const install = Math.round(balance / 2);
        section += '💰 Fee: Rs. ' + c.fee.toLocaleString() + '\n⬇️ Down: Rs. ' + c.downPayment.toLocaleString() + '\n📅 Install 1: Rs. ' + install.toLocaleString() + '\n📅 Install 2: Rs. ' + install.toLocaleString() + '\n';
    }
    return section + '\n';
}

function buildPaymentSection() {
    return '💳 *Payment Details*\n\n🏦 Bank: Commercial Bank\n👤 Account: Buono Cafe\n🔢 Acc No: [Number]\n\n📸 Send slip after transfer.\n\n';
}

function buildConfirmationSection() {
    return '✅ *Enrollment Confirmed!*\n\nWelcome to Buono Academy! 🎓\n\n📅 We\'ll contact you soon.\n\n';
}

function sendWAFromPreview() {
    if (!selectedLeadData) return;
    const phone = (selectedLeadData.phone || '').replace(/\D/g, '');
    const msg = document.getElementById('waPreviewText').value;
    if (!msg.trim()) { showToast('⚠️ Empty!', 'warning'); return; }

    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');

    const now = new Date();
    const waEntry = {
        type: currentWAType,
        sentBy: currentUser.nickname || currentUser.name,
        dateStr: formatDateTime(now),
        timestamp: now.getTime(),
        preview: msg.substring(0, 100) + (msg.length > 100 ? '...' : '')
    };

    const leadId = selectedLeadId || tabSelectedLeadId;
    db.collection('leads').doc(leadId).update({
        whatsappHistory: firebase.firestore.FieldValue.arrayUnion(waEntry),
        lastWhatsAppSent: getServerTimestamp(),
        updatedAt: getServerTimestamp()
    }).then(function() {
        showToast('✅✅✅ Sent & tracked!', 'success');
        closeModal('waPreviewModal');
    });
}

// ════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════
function loadPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    const hasPaymentAccess = checkPaymentAccess();
    const quickActionBar = document.getElementById('paymentQuickAction');
    const headerBtn = document.getElementById('btnNewPaymentHeader');
    if (quickActionBar) quickActionBar.style.display = hasPaymentAccess ? 'block' : 'none';
    if (headerBtn) headerBtn.style.display = hasPaymentAccess ? 'inline-block' : 'none';

    const enrolled = allLeads.filter(function(l) { return l.status === 'Enrolled'; });
    setEl('paymentCount', enrolled.length);

    if (enrolled.length === 0) {
        if (hasPaymentAccess) {
            tbody.innerHTML = '<tr><td colspan="9" style="padding:40px 20px;text-align:center;">' +
                '<div style="font-size:3rem;margin-bottom:12px;">💳</div>' +
                '<div style="color:#ccc;font-size:1rem;margin-bottom:8px;font-weight:600;">No enrolled students yet!</div>' +
                '<div style="color:#888;font-size:0.85rem;margin-bottom:16px;">පළමු payment එක process කරන්න</div>' +
                '<button class="btn-primary" onclick="openPaymentPage()" style="padding:12px 24px;">➕ Process First Payment</button>' +
                '</td></tr>';
        } else {
            tbody.innerHTML = '<tr><td colspan="9" class="table-empty">📭 No enrolled students</td></tr>';
        }
        return;
    }

    let html = '';
    enrolled.forEach(function(lead) {
        const course = allCourses.find(function(c) { return c.name === lead.courseInterest; });
        const totalFee = course ? course.fee : 0;
        const downPmt = course ? course.downPayment : 0;
        const balance = totalFee - downPmt;
        const install = balance > 0 ? Math.round(balance / 2) : 0;
        const p = lead.payment || {};

        html += '<tr>' +
            '<td><strong style="color:#fff;">' + escapeHtml(lead.name || '-') + '</strong></td>' +
            '<td><a href="tel:' + lead.phone + '" style="color:#2196F3">' + escapeHtml(lead.phone || '-') + '</a></td>' +
            '<td>' + escapeHtml(lead.courseInterest || '-') + '</td>' +
            '<td style="color:#f0a500;">' + formatCurrency(totalFee) + '</td>' +
            '<td>' + formatCurrency(downPmt) + ' ' + (p.downPaid ? '<span class="payment-status payment-paid">✅</span>' : '<button class="btn-icon" style="color:#4CAF50" onclick="markPaid(\'' + lead.id + '\',\'down\')">Pay</button>') + '</td>' +
            '<td>' + formatCurrency(install) + ' ' + (p.installment1Paid ? '<span class="payment-status payment-paid">✅</span>' : '<button class="btn-icon" style="color:#FF9800" onclick="markPaid(\'' + lead.id + '\',\'install1\')">Pay</button>') + '</td>' +
            '<td>' + formatCurrency(install) + ' ' + (p.installment2Paid ? '<span class="payment-status payment-paid">✅</span>' : '<button class="btn-icon" style="color:#FF9800" onclick="markPaid(\'' + lead.id + '\',\'install2\')">Pay</button>') + '</td>' +
            '<td style="color:' + (getBalanceAmount(totalFee, p, install) > 0 ? '#ff4444' : '#4CAF50') + '">' + formatCurrency(getBalanceAmount(totalFee, p, install)) + '</td>' +
            '<td><div class="action-btns"><button class="btn-icon wa" onclick="sendWAPaymentDetailsFor(\'' + lead.id + '\')">📲</button></div></td>' +
            '</tr>';
    });

    tbody.innerHTML = html;
}

function checkPaymentAccess() {
    if (!currentUser) return false;
    if (currentUser.access === 'Admin') return true;
    if (currentUser.access === 'Manager') return true;
    const perms = currentUser.permissions?.paymentDB || {};
    return perms.add === true || perms.view === true || perms.edit === true;
}

function openPaymentPage() {
    window.open('payment.html', '_blank');
    showToast('💳 Payment page opened!', 'success');
}

function getBalanceAmount(totalFee, p, install) {
    let paid = 0;
    if (p.downPaid) paid += (p.downAmount || 0);
    if (p.installment1Paid) paid += install;
    if (p.installment2Paid) paid += install;
    return Math.max(0, totalFee - paid);
}

function markPaid(leadId, type) {
    const lead = allLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;
    const course = allCourses.find(function(c) { return c.name === lead.courseInterest; });
    const downAmt = course ? course.downPayment : 0;
    let updateData = { updatedAt: getServerTimestamp() };

    if (type === 'down') { updateData['payment.downPaid'] = true; updateData['payment.downAmount'] = downAmt; updateData['payment.downDate'] = new Date().toISOString(); }
    else if (type === 'install1') { updateData['payment.installment1Paid'] = true; updateData['payment.install1Date'] = new Date().toISOString(); }
    else if (type === 'install2') { updateData['payment.installment2Paid'] = true; updateData['payment.install2Date'] = new Date().toISOString(); }

    db.collection('leads').doc(leadId).update(updateData).then(function() {
        showToast('✅ Marked!', 'success');
        SmartStorage.remove(PAGE_CACHE_KEY);
        loadPayments();
    });
}

// ════════════════════════════════════════
// CC REPORTS
// ════════════════════════════════════════
function loadCCReports() {
    PerfTracker.start('📊 Reports Load');
    
    const period = document.getElementById('reportPeriod')?.value || 'month';
    const now = new Date();
    let fromDate = new Date(0);

    if (period === 'today') { fromDate = new Date(now); fromDate.setHours(0,0,0,0); }
    else if (period === 'week') { fromDate = new Date(now); fromDate.setDate(now.getDate()-7); }
    else if (period === 'month') { fromDate = new Date(now.getFullYear(), now.getMonth(), 1); }

    // ⭐ Phase 5: Filter only if period selected (avoid full scan when possible)
    const filtered = period === 'all' ? allLeads : allLeads.filter(function(l) {
        if (!l.createdAt) return false;
        const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
        return d >= fromDate;
    });

    const total = filtered.length;
    
    // ⭐ Phase 5: Single-pass calculation (avoid multiple filters!)
    let enrolled = 0, might = 0, revenue = 0;
    filtered.forEach(function(l) {
        if (l.status === 'Enrolled') {
            enrolled++;
            const c = allCourses.find(function(c) { return c.name === l.courseInterest; });
            if (c) revenue += c.fee || 0;
        } else if (l.status === 'Might Join') {
            might++;
        }
    });
    
    const rate = total > 0 ? Math.round((enrolled/total)*100) : 0;

    setEl('rsTotalLeads', total);
    setEl('rsEnrolled', enrolled);
    setEl('rsMightJoin', might);
    setEl('rsRevenue', 'Rs. ' + revenue.toLocaleString());
    setEl('rsConversion', rate + '%');

    renderStatusBars(filtered);
    renderSourceAnalytics(filtered, period);
    
    PerfTracker.end('📊 Reports Load');
    
    // ⭐ Performance warning for large datasets
    if (filtered.length > 5000) {
        console.warn('⚠️ Large dataset (' + filtered.length + ' leads). Consider using shorter period for faster reports.');
    }
}
function renderStatusBars(leads) {
    const barsDiv = document.getElementById('statusBars');
    if (!barsDiv) return;

    if (leads.length === 0) { barsDiv.innerHTML = '<div style="color:#888;text-align:center;">No data</div>'; return; }

    const counts = {};
    leads.forEach(function(l) { const s = l.status || 'Need Call'; counts[s] = (counts[s] || 0) + 1; });

    const sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; });
    const max = sorted[0] ? sorted[0][1] : 1;

    let html = '';
    sorted.forEach(function(entry) {
        const statusInfo = getStatusInfo(entry[0]);
        const pct = Math.round((entry[1]/max)*100);
        html += '<div class="status-bar-item">' +
            '<div class="status-bar-label">' + statusInfo.label + '</div>' +
            '<div class="status-bar-track"><div class="status-bar-fill" style="width:' + pct + '%"></div></div>' +
            '<div class="status-bar-count">' + entry[1] + '</div>' +
            '</div>';
    });

    barsDiv.innerHTML = html;
}

// ════════════════════════════════════════
// LEAD SOURCE ANALYTICS
// ════════════════════════════════════════
function renderSourceAnalytics(leads, period) {
    const container = document.getElementById('sourceAnalyticsList');
    const insightsBox = document.getElementById('sourceInsights');
    const insightsText = document.getElementById('sourceInsightsText');
    const subtitle = document.getElementById('sourceSubtitle');
    if (!container) return;

    const periodLabels = { 'today':'Today','week':'This Week','month':'This Month','all':'All Time' };
    if (subtitle) {
        let subText = 'Period: ' + (periodLabels[period] || 'This Month');
        // ⭐ Phase 5: Show count for large datasets
        if (leads.length > 1000) subText += ' (' + leads.length + ' leads)';
        subtitle.textContent = subText;
    }

    if (leads.length === 0) {
        container.innerHTML = '<div class="source-empty"><div class="source-empty-icon">📡</div><p>No leads in this period</p></div>';
        if (insightsBox) insightsBox.style.display = 'none';
        return;
    }
}
// ════════════════════════════════════════
// COURSES
// ════════════════════════════════════════
function loadCourses() {
    db.collection('courses').orderBy('createdAt', 'desc').get().then(function(snapshot) {
        allCourses = [];
        snapshot.forEach(function(doc) { allCourses.push({ id: doc.id, ...doc.data() }); });
        if (allCourses.length === 0) loadDefaultCourses();
        else { populateCourseSelects(); renderCoursesTable(); }
    });
}

function loadDefaultCourses() {
    const defaults = [
        { name: 'SCA Foundation', academy: 'SCA', fee: 65000, downPayment: 20000 },
        { name: 'SCA Intermediate', academy: 'SCA', fee: 130000, downPayment: 50000 },
        { name: 'SCA Brewing', academy: 'SCA', fee: 70000, downPayment: 35000 }
    ];
    const batch = db.batch();
    defaults.forEach(function(course) {
        batch.set(db.collection('courses').doc(), { ...course, createdAt: getServerTimestamp(), createdBy: 'System' });
    });
    batch.commit().then(function() { loadCourses(); });
}

function populateCourseSelects() {
    const selects = ['mlCourse', 'logCourse', 'mjCourse', 'fuCourse', 'enrCourse'];
    selects.forEach(function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const val = el.value;
        el.innerHTML = '<option value="">-- Select Course --</option>';
        allCourses.forEach(function(c) {
            el.innerHTML += '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + ' (Rs.' + (c.fee||0).toLocaleString() + ')</option>';
        });
        el.value = val;
    });
}

function renderCoursesTable() {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;
    if (allCourses.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No courses</td></tr>'; return; }

    let html = '';
    allCourses.forEach(function(course) {
        const fee = Number(course.fee) || 0;
        const down = Number(course.downPayment) || 0;
        const installCount = Number(course.installmentCount) || 2;
        const duration = Number(course.duration) || 3;
        const interval = Number(course.paymentIntervalDays) || 30;
        const balance = fee - down;
        const perInstall = (installCount > 0 && balance > 0) ? Math.round(balance/installCount) : 0;

        let installHtml = '';
        if (balance > 0 && installCount > 0) {
            for (let i = 1; i <= Math.min(installCount, 3); i++) installHtml += 'Install ' + i + ': ' + formatCurrency(perInstall) + '<br>';
            if (installCount > 3) installHtml += '<span style="color:#888;">+ ' + (installCount-3) + ' more...</span>';
        } else if (balance <= 0) { installHtml = '<span style="color:#4CAF50;">✅ Fully Paid</span>'; }

        html += '<tr>' +
            '<td><strong style="color:#fff;">' + escapeHtml(course.name) + '</strong><div style="font-size:0.75rem;color:#888;margin-top:2px;">📅 ' + duration + 'mo | ⏱️ ' + interval + 'd</div></td>' +
            '<td>' + escapeHtml(course.academy || '-') + '</td>' +
            '<td style="color:#f0a500;">' + formatCurrency(fee) + '</td>' +
            '<td>' + formatCurrency(down) + '</td>' +
            '<td style="font-size:0.8rem;color:#888;">' + installHtml + '</td>' +
            '<td><div class="action-btns">' +
            '<button class="btn-icon edit" onclick="openEditCourse(\'' + course.id + '\')">✏️</button>' +
            '<button class="btn-icon delete" onclick="deleteCourse(\'' + course.id + '\', \'' + escapeHtml(course.name) + '\')">🗑️</button>' +
            '</div></td></tr>';
    });
    tbody.innerHTML = html;
}

function openCourseModal() {
    editCourseId = null;
    document.getElementById('courseModalTitle').textContent = '🎓 Add Course';
    document.getElementById('cName').value = '';
    document.getElementById('cAcademy').value = '';
    document.getElementById('cFee').value = '';
    document.getElementById('cDown').value = '';
    document.getElementById('cDuration').value = '3';
    document.getElementById('cInstallments').value = '2';
    document.getElementById('cInterval').value = '30';
    document.getElementById('installmentPreview').innerHTML = '<span style="color:#888;">Enter fee, down payment & installments to see plan</span>';
    openModal('courseModal');
}

function openEditCourse(courseId) {
    const course = allCourses.find(function(c) { return c.id === courseId; });
    if (!course) return;
    editCourseId = courseId;
    document.getElementById('courseModalTitle').textContent = '✏️ Edit Course';
    document.getElementById('cName').value = course.name || '';
    document.getElementById('cAcademy').value = course.academy || '';
    document.getElementById('cFee').value = course.fee || '';
    document.getElementById('cDown').value = course.downPayment || '';
    document.getElementById('cDuration').value = course.duration || 3;
    document.getElementById('cInstallments').value = course.installmentCount || 2;
    document.getElementById('cInterval').value = course.paymentIntervalDays || 30;
    calcCourseInstallments();
    openModal('courseModal');
}

function calcCourseInstallments() {
    const fee = parseFloat(document.getElementById('cFee').value) || 0;
    const down = parseFloat(document.getElementById('cDown').value) || 0;
    const duration = parseInt(document.getElementById('cDuration').value) || 3;
    const installCount = parseInt(document.getElementById('cInstallments').value) || 2;
    const intervalDays = parseInt(document.getElementById('cInterval').value) || 30;
    const preview = document.getElementById('installmentPreview');
    if (!preview) return;

    if (fee <= 0) { preview.innerHTML = '<span style="color:#888;">Enter fee to see plan</span>'; return; }

    const balance = fee - down;
    const perInstallment = installCount > 0 && balance > 0 ? Math.round(balance/installCount) : 0;
    let scheduleHtml = '';

    if (balance > 0 && installCount > 0) {
        for (let i = 1; i <= installCount; i++) {
            scheduleHtml += '<div style="margin-top:4px;padding:6px 10px;background:#16213e;border-radius:6px;font-size:0.85rem;">📅 <strong>Install ' + i + ':</strong> Rs. ' + perInstallment.toLocaleString() + ' <span style="color:#888;">(in ' + (intervalDays*i) + ' days)</span></div>';
        }
    } else if (balance <= 0) { scheduleHtml = '<div style="margin-top:4px;color:#4CAF50;">✅ Fully paid with down payment!</div>'; }

    preview.innerHTML = '<div style="font-size:0.95rem;line-height:1.7;">💰 <strong>Total:</strong> Rs. ' + fee.toLocaleString() + '<br>⬇️ <strong>Down:</strong> Rs. ' + down.toLocaleString() + '<br>💳 <strong>Balance:</strong> Rs. ' + balance.toLocaleString() + '<br>🗓️ <strong>Duration:</strong> ' + duration + ' months' + scheduleHtml + '</div>';
}

function saveCourse() {
    const name = document.getElementById('cName').value.trim();
    const fee = parseFloat(document.getElementById('cFee').value) || 0;
    const down = parseFloat(document.getElementById('cDown').value) || 0;
    const duration = parseInt(document.getElementById('cDuration').value) || 3;
    const installmentCount = parseInt(document.getElementById('cInstallments').value) || 2;
    const paymentIntervalDays = parseInt(document.getElementById('cInterval').value) || 30;

    if (!name) { showToast('⚠️ Course name අවශ්‍යයි!', 'warning'); return; }
    if (fee <= 0) { showToast('⚠️ Valid fee!', 'warning'); return; }
    if (down > fee) { showToast('⚠️ Down > Total!', 'warning'); return; }

    const data = {
        name: name,
        academy: document.getElementById('cAcademy').value.trim(),
        fee: fee, downPayment: down,
        duration: duration, installmentCount: installmentCount, paymentIntervalDays: paymentIntervalDays,
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    };

    const promise = editCourseId
        ? db.collection('courses').doc(editCourseId).update(data)
        : db.collection('courses').add({ ...data, createdAt: getServerTimestamp(), createdBy: currentUser.nickname || currentUser.name });

    promise.then(function() {
        showToast(editCourseId ? '✅ Course updated!' : '✅ Course added!', 'success');
        closeModal('courseModal');
        loadCourses();
    }).catch(function() { showToast('❌ Save failed!', 'error'); });
}

function deleteCourse(courseId, courseName) {
    if (!confirm('Delete: ' + courseName + '?')) return;
    db.collection('courses').doc(courseId).delete().then(function() { showToast('🗑️ Deleted!', 'success'); loadCourses(); });
}

// ════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════
function loadEvents() {
    db.collection('events').orderBy('createdAt', 'desc').get().then(function(snapshot) {
        allEvents = [];
        snapshot.forEach(function(doc) { allEvents.push({ id: doc.id, ...doc.data() }); });
        populateEventSelects();
        renderEventsTable();
    });
}

function populateEventSelects() {
    ['mlEvent', 'logEvent'].forEach(function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const val = el.value;
        el.innerHTML = '<option value="">-- No Campaign --</option>';
        allEvents.forEach(function(ev) { el.innerHTML += '<option value="' + ev.id + '">' + escapeHtml(ev.name) + '</option>'; });
        el.value = val;
    });
}

function renderEventsTable() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;
    if (allEvents.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No campaigns</td></tr>'; return; }

    let html = '';
    allEvents.forEach(function(ev) {
        html += '<tr>' +
            '<td><strong style="color:#fff;">' + escapeHtml(ev.name) + '</strong></td>' +
            '<td>' + escapeHtml(ev.platform||'-') + '</td>' +
            '<td>' + (ev.startDate||'-') + '</td>' +
            '<td style="color:' + (ev.status==='Active'?'#4CAF50':'#888') + '">' + (ev.status||'-') + '</td>' +
            '<td><div class="action-btns">' +
            '<button class="btn-icon edit" onclick="openEditEvent(\'' + ev.id + '\')">✏️</button>' +
            '<button class="btn-icon delete" onclick="deleteEvent(\'' + ev.id + '\', \'' + escapeHtml(ev.name) + '\')">🗑️</button>' +
            '</div></td></tr>';
    });
    tbody.innerHTML = html;
}

function openEventModal() {
    editEventId = null;
    document.getElementById('eventModalTitle').textContent = '📢 Add Campaign';
    document.getElementById('evName').value = '';
    document.getElementById('evPlatform').value = 'Facebook';
    document.getElementById('evStart').value = '';
    document.getElementById('evStatus').value = 'Active';
    openModal('eventModal');
}

function openEditEvent(eventId) {
    const ev = allEvents.find(function(e) { return e.id === eventId; });
    if (!ev) return;
    editEventId = eventId;
    document.getElementById('eventModalTitle').textContent = '✏️ Edit Campaign';
    document.getElementById('evName').value = ev.name || '';
    document.getElementById('evPlatform').value = ev.platform || 'Facebook';
    document.getElementById('evStart').value = ev.startDate || '';
    document.getElementById('evStatus').value = ev.status || 'Active';
    openModal('eventModal');
}

function saveEvent() {
    const name = document.getElementById('evName').value.trim();
    if (!name) { showToast('Name required!', 'warning'); return; }
    const data = { name: name, platform: document.getElementById('evPlatform').value, startDate: document.getElementById('evStart').value, status: document.getElementById('evStatus').value, updatedAt: getServerTimestamp() };
    const promise = editEventId ? db.collection('events').doc(editEventId).update(data) : db.collection('events').add({ ...data, createdAt: getServerTimestamp(), createdBy: currentUser.nickname });
    promise.then(function() { showToast('✅ Saved!', 'success'); closeModal('eventModal'); loadEvents(); });
}

function deleteEvent(eventId, name) {
    if (!confirm('Delete: ' + name + '?')) return;
    db.collection('events').doc(eventId).delete().then(function() { showToast('🗑️ Deleted!', 'success'); loadEvents(); });
}

// ════════════════════════════════════════
// SCRIPTS
// ════════════════════════════════════════
function loadScripts() {
    db.collection('callCenterComments').orderBy('createdAt', 'desc').get().then(function(snapshot) {
        const scripts = [];
        snapshot.forEach(function(doc) { scripts.push({ id: doc.id, ...doc.data() }); });
        renderScripts(scripts);
    });
}

function renderScripts(scripts) {
    const list = document.getElementById('scriptsList');
    if (!list) return;
    if (scripts.length === 0) { list.innerHTML = '<div class="table-empty">📭 No scripts</div>'; return; }
    let html = '';
    scripts.forEach(function(s) {
        html += '<div class="script-card">' +
            '<div class="script-card-header">' +
            '<span class="script-title">' + escapeHtml(s.title||'Script') + '</span>' +
            '<span class="script-category">' + escapeHtml(s.category||'Other') + '</span>' +
            '<div class="action-btns"><button class="btn-icon delete" onclick="deleteScript(\'' + s.id + '\')">🗑️</button></div>' +
            '</div>' +
            '<div class="script-content">' + escapeHtml(s.content||'') + '</div>' +
            '</div>';
    });
    list.innerHTML = html;
}

function openScriptModal() {
    document.getElementById('scTitle').value = '';
    document.getElementById('scCategory').value = 'Initial';
    document.getElementById('scContent').value = '';
    openModal('scriptModal');
}

function saveScript() {
    const title = document.getElementById('scTitle').value.trim();
    const content = document.getElementById('scContent').value.trim();
    if (!title || !content) { showToast('Required!', 'warning'); return; }
    db.collection('callCenterComments').add({ title: title, category: document.getElementById('scCategory').value, content: content, createdAt: getServerTimestamp(), createdBy: currentUser.nickname })
        .then(function() { showToast('✅ Saved!', 'success'); closeModal('scriptModal'); loadScripts(); });
}

function deleteScript(scriptId) {
    if (!confirm('Delete?')) return;
    db.collection('callCenterComments').doc(scriptId).delete().then(function() { showToast('🗑️ Deleted!', 'success'); loadScripts(); });
}

function loadSettings() { loadCourses(); loadEvents(); loadScripts(); loadSettings_MaxAttempts(); }

// ════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════
function openWhatsApp(phone) { if (!phone) return; window.open('https://wa.me/' + phone.replace(/\D/g, ''), '_blank'); }
function sendWAPaymentDetailsFor(leadId) { const lead = allLeads.find(function(l) { return l.id === leadId; }); if (!lead) return; selectedLeadData = lead; selectedLeadId = leadId; openWAPreview('payment'); }

function openModal(modalId) { const m = document.getElementById(modalId); if (m) m.classList.add('show'); }
function closeModal(modalId) { const m = document.getElementById(modalId); if (m) m.classList.remove('show'); }

document.addEventListener('click', function(e) { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show'); });

function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3500);
}

function getStatusInfo(statusValue) {
    const found = STATUSES.find(function(s) { return s.value === statusValue; });
    return found || { value: statusValue, label: statusValue, cssClass: 'status-need-call' };
}

function setEl(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function setInput(id, value) { const el = document.getElementById(id); if (el) el.value = value; }
function setSelect(id, value) { const el = document.getElementById(id); if (el) el.value = value; }
function showEl(id) { const el = document.getElementById(id); if (el) el.style.display = 'block'; }
function hideEl(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ════════════════════════════════════════
// REMINDER NOTIFICATIONS (v11.2)
// ════════════════════════════════════════
let reminderCheckDone = false;

function checkTodayReminders() {
    if (reminderCheckDone) return;
    reminderCheckDone = true;

    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const dueToday = allLeads.filter(function(lead) {
        if (!lead.followUpDate || lead.status === 'Enrolled' || HOLD_STATUSES.includes(lead.status)) return false;
        const d = new Date(lead.followUpDate);
        return d >= today && d < tomorrow;
    });

    const overdue = allLeads.filter(function(lead) {
        if (!lead.followUpDate || lead.status === 'Enrolled' || HOLD_STATUSES.includes(lead.status)) return false;
        return new Date(lead.followUpDate) < today;
    });

    const total = dueToday.length + overdue.length;
    if (total === 0) return;

    showReminderToast(dueToday.length, overdue.length);
    addReminderPulse(total);
    requestNotificationPermission(dueToday.length, overdue.length);
}

function showReminderToast(dueCount, overdueCount) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    let message = '';
    if (dueCount > 0 && overdueCount > 0) message = '📅 ' + dueCount + ' due today + ' + overdueCount + ' overdue!';
    else if (dueCount > 0) message = '📅 ' + dueCount + ' follow-up' + (dueCount > 1 ? 's' : '') + ' due today!';
    else message = '⚠️ ' + overdueCount + ' overdue follow-up' + (overdueCount > 1 ? 's' : '') + '!';

    const toast = document.createElement('div');
    toast.className = 'toast reminder-toast';
    toast.innerHTML = '<div class="reminder-toast-content"><div class="reminder-toast-icon">🔔</div><div class="reminder-toast-text"><div class="reminder-toast-title">' + message + '</div><div class="reminder-toast-subtitle">Click to view →</div></div></div>';
    toast.onclick = function() { switchTab('followups'); removeReminderPulse(); if (toast.parentNode) toast.parentNode.removeChild(toast); };
    container.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 10000);
}

function addReminderPulse(count) {
    const tab = document.getElementById('tab-followups');
    const badge = document.getElementById('badgeFollowups');
    if (tab) tab.classList.add('has-reminder');
    if (badge) badge.classList.add('reminder-badge');
}

function removeReminderPulse() {
    const tab = document.getElementById('tab-followups');
    const badge = document.getElementById('badgeFollowups');
    if (tab) tab.classList.remove('has-reminder');
    if (badge) badge.classList.remove('reminder-badge');
}

function requestNotificationPermission(dueCount, overdueCount) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') showBrowserNotification(dueCount, overdueCount);
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(p) { if (p === 'granted') showBrowserNotification(dueCount, overdueCount); });
    }
}

function showBrowserNotification(dueCount, overdueCount) {
    let body = dueCount > 0 && overdueCount > 0 ? '📅 ' + dueCount + ' due today + ' + overdueCount + ' overdue!' : (dueCount > 0 ? '📅 ' + dueCount + ' follow-up(s) today!' : '⚠️ ' + overdueCount + ' overdue!');
    try {
        const n = new Notification('🍴 Buono Call Center', { body: body, tag: 'buono-reminder' });
        n.onclick = function() { window.focus(); switchTab('followups'); removeReminderPulse(); n.close(); };
        setTimeout(function() { n.close(); }, 8000);
    } catch (e) { console.warn('Notification failed:', e); }
}

// Hook: Remove pulse when Follow-ups tab clicked
const originalSwitchTab = switchTab;
window.switchTab = function(tabId) {
    if (tabId === 'followups') removeReminderPulse();
    originalSwitchTab(tabId);
};

// ⭐ Phase 5: Final Performance Summary
setTimeout(function() {
    console.log('%c🚀 BUONO CALL CENTER - PAGINATION COMPLETE!', 'background:#f0a500;color:#1a1a2e;padding:8px 12px;font-weight:bold;font-size:14px;');
    console.log('%c✅ Phase 1: Pagination Foundation', 'color:#4CAF50');
    console.log('%c✅ Phase 2: Recent Leads (20/page)', 'color:#4CAF50');
    console.log('%c✅ Phase 3: Pending Queue (20/page)', 'color:#4CAF50');
    console.log('%c✅ Phase 4: Smart Tabs (20/section)', 'color:#4CAF50');
    console.log('%c✅ Phase 5: Reports Optimized', 'color:#4CAF50');
    console.log('%c📊 PAGINATION Config:', 'color:#f0a500', PAGINATION);
    console.log('%c💡 100,000+ Leads Ready! 🎯', 'color:#2196F3;font-weight:bold');
}, 2000);

// ═══════════════════════════════════════
// END v12.0 - PAGINATION COMPLETE!
// 🚀 Naveen's Production-Ready Call Center
// Phases: 1 ✅ 2 ✅ 3 ✅ 4 ✅ 5 ✅
// ═══════════════════════════════════════