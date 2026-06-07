// ════════════════════════════════════════════════════════════
// 🛒 PURCHASING DATABASE - COMPLETE JAVASCRIPT
// 📁 File: public/purchasing-script.js
// ════════════════════════════════════════════════════════════

// ═══════ FIREBASE INIT ═══════
const firebaseConfig = {
    apiKey: "AIzaSyBkXBs5GrfnMIFnJLJWkSMULYxGKz0Shtk",
    authDomain: "buono-project-927b8.firebaseapp.com",
    projectId: "buono-project-927b8",
    storageBucket: "buono-project-927b8.firebasestorage.app",
    messagingSenderId: "706681135399",
    appId: "1:706681135399:web:c15f197f1efe3a64f00902"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

const DATABASES = [
    { id: 'employeeDB', name: 'Employee Database', icon: '👥', url: 'index.html' },
    { id: 'dayEndReportDB', name: 'Day End Reports', icon: '💰', url: 'cashier.html' },
    { id: 'inventoryDB', name: 'Inventory Database', icon: '📦', url: 'inventory.html' },
    { id: 'kitchenDB', name: 'Kitchen Database', icon: '🍳', url: 'kitchen.html' },
    { id: 'purchasingDB', name: 'Purchasing Database', icon: '🛒', url: 'purchasing.html' },
    { id: 'reportsDB', name: 'Reports Database', icon: '📊', url: 'reports.html', adminManagerOnly: true }
];

let currentUser = null;
let myPerms = null;
let allInventoryItems = [];
let allSuppliers = [];
let allPurchases = [];
let itemRowCounter = 0;
let seenRejectedIds = new Set();
let currentCreditTab = 'overdue';
let markPaidBillId = '';
let uploadedPhotoUrl = '';
let uploadedPhotoPath = '';

function fmtQty(num) {
    if (num === null || num === undefined || isNaN(num)) return 0;
    return Math.round(num * 1000) / 1000;
}
function dispQty(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return (Math.round(num * 1000) / 1000).toString();
}
function fmt(amount) {
    if (amount === undefined || amount === null) return 'Rs. 0';
    return 'Rs. ' + Number(amount).toLocaleString('en-LK', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
}
function isManagerUser() {
    return ['Admin', 'Manager'].includes(currentUser?.access);
}
function formatTimestamp(ts) {
    if (!ts || !ts.toDate) return 'N/A';
    const d = ts.toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
    });
}
function formatSupCurrency(amount) {
    if (!amount || amount === 0) return 'Rs.0';
    if (amount >= 1000000) return 'Rs.' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return 'Rs.' + (amount / 1000).toFixed(1) + 'K';
    return 'Rs.' + Math.round(amount).toLocaleString();
}
function formatNumber(num) {
    return Math.round(num || 0).toLocaleString();
}
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function initializeApp() {
    const user = sessionStorage.getItem('loggedInUser');
    if (!user) { window.location.href = "login.html"; return; }
    const userData = JSON.parse(user);

    try {
        const userDoc = await db.collection('employees').doc(userData.id).get();
        if (userDoc.exists) {
            const d = userDoc.data();
            userData.access = d.access;
            userData.permissions = d.permissions || {};
            userData.name = d.name;
            userData.nickname = d.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
        }
    } catch (e) { console.error(e); }

    const isAdmin = userData.access === 'Admin';
    const perms = userData.permissions?.purchasingDB || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView || perms.edit;

    if (!hasAccess) {
        alert('⛔ Access denied!');
        window.location.href = "access.html";
        return;
    }

    myPerms = isAdmin ? { add: true, view: true, selfView: true, edit: true, delete: true } : perms;
    currentUser = userData;
    document.getElementById('welcomeUser').textContent =
        `👋 Welcome, ${userData.name} (${userData.access})`;

    const seen = localStorage.getItem('seenPurchaseRejected_' + userData.id);
    if (seen) seenRejectedIds = new Set(JSON.parse(seen));

    buildDatabaseSwitcher();
    setupForm();

    await loadInventoryItems();
    await loadSuppliersData();
    loadPurchases();

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.supplier-input-wrap')) {
            document.getElementById('supplierSuggestions')?.classList.remove('show');
        }
        if (!e.target.closest('.item-search-wrap')) {
            document.querySelectorAll('.item-suggestions').forEach(s => s.classList.remove('show'));
        }
        const dd = document.getElementById('dbDropdown');
        if (dd && !dd.contains(e.target) && !e.target.closest('#dbSwitcher')) {
            dd.classList.remove('show');
        }
    });
}
initializeApp();

function setupForm() {
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = "login.html";
}

function buildDatabaseSwitcher() {
    const list = document.getElementById('dbDropdownList');
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';
    DATABASES.forEach(d => {
        if (d.adminManagerOnly && !isAdminOrMgr) return;
        const isAdmin = currentUser.access === 'Admin';
        const dp = currentUser.permissions?.[d.id] || {};
        const hasAccess = isAdmin || dp.add || dp.view || dp.selfView || dp.edit || dp.delete;
        if (!d.adminManagerOnly && !hasAccess) return;
        const isCurrent = d.id === 'purchasingDB';
        html += `<a href="${d.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}">
            <span>${d.icon}</span><span>${d.name}</span>
            ${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}
        </a>`;
    });
    list.innerHTML = html;
    document.getElementById('dbSwitcher').addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('dbDropdown').classList.toggle('show');
    });
}

function showSection(name, btnEl) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    const sect = document.getElementById('section-' + name);
    if (sect) sect.classList.add('active');

    document.querySelectorAll('.dashboard-container > .nav-tabs > .nav-tab').forEach(t => t.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    if (name === 'pending') renderPendingBills();
    if (name === 'approved') renderApprovedBills();
    if (name === 'rejected') {
        renderRejectedBills();
        allPurchases.filter(p => p.status === 'rejected').forEach(p => seenRejectedIds.add(p.id));
        localStorage.setItem('seenPurchaseRejected_' + currentUser.id, JSON.stringify([...seenRejectedIds]));
        updateBadges();
        updateAlertBanner();
    }
    if (name === 'credit') renderCreditTab();
    if (name === 'suppliers') {
        renderSuppliersList(allSuppliers);
        updateSupplierStats();
    }
}

async function loadInventoryItems() {
    try {
        const snap = await db.collection('inventoryItems').orderBy('itemName').get();
        allInventoryItems = [];
        snap.forEach(doc => allInventoryItems.push({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); }
}

async function loadSuppliersData() {
    try {
        const snap = await db.collection('suppliers').orderBy('name').get();
        allSuppliers = [];
        snap.forEach(doc => allSuppliers.push({ id: doc.id, ...doc.data() }));
    } catch (e) { console.error(e); }
}

function loadPurchases() {
    db.collection('purchases').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allPurchases = [];
        snap.forEach(doc => allPurchases.push({ id: doc.id, ...doc.data() }));
        updateStats();
        updateBadges();
        updateAlertBanner();
        updateCreditBadges();

        const activeTab = document.querySelector('.dashboard-container > .nav-tabs > .nav-tab.active')?.id || '';
        if (activeTab === 'tab-pending-btn') renderPendingBills();
        if (activeTab === 'tab-approved-btn') renderApprovedBills();
        if (activeTab === 'tab-rejected-btn') renderRejectedBills();
        if (activeTab === 'tab-credit-btn') renderCreditTab();
    }, err => console.error('Purchases error:', err));
}

