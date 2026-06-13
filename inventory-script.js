// ════════════════════════════════════════════════════════════
// 📦 INVENTORY DATABASE - COMPLETE JAVASCRIPT
// 📁 File: public/inventory-script.js
// 📅 Version: 12.0 - Optimized! (Skeleton + Cache + Pagination)
// ⭐ Uses global DATABASES from firebase-config.js
// ════════════════════════════════════════════════════════════

// ─── Performance Tracker ───────────────────────────────────
const Perf = {
    _marks: {},
    start(label) { this._marks[label] = performance.now(); },
    end(label) {
        const t = performance.now() - (this._marks[label] || 0);
        console.log(`⚡ [INV] ${label}: ${t.toFixed(1)}ms`);
        return t;
    }
};

// ─── Cache Keys & Durations ────────────────────────────────
const INV_USER_CACHE_KEY  = 'buono_inv_user_v1';
const INV_CAT_CACHE_KEY   = 'buono_inv_categories_v1';
const CACHE_5MIN          = 5 * 60 * 1000;

// ─── Cache Helpers ─────────────────────────────────────────
function invCacheSet(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch(e) { console.warn('Cache set failed:', e); }
}

function invCacheGet(key, maxAge) {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (Date.now() - obj.ts > maxAge) { sessionStorage.removeItem(key); return null; }
        return obj.data;
    } catch(e) { return null; }
}

function invCacheRemove(key) {
    try { sessionStorage.removeItem(key); } catch(e) {}
}

// ─── Pagination State ──────────────────────────────────────
const INV_PAGE_SIZE  = 50;
let invDisplayed     = 0;
let invFilteredCache = [];

// ─── App State ─────────────────────────────────────────────
let currentUser    = null;
let myPerms        = null;
let allItems       = [];
let allCategories  = [];
let deleteItemId   = '';
let deleteCategoryId = '';
let _debounceTimer = null;

const EMOJI_OPTIONS = [
    '☕','🥛','🍞','🌾','🥩','🥬','❄️','🧴',
    '📦','🍰','🍕','🍔','🍟','🥗','🍜','🍝',
    '🥤','🍺','🍷','🧃','🥃','🍪','🍩','🧁',
    '🥖','🥨','🧀','🍳','🥓','🌽','🥕','🥒',
    '🍅','🍎','🍊','🍋','🍇','🍓','🍒','🥝',
    '🐟','🦐','🍗','🍖','🥚','🌶️','🧄','🧅',
    '🔪','🍴','🥄','🥣','🍽️','🧂','🥡','🛒',
    '🧹','🧽','🪣','🧻','🔧','⚙️','🪜','📚'
];

const DEFAULT_CATEGORIES = [
    { name: 'Beverages',     icon: '☕', description: 'Coffee, Tea, Juices' },
    { name: 'Dairy',         icon: '🥛', description: 'Milk, Cheese, Butter' },
    { name: 'Bakery',        icon: '🍞', description: 'Bread, Cakes, Pastries' },
    { name: 'Dry Goods',     icon: '🌾', description: 'Flour, Sugar, Rice, Salt' },
    { name: 'Meat & Seafood',icon: '🥩', description: 'Chicken, Fish, Beef' },
    { name: 'Fresh Produce', icon: '🥬', description: 'Vegetables, Fruits' },
    { name: 'Frozen',        icon: '❄️', description: 'Ice cream, Frozen items' },
    { name: 'Cleaning',      icon: '🧴', description: 'Soap, Detergent' },
    { name: 'Supplies',      icon: '📦', description: 'Cups, Plates, Napkins' }
];

