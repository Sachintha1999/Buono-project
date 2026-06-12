// ═══════════════════════════════════════════
// 🎓 BUONO STUDENT PORTAL - SCRIPT
// File: student-portal-script.js
// Version: 1.0
// ═══════════════════════════════════════════

let currentStudent = null;
let studentData = null;
let systemSettings = null;

// ═══════════════════════════════════════════
// 🚀 INITIALIZATION
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎓 Student Portal loading...');

    // ⛔ Check student authentication
    currentStudent = checkStudentAuth();
    if (!currentStudent) return;

    console.log('✅ Logged in student:', currentStudent.studentId);

    // Update topbar immediately
    updateTopbar();

    try {
        // Load fresh data from Firestore
        await loadStudentData();
        
        // Load system settings (for support buttons)
        await loadSettings();
        
        // Render everything
        renderPortal();
        
        // Show content, hide loading
        document.getElementById('portalLoading').style.display = 'none';
        document.getElementById('portalContent').style.display = 'block';
        
        showToast(`✅ Welcome, ${studentData.name}!`, 'success');
        
    } catch (error) {
        console.error('❌ Portal load error:', error);
        showToast(`❌ Error loading data: ${error.message}`, 'error');
        document.getElementById('loadingText').textContent = '❌ Failed to load. Please refresh!';
    }
});

// ═══════════════════════════════════════════
// 📌 UPDATE TOPBAR
// ═══════════════════════════════════════════
function updateTopbar() {
    document.getElementById('topbarStudentName').textContent = currentStudent.name || 'Student';
    document.getElementById('topbarStudentId').textContent = currentStudent.studentId || '-';
}

// ═══════════════════════════════════════════
// 📥 LOAD STUDENT DATA (Fresh from Firestore)
// ═══════════════════════════════════════════
async function loadStudentData() {
    console.log('📥 Loading fresh student data...');
    
    const docRef = db.collection('students').doc(currentStudent.docId);
    const snap = await docRef.get();
    
    if (!snap.exists) {
        throw new Error('Student record not found! Please contact admin.');
    }
    
    studentData = { docId: snap.id, ...snap.data() };
    console.log('✅ Student data loaded:', studentData);
}

// ═══════════════════════════════════════════
// ⚙️ LOAD SYSTEM SETTINGS
// ═══════════════════════════════════════════
async function loadSettings() {
    try {
        systemSettings = await getSystemSettings();
        console.log('⚙️ Settings loaded');
    } catch (error) {
        console.warn('⚠️ Settings load failed:', error);
        systemSettings = null;
    }
}

// ═══════════════════════════════════════════
// 🎨 RENDER PORTAL
// ═══════════════════════════════════════════
function renderPortal() {
    renderWelcomeBanner();
    renderQuickStats();
    renderProgressBar();
    renderPersonalInfo();
    renderCourseInfo();
    renderPaymentHistory();
    renderSupportButtons();
    renderFooter();
}

// ═══════════════════════════════════════════
// 👋 RENDER WELCOME BANNER
// ═══════════════════════════════════════════
function renderWelcomeBanner() {
    document.getElementById('welcomeName').textContent = studentData.name || 'Student';
    document.getElementById('welcomeAcademy').textContent = 
        studentData.academy || systemSettings?.academyFullName || 'Buono Academy';
    
    const badge = document.getElementById('welcomeBadge');
    const status = studentData.status || 'Active';
    badge.textContent = status;
    badge.className = 'welcome-badge';
    if (status === 'Active') badge.classList.add('active');
    if (status === 'Suspended') badge.classList.add('suspended');
}