function updateStats() {
    document.getElementById('statTotalBills').textContent = allPurchases.length;
    document.getElementById('statPending').textContent =
        allPurchases.filter(p => p.status === 'pending_approval').length;
    document.getElementById('statApproved').textContent =
        allPurchases.filter(p => p.status === 'approved').length;
    const totalValue = allPurchases.filter(p => p.status === 'approved')
        .reduce((s, p) => s + (p.billTotal || 0), 0);
    document.getElementById('statTotalValue').textContent = fmt(totalValue).replace('.00', '');
}

function updateBadges() {
    const pending = allPurchases.filter(p => p.status === 'pending_approval').length;
    const approved = allPurchases.filter(p => p.status === 'approved').length;
    const rejected = allPurchases.filter(p => p.status === 'rejected').length;

    const pBadge = document.getElementById('pendingBadge');
    pBadge.textContent = pending;
    pBadge.style.display = pending > 0 ? 'inline-block' : 'none';

    const aBadge = document.getElementById('approvedBadge');
    aBadge.textContent = approved;
    aBadge.style.display = approved > 0 ? 'inline-block' : 'none';

    const rBadge = document.getElementById('rejectedBadge');
    const rTab = document.getElementById('tab-rejected-btn');
    rBadge.textContent = rejected;
    rBadge.style.display = rejected > 0 ? 'inline-block' : 'none';

    const rejectedNew = allPurchases.filter(p => p.status === 'rejected' && !seenRejectedIds.has(p.id));
    if (rejectedNew.length > 0) rTab.classList.add('has-new');
    else rTab.classList.remove('has-new');
}

function updateAlertBanner() {
    const banner = document.getElementById('alertBanner');
    const title = document.getElementById('alertTitle');
    const subtitle = document.getElementById('alertSubtitle');
    const rejectedNew = allPurchases.filter(p => p.status === 'rejected' && !seenRejectedIds.has(p.id));
    const pending = allPurchases.filter(p => p.status === 'pending_approval').length;
    const overdueBills = getOverdueBills();

    if (overdueBills.length > 0) {
        banner.classList.add('danger');
        title.textContent = `🚨 ${overdueBills.length} OVERDUE Payment${overdueBills.length > 1 ? 's' : ''}!`;
        subtitle.textContent = '💳 Credit Tracking tab → check කරන්න';
        banner.classList.add('show');
        return;
    }
    if (rejectedNew.length > 0) {
        banner.classList.add('danger');
        title.textContent = `🚨 ${rejectedNew.length} Purchase${rejectedNew.length > 1 ? 's' : ''} REJECTED!`;
        subtitle.textContent = 'Rejected tab එකට යන්න';
        banner.classList.add('show');
        return;
    }
    banner.classList.remove('danger');
    if (pending > 0 && isManagerUser()) {
        title.textContent = `${pending} Pending Approval${pending > 1 ? 's' : ''}`;
        subtitle.textContent = 'Reports DB එකේ review කරන්න';
        banner.classList.add('show');
        return;
    }
    banner.classList.remove('show');
}

async function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handlePhotoFile(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('⚠️ Image files only!'); return; }

    const progressWrap = document.getElementById('uploadProgressWrap');
    const progressFill = document.getElementById('progressBarFill');
    const progressPercent = document.getElementById('uploadProgressPercent');
    const status = document.getElementById('uploadStatus');

    progressWrap.classList.add('show');
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    status.textContent = 'Compressing image...';

    try {
        const compressedBlob = await compressImage(file);
        const originalSizeKB = (file.size / 1024).toFixed(0);
        const compressedSizeKB = (compressedBlob.size / 1024).toFixed(0);
        status.textContent = `Compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB`;

        const timestamp = Date.now();
        const fileName = `bills/bill_${timestamp}_${currentUser.nickname}.jpg`;
        const storageRef = storage.ref(fileName);
        const uploadTask = storageRef.put(compressedBlob);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressFill.style.width = progress + '%';
                progressPercent.textContent = Math.round(progress) + '%';
                status.textContent = `Uploading... ${(snapshot.bytesTransferred / 1024).toFixed(0)}KB / ${(snapshot.totalBytes / 1024).toFixed(0)}KB`;
            },
            (error) => {
                console.error('Upload error:', error);
                progressWrap.classList.remove('show');
                alert('❌ Upload failed: ' + error.message);
            },
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                uploadedPhotoUrl = downloadURL;
                uploadedPhotoPath = fileName;
                setTimeout(() => { progressWrap.classList.remove('show'); }, 1000);
                document.getElementById('billPhotoImg').src = downloadURL;
                document.getElementById('photoPreviewBox').classList.add('show');
                document.getElementById('photoUploadSection').classList.add('has-photo');
                document.getElementById('billPhotoUrl').value = downloadURL;
                status.textContent = '✅ Upload complete!';
            }
        );
    } catch (e) {
        console.error(e);
        progressWrap.classList.remove('show');
        alert('❌ Error: ' + e.message);
    }
    input.value = '';
}

function previewBillPhoto() {
    const url = document.getElementById('billPhotoUrl').value.trim();
    if (!url) { removeBillPhoto(); return; }
    if (url === uploadedPhotoUrl) return;
    const img = document.getElementById('billPhotoImg');
    img.src = url;
    img.onerror = function () {
        document.getElementById('photoPreviewBox').classList.remove('show');
        document.getElementById('photoUploadSection').classList.remove('has-photo');
    };
    img.onload = function () {
        document.getElementById('photoPreviewBox').classList.add('show');
        document.getElementById('photoUploadSection').classList.add('has-photo');
        uploadedPhotoUrl = url;
        uploadedPhotoPath = '';
    };
}

async function removeBillPhoto() {
    if (uploadedPhotoPath && uploadedPhotoUrl !== document.getElementById('billPhotoUrl').value.trim()) {
        try { await storage.ref(uploadedPhotoPath).delete(); }
        catch (e) { console.warn('Could not delete from storage:', e); }
    }
    document.getElementById('billPhotoUrl').value = '';
    document.getElementById('billPhotoImg').src = '';
    document.getElementById('photoPreviewBox').classList.remove('show');
    document.getElementById('photoUploadSection').classList.remove('has-photo');
    uploadedPhotoUrl = '';
    uploadedPhotoPath = '';
}

function openPhotoFullscreen(src) {
    if (!src) return;
    document.getElementById('fullscreenImg').src = src;
    document.getElementById('photoFullscreenModal').style.display = 'flex';
}
function closePhotoFullscreen() {
    document.getElementById('photoFullscreenModal').style.display = 'none';
}

function onSupplierInput() {
    const input = document.getElementById('supplierInput');
    const query = input.value.trim().toLowerCase();
    if (!query) { renderSupplierSuggestions(allSuppliers); return; }
    const filtered = allSuppliers.filter(s => s.name.toLowerCase().includes(query));
    renderSupplierSuggestions(filtered, query);
}

function renderSupplierSuggestions(suppliers, query = '') {
    const suggestions = document.getElementById('supplierSuggestions');
    let html = '';
    suppliers.slice(0, 10).forEach(sup => {
        html += `<div class="supplier-suggestion-item" onclick="selectSupplier('${sup.id}')">
            <div style="font-weight:600;">🏪 ${sup.name}</div>
            ${sup.phone ? `<div class="sup-phone">📞 ${sup.phone}</div>` : ''}
        </div>`;
    });
    if (query && !suppliers.some(s => s.name.toLowerCase() === query)) {
        html += `<div class="supplier-suggestion-item add-new" onclick="useNewSupplier('${query.replace(/'/g, "\\'")}')">
            ➕ Add NEW: "${query}"
        </div>`;
    }
    if (html) { suggestions.innerHTML = html; suggestions.classList.add('show'); }
    else suggestions.classList.remove('show');
}

