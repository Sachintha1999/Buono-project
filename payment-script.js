// ═══════════════════════════════════════════
// 💳 BUONO PAYMENT SYSTEM - SCRIPT
// File: payment-script.js
// Version: 6.0 (Step 3F - Receipt Modal)
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
let lastReceiptData = null; // ⭐ NEW: Store for WhatsApp/Print

// ═══════════════════════════════════════════
// 🚀 INITIALIZATION
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    console.log('💳 Payment page loading... (v6.0)');

    currentUser = initPage('paymentDB', ['Admin', 'Manager', 'Cashier', 'Call Operator']);
    if (!currentUser) return;

    console.log('✅ User verified:', currentUser.nickname, '|', currentUser.access);

    try {
        storage = firebase.storage();
        console.log('📦 Firebase Storage ready');
    } catch (e) {
        console.warn('⚠️ Storage init failed:', e);
    }

    detectPaymentSource();
    await loadSystemSettings();
    await loadAllCourses();
    setupAcademyDropdown();
    await loadStats();
    bindEvents();

    showToast('✅ Payment system ready!', 'success');
});

// ═══════════════════════════════════════════
// 🎯 SOURCE DETECTION
// ═══════════════════════════════════════════
function detectPaymentSource() {
    if (currentUser.access === 'Cashier') {
        paymentSource = 'Walk In';
    } else if (currentUser.access === 'Call Operator') {
        paymentSource = 'Call Center';
    } else {
        paymentSource = 'Walk In';
    }

    document.getElementById('sourceBadgeValue').textContent = paymentSource;
    document.getElementById('operatorName').textContent = currentUser.nickname || currentUser.name;
    console.log('📍 Source detected:', paymentSource);
}

// ═══════════════════════════════════════════
// ⚙️ LOAD SYSTEM SETTINGS
// ═══════════════════════════════════════════
async function loadSystemSettings() {
    try {
        systemSettings = await getSystemSettings();
        if (!systemSettings) {
            showToast('⚠️ Settings not configured!', 'warning');
            return;
        }
        console.log('⚙️ Settings loaded:', systemSettings);
        loadPaymentMethods();
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast('❌ Error loading settings!', 'error');
    }
}

// ═══════════════════════════════════════════
// 🎓 LOAD ALL COURSES
// ═══════════════════════════════════════════
async function loadAllCourses() {
    try {
        const snap = await db.collection('courses').get();
        allCourses = [];
        snap.forEach(doc => {
            allCourses.push({ id: doc.id, ...doc.data() });
        });
        console.log('🎓 Courses loaded:', allCourses.length);
    } catch (error) {
        console.error('Error loading courses:', error);
        allCourses = [];
    }
}

// ═══════════════════════════════════════════
// 🏫 SETUP ACADEMY DROPDOWN
// ═══════════════════════════════════════════
function setupAcademyDropdown() {
    const academySelect = document.getElementById('academySelect');
    const academiesFromCourses = [...new Set(allCourses.map(c => c.academy).filter(Boolean))];
    const settingsAcademy = systemSettings?.academyShortName || '';
    const settingsFullName = systemSettings?.academyFullName || '';

    const academyMap = {};
    if (settingsAcademy) {
        academyMap[settingsAcademy] = settingsFullName || settingsAcademy;
    }
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
    if (academyKeys.length === 1) {
        academySelect.value = academyKeys[0];
        onAcademyChange(academyKeys[0]);
        console.log('🏫 Auto-selected single academy:', academyKeys[0]);
    }
}

