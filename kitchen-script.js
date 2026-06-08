// ═══════════════════════════════════════════════════════════
// 🍳 BUONO - KITCHEN DATABASE
// File: kitchen-script.js
// Version: 10.1 - Architecture Migration!
// ⭐ Uses global DATABASES from firebase-config.js
// ═══════════════════════════════════════════════════════════

// ❌ NO DATABASES array! Uses global from firebase-config.js

// ═══════════════════════════════════════
// 🌐 GLOBALS
// ═══════════════════════════════════════
let currentUser = null;
let myPerms = null;
let allRecipes = [];
let allInventoryItems = [];
let allEmployees = [];
let allStaffMeals = [];
let allWastage = [];
let allStockCounts = [];
let currentCountItems = [];
let filteredMeals = [];
let filteredWastage = [];
let deleteRecipeId = '';
let deleteMealId = '';
let deleteWasteId = '';
let ingredientRowCount = 0;
let mealMenuItemRowCount = 0;
let mealIngRowCount = 0;
let selectedStaffIds = [];
let seenRejectedIds = new Set();

const OVERHEAD_PERCENT = 0.40;


// ═══════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════
function fmtQty(num) {
    if (num === null || num === undefined || isNaN(num)) return 0;
    return Math.round(num * 1000) / 1000;
}
function dispQty(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return (Math.round(num * 1000) / 1000).toString();
}
function isManagerUser() { return ['Admin', 'Manager'].includes(currentUser?.access); }


// ═══════════════════════════════════════
// 🚀 INITIALIZE APP
// ═══════════════════════════════════════
async function initializeApp() {
    const userData = getCurrentUser();
    if (!userData) { window.location.href = "login.html"; return; }

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
    const perms = userData.permissions?.kitchenDB || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView || perms.edit || perms.delete;
    if (!hasAccess) { alert('⛔ Access denied!'); window.location.href = "access.html"; return; }

    myPerms = isAdmin ? { add:true, view:true, selfView:true, edit:true, delete:true } : perms;
    currentUser = userData;
    document.getElementById('welcomeUser').textContent = `👋 Welcome, ${userData.name} (${userData.access})`;

    const seen = localStorage.getItem('seenRejectedIds_' + userData.id);
    if (seen) seenRejectedIds = new Set(JSON.parse(seen));

    buildDBSwitcherDropdown();
    setupUI();
    setDefaultDates();

    await loadInventoryItems();
    await loadEmployees();

    loadRecipes();
    loadStaffMeals();
    loadWastage();
    loadStockCounts();
}

initializeApp();

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('mealDate').value = today;
    document.getElementById('wasteDate').value = today;
    document.getElementById('countDate').value = today;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    document.getElementById('kitRepDateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('kitRepDateTo').value = today;
}

function setupUI() {
    if (myPerms.add) {
        document.getElementById('addRecipeBtn').style.display = 'inline-block';
        document.getElementById('addMealBtn').style.display = 'inline-block';
        document.getElementById('addWasteBtn').style.display = 'inline-block';
    }
}

function showSection(name, btnEl) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    if (btnEl) btnEl.classList.add('active');
    if (name === 'stockcount') initStockCountTab();
    if (name === 'kitchenreports') generateKitchenReports();
}

// ⭐ NEW: Uses global DATABASES array!
function buildDBSwitcherDropdown() {
    const list = document.getElementById('dbDropdownList');
    if (!list) return;
    
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';
    
    // ✅ Uses GLOBAL DATABASES from firebase-config.js
    DATABASES.forEach(d => {
        if (d.adminManagerOnly && !isAdminOrMgr) return;
        const isAdmin = currentUser.access === 'Admin';
        const dp = currentUser.permissions?.[d.id] || {};
        const hasAccess = isAdmin || dp.add || dp.view || dp.selfView || dp.edit || dp.delete;
        if (!d.adminManagerOnly && !hasAccess) return;
        const isCurrent = d.id === 'kitchenDB';
        html += `<a href="${d.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}"><span>${d.icon}</span><span>${d.name}</span>${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}</a>`;
    });
    list.innerHTML = html;
    
    const switcher = document.getElementById('dbSwitcher');
    if (switcher) {
        switcher.addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('dbDropdown').classList.toggle('show');
        });
    }
    document.addEventListener('click', function(e) {
        const dd = document.getElementById('dbDropdown');
        if (dd && !dd.contains(e.target) && !e.target.closest('#dbSwitcher')) dd.classList.remove('show');
    });
}


// ═══════ DATA LOADERS ═══════
async function loadInventoryItems() {
    try {
        const snap = await db.collection('inventoryItems').orderBy('itemName').get();
        allInventoryItems = [];
        snap.forEach(doc => allInventoryItems.push({ id: doc.id, ...doc.data() }));
        const wasteSelect = document.getElementById('wasteItem');
        wasteSelect.innerHTML = '<option value="">-- Select --</option>';
        allInventoryItems.forEach(item => {
            wasteSelect.innerHTML += `<option value="${item.id}" data-unit="${item.unit}" data-price="${item.pricePerUnit || 0}" data-stock="${item.currentStock}">${item.itemName} (${dispQty(item.currentStock)} ${item.unit})</option>`;
        });
    } catch (e) { console.error(e); }
}

async function loadEmployees() {
    try {
        const snap = await db.collection('employees').orderBy('name').get();
        allEmployees = [];
        snap.forEach(doc => allEmployees.push({ id: doc.id, ...doc.data() }));
        const filterStaff = document.getElementById('filterMealStaff');
        filterStaff.innerHTML = '<option value="">👥 All Staff</option>';
        allEmployees.forEach(emp => {
            filterStaff.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
        });
    } catch (e) { console.error(e); }
}

function loadStockCounts() {
    db.collection('stockCounts').orderBy('createdAt', 'desc').onSnapshot((snap) => {
        allStockCounts = [];
        snap.forEach(doc => allStockCounts.push({ id: doc.id, ...doc.data() }));
        updateTabBadges();
        renderPendingCounts();
        renderApprovedCounts();
        renderRejectedCounts();
        renderCountHistory();
        updateDashboardAlert();
    });
}

function updateTabBadges() {
    const pending = allStockCounts.filter(c => c.status === 'pending_approval').length;
    const approved = allStockCounts.filter(c => c.status === 'approved' || c.status === 'suspicious_approved').length;
    const rejected = allStockCounts.filter(c => c.status === 'rejected').length;
    
    const pBadge = document.getElementById('pendingCountBadge');
    pBadge.textContent = pending;
    pBadge.style.display = pending > 0 ? 'inline-block' : 'none';

    const aBadge = document.getElementById('approvedCountBadge');
    aBadge.textContent = approved;
    aBadge.style.display = approved > 0 ? 'inline-block' : 'none';

    const rBadge = document.getElementById('rejectedCountBadge');
    const rTab = document.getElementById('subtab-rejected');
    rBadge.textContent = rejected;
    rBadge.style.display = rejected > 0 ? 'inline-block' : 'none';

    const rejectedCounts = allStockCounts.filter(c => c.status === 'rejected');
    const hasNewRejected = rejectedCounts.some(c => !seenRejectedIds.has(c.id));

    if (hasNewRejected && rejected > 0) {
        rTab.classList.add('has-new');
    } else {
        rTab.classList.remove('has-new');
    }
}


// ═══════ DASHBOARD ALERT ═══════
function updateDashboardAlert() {
    const alert = document.getElementById('dashboardAlert');
    const title = document.getElementById('alertTitle');
    const subtitle = document.getElementById('alertSubtitle');
    const actionBtn = document.getElementById('alertActionBtn');

    const pendingApprovals = allStockCounts.filter(c => c.status === 'pending_approval').length;
    const rejectedNew = allStockCounts.filter(c => c.status === 'rejected' && !seenRejectedIds.has(c.id));

    if (rejectedNew.length > 0) {
        alert.classList.add('rejected');
        title.textContent = `🚨 ${rejectedNew.length} Stock Count${rejectedNew.length > 1 ? 's' : ''} REJECTED by Manager!`;
        subtitle.textContent = 'Stock Count tab → ❌ Rejected sub-tab එකට යන්න';
        actionBtn.textContent = 'View Rejected';
        actionBtn.disabled = false;
        actionBtn.onclick = function() {
            showSection('stockcount', document.getElementById('tab-stockcount-btn'));
            setTimeout(() => showCountSubTab('rejected', document.getElementById('subtab-rejected')), 100);
        };
        alert.classList.add('show');
        return;
    }

    alert.classList.remove('rejected');

    if (pendingApprovals > 0) {
        title.textContent = `${pendingApprovals} Stock Count${pendingApprovals > 1 ? 's' : ''} Pending in Reports DB`;
        subtitle.textContent = isManagerUser() ? 'Approve/Reject in Reports DB' : 'Manager review in progress';
        if (isManagerUser()) {
            actionBtn.textContent = 'Review in Reports DB';
            actionBtn.disabled = false;
            actionBtn.onclick = function() { window.location.href = 'reports.html#pendingapprovals'; };
        } else {
            actionBtn.textContent = 'Manager Reviewing...';
            actionBtn.disabled = true;
        }
        alert.classList.add('show');
        return;
    }

    alert.classList.remove('show');
}