// ═══════════════════════════════════════════
// 📊 RENDER QUICK STATS
// ═══════════════════════════════════════════
function renderQuickStats() {
    const totalFee = Number(studentData.totalFee) || 0;
    const totalPaid = Number(studentData.totalPaid) || 0;
    const balance = Number(studentData.balance) || (totalFee - totalPaid);
    const progress = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
    const status = studentData.paymentStatus || 'Pending';
    
    document.getElementById('statPaid').textContent = formatCurrency(totalPaid);
    document.getElementById('statBalance').textContent = formatCurrency(balance);
    document.getElementById('statProgress').textContent = progress + '%';
    document.getElementById('statStatus').textContent = status;
}

// ═══════════════════════════════════════════
// 💰 RENDER PROGRESS BAR
// ═══════════════════════════════════════════
function renderProgressBar() {
    const totalFee = Number(studentData.totalFee) || 0;
    const totalPaid = Number(studentData.totalPaid) || 0;
    const balance = Number(studentData.balance) || (totalFee - totalPaid);
    const progress = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
    
    document.getElementById('progressPercent').textContent = progress + '%';
    
    // Animate progress bar
    const fill = document.getElementById('progressBarFill');
    setTimeout(() => {
        fill.style.width = progress + '%';
    }, 200);
    
    document.getElementById('progressTotalFee').textContent = formatCurrency(totalFee);
    document.getElementById('progressPaid').textContent = formatCurrency(totalPaid);
    document.getElementById('progressBalance').textContent = formatCurrency(balance);
}

// ═══════════════════════════════════════════
// 👤 RENDER PERSONAL INFO
// ═══════════════════════════════════════════
function renderPersonalInfo() {
    document.getElementById('infoStudentId').textContent = studentData.studentId || '-';
    document.getElementById('infoName').textContent = studentData.name || '-';
    document.getElementById('infoPhone').textContent = studentData.phone || '-';
    document.getElementById('infoEmail').textContent = studentData.email || '-';
    document.getElementById('infoNIC').textContent = studentData.nic || '-';
    document.getElementById('infoDOB').textContent = studentData.dob ? formatDate(studentData.dob) : '-';
    document.getElementById('infoAddress').textContent = studentData.address || '-';
}

// ═══════════════════════════════════════════
// 🎓 RENDER COURSE INFO
// ═══════════════════════════════════════════
function renderCourseInfo() {
    document.getElementById('infoCourse').textContent = studentData.courseName || '-';
    document.getElementById('infoAcademy').textContent = studentData.academy || '-';
    document.getElementById('infoBatch').textContent = studentData.batchNumber || '-';
    
    // Enrolled date
    let enrolledDate = '-';
    if (studentData.enrolledDate) {
        const d = studentData.enrolledDate.toDate ? 
            studentData.enrolledDate.toDate() : new Date(studentData.enrolledDate);
        enrolledDate = formatDate(d);
    }
    document.getElementById('infoEnrolledDate').textContent = enrolledDate;
    
    document.getElementById('infoSource').textContent = studentData.enrollmentSource || '-';
    
    // Status with badge
    const status = studentData.status || 'Active';
    const statusEl = document.getElementById('infoStatus');
    statusEl.innerHTML = `<span class="status-badge status-${status.toLowerCase()}">${status}</span>`;
}