// ═══════════════════════════════════════════
// 🏫 ACADEMY CHANGE
// ═══════════════════════════════════════════
function onAcademyChange(academyCode) {
    const courseSelect = document.getElementById('courseSelect');

    if (!academyCode) {
        courseSelect.disabled = true;
        courseSelect.innerHTML = '<option value="">-- මුලින්ම Academy තෝරන්න --</option>';
        clearCourseDetails();
        return;
    }

    filteredCourses = allCourses.filter(c =>
        c.academy && c.academy.toUpperCase() === academyCode.toUpperCase()
    );

    let html = '<option value="">-- Course තෝරන්න --</option>';
    if (filteredCourses.length === 0) {
        html = '<option value="">⚠️ මෙම Academy සඳහා course නැහැ</option>';
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

    if (selectedLeadData && selectedLeadData.courseInterest) {
        autoSelectCourse(selectedLeadData.courseInterest);
    }
}

// ═══════════════════════════════════════════
// 🎓 AUTO-SELECT COURSE
// ═══════════════════════════════════════════
function autoSelectCourse(courseInterest) {
    if (!courseInterest || filteredCourses.length === 0) return;
    const interest = courseInterest.trim().toLowerCase();

    let match = filteredCourses.find(c => c.name && c.name.trim().toLowerCase() === interest);
    if (!match) match = filteredCourses.find(c => c.name && c.name.trim().toLowerCase().includes(interest));
    if (!match) match = filteredCourses.find(c => c.name && interest.includes(c.name.trim().toLowerCase()));

    if (match) {
        document.getElementById('courseSelect').value = match.id;
        onCourseChange(match.id);
        showToast(`🎓 Course auto-selected: ${match.name}`, 'success');
    }
}

// ═══════════════════════════════════════════
// 🎓 COURSE CHANGE
// ═══════════════════════════════════════════
function onCourseChange(courseId) {
    const feeBox = document.getElementById('courseFeeBox');

    if (!courseId) {
        clearCourseDetails();
        return;
    }

    selectedCourseData = filteredCourses.find(c => c.id === courseId) || allCourses.find(c => c.id === courseId);
    if (!selectedCourseData) {
        clearCourseDetails();
        return;
    }

    const fee = Number(selectedCourseData.fee) || 0;
    const downPayment = Number(selectedCourseData.downPayment) || 0;
    const defaultInstallments = Number(systemSettings?.defaultInstallments) || 2;
    const balance = fee - downPayment;
    const perInstallment = defaultInstallments > 0 ? Math.ceil(balance / defaultInstallments) : balance;

    document.getElementById('feeAmount').textContent = formatCurrency(fee);
    document.getElementById('feeDownPayment').textContent = formatCurrency(downPayment);
    document.getElementById('feeBalance').textContent = formatCurrency(balance);

    if (balance > 0 && defaultInstallments > 0) {
        document.getElementById('feeInstallments').textContent =
            `${defaultInstallments} payments × ${formatCurrency(perInstallment)}`;
    } else if (balance <= 0) {
        document.getElementById('feeInstallments').textContent = 'Full payment with down payment';
    } else {
        document.getElementById('feeInstallments').textContent = `${defaultInstallments} payments`;
    }

    feeBox.style.display = 'block';
    document.getElementById('paymentAmount').value = downPayment;

    clearDiscount();
    updateFinalAmount();

    showToast(`💰 ${selectedCourseData.name}: ${formatCurrency(fee)}`, 'info');
}

// ═══════════════════════════════════════════
// 🧹 CLEAR COURSE DETAILS
// ═══════════════════════════════════════════
function clearCourseDetails() {
    selectedCourseData = null;
    document.getElementById('courseFeeBox').style.display = 'none';
    document.getElementById('feeAmount').textContent = 'Rs. 0';
    document.getElementById('feeDownPayment').textContent = 'Rs. 0';
    document.getElementById('feeInstallments').textContent = '0 payments';
    document.getElementById('feeBalance').textContent = 'Rs. 0';
    document.getElementById('paymentAmount').value = '';
    clearDiscount();
    updateFinalAmount();
}

// ═══════════════════════════════════════════
// 💳 LOAD PAYMENT METHODS
// ═══════════════════════════════════════════
function loadPaymentMethods() {
    const grid = document.getElementById('paymentMethodsGrid');
    const methods = systemSettings?.paymentMethods || {
        cash: true, bank: true, card: true, online: true
    };

    const methodConfig = [
        { key: 'cash',   icon: '💵', label: 'Cash' },
        { key: 'bank',   icon: '🏦', label: 'Bank Transfer' },
        { key: 'card',   icon: '💳', label: 'Card' },
        { key: 'online', icon: '📱', label: 'Online' }
    ];

    let html = '';
    methodConfig.forEach(m => {
        if (methods[m.key]) {
            html += `
                <div class="payment-method-card" data-method="${m.key}" onclick="selectPaymentMethod('${m.key}')">
                    <div class="payment-method-icon">${m.icon}</div>
                    <div class="payment-method-label">${m.label}</div>
                </div>
            `;
        }
    });

    grid.innerHTML = html || '<div class="loading-msg">⚠️ No payment methods enabled!</div>';
}

// ═══════════════════════════════════════════
// 💳 SELECT PAYMENT METHOD
// ═══════════════════════════════════════════
function selectPaymentMethod(methodKey) {
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });

    const selected = document.querySelector(`[data-method="${methodKey}"]`);
    if (selected) selected.classList.add('selected');

    selectedPaymentMethod = methodKey;

    const slipGroup = document.getElementById('slipUploadGroup');
    if (methodKey === 'bank' || methodKey === 'online') {
        slipGroup.style.display = 'block';
    } else {
        slipGroup.style.display = 'none';
        clearSlipUpload();
    }

    console.log('💳 Payment method:', methodKey);
}

// ═══════════════════════════════════════════
// 💰 APPLY DISCOUNT CODE
// ═══════════════════════════════════════════
function applyDiscountCode() {
    const codeInput = document.getElementById('discountCode');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        showToast('⚠️ Discount code එක දාන්න!', 'warning');
        codeInput.focus();
        return;
    }

    const paymentAmount = Number(document.getElementById('paymentAmount').value) || 0;
    if (paymentAmount <= 0) {
        showToast('⚠️ Payment amount එක මුලින් දාන්න!', 'warning');
        return;
    }

    const discountCodes = systemSettings?.discountCodes || [];
    if (discountCodes.length === 0) {
        showToast('⚠️ Settings වල discount codes නැහැ!', 'warning');
        return;
    }

    const matchedDiscount = discountCodes.find(d =>
        d.code && d.code.toUpperCase() === code
    );

    if (!matchedDiscount) {
        showToast(`❌ Invalid discount code: ${code}`, 'error');
        codeInput.value = '';
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

    if (discountAmount > paymentAmount) {
        discountAmount = paymentAmount;
        showToast('⚠️ Discount capped at payment amount!', 'warning');
    }

    appliedDiscount = {
        code: matchedDiscount.code,
        type: discountType,
        value: discountValue,
        amount: discountAmount
    };

    console.log('💰 Discount applied:', appliedDiscount);
    updateFinalAmount();

    const typeLabel = (discountType === 'percentage' || discountType === '%') ?
        `${discountValue}%` : formatCurrency(discountValue);

    showToast(`✅ Discount applied: ${matchedDiscount.code} (${typeLabel})`, 'success');
}

// ═══════════════════════════════════════════
// 🧹 CLEAR DISCOUNT
// ═══════════════════════════════════════════
function clearDiscount() {
    appliedDiscount = null;
    const codeInput = document.getElementById('discountCode');
    if (codeInput) codeInput.value = '';
}