function handleAlertAction() {
    // fallback
}


// ═══════ STOCK SHORTAGE DETECTION ═══════
function classifySeverity(requested, available) {
    if (available >= requested) return null;
    const pct = ((requested - available) / requested) * 100;
    if (pct < 10) return 'minor';
    if (pct <= 50) return 'major';
    return 'critical';
}

function checkStockShortage(stockNeeded) {
    const issues = [];
    for (const itemId in stockNeeded) {
        const needed = stockNeeded[itemId];
        const item = allInventoryItems.find(i => i.id === itemId);
        if (!item) continue;
        if (needed > item.currentStock) {
            const shortage = needed - item.currentStock;
            const severity = classifySeverity(needed, item.currentStock);
            issues.push({ itemId, itemName: item.itemName, requested: needed, available: item.currentStock, shortage, unit: item.unit, severity, pricePerUnit: item.pricePerUnit || 0 });
        }
    }
    return issues;
}

function renderStockIssueWarning(issues, warningEl, listEl, saveBtnEl) {
    if (issues.length === 0) {
        warningEl.classList.remove('show');
        if (saveBtnEl) { saveBtnEl.textContent = '💾 Save & Deduct Stock'; saveBtnEl.style.background = ''; }
        return;
    }
    let html = '';
    issues.forEach(issue => {
        html += `<div class="stock-issue-row"><span class="si-item">📦 ${issue.itemName}<span class="severity-badge ${issue.severity}">${issue.severity}</span></span><span class="si-detail">Need: ${dispQty(issue.requested)} ${issue.unit} | Have: ${dispQty(issue.available)} ${issue.unit}</span></div>`;
    });
    listEl.innerHTML = html;
    warningEl.classList.add('show');
    if (saveBtnEl) { saveBtnEl.textContent = '⚠️ Save with Issue Flag'; saveBtnEl.style.background = 'linear-gradient(135deg, #ff4444, #f0a500)'; }
}


// ═══════ TAB 1: RECIPES ═══════
function loadRecipes() {
    db.collection('recipes').orderBy('recipeName').onSnapshot((snap) => {
        allRecipes = [];
        snap.forEach(doc => allRecipes.push({ id: doc.id, ...doc.data() }));
        document.getElementById('statTotalRecipes').textContent = allRecipes.length;
        if (allRecipes.length > 0) {
            const avg = allRecipes.reduce((s, r) => s + (r.margin || 0), 0) / allRecipes.length;
            document.getElementById('statAvgMargin').textContent = avg.toFixed(1) + '%';
        }
        filterRecipes();
    });
}

function filterRecipes() {
    const search = document.getElementById('searchRecipe').value.toLowerCase();
    const catFilter = document.getElementById('filterRecipeCategory').value;
    const filtered = allRecipes.filter(r => {
        if (search && !r.recipeName.toLowerCase().includes(search)) return false;
        if (catFilter && r.category !== catFilter) return false;
        return true;
    });
    renderRecipes(filtered);
}

function renderRecipes(recipes) {
    const grid = document.getElementById('recipeGrid');
    if (recipes.length === 0) { 
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">📭 No recipes found.</div>'; 
        return; 
    }
    const catIcons = { 'Hot Beverages':'☕','Cold Beverages':'🧃','Desserts':'🍰','Main Course':'🍔','Appetizers':'🥗','Snacks':'🥪','Bakery':'🍞','Special':'🎂' };
    let html = '';
    recipes.forEach(r => {
        const catIcon = catIcons[r.category] || '📋';
        let ingHtml = '';
        (r.ingredients || []).forEach(ing => {
            ingHtml += `<div class="rc-ing-item"><span class="ing-name">${ing.itemName}</span><span class="ing-qty">${dispQty(ing.quantity)} ${ing.unit}</span></div>`;
        });
        let actions = '';
        if (myPerms.edit) actions += `<button class="btn-edit" onclick="openEditRecipeModal('${r.id}')">✏️ Edit</button>`;
        if (myPerms.delete) actions += `<button class="btn-delete" onclick="openDeleteRecipeModal('${r.id}', '${r.recipeName.replace(/'/g, "\\'")}')">🗑️</button>`;
        html += `<div class="recipe-card"><div class="recipe-card-top"><div class="rc-header"><div class="rc-name">${catIcon} ${r.recipeName}</div><span class="rc-cat">${r.category}</span></div><div class="rc-price">Rs. ${(r.sellingPrice||0).toFixed(2)}</div><div class="rc-price-label">Selling Price</div></div><div class="cost-breakdown"><div class="cost-item"><div class="ci-value red">Rs. ${(r.fullCost||0).toFixed(0)}</div><div class="ci-label">Full Cost</div></div><div class="cost-item"><div class="ci-value green">Rs. ${(r.profit||0).toFixed(0)}</div><div class="ci-label">Profit</div></div><div class="cost-item"><div class="ci-value blue">${(r.margin||0).toFixed(1)}%</div><div class="ci-label">Margin</div></div></div><div class="rc-ingredients"><h4>🧪 Ingredients (${(r.ingredients||[]).length})</h4>${ingHtml}</div>${actions ? `<div class="rc-actions">${actions}</div>` : ''}</div>`;
    });
    grid.innerHTML = html;
}

function addIngredientRow(data) {
    const container = document.getElementById('ingredientsList');
    const rowId = 'ing-row-' + ingredientRowCount;
    let optionsHtml = '<option value="">-- Select --</option>';
    allInventoryItems.forEach(item => {
        const sel = data && data.itemId === item.id ? 'selected' : '';
        optionsHtml += `<option value="${item.id}" data-unit="${item.unit}" data-price="${item.pricePerUnit || 0}" ${sel}>${item.itemName} (${item.unit})</option>`;
    });
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.id = rowId;
    row.innerHTML = `<select class="ing-select" onchange="onIngredientChange('${rowId}')">${optionsHtml}</select><input type="number" class="ing-qty" placeholder="Qty" step="0.001" value="${data ? data.quantity : ''}" oninput="calculateRecipeCost()"><span class="ing-unit-display">${data ? data.unit : '-'}</span><span class="ing-cost-display">${data ? 'Rs. ' + ((data.quantity||0) * (data.pricePerUnit||0)).toFixed(2) : 'Rs. 0'}</span><button type="button" class="btn-remove-ing" onclick="removeIngredientRow('${rowId}')">✕</button>`;
    container.appendChild(row);
    ingredientRowCount++;
}

function removeIngredientRow(rowId) { 
    document.getElementById(rowId).remove(); 
    calculateRecipeCost(); 
}

function onIngredientChange(rowId) {
    const row = document.getElementById(rowId);
    const select = row.querySelector('.ing-select');
    const option = select.selectedOptions[0];
    row.querySelector('.ing-unit-display').textContent = option && option.value ? option.dataset.unit : '-';
    calculateRecipeCost();
}

