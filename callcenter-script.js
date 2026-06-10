// ═══════════════════════════════════════════════════════
// CALL CENTER SCRIPT - Buono Project v10.5 (Phase 1)
// File: callcenter-script.js
// ✅ Country Selector (Foreign Numbers)
// ✅ Call Attempts Tracking
// ✅ Auto Move to Hold Warning
// ✅ WhatsApp Preview Modal
// ✅ Multi-template WhatsApp
// ═══════════════════════════════════════════════════════

// ── GLOBAL STATE ──
let currentUser = null;
let allLeads = [];
let filteredLeads = [];
let selectedLeadId = null;
let selectedLeadData = null;
let editLeadId = null;
let editCourseId = null;
let editEventId = null;
let deleteLeadId = null;
let holdLeadId = null;
let allCourses = [];
let allEvents = [];
let pendingTodayLeads = [];
let pendingOlderLeads = [];
let maxCallAttempts = 4;
let currentWAType = '';

// ── STATUS CONFIG ──
const STATUSES = [
    { value: 'Need Call',                     label: '📱 Need Call',              cssClass: 'status-need-call' },
    { value: 'Enrolled',                      label: '🟢 Enrolled',               cssClass: 'status-enrolled' },
    { value: 'Might Join',                    label: '🔵 Might Join',             cssClass: 'status-might-join' },
    { value: 'Not Responding',                label: '⚫ Not Responding',          cssClass: 'status-not-responding' },
    { value: 'Unable to join',                label: '🔴 Unable to join',         cssClass: 'status-unable' },
    { value: 'Switch off',                    label: '⚪ Switch off',              cssClass: 'status-switch-off' },
    { value: 'Will join the next intake',     label: '🟡 Will join next intake',  cssClass: 'status-next-intake' },
    { value: 'Call back later',               label: '📞 Call back later',        cssClass: 'status-call-back' },
    { value: 'Not in use',                    label: '❌ Not in use',              cssClass: 'status-not-in-use' },
    { value: 'Will decide and get back to us',label: '🤔 Will decide',            cssClass: 'status-will-decide' },
    { value: 'User busy',                     label: '📵 User busy',              cssClass: 'status-user-busy' },
    { value: 'Hold',                          label: '⏸️ Hold',                   cssClass: 'status-hold' },
    { value: 'Need Attention',                label: '⚠️ Need Attention',          cssClass: 'status-need-attention' }
];

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
async function initializeApp() {
    console.log('🚀 Initializing Call Center v10.5 (Phase 1)...');

    const userData = getCurrentUser();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const userDoc = await db.collection('employees').doc(userData.id).get();
        if (userDoc.exists) {
            const fresh = userDoc.data();
            userData.access = fresh.access;
            userData.permissions = fresh.permissions || {};
            userData.name = fresh.name;
            userData.nickname = fresh.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
        }
    } catch (e) {
        console.warn('Could not refresh user:', e);
    }

    const isAdmin = userData.access === 'Admin';
    const isManager = userData.access === 'Manager';
    const isOperator = userData.access === 'Call Operator';
    const perms = userData.permissions?.callCenterDB || {};
    const hasAccess = isAdmin || isManager || isOperator ||
                      perms.add || perms.view || perms.edit || perms.delete;

    if (!hasAccess) {
        alert('⛔ ඔයාට Call Center Database එකට access නැහැ!');
        window.location.href = 'access.html';
        return;
    }

    currentUser = userData;
    console.log('✅ User:', currentUser.name, '|', currentUser.access);

    initUserUI();
    buildDatabaseSwitcher();
    loadSettings_MaxAttempts();
    loadLeads();
    loadCourses();
    loadEvents();
    loadFollowUps();
    loadCCReports();
}

initializeApp();

// ════════════════════════════════════════
// MAX ATTEMPTS SETTING
// ════════════════════════════════════════
function loadSettings_MaxAttempts() {
    db.collection('settings').doc('callCenter').get()
        .then(function(doc) {
            if (doc.exists) {
                const data = doc.data();
                maxCallAttempts = data.maxAttempts || 4;
            }
            const input = document.getElementById('maxAttempts');
            if (input) input.value = maxCallAttempts;
        })
        .catch(function(e) {
            console.warn('Settings not loaded:', e);
        });
}

function saveMaxAttempts() {
    const input = document.getElementById('maxAttempts');
    const value = parseInt(input.value) || 4;
    
    if (value < 1 || value > 20) {
        showToast('⚠️ 1-20 අතර number එකක් enter කරන්න!', 'warning');
        return;
    }

    db.collection('settings').doc('callCenter').set({
        maxAttempts: value,
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    }, { merge: true })
    .then(function() {
        maxCallAttempts = value;
        showToast('✅ Max attempts set to ' + value, 'success');
    })
    .catch(function(e) {
        console.error('Save settings error:', e);
        showToast('❌ Save failed!', 'error');
    });
}

// ════════════════════════════════════════
// USER UI
// ════════════════════════════════════════
function initUserUI() {
    const badge = document.getElementById('userBadge');
    if (badge) {
        badge.textContent = `👋 Welcome, ${currentUser.name} (${currentUser.access})`;
    }
}

// ════════════════════════════════════════
// DATABASE SWITCHER
// ════════════════════════════════════════
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

        if (d.id === 'callCenterDB' && currentUser.access === 'Call Operator') {
            hasAccess = true;
        }

        if (!d.adminManagerOnly && !hasAccess) return;

        const isCurrent = d.id === 'callCenterDB';
        html += `
            <a href="${d.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}">
                <span>${d.icon}</span>
                <span>${d.name}</span>
                ${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}
            </a>
        `;
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
    document.querySelectorAll('.tab-content').forEach(function(el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(function(el) {
        el.classList.remove('active');
    });

    const content = document.getElementById('content-' + tabId);
    const btn = document.getElementById('tab-' + tabId);
    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');

    if (tabId === 'enrolled')   loadEnrolled();
    if (tabId === 'payments')   loadPayments();
    if (tabId === 'ccReports')  loadCCReports();
    if (tabId === 'settings')   loadSettings();
    if (tabId === 'followups')  loadFollowUps();
    if (tabId === 'callLog')    loadPendingQueue();
}

// ════════════════════════════════════════
// ⭐ PHONE FORMAT (Country-aware!)
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
    let v = input.value.replace(/\D/g, '');
    input.value = v.substring(0, 15);
}

function formatPhoneInputModal(input) {
    let v = input.value.replace(/\D/g, '');
    input.value = v.substring(0, 15);
}

