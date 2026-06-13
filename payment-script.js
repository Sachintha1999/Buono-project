// ═══════════════════════════════════════════
// 💳 BUONO PAYMENT SYSTEM - SCRIPT
// File: payment-script.js
// Version: 7.6 (Skeleton + Optimistic UI!)
// ═══════════════════════════════════════════

let currentUser = null;
let systemSettings = null;
let paymentSource = 'Walk In';
let selectedLeadData = null;
let selectedPaymentMethod = null;
let allCourses = [];
let filteredCourses = [];
let selectedCourseData = null;
let appliedDiscount = null;
let uploadedSlipURL = null;
let uploadedSlipFile = null;
let storage = null;
let isSubmitting = false;
let lastReceiptData = null;

let allStudentsCache = [];
let allLeadsCache = [];
let cacheLoaded = false;
let searchDebounceTimer = null;
let selectedExistingStudent = null;
let isExistingStudentMode = false;
let pendingStudentData = null;

// Cache keys
const CACHE_KEYS = {
    SETTINGS: 'payment_settings',
    COURSES: 'payment_courses',
    STUDENTS: 'payment_students',
    LEADS: 'payment_leads'
};

// ═══════════════════════════════════════════
// 💀 SKELETON HELPERS
// ═══════════════════════════════════════════

function showSkeleton(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
}

function hideSkeleton(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
}

function showReal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = '';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.classList.add('visible');
        });
    });
}

function hideReal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('visible');
    el.style.display = 'none';
}

function showAllSkeletons() {
    showSkeleton('skeletonStats');
    showSkeleton('skeletonCourses');
    showSkeleton('skeletonPaymentMethods');
}

function revealAllContent() {
    hideSkeleton('skeletonStats');
    showReal('realStats');
    hideSkeleton('skeletonCourses');
    showReal('realCourses');
    hideSkeleton('skeletonPaymentMethods');
    showReal('paymentMethodsGrid');
}

// ═══════════════════════════════════════════
// ⚡ OPTIMISTIC UI HELPERS (NEW! v7.6)
// ═══════════════════════════════════════════

/**
 * Add animation class temporarily
 */
function animateElement(element, animationClass, duration = 400) {
    if (!element) return;
    element.classList.remove(animationClass);
    void element.offsetWidth; // Force reflow
    element.classList.add(animationClass);
    setTimeout(() => element.classList.remove(animationClass), duration);
}

/**
 * Set button to loading state
 */
function setButtonLoading(button, loadingText = 'Loading...') {
    if (!button) return null;
    const originalText = button.innerHTML;
    button.dataset.originalText = originalText;
    button.classList.add('loading');
    button.disabled = true;
    button.innerHTML = loadingText;
    return originalText;
}

/**
 * Set button to success state (temporary)
 */
function setButtonSuccess(button, successText = '✅', duration = 1200) {
    if (!button) return;
    button.classList.remove('loading', 'error');
    button.classList.add('success');
    button.innerHTML = successText;
    setTimeout(() => {
        button.classList.remove('success');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }, duration);
}

/**
 * Set button to error state (temporary)
 */
function setButtonError(button, errorText = '❌', duration = 1200) {
    if (!button) return;
    button.classList.remove('loading', 'success');
    button.classList.add('error');
    button.innerHTML = errorText;
    setTimeout(() => {
        button.classList.remove('error');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }, duration);
}

/**
 * Reset button to normal state
 */
function resetButton(button) {
    if (!button) return;
    button.classList.remove('loading', 'success', 'error');
    button.disabled = false;
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
    }
}

// ═══════════════════════════════════════════
// 🚀 INITIALIZATION (v7.6)
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function () {
    PerfTracker.init('Payment Page');
    console.log('💳 Payment page loading... (v7.6 - Optimistic UI!)');

    showAllSkeletons();

    PerfTracker.start('🔐 Auth & Init');
    currentUser = initPage('paymentDB', [
        'Admin', 'Manager', 'Cashier', 'Call Operator'
    ]);
    if (!currentUser) return;
    PerfTracker.end('🔐 Auth & Init');

    try {
        storage = firebase.storage();
    } catch (e) {
        console.warn('⚠️ Storage init failed:', e);
    }

    detectPaymentSource();

    PerfTracker.start('⚡ Session Check');
    const sessionStudent = readSessionStudent();
    PerfTracker.end('⚡ Session Check');

    if (sessionStudent) {
        PerfTracker.start('⚡ Instant Student Show');
        console.log('⚡ INSTANT show:', sessionStudent.studentId);
        pendingStudentData = sessionStudent;
        instantShowStudent(sessionStudent);
        PerfTracker.end('⚡ Instant Student Show');
    }

    PerfTracker.start('🔥 Parallel Cached Load');
    await Promise.all([
        trackedLoad('⚙️ Settings (Cached)', loadSystemSettingsCached),
        trackedLoad('🎓 Courses (Cached)', loadAllCoursesCached),
        trackedLoad('💾 Cache (Cached)', loadSearchCacheCached)
    ]);
    PerfTracker.end('🔥 Parallel Cached Load');

    PerfTracker.start('🏫 Academy Setup');
    setupAcademyDropdown();
    PerfTracker.end('🏫 Academy Setup');

    PerfTracker.start('📊 Stats Update');
    updateStatsFromCache();
    PerfTracker.end('📊 Stats Update');

    revealAllContent();

    PerfTracker.start('🎯 Bind Events');
    bindEvents();
    PerfTracker.end('🎯 Bind Events');

    if (pendingStudentData) {
        PerfTracker.start('✨ Enhance Student Display');
        enhanceStudentDisplay(pendingStudentData);
        pendingStudentData = null;
        PerfTracker.end('✨ Enhance Student Display');
    } else {
        document.getElementById('smartSearchInput').focus();
    }

    showToast('✅ Payment system ready!', 'success');

    setTimeout(() => {
        PerfTracker.report('Payment Page Loaded');
    }, 100);
});

async function trackedLoad(name, fn) {
    PerfTracker.start(name);
    try {
        await fn();
    } finally {
        PerfTracker.end(name);
    }
}

// ═══════════════════════════════════════════
// ⚡ CACHED LOADERS
// ═══════════════════════════════════════════

async function loadSystemSettingsCached() {
    try {
        systemSettings = await SmartStorage.getOrFetch(
            CACHE_KEYS.SETTINGS,
            async () => {
                const settings = await getSystemSettings();
                return settings;
            },
            SmartStorage.DURATIONS.MEDIUM
        );

        if (!systemSettings) {
            showToast('⚠️ Settings not configured!', 'warning');
            return;
        }
        loadPaymentMethods();
    } catch (error) {
        console.error('Settings error:', error);
        showToast('❌ Error loading settings!', 'error');
    }
}

async function loadAllCoursesCached() {
    try {
        allCourses = await SmartStorage.getOrFetch(
            CACHE_KEYS.COURSES,
            async () => {
                const snap = await db.collection('courses').get();
                const courses = [];
                snap.forEach(doc => {
                    courses.push({ id: doc.id, ...doc.data() });
                });
                return courses;
            },
            SmartStorage.DURATIONS.MEDIUM
        );

        console.log('🎓 Courses loaded:', allCourses.length);
    } catch (error) {
        console.error('Courses error:', error);
        allCourses = [];
    }
}

