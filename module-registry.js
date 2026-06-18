// ============================================================
// module-registry.js
// BUONO PROJECT - Module Registry (THE BRAIN)
// Version: 1.0.0
// Created: Session 69
// Purpose: Single source of truth for all modules
// ============================================================

(function() {
    'use strict';

    console.log('🧠 BuonoRegistry: Loading...');

    // ========================================================
    // SECTION 1: CATEGORIES
    // ========================================================

    const CATEGORIES = {
        owner: {
            id: 'owner',
            label: 'Owner',
            labelSi: 'හිමිකරු',
            icon: '👑',
            color: '#6C63FF',
            order: 1,
            description: 'Owner level management and dashboards'
        },
        hr: {
            id: 'hr',
            label: 'Human Resources',
            labelSi: 'මානව සම්පත්',
            icon: '👥',
            color: '#4CAF50',
            order: 2,
            description: 'Employee management and approvals'
        },
        academy: {
            id: 'academy',
            label: 'Academy',
            labelSi: 'ඇකඩමිය',
            icon: '🎓',
            color: '#FF9800',
            order: 3,
            description: 'Student and course management'
        },
        operations: {
            id: 'operations',
            label: 'Operations',
            labelSi: 'මෙහෙයුම්',
            icon: '⚙️',
            color: '#2196F3',
            order: 4,
            description: 'Daily operations - cashier, kitchen, inventory'
        },
        reports: {
            id: 'reports',
            label: 'Reports',
            labelSi: 'වාර්තා',
            icon: '📊',
            color: '#E91E63',
            order: 5,
            description: 'Business reports and analytics'
        },
        system: {
            id: 'system',
            label: 'System',
            labelSi: 'පද්ධතිය',
            icon: '🔧',
            color: '#607D8B',
            order: 6,
            description: 'System settings and configuration'
        }
    };

    // ========================================================
    // SECTION 2: MODULES
    // ========================================================
    // access levels:
    //   'Admin'    → Super Owner only
    //   'Manager'  → Manager + Admin
    //   'all'      → All logged-in users
    //   array      → ['Admin','Manager'] specific roles
    // ========================================================

    const MODULES = [

        // ── OWNER CATEGORY ──────────────────────────────────
        {
            id: 'owner-dashboard',
            category: 'owner',
            label: 'Owner Dashboard',
            labelSi: 'හිමිකරු Dashboard',
            icon: '👑',
            description: 'Full business overview for owner',
            descriptionSi: 'ව්‍යාපාරය පිළිබඳ සම්පූර්ණ දළ විශ්ලේෂණය',
            url: 'admin.html',
            access: 'Admin',
            sidebar: true,
            sidebarOrder: 1,
            status: 'coming-soon',
            badge: null,
            dbKey: null
        },

        // ── HR CATEGORY ──────────────────────────────────────
        {
            id: 'employees',
            category: 'hr',
            label: 'Employees',
            labelSi: 'සේවකයින්',
            icon: '👤',
            description: 'Employee database and management',
            descriptionSi: 'සේවක දත්ත සමුදාය සහ කළමනාකරණය',
            url: 'index.html',
            access: ['Admin', 'Manager'],
            sidebar: true,
            sidebarOrder: 2,
            status: 'active',
            badge: null,
            dbKey: 'employeeDB'
        },
        {
            id: 'approvals',
            category: 'hr',
            label: 'Approvals',
            labelSi: 'අනුමැතිය',
            icon: '✅',
            description: 'Employee request approvals',
            descriptionSi: 'සේවක ඉල්ලීම් අනුමත කිරීම',
            url: 'approve.html',
            access: ['Admin', 'Manager'],
            sidebar: true,
            sidebarOrder: 3,
            status: 'active',
            badge: null,
            dbKey: 'approveDB'
        },

        // ── ACADEMY CATEGORY ─────────────────────────────────
        {
            id: 'student-management',
            category: 'academy',
            label: 'Student Management',
            labelSi: 'සිසු කළමනාකරණය',
            icon: '🎓',
            description: 'Manage academy students',
            descriptionSi: 'ඇකඩමි සිසුන් කළමනාකරණය කරන්න',
            url: 'student-management.html',
            access: ['Admin', 'Manager', 'Academy'],
            sidebar: true,
            sidebarOrder: 4,
            status: 'active',
            badge: null,
            dbKey: 'studentsDB'
        },
        {
            id: 'student-portal',
            category: 'academy',
            label: 'Student Portal',
            labelSi: 'සිසු ද්වාරය',
            icon: '📚',
            description: 'Student self-service portal',
            descriptionSi: 'සිසු ස්වයං සේවා ද්වාරය',
            url: 'student-portal.html',
            access: 'all',
            sidebar: true,
            sidebarOrder: 5,
            status: 'active',
            badge: null,
            dbKey: 'studentsDB'
        },
        {
            id: 'installment-tracker',
            category: 'academy',
            label: 'Installment Tracker',
            labelSi: 'වාරික ලුහුබැඳීම',
            icon: '💳',
            description: 'Track student fee installments',
            descriptionSi: 'සිසු ගාස්තු වාරික ලුහුබඳින්න',
            url: 'installment-tracker.html',
            access: ['Admin', 'Manager', 'Academy'],
            sidebar: true,
            sidebarOrder: 6,
            status: 'active',
            badge: null,
            dbKey: 'installmentsDB'
        },

        // ── OPERATIONS CATEGORY ──────────────────────────────
        {
            id: 'cashier',
            category: 'operations',
            label: 'Cashier',
            labelSi: 'මුදල් අයකැමි',
            icon: '💰',
            description: 'Point of sale and billing',
            descriptionSi: 'විකුණුම් ස්ථානය සහ බිල්පත්',
            url: 'cashier.html',
            access: ['Admin', 'Manager', 'Cashier'],
            sidebar: true,
            sidebarOrder: 7,
            status: 'active',
            badge: null,
            dbKey: 'cashierDB'
        },
        {
            id: 'kitchen',
            category: 'operations',
            label: 'Kitchen',
            labelSi: 'කුස්සිය',
            icon: '🍳',
            description: 'Kitchen order management',
            descriptionSi: 'කුස්සිය ඇණවුම් කළමනාකරණය',
            url: 'kitchen.html',
            access: ['Admin', 'Manager', 'Kitchen'],
            sidebar: true,
            sidebarOrder: 8,
            status: 'active',
            badge: null,
            dbKey: 'kitchenDB'
        },
        {
            id: 'inventory',
            category: 'operations',
            label: 'Inventory',
            labelSi: 'තොගය',
            icon: '📦',
            description: 'Stock and inventory control',
            descriptionSi: 'තොග සහ සूची පාලනය',
            url: 'inventory.html',
            access: ['Admin', 'Manager'],
            sidebar: true,
            sidebarOrder: 9,
            status: 'active',
            badge: null,
            dbKey: 'inventoryDB'
        },
        {
            id: 'purchasing',
            category: 'operations',
            label: 'Purchasing',
            labelSi: 'මිලදී ගැනීම',
            icon: '🛒',
            description: 'Purchase orders and suppliers',
            descriptionSi: 'මිලදී ගැනීමේ ඇණවුම් සහ සැපයුම්කරුවන්',
            url: 'purchasing.html',
            access: ['Admin', 'Manager'],
            sidebar: true,
            sidebarOrder: 10,
            status: 'active',
            badge: null,
            dbKey: 'purchasingDB'
        },
        {
            id: 'call-center',
            category: 'operations',
            label: 'Call Center',
            labelSi: 'ඇමතුම් මධ්‍යස්ථානය',
            icon: '📞',
            description: 'Customer calls and inquiries',
            descriptionSi: 'පාරිභෝගික ඇමතුම් සහ විමසීම්',
            url: 'callcenter.html',
            access: ['Admin', 'Manager', 'CallCenter'],
            sidebar: true,
            sidebarOrder: 11,
            status: 'active',
            badge: null,
            dbKey: 'callcenterDB'
        },
        {
            id: 'payment',
            category: 'operations',
            label: 'Payment',
            labelSi: 'ගෙවීම',
            icon: '💵',
            description: 'Payment processing and tracking',
            descriptionSi: 'ගෙවීම් සැකසීම සහ ලුහුබැඳීම',
            url: 'payment.html',
            access: ['Admin', 'Manager', 'Cashier'],
            sidebar: true,
            sidebarOrder: 12,
            status: 'active',
            badge: null,
            dbKey: 'paymentDB'
        },

        // ── REPORTS CATEGORY ─────────────────────────────────
        {
            id: 'reports',
            category: 'reports',
            label: 'Reports',
            labelSi: 'වාර්තා',
            icon: '📊',
            description: 'Business analytics and reports',
            descriptionSi: 'ව්‍යාපාර විශ්ලේෂණ සහ වාර්තා',
            url: 'reports.html',
            access: ['Admin', 'Manager'],
            sidebar: true,
            sidebarOrder: 13,
            status: 'active',
            badge: null,
            dbKey: 'reportsDB'
        },

        // ── SYSTEM CATEGORY ──────────────────────────────────
        {
            id: 'settings',
            category: 'system',
            label: 'Settings',
            labelSi: 'සැකසුම්',
            icon: '⚙️',
            description: 'System configuration and settings',
            descriptionSi: 'පද්ධති වින්‍යාසය සහ සැකසුම්',
            url: 'settings.html',
            access: 'Admin',
            sidebar: true,
            sidebarOrder: 14,
            status: 'active',
            badge: null,
            dbKey: null
        },
        {
            id: 'manager-tools',
            category: 'system',
            label: 'Manager Tools',
            labelSi: 'කළමනාකරු මෙවලම්',
            icon: '🛠️',
            description: 'Manager dashboard and tools',
            descriptionSi: 'කළමනාකරු dashboard සහ මෙවලම්',
            url: 'manager.html',
            access: ['Admin', 'Manager'],
            sidebar: true,
            sidebarOrder: 15,
            status: 'active',
            badge: null,
            dbKey: null
        }

    ]; // end MODULES
    // ========================================================
    // SECTION 3: HELPER FUNCTIONS
    // ========================================================

    const escapeHTML = (value) => {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const getUserRole = (user) => {
        if (!user || typeof user !== 'object') return null;
        return user.access || user.role || null;
    };

    const isAdminUser = (user) => {
        return getUserRole(user) === 'Admin';
    };

    const getAccessList = (module) => {
        if (!module) return [];
        if (module.access === 'all') return ['All Users'];
        if (typeof module.access === 'string') return [module.access];
        if (Array.isArray(module.access)) return module.access;
        return [];
    };

    // 1. getAllModules()
    function getAllModules() {
        return [...MODULES].sort((a, b) => {
            const aOrder = a.sidebarOrder ?? 999;
            const bOrder = b.sidebarOrder ?? 999;
            return aOrder - bOrder;
        });
    }

    // 2. getModuleById(id)
    function getModuleById(id) {
        if (!id) return null;
        return MODULES.find(module => module.id === id) || null;
    }

    // 3. getModulesByCategory(categoryId)
    function getModulesByCategory(categoryId) {
        if (!categoryId) return [];

        return MODULES
            .filter(module => module.category === categoryId)
            .sort((a, b) => {
                const aOrder = a.sidebarOrder ?? 999;
                const bOrder = b.sidebarOrder ?? 999;
                return aOrder - bOrder;
            });
    }

    // 4. getCategoriesWithModules()
    function getCategoriesWithModules() {
        return Object.values(CATEGORIES)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map(category => {
                const modules = getModulesByCategory(category.id);
                return {
                    ...category,
                    modules,
                    count: modules.length
                };
            })
            .filter(category => category.modules.length > 0);
    }

    // 5. checkUserAccess(user, moduleId)
    function checkUserAccess(user, moduleId) {
        const module = typeof moduleId === 'string' ? getModuleById(moduleId) : moduleId;

        if (!module) return false;
        if (!user) return false;

        // Super Owner
        if (isAdminUser(user)) return true;

        // Logged-in all users
        if (module.access === 'all') return true;

        const userRole = getUserRole(user);
        if (!userRole) return false;

        if (typeof module.access === 'string') {
            return userRole === module.access;
        }

        if (Array.isArray(module.access)) {
            return module.access.includes(userRole);
        }

        return false;
    }

    // 6. getUserAccessibleModules(user)
    function getUserAccessibleModules(user) {
        if (!user) return [];

        return getAllModules().filter(module => checkUserAccess(user, module));
    }

    // 7. getUserSidebarModules(user)
    function getUserSidebarModules(user) {
        return getUserAccessibleModules(user)
            .filter(module => module.sidebar !== false)
            .sort((a, b) => {
                const catA = CATEGORIES[a.category]?.order ?? 999;
                const catB = CATEGORIES[b.category]?.order ?? 999;

                if (catA !== catB) return catA - catB;

                const aOrder = a.sidebarOrder ?? 999;
                const bOrder = b.sidebarOrder ?? 999;
                return aOrder - bOrder;
            });
    }

    // 8. generateAccessCard(module)
    function generateAccessCard(module) {
        if (!module) return '';

        const category = CATEGORIES[module.category] || {};
        const isComingSoon = module.status === 'coming-soon';
        const tag = isComingSoon ? 'div' : 'a';
        const href = isComingSoon ? '' : ` href="${escapeHTML(module.url)}"`;
        const badgeHTML = module.badge
            ? `<span class="module-badge">${escapeHTML(module.badge)}</span>`
            : '';
        const statusHTML = isComingSoon
            ? `<span class="module-status coming-soon">Coming Soon</span>`
            : `<span class="module-status active">Open</span>`;

        return `
<${tag}
    class="access-card module-card status-${escapeHTML(module.status || 'active')}"
    data-module-id="${escapeHTML(module.id)}"
    data-category="${escapeHTML(module.category)}"
    ${href}
>
    <div class="module-card-header">
        <div class="module-icon-wrap" style="background:${escapeHTML(category.color || '#999')}15; color:${escapeHTML(category.color || '#999')}">
            <span class="module-icon">${escapeHTML(module.icon || '📁')}</span>
        </div>
        <div class="module-card-meta">
            <div class="module-category">${escapeHTML(category.labelSi || category.label || 'Category')}</div>
            <h3 class="module-title">${escapeHTML(module.labelSi || module.label)}</h3>
        </div>
        ${badgeHTML}
    </div>

    <div class="module-card-body">
        <p class="module-description">${escapeHTML(module.descriptionSi || module.description || '')}</p>
    </div>

    <div class="module-card-footer">
        ${statusHTML}
        <span class="module-arrow">${isComingSoon ? '⏳' : '→'}</span>
    </div>
</${tag}>`.trim();
    }

    // 9. generateSidebarHTML(user)
    function generateSidebarHTML(user) {
        const sidebarModules = getUserSidebarModules(user);

        if (!sidebarModules.length) {
            return `
<div class="sidebar-group empty-sidebar">
    <div class="sidebar-group-title">No Modules</div>
    <div class="sidebar-empty">ලබා ගත හැකි modules නැහැ</div>
</div>`.trim();
        }

        const grouped = {};

        sidebarModules.forEach(module => {
            if (!grouped[module.category]) {
                grouped[module.category] = [];
            }
            grouped[module.category].push(module);
        });

        const categoryOrder = Object.values(CATEGORIES)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map(category => category.id);

        return categoryOrder
            .filter(categoryId => grouped[categoryId]?.length)
            .map(categoryId => {
                const category = CATEGORIES[categoryId];
                const itemsHTML = grouped[categoryId]
                    .map(module => {
                        const badgeHTML = module.badge
                            ? `<span class="sidebar-badge">${escapeHTML(module.badge)}</span>`
                            : '';

                        return `
<a class="sidebar-link"
   href="${escapeHTML(module.url)}"
   data-module-id="${escapeHTML(module.id)}"
   data-category="${escapeHTML(module.category)}">
    <span class="sidebar-link-icon">${escapeHTML(module.icon || '•')}</span>
    <span class="sidebar-link-text">${escapeHTML(module.labelSi || module.label)}</span>
    ${badgeHTML}
</a>`.trim();
                    })
                    .join('\n');

                return `
<div class="sidebar-group" data-category="${escapeHTML(category.id)}">
    <div class="sidebar-group-title">
        <span class="sidebar-group-icon">${escapeHTML(category.icon || '📁')}</span>
        <span class="sidebar-group-text">${escapeHTML(category.labelSi || category.label)}</span>
    </div>
    <div class="sidebar-group-links">
        ${itemsHTML}
    </div>
</div>`.trim();
            })
            .join('\n');
    }

    // 10. generatePermissionBlock(module)
    function generatePermissionBlock(module) {
        if (!module) return '';

        const category = CATEGORIES[module.category] || {};
        const accessList = getAccessList(module);

        const accessHTML = accessList.length
            ? accessList.map(role => `<span class="permission-role">${escapeHTML(role)}</span>`).join('')
            : `<span class="permission-role">Unknown</span>`;

        return `
<div class="permission-block" data-module-id="${escapeHTML(module.id)}">
    <div class="permission-header">
        <span class="permission-icon">${escapeHTML(module.icon || '🔐')}</span>
        <div class="permission-title-wrap">
            <strong class="permission-title">${escapeHTML(module.labelSi || module.label)}</strong>
            <small class="permission-category">${escapeHTML(category.labelSi || category.label || '')}</small>
        </div>
    </div>

    <div class="permission-body">
        <div class="permission-row">
            <span class="permission-label">Access:</span>
            <div class="permission-roles">${accessHTML}</div>
        </div>
        <div class="permission-row">
            <span class="permission-label">URL:</span>
            <code class="permission-url">${escapeHTML(module.url || '-')}</code>
        </div>
        <div class="permission-row">
            <span class="permission-label">Database:</span>
            <code class="permission-db">${escapeHTML(module.dbKey || 'N/A')}</code>
        </div>
        <div class="permission-row">
            <span class="permission-label">Status:</span>
            <span class="permission-status status-${escapeHTML(module.status || 'active')}">${escapeHTML(module.status || 'active')}</span>
        </div>
    </div>
</div>`.trim();
    }
        // ========================================================
    // SECTION 4: PUBLIC API
    // ========================================================

    window.BuonoRegistry = {
        // Data
        MODULES,
        CATEGORIES,

        // Core Functions
        getAllModules,
        getModuleById,
        getModulesByCategory,
        getCategoriesWithModules,

        // Access Functions
        checkUserAccess,
        getUserAccessibleModules,
        getUserSidebarModules,

        // Generators
        generateAccessCard,
        generateSidebarHTML,
        generatePermissionBlock,

        // Utility
        getStats: () => {
            const totalModules = MODULES.length;
            const totalCategories = Object.keys(CATEGORIES).length;
            const activeModules = MODULES.filter(m => m.status === 'active').length;
            const adminOnly = MODULES.filter(m => m.access === 'Admin').length;

            return {
                totalModules,
                totalCategories,
                activeModules,
                adminOnly,
                version: '1.0.0'
            };
        }
    };

    // ========================================================
    // SECTION 5: AUTO-INIT & LOGGING
    // ========================================================

    console.log('✅ BuonoRegistry: Successfully Loaded!');
    console.log(`📊 Loaded ${MODULES.length} modules across ${Object.keys(CATEGORIES).length} categories.`);

})(); // End of IIFE