// ════════════════════════════════════════════════════════════
// 🚀 INIT
// ════════════════════════════════════════════════════════════
async function initializeApp() {
    Perf.start('Total Init');
    console.log('🚀 Initializing Inventory v12.0...');

    // ── Step 1: Auth check ──────────────────────────────
    const userData = getCurrentUser();
    if (!userData) { window.location.href = 'login.html'; return; }

    // ── Step 2: Try user cache first ────────────────────
    Perf.start('User Load');
    const cachedUser = invCacheGet(INV_USER_CACHE_KEY, CACHE_5MIN);

    if (cachedUser) {
        console.log('✅ [INV] User from cache (instant!)');
        _applyUser(cachedUser);
        Perf.end('User Load');
        _refreshUserBackground(userData.id);
    } else {
        // Fresh Firebase fetch
        try {
            const userDoc = await db.collection('employees').doc(userData.id).get();
            if (userDoc.exists) {
                const latest = userDoc.data();
                userData.access      = latest.access;
                userData.permissions = latest.permissions || {};
                userData.name        = latest.name;
                userData.nickname    = latest.nickname;
                sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
            }
        } catch (err) {
            console.error('Could not fetch latest user data:', err);
        }
        invCacheSet(INV_USER_CACHE_KEY, userData);
        _applyUser(userData);
        Perf.end('User Load');
    }

    // ── Step 3: Load categories (cache first) ───────────
    Perf.start('Categories Load');
    const cachedCats = invCacheGet(INV_CAT_CACHE_KEY, CACHE_5MIN);
    if (cachedCats) {
        console.log('✅ [INV] Categories from cache!');
        allCategories = cachedCats;
        renderCategoryDropdowns();
        renderCategoryGrid();
        Perf.end('Categories Load');
    } else {
        await ensureDefaultCategories();
        await loadCategories();
        Perf.end('Categories Load');
    }

    // ── Step 4: Real-time items listener ────────────────
    loadItems();

    buildDBSwitcherDropdown();
    setupUI();
    buildEmojiPicker();

    Perf.end('Total Init');
}

// ─── Apply user data & access check ───────────────────────
function _applyUser(userData) {
    const isAdmin = userData.access === 'Admin';
    const perms   = userData.permissions?.inventoryDB || {};
    const hasAccess = isAdmin || perms.add || perms.view || perms.selfView || perms.edit || perms.delete;

    if (!hasAccess) {
        alert('⛔ ඔයාට Inventory Database එකට access නැහැ!');
        window.location.href = 'access.html';
        return;
    }

    myPerms = isAdmin
        ? { add: true, view: true, selfView: true, edit: true, delete: true }
        : perms;

    currentUser = userData;

    console.log('✅ User:', currentUser.name, '|', currentUser.access);
    console.log('🔑 My Perms:', myPerms);

    document.getElementById('welcomeUser').textContent =
        `👋 Welcome, ${userData.name} (${userData.access})`;
}

// ─── Background user refresh ───────────────────────────────
async function _refreshUserBackground(uid) {
    try {
        const userDoc = await db.collection('employees').doc(uid).get();
        if (userDoc.exists) {
            const latest    = userDoc.data();
            const userData  = getCurrentUser();
            userData.access      = latest.access;
            userData.permissions = latest.permissions || {};
            userData.name        = latest.name;
            userData.nickname    = latest.nickname;
            sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
            invCacheSet(INV_USER_CACHE_KEY, userData);
            console.log('🔄 [INV] User cache refreshed in background');
        }
    } catch(e) { console.warn('Background user refresh failed:', e); }
}

initializeApp();

// ════════════════════════════════════════════════════════════
// 🎨 REVEAL PAGE
// ════════════════════════════════════════════════════════════
function revealPage() {
    // Hide overlay
    const overlay = document.getElementById('invLoadingOverlay');
    overlay.classList.add('hidden');
    setTimeout(() => { overlay.style.display = 'none'; }, 450);

    // Fade in main content
    document.getElementById('invMainContent').style.opacity = '1';

    // Stagger stat cards
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), i * 80);
    });

    console.log('✨ [INV] Page revealed!');
}

// ════════════════════════════════════════════════════════════
// 📊 FILL SKELETON STAT CARDS
// ════════════════════════════════════════════════════════════
function _fillStat(cardId, icon, value, label, colorClass) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.remove('skeleton-stat');
    card.innerHTML = `
        <div class="stat-icon">${icon}</div>
        <div class="stat-info">
            <h3 id="${cardId}Val">${value}</h3>
            <p>${label}</p>
        </div>
    `;
}