function calculateRecipeCost() {
    let ingredientCost = 0;
    document.querySelectorAll('.ingredient-row').forEach(row => {
        const select = row.querySelector('.ing-select');
        const qtyInput = row.querySelector('.ing-qty');
        const display = row.querySelector('.ing-cost-display');
        if (select.value && qtyInput.value) {
            const price = parseFloat(select.selectedOptions[0].dataset.price) || 0;
            const qty = parseFloat(qtyInput.value) || 0;
            const cost = price * qty;
            ingredientCost += cost;
            display.textContent = 'Rs. ' + cost.toFixed(2);
        } else display.textContent = 'Rs. 0';
    });
    const overhead = ingredientCost * OVERHEAD_PERCENT;
    const fullCost = ingredientCost + overhead;
    const sellPrice = parseFloat(document.getElementById('recipeSellPrice').value) || 0;
    const profit = sellPrice - fullCost;
    const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
    document.getElementById('csIngredientCost').textContent = 'Rs. ' + ingredientCost.toFixed(2);
    document.getElementById('csOverhead').textContent = 'Rs. ' + overhead.toFixed(2);
    document.getElementById('csFullCost').innerHTML = '<strong>Rs. ' + fullCost.toFixed(2) + '</strong>';
    document.getElementById('csSellPrice').textContent = 'Rs. ' + sellPrice.toFixed(2);
    document.getElementById('csProfit').innerHTML = '<strong>Rs. ' + profit.toFixed(2) + '</strong>';
    document.getElementById('csProfit').className = 'cs-value ' + (profit >= 0 ? 'green' : 'red');
    document.getElementById('csMargin').textContent = margin.toFixed(1) + '%';
    const fill = document.getElementById('marginFill');
    const barWidth = Math.max(0, Math.min(100, margin));
    let barColor = '#ff4444';
    if (margin >= 60) barColor = '#4CAF50';
    else if (margin >= 40) barColor = '#f0a500';
    else if (margin >= 20) barColor = '#FF9800';
    fill.style.width = barWidth + '%';
    fill.style.background = barColor;
    fill.textContent = margin.toFixed(1) + '%';
}

function openAddRecipeModal() {
    if (allInventoryItems.length === 0) { alert('⚠️ No inventory items!'); return; }
    document.getElementById('recipeModalTitle').textContent = '➕ Add New Recipe';
    document.getElementById('recipeName').value = '';
    document.getElementById('recipeCategory').value = '';
    document.getElementById('recipeSellPrice').value = '';
    document.getElementById('recipeNotes').value = '';
    document.getElementById('editRecipeId').value = '';
    document.getElementById('ingredientsList').innerHTML = '';
    ingredientRowCount = 0;
    addIngredientRow();
    calculateRecipeCost();
    document.getElementById('recipeModal').style.display = 'flex';
}

function openEditRecipeModal(recipeId) {
    const r = allRecipes.find(x => x.id === recipeId);
    if (!r) return;
    document.getElementById('recipeModalTitle').textContent = '✏️ Edit Recipe';
    document.getElementById('recipeName').value = r.recipeName;
    document.getElementById('recipeCategory').value = r.category;
    document.getElementById('recipeSellPrice').value = r.sellingPrice;
    document.getElementById('recipeNotes').value = r.notes || '';
    document.getElementById('editRecipeId').value = recipeId;
    document.getElementById('ingredientsList').innerHTML = '';
    ingredientRowCount = 0;
    if (r.ingredients && r.ingredients.length > 0) r.ingredients.forEach(ing => addIngredientRow(ing));
    else addIngredientRow();
    calculateRecipeCost();
    document.getElementById('recipeModal').style.display = 'flex';
}

function closeRecipeModal() { document.getElementById('recipeModal').style.display = 'none'; }

async function saveRecipe() {
    const recipeName = document.getElementById('recipeName').value.trim();
    const category = document.getElementById('recipeCategory').value;
    const sellingPrice = parseFloat(document.getElementById('recipeSellPrice').value) || 0;
    const notes = document.getElementById('recipeNotes').value.trim();
    const editId = document.getElementById('editRecipeId').value;
    if (!recipeName || !category) { alert('⚠️ Required fields!'); return; }
    const ingredients = [];
    let ingredientCost = 0;
    document.querySelectorAll('.ingredient-row').forEach(row => {
        const select = row.querySelector('.ing-select');
        const qty = parseFloat(row.querySelector('.ing-qty').value) || 0;
        if (select.value && qty > 0) {
            const option = select.selectedOptions[0];
            const price = parseFloat(option.dataset.price) || 0;
            const cost = price * qty;
            ingredientCost += cost;
            ingredients.push({ itemId: select.value, itemName: option.textContent.split(' (')[0], quantity: fmtQty(qty), unit: option.dataset.unit, pricePerUnit: price, cost: cost });
        }
    });
    if (ingredients.length === 0) { alert('⚠️ Add ingredients!'); return; }
    const overhead = ingredientCost * OVERHEAD_PERCENT;
    const fullCost = ingredientCost + overhead;
    const profit = sellingPrice - fullCost;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const data = { recipeName, category, sellingPrice, notes, ingredients, ingredientCost, overhead, fullCost, profit, margin, updatedAt: getServerTimestamp(), updatedBy: currentUser.nickname };
    try {
        if (editId) { await db.collection('recipes').doc(editId).update(data); alert('✅ Updated!'); }
        else { data.createdAt = getServerTimestamp(); data.createdBy = currentUser.nickname; await db.collection('recipes').add(data); alert('✅ Added!'); }
        closeRecipeModal();
    } catch (e) { alert('❌ ' + e.message); }
}

function openDeleteRecipeModal(id, name) {
    deleteRecipeId = id;
    document.getElementById('deleteRecipeName').textContent = name;
    document.getElementById('deleteRecipeModal').style.display = 'flex';
}
function closeDeleteRecipeModal() { document.getElementById('deleteRecipeModal').style.display = 'none'; }
async function confirmDeleteRecipe() {
    try { await db.collection('recipes').doc(deleteRecipeId).delete(); alert('✅ Deleted!'); closeDeleteRecipeModal(); }
    catch (e) { alert('❌ ' + e.message); }
}

// ═══════ TAB 2: STAFF MEALS ═══════
function loadStaffMeals() {
    db.collection('staffMeals').orderBy('date', 'desc').onSnapshot((snap) => {
        allStaffMeals = [];
        snap.forEach(doc => allStaffMeals.push({ id: doc.id, ...doc.data() }));
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('statStaffMeals').textContent = allStaffMeals.filter(m => m.date === today).length;
        filterStaffMeals();
    });
}

function filterStaffMeals() {
    const fromDate = document.getElementById('filterMealFromDate').value;
    const toDate = document.getElementById('filterMealToDate').value;
    const staffId = document.getElementById('filterMealStaff').value;
    filteredMeals = allStaffMeals.filter(m => {
        if (fromDate && m.date < fromDate) return false;
        if (toDate && m.date > toDate) return false;
        if (staffId && !(m.staffIds || []).includes(staffId)) return false;
        return true;
    });
    renderStaffMeals(filteredMeals);
}

function resetMealFilters() {
    document.getElementById('filterMealFromDate').value = '';
    document.getElementById('filterMealToDate').value = '';
    document.getElementById('filterMealStaff').value = '';
    filterStaffMeals();
}

