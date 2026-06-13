// ============================================================
// BUONO - Settings Script v4.1
// Smart Batch! (Cache + PerfTracker + Animations + NaN Fix)
// ============================================================

let currentSettings = {};
let discountCodes   = [];
let currentUser     = null;

// Cache Key
const SETTINGS_CACHE_KEY = 'buono_settings_v1';

// ============================================================
// PAGE INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async function () {

    PerfTracker.init('Settings');
    PerfTracker.start('🔐 Auth & Init');

    currentUser = initPage('settingsDB', ['Admin', 'Manager']);
    if (!currentUser) return;

    PerfTracker.end('🔐 Auth & Init');
    console.log('✅ User:', currentUser.name, '|', currentUser.access);

    showSkeletonStats();

    try {
        PerfTracker.start('📦 Load Settings');
        await loadSettingsCached();
        PerfTracker.end('📦 Load Settings');

        PerfTracker.start('🎨 UI Render');
        revealStats();
        PerfTracker.end('🎨 UI Render');

        PerfTracker.report('Settings Loaded');
        showToast('⚙️ Settings ready!', 'success');

    } catch (error) {
        console.error('❌ Init error:', error);
        showToast('Settings load failed!', 'error');
        revealStats();
    }
});

// ============================================================
// 💾 CACHED LOADER
// ============================================================
async function loadSettingsCached() {
    const cached = SmartStorage.get(SETTINGS_CACHE_KEY);
    if (cached) {
        currentSettings = cached;
        discountCodes   = cached.discountCodes || [];
        populateForm(cached);
        updateStats();
        console.log('⚡ Settings from cache!');
        return;
    }

    try {
        const doc = await db.collection('settings').doc('academy').get();

        if (doc.exists) {
            currentSettings = doc.data();
            console.log('✅ Settings loaded from Firebase!');
        } else {
            console.log('ℹ️ No settings yet. Using defaults.');
            currentSettings = getDefaultSettings();
        }

        discountCodes = currentSettings.discountCodes || [];

        SmartStorage.set(
            SETTINGS_CACHE_KEY,
            currentSettings,
            SmartStorage.DURATIONS.LONG
        );

        populateForm(currentSettings);
        updateStats();

    } catch (error) {
        console.error('❌ Load error:', error);
        currentSettings = getDefaultSettings();
        discountCodes   = [];
        populateForm(currentSettings);
        updateStats();
        throw error;
    }
}

// ============================================================
// 💀 SKELETON
// ============================================================
function showSkeletonStats() {
    for (let i = 0; i < 5; i++) {
        const sk   = document.getElementById(`skStat${i}`);
        const real = document.getElementById(`realStat${i}`);
        if (sk)   sk.style.display   = 'flex';
        if (real) real.style.display = 'none';
    }
}

// ============================================================
// ✨ REVEAL STATS (with stagger animation)
// ============================================================
function revealStats() {
    for (let i = 0; i < 5; i++) {
        const sk   = document.getElementById(`skStat${i}`);
        const real = document.getElementById(`realStat${i}`);
        if (sk) sk.style.display = 'none';
        if (real) {
            real.style.display        = 'flex';
            real.style.animationDelay = `${i * 0.08}s`;
            real.classList.remove('anim-scale-in');
            void real.offsetWidth;
            real.classList.add('anim-scale-in');
        }
    }
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');
    if (event && event.target) event.target.classList.add('active');

    if (tabName === 'whatsapp') updatePreview();
}

// ============================================================
// DEFAULT SETTINGS
// ============================================================
function getDefaultSettings() {
    return {
        businessName:        'Buono Cafe & Academy',
        businessAddress:     '',
        businessPhone:       '',
        businessWhatsapp:    '',
        businessEmail:       '',
        businessWebsite:     '',
        businessTagline:     '',
        currentBatch:        'W32',
        studentIdPrefix:     'BCA',
        defaultInstallments: 2,
        academyShortName:    'SAC',
        academyFullName:     'Specialty Academy Ceylon',
        paymentMethods: { cash: true, bank: true, card: true, online: true },
        bankName:            '',
        bankAccountName:     '',
        bankAccountNumber:   '',
        bankBranch:          '',
        ezCash:              '',
        mCash:               '',
        discountCodes:       [],
        whatsappTemplate:
`🎓 *{businessName}*\n\n✅ Payment Received!\n\nDear *{studentName}*,\n\nYour payment has been successfully recorded.\n\n📋 *Details:*\n• Receipt No: {receiptNo}\n• Course: {courseName}\n• Batch: {batchNo}\n• Amount Paid: Rs. {amount}\n• Balance: Rs. {balance}\n\n🆔 *Student ID:* {studentId}\n🔑 *Password:* {password}\n\nThank you! 🙏`
    };
}