async function loadSearchCacheCached() {
    try {
        const cachedData = await SmartStorage.getOrFetch(
            CACHE_KEYS.STUDENTS,
            async () => {
                const [studentsSnap, leadsSnap] = await Promise.all([
                    db.collection('students').get(),
                    db.collection('leads').get()
                ]);

                const students = [];
                studentsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.isDeleted === true) return;
                    students.push({
                        docId: doc.id,
                        type: 'student',
                        studentId: data.studentId || '',
                        name: data.name || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        nic: data.nic || '',
                        dob: data.dob || '',
                        address: data.address || '',
                        batchNumber: data.batchNumber || '',
                        courseId: data.courseId || '',
                        courseName: data.courseName || '',
                        academy: data.academy || '',
                        totalFee: Number(data.totalFee) || 0,
                        totalPaid: Number(data.totalPaid) || 0,
                        balance: Number(data.balance) || 0,
                        paymentStatus: data.paymentStatus || 'Pending',
                        paymentsCount: (data.payments || []).length,
                        status: data.status || 'Active',
                        password: data.password || '',
                        payments: data.payments || [],
                        enrolledDate: serializeDate(data.enrolledDate)
                    });
                });

                const leads = [];
                leadsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'Enrolled') return;
                    leads.push({
                        docId: doc.id,
                        type: 'lead',
                        name: data.name || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        nic: data.nic || '',
                        address: data.address || '',
                        courseInterest: data.courseInterest || '',
                        status: data.status || 'Need Call',
                        source: data.source || ''
                    });
                });

                return { students, leads };
            },
            SmartStorage.DURATIONS.SHORT
        );

        allStudentsCache = cachedData.students || [];
        allLeadsCache = cachedData.leads || [];
        cacheLoaded = true;

        console.log('✅ Cache loaded - Students:',
            allStudentsCache.length, '| Leads:', allLeadsCache.length);

    } catch (error) {
        console.error('❌ Cache load error:', error);
        cacheLoaded = false;
    }
}

function serializeDate(value) {
    if (!value) return null;
    if (value.toDate) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return new Date(value).toISOString();
    return null;
}

function invalidateStudentCache() {
    SmartStorage.remove(CACHE_KEYS.STUDENTS);
    console.log('🔄 Student cache invalidated');
}

function invalidateSettingsCache() {
    SmartStorage.remove(CACHE_KEYS.SETTINGS);
    console.log('🔄 Settings cache invalidated');
}

function invalidateCoursesCache() {
    SmartStorage.remove(CACHE_KEYS.COURSES);
    console.log('🔄 Courses cache invalidated');
}

function readSessionStudent() {
    try {
        const raw = sessionStorage.getItem('selectedPaymentStudent');
        if (!raw) return null;

        sessionStorage.removeItem('selectedPaymentStudent');
        const studentData = JSON.parse(raw);

        if (!studentData.fromStudentManagement) return null;
        return studentData;
    } catch (e) {
        sessionStorage.removeItem('selectedPaymentStudent');
        return null;
    }
}

function instantShowStudent(student) {
    selectedExistingStudent = student;
    isExistingStudentMode = true;

    const searchInput = document.getElementById('smartSearchInput');
    searchInput.value = `${student.studentId} - ${student.name}`;
    document.getElementById('btnSmartClear').style.display = 'block';

    showStudentSummaryBox(student);
    fillCustomerFields(student, true);

    selectedLeadData = {
        isExistingStudent: true,
        studentId: student.docId,
        docId: student.docId,
        ...student
    };

    const courseBadge = document.getElementById('courseReadonlyBadge');
    if (courseBadge) courseBadge.style.display = 'inline-flex';

    const submitHint = document.getElementById('submitHint');
    if (submitHint) {
        submitHint.textContent = `${student.name} ගේ balance payment process කරන්නම්.`;
    }

    showToast(`⚡ Student loaded: ${student.studentId}`, 'success');
}

function enhanceStudentDisplay(student) {
    const existsInCache = allStudentsCache.find(s => s.docId === student.docId);
    if (!existsInCache) {
        allStudentsCache.push({
            ...student,
            type: 'student',
            payments: student.payments || [],
            enrolledDate: serializeDate(student.enrolledDate)
        });
    }

    if (student.academy) {
        const academySelect = document.getElementById('academySelect');
        if (academySelect) {
            academySelect.value = student.academy;
            academySelect.disabled = true;
            onAcademyChange(student.academy);

            setTimeout(() => {
                const courseSelect = document.getElementById('courseSelect');
                if (!courseSelect) return;

                if (student.courseId) {
                    courseSelect.value = student.courseId;
                } else {
                    const matchedOption = [...courseSelect.options].find(
                        opt => opt.text.includes(student.courseName)
                    );
                    if (matchedOption) courseSelect.value = matchedOption.value;
                }
                courseSelect.disabled = true;
                onCourseChange(courseSelect.value);
                setInstallmentAmount(student);
            }, 100);
        }
    }
}

function detectPaymentSource() {
    if (currentUser.access === 'Cashier') paymentSource = 'Walk In';
    else if (currentUser.access === 'Call Operator') paymentSource = 'Call Center';
    else paymentSource = 'Walk In';

    document.getElementById('sourceBadgeValue').textContent = paymentSource;
    document.getElementById('operatorName').textContent =
        currentUser.nickname || currentUser.name;
}

function updateStatsFromCache() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        let todayRevenue = 0;
        let todayEnrolled = 0;
        let monthTotal = 0;
        let pendingPayments = 0;

        allStudentsCache.forEach(student => {
            if (student.enrolledDate) {
                const enrollDate = new Date(student.enrolledDate);
                if (enrollDate >= today) todayEnrolled++;
            }

            if (student.paymentStatus === 'Pending' ||
                student.paymentStatus === 'Partial') {
                pendingPayments++;
            }

            (student.payments || []).forEach(p => {
                const pDate = p.date && p.date.toDate
                    ? p.date.toDate()
                    : new Date(p.date);
                if (pDate >= today) todayRevenue += Number(p.amount || 0);
                if (pDate >= monthStart) monthTotal += Number(p.amount || 0);
            });
        });

        document.getElementById('statTodayRevenue').textContent =
            formatCurrency(todayRevenue);
        document.getElementById('statTodayEnrolled').textContent = todayEnrolled;
        document.getElementById('statMonthTotal').textContent =
            formatCurrency(monthTotal);
        document.getElementById('statPending').textContent = pendingPayments;
        document.getElementById('statTotalStudents').textContent =
            allStudentsCache.length;
    } catch (error) {
        console.error('Stats error:', error);
    }
}

function setupAcademyDropdown() {
    const academySelect = document.getElementById('academySelect');
    const academiesFromCourses = [
        ...new Set(allCourses.map(c => c.academy).filter(Boolean))
    ];
    const settingsAcademy = systemSettings?.academyShortName || '';
    const settingsFullName = systemSettings?.academyFullName || '';

    const academyMap = {};
    if (settingsAcademy) academyMap[settingsAcademy] = settingsFullName || settingsAcademy;
    academiesFromCourses.forEach(code => {
        if (!academyMap[code]) academyMap[code] = code;
    });

    let html = '<option value="">-- Academy තෝරන්න --</option>';
    Object.keys(academyMap).forEach(code => {
        const fullName = academyMap[code];
        const label = fullName !== code ? `${code} - ${fullName}` : code;
        html += `<option value="${code}">${label}</option>`;
    });

    academySelect.innerHTML = html;

    const academyKeys = Object.keys(academyMap);
    if (academyKeys.length === 1 && !isExistingStudentMode) {
        academySelect.value = academyKeys[0];
        onAcademyChange(academyKeys[0]);
    }
}