// ═══════════════════════════════════════════
// 💵 UPDATE FINAL AMOUNT DISPLAY
// ═══════════════════════════════════════════
function updateFinalAmount() {
    const paymentAmount = Number(document.getElementById('paymentAmount').value) || 0;
    const finalAmountBox = document.getElementById('finalAmountBox');

    if (paymentAmount <= 0) {
        finalAmountBox.style.display = 'none';
        return;
    }

    const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
    const finalAmount = Math.max(0, paymentAmount - discountAmount);

    document.getElementById('originalAmountDisplay').textContent = formatCurrency(paymentAmount);
    document.getElementById('discountDisplay').textContent = '- ' + formatCurrency(discountAmount);
    document.getElementById('finalAmountDisplay').textContent = formatCurrency(finalAmount);

    finalAmountBox.style.display = 'block';
}

// ═══════════════════════════════════════════
// 📎 HANDLE SLIP UPLOAD
// ═══════════════════════════════════════════
async function handleSlipUpload(file) {
    if (!file) return;
    const preview = document.getElementById('slipPreview');

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('❌ File size 5MB ට වැඩියි!', 'error');
        document.getElementById('paymentSlip').value = '';
        clearSlipUpload();
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        showToast('❌ Only JPG/PNG/WEBP/PDF allowed!', 'error');
        document.getElementById('paymentSlip').value = '';
        clearSlipUpload();
        return;
    }

    uploadedSlipFile = file;

    preview.classList.add('show');
    preview.innerHTML = `
        ⏳ Uploading: <strong>${file.name}</strong> (${(file.size/1024).toFixed(1)} KB)
        <div style="margin-top:8px;color:#f0a500;">📤 Uploading to Storage...</div>
    `;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const existing = preview.innerHTML;
            preview.innerHTML = existing + `<br><img src="${ev.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }

    if (!storage) {
        showToast('❌ Firebase Storage not available!', 'error');
        return;
    }

    try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `paymentSlips/${timestamp}_${safeName}`;
        const storageRef = storage.ref(fileName);
        const uploadTask = await storageRef.put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();

        uploadedSlipURL = downloadURL;
        console.log('📎 Slip uploaded:', downloadURL);

        preview.innerHTML = `
            ✅ <strong>${file.name}</strong> (${(file.size/1024).toFixed(1)} KB)
            <div style="color:#4CAF50;margin-top:4px;">📤 Uploaded successfully!</div>
        `;

        if (file.type.startsWith('image/')) {
            preview.innerHTML += `<br><img src="${downloadURL}" alt="Slip">`;
        } else {
            preview.innerHTML += `<br><a href="${downloadURL}" target="_blank" style="color:#f0a500;">🔗 View PDF</a>`;
        }

        showToast('✅ Slip uploaded successfully!', 'success');

    } catch (error) {
        console.error('Slip upload error:', error);
        showToast(`❌ Upload failed: ${error.message}`, 'error');
        preview.innerHTML = `❌ Upload failed!<br><small>${error.message}</small>`;
        uploadedSlipURL = null;
    }
}

// ═══════════════════════════════════════════
// 🧹 CLEAR SLIP UPLOAD
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// 📊 LOAD STATS
// ═══════════════════════════════════════════
async function loadStats() {
    try {
        const snap = await db.collection('students').get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        let todayRevenue = 0;
        let todayEnrolled = 0;
        let monthTotal = 0;
        let pendingPayments = 0;
        const totalStudents = snap.size;

        snap.forEach(doc => {
            const student = doc.data();

            if (student.enrolledDate) {
                const enrollDate = student.enrolledDate.toDate ?
                    student.enrolledDate.toDate() : new Date(student.enrolledDate);
                if (enrollDate >= today) todayEnrolled++;
            }

            if (student.paymentStatus === 'Pending' || student.paymentStatus === 'Partial') {
                pendingPayments++;
            }

            (student.payments || []).forEach(p => {
                const pDate = p.date && p.date.toDate ? p.date.toDate() : new Date(p.date);
                if (pDate >= today) todayRevenue += Number(p.amount || 0);
                if (pDate >= monthStart) monthTotal += Number(p.amount || 0);
            });
        });

        document.getElementById('statTodayRevenue').textContent = formatCurrency(todayRevenue);
        document.getElementById('statTodayEnrolled').textContent = todayEnrolled;
        document.getElementById('statMonthTotal').textContent = formatCurrency(monthTotal);
        document.getElementById('statPending').textContent = pendingPayments;
        document.getElementById('statTotalStudents').textContent = totalStudents;

        console.log('📊 Stats loaded');
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ═══════════════════════════════════════════
// 🎯 BIND EVENTS
// ═══════════════════════════════════════════
function bindEvents() {
    document.getElementById('btnSearchPhone').addEventListener('click', searchByPhone);

    document.getElementById('customerPhone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchByPhone();
        }
    });

    document.getElementById('customerPhone').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
    });

    document.getElementById('academySelect').addEventListener('change', function() {
        onAcademyChange(this.value);
    });

    document.getElementById('courseSelect').addEventListener('change', function() {
        onCourseChange(this.value);
    });

    document.getElementById('paymentAmount').addEventListener('input', function() {
        if (appliedDiscount) {
            const newAmount = Number(this.value) || 0;
            const discountType = appliedDiscount.type;
            const discountValue = appliedDiscount.value;
            let newDiscountAmount = 0;
            if (discountType === 'percentage' || discountType === '%') {
                newDiscountAmount = (newAmount * discountValue) / 100;
            } else {
                newDiscountAmount = discountValue;
            }
            if (newDiscountAmount > newAmount) newDiscountAmount = newAmount;
            appliedDiscount.amount = newDiscountAmount;
        }
        updateFinalAmount();
    });

    document.getElementById('btnApplyDiscount').addEventListener('click', applyDiscountCode);

    document.getElementById('discountCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyDiscountCode();
        }
    });

    document.getElementById('btnProcessPayment').addEventListener('click', processPayment);

    document.getElementById('paymentSlip').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) handleSlipUpload(file);
        else clearSlipUpload();
    });

    // Close modal on overlay click
    document.getElementById('receiptModalOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeReceiptModal();
        }
    });

    // ESC key close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeReceiptModal();
        }
    });
}

// ═══════════════════════════════════════════
// ✅ VALIDATE BEFORE SUBMIT
// ═══════════════════════════════════════════
function validatePayment() {
    const errors = [];

    const name = document.getElementById('customerName').value.trim();
    if (!name) errors.push('Customer name අවශ්‍යයි');

    const phone = document.getElementById('customerPhone').value.trim();
    if (!phone || phone.length < 7) errors.push('Phone number අවශ්‍යයි (7+ digits)');

    if (!selectedCourseData) errors.push('Course එකක් තෝරන්න');
    if (!selectedPaymentMethod) errors.push('Payment method එකක් තෝරන්න');

    const amount = Number(document.getElementById('paymentAmount').value) || 0;
    if (amount <= 0) errors.push('Payment amount අවශ්‍යයි');

    if ((selectedPaymentMethod === 'bank' || selectedPaymentMethod === 'online') && !uploadedSlipURL) {
        errors.push('Bank/Online payment සඳහා slip upload අවශ්‍යයි');
    }

    return errors;
}

// ═══════════════════════════════════════════
// 💾 PROCESS PAYMENT (MAIN FUNCTION!)
// ═══════════════════════════════════════════
async function processPayment() {
    if (isSubmitting) {
        showToast('⏳ Already processing... wait!', 'warning');
        return;
    }

    // Step 1: Validate
    const errors = validatePayment();
    if (errors.length > 0) {
        alert('⚠️ පහත errors හදන්න:\n\n• ' + errors.join('\n• '));
        showToast('⚠️ Validation failed!', 'warning');
        return;
    }

    // Step 2: Confirm
    const amount = Number(document.getElementById('paymentAmount').value) || 0;
    const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
    const finalAmount = Math.max(0, amount - discountAmount);

    const confirmMsg = `💳 Payment Process කරන්න සහතිකද?\n\n` +
        `👤 Customer: ${document.getElementById('customerName').value.trim()}\n` +
        `🎓 Course: ${selectedCourseData.name}\n` +
        `💳 Method: ${selectedPaymentMethod.toUpperCase()}\n` +
        `💰 Amount: ${formatCurrency(amount)}\n` +
        `${appliedDiscount ? `🎟️ Discount: -${formatCurrency(discountAmount)}\n` : ''}` +
        `✅ Final: ${formatCurrency(finalAmount)}\n\n` +
        `Submit කරන්න OK click කරන්න.`;

    if (!confirm(confirmMsg)) {
        showToast('ℹ️ Cancelled.', 'info');
        return;
    }

    // Step 3: Submit
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
        console.error('❌ Payment processing error:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
        alert(`❌ Payment failed!\n\n${error.message}`);
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 Process Payment';
    }
}

// ═══════════════════════════════════════════
// 🎓 PROCESS NEW ENROLLMENT
// ═══════════════════════════════════════════
async function processNewEnrollment(amount, finalAmount, discountAmount) {
    console.log('🎓 Processing new enrollment...');

    const name = document.getElementById('customerName').value.trim();
    const phone = normalizePhone(document.getElementById('customerPhone').value.trim());
    const email = document.getElementById('customerEmail').value.trim();
    const nic = document.getElementById('customerNIC').value.trim();
    const dob = document.getElementById('customerDOB').value;
    const address = document.getElementById('customerAddress').value.trim();
    const notes = document.getElementById('paymentNotes').value.trim();

    const batch = systemSettings?.currentBatch || await getCurrentBatch() || 'W1';
    const studentId = await generateStudentId(batch);
    const password = generateStudentPassword();
    const receiptNo = await generateReceiptNo();

    console.log('🆔 Generated:', { studentId, password, receiptNo });

    const totalFee = Number(selectedCourseData.fee) || 0;
    const totalPaid = finalAmount;
    const balance = Math.max(0, totalFee - totalPaid);
    const paymentStatus = balance <= 0 ? 'Paid' : 'Partial';

    const paymentRecord = {
        receiptNo: receiptNo,
        type: 'Down Payment',
        amount: finalAmount,
        originalAmount: amount,
        discountAmount: discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        method: selectedPaymentMethod,
        date: new Date(),
        slipURL: uploadedSlipURL || null,
        notes: notes || '',
        receivedBy: currentUser.nickname || currentUser.name,
        receivedById: currentUser.id,
        timestamp: Date.now()
    };

    const studentRecord = {
        studentId: studentId,
        password: password,
        name: name,
        phone: phone,
        email: email || '',
        nic: nic || '',
        dob: dob || '',
        address: address || '',
        batchNumber: batch,
        courseName: selectedCourseData.name,
        courseId: selectedCourseData.id,
        academy: selectedCourseData.academy || '',
        enrolledDate: new Date(),
        enrollmentSource: paymentSource,
        enrolledBy: currentUser.nickname || currentUser.name,
        enrolledById: currentUser.id,
        leadId: selectedLeadData && selectedLeadData.id ? selectedLeadData.id : null,
        totalFee: totalFee,
        totalPaid: totalPaid,
        balance: balance,
        paymentStatus: paymentStatus,
        discountAmount: discountAmount,
        discountReason: appliedDiscount ? appliedDiscount.code : null,
        payments: [paymentRecord],
        status: 'Active',
        createdAt: getServerTimestamp(),
        createdBy: currentUser.nickname || currentUser.name
    };

    const studentRef = await db.collection('students').add(studentRecord);
    console.log('✅ Student created:', studentRef.id);

    if (selectedLeadData && selectedLeadData.id && !selectedLeadData.isNew) {
        await db.collection('leads').doc(selectedLeadData.id).update({
            status: 'Enrolled',
            enrolledDate: new Date(),
            studentId: studentId,
            studentDocId: studentRef.id,
            payment: {
                downPaid: true,
                downAmount: finalAmount,
                downDate: new Date(),
                downMethod: selectedPaymentMethod,
                receiptNo: receiptNo
            },
            updatedAt: getServerTimestamp(),
            updatedBy: currentUser.nickname || currentUser.name
        });
        console.log('✅ Lead updated:', selectedLeadData.id);
    } else {
        const newLeadRecord = {
            name: name,
            phone: phone,
            countryCode: '+94',
            email: email || '',
            nic: nic || '',
            address: address || '',
            status: 'Enrolled',
            callAttempts: 0,
            courseInterest: selectedCourseData.name,
            source: paymentSource,
            callHistory: [],
            whatsappHistory: [],
            enrolledDate: new Date(),
            studentId: studentId,
            studentDocId: studentRef.id,
            payment: {
                downPaid: true,
                downAmount: finalAmount,
                downDate: new Date(),
                downMethod: selectedPaymentMethod,
                receiptNo: receiptNo
            },
            createdAt: getServerTimestamp(),
            createdBy: currentUser.nickname || currentUser.name
        };

        const leadRef = await db.collection('leads').add(newLeadRecord);
        console.log('✅ New lead created:', leadRef.id);

        await db.collection('students').doc(studentRef.id).update({
            leadId: leadRef.id
        });
    }

    // ⭐ Show Receipt Modal instead of alert!
    showReceiptModal({
        type: 'New Enrollment',
        studentId,
        password,
        receiptNo,
        name,
        phone,
        course: selectedCourseData.name,
        academy: selectedCourseData.academy || '',
        totalFee,
        paymentType: 'Down Payment',
        method: selectedPaymentMethod,
        originalAmount: amount,
        discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        finalAmount,
        balance,
        paymentStatus
    });
}

// ═══════════════════════════════════════════
// 💵 PROCESS ADDITIONAL PAYMENT
// ═══════════════════════════════════════════
async function processAdditionalPayment(amount, finalAmount, discountAmount) {
    console.log('💵 Processing additional payment for existing student...');

    const studentDocId = selectedLeadData.studentId;
    const studentRef = db.collection('students').doc(studentDocId);
    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) {
        throw new Error('Student record not found!');
    }

    const student = studentSnap.data();
    const notes = document.getElementById('paymentNotes').value.trim();
    const receiptNo = await generateReceiptNo();

    const currentPaid = Number(student.totalPaid) || 0;
    const newTotalPaid = currentPaid + finalAmount;
    const totalFee = Number(student.totalFee) || 0;
    const newBalance = Math.max(0, totalFee - newTotalPaid);
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

    const existingPayments = student.payments || [];
    const paymentNumber = existingPayments.length + 1;
    const paymentType = paymentNumber === 1 ? 'Down Payment' : `Installment ${paymentNumber - 1}`;

    const paymentRecord = {
        receiptNo: receiptNo,
        type: paymentType,
        amount: finalAmount,
        originalAmount: amount,
        discountAmount: discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        method: selectedPaymentMethod,
        date: new Date(),
        slipURL: uploadedSlipURL || null,
        notes: notes || '',
        receivedBy: currentUser.nickname || currentUser.name,
        receivedById: currentUser.id,
        timestamp: Date.now()
    };

    await studentRef.update({
        totalPaid: newTotalPaid,
        balance: newBalance,
        paymentStatus: newStatus,
        payments: firebase.firestore.FieldValue.arrayUnion(paymentRecord),
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname || currentUser.name
    });

    console.log('✅ Additional payment added');

    // ⭐ Show Receipt Modal instead of alert!
    showReceiptModal({
        type: 'Additional Payment',
        studentId: student.studentId,
        password: null,
        receiptNo,
        name: student.name,
        phone: student.phone,
        course: student.courseName,
        academy: student.academy || '',
        totalFee: totalFee,
        paymentType: paymentType,
        method: selectedPaymentMethod,
        originalAmount: amount,
        discountAmount,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        finalAmount,
        balance: newBalance,
        paymentStatus: newStatus
    });
}

// ═══════════════════════════════════════════
// 🧾 SHOW RECEIPT MODAL ⭐ NEW - Step 3F
// ═══════════════════════════════════════════
function showReceiptModal(data) {
    console.log('🧾 Showing receipt modal:', data);

    // Store for WhatsApp later
    lastReceiptData = data;

    // ── Business Info ──
    const bizName = systemSettings?.businessName || 'Buono';
    const bizSub  = systemSettings?.academyFullName || 'Academy';
    const bizPhone = systemSettings?.businessPhone || '';
    const bizEmail = systemSettings?.businessEmail || '';
    const bizContact = [bizPhone, bizEmail].filter(Boolean).join(' | ');

    document.getElementById('receiptBusinessName').textContent = bizName;
    document.getElementById('receiptBusinessSub').textContent = bizSub;
    document.getElementById('receiptBusinessContact').textContent = bizContact;
    document.getElementById('receiptFooterContact').textContent = bizContact;

    // ── Receipt Header ──
    document.getElementById('receiptNo').textContent = data.receiptNo;
    document.getElementById('receiptDate').textContent = formatDateTime(new Date());

    // ── Type Badge ──
    const badge = document.getElementById('receiptTypeBadge');
    badge.textContent = data.type;
    badge.className = 'receipt-type-badge';
    if (data.type === 'Additional Payment') {
        badge.classList.add('additional');
    }

    // ── Student Info ──
    document.getElementById('receiptStudentId').textContent = data.studentId || '-';
    document.getElementById('receiptName').textContent = data.name || '-';
    document.getElementById('receiptPhone').textContent = data.phone || '-';

    // Password row - hide for additional payments
    const passwordRow = document.getElementById('receiptPasswordRow');
    if (data.password) {
        document.getElementById('receiptPassword').textContent = data.password;
        passwordRow.style.display = 'flex';
    } else {
        passwordRow.style.display = 'none';
    }

    // ── Course Info ──
    document.getElementById('receiptCourse').textContent = data.course || '-';
    document.getElementById('receiptAcademy').textContent = data.academy || '-';
    document.getElementById('receiptTotalFee').textContent = formatCurrency(data.totalFee || 0);

    // ── Payment Info ──
    document.getElementById('receiptPaymentType').textContent = data.paymentType || '-';

    // Method label
    const methodLabels = {
        cash: '💵 Cash',
        bank: '🏦 Bank Transfer',
        card: '💳 Card',
        online: '📱 Online'
    };
    document.getElementById('receiptMethod').textContent = methodLabels[data.method] || data.method || '-';

    // Discount row
    const discountRow = document.getElementById('receiptDiscountRow');
    if (data.discountAmount && data.discountAmount > 0) {
        const discountText = data.discountCode
            ? `- ${formatCurrency(data.discountAmount)} (${data.discountCode})`
            : `- ${formatCurrency(data.discountAmount)}`;
        document.getElementById('receiptDiscount').textContent = discountText;
        discountRow.style.display = 'flex';
    } else {
        discountRow.style.display = 'none';
    }

    // Amount paid
    document.getElementById('receiptAmountPaid').textContent = formatCurrency(data.finalAmount || 0);

    // ── Balance Box ──
    document.getElementById('receiptBalance').textContent = formatCurrency(data.balance || 0);

    const statusEl = document.getElementById('receiptStatus');
    statusEl.textContent = data.paymentStatus || 'Partial';
    statusEl.className = 'receipt-status';
    if (data.paymentStatus === 'Paid') {
        statusEl.classList.add('paid');
    } else if (data.paymentStatus === 'Partial') {
        statusEl.classList.add('partial');
    } else {
        statusEl.classList.add('pending');
    }

    // ── Show Modal ──
    const overlay = document.getElementById('receiptModalOverlay');
    overlay.classList.add('show');

    // Scroll to top of modal
    overlay.scrollTop = 0;

    showToast(`✅ ${data.type} Success! ID: ${data.studentId}`, 'success');

    // Reset form after small delay
    setTimeout(() => {
        resetForm();
        loadStats();
    }, 500);
}

// ═══════════════════════════════════════════
// ✕ CLOSE RECEIPT MODAL ⭐ NEW
// ═══════════════════════════════════════════
function closeReceiptModal() {
    const overlay = document.getElementById('receiptModalOverlay');
    overlay.classList.remove('show');
    console.log('🔒 Receipt modal closed');
}

// ═══════════════════════════════════════════
// ➕ CLOSE AND NEW PAYMENT ⭐ NEW
// ═══════════════════════════════════════════
function closeReceiptAndNew() {
    closeReceiptModal();
    // Form already reset - just focus phone
    setTimeout(() => {
        const phoneInput = document.getElementById('customerPhone');
        if (phoneInput) phoneInput.focus();
    }, 200);
    showToast('✅ Ready for next payment!', 'success');
}

// ═══════════════════════════════════════════
// 🖨️ PRINT RECEIPT ⭐ NEW
// ═══════════════════════════════════════════
function printReceipt() {
    console.log('🖨️ Printing receipt...');
    showToast('🖨️ Opening print dialog...', 'info');
    setTimeout(() => {
        window.print();
    }, 300);
}

// ═══════════════════════════════════════════
// 📱 SEND WHATSAPP ⭐ NEW
// ═══════════════════════════════════════════
function sendWhatsApp() {
    if (!lastReceiptData) {
        showToast('❌ Receipt data not found!', 'error');
        return;
    }

    const data = lastReceiptData;
    const phone = data.phone || '';

    // Clean phone for WhatsApp (remove + and spaces)
    const waPhone = phone.replace(/\D/g, '');
    if (!waPhone) {
        showToast('❌ Phone number not found!', 'error');
        return;
    }

    // Build WhatsApp message
    let message = buildWhatsAppMessage(data);

    // Encode and open
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${waPhone}?text=${encoded}`;

    console.log('📱 Opening WhatsApp:', waUrl);
    window.open(waUrl, '_blank');
    showToast('📱 WhatsApp opening...', 'success');
}

