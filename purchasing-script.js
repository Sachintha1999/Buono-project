// ════════════════════════════════════════════════════════════
// 🛒 PURCHASING DATABASE - COMPLETE JAVASCRIPT
// 📁 File: public/purchasing-script.js
// 📅 Version: 10.1 - Architecture Migration!
// ⭐ Uses global DATABASES from firebase-config.js
// ════════════════════════════════════════════════════════════/

// ❌ NO firebaseConfig - uses global from firebase-config.js!
// ❌ NO DATABASES array - uses global from firebase-config.js!
// ✅ Using globals: db, getCurrentUser(), DATABASES

const storage = firebase.storage();

let currentUser = null;
let myPerms = null;
let allInventoryItems = [];
let allSuppliers = [];
let allPurchases = [];
let allPurchaseReturns = [];
let itemRowCounter = 0;
let seenRejectedIds = new Set();
let currentCreditTab = 'overdue';
let markPaidBillId = '';
let uploadedPhotoUrl = '';
let uploadedPhotoPath = '';
let currentReturnSubTab = 'new-return';
let selectedReturnBill = null;
let selectedReturnReason = '';
let editingReturnId = '';
let currentReturnActionId = '';
let currentReturnActionType = '';

function fmtQty(num) { if (num === null || num === undefined || isNaN(num)) return 0; return Math.round(num * 1000) / 1000; }
function dispQty(num) { if (num === null || num === undefined || isNaN(num)) return '0'; return (Math.round(num * 1000) / 1000).toString(); }
function fmt(amount) { if (amount === undefined || amount === null) return 'Rs. 0'; return 'Rs. ' + Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function isManagerUser() { return ['Admin', 'Manager'].includes(currentUser?.access); }
function formatTimestamp(ts) { if (!ts) return 'N/A'; if (typeof ts === 'string') return ts; if (ts.toDate) { const d = ts.toDate(); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } return 'N/A'; }
function formatSupCurrency(amount) { if (!amount || amount === 0) return 'Rs.0'; if (amount >= 1000000) return 'Rs.' + (amount / 1000000).toFixed(1) + 'M'; if (amount >= 1000) return 'Rs.' + (amount / 1000).toFixed(1) + 'K'; return 'Rs.' + Math.round(amount).toLocaleString(); }
function formatNumber(num) { return Math.round(num || 0).toLocaleString(); }
function escapeHtml(text) { if (!text) return ''; return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function generateReturnNumber() { const now = new Date(); const datePart = now.toISOString().slice(2, 10).replace(/-/g, ''); const rand = Math.floor(Math.random() * 900 + 100); return `RET-${datePart}-${rand}`; }
function generateCreditNoteNumber() { const now = new Date(); const datePart = now.toISOString().slice(2, 10).replace(/-/g, ''); const rand = Math.floor(Math.random() * 900 + 100); return `SCN-${datePart}-${rand}`; }
function getReturnReasonLabel(code, otherText = '') { const map = { damaged: 'Damaged', wrong_item: 'Wrong Item', expired: 'Expired', quality: 'Quality Issue', overstock: 'Overstock', other: otherText || 'Other' }; return map[code] || otherText || 'N/A'; }
function getNetPayable(p) { const billTotal = p.billTotal || 0; const returnedValue = p.returnedValue || 0; return Math.max(0, billTotal - returnedValue); }

async function initializeApp() {
    const userData = getCurrentUser();
    if (!userData) { window.location.href = "login.html"; return; }
    try {
        const userDoc = await db.collection('employees').doc(userData.id).get();
        if (userDoc.exists) { const d = userDoc.data(); userData.access = d.access; userData.permissions = d.permissions || {}; userData.name = d.name; userData.nickname = d.nickname; sessionStorage.setItem('loggedInUser', JSON.stringify(userData)); }
    } catch (e) { console.error(e); }
    const isAdmin = userData.access === 'Admin';
    const perms = userData.permissions?.purchasingDB || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView || perms.edit;
    if (!hasAccess) { alert('⛔ Access denied!'); window.location.href = "access.html"; return; }
    myPerms = isAdmin ? { add: true, view: true, selfView: true, edit: true, delete: true } : perms;
    currentUser = userData;
    document.getElementById('welcomeUser').textContent = `👋 Welcome, ${userData.name} (${userData.access})`;
    const seen = localStorage.getItem('seenPurchaseRejected_' + userData.id);
    if (seen) seenRejectedIds = new Set(JSON.parse(seen));
    buildDatabaseSwitcher(); setupForm(); initializeReturnsUI();
    await loadInventoryItems(); await loadSuppliersData(); loadPurchases(); loadPurchaseReturns();
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.supplier-input-wrap')) document.getElementById('supplierSuggestions')?.classList.remove('show');
        if (!e.target.closest('.item-search-wrap')) document.querySelectorAll('.item-suggestions').forEach(s => s.classList.remove('show'));
        const dd = document.getElementById('dbDropdown');
        if (dd && !dd.contains(e.target) && !e.target.closest('#dbSwitcher')) dd.classList.remove('show');
    });
}
initializeApp();

function setupForm() { document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0]; }
function initializeReturnsUI() { document.querySelectorAll('.return-sub-section').forEach((sec, index) => { sec.style.display = index === 0 ? 'block' : 'none'; }); resetReturnForm(true); }

function buildDatabaseSwitcher() {
    const list = document.getElementById('dbDropdownList');
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';
    DATABASES.forEach(d => {
        if (d.adminManagerOnly && !isAdminOrMgr) return;
        const isAdmin = currentUser.access === 'Admin'; const dp = currentUser.permissions?.[d.id] || {};
        const hasAccess = isAdmin || dp.add || dp.view || dp.selfView || dp.edit || dp.delete;
        if (!d.adminManagerOnly && !hasAccess) return;
        const isCurrent = d.id === 'purchasingDB';
        html += `<a href="${d.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}"><span>${d.icon}</span><span>${d.name}</span>${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}</a>`;
    });
    list.innerHTML = html;
    document.getElementById('dbSwitcher').addEventListener('click', function (e) { e.stopPropagation(); document.getElementById('dbDropdown').classList.toggle('show'); });
}

function showSection(name, btnEl) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    const sect = document.getElementById('section-' + name); if (sect) sect.classList.add('active');
    document.querySelectorAll('.dashboard-container > .nav-tabs > .nav-tab').forEach(t => t.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    if (name === 'pending') renderPendingBills(); if (name === 'approved') renderApprovedBills();
    if (name === 'rejected') { renderRejectedBills(); allPurchases.filter(p => p.status === 'rejected').forEach(p => seenRejectedIds.add(p.id)); localStorage.setItem('seenPurchaseRejected_' + currentUser.id, JSON.stringify([...seenRejectedIds])); updateBadges(); updateAlertBanner(); }
    if (name === 'credit') renderCreditTab(); if (name === 'suppliers') { renderSuppliersList(allSuppliers); updateSupplierStats(); }
    if (name === 'returns') { renderReturnsDashboard(); showReturnSubTab(currentReturnSubTab); }
    if (name === 'reports') { initReportsTab(); loadPurchasingReports(); }
}

async function loadInventoryItems() { try { const snap = await db.collection('inventoryItems').orderBy('itemName').get(); allInventoryItems = []; snap.forEach(doc => allInventoryItems.push({ id: doc.id, ...doc.data() })); } catch (e) { console.error(e); } }
async function loadSuppliersData() { try { const snap = await db.collection('suppliers').orderBy('name').get(); allSuppliers = []; snap.forEach(doc => allSuppliers.push({ id: doc.id, ...doc.data() })); } catch (e) { console.error(e); } }

function loadPurchases() {
    db.collection('purchases').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allPurchases = []; snap.forEach(doc => allPurchases.push({ id: doc.id, ...doc.data() }));
        updateStats(); updateBadges(); updateAlertBanner(); updateCreditBadges();
        const activeTab = document.querySelector('.dashboard-container > .nav-tabs > .nav-tab.active')?.id || '';
        if (activeTab === 'tab-pending-btn') renderPendingBills(); if (activeTab === 'tab-approved-btn') renderApprovedBills();
        if (activeTab === 'tab-rejected-btn') renderRejectedBills(); if (activeTab === 'tab-credit-btn') renderCreditTab();
        if (activeTab === 'tab-returns-btn') renderReturnsDashboard(); if (activeTab === 'tab-reports-btn') loadPurchasingReports();
        if (selectedReturnBill) { const freshBill = allPurchases.find(p => p.id === selectedReturnBill.id); if (freshBill) selectedReturnBill = freshBill; }
    }, err => console.error('Purchases error:', err));
}

function loadPurchaseReturns() {
    db.collection('purchaseReturns').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allPurchaseReturns = []; snap.forEach(doc => allPurchaseReturns.push({ id: doc.id, ...doc.data() }));
        updateReturnStats(); updateReturnBadges();
        if (document.getElementById('section-returns')?.classList.contains('active')) renderReturnsDashboard();
        if (document.getElementById('section-reports')?.classList.contains('active')) loadPurchasingReports();
    }, err => console.error('Purchase Returns error:', err));
}

function updateStats() {
    document.getElementById('statTotalBills').textContent = allPurchases.length;
    document.getElementById('statPending').textContent = allPurchases.filter(p => p.status === 'pending_approval').length;
    document.getElementById('statApproved').textContent = allPurchases.filter(p => p.status === 'approved').length;
    const totalValue = allPurchases.filter(p => p.status === 'approved').reduce((s, p) => s + (p.billTotal || 0), 0);
    document.getElementById('statTotalValue').textContent = fmt(totalValue).replace('.00', '');
}

function updateBadges() {
    const pending = allPurchases.filter(p => p.status === 'pending_approval').length;
    const approved = allPurchases.filter(p => p.status === 'approved').length;
    const rejected = allPurchases.filter(p => p.status === 'rejected').length;
    const pBadge = document.getElementById('pendingBadge'); pBadge.textContent = pending; pBadge.style.display = pending > 0 ? 'inline-block' : 'none';
    const aBadge = document.getElementById('approvedBadge'); aBadge.textContent = approved; aBadge.style.display = approved > 0 ? 'inline-block' : 'none';
    const rBadge = document.getElementById('rejectedBadge'); const rTab = document.getElementById('tab-rejected-btn');
    rBadge.textContent = rejected; rBadge.style.display = rejected > 0 ? 'inline-block' : 'none';
    const rejectedNew = allPurchases.filter(p => p.status === 'rejected' && !seenRejectedIds.has(p.id));
    if (rejectedNew.length > 0) rTab.classList.add('has-new'); else rTab.classList.remove('has-new');
}

function updateAlertBanner() {
    const banner = document.getElementById('alertBanner'); const title = document.getElementById('alertTitle'); const subtitle = document.getElementById('alertSubtitle');
    const rejectedNew = allPurchases.filter(p => p.status === 'rejected' && !seenRejectedIds.has(p.id));
    const pending = allPurchases.filter(p => p.status === 'pending_approval').length;
    const overdueBills = getOverdueBills(); const pendingReturns = allPurchaseReturns.filter(r => r.status === 'pending_return').length;
    banner.classList.remove('danger');
    if (overdueBills.length > 0) { banner.classList.add('danger'); title.textContent = `🚨 ${overdueBills.length} OVERDUE Payment${overdueBills.length > 1 ? 's' : ''}!`; subtitle.textContent = '💳 Credit Tracking tab → check කරන්න'; banner.classList.add('show'); return; }
    if (rejectedNew.length > 0) { banner.classList.add('danger'); title.textContent = `🚨 ${rejectedNew.length} Purchase${rejectedNew.length > 1 ? 's' : ''} REJECTED!`; subtitle.textContent = 'Rejected tab එකට යන්න'; banner.classList.add('show'); return; }
    if (pending > 0 && isManagerUser()) { title.textContent = `${pending} Pending Purchase Approval${pending > 1 ? 's' : ''}`; subtitle.textContent = 'Reports DB එකේ review කරන්න'; banner.classList.add('show'); return; }
    if (pendingReturns > 0 && isManagerUser()) { title.textContent = `${pendingReturns} Pending Return Approval${pendingReturns > 1 ? 's' : ''}`; subtitle.textContent = '🔄 Returns tab එකේ review කරන්න'; banner.classList.add('show'); return; }
    banner.classList.remove('show');
}
// ═══════ PHOTO UPLOAD ═══════
async function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            img.onerror = reject; img.src = e.target.result;
        };
        reader.onerror = reject; reader.readAsDataURL(file);
    });
}
async function handlePhotoFile(input) {
    const file = input.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { alert('⚠️ Image files only!'); return; }
    const progressWrap = document.getElementById('uploadProgressWrap'); const progressFill = document.getElementById('progressBarFill');
    const progressPercent = document.getElementById('uploadProgressPercent'); const status = document.getElementById('uploadStatus');
    progressWrap.classList.add('show'); progressFill.style.width = '0%'; progressPercent.textContent = '0%'; status.textContent = 'Compressing image...';
    try {
        const compressedBlob = await compressImage(file);
        status.textContent = `Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedBlob.size / 1024).toFixed(0)}KB`;
        const timestamp = Date.now(); const fileName = `bills/bill_${timestamp}_${currentUser.nickname}.jpg`;
        const storageRef = storage.ref(fileName); const uploadTask = storageRef.put(compressedBlob);
        uploadTask.on('state_changed',
            (snapshot) => { const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100; progressFill.style.width = progress + '%'; progressPercent.textContent = Math.round(progress) + '%'; status.textContent = `Uploading... ${(snapshot.bytesTransferred / 1024).toFixed(0)}KB / ${(snapshot.totalBytes / 1024).toFixed(0)}KB`; },
            (error) => { console.error(error); progressWrap.classList.remove('show'); alert('❌ Upload failed: ' + error.message); },
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                uploadedPhotoUrl = downloadURL; uploadedPhotoPath = fileName;
                setTimeout(() => { progressWrap.classList.remove('show'); }, 1000);
                document.getElementById('billPhotoImg').src = downloadURL; document.getElementById('photoPreviewBox').classList.add('show');
                document.getElementById('photoUploadSection').classList.add('has-photo'); document.getElementById('billPhotoUrl').value = downloadURL; status.textContent = '✅ Upload complete!';
            }
        );
    } catch (e) { console.error(e); progressWrap.classList.remove('show'); alert('❌ Error: ' + e.message); }
    input.value = '';
}
function previewBillPhoto() {
    const url = document.getElementById('billPhotoUrl').value.trim(); if (!url) { removeBillPhoto(); return; } if (url === uploadedPhotoUrl) return;
    const img = document.getElementById('billPhotoImg'); img.src = url;
    img.onerror = function () { document.getElementById('photoPreviewBox').classList.remove('show'); document.getElementById('photoUploadSection').classList.remove('has-photo'); };
    img.onload = function () { document.getElementById('photoPreviewBox').classList.add('show'); document.getElementById('photoUploadSection').classList.add('has-photo'); uploadedPhotoUrl = url; uploadedPhotoPath = ''; };
}
async function removeBillPhoto() {
    if (uploadedPhotoPath && uploadedPhotoUrl !== document.getElementById('billPhotoUrl').value.trim()) { try { await storage.ref(uploadedPhotoPath).delete(); } catch (e) { console.warn(e); } }
    document.getElementById('billPhotoUrl').value = ''; document.getElementById('billPhotoImg').src = '';
    document.getElementById('photoPreviewBox').classList.remove('show'); document.getElementById('photoUploadSection').classList.remove('has-photo');
    uploadedPhotoUrl = ''; uploadedPhotoPath = '';
}
function openPhotoFullscreen(src) { if (!src) return; document.getElementById('fullscreenImg').src = src; document.getElementById('photoFullscreenModal').style.display = 'flex'; }
function closePhotoFullscreen() { document.getElementById('photoFullscreenModal').style.display = 'none'; }