function onAcademyChange(academyCode) {
    const courseSelect = document.getElementById('courseSelect');

    if (!academyCode) {
        courseSelect.disabled = true;
        courseSelect.innerHTML =
            '<option value="">-- මුලින්ම Academy තෝරන්න --</option>';
        clearCourseDetails();
        return;
    }

    filteredCourses = allCourses.filter(c =>
        c.academy && c.academy.toUpperCase() === academyCode.toUpperCase()
    );

    let html = '<option value="">-- Course තෝරන්න --</option>';
    if (filteredCourses.length === 0) {
        html = '<option value="">⚠️ Courses නැහැ</option>';
        courseSelect.disabled = true;
    } else {
        filteredCourses.forEach(course => {
            const fee = course.fee ? ` (${formatCurrency(course.fee)})` : '';
            html += `<option value="${course.id}">${course.name}${fee}</option>`;
        });
        courseSelect.disabled = false;
    }

    courseSelect.innerHTML = html;
    clearCourseDetails();
    
    // ⚡ Optimistic UI: Smooth course select appearance
    animateElement(courseSelect, 'anim-pulse', 400);
}

function onCourseChange(courseId) {
    if (!courseId) { clearCourseDetails(); return; }

    selectedCourseData = filteredCourses.find(c => c.id === courseId) ||
        allCourses.find(c => c.id === courseId);

    if (!selectedCourseData) { clearCourseDetails(); return; }

    const fee = Number(selectedCourseData.fee) || 0;
    const downPayment = Number(selectedCourseData.downPayment) || 0;
    const defaultInstallments = Number(systemSettings?.defaultInstallments) || 2;
    const balance = fee - downPayment;
    const perInstallment = defaultInstallments > 0
        ? Math.ceil(balance / defaultInstallments) : balance;

    document.getElementById('feeAmount').textContent = formatCurrency(fee);
    document.getElementById('feeDownPayment').textContent = formatCurrency(downPayment);
    document.getElementById('feeBalance').textContent = formatCurrency(balance);

    if (balance > 0 && defaultInstallments > 0) {
        document.getElementById('feeInstallments').textContent =
            `${defaultInstallments} payments × ${formatCurrency(perInstallment)}`;
    } else if (balance <= 0) {
        document.getElementById('feeInstallments').textContent =
            'Full payment with down payment';
    } else {
        document.getElementById('feeInstallments').textContent =
            `${defaultInstallments} payments`;
    }

    // ⚡ Optimistic UI: Smooth fee box appearance
    const feeBox = document.getElementById('courseFeeBox');
    feeBox.style.display = 'block';
    animateElement(feeBox, 'anim-slide-bottom', 350);

    if (!isExistingStudentMode) {
        document.getElementById('paymentAmount').value = downPayment;
    }

    clearDiscount();
    updateFinalAmount();
}

function clearCourseDetails() {
    selectedCourseData = null;
    document.getElementById('courseFeeBox').style.display = 'none';
    document.getElementById('feeAmount').textContent = 'Rs. 0';
    document.getElementById('feeDownPayment').textContent = 'Rs. 0';
    document.getElementById('feeInstallments').textContent = '0 payments';
    document.getElementById('feeBalance').textContent = 'Rs. 0';
    if (!isExistingStudentMode) {
        document.getElementById('paymentAmount').value = '';
    }
    clearDiscount();
    updateFinalAmount();
}

function loadPaymentMethods() {
    const methods = systemSettings?.paymentMethods || {
        cash: true, bank: true, card: true, online: true
    };

    const methodConfig = [
        { key: 'cash', icon: '💵', label: 'Cash' },
        { key: 'bank', icon: '🏦', label: 'Bank Transfer' },
        { key: 'card', icon: '💳', label: 'Card' },
        { key: 'online', icon: '📱', label: 'Online' }
    ];

    let html = '';
    methodConfig.forEach(m => {
        if (methods[m.key]) {
            html += `<div class="payment-method-card" 
                data-method="${m.key}" 
                onclick="selectPaymentMethod('${m.key}')">
                <div class="payment-method-icon">${m.icon}</div>
                <div class="payment-method-label">${m.label}</div>
            </div>`;
        }
    });

    const grid = document.getElementById('paymentMethodsGrid');
    grid.innerHTML = html ||
        '<div class="loading-msg">⚠️ No payment methods enabled!</div>';
}

function selectPaymentMethod(methodKey) {
    document.querySelectorAll('.payment-method-card').forEach(
        card => card.classList.remove('selected')
    );
    const selected = document.querySelector(`[data-method="${methodKey}"]`);
    if (selected) {
        selected.classList.add('selected');
        // ⚡ Optimistic UI: Pulse animation on selection
        animateElement(selected, 'anim-pulse', 400);
    }
    selectedPaymentMethod = methodKey;

    const slipGroup = document.getElementById('slipUploadGroup');
    if (methodKey === 'bank' || methodKey === 'online') {
        slipGroup.style.display = 'block';
        animateElement(slipGroup, 'anim-slide-bottom', 350);
    } else {
        slipGroup.style.display = 'none';
        clearSlipUpload();
    }
}

function onSmartSearchInput() {
    const query = document.getElementById('smartSearchInput').value.trim();
    const clearBtn = document.getElementById('btnSmartClear');
    clearBtn.style.display = query.length > 0 ? 'block' : 'none';

    if (query.length < 2) { hideSuggestions(); return; }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => showSuggestions(query), 250);
}

function showSuggestions(query) {
    if (!cacheLoaded) {
        showSearchStatus('⏳ Loading data, please wait...', 'info');
        return;
    }

    const q = query.toLowerCase();
    const results = [];

    allStudentsCache.forEach(s => {
        const searchable = [s.studentId, s.name, s.phone,
            s.email, s.nic, s.courseName].join(' ').toLowerCase();
        if (searchable.includes(q)) results.push(s);
    });

    if (results.length < 5) {
        allLeadsCache.forEach(l => {
            const searchable = [l.name, l.phone, l.email,
                l.nic, l.courseInterest].join(' ').toLowerCase();
            if (searchable.includes(q)) results.push(l);
        });
    }

    if (results.length === 0) { showNewCustomerSuggestion(query); return; }
    renderSuggestions(results.slice(0, 8), query);
}

