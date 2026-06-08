// ════════════════════════════════════════════════════════════
// 📦 INVENTORY DATABASE - COMPLETE JAVASCRIPT
// 📁 File: public/inventory-script.js
// 📅 Version: 10.1 - Architecture Migration!
// ⭐ Uses global DATABASES from firebase-config.js
// ════════════════════════════════════════════════════════════

// ❌ NO DATABASES array! Uses global from firebase-config.js

let currentUser = null;
let myPerms = null;
let allItems = [];
let allCategories = [];
let deleteItemId = '';
let deleteCategoryId = '';

const EMOJI_OPTIONS = [
    '☕', '🥛', '🍞', '🌾', '🥩', '🥬', '❄️', '🧴',
    '📦', '🍰', '🍕', '🍔', '🍟', '🥗', '🍜', '🍝',
    '🥤', '🍺', '🍷', '🧃', '🥃', '🍪', '🍩', '🧁',
    '🥖', '🥨', '🧀', '🍳', '🥓', '🌽', '🥕', '🥒',
    '🍅', '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝',
    '🐟', '🦐', '🍗', '🍖', '🥚', '🌶️', '🧄', '🧅',
    '🔪', '🍴', '🥄', '🥣', '🍽️', '🧂', '🥡', '🛒',
    '🧹', '🧽', '🪣', '🧻', '🔧', '⚙️', '🪜', '📚'
];

const DEFAULT_CATEGORIES = [
    { name: 'Beverages', icon: '☕', description: 'Coffee, Tea, Juices' },
    { name: 'Dairy', icon: '🥛', description: 'Milk, Cheese, Butter' },
    { name: 'Bakery', icon: '🍞', description: 'Bread, Cakes, Pastries' },
    { name: 'Dry Goods', icon: '🌾', description: 'Flour, Sugar, Rice, Salt' },
    { name: 'Meat & Seafood', icon: '🥩', description: 'Chicken, Fish, Beef' },
    { name: 'Fresh Produce', icon: '🥬', description: 'Vegetables, Fruits' },
    { name: 'Frozen', icon: '❄️', description: 'Ice cream, Frozen items' },
    { name: 'Cleaning', icon: '🧴', description: 'Soap, Detergent' },
    { name: 'Supplies', icon: '📦', description: 'Cups, Plates, Napkins' }
];

async function initializeApp() {
    console.log('🚀 Initializing Inventory...');

    // ✅ Global getCurrentUser() use කරනවා
    const userData = getCurrentUser();
    if (!userData) { window.location.href = "login.html"; return; }

    try {
        const userDoc = await db.collection('employees').doc(userData.id).get();
        if (userDoc.exists) {
            const latestData = userDoc.data();
            userData.access = latestData.access;
            userData.permissions = latestData.permissions || {};
            userData.name = latestData.name;
            userData.nickname = latestData.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Could not fetch latest user data:', error);
    }

    const isAdmin = userData.access === 'Admin';
    const perms = userData.permissions?.inventoryDB || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView || perms.edit || perms.delete;

    if (!hasAccess) {
        alert('⛔ ඔයාට Inventory Database එකට access නැහැ!');
        window.location.href = "access.html";
        return;
    }

    myPerms = isAdmin
        ? { add: true, view: true, selfView: true, edit: true, delete: true }
        : perms;

    currentUser = userData;

    console.log('✅ User:', currentUser.name, '|', currentUser.access);
    console.log('🔑 My Perms:', myPerms);

    document.getElementById('welcomeUser').textContent = `👋 Welcome, ${userData.name} (${userData.access})`;

    buildDBSwitcherDropdown();
    setupUI();
    buildEmojiPicker();

    await ensureDefaultCategories();
    await loadCategories();
    loadItems();
}

initializeApp();

// ⭐ NEW: Uses global DATABASES array!
function buildDBSwitcherDropdown() {
    const list = document.getElementById('dbDropdownList');
    if (!list) return;
    
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';

    // ✅ Uses GLOBAL DATABASES from firebase-config.js
    DATABASES.forEach(database => {
        if (database.adminManagerOnly && !isAdminOrMgr) return;

        const isAdmin = currentUser.access === 'Admin';
        const dbPerms = currentUser.permissions?.[database.id] || {};
        const hasAccess = isAdmin || dbPerms.add || dbPerms.view || dbPerms.selfView || dbPerms.edit || dbPerms.delete;

        if (!database.adminManagerOnly && !hasAccess) return;

        const isCurrent = database.id === 'inventoryDB';

        html += `
            <a href="${database.url}" class="db-dropdown-item ${isCurrent ? 'current' : ''}">
                <span>${database.icon}</span>
                <span>${database.name}</span>
                ${isCurrent ? '<span style="margin-left:auto; color:#4CAF50;">✓</span>' : ''}
            </a>
        `;
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
        const dropdown = document.getElementById('dbDropdown');
        if (dropdown && !dropdown.contains(e.target) && !e.target.closest('#dbSwitcher')) {
            dropdown.classList.remove('show');
        }
    });
}

function setupUI() {
    if (myPerms.add) {
        document.getElementById('addItemBtn').style.display = 'inline-block';
    }
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    if (isAdminOrMgr) {
        document.getElementById('addCategoryBtn').style.display = 'inline-block';
    }
}

function showSection(name, btnEl) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    if (btnEl) btnEl.classList.add('active');

    if (name === 'lowstock') loadLowStockItems();
    if (name === 'categories') renderCategoryGrid();
}