// ═══════ SUPPLIER AUTOCOMPLETE ═══════
function onSupplierInput() { const input = document.getElementById('supplierInput'); const query = input.value.trim().toLowerCase(); if (!query) { renderSupplierSuggestions(allSuppliers); return; } const filtered = allSuppliers.filter(s => s.name.toLowerCase().includes(query)); renderSupplierSuggestions(filtered, query); }
function renderSupplierSuggestions(suppliers, query = '') {
    const suggestions = document.getElementById('supplierSuggestions'); let html = '';
    suppliers.slice(0, 10).forEach(sup => { html += `<div class="supplier-suggestion-item" onclick="selectSupplier('${sup.id}')"><div style="font-weight:600;">🏪 ${escapeHtml(sup.name)}</div>${sup.phone ? `<div class="sup-phone">📞 ${escapeHtml(sup.phone)}</div>` : ''}</div>`; });
    if (query && !suppliers.some(s => s.name.toLowerCase() === query)) { html += `<div class="supplier-suggestion-item add-new" onclick="useNewSupplier('${query.replace(/'/g, "\\'")}')">➕ Add NEW: "${escapeHtml(query)}"</div>`; }
    if (html) { suggestions.innerHTML = html; suggestions.classList.add('show'); } else suggestions.classList.remove('show');
}
function selectSupplier(supId) { const sup = allSuppliers.find(s => s.id === supId); if (!sup) return; document.getElementById('supplierInput').value = sup.name; document.getElementById('supplierPhone').value = sup.phone || ''; document.getElementById('supplierInput').dataset.supplierId = supId; document.getElementById('supplierSuggestions').classList.remove('show'); }
function useNewSupplier(name) { document.getElementById('supplierInput').value = name; document.getElementById('supplierInput').dataset.supplierId = ''; document.getElementById('supplierSuggestions').classList.remove('show'); document.getElementById('supplierPhone').focus(); }
function onPaymentChange() { const method = document.getElementById('paymentMethod').value; const dueDateWrap = document.getElementById('dueDateWrap'); const dueDateInput = document.getElementById('dueDate'); if (method === 'credit' || method === 'bank') { dueDateWrap.style.display = 'block'; const today = new Date(); today.setDate(today.getDate() + 7); dueDateInput.value = today.toISOString().split('T')[0]; } else { dueDateWrap.style.display = 'none'; dueDateInput.value = ''; } }

// ═══════ ITEM ROWS ═══════
function addItemRow() {
    if (allInventoryItems.length === 0) { alert('⚠️ Inventory items නෑ!'); return; }
    document.getElementById('noItemsMsg').style.display = 'none';
    const rowId = 'item-row-' + itemRowCounter; const container = document.getElementById('itemRowsList');
    const row = document.createElement('div'); row.className = 'item-row'; row.id = rowId;
    row.innerHTML = `<div class="item-search-wrap"><input type="text" class="item-search" placeholder="🔍 Search item..." oninput="searchItems('${rowId}')" onfocus="searchItems('${rowId}')" autocomplete="off"><input type="hidden" class="item-id"><div class="item-suggestions"></div></div><div class="item-unit-display" id="${rowId}-unit">-</div><input type="number" class="item-qty" placeholder="Qty" step="0.001" min="0" oninput="calculateRow('${rowId}')"><input type="number" class="item-total" placeholder="Total Rs." step="0.01" min="0" oninput="calculateRow('${rowId}')"><div class="item-perunit-display" id="${rowId}-perunit">Rs. 0</div><button class="btn-remove-row" onclick="removeItemRow('${rowId}')">✕</button>`;
    if (container.firstChild) container.insertBefore(row, container.firstChild); else container.appendChild(row);
    itemRowCounter++;
    setTimeout(() => { const itemsSection = document.querySelector('.items-section'); if (itemsSection) itemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => { row.querySelector('.item-search')?.focus({ preventScroll: true }); }, 400); }, 100);
}
function removeItemRow(rowId) { document.getElementById(rowId).remove(); if (document.getElementById('itemRowsList').children.length === 0) document.getElementById('noItemsMsg').style.display = 'block'; calculateGrandTotal(); }
function searchItems(rowId) {
    const row = document.getElementById(rowId); const input = row.querySelector('.item-search'); const suggestions = row.querySelector('.item-suggestions'); const query = input.value.trim().toLowerCase();
    let filtered; if (!query) filtered = allInventoryItems.slice(0, 8); else if (query.length < 2) { suggestions.classList.remove('show'); return; } else filtered = allInventoryItems.filter(i => i.itemName.toLowerCase().includes(query)).slice(0, 8);
    if (filtered.length === 0) { suggestions.innerHTML = '<div class="item-suggestion-item" style="color:#888;">No items found</div>'; suggestions.classList.add('show'); return; }
    let html = ''; filtered.forEach(item => { html += `<div class="item-suggestion-item" onclick="selectItem('${rowId}', '${item.id}')"><div class="it-name">📦 ${escapeHtml(item.itemName)}</div><div class="it-info">${escapeHtml(item.category || 'No category')} | Current: ${dispQty(item.currentStock)} ${escapeHtml(item.unit || '')} | Rs. ${(item.pricePerUnit || 0).toFixed(2)}/${escapeHtml(item.unit || '')}</div></div>`; });
    suggestions.innerHTML = html; suggestions.classList.add('show');
}
function selectItem(rowId, itemId) { const item = allInventoryItems.find(i => i.id === itemId); if (!item) return; const row = document.getElementById(rowId); row.querySelector('.item-search').value = item.itemName; row.querySelector('.item-id').value = itemId; document.getElementById(rowId + '-unit').textContent = item.unit; row.querySelector('.item-suggestions').classList.remove('show'); row.querySelector('.item-qty').focus(); }
function calculateRow(rowId) { const row = document.getElementById(rowId); const qty = parseFloat(row.querySelector('.item-qty').value) || 0; const total = parseFloat(row.querySelector('.item-total').value) || 0; const perUnit = qty > 0 ? total / qty : 0; document.getElementById(rowId + '-perunit').textContent = 'Rs. ' + perUnit.toFixed(2); calculateGrandTotal(); }
function calculateGrandTotal() { const rows = document.querySelectorAll('.item-row'); let total = 0, count = 0; rows.forEach(row => { const itemId = row.querySelector('.item-id').value; const rowTotal = parseFloat(row.querySelector('.item-total').value) || 0; if (itemId && rowTotal > 0) { total += rowTotal; count++; } }); document.getElementById('totalItemsCount').textContent = count; document.getElementById('grandTotal').textContent = fmt(total); }

// ═══════ SUBMIT PURCHASE ═══════
async function submitPurchase() {
    const date = document.getElementById('purchaseDate').value; const supplierName = document.getElementById('supplierInput').value.trim();
    const supplierPhone = document.getElementById('supplierPhone').value.trim(); const supplierId = document.getElementById('supplierInput').dataset.supplierId || '';
    const billNumber = document.getElementById('billNumber').value.trim(); const paymentMethod = document.getElementById('paymentMethod').value;
    const dueDate = document.getElementById('dueDate').value; const billPhotoUrl = uploadedPhotoUrl || document.getElementById('billPhotoUrl').value.trim();
    const notes = document.getElementById('purchaseNotes').value.trim();
    if (!date) { alert('⚠️ Date required!'); return; } if (!supplierName) { alert('⚠️ Supplier required!'); return; }
    if (!billNumber) { alert('⚠️ Bill number required!'); return; } if (!paymentMethod) { alert('⚠️ Payment method select කරන්න!'); return; }
    if ((paymentMethod === 'credit' || paymentMethod === 'bank') && !dueDate) { alert('⚠️ Due date required for Credit/Bank!'); return; }
    const items = []; const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => { const itemId = row.querySelector('.item-id').value; const qty = parseFloat(row.querySelector('.item-qty').value) || 0; const total = parseFloat(row.querySelector('.item-total').value) || 0; if (itemId && qty > 0 && total > 0) { const item = allInventoryItems.find(i => i.id === itemId); if (item) { items.push({ itemId, itemName: item.itemName, category: item.category || '', unit: item.unit, quantity: fmtQty(qty), totalCost: fmtQty(total), pricePerUnit: fmtQty(total / qty), previousPrice: item.pricePerUnit || 0 }); } } });
    if (items.length === 0) { alert('⚠️ අඩුම item එකක්වත් add කරන්න!'); return; }
    const billTotal = items.reduce((s, i) => s + i.totalCost, 0);
    if (!confirm(`📤 Submit?\n\n🏪 ${supplierName}\n📄 ${billNumber}\n📦 ${items.length} items\n💰 ${fmt(billTotal)}${billPhotoUrl ? '\n📸 Photo attached' : ''}`)) return;
    let finalSupplierId = supplierId;
    if (!finalSupplierId) {
        const existing = allSuppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
        if (existing) { finalSupplierId = existing.id; if (supplierPhone && supplierPhone !== existing.phone) { await db.collection('suppliers').doc(existing.id).update({ phone: supplierPhone, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); } }
        else { const newSup = await db.collection('suppliers').add({ name: supplierName, phone: supplierPhone || '', email: '', address: '', notes: '', totalPurchases: 0, totalValue: 0, lastPurchaseDate: null, firstPurchaseDate: null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), createdBy: currentUser.nickname }); finalSupplierId = newSup.id; await loadSuppliersData(); }
    } else if (supplierPhone) { const sup = allSuppliers.find(s => s.id === finalSupplierId); if (sup && supplierPhone !== sup.phone) { await db.collection('suppliers').doc(finalSupplierId).update({ phone: supplierPhone, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); } }
    const purchaseData = { date, supplierId: finalSupplierId, supplierName, supplierPhone, billNumber, paymentMethod, dueDate: dueDate || null, billPhotoUrl: billPhotoUrl || '', billPhotoPath: uploadedPhotoPath || '', items, itemsCount: items.length, billTotal: fmtQty(billTotal), notes, status: 'pending_approval', paymentStatus: paymentMethod === 'cash' ? 'paid' : 'unpaid', paidDate: paymentMethod === 'cash' ? date : null, paidNotes: '', approvedBy: null, approvedByName: null, approvedAt: null, approvalNotes: '', rejectedReason: '', stockUpdated: false, returnStatus: 'none', returnedValue: 0, hasReturns: false, paymentProofUrl: '', paymentProofPath: '', performedBy: currentUser.nickname, performedByName: currentUser.name, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    try { await db.collection('purchases').add(purchaseData); autoResetForm(); alert('✅ Submitted!\n\nReports DB එකේ Manager approval pending.'); showSection('pending', document.getElementById('tab-pending-btn')); } catch (e) { alert('❌ ' + e.message); console.error(e); }
}

function autoResetForm() {
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0]; document.getElementById('supplierInput').value = ''; document.getElementById('supplierInput').dataset.supplierId = '';
    document.getElementById('supplierPhone').value = ''; document.getElementById('billNumber').value = ''; document.getElementById('paymentMethod').value = '';
    document.getElementById('dueDate').value = ''; document.getElementById('dueDateWrap').style.display = 'none'; document.getElementById('billPhotoUrl').value = '';
    document.getElementById('billPhotoImg').src = ''; document.getElementById('photoPreviewBox').classList.remove('show'); document.getElementById('photoUploadSection').classList.remove('has-photo');
    document.getElementById('purchaseNotes').value = ''; document.getElementById('itemRowsList').innerHTML = ''; document.getElementById('noItemsMsg').style.display = 'block';
    itemRowCounter = 0; uploadedPhotoUrl = ''; uploadedPhotoPath = ''; calculateGrandTotal();
}
function resetForm() { if (!confirm('Reset form?')) return; autoResetForm(); }

