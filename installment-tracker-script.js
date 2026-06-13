// ============================================
// 🔔 INSTALLMENT TRACKER SCRIPT
// File: installment-tracker-script.js
// Version: 5.0 - Smooth Animations! ✨
// Phase 4 - Step 3 (FINAL!)
// ============================================

// ============================================
// 💾 CACHE KEYS
// ============================================
const CACHE_KEYS = {
    COURSES:  'tracker_courses',
    STUDENTS: 'tracker_students'
};

// ============================================
// 📦 STATE
// ============================================
let allStudents      = [];
let filteredStudents = [];
let displayedStudents = [];
let coursesMap        = {};
let currentCardFilter = '';
let currentViewedStudent = null;

// Pagination
const PAGE_SIZE  = 20;
let   currentPage = 1;

// ============================================
// 🚀 INIT
// ============================================
document.addEventListener('DOMContentLoaded', async function () {

    PerfTracker.init('Installment Tracker');
    PerfTracker.start('🔐 Auth & Init');

    const user = initPage('installmentTrackerDB',
        ['Admin', 'Manager', 'Cashier', 'Call Operator']
    );
    if (!user) return;

    PerfTracker.end('🔐 Auth & Init');

    await loadTrackerData();
});

// ============================================
// 💀 SKELETON HELPERS
// ============================================
function showSkeletons() {
    const sk = document.getElementById('skeletonSummaryCards');
    const real = document.getElementById('realSummaryCards');
    if (sk)   sk.style.display = 'grid';
    if (real) real.style.display = 'none';
}

function hideSkeletons() {
    const sk = document.getElementById('skeletonSummaryCards');
    const real = document.getElementById('realSummaryCards');

    if (sk)   sk.style.display = 'none';
    if (real) {
        real.style.display = 'grid';
        // ✨ STAGGERED CARD ANIMATION (one by one!)
        const cards = real.querySelectorAll('.summary-card');
        cards.forEach((card, idx) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, idx * 80); // 80ms delay between cards
        });
    }
}

// ============================================
// 📦 LOAD DATA (Cached + Parallel + Skeleton!)
// ============================================
async function loadTrackerData() {
    try {
        PerfTracker.start('📦 Total Load');

        document.getElementById('btnRefresh').classList.add('loading');

        showSkeletons();

        PerfTracker.start('⚡ Parallel Fetch');

        await Promise.all([
            loadCoursesCached(),
            loadStudentsCached()
        ]);

        PerfTracker.end('⚡ Parallel Fetch');

        PerfTracker.start('🎨 UI Render');

        populateBatchFilter();
        populateCourseFilter();
        applyFilters();
        updateLastUpdated();

        hideSkeletons();

        PerfTracker.end('🎨 UI Render');
        PerfTracker.end('📦 Total Load');

        PerfTracker.report('Tracker Page Loaded');

        showGlobalToast('✅ Tracker updated!', 'success');

    } catch (error) {
        console.error('loadTrackerData error:', error);
        showGlobalToast('❌ Error loading tracker', 'error');
        hideSkeletons();
    } finally {
        document.getElementById('btnRefresh').classList.remove('loading');
    }
}