// ════════════════════════════════════════
// LEADS - LOAD & RENDER
// ════════════════════════════════════════
function loadLeads() {
    const tbody = document.getElementById('leadsTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-loading"><div class="loading-spinner"></div>Loading leads...</td></tr>';
    }

    db.collection('leads')
        .orderBy('createdAt', 'desc')
        .onSnapshot(function(snapshot) {
            allLeads = [];
            snapshot.forEach(function(doc) {
                allLeads.push({ id: doc.id, ...doc.data() });
            });
            filteredLeads = [...allLeads];
            renderLeadsTable(filteredLeads);
            updateStats();
            loadFollowUps();
            loadPendingQueue();
        }, function(error) {
            console.error('Leads load error:', error);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="table-empty">❌ Load failed. Refresh කරන්න!</td></tr>';
            }
        });
}

function renderLeadsTable(leads) {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-empty">📭 No leads found</td></tr>';
        return;
    }

    let html = '';
    leads.forEach(function(lead, idx) {
        const statusInfo = getStatusInfo(lead.status || 'Need Call');
        const dateStr = lead.createdAt
            ? formatDate(lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt))
            : '-';
        const attempts = lead.callAttempts || 0;
        const attemptsBadge = getAttemptsBadge(attempts, lead.status);

        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>
                    <strong style="color:#fff;">${escapeHtml(lead.name || 'Unknown')}</strong>
                </td>
                <td>
                    <a href="tel:${lead.phone}" style="color:#2196F3;text-decoration:none;">
                        ${escapeHtml(lead.phone || '-')}
                    </a>
                </td>
                <td>
                    <span class="status-badge ${statusInfo.cssClass}">
                        ${statusInfo.label}
                    </span>
                </td>
                <td>${attemptsBadge}</td>
                <td>${escapeHtml(lead.courseInterest || '-')}</td>
                <td>${dateStr}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon view" onclick="viewLead('${lead.id}')" title="View">👁</button>
                        <button class="btn-icon call" onclick="selectLeadForLog('${lead.id}')" title="Log Call">📞</button>
                        <button class="btn-icon wa" onclick="openWhatsApp('${lead.phone}')" title="WhatsApp">💬</button>
                        <button class="btn-icon edit" onclick="openEditLead('${lead.id}')" title="Edit">✏️</button>
                        <button class="btn-icon delete" onclick="openDeleteLead('${lead.id}', '${escapeHtml(lead.name || 'Lead')}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function getAttemptsBadge(attempts, status) {
    if (status === 'Enrolled') {
        return '<span class="attempts-badge attempts-enrolled">✅ Enrolled</span>';
    }
    if (attempts === 0) {
        return '<span class="attempts-badge attempts-new">📋 New</span>';
    }
    const isNearMax = attempts >= maxCallAttempts - 1;
    const isAtMax = attempts >= maxCallAttempts;
    
    let cssClass = 'attempts-normal';
    if (isAtMax) cssClass = 'attempts-max';
    else if (isNearMax) cssClass = 'attempts-warning';
    
    return `<span class="attempts-badge ${cssClass}">📞 ${attempts}/${maxCallAttempts}</span>`;
}

// ════════════════════════════════════════
// PENDING QUEUE SYSTEM
// ════════════════════════════════════════
function loadPendingQueue() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allPending = allLeads.filter(function(lead) {
        return lead.status === 'Need Call';
    });

    pendingTodayLeads = [];
    pendingOlderLeads = [];

    allPending.forEach(function(lead) {
        if (!lead.createdAt) {
            pendingOlderLeads.push(lead);
            return;
        }

        const leadDate = lead.createdAt.toDate
            ? lead.createdAt.toDate()
            : new Date(lead.createdAt);

        if (leadDate >= todayStart) {
            pendingTodayLeads.push(lead);
        } else {
            pendingOlderLeads.push(lead);
        }
    });

    pendingTodayLeads.sort(function(a, b) {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return aTime - bTime;
    });

    pendingOlderLeads.sort(function(a, b) {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return aTime - bTime;
    });

    renderPendingQueue();
    updatePendingStats();
}

function renderPendingQueue() {
    renderPendingSection('todayPendingList', pendingTodayLeads, true);
    setEl('todayPendingCount', pendingTodayLeads.length);

    renderPendingSection('olderPendingList', pendingOlderLeads, false);
    setEl('olderPendingCount', pendingOlderLeads.length);
}