// ============================================================
// POPULATE FORM
// ============================================================
function populateForm(data) {
    setVal('businessName',     data.businessName);
    setVal('businessAddress',  data.businessAddress);
    setVal('businessPhone',    data.businessPhone);
    setVal('businessWhatsapp', data.businessWhatsapp);
    setVal('businessEmail',    data.businessEmail);
    setVal('businessWebsite',  data.businessWebsite);
    setVal('businessTagline',  data.businessTagline);

    setVal('currentBatch',      data.currentBatch);
    setVal('studentIdPrefix',   data.studentIdPrefix);
    setVal('academyShortName',  data.academyShortName);
    setVal('academyFullName',   data.academyFullName);

    const installEl = document.getElementById('defaultInstallments');
    if (installEl && data.defaultInstallments) {
        installEl.value = data.defaultInstallments;
    }

    if (data.paymentMethods) {
        setCheck('paymentCash',   data.paymentMethods.cash   !== false);
        setCheck('paymentBank',   data.paymentMethods.bank   !== false);
        setCheck('paymentCard',   data.paymentMethods.card   !== false);
        setCheck('paymentOnline', data.paymentMethods.online !== false);
    }

    setVal('bankName',          data.bankName);
    setVal('bankAccountName',   data.bankAccountName);
    setVal('bankAccountNumber', data.bankAccountNumber);
    setVal('bankBranch',        data.bankBranch);
    setVal('ezCash',            data.ezCash);
    setVal('mCash',             data.mCash);

    discountCodes = data.discountCodes || [];
    renderDiscountCodes();

    setVal('whatsappTemplate', data.whatsappTemplate);

    const templateArea = document.getElementById('whatsappTemplate');
    if (templateArea) {
        templateArea.removeEventListener('input', updatePreview);
        templateArea.addEventListener('input', updatePreview);
    }

    updatePreview();
    console.log('✅ Form populated!');
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
}

function setCheck(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
}

// ============================================================
// UPDATE STATS CARDS (with NaN protection!)
// ============================================================
function updateStats() {
    // Business name
    const businessEl = document.getElementById('statBusiness');
    if (businessEl) {
        const name = getVal('businessName') || currentSettings.businessName || 'Not Set';
        businessEl.textContent = name.length > 12
            ? name.substring(0, 12) + '...'
            : name;
    }

    // Current batch
    const batchEl = document.getElementById('statBatch');
    if (batchEl) {
        batchEl.textContent = getVal('currentBatch') || currentSettings.currentBatch || 'W1';
    }

    // Discount codes count
    const discountEl = document.getElementById('statDiscounts');
    if (discountEl) discountEl.textContent = discountCodes.length;

    // Active payment methods
    const paymentEl = document.getElementById('statPayments');
    if (paymentEl) {
        let active = 0;
        ['paymentCash', 'paymentBank', 'paymentCard', 'paymentOnline'].forEach(id => {
            if (getCheck(id)) active++;
        });
        paymentEl.textContent = active + '/4';
    }

    // Last updated (with NaN protection!)
    const updatedEl = document.getElementById('statUpdated');
    if (updatedEl) {
        updatedEl.textContent = formatLastUpdated(currentSettings.updatedAt);
    }
}

// ============================================================
// 🔧 SAFE DATE FORMATTER (NaN protected!)
// ============================================================
function formatLastUpdated(updatedAt) {
    if (!updatedAt) return 'Never';

    try {
        let date;
        if (updatedAt.toDate && typeof updatedAt.toDate === 'function') {
            date = updatedAt.toDate();
        } else if (updatedAt.seconds) {
            date = new Date(updatedAt.seconds * 1000);
        } else {
            date = new Date(updatedAt);
        }

        if (!date || isNaN(date.getTime())) return 'Recently';

        const diffMs   = Date.now() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0)   return 'Just now';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1d ago';
        if (diffDays < 30)  return diffDays + 'd ago';
        return Math.floor(diffDays / 30) + 'mo ago';

    } catch (e) {
        console.warn('⚠️ Date parse error:', e);
        return 'Recently';
    }
}

// ============================================================
// SAVE SETTINGS
// ============================================================
async function saveSettings() {
    const user = currentUser || getCurrentUser();
    if (!user) { showToast('Not logged in!', 'error'); return; }

    const btn = document.getElementById('btnSaveSettings');

    try {
        const settings = {
            businessName:        getVal('businessName'),
            businessAddress:     getVal('businessAddress'),
            businessPhone:       getVal('businessPhone'),
            businessWhatsapp:    getVal('businessWhatsapp'),
            businessEmail:       getVal('businessEmail'),
            businessWebsite:     getVal('businessWebsite'),
            businessTagline:     getVal('businessTagline'),

            currentBatch:        getVal('currentBatch'),
            studentIdPrefix:     getVal('studentIdPrefix'),
            academyShortName:    getVal('academyShortName'),
            academyFullName:     getVal('academyFullName'),
            defaultInstallments: parseInt(getVal('defaultInstallments')) || 2,

            paymentMethods: {
                cash:   getCheck('paymentCash'),
                bank:   getCheck('paymentBank'),
                card:   getCheck('paymentCard'),
                online: getCheck('paymentOnline')
            },

            bankName:          getVal('bankName'),
            bankAccountName:   getVal('bankAccountName'),
            bankAccountNumber: getVal('bankAccountNumber'),
            bankBranch:        getVal('bankBranch'),
            ezCash:            getVal('ezCash'),
            mCash:             getVal('mCash'),

            discountCodes:     discountCodes,
            whatsappTemplate:  getVal('whatsappTemplate'),

            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user.name || user.nickname || 'Unknown'
        };

        if (btn) {
            btn.textContent = '⏳ Saving...';
            btn.disabled    = true;
        }

        await db.collection('settings').doc('academy').set(settings, { merge: true });

        // Invalidate cache
        SmartStorage.remove(SETTINGS_CACHE_KEY);

        // Update local copy (with current timestamp for immediate display)
        currentSettings = { ...settings, updatedAt: new Date() };

        showToast('✅ Settings saved successfully!', 'success');
        updateStats();

        if (btn) {
            btn.textContent = '✅ Saved!';
            setTimeout(() => {
                btn.textContent = '💾 Save All Settings';
                btn.disabled    = false;
            }, 1500);
        }

    } catch (error) {
        console.error('❌ Save error:', error);
        showToast('❌ Save failed: ' + error.message, 'error');
        if (btn) {
            btn.textContent = '💾 Save All Settings';
            btn.disabled    = false;
        }
    }
}