// ============================================
// 📚 LOAD COURSES (Cached!)
// ============================================
async function loadCoursesCached() {
    PerfTracker.start('📚 Courses');

    const cached = SmartStorage.get(CACHE_KEYS.COURSES);

    if (cached) {
        coursesMap = cached;
        PerfTracker.end('📚 Courses');
        console.log('📚 Courses: cache hit!');
        return;
    }

    const courseSnap = await db.collection('courses').get();
    coursesMap = {};
    courseSnap.forEach(doc => {
        coursesMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    SmartStorage.set(CACHE_KEYS.COURSES, coursesMap, SmartStorage.DURATIONS.LONG);

    PerfTracker.end('📚 Courses');
    console.log('📚 Courses: Firebase fetched + cached');
}

// ============================================
// 🎓 LOAD STUDENTS (Cached!)
// ============================================
async function loadStudentsCached() {
    PerfTracker.start('🎓 Students');

    const cached = SmartStorage.get(CACHE_KEYS.STUDENTS);

    if (cached) {
        allStudents = cached;
        PerfTracker.end('🎓 Students');
        console.log('🎓 Students: cache hit!');
        return;
    }

    const snap = await db.collection('students').get();
    allStudents = [];
    snap.forEach(doc => {
        allStudents.push({ id: doc.id, ...doc.data() });
    });

    SmartStorage.set(CACHE_KEYS.STUDENTS, allStudents, SmartStorage.DURATIONS.MEDIUM);

    PerfTracker.end('🎓 Students');
    console.log('🎓 Students: Firebase fetched + cached');
}

// ============================================
// 🔄 REFRESH (Cache Clear + Reload)
// ============================================
async function refreshTrackerData() {
    SmartStorage.remove(CACHE_KEYS.COURSES);
    SmartStorage.remove(CACHE_KEYS.STUDENTS);

    const batchSelect  = document.getElementById('filterBatch');
    const courseSelect = document.getElementById('filterCourse');
    batchSelect.innerHTML  = '<option value="">All Batches</option>';
    courseSelect.innerHTML = '<option value="">All Courses</option>';

    showSkeletons();
    showTableSkeletonRows();

    showGlobalToast('🔄 Refreshing...', 'info');

    await loadTrackerData();
}

// ============================================
// 💀 SHOW SKELETON ROWS (for refresh)
// ============================================
function showTableSkeletonRows() {
    const tbody = document.getElementById('trackerTableBody');
    let html = '';
    for (let i = 0; i < 10; i++) {
        html += `
            <tr class="skeleton-row">
                <td colspan="11">
                    <div class="skeleton skeleton-text sk-w-100" style="height:36px;"></div>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

// ============================================
// 📅 DUE CALCULATION
// ============================================
function calculateDueInfo(student) {

    const balance = Number(student.balance) || 0;
    if (balance <= 0) return { status: 'Paid' };

    const courseData   = coursesMap[student.courseId];
    const defaults     = getCourseDefaults(courseData);
    const intervalDays = defaults.paymentIntervalDays || 30;

    const payments = student.payments || [];
    let baseDate;

    if (payments.length > 0) {
        baseDate = getSafeDateFromValue(
            payments[payments.length - 1].date
        );
    } else {
        baseDate = getSafeDateFromValue(student.enrolledDate);
    }

    if (!baseDate) return { status: 'Unknown' };

    const nextDue = addDays(baseDate, intervalDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = daysBetween(today, nextDue);

    if (diffDays < 0) {
        return {
            status:     'Overdue',
            nextDue,
            daysOverdue: Math.abs(diffDays),
            urgency:    Math.abs(diffDays) > 14 ? 'critical' : 'warning'
        };
    }

    if (diffDays === 0) {
        return { status: 'Due Today', nextDue };
    }

    return {
        status:        'Upcoming',
        nextDue,
        daysRemaining: diffDays
    };
}

// ============================================
// 🎯 FILTERS
// ============================================
function applyFilters() {

    const statusFilter = document.getElementById('filterStatus').value;
    const batchFilter  = document.getElementById('filterBatch').value;
    const courseFilter = document.getElementById('filterCourse').value;
    const search       = document.getElementById('searchInput').value.toLowerCase();

    filteredStudents = allStudents.filter(student => {

        const due = calculateDueInfo(student);

        if (statusFilter && due.status !== statusFilter) return false;
        if (batchFilter  && student.batchNumber !== batchFilter) return false;
        if (courseFilter && student.courseId    !== courseFilter) return false;

        if (search) {
            const text =
                (student.name      || '') +
                (student.studentId || '') +
                (student.phone     || '');
            if (!text.toLowerCase().includes(search)) return false;
        }

        return true;
    });

    currentPage = 1;
    updateDisplayedStudents();
    updateSummaryCards();
    renderTable();
}

// ============================================
// 📄 PAGINATION
// ============================================
function updateDisplayedStudents() {
    const endIndex    = currentPage * PAGE_SIZE;
    displayedStudents = filteredStudents.slice(0, endIndex);
}

function loadMoreStudents() {
    const previousCount = displayedStudents.length;
    currentPage++;
    updateDisplayedStudents();
    renderTable(previousCount); // ✨ pass previous count for animation

    showGlobalToast(
        `📄 Loaded ${displayedStudents.length} of ${filteredStudents.length}`,
        'info'
    );
}

// ============================================
// 🟦 SUMMARY CARDS
// ============================================
function updateSummaryCards() {

    const stats = {
        'Overdue':   { count: 0, amount: 0 },
        'Due Today': { count: 0, amount: 0 },
        'Upcoming':  { count: 0, amount: 0 },
        'Paid':      { count: 0, amount: 0 }
    };

    allStudents.forEach(s => {
        const due = calculateDueInfo(s);
        if (stats[due.status]) {
            stats[due.status].count++;
            stats[due.status].amount += Number(s.balance) || 0;
        }
    });

    document.getElementById('countOverdue').textContent  = stats['Overdue'].count;
    document.getElementById('amountOverdue').textContent = formatCurrency(stats['Overdue'].amount);

    document.getElementById('countDueToday').textContent  = stats['Due Today'].count;
    document.getElementById('amountDueToday').textContent = formatCurrency(stats['Due Today'].amount);

    document.getElementById('countUpcoming').textContent  = stats['Upcoming'].count;
    document.getElementById('amountUpcoming').textContent = formatCurrency(stats['Upcoming'].amount);

    document.getElementById('countPaid').textContent  = stats['Paid'].count;
    document.getElementById('amountPaid').textContent = formatCurrency(stats['Paid'].amount);
}

function filterByCard(status) {
    currentCardFilter = status;
    document.getElementById('filterStatus').value = status;
    applyFilters();
}

// ============================================
// 📋 TABLE RENDER (with smooth animations!)
// ============================================
function renderTable(animateFromIndex = 0) {

    const tbody             = document.getElementById('trackerTableBody');
    const paginationSection = document.getElementById('paginationSection');
    const paginationInfo    = document.getElementById('paginationInfo');
    const btnLoadMore       = document.getElementById('btnLoadMore');

    if (!filteredStudents.length) {
        showTableEmpty('trackerTableBody', 11, 'No students found');
        paginationSection.style.display = 'none';
        document.getElementById('tableResultsCount').textContent = '0 students';
        return;
    }

    let html = '';

    displayedStudents.forEach((student, index) => {

        const due      = calculateDueInfo(student);
        const course   = coursesMap[student.courseId] || {};
        const payments = student.payments || [];

        const lastPayment =
            payments.length > 0
                ? formatDate(payments[payments.length - 1].date)
                : '<span class="date-none">No payment</span>';

        let daysCell = '-';
        if (due.status === 'Overdue') {
            daysCell = `<span class="days-overdue ${due.urgency === 'critical' ? 'critical' : ''}">
                            ${due.daysOverdue}d late
                        </span>`;
        } else if (due.status === 'Due Today') {
            daysCell = `<span class="days-due-today">Today</span>`;
        } else if (due.status === 'Upcoming') {
            daysCell = `<span class="days-remaining">${due.daysRemaining}d left</span>`;
        } else if (due.status === 'Paid') {
            daysCell = `<span class="days-paid">Done</span>`;
        }

        // ✨ Animation class - new rows get slide-in
        const isNewRow = index >= animateFromIndex;
        const animClass = isNewRow ? 'row-animate-in' : '';
        const animDelay = isNewRow ? `style="animation-delay:${(index - animateFromIndex) * 40}ms;"` : '';

        html += `
            <tr class="${due.urgency === 'critical' ? 'row-critical' : ''} ${animClass}" ${animDelay}>
                <td>${index + 1}</td>
                <td class="student-id-cell">${student.studentId || '-'}</td>
                <td class="student-name-cell">
                    ${student.name || '-'}
                    <div class="student-batch">${student.batchNumber || ''}</div>
                </td>
                <td class="phone-cell col-hide-mobile">${student.phone || '-'}</td>
                <td class="course-cell col-hide-mobile">
                    <div class="course-name">${course.name || '-'}</div>
                </td>
                <td class="balance-cell">
                    <span class="${Number(student.balance) > 0 ? 'balance-amount' : 'balance-paid'}">
                        ${formatCurrency(student.balance)}
                    </span>
                </td>
                <td class="date-cell col-hide-mobile">${lastPayment}</td>
                <td class="date-cell">
                    ${due.nextDue ? formatDate(due.nextDue) : '-'}
                </td>
                <td class="days-cell">${daysCell}</td>
                <td>
                    <span class="status-badge badge-${due.status.replace(' ', '-').toLowerCase()}">
                        ${due.status}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action wa"
                            onclick="sendWhatsApp('${student.phone}')">📱</button>
                        <button class="btn-action pay"
                            onclick="goToPayment('${student.id}')">💳</button>
                        <button class="btn-action view"
                            onclick="viewStudent('${student.id}')">👁️</button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    const total     = filteredStudents.length;
    const shown     = displayedStudents.length;
    const remaining = total - shown;

    document.getElementById('tableResultsCount').textContent = `${total} students`;

    if (total > PAGE_SIZE) {
        paginationSection.style.display = 'flex';

        if (remaining > 0) {
            paginationInfo.textContent = `📊 Showing ${shown} of ${total} students`;
            btnLoadMore.style.display  = 'inline-flex';
            btnLoadMore.textContent    = `📄 Load More (${remaining} remaining)`;
        } else {
            paginationInfo.textContent = `✅ Showing all ${total} students`;
            btnLoadMore.style.display  = 'none';
        }
    } else {
        paginationSection.style.display = 'none';
    }
}

// ============================================
// 🔎 FILTER HELPERS
// ============================================
function clearFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterBatch').value  = '';
    document.getElementById('filterCourse').value = '';
    document.getElementById('searchInput').value  = '';
    applyFilters();
}

function populateBatchFilter() {
    const select  = document.getElementById('filterBatch');
    const batches = [...new Set(allStudents.map(s => s.batchNumber).filter(Boolean))];
    batches.forEach(b => {
        select.innerHTML += `<option value="${b}">${b}</option>`;
    });
}

function populateCourseFilter() {
    const select = document.getElementById('filterCourse');
    Object.values(coursesMap).forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

// ============================================
// 📱 ACTIONS
// ============================================
function sendWhatsApp(phone) {
    if (!phone) return showGlobalToast('No phone number', 'warning');
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${clean}`, '_blank');
}

function goToPayment(studentDocId) {
    const student = allStudents.find(s => s.id === studentDocId);
    if (!student) {
        showGlobalToast('❌ Student not found!', 'error');
        return;
    }

    const paymentData = {
        fromStudentManagement: true,
        docId:         student.id,
        type:          'student',
        studentId:     student.studentId     || '',
        name:          student.name          || '',
        phone:         student.phone         || '',
        email:         student.email         || '',
        nic:           student.nic           || '',
        dob:           student.dob           || '',
        address:       student.address       || '',
        batchNumber:   student.batchNumber   || '',
        courseId:      student.courseId      || '',
        courseName:    student.courseName    || '',
        academy:       student.academy       || '',
        totalFee:      Number(student.totalFee)  || 0,
        totalPaid:     Number(student.totalPaid) || 0,
        balance:       Number(student.balance)   || 0,
        paymentStatus: student.paymentStatus || 'Pending',
        paymentsCount: (student.payments || []).length,
        status:        student.status        || 'Active',
        password:      student.password      || '',
        payments:      student.payments      || [],
        enrolledDate:  student.enrolledDate  || null
    };

    sessionStorage.setItem(
        'selectedPaymentStudent',
        JSON.stringify(paymentData)
    );

    showGlobalToast(`💳 Opening payment for ${student.studentId}...`, 'success');

    setTimeout(() => {
        window.location.href = 'payment.html';
    }, 300);
}

function viewStudent(studentDocId) {

    const student = allStudents.find(s => s.id === studentDocId);
    if (!student) return;

    currentViewedStudent = student;

    const html = `
        <div class="student-profile-header">
            <div class="profile-avatar">
                ${(student.name || 'S')[0].toUpperCase()}
            </div>
            <div class="profile-info">
                <div class="profile-name">${student.name}</div>
                <div class="profile-id">${student.studentId}</div>
            </div>
        </div>

        <div class="detail-grid">
            <div class="detail-item">
                <label>Phone</label>
                <span>${student.phone || '-'}</span>
            </div>
            <div class="detail-item">
                <label>Batch</label>
                <span>${student.batchNumber || '-'}</span>
            </div>
            <div class="detail-item">
                <label>Total Fee</label>
                <span>${formatCurrency(student.totalFee)}</span>
            </div>
            <div class="detail-item">
                <label>Balance</label>
                <span>${formatCurrency(student.balance)}</span>
            </div>
        </div>
    `;

    document.getElementById('viewModalBody').innerHTML = html;
    document.getElementById('viewStudentModal').classList.add('show');
}

function closeViewModal() {
    document.getElementById('viewStudentModal').classList.remove('show');
}

function sendWAFromModal() {
    if (!currentViewedStudent) return;
    sendWhatsApp(currentViewedStudent.phone);
}

function goToPaymentFromModal() {
    if (!currentViewedStudent) return;
    goToPayment(currentViewedStudent.id);
}

// ============================================
// 🕒 LAST UPDATED
// ============================================
function updateLastUpdated() {
    document.getElementById('lastUpdatedBar').textContent =
        'Last updated: ' + formatDateTime(new Date());
}

console.log('🔔 installment-tracker-script.js loaded! (v5.0 - Smooth Animations!)');