// ════════════════════════════════════════════════════════════
// 🔄 DB SWITCHER
// ════════════════════════════════════════════════════════════
function buildDBSwitcherDropdown() {
    const list = document.getElementById('dbDropdownList');
    if (!list) return;

    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    let html = '';

    DATABASES.forEach(database => {
        if (database.adminManagerOnly && !isAdminOrMgr) return;

        const isAdmin  = currentUser.access === 'Admin';
        const dbPerms  = currentUser.permissions?.[database.id] || {};
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

// ════════════════════════════════════════════════════════════
// 🔧 SETUP UI
// ════════════════════════════════════════════════════════════
function setupUI() {
    if (myPerms.add) {
        document.getElementById('addItemBtn').style.display = 'inline-block';
    }
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);
    if (isAdminOrMgr) {
        document.getElementById('addCategoryBtn').style.display = 'inline-block';
    }
}

// ════════════════════════════════════════════════════════════
// 🗂️ SECTION TABS
// ════════════════════════════════════════════════════════════
function showSection(name, btnEl) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    if (btnEl) btnEl.classList.add('active');

    if (name === 'lowstock')   loadLowStockItems();
    if (name === 'categories') {
        renderCategoryGrid();
        // Stagger category cards
        setTimeout(() => {
            document.querySelectorAll('.category-card').forEach((card, i) => {
                setTimeout(() => card.classList.add('visible'), i * 60);
            });
        }, 50);
    }
}

// ════════════════════════════════════════════════════════════
// 📂 CATEGORIES
// ════════════════════════════════════════════════════════════
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

        // Cache categories
        invCacheSet(INV_CAT_CACHE_KEY, allCategories);

        renderCategoryDropdowns();
        renderCategoryGrid();
    } catch (error) {
        console.error('❌ Load categories error:', error);
        document.getElementById('categoryGrid').innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:#ff4444;">
                ❌ Categories load failed!<br><small>${error.message}</small>
            </div>
        `;
    }
}

function renderCategoryDropdowns() {
    const itemCatSelect   = document.getElementById('itemCategory');
    const filterCatSelect = document.getElementById('filterCategory');

    const currentItemVal   = itemCatSelect.value;
    const currentFilterVal = filterCatSelect.value;

    itemCatSelect.innerHTML   = '<option value="">-- Select Category --</option>';
    filterCatSelect.innerHTML = '<option value="">📂 All Categories</option>';

    allCategories.forEach(cat => {
        itemCatSelect.innerHTML   += `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`;
        filterCatSelect.innerHTML += `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`;
    });

    itemCatSelect.value   = currentItemVal;
    filterCatSelect.value = currentFilterVal;
}

function renderCategoryGrid() {
    const grid         = document.getElementById('categoryGrid');
    const isAdminOrMgr = ['Admin', 'Manager'].includes(currentUser.access);

    if (allCategories.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">
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
                <button class="cat-btn edit"   onclick="openEditCategoryModal('${cat.id}')" title="Edit">✏️</button>
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

    // Animate cards
    setTimeout(() => {
        document.querySelectorAll('.category-card').forEach((card, i) => {
            setTimeout(() => card.classList.add('visible'), i * 60);
        });
    }, 30);
}

// ─── Emoji Picker ──────────────────────────────────────────
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

// ─── Category Modals ───────────────────────────────────────
function openAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = '➕ Add New Category';
    document.getElementById('categoryName').value   = '';
    document.getElementById('categoryDesc').value   = '';
    document.getElementById('categoryIcon').value   = '📦';
    document.getElementById('selectedEmojiDisplay').textContent = '📦';
    document.getElementById('editCategoryId').value = '';
    document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
    document.getElementById('categoryModal').style.display = 'flex';
}

function openEditCategoryModal(catId) {
    const cat = allCategories.find(c => c.id === catId);
    if (!cat) return;

    document.getElementById('categoryModalTitle').textContent = '✏️ Edit Category';
    document.getElementById('categoryName').value   = cat.name;
    document.getElementById('categoryDesc').value   = cat.description || '';
    document.getElementById('categoryIcon').value   = cat.icon || '📦';
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
    const name        = document.getElementById('categoryName').value.trim();
    const icon        = document.getElementById('categoryIcon').value;
    const description = document.getElementById('categoryDesc').value.trim();
    const editId      = document.getElementById('editCategoryId').value;

    if (!name) { alert('⚠️ Category name enter කරන්න!'); return; }

    try {
        if (editId) {
            const oldCat = allCategories.find(c => c.id === editId);
            await db.collection('inventoryCategories').doc(editId).update({
                name, icon, description,
                updatedAt: getServerTimestamp()
            });

            // Update items that used old category name
            if (oldCat && oldCat.name !== name) {
                const itemsToUpdate = allItems.filter(i => i.category === oldCat.name);
                for (const item of itemsToUpdate) {
                    await db.collection('inventoryItems').doc(item.id).update({ category: name });
                }
            }
            alert('✅ Category updated!');
        } else {
            const exist = allCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (exist) { alert('⚠️ Category already exists!'); return; }

            await db.collection('inventoryCategories').add({
                name, icon, description,
                createdAt: getServerTimestamp(),
                createdBy: currentUser.nickname
            });
            alert('✅ Category added!');
        }

        // Invalidate category cache
        invCacheRemove(INV_CAT_CACHE_KEY);
        closeCategoryModal();
        await loadCategories();
    } catch (error) {
        console.error('Save category error:', error);
        alert('❌ Error: ' + error.message);
    }
}

function openDeleteCategoryModal(catId, catName) {
    deleteCategoryId = catId;
    const itemCount  = allItems.filter(i => i.category === catName).length;
    document.getElementById('deleteCategoryName').textContent = catName;

    const warning = document.getElementById('deleteCategoryWarning');
    warning.innerHTML = itemCount > 0
        ? `⚠️ This category has <strong>${itemCount} items</strong>. They will become "Uncategorized".`
        : '✓ No items in this category.';

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

        // Invalidate category cache
        invCacheRemove(INV_CAT_CACHE_KEY);
        closeDeleteCategoryModal();
        await loadCategories();
    } catch (error) {
        console.error('Delete category error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// ════════════════════════════════════════════════════════════
// 📦 ITEMS - Real-time Listener (PRESERVED!)
// ════════════════════════════════════════════════════════════
function loadItems() {
    console.log('📦 Setting up items real-time listener...');
    Perf.start('Items Listener');

    db.collection('inventoryItems').orderBy('itemName').onSnapshot((snapshot) => {
        allItems = [];
        snapshot.forEach(doc => {
            allItems.push({ id: doc.id, ...doc.data() });
        });
        console.log('✅ Items loaded:', allItems.length);
        Perf.end('Items Listener');

        updateStats();
        filterItems();
        renderCategoryGrid();

        // Reveal page on first load
        revealPage();

    }, (error) => {
        console.error('❌ Items listener error:', error);
        revealPage(); // Still reveal even on error
    });
}

// ════════════════════════════════════════════════════════════
// 📊 STATS
// ════════════════════════════════════════════════════════════
function updateStats() {
    const total      = allItems.length;
    const low        = allItems.filter(i => i.currentStock > 0 && i.currentStock <= i.minStock).length;
    const out        = allItems.filter(i => i.currentStock <= 0).length;
    const totalValue = allItems.reduce((sum, i) => sum + (i.currentStock * (i.pricePerUnit || 0)), 0);

    _fillStat('invStatCard1', '📦', total, 'Total Items');
    _fillStat('invStatCard2', '⚠️', low,   'Low Stock Items');
    _fillStat('invStatCard3', '🚫', out,   'Out of Stock');
    _fillStat('invStatCard4', '💰',
        'Rs. ' + totalValue.toLocaleString('en-LK', { maximumFractionDigits: 2 }),
        'Total Stock Value'
    );
}

// ════════════════════════════════════════════════════════════
// 🔍 FILTER + DEBOUNCE
// ════════════════════════════════════════════════════════════
function debounceFilter() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(filterItems, 200);
}

function filterItems() {
    const search       = document.getElementById('searchItem').value.toLowerCase();
    const catFilter    = document.getElementById('filterCategory').value;
    const statusFilter = document.getElementById('filterStockStatus').value;

    let filtered = allItems.filter(item => {
        if (search       && !item.itemName.toLowerCase().includes(search)) return false;
        if (catFilter    && item.category !== catFilter)                   return false;
        if (statusFilter && getStockStatus(item) !== statusFilter)         return false;
        return true;
    });

    // Reset pagination for new filter
    invDisplayed     = 0;
    invFilteredCache = filtered;
    renderItemsPaged();
}

function getStockStatus(item) {
    if (item.currentStock <= 0)              return 'out';
    if (item.currentStock <= item.minStock)  return 'low';
    return 'good';
}

// ════════════════════════════════════════════════════════════
// 📋 RENDER ITEMS (Paginated)
// ════════════════════════════════════════════════════════════
function renderItemsPaged() {
    const items  = invFilteredCache;
    const tbody  = document.getElementById('itemsTableBody');

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:30px; color:#888;">
                    📭 No items found. ${myPerms && myPerms.add ? 'Click "Add New Item" to start!' : ''}
                </td>
            </tr>
        `;
        document.getElementById('invPaginationWrap').style.display = 'none';
        return;
    }

    // First render: show first PAGE_SIZE
    if (invDisplayed === 0) invDisplayed = INV_PAGE_SIZE;
    const toShow = items.slice(0, invDisplayed);

    const getCatIcon = (catName) => {
        const cat = allCategories.find(c => c.name === catName);
        return cat ? cat.icon : '📦';
    };

    const statusLabels = {
        good: '<span class="stock-badge good">🟢 Good</span>',
        low:  '<span class="stock-badge low">🟡 Low</span>',
        out:  '<span class="stock-badge out">🔴 Out</span>'
    };
    const stockClasses = { good: 'stock-good', low: 'stock-low', out: 'stock-out' };

    let html = '';
    toShow.forEach((item, i) => {
        const status = getStockStatus(item);

        let quickActions = '';
        if (myPerms && myPerms.edit) {
            quickActions = `
                <div class="qty-controls">
                    <button class="btn-stock-in"  onclick="openStockModal('${item.id}', 'IN')"  title="Stock IN">+</button>
                    <button class="btn-stock-out" onclick="openStockModal('${item.id}', 'OUT')" title="Stock OUT">−</button>
                </div>
            `;
        } else {
            quickActions = '<span style="color:#666; font-size:12px;">-</span>';
        }

        let actions = '';
        if (myPerms && myPerms.edit)   actions += `<button class="btn-edit"   onclick="openEditItemModal('${item.id}')">✏️</button>`;
        if (myPerms && myPerms.delete) actions += `<button class="btn-delete" onclick="openDeleteItemModal('${item.id}', '${item.itemName.replace(/'/g, "\\'")}')">🗑️</button>`;
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

    // Update pagination UI
    const paginationWrap = document.getElementById('invPaginationWrap');
    const counter        = document.getElementById('invCounter');

    if (items.length > INV_PAGE_SIZE) {
        paginationWrap.style.display = 'block';
        counter.textContent = `Showing ${toShow.length} of ${items.length} items`;
        document.getElementById('btnLoadMore').style.display =
            toShow.length < items.length ? 'inline-block' : 'none';
    } else {
        paginationWrap.style.display = 'none';
    }
}

function loadMoreItems() {
    invDisplayed += INV_PAGE_SIZE;
    renderItemsPaged();
}

// ─── Backward compat alias ─────────────────────────────────
function renderItems(items) {
    invFilteredCache = items;
    invDisplayed     = 0;
    renderItemsPaged();
}

// ════════════════════════════════════════════════════════════
// ⚠️ LOW STOCK
// ════════════════════════════════════════════════════════════
function loadLowStockItems() {
    const lowItems = allItems
        .filter(i => i.currentStock <= i.minStock)
        .sort((a, b) => {
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

    const statusLabels = {
        low: '<span class="stock-badge low">🟡 LOW STOCK</span>',
        out: '<span class="stock-badge out">🔴 OUT OF STOCK</span>'
    };

    let html = '';
    lowItems.forEach((item, i) => {
        const status = getStockStatus(item);

        let refillBtn = '<span style="color:#666;">-</span>';
        if (myPerms && myPerms.edit) {
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

// ════════════════════════════════════════════════════════════
// 📝 ITEM MODALS
// ════════════════════════════════════════════════════════════
function openAddItemModal() {
    if (allCategories.length === 0) {
        alert('⚠️ Categories load වෙන්නේ නෑ! Refresh කරන්න.');
        return;
    }
    document.getElementById('itemModalTitle').textContent  = '➕ Add New Item';
    document.getElementById('itemName').value         = '';
    document.getElementById('itemCategory').value     = '';
    document.getElementById('itemUnit').value         = '';
    document.getElementById('itemCurrentStock').value = '';
    document.getElementById('itemMinStock').value     = '';
    document.getElementById('itemPrice').value        = '';
    document.getElementById('itemNotes').value        = '';
    document.getElementById('editItemId').value       = '';
    document.getElementById('itemModal').style.display = 'flex';
}

function openEditItemModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('itemModalTitle').textContent  = '✏️ Edit Item';
    document.getElementById('itemName').value         = item.itemName;
    document.getElementById('itemCategory').value     = item.category;
    document.getElementById('itemUnit').value         = item.unit;
    document.getElementById('itemCurrentStock').value = item.currentStock;
    document.getElementById('itemMinStock').value     = item.minStock;
    document.getElementById('itemPrice').value        = item.pricePerUnit || '';
    document.getElementById('itemNotes').value        = item.notes || '';
    document.getElementById('editItemId').value       = itemId;
    document.getElementById('itemModal').style.display = 'flex';
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
}

async function saveItem() {
    const itemName     = document.getElementById('itemName').value.trim();
    const category     = document.getElementById('itemCategory').value;
    const unit         = document.getElementById('itemUnit').value;
    const currentStock = parseFloat(document.getElementById('itemCurrentStock').value) || 0;
    const minStock     = parseFloat(document.getElementById('itemMinStock').value)     || 0;
    const pricePerUnit = parseFloat(document.getElementById('itemPrice').value)        || 0;
    const notes        = document.getElementById('itemNotes').value.trim();
    const editId       = document.getElementById('editItemId').value;

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
            data.createdAt  = getServerTimestamp();
            data.createdBy  = currentUser.nickname;
            await db.collection('inventoryItems').add(data);
            alert('✅ Item added!');
        }
        closeItemModal();
        // Real-time listener handles refresh automatically!
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ════════════════════════════════════════════════════════════
// 📥 STOCK UPDATE MODAL
// ════════════════════════════════════════════════════════════
function openStockModal(itemId, type) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('stockModalTitle').textContent =
        type === 'IN' ? '📥 Stock IN' : '📤 Stock OUT';
    document.getElementById('stockItemName').textContent    = item.itemName;
    document.getElementById('stockCurrentValue').textContent = item.currentStock;
    document.getElementById('stockUnit').textContent        = item.unit;
    document.getElementById('stockQuantity').value          = '';
    document.getElementById('stockReason').value            = '';
    document.getElementById('stockItemId').value            = itemId;
    document.getElementById('stockType').value              = type;
    document.getElementById('stockModal').style.display     = 'flex';
}

function closeStockModal() {
    document.getElementById('stockModal').style.display = 'none';
}

async function confirmStockUpdate() {
    const itemId   = document.getElementById('stockItemId').value;
    const type     = document.getElementById('stockType').value;
    const quantity = parseFloat(document.getElementById('stockQuantity').value);
    const reason   = document.getElementById('stockReason').value.trim();

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

        // Stock movement log (PRESERVED!)
        await db.collection('stockMovements').add({
            itemId,
            itemName: item.itemName,
            type,
            quantity,
            reason:        reason || (type === 'IN' ? 'Stock received' : 'Stock used'),
            previousStock,
            newStock,
            date:          new Date().toISOString().split('T')[0],
            handledBy:     currentUser.nickname,
            handledByName: currentUser.name,
            createdAt:     getServerTimestamp()
        });

        closeStockModal();
        alert(`✅ Stock ${type === 'IN' ? 'added' : 'removed'}!\nNew stock: ${newStock} ${item.unit}`);
        // Real-time listener handles UI update!
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ════════════════════════════════════════════════════════════
// 🗑️ DELETE ITEM
// ════════════════════════════════════════════════════════════
function openDeleteItemModal(itemId, itemName) {
    deleteItemId = itemId;
    document.getElementById('deleteItemName').textContent      = itemName;
    document.getElementById('deleteItemModal').style.display   = 'flex';
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
        // Real-time listener handles UI update!
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ════════════════════════════════════════════════════════════
// 🖱️ CLICK OUTSIDE MODAL TO CLOSE
// ════════════════════════════════════════════════════════════
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};