function selectSupplier(supId) {
    const sup = allSuppliers.find(s => s.id === supId);
    if (!sup) return;
    document.getElementById('supplierInput').value = sup.name;
    document.getElementById('supplierPhone').value = sup.phone || '';
    document.getElementById('supplierInput').dataset.supplierId = supId;
    document.getElementById('supplierSuggestions').classList.remove('show');
}

function useNewSupplier(name) {
    document.getElementById('supplierInput').value = name;
    document.getElementById('supplierInput').dataset.supplierId = '';
    document.getElementById('supplierSuggestions').classList.remove('show');
    document.getElementById('supplierPhone').focus();
}

function onPaymentChange() {
    const method = document.getElementById('paymentMethod').value;
    const dueDateWrap = document.getElementById('dueDateWrap');
    const dueDateInput = document.getElementById('dueDate');
    if (method === 'credit' || method === 'bank') {
        dueDateWrap.style.display = 'block';
        const today = new Date();
        today.setDate(today.getDate() + 7);
        dueDateInput.value = today.toISOString().split('T')[0];
    } else {
        dueDateWrap.style.display = 'none';
        dueDateInput.value = '';
    }
}

function addItemRow() {
    if (allInventoryItems.length === 0) { alert('⚠️ Inventory items නෑ!'); return; }
    document.getElementById('noItemsMsg').style.display = 'none';
    const rowId = 'item-row-' + itemRowCounter;
    const container = document.getElementById('itemRowsList');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = rowId;
    row.innerHTML = `
        <div class="item-search-wrap">
            <input type="text" class="item-search" placeholder="🔍 Search item..."
                oninput="searchItems('${rowId}')" onfocus="searchItems('${rowId}')" autocomplete="off">
            <input type="hidden" class="item-id">
            <div class="item-suggestions"></div>
        </div>
        <div class="item-unit-display" id="${rowId}-unit">-</div>
        <input type="number" class="item-qty" placeholder="Qty" step="0.001" min="0"
            oninput="calculateRow('${rowId}')">
        <input type="number" class="item-total" placeholder="Total Rs." step="0.01" min="0"
            oninput="calculateRow('${rowId}')">
        <div class="item-perunit-display" id="${rowId}-perunit">Rs. 0</div>
        <button class="btn-remove-row" onclick="removeItemRow('${rowId}')">✕</button>
    `;

    if (container.firstChild) {
        container.insertBefore(row, container.firstChild);
    } else {
        container.appendChild(row);
    }
    itemRowCounter++;

    setTimeout(() => {
        const itemsSection = document.querySelector('.items-section');
        if (itemsSection) itemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { row.querySelector('.item-search')?.focus({ preventScroll: true }); }, 400);
    }, 100);
}

function removeItemRow(rowId) {
    document.getElementById(rowId).remove();
    if (document.getElementById('itemRowsList').children.length === 0) {
        document.getElementById('noItemsMsg').style.display = 'block';
    }
    calculateGrandTotal();
}

function searchItems(rowId) {
    const row = document.getElementById(rowId);
    const input = row.querySelector('.item-search');
    const suggestions = row.querySelector('.item-suggestions');
    const query = input.value.trim().toLowerCase();
    let filtered;
    if (!query) filtered = allInventoryItems.slice(0, 8);
    else if (query.length < 2) { suggestions.classList.remove('show'); return; }
    else filtered = allInventoryItems.filter(i => i.itemName.toLowerCase().includes(query)).slice(0, 8);

    if (filtered.length === 0) {
        suggestions.innerHTML = '<div class="item-suggestion-item" style="color:#888;">No items found</div>';
        suggestions.classList.add('show');
        return;
    }
    let html = '';
    filtered.forEach(item => {
        html += `<div class="item-suggestion-item" onclick="selectItem('${rowId}', '${item.id}')">
            <div class="it-name">📦 ${item.itemName}</div>
            <div class="it-info">${item.category || 'No category'} | Current: ${dispQty(item.currentStock)} ${item.unit} | Rs. ${(item.pricePerUnit || 0).toFixed(2)}/${item.unit}</div>
        </div>`;
    });
    suggestions.innerHTML = html;
    suggestions.classList.add('show');
}

function selectItem(rowId, itemId) {
    const item = allInventoryItems.find(i => i.id === itemId);
    if (!item) return;
    const row = document.getElementById(rowId);
    row.querySelector('.item-search').value = item.itemName;
    row.querySelector('.item-id').value = itemId;
    document.getElementById(rowId + '-unit').textContent = item.unit;
    row.querySelector('.item-suggestions').classList.remove('show');
    row.querySelector('.item-qty').focus();
}

function calculateRow(rowId) {
    const row = document.getElementById(rowId);
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const total = parseFloat(row.querySelector('.item-total').value) || 0;
    const perUnit = qty > 0 ? total / qty : 0;
    document.getElementById(rowId + '-perunit').textContent = 'Rs. ' + perUnit.toFixed(2);
    calculateGrandTotal();
}