// ═══════ BILL CARDS ═══════
function buildBillCard(p, statusClass, badgeText, messageType, messageContent, extraActions = '') {
    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank Transfer' };
    const itemsList = (p.items || []).map(i => `${i.itemName} (${dispQty(i.quantity)} ${i.unit})`).join(', ');
    let dueWarning = '';
    if (p.dueDate && p.paymentStatus === 'unpaid' && p.status === 'approved') { const today = new Date().toISOString().split('T')[0]; const isOverdue = p.dueDate < today; const isToday = p.dueDate === today; dueWarning = `<div class="bc-due-warning ${isOverdue ? 'overdue' : ''}">${isOverdue ? '🚨 OVERDUE' : isToday ? '⏰ Due TODAY' : '⏰ Due'}: ${p.dueDate}</div>`; }
    if (p.paymentStatus === 'paid' && p.status === 'approved') { dueWarning = `<div style="padding:10px 14px; background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); border-radius:8px; margin-top:10px; font-size:13px; color:#4CAF50;">✅ PAID${p.paidDate ? ` on ${p.paidDate}` : ''}${p.paidNotes ? `<br>📝 ${escapeHtml(p.paidNotes)}` : ''}${p.paymentProofUrl ? `<br><button onclick="openPhotoFullscreen('${p.paymentProofUrl}')" style="background:rgba(33,150,243,0.15); color:#2196F3; border:none; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:12px; margin-top:6px;">📸 View Payment Proof</button>` : ''}</div>`; }
    let returnChip = '';
    if (p.returnStatus === 'partially_returned') returnChip = `<div style="margin-top:8px; font-size:12px; color:#9C27B0;">🔄 Partially Returned | Value: ${fmt(p.returnedValue || 0)}</div>`;
    if (p.returnStatus === 'fully_returned') returnChip = `<div style="margin-top:8px; font-size:12px; color:#9C27B0; font-weight:700;">🔄 Fully Returned | Value: ${fmt(p.returnedValue || 0)}</div>`;
    const photoBtn = p.billPhotoUrl ? `<button class="bc-btn view" onclick="openPhotoFullscreen('${p.billPhotoUrl}')">📸 View Photo</button>` : '';
    return `<div class="bill-card ${statusClass}"><div class="bc-header"><div class="bc-left"><span class="bc-bill-num">📄 ${escapeHtml(p.billNumber)}</span><span class="bc-date">📅 ${escapeHtml(p.date)}</span><span class="bc-payment-badge ${p.paymentMethod}">${paymentIcons[p.paymentMethod] || p.paymentMethod}</span></div><span class="bc-status-badge ${statusClass}">${badgeText}</span></div><div class="bc-supplier">🏪 ${escapeHtml(p.supplierName)}${p.supplierPhone ? ` <span style="color:#888; font-size:13px;">📞 ${escapeHtml(p.supplierPhone)}</span>` : ''}</div><div class="bc-stats"><div class="bc-stat"><div class="bs-value">${p.itemsCount || 0}</div><div class="bs-label">Items</div></div><div class="bc-stat"><div class="bs-value" style="color:#FF9800;">Rs.${(p.billTotal || 0).toLocaleString('en-LK')}</div><div class="bs-label">Bill Total</div></div>${p.stockUpdated ? `<div class="bc-stat"><div class="bs-value green">✅</div><div class="bs-label">Stock In</div></div>` : ''}${p.billPhotoUrl ? `<div class="bc-stat"><div class="bs-value" style="color:#2196F3;">📸</div><div class="bs-label">Photo</div></div>` : ''}</div><div style="font-size:12px; color:#aaa; padding:8px 0; border-top:1px solid rgba(255,255,255,0.05); margin-top:8px;"><strong>📦 Items:</strong> ${escapeHtml(itemsList)}</div>${p.notes ? `<div style="font-size:12px; color:#888; margin-top:4px;">📝 ${escapeHtml(p.notes)}</div>` : ''}${returnChip}${dueWarning}<div class="bc-message ${messageType}">${messageContent}</div><div class="bc-actions"><button class="bc-btn view" onclick="viewBillDetails('${p.id}')">👁️ View Details</button>${photoBtn}${extraActions}</div><div style="font-size:11px; color:#666; margin-top:6px;">👤 ${escapeHtml(p.performedByName || '-')} | 🕐 ${formatTimestamp(p.createdAt)}</div></div>`;
}