function renderStaffMeals(meals) {
    const list = document.getElementById('staffMealsList');
    if (meals.length === 0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No staff meals found.</div>'; return; }
    let html = '';
    meals.forEach(m => {
        const staffNames = (m.staffNames || []).join(', ');
        const menuItems = (m.menuItems || []).map(mi => `${mi.recipeName} ×${mi.quantity}`).join(', ');
        const ingredients = (m.ingredients || []).map(i => `${i.itemName} ${dispQty(i.quantity)}${i.unit}`).join(', ');
        const hasIssue = m.hasStockIssue;
        let actions = '';
        if (myPerms.delete) actions += `<button class="btn-delete" onclick="openDeleteMealModal('${m.id}')">🗑️ Delete</button>`;
        html += `<div class="record-card ${hasIssue ? 'has-issue' : ''}"><div class="record-card-header"><div><span class="record-date-badge">📅 ${m.date}</span><span style="color:#888; font-size:12px; margin-left:8px;">👥 ${(m.staffIds || []).length} staff</span>${hasIssue ? '<span class="issue-flag-badge">⚠️ Issue</span>' : ''}</div><span class="record-cost-badge">Rs. ${(m.totalCost || 0).toFixed(2)}</span></div><div class="record-staff-list"><strong>Staff:</strong> ${staffNames || 'N/A'}</div>${menuItems ? `<div class="record-items-list">🍽️ <strong>Menu:</strong> ${menuItems}</div>` : ''}${ingredients ? `<div class="record-items-list">🧪 <strong>Ingredients:</strong> ${ingredients}</div>` : ''}${m.notes ? `<div class="record-items-list" style="color:#888;">📝 ${m.notes}</div>` : ''}<div style="font-size:11px; color:#666; margin-top:6px;">Per staff: Rs. ${((m.totalCost || 0) / ((m.staffIds || []).length || 1)).toFixed(2)}</div>${actions ? `<div class="record-actions">${actions}</div>` : ''}</div>`;
    });
    list.innerHTML = html;
}

function openAddMealModal() {
    if (allEmployees.length === 0) { alert('⚠️ No employees!'); return; }
    document.getElementById('mealDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('mealNotes').value = '';
    document.getElementById('editMealId').value = '';
    document.getElementById('mealMenuItemsList').innerHTML = '';
    document.getElementById('mealIngredientsList').innerHTML = '';
    document.getElementById('mealStockWarning').classList.remove('show');
    mealMenuItemRowCount = 0;
    mealIngRowCount = 0;
    selectedStaffIds = [];
    renderStaffSelectGrid();
    calculateMealCost();
    document.getElementById('mealModal').style.display = 'flex';
}

function renderStaffSelectGrid() {
    const grid = document.getElementById('staffSelectGrid');
    let html = '';
    allEmployees.forEach(emp => {
        const isSelected = selectedStaffIds.includes(emp.id);
        html += `<div class="staff-check-card ${isSelected ? 'selected' : ''}" onclick="toggleStaffSelect('${emp.id}')"><input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation();" onchange="toggleStaffSelect('${emp.id}')"><div><div class="staff-name">${emp.name}</div><div class="staff-role">${emp.access || ''}</div></div></div>`;
    });
    grid.innerHTML = html;
}

function toggleStaffSelect(empId) {
    const idx = selectedStaffIds.indexOf(empId);
    if (idx > -1) selectedStaffIds.splice(idx, 1);
    else selectedStaffIds.push(empId);
    renderStaffSelectGrid();
    calculateMealCost();
}

function addMealMenuItemRow() {
    const container = document.getElementById('mealMenuItemsList');
    const rowId = 'meal-menu-' + mealMenuItemRowCount;
    let optionsHtml = '<option value="">-- Select Recipe --</option>';
    allRecipes.forEach(r => {
        optionsHtml += `<option value="${r.id}" data-cost="${r.fullCost || 0}">${r.recipeName} (Rs. ${(r.fullCost || 0).toFixed(2)})</option>`;
    });
    const row = document.createElement('div');
    row.className = 'meal-item-row';
    row.id = rowId;
    row.innerHTML = `<select class="meal-recipe-select" onchange="calculateMealCost()">${optionsHtml}</select><input type="number" class="meal-qty" placeholder="Qty" min="1" value="1" oninput="calculateMealCost()"><span class="meal-cost-display">Rs. 0</span><button type="button" class="btn-remove-ing" onclick="removeMealRow('${rowId}')">✕</button>`;
    container.appendChild(row);
    mealMenuItemRowCount++;
}

function addMealIngredientRow() {
    const container = document.getElementById('mealIngredientsList');
    const rowId = 'meal-ing-' + mealIngRowCount;
    let optionsHtml = '<option value="">-- Select Item --</option>';
    allInventoryItems.forEach(item => {
        optionsHtml += `<option value="${item.id}" data-unit="${item.unit}" data-price="${item.pricePerUnit || 0}">${item.itemName} (${dispQty(item.currentStock)} ${item.unit})</option>`;
    });
    const row = document.createElement('div');
    row.className = 'meal-item-row';
    row.id = rowId;
    row.innerHTML = `<select class="meal-ing-select" onchange="calculateMealCost()">${optionsHtml}</select><input type="number" class="meal-ing-qty" placeholder="Qty" step="0.001" oninput="calculateMealCost()"><span class="meal-cost-display">Rs. 0</span><button type="button" class="btn-remove-ing" onclick="removeMealRow('${rowId}')">✕</button>`;
    container.appendChild(row);
    mealIngRowCount++;
}

function removeMealRow(rowId) { document.getElementById(rowId).remove(); calculateMealCost(); }
function calculateMealCost() {
    let menuCost = 0;
    const stockNeeded = {};
    document.querySelectorAll('#mealMenuItemsList .meal-item-row').forEach(row => {
        const select = row.querySelector('.meal-recipe-select');
        const qty = parseFloat(row.querySelector('.meal-qty').value) || 0;
        const display = row.querySelector('.meal-cost-display');
        if (select.value && qty > 0) {
            const cost = parseFloat(select.selectedOptions[0].dataset.cost) || 0;
            const total = cost * qty;
            menuCost += total;
            display.textContent = 'Rs. ' + total.toFixed(2);
            const recipe = allRecipes.find(r => r.id === select.value);
            if (recipe) {
                (recipe.ingredients || []).forEach(ing => {
                    stockNeeded[ing.itemId] = (stockNeeded[ing.itemId] || 0) + (ing.quantity * qty);
                });
            }
        } else display.textContent = 'Rs. 0';
    });
    let ingCost = 0;
    document.querySelectorAll('#mealIngredientsList .meal-item-row').forEach(row => {
        const select = row.querySelector('.meal-ing-select');
        const qty = parseFloat(row.querySelector('.meal-ing-qty').value) || 0;
        const display = row.querySelector('.meal-cost-display');
        if (select.value && qty > 0) {
            const price = parseFloat(select.selectedOptions[0].dataset.price) || 0;
            const total = price * qty;
            ingCost += total;
            display.textContent = 'Rs. ' + total.toFixed(2);
            stockNeeded[select.value] = (stockNeeded[select.value] || 0) + qty;
        } else display.textContent = 'Rs. 0';
    });
    const total = menuCost + ingCost;
    const staffCount = selectedStaffIds.length || 1;
    const perStaff = total / staffCount;
    document.getElementById('mealMenuCost').textContent = 'Rs. ' + menuCost.toFixed(2);
    document.getElementById('mealIngCost').textContent = 'Rs. ' + ingCost.toFixed(2);
    document.getElementById('mealTotalCost').innerHTML = '<strong>Rs. ' + total.toFixed(2) + '</strong>';
    document.getElementById('mealPerStaffCost').textContent = 'Rs. ' + perStaff.toFixed(2);
    const issues = checkStockShortage(stockNeeded);
    renderStockIssueWarning(issues, document.getElementById('mealStockWarning'), document.getElementById('mealIssueList'), document.getElementById('saveMealBtn'));
}

function closeMealModal() { document.getElementById('mealModal').style.display = 'none'; }

async function saveStaffMeal() {
    const date = document.getElementById('mealDate').value;
    const notes = document.getElementById('mealNotes').value.trim();
    if (!date) { alert('⚠️ Date!'); return; }
    if (selectedStaffIds.length === 0) { alert('⚠️ Select staff!'); return; }
    const menuItems = [];
    let menuCost = 0;
    const stockToDeduct = {};
    document.querySelectorAll('#mealMenuItemsList .meal-item-row').forEach(row => {
        const select = row.querySelector('.meal-recipe-select');
        const qty = parseFloat(row.querySelector('.meal-qty').value) || 0;
        if (select.value && qty > 0) {
            const recipe = allRecipes.find(r => r.id === select.value);
            if (recipe) {
                const cost = (recipe.fullCost || 0) * qty;
                menuCost += cost;
                menuItems.push({ recipeId: recipe.id, recipeName: recipe.recipeName, quantity: qty, cost: cost });
                (recipe.ingredients || []).forEach(ing => {
                    stockToDeduct[ing.itemId] = (stockToDeduct[ing.itemId] || 0) + (ing.quantity * qty);
                });
            }
        }
    });
    const ingredients = [];
    let ingCost = 0;
    document.querySelectorAll('#mealIngredientsList .meal-item-row').forEach(row => {
        const select = row.querySelector('.meal-ing-select');
        const qty = parseFloat(row.querySelector('.meal-ing-qty').value) || 0;
        if (select.value && qty > 0) {
            const item = allInventoryItems.find(i => i.id === select.value);
            if (item) {
                const cost = (item.pricePerUnit || 0) * qty;
                ingCost += cost;
                ingredients.push({ itemId: item.id, itemName: item.itemName, quantity: fmtQty(qty), unit: item.unit, cost: cost });
                stockToDeduct[item.id] = (stockToDeduct[item.id] || 0) + qty;
            }
        }
    });
    if (menuItems.length === 0 && ingredients.length === 0) { alert('⚠️ Add items!'); return; }
    const stockIssues = checkStockShortage(stockToDeduct);
    const hasStockIssue = stockIssues.length > 0;
    if (hasStockIssue) {
        if (!confirm(`⚠️ Stock Shortage!\n${stockIssues.length} items short.\nContinue?`)) return;
    }
    const totalCost = menuCost + ingCost;
    const staffNames = selectedStaffIds.map(id => {
        const emp = allEmployees.find(e => e.id === id);
        return emp ? emp.name : 'Unknown';
    });
    const mealData = { date, staffIds: selectedStaffIds, staffNames, menuItems, ingredients, menuCost, ingredientsCost: ingCost, totalCost, perStaffCost: totalCost / selectedStaffIds.length, notes, hasStockIssue, stockIssueCount: stockIssues.length, createdAt: getServerTimestamp(), createdBy: currentUser.nickname };
    try {
        await db.collection('staffMeals').add(mealData);
        for (const itemId in stockToDeduct) {
            const item = allInventoryItems.find(i => i.id === itemId);
            if (item) {
                const newStock = fmtQty(item.currentStock - stockToDeduct[itemId]);
                await db.collection('inventoryItems').doc(itemId).update({ currentStock: newStock, updatedAt: getServerTimestamp(), updatedBy: currentUser.nickname });
                await db.collection('stockMovements').add({ itemId, itemName: item.itemName, type: 'OUT', quantity: fmtQty(stockToDeduct[itemId]), reason: 'Staff meal', previousStock: fmtQty(item.currentStock), newStock, date, handledBy: currentUser.nickname, handledByName: currentUser.name, createdAt: getServerTimestamp() });
            }
        }
        alert('✅ Saved!');
        closeMealModal();
        await loadInventoryItems();
    } catch (e) { alert('❌ ' + e.message); }
}

function openDeleteMealModal(id) { deleteMealId = id; document.getElementById('deleteMealModal').style.display = 'flex'; }
function closeDeleteMealModal() { document.getElementById('deleteMealModal').style.display = 'none'; }
async function confirmDeleteMeal() {
    try { await db.collection('staffMeals').doc(deleteMealId).delete(); alert('✅ Deleted!'); closeDeleteMealModal(); }
    catch (e) { alert('❌ ' + e.message); }
}


// ═══════ TAB 3: WASTAGE ═══════
function loadWastage() {
    db.collection('wastage').orderBy('date', 'desc').onSnapshot((snap) => {
        allWastage = [];
        snap.forEach(doc => allWastage.push({ id: doc.id, ...doc.data() }));
        const today = new Date().toISOString().split('T')[0];
        const todayWaste = allWastage.filter(w => w.date === today).reduce((s, w) => s + (w.costLoss || 0), 0);
        document.getElementById('statWastage').textContent = 'Rs. ' + todayWaste.toFixed(0);
        filterWastage();
    });
}

function filterWastage() {
    const fromDate = document.getElementById('filterWasteFromDate').value;
    const toDate = document.getElementById('filterWasteToDate').value;
    const reason = document.getElementById('filterWasteReason').value;
    filteredWastage = allWastage.filter(w => {
        if (fromDate && w.date < fromDate) return false;
        if (toDate && w.date > toDate) return false;
        if (reason && w.reason !== reason) return false;
        return true;
    });
    renderWastage(filteredWastage);
}

function resetWasteFilters() {
    document.getElementById('filterWasteFromDate').value = '';
    document.getElementById('filterWasteToDate').value = '';
    document.getElementById('filterWasteReason').value = '';
    filterWastage();
}

function renderWastage(wastage) {
    const list = document.getElementById('wastageList');
    if (wastage.length === 0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No wastage.</div>'; return; }
    let html = '';
    wastage.forEach(w => {
        let actions = '';
        if (myPerms.delete) actions += `<button class="btn-delete" onclick="openDeleteWasteModal('${w.id}')">🗑️ Delete</button>`;
        html += `<div class="record-card"><div class="record-card-header"><div><span class="record-date-badge">📅 ${w.date}</span><span class="reason-badge ${w.reason}" style="margin-left:8px;">${w.reason}</span></div><span class="record-cost-badge">Rs. ${(w.costLoss || 0).toFixed(2)}</span></div><div class="record-items-list"><strong>📦 ${w.itemName}</strong> — ${dispQty(w.quantity)} ${w.unit}</div>${w.notes ? `<div class="record-items-list" style="color:#888;">📝 ${w.notes}</div>` : ''}<div style="font-size:11px; color:#666; margin-top:6px;">By: ${w.reportedBy || 'N/A'}</div>${actions ? `<div class="record-actions">${actions}</div>` : ''}</div>`;
    });
    list.innerHTML = html;
}

function openAddWasteModal() {
    if (allInventoryItems.length === 0) { alert('⚠️ No items!'); return; }
    document.getElementById('wasteDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('wasteItem').value = '';
    document.getElementById('wasteQuantity').value = '';
    document.getElementById('wasteUnit').value = '';
    document.getElementById('wasteReason').value = '';
    document.getElementById('wasteNotes').value = '';
    document.getElementById('editWasteId').value = '';
    document.getElementById('wasteCostDisplay').innerHTML = '<strong>Rs. 0.00</strong>';
    document.getElementById('wasteStockWarning').classList.remove('show');
    document.getElementById('wasteModal').style.display = 'flex';
}

function updateWasteCost() {
    const select = document.getElementById('wasteItem');
    const qty = parseFloat(document.getElementById('wasteQuantity').value) || 0;
    if (select.value) {
        const option = select.selectedOptions[0];
        document.getElementById('wasteUnit').value = option.dataset.unit;
        const price = parseFloat(option.dataset.price) || 0;
        const cost = price * qty;
        document.getElementById('wasteCostDisplay').innerHTML = '<strong>Rs. ' + cost.toFixed(2) + '</strong>';
        const stockNeeded = { [select.value]: qty };
        const issues = checkStockShortage(stockNeeded);
        renderStockIssueWarning(issues, document.getElementById('wasteStockWarning'), document.getElementById('wasteIssueList'), null);
    }
}

function closeWasteModal() { document.getElementById('wasteModal').style.display = 'none'; }

async function saveWastage() {
    const date = document.getElementById('wasteDate').value;
    const itemId = document.getElementById('wasteItem').value;
    const quantity = parseFloat(document.getElementById('wasteQuantity').value) || 0;
    const reason = document.getElementById('wasteReason').value;
    const notes = document.getElementById('wasteNotes').value.trim();
    if (!date || !itemId || !quantity || !reason) { alert('⚠️ Required!'); return; }
    const item = allInventoryItems.find(i => i.id === itemId);
    if (!item) return;
    const costLoss = (item.pricePerUnit || 0) * quantity;
    const wasteData = { date, itemId, itemName: item.itemName, quantity: fmtQty(quantity), unit: item.unit, reason, costLoss, notes, reportedBy: currentUser.nickname, reportedByName: currentUser.name, createdAt: getServerTimestamp() };
    try {
        await db.collection('wastage').add(wasteData);
        const newStock = fmtQty(item.currentStock - quantity);
        await db.collection('inventoryItems').doc(itemId).update({ currentStock: newStock, updatedAt: getServerTimestamp(), updatedBy: currentUser.nickname });
        await db.collection('stockMovements').add({ itemId, itemName: item.itemName, type: 'OUT', quantity: fmtQty(quantity), reason: 'Wastage: ' + reason, previousStock: fmtQty(item.currentStock), newStock, date, handledBy: currentUser.nickname, handledByName: currentUser.name, createdAt: getServerTimestamp() });
        alert('✅ Saved!');
        closeWasteModal();
        await loadInventoryItems();
    } catch (e) { alert('❌ ' + e.message); }
}

function openDeleteWasteModal(id) { deleteWasteId = id; document.getElementById('deleteWasteModal').style.display = 'flex'; }
function closeDeleteWasteModal() { document.getElementById('deleteWasteModal').style.display = 'none'; }
async function confirmDeleteWaste() {
    try { await db.collection('wastage').doc(deleteWasteId).delete(); alert('✅ Deleted!'); closeDeleteWasteModal(); }
    catch (e) { alert('❌ ' + e.message); }
}


// ═══════ TAB 4: STOCK COUNT ═══════
function initStockCountTab() {
    document.getElementById('countDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('countNotes').value = '';
    currentCountItems = allInventoryItems.map(item => ({
        itemId: item.id, itemName: item.itemName, category: item.category,
        unit: item.unit, systemStock: item.currentStock,
        physicalCount: null, difference: 0, differencePercent: 0,
        costImpact: 0, pricePerUnit: item.pricePerUnit || 0,
        status: 'pending', rechecked: false, needsRecheck: false, skipped: false
    }));
    populateCountCategoryFilter();
    renderCountItems();
    updateCountSummary();
}

function populateCountCategoryFilter() {
    const select = document.getElementById('countCategoryFilter');
    const cats = [...new Set(allInventoryItems.map(i => i.category).filter(Boolean))].sort();
    select.innerHTML = '<option value="">🏷️ All Categories</option>';
    cats.forEach(c => { select.innerHTML += `<option value="${c}">${c}</option>`; });
}

function renderCountItems() {
    const tbody = document.getElementById('countItemsTableBody');
    const search = document.getElementById('countSearchInput').value.toLowerCase();
    const catFilter = document.getElementById('countCategoryFilter').value;
    const filtered = currentCountItems.filter(i => {
        if (search && !i.itemName.toLowerCase().includes(search)) return false;
        if (catFilter && i.category !== catFilter) return false;
        return true;
    });
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#888;">📭 No items.</td></tr>';
        return;
    }
    let html = '';
    filtered.forEach((item, i) => {
        const isCounted = item.physicalCount !== null;
        const rowClass = item.skipped ? 'row-skipped' : !isCounted ? '' : 'row-' + item.status;
        const inputClass = item.needsRecheck && !item.rechecked ? 'count-input flagged' : 'count-input';
        let diffDisplay = '<span style="color:#666;">-</span>';
        let statusDisplay = '<span style="color:#666;">-</span>';
        let costDisplay = '<span style="color:#666;">-</span>';
        if (isCounted) {
            const sign = item.difference >= 0 ? '+' : '';
            diffDisplay = `<span class="diff-display ${item.status}">${sign}${dispQty(item.difference)} ${item.unit}</span>`;
            const labels = { match: '✓ Match', surplus: '⬆️ Surplus', shortage: '⬇️ Short', critical: '⚠️ CRITICAL' };
            const recheck = item.rechecked ? ' ✓' : '';
            statusDisplay = `<span class="row-status-badge ${item.status}">${labels[item.status]}${recheck}</span>`;
            const impactSign = item.costImpact >= 0 ? '+' : '';
            const impactColor = item.costImpact >= 0 ? '#4CAF50' : '#ff4444';
            costDisplay = `<span style="color:${impactColor}; font-weight:600;">${impactSign}Rs. ${Math.abs(item.costImpact).toFixed(2)}</span>`;
        }
        const skipClass = item.skipped ? 'skip-btn skipped' : 'skip-btn';
        const skipText = item.skipped ? '↩️ Unskip' : '🚫 Skip';
        html += `<tr class="${rowClass}"><td data-label="#">${i + 1}</td><td data-label="Item"><strong>${item.itemName}</strong></td><td data-label="System">${dispQty(item.systemStock)} ${item.unit}</td><td data-label="Physical">${item.skipped ? '<span style="color:#888;">Skipped</span>' : `<input type="number" class="${inputClass}" step="0.001" value="${item.physicalCount !== null ? item.physicalCount : ''}" oninput="updateCountItem('${item.itemId}', this.value)"> ${item.unit}`}</td><td data-label="Diff">${diffDisplay}</td><td data-label="Status">${statusDisplay}</td><td data-label="Cost">${costDisplay}</td><td data-label="Action"><button class="${skipClass}" onclick="toggleSkipItem('${item.itemId}')">${skipText}</button></td></tr>`;
    });
    tbody.innerHTML = html;
}

function updateCountItem(itemId, value) {
    const item = currentCountItems.find(i => i.itemId === itemId);
    if (!item) return;
    const physical = value === '' ? null : parseFloat(value);
    item.physicalCount = physical;
    item.skipped = false;
    if (physical === null) {
        item.difference = 0; item.differencePercent = 0; item.costImpact = 0;
        item.status = 'pending'; item.needsRecheck = false; item.rechecked = false;
    } else {
        item.difference = fmtQty(physical - item.systemStock);
        item.differencePercent = item.systemStock !== 0 ? Math.abs(item.difference / item.systemStock) * 100 : (item.difference !== 0 ? 100 : 0);
        item.costImpact = fmtQty(item.difference * item.pricePerUnit);
        if (item.difference === 0) { item.status = 'match'; item.needsRecheck = false; }
        else if (item.differencePercent > 20) { item.status = 'critical'; item.needsRecheck = true; }
        else if (item.difference > 0) { item.status = 'surplus'; item.needsRecheck = false; }
        else { item.status = 'shortage'; item.needsRecheck = false; }
    }
    updateCountSummary();
    updateRecheckWarning();
}

function toggleSkipItem(itemId) {
    const item = currentCountItems.find(i => i.itemId === itemId);
    if (!item) return;
    item.skipped = !item.skipped;
    if (item.skipped) { item.physicalCount = null; item.difference = 0; item.costImpact = 0; item.status = 'pending'; item.needsRecheck = false; }
    renderCountItems();
    updateCountSummary();
    updateRecheckWarning();
}

function fillAllSystemStock() {
    if (!confirm('All physical = system stock?')) return;
    currentCountItems.forEach(item => {
        if (!item.skipped) {
            item.physicalCount = item.systemStock;
            item.difference = 0; item.differencePercent = 0; item.costImpact = 0;
            item.status = 'match'; item.needsRecheck = false; item.rechecked = false;
        }
    });
    renderCountItems();
    updateCountSummary();
    updateRecheckWarning();
}

function clearAllCounts() {
    if (!confirm('Clear all?')) return;
    currentCountItems.forEach(item => {
        item.physicalCount = null; item.difference = 0; item.costImpact = 0;
        item.status = 'pending'; item.needsRecheck = false; item.rechecked = false; item.skipped = false;
    });
    renderCountItems();
    updateCountSummary();
    updateRecheckWarning();
}

function updateCountSummary() {
    const counted = currentCountItems.filter(i => i.physicalCount !== null && !i.skipped);
    const matches = counted.filter(i => i.status === 'match').length;
    const surplus = counted.filter(i => i.status === 'surplus').length;
    const shortages = counted.filter(i => i.status === 'shortage').length;
    const critical = counted.filter(i => i.status === 'critical').length;
    const flagged = counted.filter(i => i.needsRecheck && !i.rechecked).length;
    const totalImpact = counted.reduce((s, i) => s + i.costImpact, 0);
    document.getElementById('sumMatches').textContent = matches;
    document.getElementById('sumSurplus').textContent = surplus;
    document.getElementById('sumShortages').textContent = shortages;
    document.getElementById('sumCritical').textContent = critical;
    const impactColor = totalImpact >= 0 ? 'green' : 'red';
    const impactSign = totalImpact >= 0 ? '+' : '';
    const impactEl = document.getElementById('sumTotalImpact');
    impactEl.className = 'csi-value ' + impactColor;
    impactEl.textContent = impactSign + 'Rs. ' + Math.abs(totalImpact).toFixed(0);
    const submitBtn = document.getElementById('submitCountBtn');
    if (flagged > 0) { submitBtn.disabled = true; submitBtn.textContent = `⚠️ Recheck ${flagged} items`; }
    else if (counted.length === 0) { submitBtn.disabled = true; submitBtn.textContent = '📤 Count items first'; }
    else { submitBtn.disabled = false; submitBtn.textContent = '📤 Submit for Approval'; }
}

function updateRecheckWarning() {
    const warningEl = document.getElementById('recheckWarning');
    const listEl = document.getElementById('recheckItemsList');
    const flagged = currentCountItems.filter(i => i.needsRecheck && !i.rechecked && !i.skipped);
    if (flagged.length === 0) { warningEl.classList.remove('show'); return; }
    let html = '';
    flagged.forEach(item => {
        const sign = item.difference >= 0 ? '+' : '';
        html += `<div class="recheck-item"><span class="ri-name">📦 ${item.itemName} (${item.differencePercent.toFixed(1)}%)</span><span class="ri-diff">${sign}${dispQty(item.difference)} ${item.unit}</span></div>`;
    });
    listEl.innerHTML = html;
    warningEl.classList.add('show');
}

function markAllRechecked() {
    const flagged = currentCountItems.filter(i => i.needsRecheck && !i.rechecked && !i.skipped);
    if (flagged.length === 0) return;
    if (!confirm(`Mark ${flagged.length} as rechecked?`)) return;
    flagged.forEach(i => i.rechecked = true);
    renderCountItems();
    updateCountSummary();
    updateRecheckWarning();
}

function showCountSubTab(name, btnEl) {
    document.querySelectorAll('.count-subtab').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('countsubtab-' + name).style.display = 'block';
    if (btnEl) btnEl.classList.add('active');
    if (name === 'new') initStockCountTab();
    if (name === 'pending') renderPendingCounts();
    if (name === 'approved') renderApprovedCounts();
    if (name === 'rejected') {
        renderRejectedCounts();
        allStockCounts.filter(c => c.status === 'rejected').forEach(c => seenRejectedIds.add(c.id));
        localStorage.setItem('seenRejectedIds_' + currentUser.id, JSON.stringify([...seenRejectedIds]));
        updateTabBadges();
        updateDashboardAlert();
    }
    if (name === 'history') renderCountHistory();
}

function cancelCount() {
    if (!confirm('Cancel?')) return;
    initStockCountTab();
}

async function submitCountForApproval() {
    const date = document.getElementById('countDate').value;
    const notes = document.getElementById('countNotes').value.trim();
    if (!date) { alert('⚠️ Date!'); return; }

    const existingPending = allStockCounts.filter(c => c.status === 'pending_approval');
    if (existingPending.length > 0) {
        alert(`⚠️ Pending count එකක් already තියෙනවා!\nManager review කරනකන් wait කරන්න.`);
        return;
    }

    const counted = currentCountItems.filter(i => i.physicalCount !== null && !i.skipped);
    if (counted.length === 0) { alert('⚠️ Count items first!'); return; }

    const flagged = counted.filter(i => i.needsRecheck && !i.rechecked);
    if (flagged.length > 0) { alert(`⚠️ ${flagged.length} items not rechecked!`); return; }

    const recountFromId = sessionStorage.getItem('recountFromId');
    const recountFromRejected = recountFromId ? allStockCounts.find(c => c.id === recountFromId && c.status === 'rejected') : null;

    let confirmMsg = `Submit for Manager Approval?\n📦 Items: ${counted.length}`;
    if (recountFromRejected) {
        confirmMsg = `🔄 Recount Submit?\n\n❌ පරණ rejected count එක archive වෙනවා.\n📤 අලුත් count එක Pending තියෙනවා.\n\n📦 Items: ${counted.length}`;
    }

    if (!confirm(confirmMsg)) return;

    const data = {
        date, notes, status: 'pending_approval',
        items: counted.map(i => ({
            itemId: i.itemId, itemName: i.itemName, category: i.category,
            unit: i.unit, systemStock: fmtQty(i.systemStock), physicalCount: fmtQty(i.physicalCount),
            difference: fmtQty(i.difference), differencePercent: i.differencePercent,
            costImpact: fmtQty(i.costImpact), pricePerUnit: i.pricePerUnit,
            status: i.status, rechecked: i.rechecked
        })),
        totalItems: currentCountItems.length, itemsCounted: counted.length,
        itemsSkipped: currentCountItems.filter(i => i.skipped).length,
        differencesFound: counted.filter(i => i.status !== 'match').length,
        criticalIssues: counted.filter(i => i.status === 'critical').length,
        totalCostImpact: fmtQty(counted.reduce((s, i) => s + i.costImpact, 0)),
        approvedBy: null, approvedByName: null, approvedAt: null,
        approvalNotes: '', rejectedReason: '',
        performedBy: currentUser.nickname, performedByName: currentUser.name,
        createdAt: getServerTimestamp(),
        isRecount: !!recountFromRejected,
        recountFromId: recountFromRejected ? recountFromRejected.id : null
    };

    try {
        await db.collection('stockCounts').add(data);

        if (recountFromRejected) {
            await db.collection('stockCounts').doc(recountFromRejected.id).update({
                status: 'archived',
                archivedAt: getServerTimestamp(),
                archivedReason: 'Recounted - new submission pending'
            });
            sessionStorage.removeItem('recountFromId');
        }

        alert(recountFromRejected
            ? '✅ Recount Submitted!\n❌ Rejected eka archived.\n⏳ අලුත් count Pending තියෙනවා.'
            : '✅ Submitted!\nReports DB එකේ Manager review කරයි.');

        showCountSubTab('pending', document.getElementById('subtab-pending'));
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

function renderPendingCounts() {
    const list = document.getElementById('pendingCountsList');
    if (!list) return;
    const pending = allStockCounts.filter(c => c.status === 'pending_approval');
    if (pending.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">✅ No pending approvals!</div>';
        return;
    }
    let html = '';
    pending.forEach(count => {
        const sign = count.totalCostImpact >= 0 ? '+' : '';
        const color = count.totalCostImpact >= 0 ? '#4CAF50' : '#ff4444';
        html += `<div class="status-count-card pending">
            <div class="scc-header">
                <div class="scc-left">
                    <span class="scc-date-badge">📅 ${count.date}</span>
                    <span class="scc-status-badge pending_approval">⏳ Pending</span>
                </div>
                <span style="font-size:11px; color:#888;">By: ${count.performedByName}</span>
            </div>
            <div class="scc-stats">
                <div class="scc-stat"><div class="scs-value">${count.itemsCounted}</div><div class="scs-label">Counted</div></div>
                <div class="scc-stat"><div class="scs-value">${count.differencesFound}</div><div class="scs-label">Diffs</div></div>
                <div class="scc-stat"><div class="scs-value" style="color:#ff4444;">${count.criticalIssues}</div><div class="scs-label">Critical</div></div>
                <div class="scc-stat"><div class="scs-value" style="color:${color};">${sign}Rs.${Math.abs(count.totalCostImpact).toFixed(0)}</div><div class="scs-label">Impact</div></div>
            </div>
            ${count.notes ? `<div style="font-size:12px; color:#aaa;">📝 ${count.notes}</div>` : ''}
            <div class="scc-message">⏳ <strong>Waiting for Manager Approval</strong> Reports DB එකේ review වෙනවා.</div>
            <div class="scc-actions">
                <button class="scc-btn view" onclick="viewCountDetails('${count.id}')">👁️ View</button>
                ${isManagerUser() ? `<button class="scc-btn view" onclick="window.location.href='reports.html#pendingapprovals'">📊 Review</button>` : ''}
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function renderApprovedCounts() {
    const list = document.getElementById('approvedCountsList');
    if (!list) return;
    const approved = allStockCounts.filter(c => c.status === 'approved' || c.status === 'suspicious_approved');
    if (approved.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No approved counts yet.</div>';
        return;
    }
    let html = '';
    approved.forEach(count => {
        const sign = count.totalCostImpact >= 0 ? '+' : '';
        const color = count.totalCostImpact >= 0 ? '#4CAF50' : '#ff4444';
        const isSuspicious = count.status === 'suspicious_approved';
        html += `<div class="status-count-card ${count.status}">
            <div class="scc-header">
                <div class="scc-left">
                    <span class="scc-date-badge">📅 ${count.date}</span>
                    <span class="scc-status-badge ${count.status}">${isSuspicious ? '⚠️ Suspicious Approved' : '✅ Approved'}</span>
                </div>
                <span style="font-size:11px; color:#888;">By: ${count.performedByName}</span>
            </div>
            <div class="scc-stats">
                <div class="scc-stat"><div class="scs-value">${count.itemsCounted}</div><div class="scs-label">Counted</div></div>
                <div class="scc-stat"><div class="scs-value">${count.differencesFound}</div><div class="scs-label">Diffs</div></div>
                <div class="scc-stat"><div class="scs-value" style="color:${color};">${sign}Rs.${Math.abs(count.totalCostImpact).toFixed(0)}</div><div class="scs-label">Impact</div></div>
            </div>
            <div class="scc-message ${isSuspicious ? 'suspicious' : 'approve'}">
                <strong>${isSuspicious ? '⚠️ Suspicious Approve' : '✅ Approved by ' + (count.approvedByName || 'Manager')}</strong>
                ${count.approvalNotes ? `📝 ${count.approvalNotes}` : ''}
                ${isSuspicious && count.suspiciousReason ? `<br>🚨 ${count.suspiciousReason}<br>📊 Stock Issues Report එකේ investigation pending.` : ''}
            </div>
            <div class="scc-actions">
                <button class="scc-btn view" onclick="viewCountDetails('${count.id}')">👁️ View Details</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function renderRejectedCounts() {
    const list = document.getElementById('rejectedCountsList');
    if (!list) return;

    const rejected = allStockCounts.filter(c => c.status === 'rejected');

    if (rejected.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">🎉 No active rejected counts!</div>';
        return;
    }

    let html = '';
    rejected.forEach(count => {
        const hasRecount = allStockCounts.some(c => c.recountFromId === count.id && c.status === 'pending_approval');

        html += `<div class="status-count-card rejected">
            <div class="scc-header">
                <div class="scc-left">
                    <span class="scc-date-badge">📅 ${count.date}</span>
                    <span class="scc-status-badge rejected">❌ REJECTED</span>
                </div>
                <span style="font-size:11px; color:#888;">By: ${count.performedByName}</span>
            </div>
            <div class="scc-message reject">
                <strong>❌ Rejected by ${count.approvedByName || 'Manager'}</strong>
                📝 <strong>Reason:</strong> ${count.rejectedReason || 'No reason given'}
                <br>🔄 <strong>Action:</strong> ${hasRecount ? '⏳ Recount Pending Review' : 'Recount කරලා ආයෙ submit කරන්න!'}
            </div>
            <div class="scc-actions">
                <button class="scc-btn view" onclick="viewCountDetails('${count.id}')">👁️ View</button>
                ${!hasRecount ? `<button class="scc-btn recount" onclick="startRecount('${count.id}')">🔄 Start Recount</button>` : ''}
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function startRecount(countId) {
    if (!confirm('🔄 Recount start කරන්නද?\n\n📌 Submit කරාම පරණ rejected count එක Rejected tab එකෙන් archive වෙනවා.')) return;
    sessionStorage.setItem('recountFromId', countId);
    showCountSubTab('new', document.getElementById('subtab-new'));
}

function renderCountHistory() {
    const list = document.getElementById('countHistoryList');
    if (!list) return;
    const fromDate = document.getElementById('historyFromDate')?.value;
    const toDate = document.getElementById('historyToDate')?.value;
    const statusFilter = document.getElementById('historyStatusFilter')?.value;
    const completed = allStockCounts.filter(c => {
        if (c.status === 'pending_approval') return false;
        if (fromDate && c.date < fromDate) return false;
        if (toDate && c.date > toDate) return false;
        if (statusFilter && c.status !== statusFilter) return false;
        return true;
    });
    if (completed.length === 0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#888;">📭 No history.</div>'; return; }
    let html = '';
    completed.forEach(count => {
        const sign = count.totalCostImpact >= 0 ? '+' : '';
        const color = count.totalCostImpact >= 0 ? '#4CAF50' : '#ff4444';
        const icons = { approved: '✅', suspicious_approved: '⚠️', rejected: '❌' };
        html += `<div class="status-count-card ${count.status}">
            <div class="scc-header">
                <div class="scc-left">
                    <span class="scc-date-badge">📅 ${count.date}</span>
                    <span class="scc-status-badge ${count.status}">${icons[count.status]} ${count.status.replace('_', ' ')}</span>
                </div>
                <span style="font-size:11px; color:#888;">By: ${count.performedByName}</span>
            </div>
            <div class="scc-stats">
                <div class="scc-stat"><div class="scs-value">${count.itemsCounted}</div><div class="scs-label">Counted</div></div>
                <div class="scc-stat"><div class="scs-value">${count.differencesFound}</div><div class="scs-label">Diffs</div></div>
                <div class="scc-stat"><div class="scs-value" style="color:${color};">${sign}Rs.${Math.abs(count.totalCostImpact).toFixed(0)}</div><div class="scs-label">Impact</div></div>
            </div>
            <div class="scc-actions">
                <button class="scc-btn view" onclick="viewCountDetails('${count.id}')">👁️ View</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function viewCountDetails(countId) {
    const count = allStockCounts.find(c => c.id === countId);
    if (!count) return;
    document.getElementById('countDetailTitle').textContent = `📊 Count - ${count.date}`;
    let itemsHtml = '<table style="width:100%; font-size:12px;"><tr style="color:#f0a500; font-weight:700;"><td>Item</td><td>System</td><td>Physical</td><td>Diff</td><td>Status</td></tr>';
    count.items.forEach(item => {
        const colors = { match: '#4CAF50', surplus: '#2196F3', shortage: '#f0a500', critical: '#ff4444' };
        const sign = item.difference >= 0 ? '+' : '';
        itemsHtml += `<tr><td>${item.itemName}</td><td>${dispQty(item.systemStock)} ${item.unit}</td><td>${dispQty(item.physicalCount)} ${item.unit}</td><td style="color:${colors[item.status]};">${sign}${dispQty(item.difference)}</td><td style="color:${colors[item.status]};">${item.status}</td></tr>`;
    });
    itemsHtml += '</table>';
    document.getElementById('countDetailBody').innerHTML = `
        <div style="background:#0f3460; padding:12px; border-radius:8px; margin-bottom:10px;">Items: ${count.itemsCounted} | Diffs: ${count.differencesFound} | Critical: ${count.criticalIssues}</div>
        <div style="background:#0f3460; padding:12px; border-radius:8px; overflow-x:auto;">${itemsHtml}</div>
        ${count.notes ? `<div style="margin-top:10px; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; font-size:13px;">📝 ${count.notes}</div>` : ''}`;
    document.getElementById('countDetailModal').style.display = 'flex';
}

function closeCountDetailModal() {
    document.getElementById('countDetailModal').style.display = 'none';
}


// ═══════ TAB 5: KITCHEN REPORTS ═══════
async function generateKitchenReports() {
    const from = document.getElementById('kitRepDateFrom').value;
    const to = document.getElementById('kitRepDateTo').value;
    if (!from || !to) return;
    let recipeHtml = '';
    if (allRecipes.length > 0) {
        const sorted = [...allRecipes].sort((a,b) => b.margin - a.margin).slice(0, 5);
        recipeHtml = sorted.map((r, i) => `<div class="top-recipe-item"><div class="top-recipe-rank">${i+1}</div><div style="flex:1"><div style="font-size:13px; font-weight:600; color:#e0e0e0;">${r.recipeName}</div><div class="report-bar-container"><div class="report-bar-label"><span>Margin</span><span>${r.margin.toFixed(1)}%</span></div><div class="report-bar-bg"><div class="report-bar-fill" style="width:${Math.max(0,r.margin)}%; background:#4CAF50;"></div></div></div></div></div>`).join('');
        recipeHtml += `<div class="report-stat-row"><span class="report-stat-label">Avg Margin:</span><span class="report-stat-value">${(allRecipes.reduce((s,r)=>s+(r.margin||0),0)/allRecipes.length).toFixed(1)}%</span></div>`;
    } else recipeHtml = '<div style="text-align:center; color:#666;">No recipes</div>';
    document.getElementById('repRecipeAnalysis').innerHTML = recipeHtml;
    const filteredM = allStaffMeals.filter(m => m.date >= from && m.date <= to);
    const totalMealCost = filteredM.reduce((s,m) => s + (m.totalCost || 0), 0);
    document.getElementById('repStaffMealTrends').innerHTML = `<div class="report-stat-row"><span class="report-stat-label">Total Meals:</span><span class="report-stat-value">${filteredM.length}</span></div><div class="report-stat-row"><span class="report-stat-label">Total Cost:</span><span class="report-stat-value">Rs. ${totalMealCost.toFixed(0)}</span></div>`;
    const filteredW = allWastage.filter(w => w.date >= from && w.date <= to);
    const totalWasteCost = filteredW.reduce((s,w) => s + (w.costLoss || 0), 0);
    document.getElementById('repWastageSummary').innerHTML = `<div class="report-stat-row"><span class="report-stat-label">Total Loss:</span><span class="report-stat-value" style="color:#ff4444;">Rs. ${totalWasteCost.toFixed(0)}</span></div>`;
    const filteredC = allStockCounts.filter(c => c.date >= from && c.date <= to && c.status !== 'pending_approval');
    const approved = filteredC.filter(c => c.status === 'approved' || c.status === 'suspicious_approved').length;
    const rejected = filteredC.filter(c => c.status === 'rejected').length;
    document.getElementById('repStockCountSummary').innerHTML = `<div class="report-stat-row"><span class="report-stat-label">Total:</span><span class="report-stat-value">${filteredC.length}</span></div><div class="report-stat-row"><span class="report-stat-label">Approved ✅:</span><span class="report-stat-value" style="color:#4CAF50;">${approved}</span></div><div class="report-stat-row"><span class="report-stat-label">Rejected ❌:</span><span class="report-stat-value" style="color:#ff4444;">${rejected}</span></div>`;
}

function resetKitRepFilters() {
    setDefaultDates();
    generateKitchenReports();
}


// ═══════ CLICK OUTSIDE MODAL TO CLOSE ═══════
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
}