// ═══════════════════════════════════════════
// 📝 BUILD WHATSAPP MESSAGE ⭐ NEW
// ═══════════════════════════════════════════
function buildWhatsAppMessage(data) {
    // Try to use template from settings
    const template = systemSettings?.whatsappTemplate || '';

    if (template && template.trim().length > 20) {
        // Use settings template with replacements
        let msg = template;
        msg = msg.replace(/\{name\}/gi, data.name || '');
        msg = msg.replace(/\{studentId\}/gi, data.studentId || '');
        msg = msg.replace(/\{password\}/gi, data.password || 'N/A');
        msg = msg.replace(/\{course\}/gi, data.course || '');
        msg = msg.replace(/\{academy\}/gi, data.academy || '');
        msg = msg.replace(/\{receiptNo\}/gi, data.receiptNo || '');
        msg = msg.replace(/\{amount\}/gi, formatCurrency(data.finalAmount || 0));
        msg = msg.replace(/\{balance\}/gi, formatCurrency(data.balance || 0));
        msg = msg.replace(/\{status\}/gi, data.paymentStatus || '');
        msg = msg.replace(/\{date\}/gi, formatDate(new Date()));
        msg = msg.replace(/\{businessName\}/gi, systemSettings?.businessName || 'Buono');
        msg = msg.replace(/\{businessPhone\}/gi, systemSettings?.businessPhone || '');
        return msg;
    }

    // Default message if no template
    const bizName = systemSettings?.businessName || 'Buono';
    const bizPhone = systemSettings?.businessPhone || '';

    let msg = `🍴 *${bizName}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🧾 *PAYMENT RECEIPT*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `📋 *${data.type}*\n\n`;

    msg += `👤 *Student Information*\n`;
    msg += `• Name: ${data.name || '-'}\n`;
    msg += `• Student ID: *${data.studentId || '-'}*\n`;
    if (data.password) {
        msg += `• Password: *${data.password}*\n`;
    }
    msg += `\n`;

    msg += `🎓 *Course Information*\n`;
    msg += `• Course: ${data.course || '-'}\n`;
    msg += `• Total Fee: ${formatCurrency(data.totalFee || 0)}\n`;
    msg += `\n`;

    msg += `💳 *Payment Information*\n`;
    msg += `• Receipt No: *${data.receiptNo || '-'}*\n`;
    msg += `• Type: ${data.paymentType || '-'}\n`;
    if (data.discountAmount > 0) {
        msg += `• Discount: - ${formatCurrency(data.discountAmount)}\n`;
    }
    msg += `• Amount Paid: *${formatCurrency(data.finalAmount || 0)}*\n`;
    msg += `• Balance: ${formatCurrency(data.balance || 0)}\n`;
    msg += `• Status: *${data.paymentStatus || '-'}*\n`;
    msg += `\n`;

    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `ස්තූතියි! Thank you! 🙏\n`;
    if (bizPhone) msg += `📞 ${bizPhone}\n`;

    return msg;
}

// ═══════════════════════════════════════════
// 🔄 RESET FORM
// ═══════════════════════════════════════════
function resetForm() {
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerNIC').value = '';
    document.getElementById('customerDOB').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('phoneSearchStatus').innerHTML = '';
    document.getElementById('phoneSearchStatus').className = 'phone-search-status';

    document.getElementById('courseSelect').value = '';
    clearCourseDetails();

    document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
    selectedPaymentMethod = null;
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentNotes').value = '';
    clearDiscount();
    updateFinalAmount();
    clearSlipUpload();
    document.getElementById('slipUploadGroup').style.display = 'none';

    selectedLeadData = null;
    selectedCourseData = null;

    document.getElementById('customerPhone').focus();
    console.log('🔄 Form reset complete');
}

// ═══════════════════════════════════════════
// 📱 NORMALIZE PHONE NUMBER
// ═══════════════════════════════════════════
function normalizePhone(rawPhone) {
    let phone = rawPhone.replace(/\D/g, '');
    if (!phone) return null;
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (phone.startsWith('94')) return '+' + phone;
    return '+94' + phone;
}

// ═══════════════════════════════════════════
// 🔍 SEARCH BY PHONE
// ═══════════════════════════════════════════
async function searchByPhone() {
    const phoneInput = document.getElementById('customerPhone');
    const statusEl = document.getElementById('phoneSearchStatus');
    const rawPhone = phoneInput.value.trim();

    if (!rawPhone || rawPhone.length < 7) {
        statusEl.className = 'phone-search-status not-found';
        statusEl.textContent = '⚠️ Phone number එක හරිද බලන්න';
        showToast('⚠️ Valid phone number දාන්න!', 'warning');
        phoneInput.focus();
        return;
    }

    const fullPhone = normalizePhone(rawPhone);
    console.log('🔍 Searching for:', fullPhone);

    statusEl.className = 'phone-search-status';
    statusEl.textContent = '⏳ Searching...';

    try {
        const leadsSnap = await db.collection('leads').where('phone', '==', fullPhone).get();
        const studentsSnap = await db.collection('students').where('phone', '==', fullPhone).get();

        if (!studentsSnap.empty) {
            handleExistingStudent(studentsSnap.docs[0]);
            return;
        }

        if (!leadsSnap.empty) {
            handleExistingLead(leadsSnap.docs[0]);
            return;
        }

        handleNewCustomer(fullPhone);

    } catch (error) {
        console.error('Search error:', error);
        statusEl.className = 'phone-search-status not-found';
        statusEl.textContent = '❌ Search failed!';
        showToast('❌ Search error!', 'error');
    }
}

// ═══════════════════════════════════════════
// ⚠️ HANDLE EXISTING STUDENT
// ═══════════════════════════════════════════
function handleExistingStudent(doc) {
    const student = { id: doc.id, ...doc.data() };
    const statusEl = document.getElementById('phoneSearchStatus');

    console.log('⚠️ Already a student:', student);

    const balanceText = student.balance > 0 ?
        `<br>💰 Balance: <strong>${formatCurrency(student.balance)}</strong> (additional payment allowed!)` :
        `<br>✅ Fully Paid!`;

    statusEl.className = 'phone-search-status found';
    statusEl.innerHTML = `
        ℹ️ <strong>Existing student found!</strong><br>
        🆔 Student ID: <strong>${student.studentId || 'N/A'}</strong><br>
        🎓 Course: ${student.courseName || 'N/A'}<br>
        💰 Status: ${student.paymentStatus || 'Active'}
        ${balanceText}
    `;

    document.getElementById('customerName').value = student.name || '';
    document.getElementById('customerEmail').value = student.email || '';
    document.getElementById('customerNIC').value = student.nic || '';
    document.getElementById('customerAddress').value = student.address || '';

    showToast(`ℹ️ Existing student: ${student.studentId}`, 'info');

    selectedLeadData = {
        isExistingStudent: true,
        studentId: student.id,
        ...student
    };

    if (student.courseName) {
        tryAutoSelectAcademyAndCourse(student.courseName);
    }

    if (student.balance > 0) {
        setTimeout(() => {
            const installments = Number(systemSettings?.defaultInstallments) || 2;
            const perInstallment = Math.ceil(student.balance / installments);
            document.getElementById('paymentAmount').value = Math.min(perInstallment, student.balance);
            updateFinalAmount();
        }, 500);
    }
}

// ═══════════════════════════════════════════
// ✅ HANDLE EXISTING LEAD
// ═══════════════════════════════════════════
function handleExistingLead(doc) {
    const lead = { id: doc.id, ...doc.data() };
    const statusEl = document.getElementById('phoneSearchStatus');

    console.log('✅ Lead found:', lead);
    selectedLeadData = lead;

    let statusColor = '#2196F3';
    if (lead.status === 'Enrolled') statusColor = '#4CAF50';
    else if (lead.status === 'Might Join') statusColor = '#64B5F6';
    else if (lead.status === 'Hold') statusColor = '#90A4AE';

    statusEl.className = 'phone-search-status found';
    statusEl.innerHTML = `
        ✓ <strong>Existing lead found!</strong><br>
        👤 ${lead.name || 'Unknown'}
        | 📞 ${lead.callAttempts || 0} attempts
        | 📊 <span style="color:${statusColor};font-weight:700;">${lead.status || 'Need Call'}</span>
        ${lead.courseInterest ? `<br>🎓 Interest: <strong>${lead.courseInterest}</strong>` : ''}
        ${lead.source ? `<br>📡 Source: ${lead.source}` : ''}
    `;

    document.getElementById('customerName').value = lead.name || '';
    if (lead.email) document.getElementById('customerEmail').value = lead.email;
    if (lead.nic) document.getElementById('customerNIC').value = lead.nic;
    if (lead.address) document.getElementById('customerAddress').value = lead.address;

    if (lead.courseInterest) {
        tryAutoSelectAcademyAndCourse(lead.courseInterest);
    }

    showToast(`✅ Lead found: ${lead.name}`, 'success');
}

// ═══════════════════════════════════════════
// 🎯 AUTO-SELECT ACADEMY + COURSE
// ═══════════════════════════════════════════
function tryAutoSelectAcademyAndCourse(courseInterest) {
    if (!courseInterest || allCourses.length === 0) return;

    const interest = courseInterest.trim().toLowerCase();
    let matchedCourse = allCourses.find(c => c.name && c.name.trim().toLowerCase() === interest);
    if (!matchedCourse) matchedCourse = allCourses.find(c => c.name && c.name.trim().toLowerCase().includes(interest));
    if (!matchedCourse) matchedCourse = allCourses.find(c => c.name && interest.includes(c.name.trim().toLowerCase()));

    if (matchedCourse && matchedCourse.academy) {
        const academySelect = document.getElementById('academySelect');
        academySelect.value = matchedCourse.academy;
        onAcademyChange(matchedCourse.academy);

        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect.value !== matchedCourse.id) {
            courseSelect.value = matchedCourse.id;
            onCourseChange(matchedCourse.id);
        }
    }
}

// ═══════════════════════════════════════════
// ℹ️ HANDLE NEW CUSTOMER
// ═══════════════════════════════════════════
function handleNewCustomer(fullPhone) {
    const statusEl = document.getElementById('phoneSearchStatus');

    selectedLeadData = { isNew: true, phone: fullPhone };

    statusEl.className = 'phone-search-status';
    statusEl.style.color = '#2196F3';
    statusEl.innerHTML = `
        ℹ️ <strong>New customer!</strong>
        Phone: <strong>${fullPhone}</strong><br>
        Manual entry කරන්න — payment process කරාම lead එකකුත් auto-create වෙයි.
    `;

    clearCourseDetails();
    document.getElementById('customerName').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerNIC').value = '';
    document.getElementById('customerDOB').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerName').focus();

    showToast(`ℹ️ New customer: ${fullPhone}`, 'info');
}

// ═══════════════════════════════════════════
// 🍞 TOAST NOTIFICATION
// ═══════════════════════════════════════════
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

console.log('💳 payment-script.js loaded! (v6.0 - Step 3F Receipt Modal)');