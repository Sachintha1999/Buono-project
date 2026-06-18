/* ═══════════════════════════════════════════════════════════════ */
/* 🏗️ BUONO PAGE BUILDER                                           */
/* File: src/core/buono-page-builder.js                           */
/* Version: 1.2 (FIXED - DOM-based component wait)                */
/* Date: 2026-06-17                                                */
/*                                                                 */
/* 🆕 v1.2 CHANGES:                                                */
/*   - Fixed race condition with component-loader                  */
/*   - Now checks actual DOM (not flags)                           */
/*   - Waits for components to be INJECTED before building tabs   */
/* ═══════════════════════════════════════════════════════════════ */

(function(window, document) {
    'use strict';

    // ═══════════════════════════════════════════
    // 📋 SECTION 1: CONFIG
    // ═══════════════════════════════════════════
    const CONFIG = {
        version: '1.2',
        autoInit: true,
        scrollHideThreshold: 50,
        scrollDebounce: 10,
        clockUpdateInterval: 1000,
        tabSwitchDuration: 350,
        enableLogs: true,
        logPrefix: '[PageBuilder]',
        enablePerfTracking: true,
        componentWaitTimeout: 5000,   // 🆕 v1.2
        configWaitTimeout: 3000        // 🆕 v1.2
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 2: STATE
    // ═══════════════════════════════════════════
    const state = {
        initialized: false,
        config: null,
        activeTab: null,
        activeSubTab: {},
        lastScrollY: 0,
        scrollDirection: 'up',
        scrollTimer: null,
        scrollHidden: false,
        clockInterval: null,
        userData: null,
        stats: {
            tabSwitches: 0,
            subTabSwitches: 0,
            scrollEvents: 0
        }
    };

    // ═══════════════════════════════════════════
    // 📋 SECTION 3: UTILITIES
    // ═══════════════════════════════════════════
    function log(...args) {
        if (CONFIG.enableLogs) {
            console.log(CONFIG.logPrefix, ...args);
        }
    }

    function warn(...args) {
        if (CONFIG.enableLogs) {
            console.warn(CONFIG.logPrefix, ...args);
        }
    }

    function error(...args) {
        console.error(CONFIG.logPrefix, ...args);
    }

    function perfStart(name) {
        if (CONFIG.enablePerfTracking && window.PerfTracker) {
            try { window.PerfTracker.start(name); } catch(e) {}
        }
    }

    function perfEnd(name) {
        if (CONFIG.enablePerfTracking && window.PerfTracker) {
            try { window.PerfTracker.end(name); } catch(e) {}
        }
    }

    function getUserData() {
        try {
            const user = sessionStorage.getItem('loggedInUser');
            if (user) return JSON.parse(user);
        } catch(e) {}
        return null;
    }

    // 🆕 v1.2: DOM-based component readiness check
    function areComponentsReady() {
        const needed = document.querySelectorAll('[data-component]').length;
        const loaded = document.querySelectorAll('[data-component-loaded]').length;
        return needed === 0 || loaded >= needed;
    }

    function getComponentStatus() {
        const needed = document.querySelectorAll('[data-component]').length;
        const loaded = document.querySelectorAll('[data-component-loaded]').length;
        return { needed, loaded, ready: needed === 0 || loaded >= needed };
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 4: TOPBAR - WELCOME MESSAGE
    // ═══════════════════════════════════════════
    function updateWelcomeMessage() {
        const welcomeEl = document.querySelector('.topbar-welcome-text');
        if (!welcomeEl) return;

        const config = state.config;
        if (!config) return;

        const userData = state.userData || getUserData();
        const userName = userData?.nickname || userData?.name || 'Guest';
        const pageTitle = config.welcomeText || config.title || 'Buono';

        welcomeEl.innerHTML = `${pageTitle}, <strong>${userName}</strong>`;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 5: TOPBAR - LIVE CLOCK
    // ═══════════════════════════════════════════
    function updateClock() {
        const now = new Date();

        const dateEl = document.querySelector('.topbar-info-chip .info-date');
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit'
            });
        }

        const timeEl = document.querySelector('.topbar-info-chip .info-clock');
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    }

    function startClock() {
        updateClock();
        if (state.clockInterval) clearInterval(state.clockInterval);
        state.clockInterval = setInterval(updateClock, CONFIG.clockUpdateInterval);
    }

    function stopClock() {
        if (state.clockInterval) {
            clearInterval(state.clockInterval);
            state.clockInterval = null;
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 6: TAB BAR BUILDER
    // ═══════════════════════════════════════════
    function buildTabBar() {
        const tabsContainer = document.querySelector('[data-component-loaded="page-tabs"] .page-tabs')
                            || document.querySelector('.page-tabs');

        if (!tabsContainer) {
            warn('Tab container not found');
            return;
        }

        const config = state.config;
        if (!config || !config.tabs || config.tabs.length === 0) {
            tabsContainer.style.display = 'none';
            return;
        }

        perfStart('Build tab bar');

        const tabsHtml = config.tabs.map(tab => {
            const badge = tab.badge !== undefined && tab.badge !== null
                ? `<span class="page-tab-badge">${tab.badge}</span>`
                : '';

            return `
                <button class="page-tab"
                        data-tab="${tab.id}"
                        data-has-toolbar="${tab.hasToolbar ? 'true' : 'false'}"
                        data-has-subtabs="${tab.hasSubTabs ? 'true' : 'false'}">
                    <span class="page-tab-icon">${tab.icon || ''}</span>
                    <span class="page-tab-label">${tab.label}</span>
                    ${badge}
                </button>
            `;
        }).join('');

        tabsContainer.innerHTML = tabsHtml;

        tabsContainer.querySelectorAll('.page-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        perfEnd('Build tab bar');
        log(`✅ Tab bar built (${config.tabs.length} tabs)`);

        const firstTab = config.tabs[0];
        if (firstTab) {
            switchTab(firstTab.id, false);
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 7: TAB SWITCHING
    // ═══════════════════════════════════════════
    function switchTab(tabId, animate = true) {
        if (!tabId) return;
        if (state.activeTab === tabId) return;

        const config = state.config;
        if (!config) return;

        const tabConfig = config.tabs.find(t => t.id === tabId);
        if (!tabConfig) {
            warn('Tab not found:', tabId);
            return;
        }

        perfStart(`Switch tab: ${tabId}`);

        document.querySelectorAll('.page-tab').forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === tabId;
            tab.classList.toggle('active', isActive);
        });

        document.querySelectorAll('[data-tab-content]').forEach(content => {
            const isActive = content.getAttribute('data-tab-content') === tabId;
            content.classList.toggle('active', isActive);
        });

        buildToolbar(tabId);
        buildSubTabs(tabId);

        state.activeTab = tabId;
        state.stats.tabSwitches++;

        document.dispatchEvent(new CustomEvent('buono:tab-changed', {
            detail: { tabId, tabConfig }
        }));

        if (typeof window.onTabChange === 'function') {
            try {
                window.onTabChange(tabId, tabConfig);
            } catch(e) {
                error('onTabChange callback failed:', e);
            }
        }

        perfEnd(`Switch tab: ${tabId}`);
        log(`🔄 Switched to tab: ${tabId}`);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 8: TOOLBAR BUILDER
    // ═══════════════════════════════════════════
    function buildToolbar(tabId) {
        const toolbarContainer = document.querySelector('[data-component-loaded="page-toolbar"] .page-toolbar')
                              || document.querySelector('.page-toolbar');

        if (!toolbarContainer) return;

        const config = state.config;
        if (!config || !config.toolbar) {
            toolbarContainer.classList.add('hidden');
            return;
        }

        const toolbarConfig = config.toolbar[tabId];

        if (!toolbarConfig) {
            toolbarContainer.classList.add('hidden');
            return;
        }

        toolbarContainer.classList.remove('hidden');

        let html = '';

        if (toolbarConfig.search) {
            const placeholder = toolbarConfig.search.placeholder || 'Search...';
            const searchId = toolbarConfig.search.id || `search_${tabId}`;

            html += `
                <div class="page-toolbar-search">
                    <span class="page-toolbar-search-icon">🔍</span>
                    <input type="text"
                           id="${searchId}"
                           placeholder="${placeholder}"
                           data-tab-search="${tabId}">
                </div>
            `;
        }

        if (toolbarConfig.actions && toolbarConfig.actions.length > 0) {
            html += '<div class="page-toolbar-actions">';

            toolbarConfig.actions.forEach(action => {
                const style = action.style || 'secondary';
                const onclick = action.onclick ? `onclick="${action.onclick}"` : '';
                const id = action.id ? `id="${action.id}"` : '';

                html += `
                    <button class="toolbar-btn toolbar-btn-${style}" ${id} ${onclick}>
                        ${action.label}
                    </button>
                `;
            });

            html += '</div>';
        }

        toolbarContainer.innerHTML = html;

        const searchInput = toolbarContainer.querySelector('[data-tab-search]');
        if (searchInput) {
            let searchTimer = null;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('buono:search', {
                        detail: { tabId, value: e.target.value }
                    }));

                    if (typeof window.onSearch === 'function') {
                        try {
                            window.onSearch(e.target.value, tabId);
                        } catch(err) {
                            error('onSearch callback failed:', err);
                        }
                    }
                }, 200);
            });
        }
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 9: SUB-TABS BUILDER
    // ═══════════════════════════════════════════
    function buildSubTabs(tabId) {
        const subTabsContainer = document.querySelector('[data-component-loaded="sub-tabs"] .sub-tabs')
                              || document.querySelector('.sub-tabs');

        if (!subTabsContainer) return;

        const config = state.config;
        if (!config || !config.subTabs) {
            subTabsContainer.classList.add('hidden');
            return;
        }

        const subTabConfig = config.subTabs[tabId];

        if (!subTabConfig || subTabConfig.length === 0) {
            subTabsContainer.classList.add('hidden');
            return;
        }

        subTabsContainer.classList.remove('hidden');

        const html = subTabConfig.map(subTab => {
            const count = subTab.count !== undefined && subTab.count !== null
                ? `<span class="sub-tab-count ${subTab.countColor ? 'count-' + subTab.countColor : ''}">${subTab.count}</span>`
                : '';

            return `
                <button class="sub-tab"
                        data-subtab="${subTab.id}"
                        data-filter="${subTab.filter || subTab.id}"
                        data-tab="${tabId}">
                    <span class="sub-tab-icon">${subTab.icon || ''}</span>
                    <span class="sub-tab-label">${subTab.label}</span>
                    ${count}
                </button>
            `;
        }).join('');

        subTabsContainer.innerHTML = html;

        subTabsContainer.querySelectorAll('.sub-tab').forEach(subTab => {
            subTab.addEventListener('click', () => {
                const subTabId = subTab.getAttribute('data-subtab');
                const filter = subTab.getAttribute('data-filter');
                switchSubTab(tabId, subTabId, filter);
            });
        });

        const activeSubTabId = state.activeSubTab[tabId] || subTabConfig[0].id;
        const activeFilter = subTabConfig.find(s => s.id === activeSubTabId)?.filter
                          || subTabConfig[0].filter
                          || subTabConfig[0].id;
        switchSubTab(tabId, activeSubTabId, activeFilter, false);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 10: SUB-TAB SWITCHING
    // ═══════════════════════════════════════════
    function switchSubTab(tabId, subTabId, filter, dispatch = true) {
        if (!tabId || !subTabId) return;

        document.querySelectorAll(`.sub-tab[data-tab="${tabId}"]`).forEach(subTab => {
            const isActive = subTab.getAttribute('data-subtab') === subTabId;
            subTab.classList.toggle('active', isActive);
        });

        state.activeSubTab[tabId] = subTabId;
        state.stats.subTabSwitches++;

        if (dispatch) {
            document.dispatchEvent(new CustomEvent('buono:subtab-changed', {
                detail: { tabId, subTabId, filter }
            }));

            if (typeof window.onSubTabChange === 'function') {
                try {
                    window.onSubTabChange(subTabId, filter, tabId);
                } catch(e) {
                    error('onSubTabChange callback failed:', e);
                }
            }
        }

        log(`🔘 Sub-tab: ${tabId} → ${subTabId} (${filter})`);
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 11: UPDATE SUB-TAB COUNTS
    // ═══════════════════════════════════════════
    function updateSubTabCounts(tabId, counts) {
        if (!tabId || !counts) return;

        Object.keys(counts).forEach(subTabId => {
            const subTab = document.querySelector(
                `.sub-tab[data-tab="${tabId}"][data-subtab="${subTabId}"]`
            );

            if (!subTab) return;

            const countEl = subTab.querySelector('.sub-tab-count');
            if (countEl) {
                countEl.textContent = counts[subTabId];
            } else {
                const newCount = document.createElement('span');
                newCount.className = 'sub-tab-count';
                newCount.textContent = counts[subTabId];
                subTab.appendChild(newCount);
            }
        });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 12: UPDATE TAB BADGES
    // ═══════════════════════════════════════════
    function updateTabBadges(badges) {
        if (!badges) return;

        Object.keys(badges).forEach(tabId => {
            const tab = document.querySelector(`.page-tab[data-tab="${tabId}"]`);
            if (!tab) return;

            const badge = badges[tabId];
            let badgeEl = tab.querySelector('.page-tab-badge');

            if (badge === null || badge === undefined || badge === 0 || badge === '') {
                if (badgeEl) badgeEl.remove();
                return;
            }

            if (badgeEl) {
                badgeEl.textContent = badge;
            } else {
                badgeEl = document.createElement('span');
                badgeEl.className = 'page-tab-badge';
                badgeEl.textContent = badge;
                tab.appendChild(badgeEl);
            }
        });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 13: SCROLL HIDE/SHOW
    // ═══════════════════════════════════════════
    function handleScroll() {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - state.lastScrollY;

        if (Math.abs(scrollDelta) < 5) return;

        const direction = scrollDelta > 0 ? 'down' : 'up';
        state.scrollDirection = direction;
        state.lastScrollY = currentScrollY;
        state.stats.scrollEvents++;

        const tabs = document.querySelector('.page-tabs');
        const toolbar = document.querySelector('.page-toolbar');
        const subTabs = document.querySelector('.sub-tabs');

        if (currentScrollY < CONFIG.scrollHideThreshold) {
            if (state.scrollHidden) {
                if (tabs) tabs.classList.remove('scroll-hidden');
                if (toolbar) toolbar.classList.remove('scroll-hidden');
                if (subTabs) subTabs.classList.remove('scroll-hidden');
                state.scrollHidden = false;
            }
            return;
        }

        if (direction === 'down' && !state.scrollHidden) {
            if (tabs) tabs.classList.add('scroll-hidden');
            if (toolbar) toolbar.classList.add('scroll-hidden');
            if (subTabs) subTabs.classList.add('scroll-hidden');
            state.scrollHidden = true;
        } else if (direction === 'up' && state.scrollHidden) {
            if (tabs) tabs.classList.remove('scroll-hidden');
            if (toolbar) toolbar.classList.remove('scroll-hidden');
            if (subTabs) subTabs.classList.remove('scroll-hidden');
            state.scrollHidden = false;
        }
    }

    function setupScrollHandler() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 13B: GLOBAL EVENT DELEGATION
    // ═══════════════════════════════════════════
    function setupGlobalEvents() {
        log('🔌 Setting up global event delegation...');

        function manualToggle() {
            var sb = document.getElementById('appSidebar');
            var bd = document.getElementById('sidebarBackdrop');
            if (!sb) { warn('No sidebar element!'); return; }

            if (sb.classList.contains('open')) {
                sb.classList.remove('open');
                if (bd) bd.classList.remove('show');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
                log('🔒 Sidebar closed');
            } else {
                sb.classList.add('open');
                if (bd) bd.classList.add('show');
                document.body.classList.add('sidebar-open');
                document.body.style.overflow = 'hidden';
                log('🔓 Sidebar opened');
            }
        }

        function manualClose() {
            var sb = document.getElementById('appSidebar');
            var bd = document.getElementById('sidebarBackdrop');
            if (sb) sb.classList.remove('open');
            if (bd) bd.classList.remove('show');
            document.body.classList.remove('sidebar-open');
            document.body.style.overflow = '';
            log('🔒 Sidebar closed');
        }

        function manualLogout() {
            if (confirm('🚪 Are you sure you want to logout?')) {
                sessionStorage.clear();
                var depth = window.location.pathname.split('/').filter(function(p) {
                    return p && p.indexOf('.') === -1;
                }).length;
                var prefix = '';
                for (var i = 0; i < depth; i++) prefix += '../';
                window.location.href = prefix + 'welcome.html';
            }
        }

        if (typeof window.toggleSidebar !== 'function') {
            window.toggleSidebar = manualToggle;
            log('✅ window.toggleSidebar bound (fallback)');
        }
        if (typeof window.closeSidebar !== 'function') {
            window.closeSidebar = manualClose;
            log('✅ window.closeSidebar bound (fallback)');
        }
        if (typeof window.openSidebar !== 'function') {
            window.openSidebar = function() {
                var sb = document.getElementById('appSidebar');
                if (sb && !sb.classList.contains('open')) manualToggle();
            };
            log('✅ window.openSidebar bound (fallback)');
        }
        // 🆕 v1.2: Always set logout (override any page script version)
        window.logout = manualLogout;
        log('✅ window.logout bound');

        document.addEventListener('click', function(e) {
            var hamburger = e.target.closest('#topbarHamburger, .topbar-hamburger');
            if (hamburger) {
                e.preventDefault();
                e.stopPropagation();
                log('🍔 Hamburger clicked');
                window.toggleSidebar();
                return;
            }

            var closeBtn = e.target.closest('#sidebarCloseBtn, .sidebar-close');
            if (closeBtn) {
                e.preventDefault();
                log('✕ Close clicked');
                window.closeSidebar();
                return;
            }

            if (e.target.id === 'sidebarBackdrop' ||
                e.target.classList.contains('sidebar-backdrop')) {
                log('🌑 Backdrop clicked');
                window.closeSidebar();
                return;
            }

            var logoutBtn = e.target.closest('#topbarLogout, .topbar-logout, [data-logout]');
            if (logoutBtn) {
                e.preventDefault();
                log('🚪 Logout clicked');
                window.logout();
                return;
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                var sb = document.getElementById('appSidebar');
                if (sb && sb.classList.contains('open')) {
                    log('⌨️ ESC pressed');
                    window.closeSidebar();
                }
            }
        });

        log('✅ Global events bound');
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 14: PERMISSIONS CHECK
    // ═══════════════════════════════════════════
    function checkPermissions() {
        const config = state.config;
        if (!config || !config.permissions) return true;

        const userData = state.userData || getUserData();
        if (!userData) {
            warn('No user data');
            return false;
        }

        const isAdmin = userData.access === 'Admin';
        if (isAdmin) return true;

        const moduleKey = config.permissions.moduleKey;
        const requiredKeys = config.permissions.requiredKeys || [];

        if (!moduleKey) return true;

        const userPerms = userData.permissions?.[moduleKey] || {};
        const hasAnyPermission = requiredKeys.some(key => userPerms[key] === true);

        if (!hasAnyPermission) {
            warn('No permissions for module:', moduleKey);
            alert('⛔ No access to this page!');
            window.location.href = 'access.html';
            return false;
        }

        return true;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 15: PAGE READY
    // ═══════════════════════════════════════════
    function notifyPageReady() {
        log('🎬 Notifying page ready...');

        document.body.classList.add('buono-ready');
        document.body.classList.add('components-ready');

        // ✅ BULLETPROOF loader hide
        function hideLoader() {
            var loader = document.getElementById('pageLoader');
            if (!loader) loader = document.querySelector('.page-loader');

            if (loader) {
                loader.classList.add('hidden');
                loader.style.display = 'none';
                loader.style.opacity = '0';
                loader.style.visibility = 'hidden';
                loader.style.pointerEvents = 'none';
                log('✅ Loader hidden!');
                return true;
            }
            return false;
        }

        // Try immediately + retries
        hideLoader();
        setTimeout(hideLoader, 100);
        setTimeout(hideLoader, 300);
        setTimeout(hideLoader, 600);
        setTimeout(hideLoader, 1000);
        setTimeout(hideLoader, 2000);

        // Nuclear option at 1.5s
        setTimeout(function() {
            document.querySelectorAll('.page-loader, #pageLoader').forEach(function(l) {
                l.style.cssText = 'display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;';
            });
            log('☢️ Nuclear loader hide applied');
        }, 1500);

        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('buono:page-ready', {
            detail: {
                pageId: state.config?.pageId,
                activeTab: state.activeTab
            }
        }));

        if (window.PerfTracker) {
            try {
                setTimeout(function() {
                    window.PerfTracker.report('📄 ' + (state.config?.title || 'Page') + ' Ready');
                }, 100);
            } catch(e) {}
        }

        log('✅ Page ready: ' + (state.config?.pageId || 'unknown'));
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 16: STATS
    // ═══════════════════════════════════════════
    function getStats() {
        return {
            ...state.stats,
            version: CONFIG.version,
            pageId: state.config?.pageId,
            activeTab: state.activeTab,
            activeSubTabs: state.activeSubTab,
            scrollHidden: state.scrollHidden,
            clockRunning: !!state.clockInterval,
            components: getComponentStatus()
        };
    }

    function printStats() {
        const s = getStats();
        console.log('%c🏗️ Page Builder Stats', 'color:#D4AF37;font-weight:bold;font-size:13px;');
        console.table(s);
        return s;
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 17: DESTROY
    // ═══════════════════════════════════════════
    function destroy() {
        stopClock();
        state.initialized = false;
        log('Destroyed');
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 18: INIT  🆕 v1.2 - DOM-BASED WAIT
    // ═══════════════════════════════════════════
    async function init(userOptions = {}) {

        if (state.initialized) {
            warn('Already initialized');
            return;
        }

        Object.assign(CONFIG, userOptions);

        log('🚀 Init starting...');

        // ─────────────────────────────────────────
        // STEP 1: Wait for BuonoPageConfig
        // ─────────────────────────────────────────
        if (!window.BuonoPageConfig) {
            log('⏳ Waiting for BuonoPageConfig...');
            
            const configReady = await new Promise(resolve => {
                let attempts = 0;
                const maxAttempts = Math.ceil(CONFIG.configWaitTimeout / 100);
                const check = setInterval(() => {
                    attempts++;
                    if (window.BuonoPageConfig) {
                        clearInterval(check);
                        resolve(true);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(check);
                        resolve(false);
                    }
                }, 100);
            });
            
            if (!configReady) {
                error('BuonoPageConfig timeout - aborting page builder');
                return;
            }
            
            log('✅ Config arrived!');
        }

        state.config = window.BuonoPageConfig;
        state.userData = getUserData();

        // ─────────────────────────────────────────
        // STEP 2: Check permissions
        // ─────────────────────────────────────────
        if (!checkPermissions()) return;

        // ─────────────────────────────────────────
        // 🆕 STEP 3: Wait for components in DOM
        // (CRITICAL FIX - check actual DOM, not flags!)
        // ─────────────────────────────────────────
        const status = getComponentStatus();
        log(`📊 Component status: ${status.loaded}/${status.needed}`);

        if (!status.ready) {
            log('⏳ Waiting for components to inject into DOM...');
            
            const componentsReady = await new Promise(resolve => {
                // Listen for components-ready event
                const onReady = () => {
                    document.removeEventListener('buono:components-ready', onReady);
                    clearInterval(pollCheck);
                    clearTimeout(timeoutTimer);
                    resolve(true);
                };
                
                document.addEventListener('buono:components-ready', onReady, { once: true });
                
                // ALSO poll DOM directly (safety net)
                const pollCheck = setInterval(() => {
                    if (areComponentsReady()) {
                        document.removeEventListener('buono:components-ready', onReady);
                        clearInterval(pollCheck);
                        clearTimeout(timeoutTimer);
                        resolve(true);
                    }
                }, 50);
                
                // Timeout fallback
                const timeoutTimer = setTimeout(() => {
                    document.removeEventListener('buono:components-ready', onReady);
                    clearInterval(pollCheck);
                    resolve(false);
                }, CONFIG.componentWaitTimeout);
            });
            
            if (componentsReady) {
                const finalStatus = getComponentStatus();
                log(`✅ Components ready! (${finalStatus.loaded}/${finalStatus.needed})`);
            } else {
                warn(`⚠️ Component wait timeout - proceeding anyway`);
                const finalStatus = getComponentStatus();
                warn(`  Status: ${finalStatus.loaded}/${finalStatus.needed} loaded`);
            }
        } else {
            log('✅ Components already in DOM');
        }

        // ─────────────────────────────────────────
        // STEP 4: Build everything
        // ─────────────────────────────────────────
        perfStart('Page builder init');

        updateWelcomeMessage();
        startClock();
        buildTabBar();
        setupScrollHandler();
        setupGlobalEvents();

        state.initialized = true;

        perfEnd('Page builder init');

        log(`✅ Initialized (v${CONFIG.version})`, {
            pageId: state.config.pageId,
            tabs: state.config.tabs?.length || 0
        });

        notifyPageReady();
    }

    // ═══════════════════════════════════════════
    // 📋 SECTION 19: PUBLIC API
    // ═══════════════════════════════════════════
    const BuonoPageBuilder = {
        version: CONFIG.version,

        init: init,
        destroy: destroy,

        switchTab: switchTab,
        switchSubTab: switchSubTab,
        getActiveTab: () => state.activeTab,
        getActiveSubTab: (tabId) => state.activeSubTab[tabId],

        updateSubTabCounts: updateSubTabCounts,
        updateTabBadges: updateTabBadges,
        updateWelcomeMessage: updateWelcomeMessage,

        rebuildTabs: buildTabBar,
        rebuildToolbar: (tabId) => buildToolbar(tabId || state.activeTab),
        rebuildSubTabs: (tabId) => buildSubTabs(tabId || state.activeTab),

        startClock: startClock,
        stopClock: stopClock,
        updateClock: updateClock,

        stats: getStats,
        printStats: printStats,

        // 🆕 v1.2: Component status check
        getComponentStatus: getComponentStatus,
        areComponentsReady: areComponentsReady,

        config: CONFIG,
        getPageConfig: () => state.config,

        _state: state
    };

    window.BuonoPageBuilder = BuonoPageBuilder;

    // ═══════════════════════════════════════════
    // 🚀 AUTO-INIT
    // ═══════════════════════════════════════════
    if (CONFIG.autoInit) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => init());
        } else {
            setTimeout(() => init(), 100);
        }
    }

    console.log('🏗️ Buono Page Builder loaded! (v' + CONFIG.version + ')');
    console.log('💡 Try: BuonoPageBuilder.printStats() | .switchTab("id")');

})(window, document);

/* ═══════════════════════════════════════════════════════════════ */
/* 🏁 END OF BUONO-PAGE-BUILDER.JS v1.2                            */
/* FIXED: Now checks actual DOM for components (not flags)        */
/* FIXED: Logout always uses correct path (welcome.html)          */
/* ═══════════════════════════════════════════════════════════════ */