async function ensureDefaultCategories() {
    try {
        console.log('🔍 Checking categories collection...');
        const snapshot = await db.collection('inventoryCategories').get();
        console.log('📊 Existing categories:', snapshot.size);

        if (snapshot.empty) {
            console.log('🚀 Creating default categories...');
            for (const cat of DEFAULT_CATEGORIES) {
                try {
                    await db.collection('inventoryCategories').add({
                        name: cat.name,
                        icon: cat.icon,
                        description: cat.description,
                        createdAt: getServerTimestamp(),
                        createdBy: currentUser.nickname
                    });
                    console.log('✅ Created:', cat.name);
                } catch (err) {
                    console.error('❌ Failed:', cat.name, err);
                }
            }
            console.log('🎉 Default categories created!');
        } else {
            console.log('✓ Categories already exist:', snapshot.size);
        }
    } catch (error) {
        console.error('❌ ensureDefaultCategories error:', error);
        alert('⚠️ Categories error!\n\n' + error.message + '\n\nFirebase rules check කරන්න!');
    }
}

async function loadCategories() {
    try {
        console.log('📂 Loading categories...');
        const snapshot = await db.collection('inventoryCategories').orderBy('name').get();
        allCategories = [];
        snapshot.forEach(doc => {
            allCategories.push({ id: doc.id, ...doc.data() });
        });
        console.log('✅ Loaded categories:', allCategories.length);

        renderCategoryDropdowns();
        renderCategoryGrid();
    } catch (error) {
        console.error('❌ Load categories error:', error);
        document.getElementById('categoryGrid').innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#ff4444;">
                ❌ Categories load failed!<br><small>${error.message}</small>
            </div>
        `;
    }
}

function renderCategoryDropdowns() {
    const itemCatSelect = document.getElementById('itemCategory');
    const filterCatSelect = document.getElementById('filterCategory');

    const currentItemVal = itemCatSelect.value;
    const currentFilterVal = filterCatSelect.value;

    itemCatSelect.innerHTML = '<option value="">-- Select Category --</option>';
    filterCatSelect.innerHTML = '<option value="">📂 All Categories</option>';

    allCategories.forEach(cat => {
        itemCatSelect.innerHTML += `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`;
        filterCatSelect.innerHTML += `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`;
    });

    itemCatSelect.value = currentItemVal;
    filterCatSelect.value = currentFilterVal;
}

function renderCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);

    if (allCategories.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#888;">
                📂 No categories yet. Add one!
            </div>
        `;
        return;
    }

    let html = '';
    allCategories.forEach(cat => {
        const itemCount = allItems.filter(i => i.category === cat.name).length;

        const actions = isAdminOrMgr ? `
            <div class="cat-actions">
                <button class="cat-btn edit" onclick="openEditCategoryModal('${cat.id}')" title="Edit">✏️</button>
                <button class="cat-btn delete" onclick="openDeleteCategoryModal('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')" title="Delete">🗑️</button>
            </div>
        ` : '';

        html += `
            <div class="category-card">
                ${actions}
                <div class="cat-icon">${cat.icon}</div>
                <div class="cat-name">${cat.name}</div>
                <div class="cat-desc">${cat.description || '-'}</div>
                <div class="cat-count">📦 ${itemCount} items</div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

function buildEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    let html = '';
    EMOJI_OPTIONS.forEach(emoji => {
        html += `<div class="emoji-option" onclick="selectEmoji('${emoji}', this)">${emoji}</div>`;
    });
    picker.innerHTML = html;
}

function selectEmoji(emoji, el) {
    document.getElementById('categoryIcon').value = emoji;
    document.getElementById('selectedEmojiDisplay').textContent = emoji;
    document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function openAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = '➕ Add New Category';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDesc').value = '';
    document.getElementById('categoryIcon').value = '📦';
    document.getElementById('selectedEmojiDisplay').textContent = '📦';
    document.getElementById('editCategoryId').value = '';
    document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
    document.getElementById('categoryModal').style.display = 'flex';
}

function openEditCategoryModal(catId) {
    const cat = allCategories.find(c => c.id === catId);
    if (!cat) return;

    document.getElementById('categoryModalTitle').textContent = '✏️ Edit Category';
    document.getElementById('categoryName').value = cat.name;
    document.getElementById('categoryDesc').value = cat.description || '';
    document.getElementById('categoryIcon').value = cat.icon || '📦';
    document.getElementById('selectedEmojiDisplay').textContent = cat.icon || '📦';
    document.getElementById('editCategoryId').value = catId;

    document.querySelectorAll('.emoji-option').forEach(o => {
        o.classList.toggle('selected', o.textContent === cat.icon);
    });

    document.getElementById('categoryModal').style.display = 'flex';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

async function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const icon = document.getElementById('categoryIcon').value;
    const description = document.getElementById('categoryDesc').value.trim();
    const editId = document.getElementById('editCategoryId').value;

    if (!name) {
        alert('⚠️ Category name enter කරන්න!');
        return;
    }

    try {
        if (editId) {
            const oldCat = allCategories.find(c => c.id === editId);
            await db.collection('inventoryCategories').doc(editId).update({
                name, icon, description,
                updatedAt: getServerTimestamp()
            });

            if (oldCat && oldCat.name !== name) {
                const itemsToUpdate = allItems.filter(i => i.category === oldCat.name);
                for (const item of itemsToUpdate) {
                    await db.collection('inventoryItems').doc(item.id).update({ category: name });
                }
            }
            alert('✅ Category updated!');
        } else {
            const exist = allCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (exist) {
                alert('⚠️ Category already exists!');
                return;
            }

            await db.collection('inventoryCategories').add({
                name, icon, description,
                createdAt: getServerTimestamp(),
                createdBy: currentUser.nickname
            });
            alert('✅ Category added!');
        }
        closeCategoryModal();
        await loadCategories();
    } catch (error) {
        console.error('Save category error:', error);
        alert('❌ Error: ' + error.message);
    }
}

function openDeleteCategoryModal(catId, catName) {
    deleteCategoryId = catId;
    const itemCount = allItems.filter(i => i.category === catName).length;
    document.getElementById('deleteCategoryName').textContent = catName;

    const warning = document.getElementById('deleteCategoryWarning');
    if (itemCount > 0) {
        warning.innerHTML = `⚠️ This category has <strong>${itemCount} items</strong>. They will become "Uncategorized".`;
    } else {
        warning.textContent = '✓ No items in this category.';
    }

    document.getElementById('deleteCategoryModal').style.display = 'flex';
}

function closeDeleteCategoryModal() {
    document.getElementById('deleteCategoryModal').style.display = 'none';
    deleteCategoryId = '';
}

async function confirmDeleteCategory() {
    if (!deleteCategoryId) return;
    try {
        const cat = allCategories.find(c => c.id === deleteCategoryId);
        if (cat) {
            const itemsToUpdate = allItems.filter(i => i.category === cat.name);
            for (const item of itemsToUpdate) {
                await db.collection('inventoryItems').doc(item.id).update({ category: 'Uncategorized' });
            }
        }
        await db.collection('inventoryCategories').doc(deleteCategoryId).delete();
        alert('✅ Category deleted!');
        closeDeleteCategoryModal();
        await loadCategories();
    } catch (error) {
        console.error('Delete category error:', error);
        alert('❌ Error: ' + error.message);
    }
}

function loadItems() {
    console.log('📦 Setting up items listener...');
    db.collection('inventoryItems').orderBy('itemName').onSnapshot((snapshot) => {
        allItems = [];
        snapshot.forEach(doc => {
            allItems.push({ id: doc.id, ...doc.data() });
        });
        console.log('✅ Items loaded:', allItems.length);

        updateStats();
        filterItems();
        renderCategoryGrid();
    }, (error) => {
        console.error('❌ Items listener error:', error);
    });
}

function updateStats() {
    const total = allItems.length;
    const low = allItems.filter(i => i.currentStock > 0 && i.currentStock <= i.minStock).length;
    const out = allItems.filter(i => i.currentStock <= 0).length;
    const totalValue = allItems.reduce((sum, i) => sum + (i.currentStock * (i.pricePerUnit || 0)), 0);

    document.getElementById('statTotalItems').textContent = total;
    document.getElementById('statLowStock').textContent = low;
    document.getElementById('statOutStock').textContent = out;
    document.getElementById('statTotalValue').textContent = 'Rs. ' + totalValue.toLocaleString('en-LK', {maximumFractionDigits: 2});
}

function filterItems() {
    const search = document.getElementById('searchItem').value.toLowerCase();
    const catFilter = document.getElementById('filterCategory').value;
    const statusFilter = document.getElementById('filterStockStatus').value;

    let filtered = allItems.filter(item => {
        if (search && !item.itemName.toLowerCase().includes(search)) return false;
        if (catFilter && item.category !== catFilter) return false;
        if (statusFilter) {
            const status = getStockStatus(item);
            if (status !== statusFilter) return false;
        }
        return true;
    });

    renderItems(filtered);
}

function getStockStatus(item) {
    if (item.currentStock <= 0) return 'out';
    if (item.currentStock <= item.minStock) return 'low';
    return 'good';
}

function renderItems(items) {
    const tbody = document.getElementById('itemsTableBody');

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:30px; color:#888;">
                    📭 No items found. ${myPerms.add ? 'Click "Add New Item" to start!' : ''}
                </td>
            </tr>
        `;
        return;
    }

    const getCatIcon = (catName) => {
        const cat = allCategories.find(c => c.name === catName);
        return cat ? cat.icon : '📦';
    };

    let html = '';
    items.forEach((item, i) => {
        const status = getStockStatus(item);
        const statusLabels = {
            good: '<span class="stock-badge good">🟢 Good</span>',
            low: '<span class="stock-badge low">🟡 Low</span>',
            out: '<span class="stock-badge out">🔴 Out</span>'
        };
        const stockClasses = {
            good: 'stock-good',
            low: 'stock-low',
            out: 'stock-out'
        };

        let quickActions = '';
        if (myPerms.edit) {
            quickActions = `
                <div class="qty-controls">
                    <button class="btn-stock-in" onclick="openStockModal('${item.id}', 'IN')" title="Stock IN">+</button>
                    <button class="btn-stock-out" onclick="openStockModal('${item.id}', 'OUT')" title="Stock OUT">−</button>
                </div>
            `;
        } else {
            quickActions = '<span style="color:#666; font-size:12px;">-</span>';
        }

        let actions = '';
        if (myPerms.edit) {
            actions += `<button class="btn-edit" onclick="openEditItemModal('${item.id}')">✏️</button>`;
        }
        if (myPerms.delete) {
            actions += `<button class="btn-delete" onclick="openDeleteItemModal('${item.id}', '${item.itemName.replace(/'/g, "\\'")}')">🗑️</button>`;
        }
        if (!actions) actions = '<span style="color:#666; font-size:12px;">-</span>';

        html += `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${item.itemName}</strong></td>
                <td>${getCatIcon(item.category)} ${item.category}</td>
                <td class="${stockClasses[status]}">${item.currentStock} ${item.unit}</td>
                <td style="color:#888;">${item.minStock} ${item.unit}</td>
                <td>Rs. ${(item.pricePerUnit || 0).toFixed(2)}</td>
                <td>${statusLabels[status]}</td>
                <td>${quickActions}</td>
                <td class="action-buttons">${actions}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function loadLowStockItems() {
    const lowItems = allItems.filter(i => i.currentStock <= i.minStock);
    lowItems.sort((a, b) => {
        const aOut = a.currentStock <= 0 ? 0 : 1;
        const bOut = b.currentStock <= 0 ? 0 : 1;
        return aOut - bOut;
    });

    const tbody = document.getElementById('lowStockTableBody');

    if (lowItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:#4CAF50;">
                    ✅ All stocks are healthy! 🎉
                </td>
            </tr>
        `;
        return;
    }

    const getCatIcon = (catName) => {
        const cat = allCategories.find(c => c.name === catName);
        return cat ? cat.icon : '📦';
    };

    let html = '';
    lowItems.forEach((item, i) => {
        const status = getStockStatus(item);
        const statusLabels = {
            low: '<span class="stock-badge low">🟡 LOW STOCK</span>',
            out: '<span class="stock-badge out">🔴 OUT OF STOCK</span>'
        };

        let refillBtn = '<span style="color:#666;">-</span>';
        if (myPerms.edit) {
            refillBtn = `<button class="btn-stock-in" style="padding:4px 12px; width:auto;" onclick="openStockModal('${item.id}', 'IN')">+ Refill</button>`;
        }

        html += `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${item.itemName}</strong></td>
                <td>${getCatIcon(item.category)} ${item.category}</td>
                <td class="${status === 'out' ? 'stock-out' : 'stock-low'}">${item.currentStock} ${item.unit}</td>
                <td>${item.minStock} ${item.unit}</td>
                <td>${statusLabels[status]}</td>
                <td>${refillBtn}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function openAddItemModal() {
    if (allCategories.length === 0) {
        alert('⚠️ Categories load වෙන්නේ නෑ! Refresh කරන්න.');
        return;
    }
    document.getElementById('itemModalTitle').textContent = '➕ Add New Item';
    document.getElementById('itemName').value = '';
    document.getElementById('itemCategory').value = '';
    document.getElementById('itemUnit').value = '';
    document.getElementById('itemCurrentStock').value = '';
    document.getElementById('itemMinStock').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemNotes').value = '';
    document.getElementById('editItemId').value = '';
    document.getElementById('itemModal').style.display = 'flex';
}

function openEditItemModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('itemModalTitle').textContent = '✏️ Edit Item';
    document.getElementById('itemName').value = item.itemName;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemCurrentStock').value = item.currentStock;
    document.getElementById('itemMinStock').value = item.minStock;
    document.getElementById('itemPrice').value = item.pricePerUnit || '';
    document.getElementById('itemNotes').value = item.notes || '';
    document.getElementById('editItemId').value = itemId;
    document.getElementById('itemModal').style.display = 'flex';
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
}

async function saveItem() {
    const itemName = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const unit = document.getElementById('itemUnit').value;
    const currentStock = parseFloat(document.getElementById('itemCurrentStock').value) || 0;
    const minStock = parseFloat(document.getElementById('itemMinStock').value) || 0;
    const pricePerUnit = parseFloat(document.getElementById('itemPrice').value) || 0;
    const notes = document.getElementById('itemNotes').value.trim();
    const editId = document.getElementById('editItemId').value;

    if (!itemName || !category || !unit) {
        alert('⚠️ Required fields fill කරන්න!');
        return;
    }

    const data = {
        itemName, category, unit, currentStock, minStock, pricePerUnit, notes,
        updatedAt: getServerTimestamp(),
        updatedBy: currentUser.nickname
    };

    try {
        if (editId) {
            await db.collection('inventoryItems').doc(editId).update(data);
            alert('✅ Item updated!');
        } else {
            data.createdAt = getServerTimestamp();
            data.createdBy = currentUser.nickname;
            await db.collection('inventoryItems').add(data);
            alert('✅ Item added!');
        }
        closeItemModal();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

function openStockModal(itemId, type) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('stockModalTitle').textContent =
        type === 'IN' ? '📥 Stock IN' : '📤 Stock OUT';
    document.getElementById('stockItemName').textContent = item.itemName;
    document.getElementById('stockCurrentValue').textContent = item.currentStock;
    document.getElementById('stockUnit').textContent = item.unit;
    document.getElementById('stockQuantity').value = '';
    document.getElementById('stockReason').value = '';
    document.getElementById('stockItemId').value = itemId;
    document.getElementById('stockType').value = type;

    document.getElementById('stockModal').style.display = 'flex';
}

function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
}

async function confirmStockUpdate() {
    const itemId = document.getElementById('stockItemId').value;
    const type = document.getElementById('stockType').value;
    const quantity = parseFloat(document.getElementById('stockQuantity').value);
    const reason = document.getElementById('stockReason').value.trim();

    if (!quantity || quantity <= 0) {
        alert('⚠️ Valid quantity enter කරන්න!');
        return;
    }

    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    const previousStock = item.currentStock;
    const newStock = type === 'IN'
        ? previousStock + quantity
        : Math.max(0, previousStock - quantity);

    if (type === 'OUT' && quantity > previousStock) {
        if (!confirm(`⚠️ Quantity (${quantity}) is more than current stock (${previousStock})! Continue with stock = 0?`)) {
            return;
        }
    }

    try {
        await db.collection('inventoryItems').doc(itemId).update({
            currentStock: newStock,
            updatedAt: getServerTimestamp(),
            updatedBy: currentUser.nickname
        });

        await db.collection('stockMovements').add({
            itemId,
            itemName: item.itemName,
            type,
            quantity,
            reason: reason || (type === 'IN' ? 'Stock received' : 'Stock used'),
            previousStock,
            newStock,
            date: new Date().toISOString().split('T')[0],
            handledBy: currentUser.nickname,
            handledByName: currentUser.name,
            createdAt: getServerTimestamp()
        });

        closeStockModal();
        alert(`✅ Stock ${type === 'IN' ? 'added' : 'removed'}!\nNew stock: ${newStock} ${item.unit}`);
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

function openDeleteItemModal(itemId, itemName) {
    deleteItemId = itemId;
    document.getElementById('deleteItemName').textContent = itemName;
    document.getElementById('deleteItemModal').style.display = 'flex';
}

function closeDeleteItemModal() {
    document.getElementById('deleteItemModal').style.display = 'none';
    deleteItemId = '';
}

async function confirmDeleteItem() {
    if (!deleteItemId) return;
    try {
        await db.collection('inventoryItems').doc(deleteItemId).delete();
        alert('✅ Item deleted!');
        closeDeleteItemModal();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}