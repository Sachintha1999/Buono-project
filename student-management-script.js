// ════════════════════════════════════════════
// 🎓 STUDENT MANAGEMENT - SCRIPT
// File: student-management-script.js
// Version: 3.0 - Smart Batch! (Cache + PerfTracker + Animations)
// ════════════════════════════════════════════

let currentUser = null;
let allStudents = [];
let filteredStudents = [];
let selectedStudent = null;
let systemSettings = null;
let allCourses = [];
let suspendMode = 'suspend';
let isEditSaving = false;
let isSuspendSaving = false;

// ── Cache Keys ──
const SM_CACHE = {
    SETTINGS: 'sm_settings_v1',
    COURSES:  'sm_courses_v1',
    STUDENTS: 'sm_students_v1'
};

// ════════════════════════════════════════════
// 🚀 INITIALIZATION
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function () {

    // ⚡ PerfTracker start
    PerfTracker.init('Student Management');
    PerfTracker.start('🔐 Auth & Init');

    currentUser = initPage('studentDB', ['Admin', 'Manager', 'Cashier', 'Call Operator']);
    if (!currentUser) return;

    PerfTracker.end('🔐 Auth & Init');
    console.log('✅ User:', currentUser.nickname, '|', currentUser.access);

    // Show skeletons immediately
    showSkeletonStats();
    showSkeletonTable();

    try {
        PerfTracker.start('📦 Parallel Data Load');

        // ⚡ Parallel loading (NOT sequential!)
        await Promise.all([
            loadSettingsCached(),
            loadCoursesCached(),
            loadStudentsCached()
        ]);

        PerfTracker.end('📦 Parallel Data Load');

        // Build UI
        PerfTracker.start('🎨 UI Render');
        buildFilterOptions();
        filteredStudents = [...allStudents];
        renderTable();
        revealStats();
        PerfTracker.end('🎨 UI Render');

        // ⚡ Report!
        PerfTracker.report('Student Management Loaded');
        showToast('✅ Student Management ready!', 'success');

    } catch (error) {
        console.error('❌ Init error:', error);
        showToast('❌ Error loading data!', 'error');
        showTableError();
    }
});

// ════════════════════════════════════════════
// 💾 CACHED LOADERS
// ════════════════════════════════════════════

async function loadSettingsCached() {
    // Try cache first
    const cached = SmartStorage.get(SM_CACHE.SETTINGS);
    if (cached) {
        systemSettings = cached;
        console.log('⚡ Settings from cache!');
        return;
    }

    try {
        systemSettings = await getSystemSettings();
        if (systemSettings) {
            SmartStorage.set(SM_CACHE.SETTINGS, systemSettings, SmartStorage.DURATIONS.LONG);
        }
        console.log('⚙️ Settings loaded from Firebase');
    } catch (e) {
        console.warn('⚠️ Settings load failed');
        systemSettings = null;
    }
}

async function loadCoursesCached() {
    // Try cache first
    const cached = SmartStorage.get(SM_CACHE.COURSES);
    if (cached) {
        allCourses = cached;
        buildEditCourseOptions();
        console.log('⚡ Courses from cache!', allCourses.length);
        return;
    }

    try {
        const snap = await db.collection('courses').get();
        allCourses = [];

        snap.forEach(doc => {
            allCourses.push({ id: doc.id, ...doc.data() });
        });

        allCourses.sort((a, b) => {
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            return aName.localeCompare(bName);
        });

        // Cache for 30 mins (courses don't change often)
        SmartStorage.set(SM_CACHE.COURSES, allCourses, SmartStorage.DURATIONS.LONG);
        buildEditCourseOptions();
        console.log('🎓 Courses loaded from Firebase:', allCourses.length);

    } catch (error) {
        console.error('❌ Course load error:', error);
        allCourses = [];
        buildEditCourseOptions();
    }
}

async function loadStudentsCached() {
    // Try cache first (short cache - students change often)
    const cached = SmartStorage.get(SM_CACHE.STUDENTS);
    if (cached) {
        allStudents = cached;
        updateStats();
        console.log('⚡ Students from cache!', allStudents.length);
        return;
    }

    try {
        const snap = await db.collection('students')
            .orderBy('createdAt', 'desc')
            .get();

        allStudents = [];
        snap.forEach(doc => {
            const data = doc.data();
            if (data.isDeleted === true) return;
            allStudents.push({ docId: doc.id, ...data });
        });

        // Cache for 1 min (short - payment updates matter!)
        SmartStorage.set(SM_CACHE.STUDENTS, allStudents, SmartStorage.DURATIONS.SHORT);
        updateStats();
        console.log('✅ Students loaded from Firebase:', allStudents.length);

    } catch (error) {
        console.error('❌ Student load error:', error);
        allStudents = [];
        throw error;
    }
}