function renderSuggestions(results, query) {
    const list = document.getElementById('suggestionsList');
    const dropdown = document.getElementById('searchSuggestions');

    list.innerHTML = results.map(item => {
        if (item.type === 'student') {
            const balanceHtml = item.balance > 0
                ? `<span class="sug-balance">Balance: ${formatCurrency(item.balance)}</span>`
                : `<span class="sug-paid">✅ Fully Paid</span>`;
            const statusClass = item.status === 'Suspended'
                ? 'sug-badge suspended' : 'sug-badge student';

            return `<div class="suggestion-item" 
                onclick="selectSuggestion('student','${item.docId}')">
                <div class="sug-left">
                    <span class="${statusClass}">
                        ${item.status === 'Suspended' ? '⛔' : '🎓'} Student
                    </span>
                    <span class="sug-name">${escapeHtml(item.name)}</span>
                    <span class="sug-id">${escapeHtml(item.studentId)}</span>
                </div>
                <div class="sug-right">
                    <span class="sug-phone">${escapeHtml(item.phone)}</span>
                    <span class="sug-course">${escapeHtml(item.courseName)}</span>
                    ${balanceHtml}
                </div>
            </div>`;
        } else {
            return `<div class="suggestion-item" 
                onclick="selectSuggestion('lead','${item.docId}')">
                <div class="sug-left">
                    <span class="sug-badge lead">📋 Lead</span>
                    <span class="sug-name">${escapeHtml(item.name)}</span>
                </div>
                <div class="sug-right">
                    <span class="sug-phone">${escapeHtml(item.phone)}</span>
                    <span class="sug-course">
                        ${escapeHtml(item.courseInterest || '-')}
                    </span>
                    <span class="sug-status">${escapeHtml(item.status)}</span>
                </div>
            </div>`;
        }
    }).join('');

    list.innerHTML += `<div class="suggestion-item new-customer-item" 
        onclick="selectNewCustomer('${escapeAttr(query)}')">
        <span class="sug-badge new">➕ New Customer</span>
        <span class="sug-name">"${escapeHtml(query)}" - අලුත් customer</span>
    </div>`;

    dropdown.style.display = 'block';
}

function showNewCustomerSuggestion(query) {
    const list = document.getElementById('suggestionsList');
    const dropdown = document.getElementById('searchSuggestions');

    list.innerHTML = `<div class="suggestion-item new-customer-item" 
        onclick="selectNewCustomer('${escapeAttr(query)}')">
        <span class="sug-badge new">➕ New Customer</span>
        <span class="sug-name">"${escapeHtml(query)}" - System එකේ නැහැ</span>
        <span class="sug-desc">Click කළොත් Manual entry mode</span>
    </div>`;

    dropdown.style.display = 'block';
}

function selectSuggestion(type, docId) {
    hideSuggestions();

    if (type === 'student') {
        const student = allStudentsCache.find(s => s.docId === docId);
        if (!student) {
            showToast('❌ Student not found in cache!', 'error');
            return;
        }
        handleExistingStudentFromCache(student);
    } else {
        const lead = allLeadsCache.find(l => l.docId === docId);
        if (!lead) {
            showToast('❌ Lead not found in cache!', 'error');
            return;
        }
        handleExistingLeadFromCache(lead);
    }
}

function handleExistingStudentFromCache(student) {
    selectedExistingStudent = student;
    isExistingStudentMode = true;

    document.getElementById('smartSearchInput').value =
        `${student.studentId} - ${student.name}`;
    document.getElementById('btnSmartClear').style.display = 'block';

    showStudentSummaryBox(student);
    fillCustomerFields(student, true);

    if (student.academy) {
        const academySelect = document.getElementById('academySelect');
        academySelect.value = student.academy;
        academySelect.disabled = true;
        onAcademyChange(student.academy);

        setTimeout(() => {
            const courseSelect = document.getElementById('courseSelect');
            if (student.courseId) {
                courseSelect.value = student.courseId;
            } else {
                const matchedOption = [...courseSelect.options].find(
                    opt => opt.text.includes(student.courseName)
                );
                if (matchedOption) courseSelect.value = matchedOption.value;
            }
            courseSelect.disabled = true;
            onCourseChange(courseSelect.value);
            setInstallmentAmount(student);
        }, 100);
    }

    selectedLeadData = {
        isExistingStudent: true,
        studentId: student.docId,
        docId: student.docId,
        ...student
    };

    document.getElementById('courseReadonlyBadge').style.display = 'inline-flex';
    document.getElementById('submitHint').textContent =
        `${student.name} ගේ balance payment process කරන්නම්.`;

    showToast(`✅ Student selected: ${student.studentId}`, 'success');
}

function handleExistingLeadFromCache(lead) {
    selectedExistingStudent = null;
    isExistingStudentMode = false;

    document.getElementById('smartSearchInput').value = lead.name;
    document.getElementById('btnSmartClear').style.display = 'block';
    document.getElementById('studentSummaryBox').style.display = 'none';

    fillCustomerFields(lead, false);

    selectedLeadData = { id: lead.docId, isNew: false, ...lead };

    if (lead.courseInterest) tryAutoSelectAcademyAndCourse(lead.courseInterest);

    showSearchStatus(
        `📋 Lead found: ${lead.name} | ${lead.status} | ` +
        `${lead.courseInterest || 'No course interest'}`,
        'found'
    );

    showToast(`📋 Lead selected: ${lead.name}`, 'info');
}

function selectNewCustomer(query) {
    hideSuggestions();
    selectedExistingStudent = null;
    isExistingStudentMode = false;

    document.getElementById('smartSearchInput').value = query;
    document.getElementById('studentSummaryBox').style.display = 'none';

    clearCustomerFields();
    setCustomerFieldsReadonly(false);

    const cleanQuery = query.replace(/\D/g, '');
    if (cleanQuery.length >= 7) {
        const normalized = normalizePhone(cleanQuery);
        document.getElementById('customerPhone').value = normalized || query;
    } else {
        document.getElementById('customerName').value = query;
    }

    selectedLeadData = { isNew: true };

    showSearchStatus('➕ New customer - Manual entry කරන්න', 'new');
    document.getElementById('customerName').focus();
    showToast('ℹ️ New customer mode', 'info');
}

function clearSmartSearch() {
    document.getElementById('smartSearchInput').value = '';
    document.getElementById('btnSmartClear').style.display = 'none';
    hideSuggestions();
    clearStudentSelection();
}

function clearStudentSelection() {
    selectedExistingStudent = null;
    isExistingStudentMode = false;
    selectedLeadData = null;

    document.getElementById('studentSummaryBox').style.display = 'none';
    hideSearchStatus();
    clearCustomerFields();
    setCustomerFieldsReadonly(false);

    document.getElementById('academySelect').disabled = false;
    document.getElementById('courseSelect').disabled = false;

    document.getElementById('readonlyBadge').style.display = 'none';
    document.getElementById('courseReadonlyBadge').style.display = 'none';

    document.getElementById('submitHint').textContent =
        'Submit කලාට පස්සේ Student ID + Password + Receipt auto-generate වෙයි.';

    showToast('🔄 Selection cleared', 'info');
}

function showStudentSummaryBox(student) {
    document.getElementById('summaryStudentId').textContent =
        student.studentId || '-';
    document.getElementById('summaryStudentName').textContent =
        student.name || '-';

    const statusBadge = document.getElementById('summaryStatusBadge');
    statusBadge.textContent = student.status || 'Active';
    statusBadge.className = 'student-summary-badge';
    if ((student.status || 'Active') === 'Suspended')
        statusBadge.classList.add('suspended');

    document.getElementById('summaryTotalFee').textContent =
        formatCurrency(student.totalFee);
    document.getElementById('summaryTotalPaid').textContent =
        formatCurrency(student.totalPaid);
    document.getElementById('summaryBalance').textContent =
        formatCurrency(student.balance);
    document.getElementById('summaryPaymentsCount').textContent =
        student.paymentsCount || 0;

    document.getElementById('installmentInfoText').textContent =
        buildInstallmentText(student);

    // ⚡ Optimistic UI: Smooth slide-in
    const summaryBox = document.getElementById('studentSummaryBox');
    summaryBox.style.display = 'block';
    summaryBox.classList.add('visible');
    animateElement(summaryBox, 'anim-slide-top', 400);
}