function calculateGrandTotal() {
    const rows = document.querySelectorAll('.item-row');
    let total = 0, count = 0;
    rows.forEach(row => {
        const itemId = row.querySelector('.item-id').value;
        const rowTotal = parseFloat(row.querySelector('.item-total').value) || 0;
        if (itemId && rowTotal > 0) { total += rowTotal; count++; }
    });
    document.getElementById('totalItemsCount').textContent = count;
    document.getElementById('grandTotal').textContent = fmt(total);
}
async function submitPurchase() {
    const date = document.getElementById('purchaseDate').value;
    const supplierName = document.getElementById('supplierInput').value.trim();
    const supplierPhone = document.getElementById('supplierPhone').value.trim();
    const supplierId = document.getElementById('supplierInput').dataset.supplierId || '';
    const billNumber = document.getElementById('billNumber').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const dueDate = document.getElementById('dueDate').value;
    const billPhotoUrl = uploadedPhotoUrl || document.getElementById('billPhotoUrl').value.trim();
    const notes = document.getElementById('purchaseNotes').value.trim();

    if (!date) { alert('⚠️ Date required!'); return; }
    if (!supplierName) { alert('⚠️ Supplier required!'); return; }
    if (!billNumber) { alert('⚠️ Bill number required!'); return; }
    if (!paymentMethod) { alert('⚠️ Payment method select කරන්න!'); return; }
    if ((paymentMethod === 'credit' || paymentMethod === 'bank') && !dueDate) {
        alert('⚠️ Due date required for Credit/Bank!'); return;
    }

    const items = [];
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        const itemId = row.querySelector('.item-id').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        if (itemId && qty > 0 && total > 0) {
            const item = allInventoryItems.find(i => i.id === itemId);
            if (item) {
                items.push({
                    itemId, itemName: item.itemName,
                    category: item.category || '', unit: item.unit,
                    quantity: fmtQty(qty), totalCost: fmtQty(total),
                    pricePerUnit: fmtQty(total / qty),
                    previousPrice: item.pricePerUnit || 0
                });
            }
        }
    });

    if (items.length === 0) { alert('⚠️ අඩුම item එකක්වත් add කරන්න!'); return; }
    const billTotal = items.reduce((s, i) => s + i.totalCost, 0);

    if (!confirm(`📤 Submit?\n\n🏪 ${supplierName}\n📄 ${billNumber}\n📦 ${items.length} items\n💰 ${fmt(billTotal)}${billPhotoUrl ? '\n📸 Photo attached' : ''}`)) return;

    let finalSupplierId = supplierId;
    if (!finalSupplierId) {
        const existing = allSuppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
        if (existing) {
            finalSupplierId = existing.id;
            if (supplierPhone && supplierPhone !== existing.phone) {
                await db.collection('suppliers').doc(existing.id).update({
                    phone: supplierPhone,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            const newSup = await db.collection('suppliers').add({
                name: supplierName, phone: supplierPhone || '',
                email: '', address: '', notes: '',
                totalPurchases: 0, totalValue: 0,
                lastPurchaseDate: null, firstPurchaseDate: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: currentUser.nickname
            });
            finalSupplierId = newSup.id;
            await loadSuppliersData();
        }
    } else if (supplierPhone) {
        const sup = allSuppliers.find(s => s.id === finalSupplierId);
        if (sup && supplierPhone !== sup.phone) {
            await db.collection('suppliers').doc(finalSupplierId).update({
                phone: supplierPhone,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    const purchaseData = {
        date, supplierId: finalSupplierId, supplierName, supplierPhone,
        billNumber, paymentMethod, dueDate: dueDate || null,
        billPhotoUrl: billPhotoUrl || '',
        billPhotoPath: uploadedPhotoPath || '',
        items, itemsCount: items.length,
        billTotal: fmtQty(billTotal), notes,
        status: 'pending_approval',
        paymentStatus: paymentMethod === 'cash' ? 'paid' : 'unpaid',
        paidDate: paymentMethod === 'cash' ? date : null,
        paidNotes: '',
        approvedBy: null, approvedByName: null, approvedAt: null,
        approvalNotes: '', rejectedReason: '',
        stockUpdated: false,
        performedBy: currentUser.nickname,
        performedByName: currentUser.name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('purchases').add(purchaseData);
        autoResetForm();
        alert('✅ Submitted!\n\nReports DB එකේ Manager approval pending.');
        showSection('pending', document.getElementById('tab-pending-btn'));
    } catch (e) {
        alert('❌ ' + e.message);
        console.error(e);
    }
}

function autoResetForm() {
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('supplierInput').value = '';
    document.getElementById('supplierInput').dataset.supplierId = '';
    document.getElementById('supplierPhone').value = '';
    document.getElementById('billNumber').value = '';
    document.getElementById('paymentMethod').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('dueDateWrap').style.display = 'none';
    document.getElementById('billPhotoUrl').value = '';
    document.getElementById('billPhotoImg').src = '';
    document.getElementById('photoPreviewBox').classList.remove('show');
    document.getElementById('photoUploadSection').classList.remove('has-photo');
    document.getElementById('purchaseNotes').value = '';
    document.getElementById('itemRowsList').innerHTML = '';
    document.getElementById('noItemsMsg').style.display = 'block';
    itemRowCounter = 0;
    uploadedPhotoUrl = '';
    uploadedPhotoPath = '';
    calculateGrandTotal();
}

function resetForm() {
    if (!confirm('Reset form?')) return;
    autoResetForm();
}

function buildBillCard(p, statusClass, badgeText, messageType, messageContent, extraActions = '') {
    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank Transfer' };
    const itemsList = (p.items || []).map(i => `${i.itemName} (${dispQty(i.quantity)} ${i.unit})`).join(', ');

    let dueWarning = '';
    if (p.dueDate && p.paymentStatus === 'unpaid' && p.status === 'approved') {
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = p.dueDate < today;
        const isToday = p.dueDate === today;
        dueWarning = `<div class="bc-due-warning ${isOverdue ? 'overdue' : ''}">${isOverdue ? '🚨 OVERDUE' : isToday ? '⏰ Due TODAY' : '⏰ Due'}: ${p.dueDate}</div>`;
    }
    if (p.paymentStatus === 'paid' && p.status === 'approved') {
        dueWarning = `<div style="padding:10px 14px; background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); border-radius:8px; margin-top:10px; font-size:13px; color:#4CAF50;">✅ PAID${p.paidDate ? ` on ${p.paidDate}` : ''}${p.paidNotes ? `<br>📝 ${p.paidNotes}` : ''}</div>`;
    }

    let photoBtn = p.billPhotoUrl ? `<button class="bc-btn view" onclick="openPhotoFullscreen('${p.billPhotoUrl}')">📸 View Photo</button>` : '';

    return `<div class="bill-card ${statusClass}">
        <div class="bc-header">
            <div class="bc-left">
                <span class="bc-bill-num">📄 ${p.billNumber}</span>
                <span class="bc-date">📅 ${p.date}</span>
                <span class="bc-payment-badge ${p.paymentMethod}">${paymentIcons[p.paymentMethod] || p.paymentMethod}</span>
            </div>
            <span class="bc-status-badge ${statusClass}">${badgeText}</span>
        </div>
        <div class="bc-supplier">🏪 ${p.supplierName}${p.supplierPhone ? ` <span style="color:#888; font-size:13px;">📞 ${p.supplierPhone}</span>` : ''}</div>
        <div class="bc-stats">
            <div class="bc-stat"><div class="bs-value">${p.itemsCount || 0}</div><div class="bs-label">Items</div></div>
            <div class="bc-stat"><div class="bs-value" style="color:#FF9800;">Rs.${(p.billTotal || 0).toLocaleString('en-LK')}</div><div class="bs-label">Bill Total</div></div>
            ${p.stockUpdated ? `<div class="bc-stat"><div class="bs-value green">✅</div><div class="bs-label">Stock In</div></div>` : ''}
            ${p.billPhotoUrl ? `<div class="bc-stat"><div class="bs-value" style="color:#2196F3;">📸</div><div class="bs-label">Photo</div></div>` : ''}
        </div>
        <div style="font-size:12px; color:#aaa; padding:8px 0; border-top:1px solid rgba(255,255,255,0.05); margin-top:8px;">
            <strong>📦 Items:</strong> ${itemsList}
        </div>
        ${p.notes ? `<div style="font-size:12px; color:#888; margin-top:4px;">📝 ${p.notes}</div>` : ''}
        ${dueWarning}
        <div class="bc-message ${messageType}">${messageContent}</div>
        <div class="bc-actions">
            <button class="bc-btn view" onclick="viewBillDetails('${p.id}')">👁️ View Details</button>
            ${photoBtn}
            ${extraActions}
        </div>
        <div style="font-size:11px; color:#666; margin-top:6px;">👤 ${p.performedByName} | 🕐 ${formatTimestamp(p.createdAt)}</div>
    </div>`;
}

function renderPendingBills() {
    const list = document.getElementById('pendingBillsList');
    if (!list) return;
    const pending = allPurchases.filter(p => p.status === 'pending_approval');
    if (pending.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">✅ No pending bills!</div>';
        return;
    }
    let html = '';
    pending.forEach(p => {
        const msg = `<strong>⏳ Waiting for Manager Approval</strong>Reports Database එකේ review වෙනවා.`;
        const extraBtn = isManagerUser() ? `<button class="bc-btn view" onclick="window.location.href='reports.html#pendingapprovals'">📊 Review in Reports</button>` : '';
        html += buildBillCard(p, 'pending', '⏳ Pending', 'approve', msg, extraBtn);
    });
    list.innerHTML = html;
}

function renderApprovedBills() {
    const list = document.getElementById('approvedBillsList');
    if (!list) return;
    const approved = allPurchases.filter(p => p.status === 'approved');
    if (approved.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No approved bills.</div>';
        return;
    }
    let html = '';
    approved.forEach(p => {
        const msg = `<strong>✅ Approved by ${p.approvedByName || 'Manager'}</strong>${p.approvalNotes ? `📝 ${p.approvalNotes}` : ''}<br>📅 ${formatTimestamp(p.approvedAt)}${p.stockUpdated ? '<br>✅ Inventory stock updated.' : ''}`;
        html += buildBillCard(p, 'approved', '✅ Approved', 'approve', msg);
    });
    list.innerHTML = html;
}

function renderRejectedBills() {
    const list = document.getElementById('rejectedBillsList');
    if (!list) return;
    const rejected = allPurchases.filter(p => p.status === 'rejected');
    if (rejected.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">🎉 No rejected bills!</div>';
        return;
    }
    let html = '';
    rejected.forEach(p => {
        const msg = `<strong>❌ Rejected by ${p.approvedByName}</strong>📝 <strong>Reason:</strong> ${p.rejectedReason || 'No reason'}<br>🔄 Edit & resubmit කරන්න!`;
        const extraBtn = `<button class="bc-btn recount" onclick="loadRejectedForRecount('${p.id}')">🔄 Edit & Resubmit</button>`;
        html += buildBillCard(p, 'rejected', '❌ Rejected', 'reject', msg, extraBtn);
    });
    list.innerHTML = html;
}

function loadRejectedForRecount(billId) {
    const p = allPurchases.find(x => x.id === billId);
    if (!p) return;
    if (!confirm('🔄 Load rejected bill?')) return;
    showSection('new', document.getElementById('tab-new-btn'));
    setTimeout(() => {
        document.getElementById('purchaseDate').value = p.date;
        document.getElementById('supplierInput').value = p.supplierName;
        document.getElementById('supplierInput').dataset.supplierId = p.supplierId || '';
        document.getElementById('supplierPhone').value = p.supplierPhone || '';
        document.getElementById('billNumber').value = p.billNumber + '-R';
        document.getElementById('paymentMethod').value = p.paymentMethod;
        onPaymentChange();
        if (p.dueDate) document.getElementById('dueDate').value = p.dueDate;
        if (p.billPhotoUrl) {
            document.getElementById('billPhotoUrl').value = p.billPhotoUrl;
            uploadedPhotoUrl = p.billPhotoUrl;
            uploadedPhotoPath = p.billPhotoPath || '';
            previewBillPhoto();
        }
        document.getElementById('purchaseNotes').value = (p.notes || '') + '\n\n[Resubmitted from rejected]';
        document.getElementById('itemRowsList').innerHTML = '';
        document.getElementById('noItemsMsg').style.display = 'none';
        itemRowCounter = 0;
        (p.items || []).forEach(item => {
            addItemRow();
            const rowId = 'item-row-' + (itemRowCounter - 1);
            const row = document.getElementById(rowId);
            row.querySelector('.item-search').value = item.itemName;
            row.querySelector('.item-id').value = item.itemId;
            document.getElementById(rowId + '-unit').textContent = item.unit;
            row.querySelector('.item-qty').value = item.quantity;
            row.querySelector('.item-total').value = item.totalCost;
            calculateRow(rowId);
        });
        alert('✅ Loaded! Edit & submit.');
    }, 200);
}

function getOverdueBills() {
    const today = new Date().toISOString().split('T')[0];
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate && p.dueDate < today);
}
function getDueTodayBills() {
    const today = new Date().toISOString().split('T')[0];
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate === today);
}
function getUpcomingBills() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sevenDays = new Date();
    sevenDays.setDate(today.getDate() + 7);
    const sevenStr = sevenDays.toISOString().split('T')[0];
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate && p.dueDate > todayStr && p.dueDate <= sevenStr);
}
function getAllUnpaidBills() {
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid');
}
function getPaidBills() {
    return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'paid' && p.paymentMethod !== 'cash');
}

function updateCreditBadges() {
    const overdue = getOverdueBills();
    const today = getDueTodayBills();
    const upcoming = getUpcomingBills();
    const allUnpaid = getAllUnpaidBills();
    const paid = getPaidBills();

    const oc = document.getElementById('creditOverdueCount');
    const tc = document.getElementById('creditDueTodayCount');
    const uc = document.getElementById('creditUpcomingCount');
    const ut = document.getElementById('creditTotalUnpaid');

    if (oc) oc.textContent = overdue.length;
    if (tc) tc.textContent = today.length;
    if (uc) uc.textContent = upcoming.length;
    const totalUnpaid = allUnpaid.reduce((s, p) => s + (p.billTotal || 0), 0);
    if (ut) ut.textContent = 'Rs. ' + totalUnpaid.toLocaleString('en-LK', { maximumFractionDigits: 0 });

    const setBadge = (id, count) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-block' : 'none';
    };
    setBadge('ctOverdueBadge', overdue.length);
    setBadge('ctTodayBadge', today.length);
    setBadge('ctUpcomingBadge', upcoming.length);
    setBadge('ctAllUnpaidBadge', allUnpaid.length);
    setBadge('ctPaidBadge', paid.length);
}