function renderPendingBills() { const list = document.getElementById('pendingBillsList'); if (!list) return; const pending = allPurchases.filter(p => p.status === 'pending_approval'); if (pending.length === 0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">✅ No pending bills!</div>'; return; } let html = ''; pending.forEach(p => { const msg = `<strong>⏳ Waiting for Manager Approval</strong>Reports Database එකේ review වෙනවා.`; const extraBtn = isManagerUser() ? `<button class="bc-btn view" onclick="window.location.href='reports.html#pendingapprovals'">📊 Review in Reports</button>` : ''; html += buildBillCard(p, 'pending', '⏳ Pending', 'approve', msg, extraBtn); }); list.innerHTML = html; }
function renderApprovedBills() { const list = document.getElementById('approvedBillsList'); if (!list) return; const approved = allPurchases.filter(p => p.status === 'approved'); if (approved.length === 0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No approved bills.</div>'; return; } let html = ''; approved.forEach(p => { const msg = `<strong>✅ Approved by ${escapeHtml(p.approvedByName || 'Manager')}</strong>${p.approvalNotes ? `📝 ${escapeHtml(p.approvalNotes)}` : ''}<br>📅 ${formatTimestamp(p.approvedAt)}${p.stockUpdated ? '<br>✅ Inventory stock updated.' : ''}`; html += buildBillCard(p, 'approved', '✅ Approved', 'approve', msg); }); list.innerHTML = html; }
function renderRejectedBills() { const list = document.getElementById('rejectedBillsList'); if (!list) return; const rejected = allPurchases.filter(p => p.status === 'rejected'); if (rejected.length === 0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">🎉 No rejected bills!</div>'; return; } let html = ''; rejected.forEach(p => { const msg = `<strong>❌ Rejected by ${escapeHtml(p.approvedByName || 'Manager')}</strong>📝 <strong>Reason:</strong> ${escapeHtml(p.rejectedReason || 'No reason')}<br>🔄 Edit & resubmit කරන්න!`; const extraBtn = `<button class="bc-btn recount" onclick="loadRejectedForRecount('${p.id}')">🔄 Edit & Resubmit</button>`; html += buildBillCard(p, 'rejected', '❌ Rejected', 'reject', msg, extraBtn); }); list.innerHTML = html; }

function loadRejectedForRecount(billId) {
    const p = allPurchases.find(x => x.id === billId); if (!p) return; if (!confirm('🔄 Load rejected bill?')) return;
    showSection('new', document.getElementById('tab-new-btn'));
    setTimeout(() => {
        document.getElementById('purchaseDate').value = p.date; document.getElementById('supplierInput').value = p.supplierName;
        document.getElementById('supplierInput').dataset.supplierId = p.supplierId || ''; document.getElementById('supplierPhone').value = p.supplierPhone || '';
        document.getElementById('billNumber').value = p.billNumber + '-R'; document.getElementById('paymentMethod').value = p.paymentMethod; onPaymentChange();
        if (p.dueDate) document.getElementById('dueDate').value = p.dueDate;
        if (p.billPhotoUrl) { document.getElementById('billPhotoUrl').value = p.billPhotoUrl; uploadedPhotoUrl = p.billPhotoUrl; uploadedPhotoPath = p.billPhotoPath || ''; previewBillPhoto(); }
        document.getElementById('purchaseNotes').value = (p.notes || '') + '\n\n[Resubmitted from rejected]';
        document.getElementById('itemRowsList').innerHTML = ''; document.getElementById('noItemsMsg').style.display = 'none'; itemRowCounter = 0;
        (p.items || []).forEach(item => { addItemRow(); const rowId = 'item-row-' + (itemRowCounter - 1); const row = document.getElementById(rowId); row.querySelector('.item-search').value = item.itemName; row.querySelector('.item-id').value = item.itemId; document.getElementById(rowId + '-unit').textContent = item.unit; row.querySelector('.item-qty').value = item.quantity; row.querySelector('.item-total').value = item.totalCost; calculateRow(rowId); });
        alert('✅ Loaded! Edit & submit.');
    }, 200);
}

// ═══════ CREDIT TRACKING ═══════
function getOverdueBills() { const today = new Date().toISOString().split('T')[0]; return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate && p.dueDate < today && getNetPayable(p) > 0); }
function getDueTodayBills() { const today = new Date().toISOString().split('T')[0]; return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate === today && getNetPayable(p) > 0); }
function getUpcomingBills() { const today = new Date(); const todayStr = today.toISOString().split('T')[0]; const sevenDays = new Date(); sevenDays.setDate(today.getDate() + 7); const sevenStr = sevenDays.toISOString().split('T')[0]; return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && p.dueDate && p.dueDate > todayStr && p.dueDate <= sevenStr && getNetPayable(p) > 0); }
function getAllUnpaidBills() { return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'unpaid' && getNetPayable(p) > 0); }
function getPaidBills() { return allPurchases.filter(p => p.status === 'approved' && p.paymentStatus === 'paid' && p.paymentMethod !== 'cash'); }

function updateCreditBadges() {
    const overdue = getOverdueBills(); const today = getDueTodayBills(); const upcoming = getUpcomingBills(); const allUnpaid = getAllUnpaidBills(); const paid = getPaidBills();
    const oc = document.getElementById('creditOverdueCount'); const tc = document.getElementById('creditDueTodayCount'); const uc = document.getElementById('creditUpcomingCount'); const ut = document.getElementById('creditTotalUnpaid');
    if (oc) oc.textContent = overdue.length; if (tc) tc.textContent = today.length; if (uc) uc.textContent = upcoming.length;
    const totalUnpaid = allUnpaid.reduce((s, p) => s + getNetPayable(p), 0);
    if (ut) ut.textContent = 'Rs. ' + totalUnpaid.toLocaleString('en-LK', { maximumFractionDigits: 0 });
    const setBadge = (id, count) => { const el = document.getElementById(id); if (!el) return; el.textContent = count; el.style.display = count > 0 ? 'inline-block' : 'none'; };
    setBadge('ctOverdueBadge', overdue.length); setBadge('ctTodayBadge', today.length); setBadge('ctUpcomingBadge', upcoming.length); setBadge('ctAllUnpaidBadge', allUnpaid.length); setBadge('ctPaidBadge', paid.length);
}
function showCreditTab(name, btnEl) { currentCreditTab = name; document.querySelectorAll('#section-credit > .nav-tabs > .nav-tab').forEach(t => t.classList.remove('active')); if (btnEl) btnEl.classList.add('active'); renderCreditTab(); }
function renderCreditTab() {
    const list = document.getElementById('creditBillsList'); if (!list) return;
    let bills = [], emptyMsg = '', cardType = '';
    if (currentCreditTab === 'overdue') { bills = getOverdueBills(); emptyMsg = '🎉 No overdue payments!'; cardType = 'overdue'; }
    else if (currentCreditTab === 'today') { bills = getDueTodayBills(); emptyMsg = '✅ Nothing due today!'; cardType = 'today'; }
    else if (currentCreditTab === 'upcoming') { bills = getUpcomingBills(); emptyMsg = '📭 No upcoming bills.'; cardType = 'upcoming'; }
    else if (currentCreditTab === 'all-unpaid') { bills = getAllUnpaidBills(); emptyMsg = '🎉 All paid!'; cardType = 'unpaid'; }
    else if (currentCreditTab === 'paid') { bills = getPaidBills(); emptyMsg = '📭 No paid bills.'; cardType = 'paid'; }
    if (bills.length === 0) { list.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">${emptyMsg}</div>`; return; }
    bills.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank Transfer' }; let html = '';
    bills.forEach(p => {
        const today = new Date().toISOString().split('T')[0]; let dueLabel = '', dueColor = '';
        if (p.dueDate) { if (p.dueDate < today) { const daysOverdue = Math.floor((new Date(today) - new Date(p.dueDate)) / (1000*60*60*24)); dueLabel = `🚨 OVERDUE by ${daysOverdue} day${daysOverdue>1?'s':''}`; dueColor = '#ff4444'; } else if (p.dueDate === today) { dueLabel = '⏰ DUE TODAY'; dueColor = '#f0a500'; } else { const daysLeft = Math.floor((new Date(p.dueDate) - new Date(today)) / (1000*60*60*24)); dueLabel = `⏳ ${daysLeft} day${daysLeft>1?'s':''} left`; dueColor = '#2196F3'; } }
        const isPaid = p.paymentStatus === 'paid'; const billTotal = p.billTotal || 0; const returnedValue = p.returnedValue || 0; const netPayable = getNetPayable(p); const hasReturns = returnedValue > 0;
        let amountDisplay = '';
        if (hasReturns && !isPaid) { amountDisplay = `<div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:12px; margin-top:10px;"><div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;"><span style="color:#aaa;">💰 Original Bill:</span><span style="color:#e0e0e0;">Rs. ${billTotal.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;"><span style="color:#9C27B0;">🔄 Returned:</span><span style="color:#9C27B0; font-weight:600;">- Rs. ${returnedValue.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:8px 0 4px; font-size:15px; border-top:1px solid rgba(255,255,255,0.1); margin-top:6px;"><span style="color:#4CAF50; font-weight:700;">💵 NET PAYABLE:</span><span style="color:#4CAF50; font-weight:700; font-size:17px;">Rs. ${netPayable.toLocaleString('en-LK')}</span></div></div>`; }
        html += `<div class="bill-card ${isPaid ? 'approved' : 'rejected'}" style="border-left-color:${isPaid ? '#4CAF50' : (cardType==='overdue'?'#ff4444':cardType==='today'?'#f0a500':'#FF9800')};"><div class="bc-header"><div class="bc-left"><span class="bc-bill-num">📄 ${escapeHtml(p.billNumber)}</span><span class="bc-date">📅 ${escapeHtml(p.date)}</span><span class="bc-payment-badge ${p.paymentMethod}">${paymentIcons[p.paymentMethod]||p.paymentMethod}</span>${hasReturns?`<span style="background:rgba(156,39,176,0.15); color:#9C27B0; padding:3px 10px; border-radius:8px; font-size:11px; font-weight:700;">🔄 ${p.returnStatus==='fully_returned'?'FULLY':'PARTIALLY'} RETURNED</span>`:''}</div>${dueLabel?`<span style="color:${dueColor}; font-weight:700; font-size:13px;">${dueLabel}</span>`:''}</div><div class="bc-supplier">🏪 ${escapeHtml(p.supplierName)}${p.supplierPhone?` <span style="color:#888; font-size:13px;">📞 ${escapeHtml(p.supplierPhone)}</span>`:''}</div><div class="bc-stats"><div class="bc-stat"><div class="bs-value">${p.itemsCount||0}</div><div class="bs-label">Items</div></div><div class="bc-stat"><div class="bs-value" style="color:#FF9800;">Rs.${billTotal.toLocaleString('en-LK')}</div><div class="bs-label">Bill Total</div></div>${p.dueDate?`<div class="bc-stat"><div class="bs-value" style="color:${dueColor};">${escapeHtml(p.dueDate)}</div><div class="bs-label">Due Date</div></div>`:''}</div>${amountDisplay}${isPaid&&p.paidDate?`<div style="padding:10px 14px; background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); border-radius:8px; margin-top:10px; font-size:13px; color:#4CAF50;">✅ PAID on ${escapeHtml(p.paidDate)} - Rs. ${(p.paidAmount||netPayable).toLocaleString('en-LK')}${p.paidNotes?`<br>📝 ${escapeHtml(p.paidNotes)}`:''}${p.paymentProofUrl?`<br><button onclick="openPhotoFullscreen('${p.paymentProofUrl}')" style="background:rgba(33,150,243,0.15); color:#2196F3; border:none; padding:4px 12px; border-radius:6px; cursor:pointer; font-size:12px; margin-top:6px;">📸 View Payment Proof</button>`:''}</div>`:''}<div class="bc-actions"><button class="bc-btn view" onclick="viewBillDetails('${p.id}')">👁️ View</button>${p.billPhotoUrl?`<button class="bc-btn view" onclick="openPhotoFullscreen('${p.billPhotoUrl}')">📸 Photo</button>`:''}${!isPaid&&isManagerUser()?`<button class="bc-btn" style="background:#4CAF50; color:white;" onclick="openMarkPaidModal('${p.id}')">💰 Mark Paid (Rs. ${netPayable.toLocaleString('en-LK')})</button>`:''}${isPaid&&isManagerUser()?`<button class="bc-btn" style="background:rgba(240,165,0,0.15); color:#f0a500;" onclick="markUnpaid('${p.id}')">🔄 Mark Unpaid</button>`:''}</div></div>`;
    });
    list.innerHTML = html;
}
// ═══════ MARK PAID MODAL ⭐ UPDATED with Payment Proof! ═══════
function openMarkPaidModal(billId) {
    const p = allPurchases.find(x => x.id === billId); if (!p) return;
    markPaidBillId = billId;
    const billTotal = p.billTotal || 0; const returnedValue = p.returnedValue || 0; const netPayable = getNetPayable(p); const hasReturns = returnedValue > 0;
    let bodyHtml = `<div style="background:#0f3460; padding:14px; border-radius:8px;"><div style="font-size:14px; color:#FF9800; font-weight:700; margin-bottom:8px;">🏪 ${escapeHtml(p.supplierName)}</div><div style="font-size:13px; color:#aaa;">📄 ${escapeHtml(p.billNumber)}</div>`;
    if (hasReturns) { bodyHtml += `<div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1);"><div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span style="color:#aaa;">💰 Bill Total:</span><span>Rs. ${billTotal.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span style="color:#9C27B0;">🔄 Returned:</span><span style="color:#9C27B0;">- Rs. ${returnedValue.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:6px 0; font-size:16px; border-top:1px solid rgba(255,255,255,0.1); margin-top:4px; font-weight:700;"><span style="color:#4CAF50;">💵 NET PAYABLE:</span><span style="color:#4CAF50;">Rs. ${netPayable.toLocaleString('en-LK')}</span></div></div>`; }
    else { bodyHtml += `<div style="font-size:18px; color:#4CAF50; font-weight:700; margin-top:8px;">💰 Rs. ${netPayable.toLocaleString('en-LK')}</div>`; }
    bodyHtml += `</div>`;
    document.getElementById('markPaidBody').innerHTML = bodyHtml;
    document.getElementById('paidDateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('paidNotesInput').value = '';
    // ⭐ Reset payment proof
    paymentProofPhotoUrl = ''; paymentProofPhotoPath = '';
    document.getElementById('paymentProofUrl').value = '';
    document.getElementById('paymentProofImg').src = '';
    document.getElementById('paymentProofPreview').style.display = 'none';
    document.getElementById('paymentProofProgress').style.display = 'none';
    document.getElementById('markPaidModal').style.display = 'flex';
}
function closeMarkPaidModal() { document.getElementById('markPaidModal').style.display = 'none'; }

// ⭐ UPDATED: confirmMarkPaid with Payment Proof!
async function confirmMarkPaid() {
    const paidDate = document.getElementById('paidDateInput').value;
    const paidNotes = document.getElementById('paidNotesInput').value.trim();
    if (!paidDate) { alert('⚠️ Payment date!'); return; }
    const p = allPurchases.find(x => x.id === markPaidBillId);
    const netPayable = p ? getNetPayable(p) : 0;
    const proofUrl = paymentProofPhotoUrl || document.getElementById('paymentProofUrl').value.trim();
    try {
        await db.collection('purchases').doc(markPaidBillId).update({
            paymentStatus: 'paid', paidDate, paidNotes,
            paidAmount: fmtQty(netPayable),
            paidBy: currentUser.nickname, paidByName: currentUser.name,
            paidAt: firebase.firestore.FieldValue.serverTimestamp(),
            paymentProofUrl: proofUrl || '',
            paymentProofPath: paymentProofPhotoPath || ''
        });
        alert(`✅ Marked as Paid!\n\n💰 Amount: Rs. ${netPayable.toLocaleString('en-LK')}${proofUrl ? '\n📸 Payment proof attached!' : ''}`);
        closeMarkPaidModal();
    } catch (e) { alert('❌ ' + e.message); }
}

async function markUnpaid(billId) {
    if (!confirm('🔄 Mark as UNPAID?')) return;
    try { await db.collection('purchases').doc(billId).update({ paymentStatus: 'unpaid', paidDate: null, paidNotes: '', paidAmount: 0, paidBy: null, paidByName: null, paidAt: null, paymentProofUrl: '', paymentProofPath: '' }); alert('✅ Marked as Unpaid!'); } catch (e) { alert('❌ ' + e.message); }
}

// ═══════ BILL DETAILS ═══════
function viewBillDetails(billId) {
    const p = allPurchases.find(x => x.id === billId); if (!p) return;
    document.getElementById('billDetailTitle').textContent = `📄 Bill: ${p.billNumber}`;
    let itemsHtml = `<table style="width:100%; border-collapse:collapse; font-size:13px;"><thead><tr style="background:rgba(255,152,0,0.1);"><th style="padding:10px; text-align:left; color:#FF9800;">Item</th><th style="padding:10px; color:#FF9800;">Qty</th><th style="padding:10px; color:#FF9800;">Per Unit</th><th style="padding:10px; color:#FF9800;">Total</th></tr></thead><tbody>`;
    (p.items || []).forEach(item => { itemsHtml += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:10px;"><strong>${escapeHtml(item.itemName)}</strong></td><td style="padding:10px; text-align:center;">${dispQty(item.quantity)} ${escapeHtml(item.unit || '')}</td><td style="padding:10px; text-align:center; color:#FF9800;">Rs. ${(item.pricePerUnit || 0).toFixed(2)}</td><td style="padding:10px; text-align:right; color:#FF9800; font-weight:700;">Rs. ${(item.totalCost || 0).toLocaleString('en-LK')}</td></tr>`; });
    itemsHtml += `<tr style="background:rgba(255,152,0,0.08); font-weight:700;"><td colspan="3" style="padding:12px; text-align:right; color:#FF9800;">GRAND TOTAL:</td><td style="padding:12px; text-align:right; color:#FF9800; font-size:16px;">Rs. ${(p.billTotal || 0).toLocaleString('en-LK')}</td></tr></tbody></table>`;
    const paymentIcons = { cash: '💵 Cash', credit: '📋 Credit', bank: '🏦 Bank Transfer' };
    const billTotal = p.billTotal || 0; const returnedValue = p.returnedValue || 0; const netPayable = getNetPayable(p); const hasReturns = returnedValue > 0;
    let netSection = '';
    if (hasReturns) { netSection = `<div style="background:rgba(76,175,80,0.08); border:1px solid rgba(76,175,80,0.3); padding:14px; border-radius:8px; margin-bottom:14px;"><div style="font-size:14px; color:#4CAF50; font-weight:700; margin-bottom:10px;">💰 Payment Calculation:</div><div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;"><span style="color:#aaa;">Original Bill Total:</span><span style="color:#e0e0e0;">Rs. ${billTotal.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;"><span style="color:#9C27B0;">🔄 Returned Value:</span><span style="color:#9C27B0;">- Rs. ${returnedValue.toLocaleString('en-LK')}</span></div><div style="display:flex; justify-content:space-between; padding:8px 0 4px; font-size:16px; border-top:1px solid rgba(76,175,80,0.3); margin-top:6px; font-weight:700;"><span style="color:#4CAF50;">💵 NET PAYABLE:</span><span style="color:#4CAF50;">Rs. ${netPayable.toLocaleString('en-LK')}</span></div></div>`; }
    // ⭐ Payment proof in details
    let proofSection = '';
    if (p.paymentProofUrl) { proofSection = `<div style="margin-bottom:14px; text-align:center;"><div style="font-size:13px; color:#4CAF50; font-weight:600; margin-bottom:8px;">📸 Payment Proof:</div><img src="${p.paymentProofUrl}" style="max-width:300px; max-height:300px; border-radius:8px; cursor:pointer; border:2px solid rgba(76,175,80,0.3);" onclick="openPhotoFullscreen('${p.paymentProofUrl}')"><div style="font-size:11px; color:#888; margin-top:6px;">📸 Click to view full size</div></div>`; }
    document.getElementById('billDetailBody').innerHTML = `<div style="background:#0f3460; padding:14px; border-radius:8px; margin-bottom:14px;"><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px;"><div><strong style="color:#FF9800;">📅 Date:</strong> ${escapeHtml(p.date || '-')}</div><div><strong style="color:#FF9800;">🏪 Supplier:</strong> ${escapeHtml(p.supplierName || '-')}</div><div><strong style="color:#FF9800;">📞 Phone:</strong> ${escapeHtml(p.supplierPhone || 'N/A')}</div><div><strong style="color:#FF9800;">📄 Bill #:</strong> ${escapeHtml(p.billNumber || '-')}</div><div><strong style="color:#FF9800;">💳 Payment:</strong> ${paymentIcons[p.paymentMethod] || p.paymentMethod}</div>${p.dueDate ? `<div><strong style="color:#FF9800;">📅 Due:</strong> ${escapeHtml(p.dueDate)}</div>` : ''}${p.returnStatus && p.returnStatus !== 'none' ? `<div><strong style="color:#9C27B0;">🔄 Return Status:</strong> ${escapeHtml(p.returnStatus)}</div>` : ''}${p.returnedValue ? `<div><strong style="color:#9C27B0;">💰 Returned Value:</strong> ${fmt(p.returnedValue)}</div>` : ''}</div></div>${netSection}${p.billPhotoUrl ? `<div style="margin-bottom:14px; text-align:center;"><div style="font-size:13px; color:#2196F3; font-weight:600; margin-bottom:8px;">📸 Bill Photo:</div><img src="${p.billPhotoUrl}" style="max-width:300px; max-height:300px; border-radius:8px; cursor:pointer; border:2px solid rgba(255,152,0,0.3);" onclick="openPhotoFullscreen('${p.billPhotoUrl}')"><div style="font-size:11px; color:#888; margin-top:6px;">📸 Click to view full size</div></div>` : ''}${proofSection}<div style="background:#0f3460; padding:14px; border-radius:8px; overflow-x:auto;">${itemsHtml}</div>${p.notes ? `<div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; margin-top:12px; font-size:13px; color:#ccc;">📝 ${escapeHtml(p.notes)}</div>` : ''}<div style="font-size:11px; color:#666; margin-top:14px;">👤 ${escapeHtml(p.performedByName || '-')} | 🕐 ${formatTimestamp(p.createdAt)}${p.approvedAt ? `<br>✅ ${p.status === 'approved' ? 'Approved' : 'Rejected'}: ${escapeHtml(p.approvedByName || '-')} | 🕐 ${formatTimestamp(p.approvedAt)}` : ''}${p.paidAt ? `<br>💰 Paid: ${escapeHtml(p.paidByName || '-')} | 🕐 ${formatTimestamp(p.paidAt)} | Amount: Rs. ${(p.paidAmount || 0).toLocaleString('en-LK')}` : ''}</div>`;
    document.getElementById('billDetailModal').style.display = 'flex';
}
function closeBillDetailModal() { document.getElementById('billDetailModal').style.display = 'none'; }

// ═══════ PURCHASE RETURNS ═══════
function updateReturnStats() { const total = allPurchaseReturns.length; const pending = allPurchaseReturns.filter(r => r.status === 'pending_return').length; const approved = allPurchaseReturns.filter(r => r.status === 'approved').length; const approvedValue = allPurchaseReturns.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.returnTotal || 0), 0); const totalEl = document.getElementById('ret-stat-total'); const pendingEl = document.getElementById('ret-stat-pending'); const approvedEl = document.getElementById('ret-stat-approved'); const valueEl = document.getElementById('ret-stat-value'); if (totalEl) totalEl.textContent = total; if (pendingEl) pendingEl.textContent = pending; if (approvedEl) approvedEl.textContent = approved; if (valueEl) valueEl.textContent = formatSupCurrency(approvedValue); }
function updateReturnBadges() { const pending = allPurchaseReturns.filter(r => r.status === 'pending_return').length; const mainBadge = document.getElementById('returnsBadge'); if (mainBadge) { mainBadge.textContent = pending; mainBadge.style.display = pending > 0 ? 'inline-block' : 'none'; } const subBadge = document.getElementById('retPendingBadge'); if (subBadge) { subBadge.textContent = pending; subBadge.style.display = pending > 0 ? 'inline-block' : 'none'; } }
function renderReturnsDashboard() { updateReturnStats(); updateReturnBadges(); if (currentReturnSubTab === 'pending-returns') renderPendingReturns(); if (currentReturnSubTab === 'approved-returns') renderApprovedReturns(); if (currentReturnSubTab === 'rejected-returns') renderRejectedReturns(); if (currentReturnSubTab === 'all-returns') renderAllReturns(); }
function showReturnSubTab(name, btnEl = null) { currentReturnSubTab = name; document.querySelectorAll('#section-returns .nav-tabs .nav-tab').forEach(t => t.classList.remove('active')); if (btnEl) btnEl.classList.add('active'); else { const autoBtnMap = { 'new-return': 'ret-new-btn', 'pending-returns': 'ret-pending-btn', 'approved-returns': 'ret-approved-btn', 'rejected-returns': 'ret-rejected-btn', 'all-returns': 'ret-all-btn' }; const autoBtn = document.getElementById(autoBtnMap[name]); if (autoBtn) autoBtn.classList.add('active'); } document.querySelectorAll('.return-sub-section').forEach(sec => { sec.style.display = 'none'; }); const target = document.getElementById('sub-' + name); if (target) target.style.display = 'block'; if (name === 'pending-returns') renderPendingReturns(); if (name === 'approved-returns') renderApprovedReturns(); if (name === 'rejected-returns') renderRejectedReturns(); if (name === 'all-returns') renderAllReturns(); }
function getReturnUsedQtyMap(purchaseId, excludeReturnId = '') { const map = {}; allPurchaseReturns.filter(r => r.originalPurchaseId === purchaseId && r.status !== 'rejected' && r.id !== excludeReturnId).forEach(r => { (r.items || []).forEach(item => { map[item.itemId] = fmtQty((map[item.itemId] || 0) + (item.returnQuantity || 0)); }); }); return map; }
function getAvailableReturnItemsForBill(purchase, excludeReturnId = '') { const usedMap = getReturnUsedQtyMap(purchase.id, excludeReturnId); return (purchase.items || []).map(item => { const alreadyReturned = usedMap[item.itemId] || 0; const remainingQty = fmtQty((item.quantity || 0) - alreadyReturned); return { ...item, alreadyReturned, remainingQty }; }).filter(item => item.remainingQty > 0); }
function searchBillsForReturn() { const results = document.getElementById('returnBillResults'); if (!results) return; const query = document.getElementById('returnBillSearch').value.trim().toLowerCase(); const dateFilter = document.getElementById('returnBillDateFilter').value; let bills = allPurchases.filter(p => p.status === 'approved'); if (query) bills = bills.filter(p => (p.billNumber||'').toLowerCase().includes(query) || (p.supplierName||'').toLowerCase().includes(query)); if (dateFilter) bills = bills.filter(p => p.date === dateFilter); bills = bills.filter(p => getAvailableReturnItemsForBill(p, editingReturnId).length > 0); bills = bills.slice(0, 20); if (bills.length === 0) { results.innerHTML = `<div style="padding:14px; color:#888; text-align:center;">📭 No approved bills found.</div>`; return; } let html = ''; bills.forEach(p => { const availableItems = getAvailableReturnItemsForBill(p, editingReturnId); const availableQtyText = availableItems.map(i => `${i.itemName}: ${dispQty(i.remainingQty)} ${i.unit}`).slice(0, 2).join(' | '); html += `<div class="bill-search-item ${selectedReturnBill?.id === p.id ? 'selected' : ''}" onclick="selectReturnBill('${p.id}')"><div class="bsi-left"><div class="bsi-bill-num">📄 ${escapeHtml(p.billNumber)}</div><div class="bsi-supplier">🏪 ${escapeHtml(p.supplierName)}</div><div class="bsi-date">📅 ${escapeHtml(p.date)} ${availableQtyText ? `| 📦 ${escapeHtml(availableQtyText)}` : ''}</div></div><div class="bsi-right"><div class="bsi-total">Rs. ${(p.billTotal||0).toLocaleString('en-LK')}</div><div class="bsi-items-count">${availableItems.length} returnable</div></div></div>`; }); results.innerHTML = html; }
function selectReturnBill(billId) { const bill = allPurchases.find(p => p.id === billId); if (!bill) return; selectedReturnBill = bill; const preview = document.getElementById('selectedBillPreview'); document.getElementById('sbpTitle').textContent = `📄 Selected Bill: ${bill.billNumber}`; document.getElementById('sbpInfo').innerHTML = `<div class="sbp-info-item"><div class="sbp-info-label">Supplier</div><div class="sbp-info-value">🏪 ${escapeHtml(bill.supplierName)}</div></div><div class="sbp-info-item"><div class="sbp-info-label">Purchase Date</div><div class="sbp-info-value">📅 ${escapeHtml(bill.date)}</div></div><div class="sbp-info-item"><div class="sbp-info-label">Bill Total</div><div class="sbp-info-value">💰 ${fmt(bill.billTotal || 0)}</div></div><div class="sbp-info-item"><div class="sbp-info-label">Items</div><div class="sbp-info-value">📦 ${bill.itemsCount || 0}</div></div>`; preview.classList.add('show'); document.getElementById('returnStep2').style.display = 'block'; renderReturnItemsForSelectedBill(); document.getElementById('returnStep2').scrollIntoView({ behavior: 'smooth', block: 'start' }); searchBillsForReturn(); }
function changeSelectedBill() { if (!confirm('🔄 Change selected bill?')) return; selectedReturnBill = null; editingReturnId = ''; selectedReturnReason = ''; resetReturnForm(true); searchBillsForReturn(); }
function renderReturnItemsForSelectedBill(existingItems = null) { if (!selectedReturnBill) return; const container = document.getElementById('returnItemsList'); const availableItems = getAvailableReturnItemsForBill(selectedReturnBill, editingReturnId); if (availableItems.length === 0) { container.innerHTML = `<div style="padding:14px; color:#888; text-align:center;">✅ No returnable items.</div>`; return; } const existingMap = {}; if (existingItems && Array.isArray(existingItems)) existingItems.forEach(item => { existingMap[item.itemId] = item; }); let html = ''; availableItems.forEach((item, index) => { const selectedItem = existingMap[item.itemId]; const isChecked = !!selectedItem; const preQty = selectedItem ? selectedItem.returnQuantity : ''; const pricePerUnit = item.pricePerUnit || ((item.totalCost||0)/(item.quantity||1)); const preCost = selectedItem ? selectedItem.returnCost : 0; html += `<div class="return-item-row ${isChecked?'selected':''}" id="ret-row-${index}" data-item-id="${item.itemId}" data-item-name="${escapeHtml(item.itemName)}" data-unit="${escapeHtml(item.unit||'')}" data-original-qty="${item.quantity||0}" data-remaining-qty="${item.remainingQty||0}" data-price-per-unit="${pricePerUnit||0}" data-total-cost="${item.totalCost||0}"><div class="rir-top"><input type="checkbox" class="rir-checkbox" id="ret-check-${index}" ${isChecked?'checked':''} onchange="toggleReturnItem(${index})"><div><div class="rir-item-name">📦 ${escapeHtml(item.itemName)}</div><div class="rir-item-info">Original: ${dispQty(item.quantity)} ${escapeHtml(item.unit||'')}${item.alreadyReturned>0?` | Already: ${dispQty(item.alreadyReturned)}`:''} | Available: ${dispQty(item.remainingQty)} ${escapeHtml(item.unit||'')}</div></div><div class="rir-original"><div class="rir-original-qty">${dispQty(item.remainingQty)} ${escapeHtml(item.unit||'')}</div></div></div><div class="rir-bottom ${isChecked?'show':''}" id="ret-bottom-${index}"><div><div class="rir-label">Return Qty (Max: ${dispQty(item.remainingQty)})</div><input type="number" class="rir-qty-input" id="ret-qty-${index}" value="${preQty}" min="0.001" max="${item.remainingQty}" step="0.001" oninput="updateReturnItemQty(${index})" placeholder="Qty"></div><div><div class="rir-label">Per Unit</div><div class="rir-return-cost">Rs. ${Number(pricePerUnit||0).toFixed(2)}</div></div><div><div class="rir-label">Return Cost</div><div class="rir-return-cost" id="ret-cost-${index}">Rs. ${formatNumber(preCost||0)}</div></div></div></div>`; }); container.innerHTML = html; updateReturnSummary(); }
function toggleReturnItem(index) { const check = document.getElementById(`ret-check-${index}`); const row = document.getElementById(`ret-row-${index}`); const bottom = document.getElementById(`ret-bottom-${index}`); const qtyInput = document.getElementById(`ret-qty-${index}`); if (!check||!row||!bottom||!qtyInput) return; if (check.checked) { row.classList.add('selected'); bottom.classList.add('show'); if (!qtyInput.value) { const max = parseFloat(row.dataset.remainingQty)||0; qtyInput.value = max>0?max:''; } setTimeout(() => qtyInput.focus(), 80); } else { row.classList.remove('selected'); bottom.classList.remove('show'); qtyInput.value = ''; const costEl = document.getElementById(`ret-cost-${index}`); if (costEl) costEl.textContent = 'Rs. 0'; } updateReturnItemQty(index); updateReturnSummary(); }
function updateReturnItemQty(index) { const row = document.getElementById(`ret-row-${index}`); const qtyInput = document.getElementById(`ret-qty-${index}`); const costEl = document.getElementById(`ret-cost-${index}`); const check = document.getElementById(`ret-check-${index}`); if (!row||!qtyInput||!costEl||!check) return; let qty = parseFloat(qtyInput.value)||0; const max = parseFloat(row.dataset.remainingQty)||0; const pricePerUnit = parseFloat(row.dataset.pricePerUnit)||0; if (qty>max) { qty=max; qtyInput.value=max; } if (qty<0) { qty=0; qtyInput.value=''; } if (check.checked && qty<=0) costEl.textContent = 'Rs. 0'; else { const cost = fmtQty(qty*pricePerUnit); costEl.textContent = 'Rs. ' + Number(cost).toLocaleString('en-LK', {minimumFractionDigits:2, maximumFractionDigits:2}); } updateReturnSummary(); }
function selectReason(reasonCode, el) { selectedReturnReason = reasonCode; document.querySelectorAll('#reasonGrid .reason-option').forEach(opt => opt.classList.remove('selected')); if (el) el.classList.add('selected'); const otherWrap = document.getElementById('otherReasonWrap'); if (reasonCode === 'other') { otherWrap.style.display = 'block'; document.getElementById('otherReasonText').focus(); } else { otherWrap.style.display = 'none'; document.getElementById('otherReasonText').value = ''; } updateReturnSummary(); }
function collectReturnItemsFromForm() { const items = []; document.querySelectorAll('.return-item-row').forEach(row => { const check = row.querySelector('.rir-checkbox'); if (!check||!check.checked) return; const index = check.id.replace('ret-check-',''); const qtyInput = document.getElementById(`ret-qty-${index}`); const qty = parseFloat(qtyInput?.value)||0; const max = parseFloat(row.dataset.remainingQty)||0; if (qty<=0||qty>max) return; const pricePerUnit = parseFloat(row.dataset.pricePerUnit)||0; const returnCost = fmtQty(qty*pricePerUnit); items.push({ itemId:row.dataset.itemId, itemName:row.dataset.itemName, unit:row.dataset.unit, originalQuantity:fmtQty(parseFloat(row.dataset.originalQty)||0), availableQuantity:fmtQty(max), returnQuantity:fmtQty(qty), pricePerUnit:fmtQty(pricePerUnit), returnCost:fmtQty(returnCost) }); }); return items; }
function updateReturnSummary() { const items = collectReturnItemsFromForm(); const step3 = document.getElementById('returnStep3'); const step4 = document.getElementById('returnStep4'); const summary = document.getElementById('returnSummary'); const submitArea = document.getElementById('returnSubmitArea'); if (selectedReturnBill && items.length > 0) { step3.style.display='block'; step4.style.display='block'; } else { step3.style.display='none'; step4.style.display='none'; summary.style.display='none'; submitArea.style.display='none'; return; } const otherText = document.getElementById('otherReasonText').value.trim(); const reasonText = getReturnReasonLabel(selectedReturnReason, otherText); const total = items.reduce((sum,item) => sum+(item.returnCost||0), 0); document.getElementById('rsBillNum').textContent = selectedReturnBill?.billNumber||'-'; document.getElementById('rsSupplier').textContent = selectedReturnBill?.supplierName||'-'; document.getElementById('rsItemCount').textContent = items.length; document.getElementById('rsReason').textContent = selectedReturnReason ? reasonText : '-'; document.getElementById('rsTotal').textContent = fmt(total); if (selectedReturnReason && (selectedReturnReason!=='other'||otherText)) { summary.style.display='block'; submitArea.style.display='flex'; } else { summary.style.display='none'; submitArea.style.display='none'; } const submitBtn = document.querySelector('#returnSubmitArea .btn-primary'); if (submitBtn) submitBtn.textContent = editingReturnId ? '💾 Update Return' : '📤 Submit Return'; }
function resetReturnForm(skipConfirm = false) { if (!skipConfirm && !confirm('Reset return form?')) return; selectedReturnBill = null; selectedReturnReason = ''; editingReturnId = ''; ['returnBillSearch','returnBillDateFilter','returnNotes','otherReasonText'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); const results = document.getElementById('returnBillResults'); if (results) results.innerHTML = ''; const preview = document.getElementById('selectedBillPreview'); if (preview) preview.classList.remove('show'); ['returnStep2','returnStep3','returnStep4'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; }); const itemsList = document.getElementById('returnItemsList'); if (itemsList) itemsList.innerHTML = ''; const summary = document.getElementById('returnSummary'); if (summary) summary.style.display = 'none'; const submitArea = document.getElementById('returnSubmitArea'); if (submitArea) submitArea.style.display = 'none'; const otherWrap = document.getElementById('otherReasonWrap'); if (otherWrap) otherWrap.style.display = 'none'; document.querySelectorAll('#reasonGrid .reason-option').forEach(opt => opt.classList.remove('selected')); const submitBtn = document.querySelector('#returnSubmitArea .btn-primary'); if (submitBtn) submitBtn.textContent = '📤 Submit Return'; }
async function submitReturn() { if (!selectedReturnBill) { alert('⚠️ Original bill select කරන්න!'); return; } const items = collectReturnItemsFromForm(); if (items.length===0) { alert('⚠️ Return items select කරන්න!'); return; } if (!selectedReturnReason) { alert('⚠️ Return reason select කරන්න!'); return; } const otherReasonText = document.getElementById('otherReasonText').value.trim(); if (selectedReturnReason==='other' && !otherReasonText) { alert('⚠️ Other reason type කරන්න!'); return; } const notes = document.getElementById('returnNotes').value.trim(); const returnTotal = items.reduce((sum,item) => sum+(item.returnCost||0), 0); const reasonText = getReturnReasonLabel(selectedReturnReason, otherReasonText); if (!confirm(`🔄 ${editingReturnId?'Update':'Submit'} Return?\n\n📄 Bill: ${selectedReturnBill.billNumber}\n🏪 ${selectedReturnBill.supplierName}\n📦 ${items.length} items\n💰 ${fmt(returnTotal)}`)) return; const returnData = { returnNumber: editingReturnId ? (allPurchaseReturns.find(r=>r.id===editingReturnId)?.returnNumber||generateReturnNumber()) : generateReturnNumber(), originalPurchaseId:selectedReturnBill.id, originalBillNumber:selectedReturnBill.billNumber, originalPurchaseDate:selectedReturnBill.date, originalBillTotal:fmtQty(selectedReturnBill.billTotal||0), supplierId:selectedReturnBill.supplierId||'', supplierName:selectedReturnBill.supplierName, supplierPhone:selectedReturnBill.supplierPhone||'', reasonCode:selectedReturnReason, reasonText, notes, items, itemsCount:items.length, returnTotal:fmtQty(returnTotal), status:'pending_return', actionBy:null, actionByName:null, actionAt:null, approvalNotes:'', rejectedReason:'', stockAdjusted:false, creditNoteCreated:false, creditNoteId:'', creditNoteNumber:'', performedBy:currentUser.nickname, performedByName:currentUser.name, updatedAt:firebase.firestore.FieldValue.serverTimestamp() }; try { if (editingReturnId) { await db.collection('purchaseReturns').doc(editingReturnId).update(returnData); alert('✅ Return updated!'); } else { returnData.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('purchaseReturns').add(returnData); alert('✅ Return submitted!'); } resetReturnForm(true); showReturnSubTab('pending-returns'); } catch (e) { console.error(e); alert('❌ ' + e.message); } }
function buildReturnCard(r, statusClass, badgeText, messageHtml, extraActions = '') { return `<div class="return-card ${statusClass}"><div class="rc-header"><div class="rc-left"><span class="rc-return-num">🔄 ${escapeHtml(r.returnNumber||'RET')}</span><span class="rc-date">📅 ${escapeHtml(r.originalPurchaseDate||'-')}</span></div><span class="rc-status-badge ${statusClass}">${badgeText}</span></div><div class="rc-supplier">🏪 ${escapeHtml(r.supplierName||'-')} <span style="color:#888; font-size:13px;">| Bill: ${escapeHtml(r.originalBillNumber||'-')}</span></div><div class="rc-stats"><div class="rc-stat"><div class="rs-value">${r.itemsCount||0}</div><div class="rs-label">Items</div></div><div class="rc-stat"><div class="rs-value">${fmt(r.returnTotal||0).replace('.00','')}</div><div class="rs-label">Value</div></div><div class="rc-stat"><div class="rs-value">${escapeHtml(r.reasonText||'-')}</div><div class="rs-label">Reason</div></div></div><div style="font-size:12px; color:#aaa; padding:8px 0; border-top:1px solid rgba(255,255,255,0.05);">📦 ${(r.items||[]).map(i=>`${escapeHtml(i.itemName)} (${dispQty(i.returnQuantity)} ${escapeHtml(i.unit||'')})`).join(', ')}</div><div style="padding:12px; border-radius:8px; margin-top:10px; font-size:13px; background:rgba(156,39,176,0.08); border:1px solid rgba(156,39,176,0.2); color:#d8b4e2;">${messageHtml}</div><div class="rc-actions"><button class="rc-btn view" onclick="viewReturnDetails('${r.id}')">👁️ Details</button>${extraActions}</div><div style="font-size:11px; color:#666; margin-top:6px;">👤 ${escapeHtml(r.performedByName||'-')} | 🕐 ${formatTimestamp(r.createdAt)}</div></div>`; }
function renderPendingReturns() { const list = document.getElementById('pendingReturnsList'); if (!list) return; const returns = allPurchaseReturns.filter(r => r.status==='pending_return'); if (returns.length===0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">✅ No pending returns.</div>'; return; } let html = ''; returns.forEach(r => { let extra = ''; if (isManagerUser()) { extra += `<button class="rc-btn approve" onclick="openReturnActionModal('${r.id}','approve')">✅</button><button class="rc-btn reject" onclick="openReturnActionModal('${r.id}','reject')">❌</button>`; } if (r.performedBy===currentUser.nickname||isManagerUser()) extra += `<button class="rc-btn view" onclick="editPendingReturn('${r.id}')">✏️</button>`; html += buildReturnCard(r, 'pending_return', '⏳ Pending', '<strong>Waiting for approval</strong>', extra); }); list.innerHTML = html; }
function renderApprovedReturns() { const list = document.getElementById('approvedReturnsList'); if (!list) return; const returns = allPurchaseReturns.filter(r => r.status==='approved'); if (returns.length===0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No approved returns.</div>'; return; } let html = ''; returns.forEach(r => { html += buildReturnCard(r, 'approved', '✅ Approved', `<strong>Approved by ${escapeHtml(r.actionByName||'Manager')}</strong>`); }); list.innerHTML = html; }
function renderRejectedReturns() { const list = document.getElementById('rejectedReturnsList'); if (!list) return; const returns = allPurchaseReturns.filter(r => r.status==='rejected'); if (returns.length===0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">🎉 No rejected.</div>'; return; } let html = ''; returns.forEach(r => { let extra = (r.performedBy===currentUser.nickname||isManagerUser()) ? `<button class="rc-btn view" onclick="editPendingReturn('${r.id}')">🔄 Re-edit</button>` : ''; html += buildReturnCard(r, 'rejected', '❌ Rejected', `<strong>Rejected by ${escapeHtml(r.actionByName||'Manager')}</strong>${r.rejectedReason?`<br>📝 ${escapeHtml(r.rejectedReason)}`:''}`, extra); }); list.innerHTML = html; }
function renderAllReturns() { const list = document.getElementById('allReturnsList'); if (!list) return; if (allPurchaseReturns.length===0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No returns.</div>'; return; } let html = ''; allPurchaseReturns.forEach(r => { const sl = r.status==='approved'?'✅ Approved':r.status==='rejected'?'❌ Rejected':'⏳ Pending'; const sc = r.status==='approved'?'approved':r.status==='rejected'?'rejected':'pending_return'; html += buildReturnCard(r, sc, sl, `<strong>Status:</strong> ${sl}`); }); list.innerHTML = html; }
function editPendingReturn(returnId) { const r = allPurchaseReturns.find(x=>x.id===returnId); if (!r) return; if (!confirm('🔄 Load return?')) return; const purchase = allPurchases.find(p=>p.id===r.originalPurchaseId); if (!purchase) { alert('❌ Bill not found!'); return; } editingReturnId = r.id; selectedReturnBill = purchase; selectedReturnReason = r.reasonCode||''; showSection('returns', document.getElementById('tab-returns-btn')); showReturnSubTab('new-return', document.getElementById('ret-new-btn')); document.getElementById('returnNotes').value = r.notes||''; document.getElementById('returnBillSearch').value = r.originalBillNumber||''; selectReturnBill(purchase.id); renderReturnItemsForSelectedBill(r.items||[]); document.querySelectorAll('#reasonGrid .reason-option').forEach(opt => opt.classList.remove('selected')); if (r.reasonCode==='other') { document.getElementById('otherReasonWrap').style.display='block'; document.getElementById('otherReasonText').value = r.reasonText||''; } updateReturnSummary(); }
function viewReturnDetails(returnId) { const r = allPurchaseReturns.find(x=>x.id===returnId); if (!r) return; document.getElementById('returnDetailTitle').textContent = `🔄 ${r.returnNumber||'RET'}`; const itemsHtml = (r.items||[]).map(item=>`<div class="rd-item-row"><div class="rd-item-name">📦 ${escapeHtml(item.itemName)}</div><div class="rd-item-qty">${dispQty(item.returnQuantity)} ${escapeHtml(item.unit||'')}</div><div class="rd-item-cost">Rs. ${formatNumber(item.returnCost||0)}</div></div>`).join(''); document.getElementById('returnDetailBody').innerHTML = `<div style="background:#0f3460; padding:14px; border-radius:8px; margin-bottom:14px;"><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px;"><div><strong style="color:#9C27B0;">📄 Return #:</strong> ${escapeHtml(r.returnNumber||'-')}</div><div><strong style="color:#9C27B0;">📄 Bill:</strong> ${escapeHtml(r.originalBillNumber||'-')}</div><div><strong style="color:#9C27B0;">🏪 Supplier:</strong> ${escapeHtml(r.supplierName||'-')}</div><div><strong style="color:#9C27B0;">💰 Total:</strong> ${fmt(r.returnTotal||0)}</div></div></div><div style="margin-bottom:12px;">${itemsHtml||'No items'}</div>`; document.getElementById('returnDetailModal').style.display = 'flex'; }
function closeReturnDetailModal() { document.getElementById('returnDetailModal').style.display = 'none'; }
function openReturnActionModal(returnId, actionType) { if (!isManagerUser()) { alert('⛔ Manager only!'); return; } const r = allPurchaseReturns.find(x=>x.id===returnId); if (!r) return; currentReturnActionId = returnId; currentReturnActionType = actionType; document.getElementById('returnActionId').value = returnId; document.getElementById('returnActionType').value = actionType; document.getElementById('returnActionNotes').value = ''; document.getElementById('returnActionTitle').textContent = actionType==='approve'?'✅ Approve Return':'❌ Reject Return'; document.getElementById('returnActionBtn').textContent = actionType==='approve'?'✅ Approve':'❌ Reject'; document.getElementById('returnActionBtn').style.background = actionType==='approve'?'#4CAF50':'#ff4444'; document.getElementById('returnActionBody').innerHTML = `<div style="background:#0f3460; padding:14px; border-radius:8px;"><div style="color:#9C27B0; font-weight:700;">🔄 ${escapeHtml(r.returnNumber||'-')}</div><div style="color:#aaa; font-size:13px;">🏪 ${escapeHtml(r.supplierName||'-')}</div><div style="color:#4CAF50; font-size:18px; font-weight:700; margin-top:8px;">💰 ${fmt(r.returnTotal||0)}</div></div>`; document.getElementById('returnActionModal').style.display = 'flex'; }
function closeReturnActionModal() { document.getElementById('returnActionModal').style.display = 'none'; }
async function confirmReturnAction() { const returnId = document.getElementById('returnActionId').value; const actionType = document.getElementById('returnActionType').value; const notes = document.getElementById('returnActionNotes').value.trim(); if (!returnId||!actionType) return; if (actionType==='reject'&&!notes) { alert('⚠️ Reason required!'); return; } if (actionType==='approve') await approvePurchaseReturn(returnId, notes); else await rejectPurchaseReturn(returnId, notes); }
async function approvePurchaseReturn(returnId, notes='') { const r = allPurchaseReturns.find(x=>x.id===returnId); if (!r||r.status!=='pending_return') return; try { const batch = db.batch(); const returnRef = db.collection('purchaseReturns').doc(returnId); const creditNoteRef = db.collection('supplierCreditNotes').doc(); const creditNoteNumber = generateCreditNoteNumber(); batch.update(returnRef, { status:'approved', actionBy:currentUser.nickname, actionByName:currentUser.name, actionAt:firebase.firestore.FieldValue.serverTimestamp(), approvalNotes:notes||'', rejectedReason:'', stockAdjusted:true, creditNoteCreated:true, creditNoteId:creditNoteRef.id, creditNoteNumber }); batch.set(creditNoteRef, { creditNoteNumber, supplierId:r.supplierId||'', supplierName:r.supplierName, returnId, returnNumber:r.returnNumber||'', originalPurchaseId:r.originalPurchaseId, originalBillNumber:r.originalBillNumber, amount:fmtQty(r.returnTotal||0), status:'active', createdAt:firebase.firestore.FieldValue.serverTimestamp(), createdBy:currentUser.nickname, createdByName:currentUser.name, notes:notes||'' }); for (const item of (r.items||[])) { const inv = allInventoryItems.find(i=>i.id===item.itemId); const prevStock = fmtQty(inv?.currentStock||0); const newStock = fmtQty(Math.max(0, prevStock-(item.returnQuantity||0))); batch.update(db.collection('inventoryItems').doc(item.itemId), { currentStock:newStock, updatedAt:firebase.firestore.FieldValue.serverTimestamp() }); batch.set(db.collection('stockMovements').doc(), { itemId:item.itemId, itemName:item.itemName, unit:item.unit||'', movementType:'purchase_return', type:'OUT', quantity:fmtQty(item.returnQuantity||0), previousStock:prevStock, newStock, referenceId:returnId, referenceNumber:r.returnNumber||'', supplierName:r.supplierName||'', notes:`Return: ${r.returnNumber} | Bill: ${r.originalBillNumber}`, performedBy:currentUser.nickname, performedByName:currentUser.name, createdAt:firebase.firestore.FieldValue.serverTimestamp() }); if (inv) inv.currentStock = newStock; } await batch.commit(); await recalculatePurchaseReturnStatus(r.originalPurchaseId); closeReturnActionModal(); alert('✅ Return approved!'); } catch (e) { console.error(e); alert('❌ ' + e.message); } }
async function rejectPurchaseReturn(returnId, reason) { const r = allPurchaseReturns.find(x=>x.id===returnId); if (!r||r.status!=='pending_return') return; try { await db.collection('purchaseReturns').doc(returnId).update({ status:'rejected', actionBy:currentUser.nickname, actionByName:currentUser.name, actionAt:firebase.firestore.FieldValue.serverTimestamp(), rejectedReason:reason, stockAdjusted:false, creditNoteCreated:false }); closeReturnActionModal(); alert('❌ Rejected!'); } catch (e) { alert('❌ ' + e.message); } }
async function recalculatePurchaseReturnStatus(purchaseId) { try { let purchase = allPurchases.find(p=>p.id===purchaseId); if (!purchase) { const doc = await db.collection('purchases').doc(purchaseId).get(); if (!doc.exists) return; purchase = {id:doc.id,...doc.data()}; } const approvedReturns = allPurchaseReturns.filter(r=>r.originalPurchaseId===purchaseId&&r.status==='approved'); const returnedValue = approvedReturns.reduce((sum,r)=>sum+(r.returnTotal||0),0); const qtyMap = {}; approvedReturns.forEach(r=>{(r.items||[]).forEach(item=>{qtyMap[item.itemId]=fmtQty((qtyMap[item.itemId]||0)+(item.returnQuantity||0));})}); let anyReturned=false, fullyReturned=true; (purchase.items||[]).forEach(item=>{const returnedQty=qtyMap[item.itemId]||0; if(returnedQty>0) anyReturned=true; if(returnedQty+0.0001<(item.quantity||0)) fullyReturned=false;}); let returnStatus='none'; if(anyReturned&&fullyReturned) returnStatus='fully_returned'; else if(anyReturned) returnStatus='partially_returned'; const updateData={hasReturns:anyReturned,returnStatus,returnedValue:fmtQty(returnedValue),lastReturnAt:firebase.firestore.FieldValue.serverTimestamp()}; const billTotal=purchase.billTotal||0; const newNetPayable=Math.max(0,billTotal-returnedValue); if(returnStatus==='fully_returned'&&purchase.paymentStatus==='unpaid'&&newNetPayable===0){updateData.paymentStatus='paid';updateData.paidDate=new Date().toISOString().split('T')[0];updateData.paidNotes='🔄 Auto-settled';updateData.paidAmount=0;updateData.paidBy=currentUser.nickname;updateData.paidByName=currentUser.name+' (Auto)';updateData.paidAt=firebase.firestore.FieldValue.serverTimestamp();} await db.collection('purchases').doc(purchaseId).update(updateData); } catch(e){console.error(e);} }

// ═══════ SUPPLIERS (kept same) ═══════
function updateSupplierStats(){document.getElementById('sup-stat-total').textContent=allSuppliers.length;const thirtyDaysAgo=new Date();thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);const activeCount=allSuppliers.filter(s=>{if(!s.lastPurchaseDate)return false;return new Date(s.lastPurchaseDate)>=thirtyDaysAgo;}).length;document.getElementById('sup-stat-active').textContent=activeCount;const totalSpend=allSuppliers.reduce((sum,s)=>sum+(s.totalValue||0),0);document.getElementById('sup-stat-spend').textContent=formatSupCurrency(totalSpend);if(allSuppliers.length>0){const top=allSuppliers.reduce((prev,curr)=>(prev.totalValue||0)>(curr.totalValue||0)?prev:curr);document.getElementById('sup-stat-top').textContent=top.name.length>10?top.name.substring(0,10)+'...':top.name;}else document.getElementById('sup-stat-top').textContent='-';}
function renderSuppliersList(suppliers){const container=document.getElementById('sup-list-container');if(suppliers.length===0){container.innerHTML=`<div class="sup-empty"><div class="sup-empty-icon">🏪</div><p>Suppliers නෑ</p></div>`;return;}let html='';suppliers.forEach(sup=>{const totalBills=sup.totalPurchases||0;const totalValue=sup.totalValue||0;const lastDate=sup.lastPurchaseDate||'N/A';const phone=sup.phone||'Phone නෑ';const canDelete=totalBills===0;html+=`<div class="supplier-card"><div class="supplier-card-header"><div><div class="supplier-name">🏪 ${escapeHtml(sup.name)}</div><div class="supplier-phone">📞 ${escapeHtml(phone)}</div></div></div><div class="supplier-card-stats"><div class="sup-mini-stat"><div class="val">${totalBills}</div><div class="lbl">Bills</div></div><div class="sup-mini-stat"><div class="val">${formatSupCurrency(totalValue)}</div><div class="lbl">Spend</div></div><div class="sup-mini-stat"><div class="val">${totalBills>0?formatSupCurrency(totalValue/totalBills):'Rs.0'}</div><div class="lbl">Avg</div></div></div><div class="supplier-last-date">📅 Last: <strong>${escapeHtml(lastDate)}</strong></div><div class="supplier-action-btns"><button class="sup-btn-history" onclick="viewSupplierHistory('${sup.id}')">👁️</button><button class="sup-btn-edit" onclick="editSupplier('${sup.id}')">✏️</button><button class="sup-btn-delete" onclick="deleteSupplier('${sup.id}','${escapeHtml(sup.name)}',${totalBills})" ${canDelete?'':'disabled'}>🗑️</button></div></div>`;});container.innerHTML=html;}
function filterSuppliersList(){const query=document.getElementById('sup-search').value.toLowerCase().trim();if(query===''){renderSuppliersList(allSuppliers);return;}renderSuppliersList(allSuppliers.filter(s=>s.name.toLowerCase().includes(query)));}
function openAddSupplierModal(){document.getElementById('sup-edit-id').value='';document.getElementById('sup-name').value='';document.getElementById('sup-phone').value='';document.getElementById('sup-email').value='';document.getElementById('sup-address').value='';document.getElementById('sup-notes').value='';document.getElementById('sup-modal-title').textContent='🏪 Add New Supplier';document.getElementById('sup-add-modal').classList.add('active');}
function editSupplier(supplierId){const sup=allSuppliers.find(s=>s.id===supplierId);if(!sup)return;document.getElementById('sup-edit-id').value=supplierId;document.getElementById('sup-name').value=sup.name||'';document.getElementById('sup-phone').value=sup.phone||'';document.getElementById('sup-email').value=sup.email||'';document.getElementById('sup-address').value=sup.address||'';document.getElementById('sup-notes').value=sup.notes||'';document.getElementById('sup-modal-title').textContent='✏️ Edit Supplier';document.getElementById('sup-add-modal').classList.add('active');}
async function saveSupplier(){const editId=document.getElementById('sup-edit-id').value.trim();const name=document.getElementById('sup-name').value.trim();const phone=document.getElementById('sup-phone').value.trim();const email=document.getElementById('sup-email').value.trim();const address=document.getElementById('sup-address').value.trim();const notes=document.getElementById('sup-notes').value.trim();if(!name){alert('⚠️ Name required!');return;}try{if(editId){await db.collection('suppliers').doc(editId).update({name,phone,email,address,notes,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}else{await db.collection('suppliers').add({name,phone,email,address,notes,totalPurchases:0,totalValue:0,lastPurchaseDate:null,firstPurchaseDate:null,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:currentUser.nickname});}closeSupModal('sup-add-modal');await loadSuppliersData();renderSuppliersList(allSuppliers);updateSupplierStats();}catch(e){alert('❌ '+e.message);}}
function deleteSupplier(supplierId,supplierName,billCount){if(billCount>0){alert(`❌ ${supplierName} has ${billCount} bills!`);return;}document.getElementById('sup-delete-id').value=supplierId;document.getElementById('sup-delete-msg').innerHTML=`Delete <strong>"${supplierName}"</strong>?`;document.getElementById('sup-delete-modal').classList.add('active');}
async function confirmDeleteSupplier(){const supplierId=document.getElementById('sup-delete-id').value;if(!supplierId)return;try{await db.collection('suppliers').doc(supplierId).delete();closeSupModal('sup-delete-modal');await loadSuppliersData();renderSuppliersList(allSuppliers);updateSupplierStats();}catch(e){alert('❌ '+e.message);}}
async function viewSupplierHistory(supplierId){const sup=allSuppliers.find(s=>s.id===supplierId);if(!sup)return;document.getElementById('sup-history-title').textContent=`📊 ${sup.name}`;document.getElementById('sup-history-bills').innerHTML='<div class="sup-loading">⏳ Loading...</div>';document.getElementById('sup-history-modal').classList.add('active');try{const snapshot=await db.collection('purchases').where('supplierName','==',sup.name).get();const bills=[];snapshot.forEach(doc=>bills.push({id:doc.id,...doc.data()}));bills.sort((a,b)=>(b.date||'').localeCompare(a.date||''));document.getElementById('sh-total-bills').textContent=bills.length;document.getElementById('sh-total-spend').textContent=formatSupCurrency(bills.reduce((s,b)=>s+(b.billTotal||0),0));document.getElementById('sh-avg-bill').textContent=bills.length>0?formatSupCurrency(bills.reduce((s,b)=>s+(b.billTotal||0),0)/bills.length):'Rs.0';document.getElementById('sh-last-date').textContent=bills.length>0?bills[0].date:'-';if(bills.length===0){document.getElementById('sup-history-bills').innerHTML='<div class="sup-no-bills">📭 No bills</div>';}else{let bhtml='';bills.forEach((bill,i)=>{bhtml+=`<div class="sup-bill-row"><div class="sup-bill-row-header"><span class="sup-bill-num">🧾 ${escapeHtml(bill.billNumber||'-')}</span><span class="sup-bill-amount">Rs. ${formatNumber(bill.billTotal||0)}</span></div></div>`;});document.getElementById('sup-history-bills').innerHTML=bhtml;}}catch(e){document.getElementById('sup-history-bills').innerHTML='<div class="sup-no-bills">❌ Error</div>';}}
function closeSupModal(modalId){document.getElementById(modalId).classList.remove('active');}

// ═══════ REPORTS ═══════
function initReportsTab(){const today=new Date().toISOString().split('T')[0];const thirtyAgo=new Date();thirtyAgo.setDate(thirtyAgo.getDate()-30);const fromEl=document.getElementById('rpFromDate');const toEl=document.getElementById('rpToDate');if(fromEl&&!fromEl.value)fromEl.value=thirtyAgo.toISOString().split('T')[0];if(toEl&&!toEl.value)toEl.value=today;const supSel=document.getElementById('rpSupplier');if(supSel){const current=supSel.value;supSel.innerHTML='<option value="">All Suppliers</option>';allSuppliers.forEach(s=>{supSel.innerHTML+=`<option value="${s.id}">${escapeHtml(s.name)}</option>`;});supSel.value=current;}const catSel=document.getElementById('rpCategory');if(catSel){const current=catSel.value;const categories=new Set();allInventoryItems.forEach(i=>{if(i.category)categories.add(i.category);});catSel.innerHTML='<option value="">All Categories</option>';[...categories].sort().forEach(c=>{catSel.innerHTML+=`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;});catSel.value=current;}}
function resetReportFilters(){const today=new Date().toISOString().split('T')[0];const thirtyAgo=new Date();thirtyAgo.setDate(thirtyAgo.getDate()-30);document.getElementById('rpFromDate').value=thirtyAgo.toISOString().split('T')[0];document.getElementById('rpToDate').value=today;document.getElementById('rpSupplier').value='';document.getElementById('rpCategory').value='';document.getElementById('rpPayment').value='';loadPurchasingReports();}
function loadPurchasingReports(){const from=document.getElementById('rpFromDate')?.value;const to=document.getElementById('rpToDate')?.value;const supplier=document.getElementById('rpSupplier')?.value;const category=document.getElementById('rpCategory')?.value;const payment=document.getElementById('rpPayment')?.value;let filtered=allPurchases.filter(p=>p.status==='approved');if(from)filtered=filtered.filter(p=>p.date>=from);if(to)filtered=filtered.filter(p=>p.date<=to);if(supplier)filtered=filtered.filter(p=>p.supplierId===supplier);if(payment)filtered=filtered.filter(p=>p.paymentMethod===payment);if(category)filtered=filtered.filter(p=>(p.items||[]).some(i=>i.category===category));renderReportSummary(filtered);renderCategoryChart(filtered,category);renderTopItems(filtered,category);renderTopSuppliersReport(filtered);renderPaymentBreakdown(filtered);renderMonthlyTrend(filtered);renderPriceChanges(filtered);renderRecommendations(filtered);}
function renderReportSummary(bills){const totalSpend=bills.reduce((s,p)=>s+(p.billTotal||0),0);const uniqueSuppliers=new Set(bills.map(p=>p.supplierId).filter(Boolean));const uniqueItems=new Set();bills.forEach(p=>(p.items||[]).forEach(i=>uniqueItems.add(i.itemId)));const billIds=bills.map(b=>b.id);const returnsValue=allPurchaseReturns.filter(r=>r.status==='approved'&&billIds.includes(r.originalPurchaseId)).reduce((s,r)=>s+(r.returnTotal||0),0);document.getElementById('rpStatTotalSpend').textContent=formatSupCurrency(totalSpend);document.getElementById('rpStatTotalBills').textContent=bills.length;document.getElementById('rpStatActiveSuppliers').textContent=uniqueSuppliers.size;document.getElementById('rpStatItemsCount').textContent=uniqueItems.size;document.getElementById('rpStatReturns').textContent=formatSupCurrency(returnsValue);}
function renderCategoryChart(bills,categoryFilter){const container=document.getElementById('rpCategoryChart');const countEl=document.getElementById('rpCategoryCount');const categoryMap={};bills.forEach(p=>{(p.items||[]).forEach(item=>{if(categoryFilter&&item.category!==categoryFilter)return;const cat=item.category||'Uncategorized';categoryMap[cat]=(categoryMap[cat]||0)+(item.totalCost||0);});});const sorted=Object.entries(categoryMap).sort((a,b)=>b[1]-a[1]).slice(0,10);if(sorted.length===0){container.innerHTML='<div class="report-empty"><span class="empty-icon">📦</span>No data.</div>';countEl.textContent='0';return;}countEl.textContent=`${sorted.length} categories`;const maxValue=sorted[0][1];let html='<div class="category-bars">';sorted.forEach(([name,value])=>{const percent=(value/maxValue)*100;html+=`<div class="cat-bar-item"><div class="cat-bar-name">${escapeHtml(name)}</div><div class="cat-bar-wrap"><div class="cat-bar-fill" style="width:${percent}%;">${percent.toFixed(0)}%</div></div><div class="cat-bar-value">${formatSupCurrency(value)}</div></div>`;});html+='</div>';container.innerHTML=html;}
function renderTopItems(bills,categoryFilter){const container=document.getElementById('rpTopItemsList');const countEl=document.getElementById('rpTopItemsCount');const itemMap={};bills.forEach(p=>{(p.items||[]).forEach(item=>{if(categoryFilter&&item.category!==categoryFilter)return;if(!itemMap[item.itemId])itemMap[item.itemId]={name:item.itemName,count:0,totalSpend:0};itemMap[item.itemId].count++;itemMap[item.itemId].totalSpend+=(item.totalCost||0);});});const sorted=Object.values(itemMap).sort((a,b)=>b.totalSpend-a.totalSpend).slice(0,10);if(sorted.length===0){container.innerHTML='<div class="report-empty"><span class="empty-icon">📦</span>No data.</div>';countEl.textContent='0';return;}countEl.textContent=`${sorted.length} items`;let html='<div style="overflow-x:auto;"><table class="top-items-table"><thead><tr><th>#</th><th>Item</th><th>Times</th><th class="amount-cell">Total</th></tr></thead><tbody>';sorted.forEach((item,i)=>{const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);html+=`<tr><td>${medal}</td><td><strong>${escapeHtml(item.name)}</strong></td><td>${item.count}×</td><td class="amount-cell">${formatSupCurrency(item.totalSpend)}</td></tr>`;});html+='</tbody></table></div>';container.innerHTML=html;}
function renderTopSuppliersReport(bills){const container=document.getElementById('rpTopSuppliersList');const countEl=document.getElementById('rpTopSuppliersCount');const supMap={};bills.forEach(p=>{if(!p.supplierId)return;if(!supMap[p.supplierId])supMap[p.supplierId]={name:p.supplierName,count:0,totalSpend:0};supMap[p.supplierId].count++;supMap[p.supplierId].totalSpend+=(p.billTotal||0);});const sorted=Object.values(supMap).sort((a,b)=>b.totalSpend-a.totalSpend).slice(0,5);if(sorted.length===0){container.innerHTML='<div class="report-empty"><span class="empty-icon">🏪</span>No data.</div>';countEl.textContent='0';return;}countEl.textContent=`Top ${sorted.length}`;let html='<div style="overflow-x:auto;"><table class="top-items-table"><thead><tr><th>#</th><th>Supplier</th><th>Bills</th><th class="amount-cell">Spend</th></tr></thead><tbody>';sorted.forEach((s,i)=>{const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);html+=`<tr><td>${medal}</td><td><strong>🏪 ${escapeHtml(s.name)}</strong></td><td>${s.count}</td><td class="amount-cell">${formatSupCurrency(s.totalSpend)}</td></tr>`;});html+='</tbody></table></div>';container.innerHTML=html;}
function renderPaymentBreakdown(bills){let cashBills=0,cashAmount=0,creditBills=0,creditAmount=0,bankBills=0,bankAmount=0;bills.forEach(p=>{const amount=p.billTotal||0;if(p.paymentMethod==='cash'){cashBills++;cashAmount+=amount;}else if(p.paymentMethod==='credit'){creditBills++;creditAmount+=amount;}else if(p.paymentMethod==='bank'){bankBills++;bankAmount+=amount;}});document.getElementById('rpPayCashBills').textContent=cashBills;document.getElementById('rpPayCashAmount').textContent=formatSupCurrency(cashAmount);document.getElementById('rpPayCreditBills').textContent=creditBills;document.getElementById('rpPayCreditAmount').textContent=formatSupCurrency(creditAmount);document.getElementById('rpPayBankBills').textContent=bankBills;document.getElementById('rpPayBankAmount').textContent=formatSupCurrency(bankAmount);}
function renderMonthlyTrend(bills){const container=document.getElementById('rpMonthlyTrend');const months={};const now=new Date();for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const key=d.toISOString().slice(0,7);const label=d.toLocaleDateString('en-LK',{month:'short',year:'numeric'});months[key]={label,total:0,count:0};}bills.forEach(p=>{if(!p.date)return;const key=p.date.slice(0,7);if(months[key]){months[key].total+=(p.billTotal||0);months[key].count++;}});const data=Object.values(months);const maxValue=Math.max(...data.map(m=>m.total),1);let html='<div class="monthly-trend">';data.forEach(m=>{const percent=(m.total/maxValue)*100;html+=`<div class="month-bar-item"><div class="month-bar-label">📅 ${m.label}</div><div class="month-bar-wrap"><div class="month-bar-fill" style="width:${percent}%;"></div></div><div class="month-bar-amount">${formatSupCurrency(m.total)} (${m.count})</div></div>`;});html+='</div>';container.innerHTML=html;}
function renderPriceChanges(bills){const container=document.getElementById('rpPriceChanges');const countEl=document.getElementById('rpPriceChangesCount');const changes=[];bills.forEach(p=>{(p.items||[]).forEach(item=>{const oldPrice=item.previousPrice||0;const newPrice=item.pricePerUnit||0;if(oldPrice>0&&oldPrice!==newPrice){const diff=newPrice-oldPrice;const percent=(diff/oldPrice)*100;changes.push({itemName:item.itemName,supplierName:p.supplierName,date:p.date,oldPrice,newPrice,percent,direction:diff>0?'up':'down'});}});});changes.sort((a,b)=>Math.abs(b.percent)-Math.abs(a.percent));const top=changes.slice(0,10);if(top.length===0){container.innerHTML='<div class="report-empty"><span class="empty-icon">💸</span>No changes.</div>';countEl.textContent='0';return;}countEl.textContent=`${changes.length} total`;let html='<div class="price-change-list">';top.forEach(c=>{const arrow=c.direction==='up'?'▲':'▼';html+=`<div class="price-change-item ${c.direction}"><div><div class="pci-name">📦 ${escapeHtml(c.itemName)}</div><div class="pci-supplier">🏪 ${escapeHtml(c.supplierName)} | 📅 ${escapeHtml(c.date)}</div></div><div style="text-align:right;"><div class="pci-old">Rs. ${c.oldPrice.toFixed(2)}</div><div class="pci-new">Rs. ${c.newPrice.toFixed(2)}</div></div><div class="pci-change ${c.direction}">${arrow} ${Math.abs(c.percent).toFixed(1)}%</div></div>`;});html+='</div>';container.innerHTML=html;}
function renderRecommendations(bills){const container=document.getElementById('rpRecommendations');const recommendations=[];const supSpend={};bills.forEach(p=>{if(!p.supplierId)return;supSpend[p.supplierId]=(supSpend[p.supplierId]||0)+(p.billTotal||0);});const topSup=Object.entries(supSpend).sort((a,b)=>b[1]-a[1])[0];if(topSup){const sup=allSuppliers.find(s=>s.id===topSup[0]);if(sup)recommendations.push({icon:'🏪',color:'#FF9800',title:`Top: ${sup.name}`,desc:`${formatSupCurrency(topSup[1])} spend. Negotiate better deals!`});}const unpaidBills=bills.filter(p=>p.paymentStatus==='unpaid'&&getNetPayable(p)>0);if(unpaidBills.length>0){const totalUnpaid=unpaidBills.reduce((s,p)=>s+getNetPayable(p),0);recommendations.push({icon:'💳',color:'#f0a500',title:`${unpaidBills.length} Unpaid Bills`,desc:`Outstanding: ${formatSupCurrency(totalUnpaid)}`});}if(recommendations.length===0){container.innerHTML='<div class="report-empty"><span class="empty-icon">🎯</span>No recommendations yet.</div>';return;}let html='<div style="display:flex; flex-direction:column; gap:10px;">';recommendations.forEach(r=>{html+=`<div style="background:rgba(0,0,0,0.2); border-left:3px solid ${r.color}; border-radius:8px; padding:12px 14px;"><div style="font-size:14px; font-weight:700; color:${r.color}; margin-bottom:4px;">${r.icon} ${escapeHtml(r.title)}</div><div style="font-size:12px; color:#ccc;">${escapeHtml(r.desc)}</div></div>`;});html+='</div>';container.innerHTML=html;}

// ════════════════════════════════════════════════════════════
// 📸 PAYMENT PROOF UPLOAD ⭐ NEW!
// ════════════════════════════════════════════════════════════
let paymentProofPhotoUrl = '';
let paymentProofPhotoPath = '';

async function handlePaymentProofFile(input) {
    const file = input.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { alert('⚠️ Image files only!'); return; }
    const progressWrap = document.getElementById('paymentProofProgress');
    const progressBar = document.getElementById('paymentProofBar');
    const progressPercent = document.getElementById('paymentProofPercent');
    const status = document.getElementById('paymentProofStatus');
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
                paymentProofPhotoUrl = downloadURL; paymentProofPhotoPath = fileName;
                document.getElementById('paymentProofImg').src = downloadURL;
                document.getElementById('paymentProofPreview').style.display = 'block';
                document.getElementById('paymentProofUrl').value = downloadURL;
                setTimeout(() => { progressWrap.style.display = 'none'; }, 1000);
                status.textContent = '✅ Upload complete!';
            }
        );
    } catch (e) { console.error(e); progressWrap.style.display = 'none'; alert('❌ Error: ' + e.message); }
    input.value = '';
}

function previewPaymentProofUrl() {
    const url = document.getElementById('paymentProofUrl').value.trim();
    if (!url) { removePaymentProof(); return; }
    if (url === paymentProofPhotoUrl) return;
    const img = document.getElementById('paymentProofImg');
    img.src = url;
    img.onerror = function() { document.getElementById('paymentProofPreview').style.display = 'none'; };
    img.onload = function() { document.getElementById('paymentProofPreview').style.display = 'block'; paymentProofPhotoUrl = url; paymentProofPhotoPath = ''; };
}

async function removePaymentProof() {
    if (paymentProofPhotoPath) { try { await storage.ref(paymentProofPhotoPath).delete(); } catch (e) { console.warn(e); } }
    document.getElementById('paymentProofUrl').value = '';
    document.getElementById('paymentProofImg').src = '';
    document.getElementById('paymentProofPreview').style.display = 'none';
    paymentProofPhotoUrl = ''; paymentProofPhotoPath = '';
}

// ═══════ WINDOW CLICK CLOSES MODALS ═══════
window.onclick = function (event) {
    if (event.target.id === 'billDetailModal') closeBillDetailModal();
    if (event.target.id === 'photoFullscreenModal') closePhotoFullscreen();
    if (event.target.id === 'markPaidModal') closeMarkPaidModal();
    if (event.target.id === 'returnDetailModal') closeReturnDetailModal();
    if (event.target.id === 'returnActionModal') closeReturnActionModal();
    if (event.target.id === 'sup-add-modal') closeSupModal('sup-add-modal');
    if (event.target.id === 'sup-history-modal') closeSupModal('sup-history-modal');
    if (event.target.id === 'sup-delete-modal') closeSupModal('sup-delete-modal');
};