// ════════════════════════════════════════════
// 🔄 HARD REFRESH (clears cache)
// ════════════════════════════════════════════
async function hardRefresh() {
    // Clear all SM caches
    SmartStorage.remove(SM_CACHE.SETTINGS);
    SmartStorage.remove(SM_CACHE.COURSES);
    SmartStorage.remove(SM_CACHE.STUDENTS);

    // Reset UI
    showSkeletonStats();
    showSkeletonTable();
    document.getElementById('resultsInfo').textContent = '⏳ Refreshing...';

    try {
        PerfTracker.start('🔄 Hard Refresh');

        await Promise.all([
            loadSettingsCached(),
            loadCoursesCached(),
            loadStudentsCached()
        ]);

        PerfTracker.end('🔄 Hard Refresh');

        buildFilterOptions();
        filteredStudents = [...allStudents];
        renderTable();
        revealStats();

        showToast('✅ Data refreshed!', 'success');
    } catch (error) {
        console.error('❌ Refresh error:', error);
        showToast('❌ Refresh failed!', 'error');
        showTableError();
    }
}

// Legacy support (Refresh button)
function loadStudents() {
    return hardRefresh();
}

// ════════════════════════════════════════════
// 💀 SKELETON FUNCTIONS
// ════════════════════════════════════════════

function showSkeletonStats() {
    // Hide real stats, show skeletons
    for (let i = 0; i < 5; i++) {
        const sk = document.getElementById(`skStat${i}`);
        const real = document.getElementById(`realStat${i}`);
        if (sk) sk.style.display = 'flex';
        if (real) real.style.display = 'none';
    }
}

function showSkeletonTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const skRows = Array.from({ length: 8 }, (_, i) => `
        <tr class="sk-table-row" style="animation-delay:${i * 0.05}s">
            <td><div class="skeleton skeleton-text sk-w-30" style="width:24px;"></div></td>
            <td><div class="skeleton skeleton-text sk-w-70"></div></td>
            <td><div class="skeleton skeleton-text sk-w-100"></div></td>
            <td><div class="skeleton skeleton-text sk-w-70"></div></td>
            <td><div class="skeleton skeleton-text sk-w-100"></div></td>
            <td><div class="skeleton skeleton-text sk-w-30"></div></td>
            <td><div class="skeleton skeleton-text sk-w-50"></div></td>
            <td><div class="skeleton skeleton-text sk-w-50"></div></td>
            <td><div class="skeleton skeleton-text sk-w-70" style="border-radius:20px;"></div></td>
            <td><div class="skeleton skeleton-text sk-w-50" style="border-radius:20px;"></div></td>
            <td><div class="skeleton skeleton-btn" style="width:70px;height:28px;"></div></td>
        </tr>
    `).join('');

    tbody.innerHTML = skRows;
    document.getElementById('resultsInfo').textContent = '⏳ Loading students...';
}