function showCreditTab(name, btnEl) {
    currentCreditTab = name;
    document.querySelectorAll('#section-credit > .nav-tabs > .nav-tab').forEach(t => t.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderCreditTab();
}

function renderCreditTab() {
    const list = document.getElementById('creditBillsList');
    if (!list) return;
    let bills = [], emptyMsg = '', cardType = '';

    if (currentCreditTab === 'overdue') { bills = getOverdueBills(); emptyMsg = '🎉 No overdue payments!'; cardType = 'overdue'; }
    else if (currentCreditTab === 'today') { bills = getDueTodayBills(); emptyMsg = '✅ Nothing due today!'; cardType = 'today'; }
    else if (currentCreditTab === 'upcoming') { bills = getUpcomingBills(); emptyMsg = '📭 No upcoming bills.'; cardType = 'upcoming'; }
    else if (currentCreditTab === 'all-unpaid') { bills = getAllUnpaidBills(); emptyMsg = '🎉 All paid!'; cardType = 'unpaid'; }
    else if (currentCreditTab === 'paid') { bills = getPaidBills(); emptyMsg = '📭 No paid bills.'; cardType = 'paid'; }

    if (bills.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">${emptyMsg}</div>`;
        return;
    }
    bills.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank Transfer' };
    let html = '';
    bills.forEach(p => {
        const today = new Date().toISOString().split('T')[0];
        let dueLabel = '', dueColor = '';
        if (p.dueDate) {
            if (p.dueDate < today) {
                const daysOverdue = Math.floor((new Date(today) - new Date(p.dueDate)) / (1000 * 60 * 60 * 24));
                dueLabel = `🚨 OVERDUE by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`;
                dueColor = '#ff4444';
            } else if (p.dueDate === today) {
                dueLabel = '⏰ DUE TODAY';
                dueColor = '#f0a500';
            } else {
                const daysLeft = Math.floor((new Date(p.dueDate) - new Date(today)) / (1000 * 60 * 60 * 24));
                dueLabel = `⏳ ${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
                dueColor = '#2196F3';
            }
        }
        const isPaid = p.paymentStatus === 'paid';

        html += `<div class="bill-card ${isPaid ? 'approved' : 'rejected'}" style="border-left-color:${isPaid ? '#4CAF50' : (cardType === 'overdue' ? '#ff4444' : cardType === 'today' ? '#f0a500' : '#FF9800')};">
            <div class="bc-header">
                <div class="bc-left">
                    <span class="bc-bill-num">📄 ${p.billNumber}</span>
                    <span class="bc-date">📅 ${p.date}</span>
                    <span class="bc-payment-badge ${p.paymentMethod}">${paymentIcons[p.paymentMethod]}</span>
                </div>
                ${dueLabel ? `<span style="color:${dueColor}; font-weight:700; font-size:13px;">${dueLabel}</span>` : ''}
            </div>
            <div class="bc-supplier">🏪 ${p.supplierName}${p.supplierPhone ? ` <span style="color:#888; font-size:13px;">📞 ${p.supplierPhone}</span>` : ''}</div>
            <div class="bc-stats">
                <div class="bc-stat"><div class="bs-value">${p.itemsCount || 0}</div><div class="bs-label">Items</div></div>
                <div class="bc-stat"><div class="bs-value" style="color:#FF9800;">Rs.${(p.billTotal || 0).toLocaleString('en-LK')}</div><div class="bs-label">Total</div></div>
                ${p.dueDate ? `<div class="bc-stat"><div class="bs-value" style="color:${dueColor};">${p.dueDate}</div><div class="bs-label">Due Date</div></div>` : ''}
            </div>
            ${isPaid && p.paidDate ? `<div style="padding:10px 14px; background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); border-radius:8px; margin-top:10px; font-size:13px; color:#4CAF50;">✅ PAID on ${p.paidDate}${p.paidNotes ? `<br>📝 ${p.paidNotes}` : ''}</div>` : ''}
            <div class="bc-actions">
                <button class="bc-btn view" onclick="viewBillDetails('${p.id}')">👁️ View</button>
                ${p.billPhotoUrl ? `<button class="bc-btn view" onclick="openPhotoFullscreen('${p.billPhotoUrl}')">📸 Photo</button>` : ''}
                ${!isPaid && isManagerUser() ? `<button class="bc-btn" style="background:#4CAF50; color:white;" onclick="openMarkPaidModal('${p.id}')">💰 Mark Paid</button>` : ''}
                ${isPaid && isManagerUser() ? `<button class="bc-btn" style="background:rgba(240,165,0,0.15); color:#f0a500;" onclick="markUnpaid('${p.id}')">🔄 Mark Unpaid</button>` : ''}
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function openMarkPaidModal(billId) {
    const p = allPurchases.find(x => x.id === billId);
    if (!p) return;
    markPaidBillId = billId;
    document.getElementById('markPaidBody').innerHTML = `
        <div style="background:#0f3460; padding:14px; border-radius:8px;">
            <div style="font-size:14px; color:#FF9800; font-weight:700; margin-bottom:8px;">🏪 ${p.supplierName}</div>
            <div style="font-size:13px; color:#aaa;">📄 ${p.billNumber}</div>
            <div style="font-size:18px; color:#4CAF50; font-weight:700; margin-top:8px;">💰 Rs. ${(p.billTotal || 0).toLocaleString('en-LK')}</div>
        </div>
    `;
    document.getElementById('paidDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('paidNotesInput').value = '';
    document.getElementById('markPaidModal').style.display = 'flex';
}

function closeMarkPaidModal() {
    document.getElementById('markPaidModal').style.display = 'none';
}

async function confirmMarkPaid() {
    const paidDate = document.getElementById('paidDateInput').value;
    const paidNotes = document.getElementById('paidNotesInput').value.trim();
    if (!paidDate) { alert('⚠️ Payment date!'); return; }
    try {
        await db.collection('purchases').doc(markPaidBillId).update({
            paymentStatus: 'paid', paidDate, paidNotes,
            paidBy: currentUser.nickname,
            paidByName: currentUser.name,
            paidAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Marked as Paid!');
        closeMarkPaidModal();
    } catch (e) { alert('❌ ' + e.message); }
}

async function markUnpaid(billId) {
    if (!confirm('🔄 Mark as UNPAID?')) return;
    try {
        await db.collection('purchases').doc(billId).update({
            paymentStatus: 'unpaid',
            paidDate: null, paidNotes: '',
            paidBy: null, paidByName: null, paidAt: null
        });
        alert('✅ Marked as Unpaid!');
    } catch (e) { alert('❌ ' + e.message); }
}

function viewBillDetails(billId) {
    const p = allPurchases.find(x => x.id === billId);
    if (!p) return;
    document.getElementById('billDetailTitle').textContent = `📄 Bill: ${p.billNumber}`;

    let itemsHtml = '<table style="width:100%; border-collapse:collapse; font-size:13px;"><thead><tr style="background:rgba(255,152,0,0.1);"><th style="padding:10px; text-align:left; color:#FF9800;">Item</th><th style="padding:10px; color:#FF9800;">Qty</th><th style="padding:10px; color:#FF9800;">Per Unit</th><th style="padding:10px; color:#FF9800;">Total</th></tr></thead><tbody>';
    (p.items || []).forEach(item => {
        itemsHtml += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:10px;"><strong>${item.itemName}</strong></td><td style="padding:10px; text-align:center;">${dispQty(item.quantity)} ${item.unit}</td><td style="padding:10px; text-align:center; color:#FF9800;">Rs. ${(item.pricePerUnit || 0).toFixed(2)}</td><td style="padding:10px; text-align:right; color:#FF9800; font-weight:700;">Rs. ${(item.totalCost || 0).toLocaleString('en-LK')}</td></tr>`;
    });
    itemsHtml += `<tr style="background:rgba(255,152,0,0.08); font-weight:700;"><td colspan="3" style="padding:12px; text-align:right; color:#FF9800;">GRAND TOTAL:</td><td style="padding:12px; text-align:right; color:#FF9800; font-size:16px;">Rs. ${(p.billTotal || 0).toLocaleString('en-LK')}</td></tr></tbody></table>`;

    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank Transfer' };
    document.getElementById('billDetailBody').innerHTML = `
        <div style="background:#0f3460; padding:14px; border-radius:8px; margin-bottom:14px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px;">
                <div><strong style="color:#FF9800;">📅 Date:</strong> ${p.date}</div>
                <div><strong style="color:#FF9800;">🏪 Supplier:</strong> ${p.supplierName}</div>
                <div><strong style="color:#FF9800;">📞 Phone:</strong> ${p.supplierPhone || 'N/A'}</div>
                <div><strong style="color:#FF9800;">📄 Bill #:</strong> ${p.billNumber}</div>
                <div><strong style="color:#FF9800;">💳 Payment:</strong> ${paymentIcons[p.paymentMethod] || p.paymentMethod}</div>
                ${p.dueDate ? `<div><strong style="color:#FF9800;">📅 Due:</strong> ${p.dueDate}</div>` : ''}
            </div>
        </div>
        ${p.billPhotoUrl ? `<div style="margin-bottom:14px; text-align:center;"><img src="${p.billPhotoUrl}" style="max-width:300px; max-height:300px; border-radius:8px; cursor:pointer; border:2px solid rgba(255,152,0,0.3);" onclick="openPhotoFullscreen('${p.billPhotoUrl}')"><div style="font-size:11px; color:#888; margin-top:6px;">📸 Click to view full size</div></div>` : ''}
        <div style="background:#0f3460; padding:14px; border-radius:8px; overflow-x:auto;">${itemsHtml}</div>
        ${p.notes ? `<div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; margin-top:12px; font-size:13px; color:#ccc;">📝 ${p.notes}</div>` : ''}
        <div style="font-size:11px; color:#666; margin-top:14px;">👤 ${p.performedByName} | 🕐 ${formatTimestamp(p.createdAt)}${p.approvedAt ? `<br>✅ ${p.status === 'approved' ? 'Approved' : 'Rejected'}: ${p.approvedByName} | 🕐 ${formatTimestamp(p.approvedAt)}` : ''}${p.paidAt ? `<br>💰 Paid: ${p.paidByName} | 🕐 ${formatTimestamp(p.paidAt)}` : ''}</div>
    `;
    document.getElementById('billDetailModal').style.display = 'flex';
}

function closeBillDetailModal() {
    document.getElementById('billDetailModal').style.display = 'none';
}

function updateSupplierStats() {
    document.getElementById('sup-stat-total').textContent = allSuppliers.length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeCount = allSuppliers.filter(s => {
        if (!s.lastPurchaseDate) return false;
        return new Date(s.lastPurchaseDate) >= thirtyDaysAgo;
    }).length;
    document.getElementById('sup-stat-active').textContent = activeCount;
    const totalSpend = allSuppliers.reduce((sum, s) => sum + (s.totalValue || 0), 0);
    document.getElementById('sup-stat-spend').textContent = formatSupCurrency(totalSpend);
    if (allSuppliers.length > 0) {
        const top = allSuppliers.reduce((prev, curr) =>
            (prev.totalValue || 0) > (curr.totalValue || 0) ? prev : curr
        );
        const shortName = top.name.length > 10 ? top.name.substring(0, 10) + '...' : top.name;
        document.getElementById('sup-stat-top').textContent = shortName;
    } else {
        document.getElementById('sup-stat-top').textContent = '-';
    }
}

function renderSuppliersList(suppliers) {
    const container = document.getElementById('sup-list-container');
    if (suppliers.length === 0) {
        container.innerHTML = `
            <div class="sup-empty">
                <div class="sup-empty-icon">🏪</div>
                <p style="font-size:16px; margin-bottom:8px;">Suppliers නෑ</p>
                <p style="font-size:13px;">➕ Add Supplier button click කරන්න</p>
            </div>
        `;
        return;
    }
    let html = '';
    suppliers.forEach(sup => {
        const totalBills = sup.totalPurchases || 0;
        const totalValue = sup.totalValue || 0;
        const lastDate = sup.lastPurchaseDate || 'N/A';
        const phone = sup.phone || 'Phone නෑ';
        const canDelete = totalBills === 0;
        html += `
            <div class="supplier-card">
                <div class="supplier-card-header">
                    <div>
                        <div class="supplier-name">🏪 ${escapeHtml(sup.name)}</div>
                        <div class="supplier-phone">📞 ${escapeHtml(phone)}</div>
                        ${sup.address ? `<div class="supplier-phone">🏠 ${escapeHtml(sup.address)}</div>` : ''}
                    </div>
                </div>
                <div class="supplier-card-stats">
                    <div class="sup-mini-stat">
                        <div class="val">${totalBills}</div>
                        <div class="lbl">Total Bills</div>
                    </div>
                    <div class="sup-mini-stat">
                        <div class="val">${formatSupCurrency(totalValue)}</div>
                        <div class="lbl">Total Spend</div>
                    </div>
                    <div class="sup-mini-stat">
                        <div class="val">${totalBills > 0 ? formatSupCurrency(totalValue / totalBills) : 'Rs.0'}</div>
                        <div class="lbl">Avg Bill</div>
                    </div>
                </div>
                <div class="supplier-last-date">
                    📅 Last Purchase: <strong>${lastDate}</strong>
                    ${sup.firstPurchaseDate ? ` | First: <strong>${sup.firstPurchaseDate}</strong>` : ''}
                </div>
                <div class="supplier-action-btns">
                    <button class="sup-btn-history" onclick="viewSupplierHistory('${sup.id}')">
                        👁️ View History
                    </button>
                    <button class="sup-btn-edit" onclick="editSupplier('${sup.id}')">
                        ✏️ Edit
                    </button>
                    <button class="sup-btn-delete"
                        onclick="deleteSupplier('${sup.id}', '${escapeHtml(sup.name)}', ${totalBills})"
                        ${canDelete ? '' : 'disabled title="Bills තියෙනවා - delete කරන්න බෑ"'}>
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function filterSuppliersList() {
    const query = document.getElementById('sup-search').value.toLowerCase().trim();
    if (query === '') {
        renderSuppliersList(allSuppliers);
        return;
    }
    const filtered = allSuppliers.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query)) ||
        (s.address && s.address.toLowerCase().includes(query))
    );
    renderSuppliersList(filtered);
}

function openAddSupplierModal() {
    document.getElementById('sup-edit-id').value = '';
    document.getElementById('sup-name').value = '';
    document.getElementById('sup-phone').value = '';
    document.getElementById('sup-email').value = '';
    document.getElementById('sup-address').value = '';
    document.getElementById('sup-notes').value = '';
    document.getElementById('sup-modal-title').textContent = '🏪 Add New Supplier';
    document.getElementById('sup-add-modal').classList.add('active');
}

function editSupplier(supplierId) {
    const sup = allSuppliers.find(s => s.id === supplierId);
    if (!sup) return;
    document.getElementById('sup-edit-id').value = supplierId;
    document.getElementById('sup-name').value = sup.name || '';
    document.getElementById('sup-phone').value = sup.phone || '';
    document.getElementById('sup-email').value = sup.email || '';
    document.getElementById('sup-address').value = sup.address || '';
    document.getElementById('sup-notes').value = sup.notes || '';
    document.getElementById('sup-modal-title').textContent = '✏️ Edit Supplier';
    document.getElementById('sup-add-modal').classList.add('active');
}

async function saveSupplier() {
    const editId = document.getElementById('sup-edit-id').value.trim();
    const name = document.getElementById('sup-name').value.trim();
    const phone = document.getElementById('sup-phone').value.trim();
    const email = document.getElementById('sup-email').value.trim();
    const address = document.getElementById('sup-address').value.trim();
    const notes = document.getElementById('sup-notes').value.trim();

    if (!name) {
        alert('⚠️ Supplier name required!');
        document.getElementById('sup-name').focus();
        return;
    }

    const duplicate = allSuppliers.find(s =>
        s.name.toLowerCase() === name.toLowerCase() && s.id !== editId
    );
    if (duplicate) {
        alert(`⚠️ "${name}" කියන supplier දැනටමත් තියෙනවා!`);
        return;
    }

    const now = new Date().toISOString();
    const userName = currentUser.nickname || currentUser.name || 'Unknown';

    try {
        if (editId) {
            await db.collection('suppliers').doc(editId).update({
                name, phone, email, address, notes,
                updatedAt: now, updatedBy: userName
            });
            showSupNotification('✅ Supplier updated!', 'success');
        } else {
            await db.collection('suppliers').add({
                name, phone, email, address, notes,
                totalPurchases: 0, totalValue: 0,
                lastPurchaseDate: null, firstPurchaseDate: null,
                createdAt: now, createdBy: userName,
                updatedAt: now, updatedBy: userName
            });
            showSupNotification('✅ Supplier added!', 'success');
        }

        closeSupModal('sup-add-modal');
        await loadSuppliersData();
        renderSuppliersList(allSuppliers);
        updateSupplierStats();

    } catch (error) {
        console.error('Save supplier error:', error);
        alert('❌ Save කරන්න බැරි වුණා. Try again!');
    }
}

function deleteSupplier(supplierId, supplierName, billCount) {
    if (billCount > 0) {
        alert(`❌ "${supplierName}" delete කරන්න බෑ!\n\nමේ supplier ට ${billCount} bills තියෙනවා.`);
        return;
    }
    document.getElementById('sup-delete-id').value = supplierId;
    document.getElementById('sup-delete-msg').innerHTML = `
        <strong style="color:#FF9800;">"${escapeHtml(supplierName)}"</strong><br><br>
        මේ supplier delete කරන්නද?<br>
        <span style="color:#ff4444; font-size:13px;">⚠️ Delete කළාට undo කරන්න බෑ!</span>
    `;
    document.getElementById('sup-delete-modal').classList.add('active');
}

async function confirmDeleteSupplier() {
    const supplierId = document.getElementById('sup-delete-id').value;
    if (!supplierId) return;
    try {
        await db.collection('suppliers').doc(supplierId).delete();
        closeSupModal('sup-delete-modal');
        showSupNotification('🗑️ Supplier deleted!', 'danger');
        await loadSuppliersData();
        renderSuppliersList(allSuppliers);
        updateSupplierStats();
    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Delete කරන්න බැරි වුණා!');
    }
}

async function viewSupplierHistory(supplierId) {
    const sup = allSuppliers.find(s => s.id === supplierId);
    if (!sup) return;

    document.getElementById('sup-history-title').textContent = `📊 ${sup.name} - History`;
    document.getElementById('sup-history-info').innerHTML = `
        ${sup.phone ? `<span class="sup-info-chip">📞 ${escapeHtml(sup.phone)}</span>` : ''}
        ${sup.email ? `<span class="sup-info-chip">📧 ${escapeHtml(sup.email)}</span>` : ''}
        ${sup.address ? `<span class="sup-info-chip">🏠 ${escapeHtml(sup.address)}</span>` : ''}
        ${!sup.phone && !sup.email && !sup.address ? '<span class="sup-info-chip">ℹ️ Contact details නෑ</span>' : ''}
    `;

    document.getElementById('sup-history-bills').innerHTML = '<div class="sup-loading">⏳ Loading bills...</div>';
    document.getElementById('sup-history-modal').classList.add('active');

    try {
        // 🔥 Index avoid - orderBy නැතුව
        const snapshot = await db.collection('purchases')
            .where('supplierName', '==', sup.name)
            .get();

        const bills = [];
        snapshot.forEach(doc => bills.push({ id: doc.id, ...doc.data() }));

        // JS වල sort - newest first
        bills.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        const totalBills = bills.length;
        const totalSpend = bills.reduce((sum, b) => sum + (b.billTotal || 0), 0);
        const avgBill = totalBills > 0 ? totalSpend / totalBills : 0;
        const lastDate = bills.length > 0 ? bills[0].date : '-';

        document.getElementById('sh-total-bills').textContent = totalBills;
        document.getElementById('sh-total-spend').textContent = formatSupCurrency(totalSpend);
        document.getElementById('sh-avg-bill').textContent = formatSupCurrency(avgBill);
        document.getElementById('sh-last-date').textContent = lastDate;

        if (bills.length === 0) {
            document.getElementById('sup-history-bills').innerHTML = `
                <div class="sup-no-bills">📭 Bills නෑ - Purchase record නෑ</div>
            `;
        } else {
            let billsHtml = '';
            bills.forEach((bill, index) => {
                const statusClass = bill.status === 'approved' ? 'status-approved' :
                    bill.status === 'rejected' ? 'status-rejected' : 'status-pending';
                const statusText = bill.status === 'approved' ? '✅ Approved' :
                    bill.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';

                let itemsHtml = '';
                if (bill.items && bill.items.length > 0) {
                    bill.items.forEach(item => {
                        itemsHtml += `
                            <div class="sup-bill-item-row">
                                <span>${escapeHtml(item.itemName || '-')}</span>
                                <span>${item.quantity || 0} ${item.unit || ''}</span>
                                <span style="color:#4CAF50;">Rs. ${formatNumber(item.totalCost || 0)}</span>
                            </div>
                        `;
                    });
                }

                billsHtml += `
                    <div class="sup-bill-row" onclick="toggleSupBillDetails('sup-bill-detail-${index}')">
                        <div class="sup-bill-row-header">
                            <div>
                                <span class="sup-bill-num">🧾 ${escapeHtml(bill.billNumber || 'No Bill #')}</span>
                                <span class="sup-bill-date" style="margin-left:8px;">${bill.date || '-'}</span>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span class="sup-bill-amount">Rs. ${formatNumber(bill.billTotal || 0)}</span>
                                <span class="sup-bill-status ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                        <div style="margin-top:5px;">
                            <span style="font-size:11px; color:#aaa;">
                                💳 ${bill.paymentMethod || 'Cash'}
                                ${bill.paymentStatus === 'unpaid' ? ' | <span style="color:#ff4444;">⚠️ Unpaid</span>' : ''}
                            </span>
                        </div>
                        <div class="sup-bill-details" id="sup-bill-detail-${index}">
                            <div style="font-size:12px; color:#888; margin-bottom:6px;">📦 Items:</div>
                            ${itemsHtml || '<div style="color:#aaa; font-size:12px;">Items data නෑ</div>'}
                            ${bill.notes ? `<div style="margin-top:8px; font-size:12px; color:#aaa;">📝 ${escapeHtml(bill.notes)}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            document.getElementById('sup-history-bills').innerHTML = billsHtml;
        }

        await syncSupplierStats(supplierId, bills);

    } catch (error) {
        console.error('History load error:', error);
        document.getElementById('sup-history-bills').innerHTML = `
            <div class="sup-no-bills">❌ Load කරන්න බැරි වුණා: ${error.message}</div>
        `;
    }
}

async function syncSupplierStats(supplierId, bills) {
    try {
        const approvedBills = bills.filter(b => b.status === 'approved');
        const totalPurchases = bills.length;
        const totalValue = approvedBills.reduce((sum, b) => sum + (b.billTotal || 0), 0);

        const sortedByDate = [...bills].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstPurchaseDate = sortedByDate.length > 0 ? sortedByDate[0].date : null;
        const lastPurchaseDate = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1].date : null;

        await db.collection('suppliers').doc(supplierId).update({
            totalPurchases, totalValue,
            firstPurchaseDate, lastPurchaseDate
        });

        const localSup = allSuppliers.find(s => s.id === supplierId);
        if (localSup) {
            localSup.totalPurchases = totalPurchases;
            localSup.totalValue = totalValue;
            localSup.firstPurchaseDate = firstPurchaseDate;
            localSup.lastPurchaseDate = lastPurchaseDate;
        }
    } catch (error) {
        console.log('Sync skip:', error);
    }
}

function toggleSupBillDetails(detailId) {
    const el = document.getElementById(detailId);
    if (!el) return;
    el.classList.toggle('open');
}

function closeSupModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showSupNotification(message, type = 'success') {
    let toast = document.getElementById('sup-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sup-toast';
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 20px;
            padding: 14px 22px; border-radius: 10px;
            font-size: 15px; font-weight: bold; z-index: 99999;
            transition: opacity 0.4s;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#4CAF50' : '#ff4444';
    toast.style.color = 'white';
    toast.style.opacity = '1';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 400);
    }, 3000);
}

window.onclick = function (event) {
    if (event.target.id === 'billDetailModal') closeBillDetailModal();
    if (event.target.id === 'photoFullscreenModal') closePhotoFullscreen();
    if (event.target.id === 'markPaidModal') closeMarkPaidModal();
    if (event.target.id === 'sup-add-modal') closeSupModal('sup-add-modal');
    if (event.target.id === 'sup-history-modal') closeSupModal('sup-history-modal');
    if (event.target.id === 'sup-delete-modal') closeSupModal('sup-delete-modal');
};