function buildInstallmentText(student) {
    const balance = Number(student.balance) || 0;
    const paymentsCount = Number(student.paymentsCount) || 0;

    if (balance <= 0)
        return '✅ සියලු ගෙවීම් සම්පූර්ණයි! (Fully Paid)';
    if (paymentsCount === 0)
        return `💳 පළමු ගෙවීම (Down Payment) - Balance: ${formatCurrency(balance)}`;

    const defaultInstallments = Number(systemSettings?.defaultInstallments) || 2;
    const nextPaymentNo = paymentsCount;

    if (nextPaymentNo <= defaultInstallments) {
        const remainingInstallments = defaultInstallments - paymentsCount + 1;
        const perInstallment = Math.ceil(balance / remainingInstallments);
        return `💳 Installment ${nextPaymentNo} - Suggested: ` +
            `${formatCurrency(perInstallment)} | Balance: ${formatCurrency(balance)}`;
    }

    return `💳 Extra Payment - Balance: ${formatCurrency(balance)}`;
}

function setInstallmentAmount(student) {
    const balance = Number(student.balance) || 0;
    if (balance <= 0) return;

    const paymentsCount = Number(student.paymentsCount) || 0;
    const defaultInstallments = Number(systemSettings?.defaultInstallments) || 2;
    const remainingInstallments = Math.max(1, defaultInstallments - paymentsCount + 1);
    const suggested = Math.ceil(balance / remainingInstallments);
    const amount = Math.min(suggested, balance);

    document.getElementById('paymentAmount').value = amount;
    updateFinalAmount();
}

function fillCustomerFields(data, readonly) {
    document.getElementById('customerPhone').value = data.phone || '';
    document.getElementById('customerName').value = data.name || '';
    document.getElementById('customerEmail').value = data.email || '';
    document.getElementById('customerNIC').value = data.nic || '';
    document.getElementById('customerDOB').value = data.dob || '';
    document.getElementById('customerAddress').value = data.address || '';
    setCustomerFieldsReadonly(readonly);
}

function setCustomerFieldsReadonly(readonly) {
    ['customerPhone', 'customerName', 'customerEmail',
        'customerNIC', 'customerDOB', 'customerAddress']
        .forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.readOnly = readonly;
            el.style.opacity = readonly ? '0.7' : '1';
            el.style.cursor = readonly ? 'not-allowed' : '';
            el.style.background = readonly ? '#0a1e38' : '';
        });

    const badge = document.getElementById('readonlyBadge');
    if (badge) badge.style.display = readonly ? 'inline-flex' : 'none';

    const desc = document.getElementById('customerSectionDesc');
    if (desc) {
        desc.textContent = readonly
            ? '🔒 Student data read-only. Payment section වෙනස් කරන්නෙකි.'
            : 'Phone number හෝ search box වලින් student/lead හොයාගන්න.';
    }
}

function clearCustomerFields() {
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerNIC').value = '';
    document.getElementById('customerDOB').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('phoneSearchStatus').innerHTML = '';
}

function tryAutoSelectAcademyAndCourse(courseInterest) {
    if (!courseInterest || allCourses.length === 0) return;

    const interest = courseInterest.trim().toLowerCase();
    let matchedCourse = allCourses.find(
        c => c.name && c.name.trim().toLowerCase() === interest
    );
    if (!matchedCourse) {
        matchedCourse = allCourses.find(
            c => c.name && c.name.trim().toLowerCase().includes(interest)
        );
    }

    if (matchedCourse && matchedCourse.academy) {
        document.getElementById('academySelect').value = matchedCourse.academy;
        onAcademyChange(matchedCourse.academy);

        setTimeout(() => {
            document.getElementById('courseSelect').value = matchedCourse.id;
            onCourseChange(matchedCourse.id);
        }, 100);
    }
}

function showSearchStatus(message, type = 'info') {
    const bar = document.getElementById('searchStatusBar');
    bar.style.display = 'block';
    bar.className = `search-status-bar status-${type}`;
    bar.textContent = message;
    // ⚡ Optimistic UI: Smooth slide-in
    animateElement(bar, 'anim-slide-top', 300);
}

function hideSearchStatus() {
    const bar = document.getElementById('searchStatusBar');
    if (bar) bar.style.display = 'none';
}

function hideSuggestions() {
    const dropdown = document.getElementById('searchSuggestions');
    if (dropdown) dropdown.style.display = 'none';
}

// ═══════════════════════════════════════════
// 🎟️ DISCOUNT APPLY (Optimistic UI!)
// ═══════════════════════════════════════════
async function applyDiscountCode() {
    const codeInput = document.getElementById('discountCode');
    const applyBtn = document.getElementById('btnApplyDiscount');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        showToast('⚠️ Discount code එක දාන්න!', 'warning');
        codeInput.focus();
        animateElement(codeInput, 'anim-shake', 400);
        return;
    }

    const paymentAmount = Number(document.getElementById('paymentAmount').value) || 0;
    if (paymentAmount <= 0) {
        showToast('⚠️ Payment amount එක මුලින් දාන්න!', 'warning');
        animateElement(document.getElementById('paymentAmount'), 'anim-shake', 400);
        return;
    }

    // ⚡ Optimistic UI: Loading state
    setButtonLoading(applyBtn, '⏳');

    // Small artificial delay for UX feel (200ms)
    await new Promise(resolve => setTimeout(resolve, 200));

    const discountCodes = systemSettings?.discountCodes || [];
    const matchedDiscount = discountCodes.find(
        d => d.code && d.code.toUpperCase() === code
    );

    if (!matchedDiscount) {
        // ⚡ Optimistic UI: Error state
        setButtonError(applyBtn, '❌');
        animateElement(codeInput, 'anim-shake', 400);
        showToast(`❌ Invalid code: ${code}`, 'error');
        codeInput.value = '';
        codeInput.classList.remove('applied');
        clearDiscount();
        updateFinalAmount();
        return;
    }

    let discountAmount = 0;
    const discountType = matchedDiscount.type || 'percentage';
    const discountValue = Number(matchedDiscount.value) || 0;

    if (discountType === 'percentage' || discountType === '%') {
        discountAmount = (paymentAmount * discountValue) / 100;
    } else {
        discountAmount = discountValue;
    }

    if (discountAmount > paymentAmount) discountAmount = paymentAmount;

    appliedDiscount = {
        code: matchedDiscount.code,
        type: discountType,
        value: discountValue,
        amount: discountAmount
    };
    updateFinalAmount();

    // ⚡ Optimistic UI: Success state
    setButtonSuccess(applyBtn, '✅');
    codeInput.classList.add('applied');

    const typeLabel = (discountType === 'percentage' || discountType === '%')
        ? `${discountValue}%` : formatCurrency(discountValue);
    showToast(`✅ Discount applied: ${matchedDiscount.code} (${typeLabel})`, 'success');
}