// ═══════════════════════════════════════════
// 🧾 RENDER PAYMENT HISTORY
// ═══════════════════════════════════════════
function renderPaymentHistory() {
    const list = document.getElementById('paymentHistoryList');
    const payments = studentData.payments || [];
    
    if (payments.length === 0) {
        list.innerHTML = `
            <div class="history-empty">
                📭 No payment history yet.
            </div>
        `;
        return;
    }
    
    // Sort newest first
    const sorted = [...payments].sort((a, b) => {
        const dateA = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date || 0);
        const dateB = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date || 0);
        return dateB - dateA;
    });
    
    const methodLabels = {
        cash: '💵 Cash',
        bank: '🏦 Bank Transfer',
        card: '💳 Card',
        online: '📱 Online'
    };
    
    list.innerHTML = sorted.map((p, idx) => {
        const pDate = p.date && p.date.toDate ? p.date.toDate() : new Date(p.date);
        const dateStr = formatDateTime(pDate);
        const methodLabel = methodLabels[p.method] || p.method || '-';
        const discountText = (p.discountAmount && p.discountAmount > 0) ?
            `<div class="history-detail">
                <span class="history-detail-label">Discount</span>
                <span class="history-detail-value" style="color:#ff6b6b;">- ${formatCurrency(p.discountAmount)} ${p.discountCode ? `(${p.discountCode})` : ''}</span>
            </div>` : '';
        
        return `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-receipt-no">🧾 ${p.receiptNo || 'N/A'}</span>
                    <span class="history-amount">${formatCurrency(p.amount || 0)}</span>
                </div>
                <div class="history-item-details">
                    <div class="history-detail">
                        <span class="history-detail-label">Type</span>
                        <span class="history-detail-value">${p.type || '-'}</span>
                    </div>
                    <div class="history-detail">
                        <span class="history-detail-label">Method</span>
                        <span class="history-detail-value">${methodLabel}</span>
                    </div>
                    <div class="history-detail">
                        <span class="history-detail-label">Date</span>
                        <span class="history-detail-value">${dateStr}</span>
                    </div>
                    ${discountText}
                    ${p.receivedBy ? `
                    <div class="history-detail">
                        <span class="history-detail-label">Received By</span>
                        <span class="history-detail-value">${p.receivedBy}</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ Rendered ${payments.length} payment records`);
}

// ═══════════════════════════════════════════
// 📞 RENDER SUPPORT BUTTONS
// ═══════════════════════════════════════════
function renderSupportButtons() {
    const waBtn = document.getElementById('supportWhatsApp');
    const callBtn = document.getElementById('supportCall');
    
    const waNumber = systemSettings?.businessWhatsapp || systemSettings?.businessPhone || '';
    const phoneNumber = systemSettings?.businessPhone || '';
    
    if (!waNumber) waBtn.style.display = 'none';
    if (!phoneNumber) callBtn.style.display = 'none';
}

// ═══════════════════════════════════════════
// 🦶 RENDER FOOTER
// ═══════════════════════════════════════════
function renderFooter() {
    const loginTime = currentStudent.loginTime ? 
        formatDateTime(new Date(currentStudent.loginTime)) : 
        formatDateTime(new Date());
    document.getElementById('footerLoginTime').textContent = loginTime;
}

// ═══════════════════════════════════════════
// 📱 CONTACT VIA WHATSAPP
// ═══════════════════════════════════════════
function contactWhatsApp() {
    const waNumber = systemSettings?.businessWhatsapp || systemSettings?.businessPhone || '';
    if (!waNumber) {
        showToast('❌ WhatsApp number not configured!', 'error');
        return;
    }
    
    const cleanNumber = waNumber.replace(/\D/g, '');
    
    let message = `Hello! 👋\n\n`;
    message += `I'm ${studentData.name}\n`;
    message += `Student ID: ${studentData.studentId}\n`;
    message += `Course: ${studentData.courseName}\n\n`;
    message += `I need help with...`;
    
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    showToast('📱 Opening WhatsApp...', 'success');
}

// ═══════════════════════════════════════════
// 📞 CONTACT VIA CALL
// ═══════════════════════════════════════════
function contactCall() {
    const phoneNumber = systemSettings?.businessPhone || '';
    if (!phoneNumber) {
        showToast('❌ Phone number not configured!', 'error');
        return;
    }
    
    window.location.href = `tel:${phoneNumber}`;
    showToast('📞 Calling academy...', 'info');
}

// ═══════════════════════════════════════════
// 🍞 TOAST NOTIFICATION
// ═══════════════════════════════════════════
function showToast(message, type = 'info') {
    const container = document.getElementById('portalToastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `portal-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('🎓 student-portal-script.js loaded! (v1.0)');