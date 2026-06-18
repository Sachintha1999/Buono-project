/* ═══════════════════════════════════════════════════════════════ */
/* 👥 EMPLOYEES PAGE CONFIG                                        */
/* File: pages/hr/employees/employees-config.js                   */
/* Version: 1.0                                                    */
/* Date: 2026-06-17                                                */
/*                                                                 */
/* Purpose: Page configuration for Employee Database               */
/* Read by: src/core/buono-page-builder.js                        */
/*                                                                 */
/* This config controls:                                           */
/*   - Tab Bar items                                               */
/*   - Sub-tabs per tab                                            */
/*   - Toolbar per tab (search + actions)                          */
/*   - Permissions check                                           */
/*   - Welcome message                                             */
/* ═══════════════════════════════════════════════════════════════ */

window.BuonoPageConfig = {
    
    // ─────────────────────────────────────────────
    // PAGE IDENTITY
    // ─────────────────────────────────────────────
    pageId: 'employees',
    title: 'Employee Database',
    subtitle: 'HR Management Module',
    welcomeText: 'Welcome to Employee Database',
    icon: '👥',
    
    
    // ─────────────────────────────────────────────
    // MAIN TABS (Top Navigation)
    // ─────────────────────────────────────────────
    tabs: [
        {
            id: 'overview',
            icon: '📊',
            label: 'Overview',
            hasToolbar: false,
            hasSubTabs: false,
            badge: null
        },
        {
            id: 'employees',
            icon: '👥',
            label: 'All Employees',
            hasToolbar: true,
            hasSubTabs: true,
            badge: null
        },
        {
            id: 'attendance',
            icon: '📅',
            label: 'Attendance',
            hasToolbar: true,
            hasSubTabs: false,
            badge: null
        },
        {
            id: 'salary',
            icon: '💰',
            label: 'Salary',
            hasToolbar: true,
            hasSubTabs: false,
            badge: null
        },
        {
            id: 'reports',
            icon: '📈',
            label: 'Reports',
            hasToolbar: true,
            hasSubTabs: false,
            badge: null
        }
    ],
    
    
    // ─────────────────────────────────────────────
    // SUB-TABS (Filter chips per tab)
    // ─────────────────────────────────────────────
    subTabs: {
        // Sub-tabs for "All Employees" tab
        employees: [
            {
                id: 'all',
                label: 'All',
                icon: '👥',
                filter: 'all',
                count: 0,
                countColor: null
            },
            {
                id: 'active',
                label: 'Active',
                icon: '✅',
                filter: 'active',
                count: 0,
                countColor: 'success'
            },
            {
                id: 'suspended',
                label: 'Suspended',
                icon: '⏸️',
                filter: 'suspended',
                count: 0,
                countColor: 'warning'
            },
            {
                id: 'leavers',
                label: 'Leavers',
                icon: '👋',
                filter: 'leavers',
                count: 0,
                countColor: 'error'
            }
        ]
    },
    
    
    // ─────────────────────────────────────────────
    // TOOLBAR (Per-tab actions + search)
    // ─────────────────────────────────────────────
    toolbar: {
        // Toolbar for "All Employees" tab
        employees: {
            search: {
                id: 'employeeSearch',
                placeholder: 'Search by name, nickname or access...'
            },
            actions: [
                {
                    id: 'addEmployeeBtn',
                    label: '+ Add Employee',
                    style: 'primary',
                    onclick: 'openAddModal()',
                    requirePermission: 'add'   // Only show if user has 'add' permission
                }
            ]
        },
        
        // Toolbar for "Attendance" tab
        attendance: {
            search: {
                id: 'attendanceSearch',
                placeholder: 'Search attendance records...'
            },
            actions: [
                {
                    id: 'exportAttendanceBtn',
                    label: '📥 Export',
                    style: 'secondary',
                    onclick: 'exportAttendance()'
                }
            ]
        },
        
        // Toolbar for "Salary" tab
        salary: {
            search: {
                id: 'salarySearch',
                placeholder: 'Search salary records...'
            },
            actions: [
                {
                    id: 'addSalaryBtn',
                    label: '+ Add Salary Entry',
                    style: 'primary',
                    onclick: 'openSalaryModal()'
                }
            ]
        },
        
        // Toolbar for "Reports" tab
        reports: {
            actions: [
                {
                    id: 'dateRangeBtn',
                    label: '📅 Date Range',
                    style: 'secondary',
                    onclick: 'openDateRangeModal()'
                },
                {
                    id: 'exportReportBtn',
                    label: '📥 Export',
                    style: 'primary',
                    onclick: 'exportReport()'
                }
            ]
        }
    },
    
    
    // ─────────────────────────────────────────────
    // PERMISSIONS
    // ─────────────────────────────────────────────
    permissions: {
        moduleKey: 'employeeDB',
        requiredKeys: ['add', 'view', 'selfView', 'edit', 'delete']
    },
    
    
    // ─────────────────────────────────────────────
    // ADVANCED SETTINGS
    // ─────────────────────────────────────────────
    advanced: {
        // Pagination
        pageSize: 50,
        
        // Auto-refresh
        autoRefresh: false,
        refreshInterval: 30000,
        
        // Cache
        cacheUser: true,
        cacheTTL: 5 * 60 * 1000,  // 5 minutes
        
        // Search
        searchDebounce: 200,
        
        // Features
        enableExport: true,
        enablePrint: true,
        enableBulkActions: false
    }
};

console.log('⚙️ Employees config loaded');

/* ═══════════════════════════════════════════════════════════════ */
/* 🏁 END OF EMPLOYEES-CONFIG.JS v1.0                              */
/* ═══════════════════════════════════════════════════════════════ */