function clearDiscount() {
    appliedDiscount = null;
    const codeInput = document.getElementById('discountCode');
    if (codeInput) {
        codeInput.value = '';
        codeInput.classList.remove('applied');
    }
}

function updateFinalAmount() {
    const paymentAmount =
        Number(document.getElementById('paymentAmount').value) || 0;
    const finalAmountBox = document.getElementById('finalAmountBox');

    if (paymentAmount <= 0) {
        finalAmountBox.style.display = 'none';
        return;
    }

    const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
    const finalAmount = Math.max(0, paymentAmount - discountAmount);

    document.getElementById('originalAmountDisplay').textContent =
        formatCurrency(paymentAmount);
    document.getElementById('discountDisplay').textContent =
        '- ' + formatCurrency(discountAmount);
    document.getElementById('finalAmountDisplay').textContent =
        formatCurrency(finalAmount);

    // ⚡ Optimistic UI: Smooth appearance
    const wasHidden = finalAmountBox.style.display === 'none';
    finalAmountBox.style.display = 'block';
    if (wasHidden) {
        animateElement(finalAmountBox, 'anim-scale-in', 300);
    }
}

async function handleSlipUpload(file) {
    if (!file) return;
    const preview = document.getElementById('slipPreview');

    if (file.size > 5 * 1024 * 1024) {
        showToast('❌ File size 5MB ට වැඩියි!', 'error');
        clearSlipUpload();
        return;
    }

    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png',
        'image/webp', 'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
        showToast('❌ Only JPG/PNG/WEBP/PDF allowed!', 'error');
        clearSlipUpload();
        return;
    }

    uploadedSlipFile = file;
    preview.classList.add('show');
    preview.innerHTML = `⏳ Uploading: <strong>${file.name}</strong> ` +
        `(${(file.size / 1024).toFixed(1)} KB)` +
        `<div style="margin-top:8px;color:#f0a500;">📤 Uploading to Storage...</div>`;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) =>
            preview.innerHTML += `<br><img src="${ev.target.result}" alt="Preview">`;
        reader.readAsDataURL(file);
    }

    if (!storage) {
        showToast('❌ Storage not available!', 'error');
        return;
    }

    try {
        const fileName = `paymentSlips/${Date.now()}_` +
            `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadTask = await storage.ref(fileName).put(file);
        uploadedSlipURL = await uploadTask.ref.getDownloadURL();

        preview.innerHTML = `✅ <strong>${file.name}</strong> ` +
            `(${(file.size / 1024).toFixed(1)} KB)` +
            `<div style="color:#4CAF50;margin-top:4px;">📤 Uploaded successfully!</div>`;

        if (file.type.startsWith('image/')) {
            preview.innerHTML += `<br><img src="${uploadedSlipURL}" alt="Slip">`;
        } else {
            preview.innerHTML +=
                `<br><a href="${uploadedSlipURL}" target="_blank" ` +
                `style="color:#f0a500;">🔗 View PDF</a>`;
        }

        showToast('✅ Slip uploaded!', 'success');
    } catch (error) {
        showToast(`❌ Upload failed: ${error.message}`, 'error');
        uploadedSlipURL = null;
    }
}

function clearSlipUpload() {
    uploadedSlipURL = null;
    uploadedSlipFile = null;
    const slipInput = document.getElementById('paymentSlip');
    if (slipInput) slipInput.value = '';
    const preview = document.getElementById('slipPreview');
    if (preview) {
        preview.classList.remove('show');
        preview.innerHTML = '';
    }
}

function bindEvents() {
    const smartInput = document.getElementById('smartSearchInput');
    smartInput.addEventListener('input', onSmartSearchInput);
    smartInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') hideSuggestions();
    });

    document.addEventListener('click', e => {
        const wrap = document.querySelector('.smart-search-wrap');
        if (wrap && !wrap.contains(e.target)) hideSuggestions();
    });

    document.getElementById('academySelect').addEventListener('change', function () {
        if (!isExistingStudentMode) onAcademyChange(this.value);
    });

    document.getElementById('courseSelect').addEventListener('change', function () {
        if (!isExistingStudentMode) onCourseChange(this.value);
    });

    document.getElementById('paymentAmount').addEventListener('input', function () {
        if (appliedDiscount) {
            const newAmount = Number(this.value) || 0;
            let newDiscount =
                (appliedDiscount.type === 'percentage' || appliedDiscount.type === '%')
                    ? (newAmount * appliedDiscount.value) / 100
                    : appliedDiscount.value;
            if (newDiscount > newAmount) newDiscount = newAmount;
            appliedDiscount.amount = newDiscount;
        }
        updateFinalAmount();
    });

    document.getElementById('btnApplyDiscount').addEventListener(
        'click', applyDiscountCode
    );
    document.getElementById('discountCode').addEventListener('keypress', e => {
        if (e.key === 'Enter') { e.preventDefault(); applyDiscountCode(); }
    });

    document.getElementById('btnProcessPayment').addEventListener(
        'click', processPayment
    );

    document.getElementById('paymentSlip').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) handleSlipUpload(file); else clearSlipUpload();
    });

    document.getElementById('receiptModalOverlay').addEventListener('click',
        function (e) {
            if (e.target === this) closeReceiptModal();
        }
    );

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeReceiptModal();
    });
}

function validatePayment() {
    const errors = [];
    const name = document.getElementById('customerName').value.trim();
    if (!name) errors.push('Customer name අවශ්‍යයි');

    const phone = document.getElementById('customerPhone').value.trim();
    if (!phone || phone.replace(/\D/g, '').length < 7)
        errors.push('Phone number අවශ්‍යයි');
    if (!selectedCourseData) errors.push('Course එකක් තෝරන්න');
    if (!selectedPaymentMethod) errors.push('Payment method තෝරන්න');

    const amount = Number(document.getElementById('paymentAmount').value) || 0;
    if (amount <= 0) errors.push('Payment amount අවශ්‍යයි');

    if ((selectedPaymentMethod === 'bank' ||
        selectedPaymentMethod === 'online') && !uploadedSlipURL) {
        errors.push('Bank/Online payment සඳහා slip upload අවශ්‍යයි');
    }

    return errors;
}

async function processPayment() {
    if (isSubmitting) {
        showToast('⏳ Processing... wait!', 'warning');
        return;
    }

    const errors = validatePayment();
    if (errors.length > 0) {
        // ⚡ Optimistic UI: Shake button on error
        const submitBtn = document.getElementById('btnProcessPayment');
        animateElement(submitBtn, 'anim-shake', 400);
        alert('⚠️ පහත errors හදන්න:\n\n• ' + errors.join('\n• '));
        showToast('⚠️ Validation failed!', 'warning');
        return;
    }

    const amount = Number(document.getElementById('paymentAmount').value) || 0;
    const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
    const finalAmount = Math.max(0, amount - discountAmount);

    const confirmMsg = `💳 Payment Process කරන්න?\n\n` +
        `👤 ${document.getElementById('customerName').value.trim()}\n` +
        `🎓 ${selectedCourseData.name}\n` +
        `💳 ${selectedPaymentMethod.toUpperCase()}\n` +
        `💰 ${formatCurrency(amount)}\n` +
        `${appliedDiscount ? `🎟️ Discount: -${formatCurrency(discountAmount)}\n` : ''}` +
        `✅ Final: ${formatCurrency(finalAmount)}`;

    if (!confirm(confirmMsg)) {
        showToast('ℹ️ Cancelled.', 'info');
        return;
    }

    isSubmitting = true;
    const submitBtn = document.getElementById('btnProcessPayment');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Processing...';

    try {
        if (selectedLeadData && selectedLeadData.isExistingStudent) {
            await processAdditionalPayment(amount, finalAmount, discountAmount);
        } else {
            await processNewEnrollment(amount, finalAmount, discountAmount);
        }
    } catch (error) {
        showToast(`❌ Error: ${error.message}`, 'error');
        alert(`❌ Payment failed!\n\n${error.message}`);
        animateElement(submitBtn, 'anim-shake', 400);
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 Process Payment';
    }
}

async function processNewEnrollment(amount, finalAmount, discountAmount) {
    const name = document.getElementById('customerName').value.trim();
    const phone = normalizePhone(
        document.getElementById('customerPhone').value.trim()
    );
    const email = document.getElementById('customerEmail').value.trim();
    const nic = document.getElementById('customerNIC').value.trim();
    const dob = document.getElementById('customerDOB').value;
    const address = document.getElementById('customerAddress').value.trim();
    const notes = document.getElementById('paymentNotes').value.trim();

    const batch = systemSettings?.currentBatch ||
        (await getCurrentBatch()) || 'W1';
    const studentId = await generateStudentId(batch);
    const password = generateStudentPassword();
    const receiptNo = await generateReceiptNo();

    const totalFee = Number(selectedCourseData.fee) || 0;
    const balance = Math.max(0, totalFee - finalAmount);
    const paymentStatus = balance <= 0 ? 'Paid' : 'Partial';

    const paymentRecord = {
        receiptNo, type: 'Down Payment',
        amount: finalAmount, originalAmount: amount,
        discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        method: selectedPaymentMethod, date: new Date(),
        slipURL: uploadedSlipURL || null, notes: notes || '',
        receivedBy: currentUser.nickname || currentUser.name,
        receivedById: currentUser.id, timestamp: Date.now()
    };

    const studentRecord = {
        studentId, password, name, phone,
        email: email || '', nic: nic || '', dob: dob || '',
        address: address || '',
        batchNumber: batch, courseName: selectedCourseData.name,
        courseId: selectedCourseData.id,
        academy: selectedCourseData.academy || '',
        enrolledDate: new Date(), enrollmentSource: paymentSource,
        enrolledBy: currentUser.nickname || currentUser.name,
        enrolledById: currentUser.id,
        leadId: selectedLeadData?.id || null,
        totalFee, totalPaid: finalAmount, balance, paymentStatus,
        discountAmount,
        discountReason: appliedDiscount ? appliedDiscount.code : null,
        payments: [paymentRecord], status: 'Active',
        createdAt: getServerTimestamp(),
        createdBy: currentUser.nickname || currentUser.name
    };

    const studentRef = await db.collection('students').add(studentRecord);

    if (selectedLeadData && selectedLeadData.id && !selectedLeadData.isNew) {
        await db.collection('leads').doc(selectedLeadData.id).update({
            status: 'Enrolled', enrolledDate: new Date(),
            studentId, studentDocId: studentRef.id,
            updatedAt: getServerTimestamp(),
            updatedBy: currentUser.nickname || currentUser.name
        });
    } else {
        const newLead = {
            name, phone, countryCode: '+94', email: email || '',
            status: 'Enrolled', callAttempts: 0,
            courseInterest: selectedCourseData.name,
            source: paymentSource, callHistory: [],
            whatsappHistory: [], enrolledDate: new Date(),
            studentId, studentDocId: studentRef.id,
            createdAt: getServerTimestamp(),
            createdBy: currentUser.nickname || currentUser.name
        };
        const leadRef = await db.collection('leads').add(newLead);
        await db.collection('students').doc(studentRef.id).update({
            leadId: leadRef.id
        });
    }

    invalidateStudentCache();
    await loadSearchCacheCached();

    showReceiptModal({
        type: 'New Enrollment', studentId, password, receiptNo,
        name, phone, course: selectedCourseData.name,
        academy: selectedCourseData.academy || '',
        totalFee, paymentType: 'Down Payment',
        method: selectedPaymentMethod,
        originalAmount: amount, discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        finalAmount, balance, paymentStatus
    });
}

async function processAdditionalPayment(amount, finalAmount, discountAmount) {
    const studentDocId = selectedLeadData.docId || selectedLeadData.studentId;
    const studentRef = db.collection('students').doc(studentDocId);
    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) throw new Error('Student record not found!');

    const student = studentSnap.data();
    const notes = document.getElementById('paymentNotes').value.trim();
    const receiptNo = await generateReceiptNo();

    const newTotalPaid = (Number(student.totalPaid) || 0) + finalAmount;
    const totalFee = Number(student.totalFee) || 0;
    const newBalance = Math.max(0, totalFee - newTotalPaid);
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

    const paymentNumber = (student.payments || []).length + 1;
    const paymentType = paymentNumber === 1
        ? 'Down Payment' : `Installment ${paymentNumber - 1}`;

    const paymentRecord = {
        receiptNo, type: paymentType,
        amount: finalAmount, originalAmount: amount,
        discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        method: selectedPaymentMethod, date: new Date(),
        slipURL: uploadedSlipURL || null, notes: notes || '',
        receivedBy: currentUser.nickname || currentUser.name,
        receivedById: currentUser.id, timestamp: Date.now()
    };

    await studentRef.update({
        totalPaid: newTotalPaid, balance: newBalance,
        paymentStatus: newStatus,
        payments: firebase.firestore.FieldValue.arrayUnion(paymentRecord),
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    });

    invalidateStudentCache();
    await loadSearchCacheCached();

    showReceiptModal({
        type: 'Additional Payment',
        studentId: student.studentId, password: null,
        receiptNo, name: student.name, phone: student.phone,
        course: student.courseName, academy: student.academy || '',
        totalFee, paymentType, method: selectedPaymentMethod,
        originalAmount: amount, discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        finalAmount, balance: newBalance, paymentStatus: newStatus
    });
}

function showReceiptModal(data) {
    lastReceiptData = data;
    const bizName = systemSettings?.businessName || 'Buono';
    const bizSub = systemSettings?.academyFullName || 'Academy';
    const bizContact = [
        systemSettings?.businessPhone || '',
        systemSettings?.businessEmail || ''
    ].filter(Boolean).join(' | ');

    document.getElementById('receiptBusinessName').textContent = bizName;
    document.getElementById('receiptBusinessSub').textContent = bizSub;
    document.getElementById('receiptBusinessContact').textContent = bizContact;
    document.getElementById('receiptFooterContact').textContent = bizContact;
    document.getElementById('receiptNo').textContent = data.receiptNo;
    document.getElementById('receiptDate').textContent = formatDateTime(new Date());

    const badge = document.getElementById('receiptTypeBadge');
    badge.textContent = data.type;
    badge.className = 'receipt-type-badge';
    if (data.type === 'Additional Payment') badge.classList.add('additional');

    document.getElementById('receiptStudentId').textContent = data.studentId || '-';
    document.getElementById('receiptName').textContent = data.name || '-';
    document.getElementById('receiptPhone').textContent = data.phone || '-';

    const passwordRow = document.getElementById('receiptPasswordRow');
    if (data.password) {
        document.getElementById('receiptPassword').textContent = data.password;
        passwordRow.style.display = 'flex';
    } else {
        passwordRow.style.display = 'none';
    }

    document.getElementById('receiptCourse').textContent = data.course || '-';
    document.getElementById('receiptAcademy').textContent = data.academy || '-';
    document.getElementById('receiptTotalFee').textContent =
        formatCurrency(data.totalFee || 0);
    document.getElementById('receiptPaymentType').textContent =
        data.paymentType || '-';

    const methodLabels = {
        cash: '💵 Cash', bank: '🏦 Bank Transfer',
        card: '💳 Card', online: '📱 Online'
    };
    document.getElementById('receiptMethod').textContent =
        methodLabels[data.method] || data.method || '-';

    const discountRow = document.getElementById('receiptDiscountRow');
    if (data.discountAmount && data.discountAmount > 0) {
        document.getElementById('receiptDiscount').textContent = data.discountCode
            ? `- ${formatCurrency(data.discountAmount)} (${data.discountCode})`
            : `- ${formatCurrency(data.discountAmount)}`;
        discountRow.style.display = 'flex';
    } else {
        discountRow.style.display = 'none';
    }

    document.getElementById('receiptAmountPaid').textContent =
        formatCurrency(data.finalAmount || 0);
    document.getElementById('receiptBalance').textContent =
        formatCurrency(data.balance || 0);

    const statusEl = document.getElementById('receiptStatus');
    statusEl.textContent = data.paymentStatus || 'Partial';
    statusEl.className = 'receipt-status';
    if (data.paymentStatus === 'Paid') statusEl.classList.add('paid');
    else if (data.paymentStatus === 'Partial') statusEl.classList.add('partial');
    else statusEl.classList.add('pending');

    document.getElementById('receiptModalOverlay').classList.add('show');
    showToast(`✅ ${data.type} Success! ID: ${data.studentId}`, 'success');

    setTimeout(() => { resetForm(); updateStatsFromCache(); }, 500);
}

function closeReceiptModal() {
    document.getElementById('receiptModalOverlay').classList.remove('show');
}

function closeReceiptAndNew() {
    closeReceiptModal();
    setTimeout(() => document.getElementById('smartSearchInput').focus(), 200);
    showToast('✅ Ready for next payment!', 'success');
}

function printReceipt() {
    showToast('🖨️ Opening print dialog...', 'info');
    setTimeout(() => window.print(), 300);
}

function sendWhatsApp() {
    if (!lastReceiptData) {
        showToast('❌ Receipt data not found!', 'error');
        return;
    }
    const waPhone = (lastReceiptData.phone || '').replace(/\D/g, '');
    if (!waPhone) {
        showToast('❌ Phone number not found!', 'error');
        return;
    }

    const message = buildWhatsAppMessage(lastReceiptData);
    window.open(
        `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`,
        '_blank'
    );
    showToast('📱 WhatsApp opening...', 'success');
}

function buildWhatsAppMessage(data) {
    const template = systemSettings?.whatsappTemplate || '';
    if (template && template.trim().length > 20) {
        let msg = template;
        msg = msg.replace(/\{name\}/gi, data.name || '');
        msg = msg.replace(/\{studentId\}/gi, data.studentId || '');
        msg = msg.replace(/\{password\}/gi, data.password || 'N/A');
        msg = msg.replace(/\{course\}/gi, data.course || '');
        msg = msg.replace(/\{receiptNo\}/gi, data.receiptNo || '');
        msg = msg.replace(/\{amount\}/gi, formatCurrency(data.finalAmount || 0));
        msg = msg.replace(/\{balance\}/gi, formatCurrency(data.balance || 0));
        msg = msg.replace(/\{status\}/gi, data.paymentStatus || '');
        msg = msg.replace(/\{date\}/gi, formatDate(new Date()));
        msg = msg.replace(/\{businessName\}/gi,
            systemSettings?.businessName || 'Buono');
        return msg;
    }

    const bizName = systemSettings?.businessName || 'Buono';
    let msg = `🍴 *${bizName}*\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🧾 *PAYMENT RECEIPT*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📋 *${data.type}*\n\n`;
    msg += `👤 *Student Information*\n`;
    msg += `• Name: ${data.name || '-'}\n`;
    msg += `• Student ID: *${data.studentId || '-'}*\n`;
    if (data.password) msg += `• Password: *${data.password}*\n`;
    msg += `\n🎓 *Course Information*\n`;
    msg += `• Course: ${data.course || '-'}\n`;
    msg += `• Total Fee: ${formatCurrency(data.totalFee || 0)}\n`;
    msg += `\n💳 *Payment Information*\n`;
    msg += `• Receipt No: *${data.receiptNo || '-'}*\n`;
    msg += `• Type: ${data.paymentType || '-'}\n`;
    if (data.discountAmount > 0)
        msg += `• Discount: - ${formatCurrency(data.discountAmount)}\n`;
    msg += `• Amount Paid: *${formatCurrency(data.finalAmount || 0)}*\n`;
    msg += `• Balance: ${formatCurrency(data.balance || 0)}\n`;
    msg += `• Status: *${data.paymentStatus || '-'}*\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `ස්තූතියි! Thank you! 🙏\n`;
    if (systemSettings?.businessPhone) msg += `📞 ${systemSettings.businessPhone}\n`;
    return msg;
}