function renderPendingSection(containerId, leads, isToday) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (leads.length === 0) {
        container.innerHTML = `
            <div class="pending-empty">
                <div class="pending-empty-icon">${isToday ? '🎉' : '✅'}</div>
                <p>${isToday ? 'අද add කරපු leads නෑ' : 'පරණ pending leads නෑ'}</p>
            </div>
        `;
        return;
    }

    let html = '';
    leads.forEach(function(lead) {
        const timeAgo = getTimeAgo(lead.createdAt);
        const phoneDisplay = lead.phone || 'No phone';
        const isSelected = selectedLeadId === lead.id;
        const attempts = lead.callAttempts || 0;
        const attemptsBadge = attempts > 0 ? 
            `<span class="pending-attempts">📞 ${attempts}/${maxCallAttempts}</span>` : '';

        html += `
            <div class="pending-item ${isSelected ? 'selected' : ''}" 
                 onclick="selectLeadForLog('${lead.id}')">
                <div class="pending-item-header">
                    <span class="pending-item-name">👤 ${escapeHtml(lead.name || 'Unknown')}</span>
                    <span class="pending-item-time">${timeAgo}</span>
                </div>
                <div class="pending-item-phone">
                    📱 ${escapeHtml(phoneDisplay)}
                    ${attemptsBadge}
                </div>
                <div class="pending-item-actions">
                    <button class="btn-call-now" onclick="event.stopPropagation(); selectLeadForLog('${lead.id}')">
                        📞 Call Now
                    </button>
                    <button class="btn-wa-quick" onclick="event.stopPropagation(); openWhatsApp('${lead.phone}')">
                        💬
                    </button>
                </div>
            </div>
        `;
    });

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

    const todayRemaining = pendingTodayLeads.length;
    const todayCalled = todayAdded - todayRemaining;
    const olderPending = pendingOlderLeads.length;

    setEl('psTodayAdded', todayAdded);
    setEl('psTodayCalled', todayCalled);
    setEl('psTodayRemaining', todayRemaining);
    setEl('psOlderPending', olderPending);
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
// ⭐ QUICK ADD (with Country Selector!)
// ════════════════════════════════════════
function quickAddLead() {
    const countrySelect = document.getElementById('quickCountry');
    const phoneInput = document.getElementById('quickPhone');
    const nameInput = document.getElementById('quickName');

    const countryCode = countrySelect.value;
    const phone = phoneInput.value.trim().replace(/\D/g, '');
    const name = nameInput.value.trim();

    if (!phone || phone.length < 6) {
        showToast('📱 Valid phone number enter කරන්න!', 'warning');
        phoneInput.focus();
        return;
    }

    // Build full phone number
    let fullPhone;
    if (countryCode === '+0') {
        // Custom - use as-is with + prefix
        fullPhone = '+' + phone;
    } else {
        fullPhone = countryCode + phone;
    }

    // Check duplicate
    const duplicate = allLeads.find(function(l) {
        return l.phone === fullPhone;
    });

    if (duplicate) {
        showToast('⚠️ ' + fullPhone + ' already exists! (' + (duplicate.name || 'Unknown') + ')', 'warning');
        return;
    }

    const leadData = {
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
    };

    db.collection('leads').add(leadData)
        .then(function() {
            showToast('✅ Lead added: ' + fullPhone, 'success');
            phoneInput.value = '';
            nameInput.value = '';
            phoneInput.focus();
        })
        .catch(function(error) {
            console.error('Quick add error:', error);
            showToast('❌ Add failed!', 'error');
        });
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
// LEAD MODAL (Add/Edit with Country!)
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

    // Detect country code from phone
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
    const status = document.getElementById('mlStatus').value;
    const courseInterest = document.getElementById('mlCourse').value;
    const source = document.getElementById('mlSource').value;
    const eventId = document.getElementById('mlEvent').value;
    const notes = document.getElementById('mlNotes').value.trim();

    if (!name) {
        showToast('👤 Name required!', 'warning');
        return;
    }
    if (!phoneRaw || phoneRaw.length < 6) {
        showToast('📱 Valid phone required!', 'warning');
        return;
    }

    const phone = country === '+0' ? '+' + phoneRaw : country + phoneRaw;

    const duplicate = allLeads.find(function(l) {
        return l.phone === phone && l.id !== editLeadId;
    });

    if (duplicate) {
        showToast('⚠️ Phone already exists: ' + (duplicate.name || 'Unknown'), 'warning');
        return;
    }

    const data = {
        name: name,
        phone: phone,
        countryCode: country,
        status: status,
        courseInterest: courseInterest,
        source: source,
        eventId: eventId,
        notes: notes,
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

    promise
        .then(function() {
            showToast(editLeadId ? '✅ Lead updated!' : '✅ Lead added!', 'success');
            closeModal('leadModal');
        })
        .catch(function(error) {
            console.error('Save lead error:', error);
            showToast('❌ Save failed!', 'error');
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

    const dateStr = lead.createdAt
        ? formatDate(lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt))
        : '-';
    
    const attempts = lead.callAttempts || 0;

    let historyHtml = '';
    if (lead.callHistory && lead.callHistory.length > 0) {
        const sorted = [...lead.callHistory].sort(function(a, b) {
            return (b.timestamp || 0) - (a.timestamp || 0);
        });
        sorted.forEach(function(h) {
            historyHtml += `
                <div class="history-item">
                    <div class="history-header">
                        <span class="status-badge ${getStatusInfo(h.status).cssClass}">${getStatusInfo(h.status).label}</span>
                        <span class="history-date">${h.dateStr || '-'}</span>
                        <span class="history-operator">👤 ${escapeHtml(h.operator || '-')}</span>
                    </div>
                    <div class="history-notes">${escapeHtml(h.notes || '')}</div>
                </div>
            `;
        });
    } else {
        historyHtml = '<div style="color:#888;text-align:center;padding:16px;">No call history</div>';
    }

    // WhatsApp history
    let waHtml = '';
    if (lead.whatsappHistory && lead.whatsappHistory.length > 0) {
        lead.whatsappHistory.slice(-5).reverse().forEach(function(w) {
            waHtml += `
                <div style="background:#0f3460;padding:8px 12px;border-radius:6px;margin-bottom:6px;">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#25D366;">✅✅✅ ${escapeHtml(w.type)}</span>
                        <span style="color:#888;font-size:0.75rem;">${w.dateStr || '-'}</span>
                    </div>
                    <div style="color:#888;font-size:0.8rem;margin-top:3px;">${escapeHtml(w.preview || '')}</div>
                </div>
            `;
        });
    }

    document.getElementById('viewLeadBody').innerHTML = `
        <div class="lead-detail-grid">
            <div class="lead-detail-item">
                <label>👤 Name</label>
                <span>${escapeHtml(lead.name || '-')}</span>
            </div>
            <div class="lead-detail-item">
                <label>📱 Phone</label>
                <span><a href="tel:${lead.phone}" style="color:#2196F3">${escapeHtml(lead.phone || '-')}</a></span>
            </div>
            <div class="lead-detail-item">
                <label>📊 Status</label>
                <span class="status-badge ${statusInfo.cssClass}">${statusInfo.label}</span>
            </div>
            <div class="lead-detail-item">
                <label>📞 Call Attempts</label>
                <span>${getAttemptsBadge(attempts, lead.status)}</span>
            </div>
            <div class="lead-detail-item">
                <label>🎓 Course</label>
                <span>${escapeHtml(lead.courseInterest || '-')}</span>
            </div>
            <div class="lead-detail-item">
                <label>📡 Source</label>
                <span>${escapeHtml(lead.source || '-')}</span>
            </div>
            <div class="lead-detail-item">
                <label>📅 Added</label>
                <span>${dateStr}</span>
            </div>
        </div>
        ${lead.notes ? `<div style="background:#0f3460;padding:10px 14px;border-radius:8px;margin-bottom:16px;">
            <label style="font-size:0.75rem;color:#888;display:block;margin-bottom:4px;">📝 Notes</label>
            <span style="color:#ccc;font-size:0.9rem;">${escapeHtml(lead.notes)}</span>
        </div>` : ''}
        
        ${waHtml ? `<div style="margin-bottom:16px;">
            <div style="font-weight:600;color:#25D366;margin-bottom:10px;">📲 WhatsApp Sent History</div>
            ${waHtml}
        </div>` : ''}
        
        <div>
            <div style="font-weight:600;color:#f0a500;margin-bottom:10px;">📜 Call History</div>
            ${historyHtml}
        </div>
    `;

    openModal('viewLeadModal');
}

function editFromView() {
    if (!selectedLeadData) return;
    closeModal('viewLeadModal');
    openEditLead(selectedLeadData.id);
}

// ════════════════════════════════════════
// DELETE LEAD
// ════════════════════════════════════════
function openDeleteLead(leadId, leadName) {
    deleteLeadId = leadId;
    document.getElementById('deleteLeadName').textContent = leadName;
    openModal('deleteModal');
}

function confirmDelete() {
    if (!deleteLeadId) return;

    db.collection('leads').doc(deleteLeadId).delete()
        .then(function() {
            showToast('🗑️ Lead deleted!', 'success');
            closeModal('deleteModal');
            deleteLeadId = null;
        })
        .catch(function(error) {
            console.error('Delete error:', error);
            showToast('❌ Delete failed!', 'error');
        });
}

// ════════════════════════════════════════
// STATS
// ════════════════════════════════════════
function updateStats() {
    const total     = allLeads.length;
    const enrolled  = allLeads.filter(function(l) { return l.status === 'Enrolled'; }).length;
    const mightJoin = allLeads.filter(function(l) { return l.status === 'Might Join'; }).length;
    const needCall  = allLeads.filter(function(l) { return l.status === 'Need Call'; }).length;
    const followUp  = allLeads.filter(function(l) { return l.followUpDate; }).length;

    setEl('statTotal',    total);
    setEl('statEnrolled', enrolled);
    setEl('statMightJoin',mightJoin);
    setEl('statNeedCall', needCall);
    setEl('statFollowUp', followUp);
}

// ════════════════════════════════════════
// CALL LOG
// ════════════════════════════════════════
function searchForLog() {
    const query = (document.getElementById('logSearchInput').value || '').toLowerCase().trim();
    const results = document.getElementById('logSearchResults');

    if (!query || query.length < 2) {
        results.classList.remove('show');
        return;
    }

    const found = allLeads.filter(function(lead) {
        return (lead.name || '').toLowerCase().includes(query) ||
               (lead.phone || '').toLowerCase().includes(query);
    }).slice(0, 8);

    if (found.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color:#888;">No leads found</div>';
        results.classList.add('show');
        return;
    }

    let html = '';
    found.forEach(function(lead) {
        const statusInfo = getStatusInfo(lead.status || 'Need Call');
        html += `
            <div class="search-result-item" onclick="selectLeadForLog('${lead.id}')">
                <div class="search-result-name">${escapeHtml(lead.name || 'Unknown')}</div>
                <div class="search-result-phone">${escapeHtml(lead.phone || '')} · <span class="status-badge ${statusInfo.cssClass}">${statusInfo.label}</span></div>
            </div>
        `;
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

    const infoDiv = document.getElementById('selectedLeadInfo');
    if (infoDiv) infoDiv.style.display = 'block';

    setEl('selLeadName', escapeHtml(lead.name || 'Unknown'));
    setEl('selLeadPhone', lead.phone || '-');

    const attempts = lead.callAttempts || 0;
    setEl('selLeadAttempts', '📞 Attempts: ' + attempts + '/' + maxCallAttempts);

    const statusInfo = getStatusInfo(lead.status || 'Need Call');
    const selStatus = document.getElementById('selLeadStatus');
    if (selStatus) {
        selStatus.innerHTML = 'Current: <span class="status-badge ' + statusInfo.cssClass + '">' + statusInfo.label + '</span>';
    }

    setInput('logName', lead.name || '');
    setInput('logPhone', lead.phone || '');
    setSelect('logStatus', lead.status || 'Need Call');
    setSelect('logCourse', lead.courseInterest || '');

    showEl('callLogForm');
    hideEl('noLeadMsg');
    showEl('waActions');

    const historySection = document.getElementById('callHistorySection');
    if (historySection) historySection.style.display = 'block';

    loadCallHistory(lead);
    switchTab('callLog');
    renderPendingQueue();

    if (window.innerWidth < 768) {
        document.querySelector('.calllog-form-panel')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function loadCallHistory(lead) {
    const historyList = document.getElementById('callHistoryList');
    if (!historyList) return;

    const history = lead.callHistory || [];

    if (history.length === 0) {
        historyList.innerHTML = '<div class="no-history"><div>📞</div><p>No call history yet</p></div>';
        return;
    }

    const sorted = [...history].sort(function(a, b) {
        return (b.timestamp || 0) - (a.timestamp || 0);
    });

    let html = '';
    sorted.forEach(function(h) {
        const statusInfo = getStatusInfo(h.status || 'Need Call');
        html += `
            <div class="history-item">
                <div class="history-header">
                    <span class="status-badge ${statusInfo.cssClass}">${statusInfo.label}</span>
                    <span class="history-date">${h.dateStr || '-'}</span>
                    <span class="history-operator">👤 ${escapeHtml(h.operator || '-')}</span>
                </div>
                <div class="history-notes">${escapeHtml(h.notes || '')}</div>
                ${h.followUpDate ? '<div class="history-status-change">📅 Follow-up: ' + h.followUpDate + '</div>' : ''}
            </div>
        `;
    });

    historyList.innerHTML = html;
}

function saveCallLog() {
    if (!selectedLeadId) {
        showToast('❌ Lead select කරන්න!', 'warning');
        return;
    }

    const name       = document.getElementById('logName').value.trim();
    const status     = document.getElementById('logStatus').value;
    const course     = document.getElementById('logCourse').value;
    const followUp   = document.getElementById('logFollowUp').value;
    const notes      = document.getElementById('logNotes').value.trim();
    const source     = document.getElementById('logSource').value;
    const eventId    = document.getElementById('logEvent').value;

    if (!notes) {
        showToast('📝 Call notes enter කරන්න!', 'warning');
        return;
    }

    const now = new Date();
    const historyEntry = {
        status: status,
        notes: notes,
        followUpDate: followUp || null,
        operator: currentUser.nickname || currentUser.name,
        dateStr: formatDateTime(now),
        timestamp: now.getTime()
    };

    // ⭐ ATTEMPT COUNTER LOGIC
    let newAttempts = selectedLeadData.callAttempts || 0;
    
    // Only count if status is "Need Call" (before status change)
    if (selectedLeadData.status === 'Need Call') {
        newAttempts += 1;
    }

    const updateData = {
        name: name,
        status: status,
        courseInterest: course,
        source: source,
        eventId: eventId,
        followUpDate: followUp || null,
        callAttempts: newAttempts,
        callHistory: firebase.firestore.FieldValue.arrayUnion(historyEntry),
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    };

    db.collection('leads').doc(selectedLeadId).update(updateData)
    .then(function() {
        showToast('✅ Call logged!', 'success');

        // ⭐ Check if attempts reached max AND still "Need Call"
        if (status === 'Need Call' && newAttempts >= maxCallAttempts) {
            // Show hold warning modal
            showHoldWarning(selectedLeadId, name, newAttempts);
        } else {
            // Auto-next lead
            autoLoadNextLead();
        }
    })
    .catch(function(error) {
        console.error('Save call log error:', error);
        showToast('❌ Save failed!', 'error');
    });
}

// ⭐ HOLD WARNING SYSTEM
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
        updatedBy: currentUser.nickname || currentUser.name,
        movedToHoldAt: getServerTimestamp(),
        movedToHoldReason: 'Max attempts reached'
    })
    .then(function() {
        showToast('⏸️ Moved to Hold!', 'success');
        closeModal('holdWarningModal');
        holdLeadId = null;
        autoLoadNextLead();
    })
    .catch(function(e) {
        showToast('❌ Update failed!', 'error');
    });
}

function autoLoadNextLead() {
    setTimeout(function() {
        loadPendingQueue();

        let nextLead = null;
        if (pendingTodayLeads.length > 0) {
            nextLead = pendingTodayLeads[0];
        } else if (pendingOlderLeads.length > 0) {
            nextLead = pendingOlderLeads[0];
        }

        if (nextLead && nextLead.id !== selectedLeadId) {
            showToast('⚡ Next lead loaded: ' + (nextLead.name || 'Unknown'), 'info');
            selectLeadForLog(nextLead.id);
        } else {
            showToast('🎉 All pending calls done!', 'success');
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

    const historySection = document.getElementById('callHistorySection');
    if (historySection) historySection.style.display = 'none';

    const historyEl = document.getElementById('callHistoryList');
    if (historyEl) {
        historyEl.innerHTML = '<div class="no-history"><div>📞</div><p>Lead select කරන්න</p></div>';
    }

    if (document.getElementById('logNotes')) document.getElementById('logNotes').value = '';
    if (document.getElementById('logFollowUp')) document.getElementById('logFollowUp').value = '';

    renderPendingQueue();
}

// ════════════════════════════════════════
// ⭐ WHATSAPP PREVIEW SYSTEM (NEW!)
// ════════════════════════════════════════

function openWAPreview(type) {
    if (!selectedLeadData) {
        showToast('⚠️ Lead select කරන්න!', 'warning');
        return;
    }

    currentWAType = type;

    // Set phone and name preview
    setEl('waPreviewPhone', selectedLeadData.phone || '-');
    setEl('waPreviewName', selectedLeadData.name || '-');

    // Show/hide multi-select section
    const multiSelect = document.getElementById('waMultiSelect');
    if (type === 'multi') {
        multiSelect.style.display = 'block';
        // Reset checkboxes to default
        document.getElementById('waInclude_course').checked = true;
        document.getElementById('waInclude_payment').checked = false;
        document.getElementById('waInclude_notes').checked = false;
        document.getElementById('waInclude_confirmation').checked = false;
        document.getElementById('waInclude_followup').checked = false;
    } else {
        multiSelect.style.display = 'none';
    }

    // Build message
    rebuildWAMessage();

    openModal('waPreviewModal');
}

function rebuildWAMessage() {
    if (!selectedLeadData) return;

    const lead = selectedLeadData;
    const name = lead.name || 'there';
    const phone = lead.phone || '';
    const course = lead.courseInterest || '';
    const notes = document.getElementById('logNotes')?.value?.trim() || '';

    let msg = `Hi ${name}! 👋\n\n`;

    if (currentWAType === 'course') {
        msg += buildCourseSection(course);
    } else if (currentWAType === 'payment') {
        msg += buildPaymentSection();
    } else if (currentWAType === 'confirmation') {
        msg += buildConfirmationSection();
    } else if (currentWAType === 'multi') {
        // Multi-template - check selected
        if (document.getElementById('waInclude_course')?.checked) {
            msg += buildCourseSection(course) + '\n';
        }
        if (document.getElementById('waInclude_payment')?.checked) {
            msg += buildPaymentSection() + '\n';
        }
        if (document.getElementById('waInclude_notes')?.checked && notes) {
            msg += `📝 *Our Discussion:*\n${notes}\n\n`;
        }
        if (document.getElementById('waInclude_confirmation')?.checked) {
            msg += buildConfirmationSection() + '\n';
        }
        if (document.getElementById('waInclude_followup')?.checked) {
            msg += `📅 We will follow up with you soon.\n\n`;
        }
    }

    msg += `\n🏫 Buono Academy - SCA Certified\n☕ Thank you!`;

    document.getElementById('waPreviewText').value = msg;
}

function buildCourseSection(courseName) {
    if (!courseName) {
        return `Thank you for your interest in Buono Academy! 🎓\n\nPlease let us know which course you're interested in.\n\n`;
    }
    
    const c = allCourses.find(function(c) { return c.name === courseName; });
    let section = `Thank you for your interest in Buono Academy! 🎓\n\n`;
    section += `📚 *${courseName}*\n`;
    
    if (c) {
        const balance = c.fee - c.downPayment;
        const install = Math.round(balance / 2);
        section += `💰 Course Fee: Rs. ${c.fee.toLocaleString()}\n`;
        section += `⬇️ Down Payment: Rs. ${c.downPayment.toLocaleString()}\n`;
        section += `📅 Installment 1: Rs. ${install.toLocaleString()}\n`;
        section += `📅 Installment 2: Rs. ${install.toLocaleString()}\n`;
    }
    
    return section + '\n';
}

function buildPaymentSection() {
    let section = `💳 *Payment Details*\n\n`;
    section += `🏦 Bank: Commercial Bank\n`;
    section += `👤 Account Name: Buono Cafe\n`;
    section += `🔢 Account No: [Your Account Number]\n`;
    section += `🏛️ Branch: [Branch Name]\n\n`;
    section += `📸 Please send the payment slip after transfer.\n`;
    return section + '\n';
}

function buildConfirmationSection() {
    return `✅ *Enrollment Confirmed!*\n\nWelcome to Buono Academy! We are excited to have you join us. 🎓\n\n📅 We will contact you with course start details soon.\n\n`;
}

function sendWAFromPreview() {
    if (!selectedLeadData) return;
    
    const phone = (selectedLeadData.phone || '').replace(/\D/g, '');
    const msg = document.getElementById('waPreviewText').value;
    
    if (!msg.trim()) {
        showToast('⚠️ Message empty!', 'warning');
        return;
    }

    // Open WhatsApp
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');

    // Track sent message in lead
    const now = new Date();
    const waEntry = {
        type: currentWAType,
        sentBy: currentUser.nickname || currentUser.name,
        dateStr: formatDateTime(now),
        timestamp: now.getTime(),
        preview: msg.substring(0, 100) + (msg.length > 100 ? '...' : '')
    };

    db.collection('leads').doc(selectedLeadId).update({
        whatsappHistory: firebase.firestore.FieldValue.arrayUnion(waEntry),
        lastWhatsAppSent: getServerTimestamp(),
        updatedAt: getServerTimestamp()
    })
    .then(function() {
        showToast('✅✅✅ WhatsApp sent & tracked!', 'success');
        closeModal('waPreviewModal');
    })
    .catch(function(e) {
        console.error('WA track error:', e);
    });
}

// ════════════════════════════════════════
// ENROLLED TAB
// ════════════════════════════════════════
function loadEnrolled() {
    const tbody = document.getElementById('enrolledTableBody');
    if (!tbody) return;

    const enrolled = allLeads.filter(function(l) { return l.status === 'Enrolled'; });
    setEl('enrolledCount', enrolled.length);

    if (enrolled.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-empty">📭 No enrolled students yet</td></tr>';
        return;
    }

    let html = '';
    enrolled.forEach(function(lead, idx) {
        const dateStr = lead.updatedAt
            ? formatDate(lead.updatedAt.toDate ? lead.updatedAt.toDate() : new Date(lead.updatedAt))
            : '-';
        const pStatus = getPaymentStatus(lead);
        const waCount = (lead.whatsappHistory || []).length;
        const waBadge = waCount > 0 ? 
            `<span style="color:#25D366;">✅✅✅ ${waCount}</span>` : 
            `<span style="color:#888;">-</span>`;

        html += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong style="color:#fff;">${escapeHtml(lead.name || '-')}</strong></td>
                <td><a href="tel:${lead.phone}" style="color:#2196F3">${escapeHtml(lead.phone || '-')}</a></td>
                <td>${escapeHtml(lead.courseInterest || '-')}</td>
                <td>${dateStr}</td>
                <td><span class="payment-status ${pStatus.css}">${pStatus.label}</span></td>
                <td>${waBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon view" onclick="viewLead('${lead.id}')">👁</button>
                        <button class="btn-icon wa" onclick="openWhatsApp('${lead.phone}')">💬</button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function getPaymentStatus(lead) {
    if (!lead.payment) return { label: '⏳ Pending', css: 'payment-pending' };
    const p = lead.payment;
    if (p.installment2Paid) return { label: '✅ Fully Paid', css: 'payment-paid' };
    if (p.installment1Paid) return { label: '🟡 Install 1 Done', css: 'payment-pending' };
    if (p.downPaid) return { label: '💰 Down Paid', css: 'payment-pending' };
    return { label: '⏳ Pending', css: 'payment-pending' };
}

// ════════════════════════════════════════
// FOLLOW-UPS TAB
// ════════════════════════════════════════
function loadFollowUps() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFollows   = [];
    const upcomingFollows = [];

    allLeads.forEach(function(lead) {
        if (!lead.followUpDate) return;
        const fDate = new Date(lead.followUpDate);
        if (fDate < tomorrow) {
            todayFollows.push(lead);
        } else {
            upcomingFollows.push(lead);
        }
    });

    todayFollows.sort(function(a, b) {
        return new Date(a.followUpDate) - new Date(b.followUpDate);
    });
    upcomingFollows.sort(function(a, b) {
        return new Date(a.followUpDate) - new Date(b.followUpDate);
    });

    renderFollowUpTable('todayFollowUps', todayFollows);
    renderFollowUpTable('upcomingFollowUps', upcomingFollows);
}

function renderFollowUpTable(tbodyId, leads) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="table-empty">📭 No follow-ups</td></tr>';
        return;
    }

    let html = '';
    leads.forEach(function(lead) {
        const statusInfo = getStatusInfo(lead.status || 'Need Call');
        const fDate = lead.followUpDate
            ? new Date(lead.followUpDate).toLocaleString('en-LK')
            : '-';

        html += `
            <tr>
                <td><strong style="color:#fff;">${escapeHtml(lead.name || '-')}</strong></td>
                <td><a href="tel:${lead.phone}" style="color:#2196F3">${escapeHtml(lead.phone || '-')}</a></td>
                <td><span class="status-badge ${statusInfo.cssClass}">${statusInfo.label}</span></td>
                <td>${escapeHtml(lead.courseInterest || '-')}</td>
                <td style="color:#f0a500;">${fDate}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon call" onclick="selectLeadForLog('${lead.id}')">📞</button>
                        <button class="btn-icon wa" onclick="openWhatsApp('${lead.phone}')">💬</button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// ════════════════════════════════════════
// PAYMENTS TAB
// ════════════════════════════════════════
function loadPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    const enrolled = allLeads.filter(function(l) { return l.status === 'Enrolled'; });
    setEl('paymentCount', enrolled.length);

    if (enrolled.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="table-empty">📭 No enrolled students</td></tr>';
        return;
    }

    let html = '';
    enrolled.forEach(function(lead) {
        const course = allCourses.find(function(c) { return c.name === lead.courseInterest; });
        const totalFee  = course ? course.fee : 0;
        const downPmt   = course ? course.downPayment : 0;
        const balance   = totalFee - downPmt;
        const install   = balance > 0 ? Math.round(balance / 2) : 0;

        const p = lead.payment || {};

        html += `
            <tr>
                <td><strong style="color:#fff;">${escapeHtml(lead.name || '-')}</strong></td>
                <td><a href="tel:${lead.phone}" style="color:#2196F3">${escapeHtml(lead.phone || '-')}</a></td>
                <td>${escapeHtml(lead.courseInterest || '-')}</td>
                <td style="color:#f0a500;">${formatCurrency(totalFee)}</td>
                <td>
                    ${formatCurrency(downPmt)}
                    ${p.downPaid
                        ? '<span class="payment-status payment-paid">✅</span>'
                        : `<button class="btn-icon" style="color:#4CAF50" onclick="markPaid('${lead.id}','down')">Pay</button>`
                    }
                </td>
                <td>
                    ${formatCurrency(install)}
                    ${p.installment1Paid
                        ? '<span class="payment-status payment-paid">✅</span>'
                        : `<button class="btn-icon" style="color:#FF9800" onclick="markPaid('${lead.id}','install1')">Pay</button>`
                    }
                </td>
                <td>
                    ${formatCurrency(install)}
                    ${p.installment2Paid
                        ? '<span class="payment-status payment-paid">✅</span>'
                        : `<button class="btn-icon" style="color:#FF9800" onclick="markPaid('${lead.id}','install2')">Pay</button>`
                    }
                </td>
                <td style="color:${getBalanceAmount(totalFee, p, install) > 0 ? '#ff4444' : '#4CAF50'}">
                    ${formatCurrency(getBalanceAmount(totalFee, p, install))}
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon wa" onclick="sendWAPaymentDetailsFor('${lead.id}')">📲</button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
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

    if (type === 'down') {
        updateData['payment.downPaid'] = true;
        updateData['payment.downAmount'] = downAmt;
        updateData['payment.downDate'] = new Date().toISOString();
    } else if (type === 'install1') {
        updateData['payment.installment1Paid'] = true;
        updateData['payment.install1Date'] = new Date().toISOString();
    } else if (type === 'install2') {
        updateData['payment.installment2Paid'] = true;
        updateData['payment.install2Date'] = new Date().toISOString();
    }

    db.collection('leads').doc(leadId).update(updateData)
        .then(function() {
            showToast('✅ Payment marked!', 'success');
            loadPayments();
        })
        .catch(function(error) {
            console.error('Mark paid error:', error);
            showToast('❌ Update failed!', 'error');
        });
}

// ════════════════════════════════════════
// CC REPORTS TAB
// ════════════════════════════════════════
function loadCCReports() {
    const periodEl = document.getElementById('reportPeriod');
    const period = periodEl ? periodEl.value : 'month';

    const now = new Date();
    let fromDate = new Date(0);

    if (period === 'today') {
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filtered = period === 'all'
        ? allLeads
        : allLeads.filter(function(l) {
            if (!l.createdAt) return false;
            const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
            return d >= fromDate;
        });

    const total    = filtered.length;
    const enrolled = filtered.filter(function(l) { return l.status === 'Enrolled'; }).length;
    const might    = filtered.filter(function(l) { return l.status === 'Might Join'; }).length;
    const rate     = total > 0 ? Math.round((enrolled / total) * 100) : 0;

    let revenue = 0;
    filtered.filter(function(l) { return l.status === 'Enrolled'; }).forEach(function(l) {
        const c = allCourses.find(function(c) { return c.name === l.courseInterest; });
        if (c) revenue += c.fee || 0;
    });

    setEl('rsTotalLeads', total);
    setEl('rsEnrolled',   enrolled);
    setEl('rsMightJoin',  might);
    setEl('rsRevenue',    'Rs. ' + revenue.toLocaleString());
    setEl('rsConversion', rate + '%');

    renderStatusBars(filtered);
}

function renderStatusBars(leads) {
    const barsDiv = document.getElementById('statusBars');
    if (!barsDiv) return;

    if (leads.length === 0) {
        barsDiv.innerHTML = '<div style="color:#888;text-align:center;">No data</div>';
        return;
    }

    const counts = {};
    leads.forEach(function(l) {
        const s = l.status || 'Need Call';
        counts[s] = (counts[s] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; });
    const max = sorted[0] ? sorted[0][1] : 1;

    let html = '';
    sorted.forEach(function(entry) {
        const statusInfo = getStatusInfo(entry[0]);
        const pct = Math.round((entry[1] / max) * 100);
        html += `
            <div class="status-bar-item">
                <div class="status-bar-label">${statusInfo.label}</div>
                <div class="status-bar-track">
                    <div class="status-bar-fill" style="width:${pct}%"></div>
                </div>
                <div class="status-bar-count">${entry[1]}</div>
            </div>
        `;
    });
    barsDiv.innerHTML = html;
}

// ════════════════════════════════════════
// COURSES (Settings)
// ════════════════════════════════════════
function loadCourses() {
    db.collection('courses')
        .orderBy('createdAt', 'desc')
        .get()
        .then(function(snapshot) {
            allCourses = [];
            snapshot.forEach(function(doc) {
                allCourses.push({ id: doc.id, ...doc.data() });
            });

            if (allCourses.length === 0) {
                loadDefaultCourses();
            } else {
                populateCourseSelects();
                renderCoursesTable();
            }
        })
        .catch(function(error) {
            console.error('Load courses error:', error);
        });
}

function loadDefaultCourses() {
    const defaults = [
        { name: 'SCA Foundation',    academy: 'SCA', fee: 65000,  downPayment: 20000 },
        { name: 'SCA Intermediate',  academy: 'SCA', fee: 130000, downPayment: 50000 },
        { name: 'SCA Brewing',       academy: 'SCA', fee: 70000,  downPayment: 35000 }
    ];

    const batch = db.batch();
    defaults.forEach(function(course) {
        const ref = db.collection('courses').doc();
        batch.set(ref, {
            ...course,
            createdAt: getServerTimestamp(),
            createdBy: 'System'
        });
    });

    batch.commit()
        .then(function() {
            console.log('✅ Default courses created');
            loadCourses();
        })
        .catch(function(e) {
            console.error('Default courses error:', e);
        });
}

function populateCourseSelects() {
    const selects = ['mlCourse', 'logCourse'];
    selects.forEach(function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const val = el.value;
        el.innerHTML = '<option value="">-- Select Course --</option>';
        allCourses.forEach(function(c) {
            el.innerHTML += `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (Rs.${(c.fee || 0).toLocaleString()})</option>`;
        });
        el.value = val;
    });
}

function renderCoursesTable() {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;

    if (allCourses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No courses yet</td></tr>';
        return;
    }

    let html = '';
    allCourses.forEach(function(course) {
        const balance  = (course.fee || 0) - (course.downPayment || 0);
        const install  = balance > 0 ? Math.round(balance / 2) : 0;
        html += `
            <tr>
                <td><strong style="color:#fff;">${escapeHtml(course.name)}</strong></td>
                <td>${escapeHtml(course.academy || '-')}</td>
                <td style="color:#f0a500;">${formatCurrency(course.fee)}</td>
                <td>${formatCurrency(course.downPayment)}</td>
                <td style="font-size:0.8rem;color:#888;">
                    Install 1: ${formatCurrency(install)}<br>
                    Install 2: ${formatCurrency(install)}
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" onclick="openEditCourse('${course.id}')">✏️</button>
                        <button class="btn-icon delete" onclick="deleteCourse('${course.id}', '${escapeHtml(course.name)}')">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
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
    document.getElementById('installmentPreview').textContent = 'Enter fee & down payment';
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
    calcCourseInstallments();
    openModal('courseModal');
}

function calcCourseInstallments() {
    const fee  = parseFloat(document.getElementById('cFee').value) || 0;
    const down = parseFloat(document.getElementById('cDown').value) || 0;
    const balance = fee - down;
    const install = balance > 0 ? Math.round(balance / 2) : 0;

    const preview = document.getElementById('installmentPreview');
    if (!preview) return;

    if (fee > 0) {
        preview.innerHTML = `
            💰 Total: <strong style="color:#f0a500">Rs. ${fee.toLocaleString()}</strong><br>
            ⬇️ Down: <strong style="color:#4CAF50">Rs. ${down.toLocaleString()}</strong><br>
            📅 Install 1: <strong style="color:#2196F3">Rs. ${install.toLocaleString()}</strong><br>
            📅 Install 2: <strong style="color:#2196F3">Rs. ${install.toLocaleString()}</strong>
        `;
    }
}

function saveCourse() {
    const name  = document.getElementById('cName').value.trim();
    const academy = document.getElementById('cAcademy').value.trim();
    const fee   = parseFloat(document.getElementById('cFee').value) || 0;
    const down  = parseFloat(document.getElementById('cDown').value) || 0;

    if (!name) { showToast('Course name required!', 'warning'); return; }
    if (fee <= 0) { showToast('Valid fee required!', 'warning'); return; }

    const data = {
        name: name,
        academy: academy,
        fee: fee,
        downPayment: down,
        updatedAt: getServerTimestamp()
    };

    let promise;
    if (editCourseId) {
        promise = db.collection('courses').doc(editCourseId).update(data);
    } else {
        data.createdAt = getServerTimestamp();
        data.createdBy = currentUser.nickname || currentUser.name;
        promise = db.collection('courses').add(data);
    }

    promise
        .then(function() {
            showToast(editCourseId ? '✅ Course updated!' : '✅ Course added!', 'success');
            closeModal('courseModal');
            loadCourses();
        })
        .catch(function(e) {
            console.error('Save course error:', e);
            showToast('❌ Save failed!', 'error');
        });
}

function deleteCourse(courseId, courseName) {
    if (!confirm('Delete course: ' + courseName + '?')) return;

    db.collection('courses').doc(courseId).delete()
        .then(function() {
            showToast('🗑️ Course deleted!', 'success');
            loadCourses();
        })
        .catch(function(e) {
            showToast('❌ Delete failed!', 'error');
        });
}

// ════════════════════════════════════════
// EVENTS (Settings)
// ════════════════════════════════════════
function loadEvents() {
    db.collection('events')
        .orderBy('createdAt', 'desc')
        .get()
        .then(function(snapshot) {
            allEvents = [];
            snapshot.forEach(function(doc) {
                allEvents.push({ id: doc.id, ...doc.data() });
            });
            populateEventSelects();
            renderEventsTable();
        })
        .catch(function(e) {
            console.error('Load events error:', e);
        });
}

function populateEventSelects() {
    const selects = ['mlEvent', 'logEvent'];
    selects.forEach(function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const val = el.value;
        el.innerHTML = '<option value="">-- No Campaign --</option>';
        allEvents.forEach(function(ev) {
            el.innerHTML += `<option value="${ev.id}">${escapeHtml(ev.name)} (${ev.platform || ''})</option>`;
        });
        el.value = val;
    });
}

function renderEventsTable() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    if (allEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No campaigns yet</td></tr>';
        return;
    }

    let html = '';
    allEvents.forEach(function(ev) {
        const statusColor = ev.status === 'Active' ? '#4CAF50' : ev.status === 'Paused' ? '#FF9800' : '#888';
        html += `
            <tr>
                <td><strong style="color:#fff;">${escapeHtml(ev.name)}</strong></td>
                <td>${escapeHtml(ev.platform || '-')}</td>
                <td>${ev.startDate || '-'}</td>
                <td style="color:${statusColor}">${ev.status || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" onclick="openEditEvent('${ev.id}')">✏️</button>
                        <button class="btn-icon delete" onclick="deleteEvent('${ev.id}', '${escapeHtml(ev.name)}')">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
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
    const platform = document.getElementById('evPlatform').value;
    const startDate = document.getElementById('evStart').value;
    const status = document.getElementById('evStatus').value;

    if (!name) { showToast('Campaign name required!', 'warning'); return; }

    const data = {
        name: name,
        platform: platform,
        startDate: startDate,
        status: status,
        updatedAt: getServerTimestamp()
    };

    let promise;
    if (editEventId) {
        promise = db.collection('events').doc(editEventId).update(data);
    } else {
        data.createdAt = getServerTimestamp();
        data.createdBy = currentUser.nickname || currentUser.name;
        promise = db.collection('events').add(data);
    }

    promise
        .then(function() {
            showToast(editEventId ? '✅ Campaign updated!' : '✅ Campaign added!', 'success');
            closeModal('eventModal');
            loadEvents();
        })
        .catch(function(e) {
            console.error('Save event error:', e);
            showToast('❌ Save failed!', 'error');
        });
}

function deleteEvent(eventId, name) {
    if (!confirm('Delete campaign: ' + name + '?')) return;
    db.collection('events').doc(eventId).delete()
        .then(function() {
            showToast('🗑️ Deleted!', 'success');
            loadEvents();
        });
}

// ════════════════════════════════════════
// SCRIPTS (Settings)
// ════════════════════════════════════════
function loadScripts() {
    db.collection('callCenterComments')
        .orderBy('createdAt', 'desc')
        .get()
        .then(function(snapshot) {
            const scripts = [];
            snapshot.forEach(function(doc) {
                scripts.push({ id: doc.id, ...doc.data() });
            });
            renderScripts(scripts);
        })
        .catch(function(e) {
            console.error('Load scripts error:', e);
        });
}

function renderScripts(scripts) {
    const list = document.getElementById('scriptsList');
    if (!list) return;

    if (scripts.length === 0) {
        list.innerHTML = '<div class="table-empty">📭 No scripts yet. Add one!</div>';
        return;
    }

    let html = '';
    scripts.forEach(function(s) {
        html += `
            <div class="script-card">
                <div class="script-card-header">
                    <span class="script-title">${escapeHtml(s.title || 'Script')}</span>
                    <span class="script-category">${escapeHtml(s.category || 'Other')}</span>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteScript('${s.id}')">🗑️</button>
                    </div>
                </div>
                <div class="script-content">${escapeHtml(s.content || '')}</div>
            </div>
        `;
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
    const title    = document.getElementById('scTitle').value.trim();
    const category = document.getElementById('scCategory').value;
    const content  = document.getElementById('scContent').value.trim();

    if (!title || !content) {
        showToast('Title & content required!', 'warning');
        return;
    }

    db.collection('callCenterComments').add({
        title: title,
        category: category,
        content: content,
        createdAt: getServerTimestamp(),
        createdBy: currentUser.nickname || currentUser.name
    })
    .then(function() {
        showToast('✅ Script saved!', 'success');
        closeModal('scriptModal');
        loadScripts();
    })
    .catch(function(e) {
        console.error('Save script error:', e);
        showToast('❌ Save failed!', 'error');
    });
}

function deleteScript(scriptId) {
    if (!confirm('Delete this script?')) return;
    db.collection('callCenterComments').doc(scriptId).delete()
        .then(function() {
            showToast('🗑️ Deleted!', 'success');
            loadScripts();
        });
}

function loadSettings() {
    loadCourses();
    loadEvents();
    loadScripts();
    loadSettings_MaxAttempts();
}

// ════════════════════════════════════════
// WHATSAPP UTILITIES
// ════════════════════════════════════════
function openWhatsApp(phone) {
    if (!phone) return;
    const number = phone.replace(/\D/g, '');
    window.open('https://wa.me/' + number, '_blank');
}

function sendWAPaymentDetailsFor(leadId) {
    const lead = allLeads.find(function(l) { return l.id === leadId; });
    if (!lead) return;
    selectedLeadData = lead;
    selectedLeadId = leadId;
    openWAPreview('payment');
}

// ════════════════════════════════════════
// MODAL HELPERS
// ════════════════════════════════════════
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

// ════════════════════════════════════════
// TOAST
// ════════════════════════════════════════
function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3500);
}

// ════════════════════════════════════════
// UTILITY HELPERS
// ════════════════════════════════════════
function getStatusInfo(statusValue) {
    const found = STATUSES.find(function(s) { return s.value === statusValue; });
    return found || { value: statusValue, label: statusValue, cssClass: 'status-need-call' };
}

function setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setInput(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setSelect(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function showEl(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}

function hideEl(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
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

// ════════════════════════════════════════
// END OF callcenter-script.js v10.5 (Phase 1)
// ════════════════════════════════════════