function showTableError() {
    const tbody = document.getElementById('studentsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="table-loading">
                    ❌ Error loading students. Click 🔄 Refresh to try again.
                </td>
            </tr>`;
    }
    document.getElementById('resultsInfo').textContent = '❌ Load failed.';
}

// ════════════════════════════════════════════
// ✨ REVEAL ANIMATIONS
// ════════════════════════════════════════════

function revealStats() {
    for (let i = 0; i < 5; i++) {
        const sk = document.getElementById(`skStat${i}`);
        const real = document.getElementById(`realStat${i}`);
        if (sk) sk.style.display = 'none';
        if (real) {
            real.style.display = 'flex';
            real.style.animationDelay = `${i * 0.08}s`;
            real.classList.remove('anim-scale-in');
            // Force reflow
            void real.offsetWidth;
            real.classList.add('anim-scale-in');
        }
    }
}

// ════════════════════════════════════════════
// 📊 UPDATE STATS CARDS (with count-up!)
// ════════════════════════════════════════════
function updateStats() {
    const total     = allStudents.length;
    const active    = allStudents.filter(s => s.status === 'Active' || !s.status).length;
    const suspended = allStudents.filter(s => s.status === 'Suspended').length;

    let totalCollection = 0;
    let totalBalance    = 0;

    allStudents.forEach(s => {
        totalCollection += Number(s.totalPaid) || 0;
        totalBalance    += Number(s.balance)   || 0;
    });

    // Count-up animation for numbers
    animateCountUp('statTotal',     0, total,     600);
    animateCountUp('statActive',    0, active,    600);
    animateCountUp('statSuspended', 0, suspended, 600);

    document.getElementById('statTotalCollection').textContent = formatCurrency(totalCollection);
    document.getElementById('statTotalBalance').textContent    = formatCurrency(totalBalance);
}

function animateCountUp(elementId, from, to, duration) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startTime = performance.now();
    const range = to - from;

    function update(currentTime) {
        const elapsed  = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(from + range * eased);
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ════════════════════════════════════════════
// 🔧 BUILD FILTER DROPDOWNS
// ════════════════════════════════════════════
function buildFilterOptions() {
    const batches = [...new Set(allStudents.map(s => s.batchNumber).filter(Boolean))].sort();
    const batchSelect = document.getElementById('filterBatch');
    batchSelect.innerHTML = '<option value="">📦 All Batches</option>';
    batches.forEach(b => {
        batchSelect.innerHTML += `<option value="${escapeHtml(b)}">Batch ${escapeHtml(b)}</option>`;
    });

    const courses = [...new Set(allStudents.map(s => s.courseName).filter(Boolean))].sort();
    const courseSelect = document.getElementById('filterCourse');
    courseSelect.innerHTML = '<option value="">🎓 All Courses</option>';
    courses.forEach(c => {
        courseSelect.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
    });
}

// ════════════════════════════════════════════
// 🔍 FILTER STUDENTS
// ════════════════════════════════════════════
function filterStudents() {
    const search      = document.getElementById('searchInput').value.trim().toLowerCase();
    const filterBatch  = document.getElementById('filterBatch').value;
    const filterCourse = document.getElementById('filterCourse').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const filterPay    = document.getElementById('filterPayment').value;

    const clearBtn = document.getElementById('btnClearSearch');
    if (clearBtn) clearBtn.style.display = search ? 'block' : 'none';

    filteredStudents = allStudents.filter(s => {
        if (search) {
            const searchable = [
                s.studentId, s.name, s.phone,
                s.email, s.courseName, s.batchNumber,
                s.nic, s.academy
            ].join(' ').toLowerCase();
            if (!searchable.includes(search)) return false;
        }

        if (filterBatch  && s.batchNumber !== filterBatch)           return false;
        if (filterCourse && s.courseName  !== filterCourse)           return false;
        if (filterStatus && (s.status || 'Active') !== filterStatus)  return false;
        if (filterPay    && (s.paymentStatus || 'Pending') !== filterPay) return false;

        return true;
    });

    const resultsInfo = document.getElementById('resultsInfo');
    resultsInfo.textContent = filteredStudents.length === allStudents.length
        ? `📋 Total Students: ${allStudents.length}`
        : `🔍 Found: ${filteredStudents.length} / ${allStudents.length} students`;

    const filterTag     = document.getElementById('filterActiveTag');
    const activeFilters = [filterBatch, filterCourse, filterStatus, filterPay].filter(Boolean);
    const totalActive   = activeFilters.length + (search ? 1 : 0);

    if (totalActive > 0) {
        filterTag.style.display  = 'inline-block';
        filterTag.textContent    = `${totalActive} filter(s) active`;
    } else {
        filterTag.style.display = 'none';
    }

    renderTable();
}

// ════════════════════════════════════════════
// 🧹 CLEAR SEARCH + FILTERS
// ════════════════════════════════════════════
function clearSearch() {
    document.getElementById('searchInput').value    = '';
    document.getElementById('filterBatch').value   = '';
    document.getElementById('filterCourse').value  = '';
    document.getElementById('filterStatus').value  = '';
    document.getElementById('filterPayment').value = '';

    const clearBtn = document.getElementById('btnClearSearch');
    if (clearBtn) clearBtn.style.display = 'none';

    filterStudents();
}

// ════════════════════════════════════════════
// 📋 RENDER TABLE (with stagger animation!)
// ════════════════════════════════════════════
function renderTable() {
    const tbody = document.getElementById('studentsTableBody');

    if (filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="table-loading">
                    📭 No students found. Try different filters.
                </td>
            </tr>`;
        document.getElementById('resultsInfo').textContent = '📭 No students match your search.';
        return;
    }

    tbody.innerHTML = filteredStudents.map((s, idx) => {
        const paid    = Number(s.totalPaid) || 0;
        const balance = Number(s.balance)   || 0;

        const payStatus = s.paymentStatus || 'Pending';
        const status    = s.status        || 'Active';

        const payBadgeClass = payStatus === 'Paid'
            ? 'badge-paid'
            : payStatus === 'Partial'
                ? 'badge-partial'
                : 'badge-pending';

        const statusBadgeClass = status === 'Active' ? 'badge-active' : 'badge-suspended';
        const paidClass        = paid    > 0 ? 'amount-paid'    : 'amount-zero';
        const balanceClass     = balance > 0 ? 'amount-balance' : 'amount-zero';

        // Stagger delay (max 600ms)
        const delay = Math.min(idx * 40, 600);

        return `
            <tr class="table-row-anim" style="animation-delay:${delay}ms"
                onclick="openStudentModal('${s.docId}')">
                <td>${idx + 1}</td>
                <td class="student-id-cell">${escapeHtml(s.studentId || '-')}</td>
                <td><strong style="color:#fff;">${escapeHtml(s.name || '-')}</strong></td>
                <td>${escapeHtml(s.phone || '-')}</td>
                <td>${escapeHtml(s.courseName || '-')}</td>
                <td>${s.batchNumber ? escapeHtml(s.batchNumber) : '-'}</td>
                <td class="${paidClass}">${formatCurrency(paid)}</td>
                <td class="${balanceClass}">${formatCurrency(balance)}</td>
                <td><span class="badge ${payBadgeClass}">${escapeHtml(payStatus)}</span></td>
                <td><span class="badge ${statusBadgeClass}">${escapeHtml(status)}</span></td>
                <td>
                    <button class="btn-view"
                        onclick="event.stopPropagation(); openStudentModal('${s.docId}')">
                        👁️ View
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('resultsInfo').textContent =
        filteredStudents.length === allStudents.length
            ? `📋 Total Students: ${allStudents.length}`
            : `🔍 Found: ${filteredStudents.length} / ${allStudents.length} students`;
}

// ════════════════════════════════════════════
// 👁️ OPEN STUDENT MODAL
// ════════════════════════════════════════════
function openStudentModal(docId) {
    const student = allStudents.find(s => s.docId === docId);
    if (!student) {
        showToast('❌ Student not found!', 'error');
        return;
    }

    selectedStudent = { ...student };

    fillModalProfile(selectedStudent);
    fillModalPayments(selectedStudent);
    updateActionButtons(selectedStudent);
    switchModalTab('profile');

    const modal = document.getElementById('studentModal');
    modal.classList.add('show');

    // Animate modal box
    const box = modal.querySelector('.modal-box');
    if (box) {
        box.classList.remove('anim-scale-in');
        void box.offsetWidth;
        box.classList.add('anim-scale-in');
    }
}

// ════════════════════════════════════════════
// 📝 FILL MODAL - PROFILE TAB
// ════════════════════════════════════════════
function fillModalProfile(s) {
    document.getElementById('modalStudentName').textContent = s.name || 'Student';
    document.getElementById('modalStudentId').textContent   = s.studentId || '-';

    const statusBadge = document.getElementById('modalStatusBadge');
    const status      = s.status || 'Active';
    statusBadge.textContent  = status;
    statusBadge.className    = 'modal-status-badge';
    statusBadge.classList.add(status === 'Suspended' ? 'suspended' : 'active');

    const totalFee  = Number(s.totalFee)  || 0;
    const totalPaid = Number(s.totalPaid) || 0;
    const balance   = Number(s.balance)   || 0;
    const progress  = totalFee > 0
        ? Math.min(100, Math.round((totalPaid / totalFee) * 100))
        : 0;

    document.getElementById('modalTotalFee').textContent      = formatCurrency(totalFee);
    document.getElementById('modalTotalPaid').textContent     = formatCurrency(totalPaid);
    document.getElementById('modalBalance').textContent       = formatCurrency(balance);
    document.getElementById('modalPaymentStatus').textContent = s.paymentStatus || 'Pending';

    // Animate progress bar
    setTimeout(() => {
        document.getElementById('modalProgressFill').style.width  = progress + '%';
        document.getElementById('modalProgressLabel').textContent  = progress + '%';
    }, 200);

    // Personal info
    document.getElementById('miName').textContent    = s.name    || '-';
    document.getElementById('miPhone').textContent   = s.phone   || '-';
    document.getElementById('miEmail').textContent   = s.email   || '-';
    document.getElementById('miNIC').textContent     = s.nic     || '-';
    document.getElementById('miAddress').textContent = s.address || '-';
    document.getElementById('miDOB').textContent     = s.dob
        ? formatDateDisplay(s.dob) : '-';

    // Course info
    document.getElementById('miCourse').textContent    = s.courseName       || '-';
    document.getElementById('miAcademy').textContent   = s.academy          || '-';
    document.getElementById('miBatch').textContent     = s.batchNumber      || '-';
    document.getElementById('miSource').textContent    = s.enrollmentSource || '-';
    document.getElementById('miEnrolledBy').textContent = s.enrolledBy      || '-';

    if (s.enrolledDate) {
        const d = getSafeDate(s.enrolledDate);
        document.getElementById('miEnrolledDate').textContent = d ? formatDate(d) : '-';
    } else {
        document.getElementById('miEnrolledDate').textContent = '-';
    }

    // Credentials
    document.getElementById('miStudentId').textContent = s.studentId || '-';
    document.getElementById('miPassword').textContent  = s.password  || '-';

    // Footer audit trail
    let createdInfo = '';
    if (s.createdAt) {
        const d = getSafeDate(s.createdAt);
        if (d) createdInfo = `Enrolled: ${formatDate(d)}`;
    }
    if (s.createdBy) createdInfo += `${createdInfo ? ' | ' : ''}By: ${s.createdBy}`;
    if (s.updatedAt) {
        const u = getSafeDate(s.updatedAt);
        if (u) {
            createdInfo += `${createdInfo ? ' | ' : ''}Updated: ${formatDate(u)}`;
            if (s.updatedBy) createdInfo += ` by ${s.updatedBy}`;
        }
    }

    document.getElementById('modalCreatedInfo').textContent = createdInfo || '-';
}

// ════════════════════════════════════════════
// 💳 FILL MODAL - PAYMENTS TAB
// ════════════════════════════════════════════
function fillModalPayments(s) {
    const totalFee  = Number(s.totalFee)  || 0;
    const totalPaid = Number(s.totalPaid) || 0;
    const balance   = Number(s.balance)   || 0;

    document.getElementById('modalTotalFee2').textContent  = formatCurrency(totalFee);
    document.getElementById('modalTotalPaid2').textContent = formatCurrency(totalPaid);
    document.getElementById('modalBalance2').textContent   = formatCurrency(balance);

    const payments = s.payments || [];
    const listEl   = document.getElementById('modalPaymentList');

    if (payments.length === 0) {
        listEl.innerHTML = `<div class="no-payments">📭 No payment records found.</div>`;
        return;
    }

    const sorted = [...payments].sort((a, b) => {
        const dA = getSafeDate(a.date) || new Date(0);
        const dB = getSafeDate(b.date) || new Date(0);
        return dB - dA;
    });

    const methodLabels = {
        cash:   '💵 Cash',
        bank:   '🏦 Bank Transfer',
        card:   '💳 Card',
        online: '📱 Online'
    };

    listEl.innerHTML = sorted.map((p, idx) => {
        const pDate       = getSafeDate(p.date);
        const methodLabel = methodLabels[p.method] || p.method || '-';

        const discountHtml = (p.discountAmount && Number(p.discountAmount) > 0) ? `
            <div class="payment-detail">
                <span class="payment-detail-label">Discount</span>
                <span class="payment-detail-value" style="color:#ff6b6b;">
                    -${formatCurrency(p.discountAmount)}
                    ${p.discountCode ? `(${escapeHtml(p.discountCode)})` : ''}
                </span>
            </div>` : '';

        const slipHtml = p.slipURL ? `
            <div class="payment-detail">
                <span class="payment-detail-label">Slip</span>
                <span class="payment-detail-value">
                    <a href="${escapeAttr(p.slipURL)}" target="_blank" style="color:#9C27B0;">
                        🔗 View Slip
                    </a>
                </span>
            </div>` : '';

        return `
            <div class="payment-item anim-slide-right"
                 style="animation-delay:${idx * 60}ms">
                <div class="payment-item-header">
                    <span class="payment-receipt-no">🧾 ${escapeHtml(p.receiptNo || 'N/A')}</span>
                    <span class="payment-amount">${formatCurrency(p.amount || 0)}</span>
                </div>
                <div class="payment-item-details">
                    <div class="payment-detail">
                        <span class="payment-detail-label">Type</span>
                        <span class="payment-detail-value">${escapeHtml(p.type || '-')}</span>
                    </div>
                    <div class="payment-detail">
                        <span class="payment-detail-label">Method</span>
                        <span class="payment-detail-value">${escapeHtml(methodLabel)}</span>
                    </div>
                    <div class="payment-detail">
                        <span class="payment-detail-label">Date</span>
                        <span class="payment-detail-value">${pDate ? formatDateTime(pDate) : '-'}</span>
                    </div>
                    ${discountHtml}
                    ${slipHtml}
                    ${p.receivedBy ? `
                    <div class="payment-detail">
                        <span class="payment-detail-label">Received By</span>
                        <span class="payment-detail-value">${escapeHtml(p.receivedBy)}</span>
                    </div>` : ''}
                    ${p.notes ? `
                    <div class="payment-detail">
                        <span class="payment-detail-label">Notes</span>
                        <span class="payment-detail-value">${escapeHtml(p.notes)}</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ════════════════════════════════════════════
// 🎛️ UPDATE ACTION BUTTONS
// ════════════════════════════════════════════
function updateActionButtons(student) {
    const btn = document.getElementById('btnSuspendToggle');
    if (!btn) return;

    const isSuspended = (student.status || 'Active') === 'Suspended';
    btn.classList.remove('is-activate');

    if (isSuspended) {
        btn.innerHTML = '✅ Activate';
        btn.classList.add('is-activate');
    } else {
        btn.innerHTML = '⛔ Suspend';
    }
}

// ════════════════════════════════════════════
// 🔄 SWITCH MODAL TABS
// ════════════════════════════════════════════
function switchModalTab(tabName) {
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`mtab-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.modal-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const activeContent = document.getElementById(`mcontent-${tabName}`);
    if (activeContent) activeContent.classList.add('active');
}

// ════════════════════════════════════════════
// ✕ CLOSE STUDENT MODAL
// ════════════════════════════════════════════
function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('show');
    selectedStudent = null;
    document.getElementById('modalProgressFill').style.width  = '0%';
    document.getElementById('modalProgressLabel').textContent  = '0%';
}

function handleModalClick(event) {
    if (event.target === document.getElementById('studentModal')) {
        closeStudentModal();
    }
}

// ════════════════════════════════════════════
// ✏️ BUILD EDIT COURSE OPTIONS
// ════════════════════════════════════════════
function buildEditCourseOptions(selectedCourseId = '', selectedCourseName = '') {
    const select = document.getElementById('editCourse');
    if (!select) return;

    let html = '<option value="">-- Course තෝරන්න --</option>';

    if (allCourses.length > 0) {
        allCourses.forEach(course => {
            const isSelected = (
                (selectedCourseId && course.id === selectedCourseId) ||
                (!selectedCourseId && selectedCourseName && course.name === selectedCourseName)
            );

            const label = course.academy
                ? `${course.name} (${course.academy})`
                : (course.name || 'Unnamed Course');

            html += `
                <option
                    value="${escapeAttr(course.id)}"
                    data-name="${escapeAttr(course.name || '')}"
                    data-academy="${escapeAttr(course.academy || '')}"
                    ${isSelected ? 'selected' : ''}
                >
                    ${escapeHtml(label)}
                </option>
            `;
        });
    }

    const hasCurrentCourse = allCourses.some(course =>
        course.id === selectedCourseId || course.name === selectedCourseName
    );

    if (selectedCourseName && !hasCurrentCourse) {
        html += `
            <option
                value="${escapeAttr(selectedCourseId || '__current__')}"
                data-name="${escapeAttr(selectedCourseName)}"
                data-academy="${escapeAttr(selectedStudent?.academy || '')}"
                selected
            >
                ${escapeHtml(selectedCourseName)}${selectedStudent?.academy
                    ? ` (${escapeHtml(selectedStudent.academy)})` : ''}
            </option>
        `;
    }

    if (allCourses.length === 0 && !selectedCourseName) {
        html = '<option value="">⚠️ No courses found</option>';
    }

    select.innerHTML = html;
}

// ════════════════════════════════════════════
// ✏️ OPEN EDIT MODAL
// ════════════════════════════════════════════
function openEditModal() {
    if (!selectedStudent) {
        showToast('❌ No student selected!', 'error');
        return;
    }

    buildEditCourseOptions(
        selectedStudent.courseId   || '',
        selectedStudent.courseName || ''
    );

    document.getElementById('editStudentIdLabel').textContent = selectedStudent.studentId || '-';
    document.getElementById('editName').value    = selectedStudent.name    || '';
    document.getElementById('editPhone').value   = selectedStudent.phone   || '';
    document.getElementById('editEmail').value   = selectedStudent.email   || '';
    document.getElementById('editNIC').value     = selectedStudent.nic     || '';
    document.getElementById('editDOB').value     = formatInputDate(selectedStudent.dob);
    document.getElementById('editAddress').value = selectedStudent.address || '';
    document.getElementById('editBatch').value   = selectedStudent.batchNumber || '';

    const courseSelect = document.getElementById('editCourse');
    if (selectedStudent.courseId) {
        courseSelect.value = selectedStudent.courseId;
    } else if (selectedStudent.courseName) {
        const matched = [...courseSelect.options].find(opt =>
            opt.dataset.name === selectedStudent.courseName
        );
        if (matched) courseSelect.value = matched.value;
    }

    const modal = document.getElementById('editModal');
    modal.classList.add('show');

    const box = modal.querySelector('.modal-box');
    if (box) {
        box.classList.remove('anim-scale-in');
        void box.offsetWidth;
        box.classList.add('anim-scale-in');
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

function handleEditModalClick(event) {
    if (event.target === document.getElementById('editModal')) {
        closeEditModal();
    }
}

// ════════════════════════════════════════════
// 💾 SAVE STUDENT EDIT
// ════════════════════════════════════════════
async function saveStudentEdit() {
    if (!selectedStudent || isEditSaving) return;

    const name         = document.getElementById('editName').value.trim();
    const phoneRaw     = document.getElementById('editPhone').value.trim();
    const email        = document.getElementById('editEmail').value.trim();
    const nic          = document.getElementById('editNIC').value.trim();
    const dob          = document.getElementById('editDOB').value;
    const address      = document.getElementById('editAddress').value.trim();
    const batchInput   = document.getElementById('editBatch').value.trim();
    const courseSelect = document.getElementById('editCourse');
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];

    if (!name) {
        showToast('⚠️ Student name අවශ්‍යයි!', 'warning');
        document.getElementById('editName').focus();
        return;
    }
    if (!phoneRaw) {
        showToast('⚠️ Phone number අවශ්‍යයි!', 'warning');
        document.getElementById('editPhone').focus();
        return;
    }
    if (!selectedOption || !courseSelect.value) {
        showToast('⚠️ Course එකක් තෝරන්න!', 'warning');
        document.getElementById('editCourse').focus();
        return;
    }

    const normalizedBatch = normalizeBatch(batchInput);
    if (!normalizedBatch) {
        showToast('⚠️ Batch එක අවශ්‍යයි!', 'warning');
        document.getElementById('editBatch').focus();
        return;
    }

    const normalizedPhone = normalizePhoneForStorage(phoneRaw);
    const courseId        = courseSelect.value;
    const courseName      = selectedOption.dataset.name    || selectedStudent.courseName || '';
    const academy         = selectedOption.dataset.academy || selectedStudent.academy    || '';

    const confirmEdit = confirm(
        `✏️ Student details update කරන්න ඕනද?\n\n` +
        `👤 ${name}\n` +
        `🆔 ${selectedStudent.studentId || '-'}\n` +
        `🎓 ${courseName}\n` +
        `📦 ${normalizedBatch}`
    );

    if (!confirmEdit) {
        showToast('ℹ️ Edit cancelled.', 'info');
        return;
    }

    const btn = document.getElementById('btnSaveEdit');
    isEditSaving  = true;
    btn.disabled  = true;
    btn.innerHTML = '⏳ Saving...';

    try {
        const docId = selectedStudent.docId;

        const updates = {
            name,
            phone:       normalizedPhone,
            email:       email    || '',
            nic:         nic      || '',
            dob:         dob      || '',
            address:     address  || '',
            courseId:    courseId || '',
            courseName:  courseName || '',
            academy:     academy  || '',
            batchNumber: normalizedBatch,
            updatedAt:   getServerTimestamp(),
            updatedBy:   currentUser.nickname || currentUser.name || 'System',
            updatedById: currentUser.id || ''
        };

        await db.collection('students').doc(docId).update(updates);

        // Invalidate student cache
        SmartStorage.remove(SM_CACHE.STUDENTS);

        closeEditModal();
        showToast('✅ Student updated successfully!', 'success');

        // Reload fresh data
        await loadStudentsCached();
        buildFilterOptions();
        filteredStudents = [...allStudents];
        renderTable();
        revealStats();
        openStudentModal(docId);

    } catch (error) {
        console.error('❌ Save edit error:', error);
        showToast('❌ Error saving student details!', 'error');
    } finally {
        isEditSaving  = false;
        btn.disabled  = false;
        btn.innerHTML = '💾 Save Changes';
    }
}

// ════════════════════════════════════════════
// ⛔ OPEN SUSPEND / ACTIVATE MODAL
// ════════════════════════════════════════════
function openSuspendModal() {
    if (!selectedStudent) {
        showToast('❌ No student selected!', 'error');
        return;
    }

    const currentStatus = selectedStudent.status || 'Active';
    const isSuspended   = currentStatus === 'Suspended';
    suspendMode         = isSuspended ? 'activate' : 'suspend';

    document.getElementById('suspendStudentIdLabel').textContent = selectedStudent.studentId || '-';
    document.getElementById('suspendStudentName').textContent    = selectedStudent.name      || '-';
    document.getElementById('suspendStudentCourse').textContent  = selectedStudent.courseName || '-';
    document.getElementById('suspendCurrentStatus').textContent  = currentStatus;
    document.getElementById('suspendReason').value               = selectedStudent.suspendReason || '';

    const title         = document.getElementById('suspendModalTitle');
    const reasonGroup   = document.getElementById('suspendReasonGroup');
    const activateGroup = document.getElementById('activateMessageGroup');
    const btn           = document.getElementById('btnSuspendConfirm');
    const footerInfo    = document.getElementById('suspendFooterInfo');
    const header        = document.getElementById('suspendModalHeader');

    header.classList.remove('activate-mode');

    if (suspendMode === 'suspend') {
        title.textContent        = '⛔ Suspend Student';
        reasonGroup.style.display   = 'block';
        activateGroup.style.display = 'none';
        btn.innerHTML               = '⛔ Suspend Student';
        btn.classList.remove('activate-mode');
        footerInfo.textContent      = '⚠️ Suspend reason එක save වෙනවා';
    } else {
        title.textContent           = '✅ Activate Student';
        reasonGroup.style.display   = 'none';
        activateGroup.style.display = 'block';
        btn.innerHTML               = '✅ Activate Student';
        btn.classList.add('activate-mode');
        header.classList.add('activate-mode');
        footerInfo.textContent      = '✅ Student නැවත Active වෙයි';
    }

    const modal = document.getElementById('suspendModal');
    modal.classList.add('show');

    const box = modal.querySelector('.modal-box');
    if (box) {
        box.classList.remove('anim-scale-in');
        void box.offsetWidth;
        box.classList.add('anim-scale-in');
    }
}

function closeSuspendModal() {
    document.getElementById('suspendModal').classList.remove('show');
}

function handleSuspendModalClick(event) {
    if (event.target === document.getElementById('suspendModal')) {
        closeSuspendModal();
    }
}

// ════════════════════════════════════════════
// ⛔ / ✅ CONFIRM SUSPEND TOGGLE
// ════════════════════════════════════════════
async function confirmSuspendToggle() {
    if (!selectedStudent || isSuspendSaving) return;

    const docId    = selectedStudent.docId;
    const userName = currentUser.nickname || currentUser.name || 'System';

    let updates    = {};
    let confirmMsg = '';

    if (suspendMode === 'suspend') {
        const reason = document.getElementById('suspendReason').value.trim();
        if (!reason) {
            showToast('⚠️ Suspend reason අවශ්‍යයි!', 'warning');
            document.getElementById('suspendReason').focus();
            return;
        }

        confirmMsg =
            `⛔ මේ student suspend කරන්න ඕනද?\n\n` +
            `👤 ${selectedStudent.name || '-'}\n` +
            `🆔 ${selectedStudent.studentId || '-'}\n` +
            `📝 Reason: ${reason}`;

        updates = {
            status:          'Suspended',
            suspendReason:   reason,
            suspendedAt:     getServerTimestamp(),
            suspendedBy:     userName,
            suspendedById:   currentUser.id || '',
            updatedAt:       getServerTimestamp(),
            updatedBy:       userName,
            updatedById:     currentUser.id || ''
        };
    } else {
        confirmMsg =
            `✅ මේ student නැවත activate කරන්න ඕනද?\n\n` +
            `👤 ${selectedStudent.name || '-'}\n` +
            `🆔 ${selectedStudent.studentId || '-'}`;

        updates = {
            status:             'Active',
            lastSuspendReason:  selectedStudent.suspendReason || '',
            suspendReason:      '',
            reactivatedAt:      getServerTimestamp(),
            reactivatedBy:      userName,
            reactivatedById:    currentUser.id || '',
            updatedAt:          getServerTimestamp(),
            updatedBy:          userName,
            updatedById:        currentUser.id || ''
        };
    }

    if (!confirm(confirmMsg)) {
        showToast('ℹ️ Action cancelled.', 'info');
        return;
    }

    const btn      = document.getElementById('btnSuspendConfirm');
    isSuspendSaving = true;
    btn.disabled   = true;
    btn.innerHTML  = suspendMode === 'suspend' ? '⏳ Suspending...' : '⏳ Activating...';

    try {
        await db.collection('students').doc(docId).update(updates);

        // Invalidate student cache
        SmartStorage.remove(SM_CACHE.STUDENTS);

        closeSuspendModal();
        showToast(
            suspendMode === 'suspend'
                ? '✅ Student suspended successfully!'
                : '✅ Student activated successfully!',
            'success'
        );

        // Reload fresh data
        await loadStudentsCached();
        buildFilterOptions();
        filteredStudents = [...allStudents];
        renderTable();
        revealStats();
        openStudentModal(docId);

    } catch (error) {
        console.error('❌ Suspend toggle error:', error);
        showToast('❌ Error updating student status!', 'error');
    } finally {
        isSuspendSaving = false;
        btn.disabled    = false;
        btn.innerHTML   = suspendMode === 'suspend'
            ? '⛔ Suspend Student' : '✅ Activate Student';
    }
}

// ════════════════════════════════════════════
// 💳 GO TO PAYMENT PAGE
// ════════════════════════════════════════════
function goToPayment() {
    if (!selectedStudent) {
        showToast('❌ No student selected!', 'error');
        return;
    }

    try {
        const paymentStudentData = {
            fromStudentManagement: true,
            docId:         selectedStudent.docId         || '',
            studentId:     selectedStudent.studentId     || '',
            name:          selectedStudent.name          || '',
            phone:         selectedStudent.phone         || '',
            email:         selectedStudent.email         || '',
            nic:           selectedStudent.nic           || '',
            dob:           selectedStudent.dob           || '',
            address:       selectedStudent.address       || '',
            batchNumber:   selectedStudent.batchNumber   || '',
            courseId:      selectedStudent.courseId      || '',
            courseName:    selectedStudent.courseName    || '',
            academy:       selectedStudent.academy       || '',
            totalFee:      Number(selectedStudent.totalFee)  || 0,
            totalPaid:     Number(selectedStudent.totalPaid) || 0,
            balance:       Number(selectedStudent.balance)   || 0,
            paymentStatus: selectedStudent.paymentStatus || 'Pending',
            paymentsCount: (selectedStudent.payments    || []).length,
            status:        selectedStudent.status        || 'Active'
        };

        sessionStorage.setItem('selectedPaymentStudent', JSON.stringify(paymentStudentData));
        showToast('💳 Redirecting to Payment page...', 'success');

        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 250);

    } catch (error) {
        console.error('❌ Payment redirect error:', error);
        showToast('❌ Could not open payment page!', 'error');
    }
}

// ════════════════════════════════════════════
// 📱 CONTACT STUDENT VIA WHATSAPP
// ════════════════════════════════════════════
function contactStudentWhatsApp() {
    if (!selectedStudent) return;

    const phone   = selectedStudent.phone || '';
    const waPhone = phone.replace(/\D/g, '');

    if (!waPhone) {
        showToast('❌ Phone number not found!', 'error');
        return;
    }

    const bizName = systemSettings?.businessName || 'Buono';
    let message   = `Hello ${selectedStudent.name}! 👋\n\n`;
    message      += `This is ${bizName} Academy.\n`;
    message      += `Student ID: *${selectedStudent.studentId || '-'}*\n`;

    if ((Number(selectedStudent.balance) || 0) > 0) {
        message += `\n💰 Balance Due: *${formatCurrency(selectedStudent.balance)}*\n`;
        message += `Please contact us to settle your remaining balance.\n`;
    }

    if ((selectedStudent.status || 'Active') === 'Suspended' && selectedStudent.suspendReason) {
        message += `\n⚠️ Account Status: *Suspended*\n`;
        message += `Reason: ${selectedStudent.suspendReason}\n`;
    }

    message += `\nThank you! 🙏`;

    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    showToast('📱 Opening WhatsApp...', 'success');
}

// ════════════════════════════════════════════
// 🍞 TOAST NOTIFICATION
// ════════════════════════════════════════════
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast       = document.createElement('div');
    toast.className   = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ════════════════════════════════════════════
// 🧰 HELPERS
// ════════════════════════════════════════════
function normalizeBatch(value) {
    let batch = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!batch) return '';
    if (!batch.startsWith('W')) {
        batch = 'W' + batch.replace(/^W/i, '');
    }
    return batch;
}

function normalizePhoneForStorage(rawPhone) {
    const raw = String(rawPhone || '').trim();
    if (!raw) return '';

    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';

    if (raw.startsWith('+'))         return '+' + digits;
    if (digits.startsWith('94'))     return '+' + digits;
    if (digits.startsWith('0'))      return '+94' + digits.substring(1);
    if (digits.length === 9)         return '+94' + digits;

    return raw;
}

function formatInputDate(value) {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = getSafeDate(value);
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(value) {
    if (!value) return '-';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const d = new Date(value + 'T00:00:00');
        return isNaN(d.getTime()) ? value : formatDate(d);
    }
    const d = getSafeDate(value);
    return d ? formatDate(d) : String(value);
}

function getSafeDate(value) {
    if (!value) return null;
    try {
        if (value.toDate && typeof value.toDate === 'function') {
            const d = value.toDate();
            return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) {
        return null;
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) { return escapeHtml(value); }

// ── ESC Key ──
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    const editModal    = document.getElementById('editModal');
    const suspendModal = document.getElementById('suspendModal');
    const studentModal = document.getElementById('studentModal');

    if (editModal    && editModal.classList.contains('show'))    { closeEditModal();    return; }
    if (suspendModal && suspendModal.classList.contains('show')) { closeSuspendModal(); return; }
    if (studentModal && studentModal.classList.contains('show')) { closeStudentModal(); }
});

console.log('🎓 student-management-script.js loaded! (v3.0 - Smart Batch!)');