// ============================================================
// HELPERS
// ============================================================
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function getCheck(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

// ============================================================
// DISCOUNT CODES
// ============================================================
function renderDiscountCodes() {
    const list    = document.getElementById('discountList');
    const countEl = document.getElementById('discountCount');
    if (!list) return;

    if (countEl) countEl.textContent = discountCodes.length;

    if (discountCodes.length === 0) {
        list.innerHTML = `
            <div class="no-lead-msg">
                <div class="no-lead-icon">🏷️</div>
                No discount codes yet
            </div>`;
        return;
    }

    list.innerHTML = discountCodes.map((code, index) => `
        <div class="discount-item anim-slide-right"
             style="animation-delay:${index * 50}ms">
            <div class="discount-info">
                <span class="discount-code-badge">${escapeHtml(code.code)}</span>
                <span class="discount-value-text">
                    ${code.type === 'percentage'
                        ? code.value + '% OFF'
                        : 'Rs. ' + code.value + ' OFF'}
                </span>
                <span class="discount-type-badge">${escapeHtml(code.type)}</span>
            </div>
            <button class="btn-icon delete"
                    onclick="removeDiscountCode(${index})"
                    title="Remove">🗑️</button>
        </div>
    `).join('');
}

function addDiscountCode() {
    const code  = document.getElementById('newDiscountCode').value.trim().toUpperCase();
    const type  = document.getElementById('newDiscountType').value;
    const value = parseFloat(document.getElementById('newDiscountValue').value);

    if (!code)                                { showToast('Enter code name!',              'warning'); return; }
    if (!value || value <= 0)                 { showToast('Enter valid value!',             'warning'); return; }
    if (type === 'percentage' && value > 100) { showToast('Percentage cannot exceed 100%!', 'warning'); return; }
    if (discountCodes.find(d => d.code === code)) {
        showToast('Code already exists!', 'warning'); return;
    }

    discountCodes.push({ code, type, value });
    renderDiscountCodes();
    updateStats();

    document.getElementById('newDiscountCode').value  = '';
    document.getElementById('newDiscountValue').value = '';

    showToast('✅ Discount code added!', 'success');
}

function removeDiscountCode(index) {
    if (!confirm('Remove this discount code?')) return;
    discountCodes.splice(index, 1);
    renderDiscountCodes();
    updateStats();
    showToast('🗑️ Code removed!', 'info');
}

// ============================================================
// WHATSAPP TEMPLATE
// ============================================================
function insertVariable(variable) {
    const textarea = document.getElementById('whatsappTemplate');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const text  = textarea.value;

    textarea.value          = text.substring(0, start) + variable + text.substring(end);
    textarea.selectionStart = start + variable.length;
    textarea.selectionEnd   = start + variable.length;
    textarea.focus();

    updatePreview();
}

function updatePreview() {
    const template = getVal('whatsappTemplate');
    const preview  = document.getElementById('whatsappPreview');
    if (!preview) return;

    if (!template) {
        preview.textContent = 'Template type කරන්න preview එක දකින්න...';
        return;
    }

    let text = template
        .replace(/{studentName}/g,  'Naveen Perera')
        .replace(/{studentId}/g,    'BCA-W32-0010')
        .replace(/{courseName}/g,   'SCA Foundation')
        .replace(/{receiptNo}/g,    'BR-2024-06-001')
        .replace(/{amount}/g,       '65,000')
        .replace(/{date}/g,         new Date().toLocaleDateString('en-LK'))
        .replace(/{balance}/g,      '0')
        .replace(/{businessName}/g, getVal('businessName') || 'Buono Cafe & Academy')
        .replace(/{batchNo}/g,      getVal('currentBatch') || 'W32')
        .replace(/{password}/g,     'buono@ABC123');

    text = text
        .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    preview.innerHTML = text;
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast       = document.createElement('div');
    toast.className   = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// ESCAPE HTML
// ============================================================
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}

console.log('⚙️ settings-script.js loaded! (v4.1 - Smart Batch + NaN Fix!)');