function resetForm() {
    document.getElementById('smartSearchInput').value = '';
    document.getElementById('btnSmartClear').style.display = 'none';
    hideSuggestions();
    hideSearchStatus();
    document.getElementById('studentSummaryBox').style.display = 'none';
    clearCustomerFields();
    setCustomerFieldsReadonly(false);
    document.getElementById('academySelect').disabled = false;
    document.getElementById('courseSelect').disabled = false;
    clearCourseDetails();
    document.querySelectorAll('.payment-method-card').forEach(
        c => c.classList.remove('selected')
    );
    selectedPaymentMethod = null;
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentNotes').value = '';
    clearDiscount();
    updateFinalAmount();
    clearSlipUpload();
    document.getElementById('slipUploadGroup').style.display = 'none';
    document.getElementById('readonlyBadge').style.display = 'none';
    document.getElementById('courseReadonlyBadge').style.display = 'none';
    selectedLeadData = null;
    selectedCourseData = null;
    selectedExistingStudent = null;
    isExistingStudentMode = false;
    document.getElementById('submitHint').textContent =
        'Submit කලාට පස්සේ Student ID + Password + Receipt auto-generate වෙයි.';
    document.getElementById('smartSearchInput').focus();
}

function normalizePhone(rawPhone) {
    let phone = String(rawPhone || '').trim().replace(/\D/g, '');
    if (!phone) return null;
    if (rawPhone.startsWith('+')) return '+' + phone;
    if (phone.startsWith('94')) return '+' + phone;
    if (phone.startsWith('0')) return '+94' + phone.substring(1);
    if (phone.length === 9) return '+94' + phone;
    return rawPhone;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) { return escapeHtml(value); }

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('💳 payment-script.js loaded! (v7.6 - Optimistic UI!)');