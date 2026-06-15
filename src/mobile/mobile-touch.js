/* ═══════════════════════════════════════════════════════════════ */
/* 📱 BUONO PROJECT - MOBILE TOUCH SYSTEM                          */
/* File: src/mobile/mobile-touch.js                                */
/* Version: v1.0                                                   */
/* Date: 2026-06-15                                                */
/* Purpose: Universal mobile touch + gesture system                */
/* Works with: ALL old pages + ALL new pages                       */
/* Dependencies: None (vanilla JS, standalone)                     */
/* ═══════════════════════════════════════════════════════════════ */

(function (window, document) {
    'use strict';

    /* ─────────────────────────────────────────────────────────── */
    /* 📋 SECTION 1: CONFIG + STATE                                */
    /* ─────────────────────────────────────────────────────────── */
    const CONFIG = {
        // Breakpoints
        mobileBreakpoint: 768,

        // Swipe
        swipeThreshold: 50,          // Min pixels to trigger swipe
        swipeMaxTime: 500,           // Max time in ms
        swipeEdgeWidth: 30,          // Edge swipe trigger zone (px from left)

        // Ripple
        rippleEnabled: true,
        rippleDuration: 600,

        // Scroll-to-top
        scrollTopThreshold: 300,     // Show button after scrolling X px

        // Long press
        longPressDelay: 500,

        // Auto-detect IDs (legacy support)
        legacySidebarIds: [
            'reportsSidebar',
            'kitchenSidebar',
            'inventorySidebar',
            'purchasingSidebar'
        ],

        legacyDropdownIds: [
            'rptSwitcherDropdown',
            'purSwitcherDropdown',
            'invSwitcherDropdown',
            'kitSwitcherDropdown',
            'cashSwitcherDropdown',
            'dbDropdown'
        ],

        legacyModalSelectors: [
            '.modal',
            '.modal-overlay',
            '.mark-paid-modal',
            '.photo-fullscreen-modal',
            '.receipt-modal-overlay'
        ]
    };

    const STATE = {
        isMobile: false,
        isTouch: false,
        scrollLocked: false,
        scrollLockY: 0,
        activeSidebar: null,
        touchStartX: 0,
        touchStartY: 0,
        touchStartTime: 0,
        longPressTimer: null
    };


    /* ─────────────────────────────────────────────────────────── */
    /* 🔍 SECTION 2: DEVICE DETECTION                              */
    /* ─────────────────────────────────────────────────────────── */
    function detectDevice() {
        STATE.isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
        STATE.isTouch = ('ontouchstart' in window) ||
                        (navigator.maxTouchPoints > 0) ||
                        (navigator.msMaxTouchPoints > 0);

        // Add classes to body for CSS hooks
        document.body.classList.toggle('is-mobile', STATE.isMobile);
        document.body.classList.toggle('is-touch', STATE.isTouch);
        document.body.classList.toggle('is-desktop', !STATE.isMobile);
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 🛠️ SECTION 3: TOUCH UTILITIES                              */
    /* ─────────────────────────────────────────────────────────── */
    function getTouchPoint(e) {
        const touch = e.touches ? e.touches[0] : e.changedTouches ? e.changedTouches[0] : e;
        return {
            x: touch.clientX || 0,
            y: touch.clientY || 0
        };
    }

    function isInsideElement(target, selector) {
        return target.closest(selector) !== null;
    }

    function getAllSidebars() {
        const sidebars = [];

        // Legacy IDs
        CONFIG.legacySidebarIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) sidebars.push(el);
        });

        // Data attribute (new pages)
        document.querySelectorAll('[data-sidebar]').forEach(el => {
            if (!sidebars.includes(el)) sidebars.push(el);
        });

        return sidebars;
    }

    function getAllDropdowns() {
        const dropdowns = [];

        // Legacy IDs
        CONFIG.legacyDropdownIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) dropdowns.push(el);
        });

        // Class-based
        document.querySelectorAll(
            '.rpt-db-dropdown, .pur-db-dropdown, .inv-db-dropdown, ' +
            '.kit-db-dropdown, .db-switcher-dropdown, [data-dropdown-menu]'
        ).forEach(el => {
            if (!dropdowns.includes(el)) dropdowns.push(el);
        });

        return dropdowns;
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 🪟 SECTION 4: OVERLAY MANAGER                               */
    /* ─────────────────────────────────────────────────────────── */
    function createOverlay() {
        let overlay = document.getElementById('mobSidebarOverlay');
        if (overlay) return overlay;

        // Reuse existing overlay if present (backward compatibility)
        overlay = document.getElementById('sidebarOverlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay';
        overlay.setAttribute('data-overlay', '');
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            MobileUX.closeAllSidebars();
        }, { passive: true });

        return overlay;
    }

    function showOverlay() {
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.classList.add('active');
    }

    function hideOverlay() {
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.classList.remove('active');
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 📚 SECTION 5: SIDEBAR MANAGER                               */
    /* ─────────────────────────────────────────────────────────── */
    function openSidebar(sidebar) {
        if (!sidebar) return;

        sidebar.classList.add('open');
        STATE.activeSidebar = sidebar;
        showOverlay();
        lockScroll();
    }

    function closeSidebar(sidebar) {
        if (!sidebar) return;

        sidebar.classList.remove('open');

        // Check if any other sidebar still open
        const anyOpen = getAllSidebars().some(sb => sb.classList.contains('open'));
        if (!anyOpen) {
            STATE.activeSidebar = null;
            hideOverlay();
            unlockScroll();
        }
    }

    function closeAllSidebars() {
        getAllSidebars().forEach(sb => sb.classList.remove('open'));
        STATE.activeSidebar = null;
        hideOverlay();
        unlockScroll();
    }

    function watchSidebars() {
        const sidebars = getAllSidebars();

        sidebars.forEach(sb => {
            // Avoid duplicate observers
            if (sb.__mobObserved) return;
            sb.__mobObserved = true;

            const observer = new MutationObserver(mutations => {
                mutations.forEach(m => {
                    if (m.attributeName === 'class') {
                        if (sb.classList.contains('open')) {
                            STATE.activeSidebar = sb;
                            showOverlay();
                            lockScroll();
                        } else {
                            const anyOpen = getAllSidebars().some(x => x.classList.contains('open'));
                            if (!anyOpen) {
                                STATE.activeSidebar = null;
                                hideOverlay();
                                unlockScroll();
                            }
                        }
                    }
                });
            });

            observer.observe(sb, { attributes: true, attributeFilter: ['class'] });
        });
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 📋 SECTION 6: DROPDOWN MANAGER                              */
    /* ─────────────────────────────────────────────────────────── */
    function setupDropdownOutsideClick() {
        document.addEventListener('click', (e) => {
            const dropdowns = getAllDropdowns();

            dropdowns.forEach(dropdown => {
                if (!dropdown.classList.contains('show') &&
                    !dropdown.classList.contains('active') &&
                    dropdown.style.display !== 'block') return;

                // Check if click was inside dropdown or its trigger
                const triggerId = dropdown.id ? dropdown.id.replace('Dropdown', 'Btn') : null;
                const trigger = triggerId ? document.getElementById(triggerId) : null;

                const insideDropdown = dropdown.contains(e.target);
                const insideTrigger = trigger ? trigger.contains(e.target) : false;
                const isToggleBtn = e.target.closest('[data-dropdown-toggle]');

                if (!insideDropdown && !insideTrigger && !isToggleBtn) {
                    dropdown.classList.remove('show', 'active');
                    if (dropdown.style.display === 'block') {
                        dropdown.style.display = '';
                    }
                }
            });
        }, { passive: true });
    }

    function closeAllDropdowns() {
        getAllDropdowns().forEach(d => {
            d.classList.remove('show', 'active');
            if (d.style.display === 'block') d.style.display = '';
        });
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 🪟 SECTION 7: MODAL MANAGER                                 */
    /* ─────────────────────────────────────────────────────────── */
    function setupModalBackdropClick() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Click on modal backdrop itself (not children)
            CONFIG.legacyModalSelectors.forEach(selector => {
                if (target.matches && target.matches(selector)) {
                    closeModal(target);
                }
            });

            // Generic data-modal pattern
            if (target.hasAttribute && target.hasAttribute('data-modal')) {
                closeModal(target);
            }
        }, { passive: true });
    }

    function closeModal(modal) {
        if (!modal) return;

        // Try common close patterns
        modal.classList.remove('show', 'active', 'open');

        // Inline display style fallback
        if (modal.style.display === 'flex' || modal.style.display === 'block') {
            modal.style.display = 'none';
        }

        unlockScroll();
    }

    function closeAllModals() {
        CONFIG.legacyModalSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(closeModal);
        });
        document.querySelectorAll('[data-modal]').forEach(closeModal);
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 👆 SECTION 8: SWIPE ENGINE (4 Directions)                   */
    /* ─────────────────────────────────────────────────────────── */
    function setupSwipeEngine() {
        document.addEventListener('touchstart', (e) => {
            const point = getTouchPoint(e);
            STATE.touchStartX = point.x;
            STATE.touchStartY = point.y;
            STATE.touchStartTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!STATE.touchStartTime) return;

            const point = getTouchPoint(e);
            const deltaX = point.x - STATE.touchStartX;
            const deltaY = point.y - STATE.touchStartY;
            const deltaTime = Date.now() - STATE.touchStartTime;

            // Reset
            const startX = STATE.touchStartX;
            const startY = STATE.touchStartY;
            STATE.touchStartTime = 0;

            // Too slow = not a swipe
            if (deltaTime > CONFIG.swipeMaxTime) return;

            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // Threshold check
            if (Math.max(absX, absY) < CONFIG.swipeThreshold) return;

            // Determine direction
            let direction = null;
            if (absX > absY) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }

            handleSwipe(direction, { startX, startY, deltaX, deltaY, target: e.target });
        }, { passive: true });
    }

    function handleSwipe(direction, details) {
        // Emit custom event for other scripts
        const event = new CustomEvent('mob:swipe', {
            detail: { direction, ...details }
        });
        document.dispatchEvent(event);

        // Built-in sidebar swipe integration
        if (STATE.isMobile) {
            handleSidebarSwipe(direction, details);
        }
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 📚 SECTION 9: SIDEBAR SWIPE INTEGRATION                     */
    /* ─────────────────────────────────────────────────────────── */
    function handleSidebarSwipe(direction, details) {
        // Don't swipe inside scrollable elements
        const target = details.target;
        if (target && (
            target.closest('.tabs-scroll') ||
            target.closest('.table-wrap') ||
            target.closest('input') ||
            target.closest('textarea') ||
            target.closest('select')
        )) return;

        // Swipe RIGHT from left edge → Open sidebar
        if (direction === 'right' && details.startX < CONFIG.swipeEdgeWidth) {
            const sidebars = getAllSidebars();
            if (sidebars.length > 0) {
                // Open first available sidebar
                openSidebar(sidebars[0]);
            }
        }

        // Swipe LEFT while sidebar open → Close
        if (direction === 'left' && STATE.activeSidebar) {
            closeSidebar(STATE.activeSidebar);
        }
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 💫 SECTION 10: RIPPLE EFFECT (Touch Feedback)               */
    /* ─────────────────────────────────────────────────────────── */
    function setupRipple() {
        if (!CONFIG.rippleEnabled) return;

        // Inject ripple styles once
        if (!document.getElementById('mobRippleStyle')) {
            const style = document.createElement('style');
            style.id = 'mobRippleStyle';
            style.textContent = `
                .mob-ripple-host {
                    position: relative;
                    overflow: hidden;
                }
                .mob-ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.35);
                    transform: scale(0);
                    animation: mobRippleAnim ${CONFIG.rippleDuration}ms ease-out;
                    pointer-events: none;
                    z-index: 1;
                }
                @keyframes mobRippleAnim {
                    to {
                        transform: scale(2.5);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('button, .btn, [data-ripple], .tab-btn, .access-card, .sb-item');
            if (!target) return;

            // Skip if explicitly disabled
            if (target.hasAttribute('data-no-ripple')) return;

            const point = getTouchPoint(e);
            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);

            const ripple = document.createElement('span');
            ripple.className = 'mob-ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (point.x - rect.left - size / 2) + 'px';
            ripple.style.top = (point.y - rect.top - size / 2) + 'px';

            // Ensure host has position
            target.classList.add('mob-ripple-host');
            target.appendChild(ripple);

            setTimeout(() => ripple.remove(), CONFIG.rippleDuration);
        }, { passive: true });
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 🤏 SECTION 11: LONG PRESS DETECTION                         */
    /* ─────────────────────────────────────────────────────────── */
    function setupLongPress() {
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('[data-long-press]');
            if (!target) return;

            STATE.longPressTimer = setTimeout(() => {
                const event = new CustomEvent('mob:longpress', {
                    detail: { target, originalEvent: e }
                });
                target.dispatchEvent(event);
            }, CONFIG.longPressDelay);
        }, { passive: true });

        ['touchend', 'touchmove', 'touchcancel'].forEach(evt => {
            document.addEventListener(evt, () => {
                if (STATE.longPressTimer) {
                    clearTimeout(STATE.longPressTimer);
                    STATE.longPressTimer = null;
                }
            }, { passive: true });
        });
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 🔒 SECTION 12: SCROLL LOCK MANAGER                          */
    /* ─────────────────────────────────────────────────────────── */
    function lockScroll() {
        if (STATE.scrollLocked) return;

        STATE.scrollLockY = window.scrollY;
        STATE.scrollLocked = true;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${STATE.scrollLockY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        if (!STATE.scrollLocked) return;

        STATE.scrollLocked = false;

        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        window.scrollTo(0, STATE.scrollLockY);
    }


    /* ─────────────────────────────────────────────────────────── */
    /* ⌨️ SECTION 13: ESC + OUTSIDE CLICK HANDLER                  */
    /* ─────────────────────────────────────────────────────────── */
    function setupEscKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;

            // Priority: modal > sidebar > dropdown
            const anyModal = document.querySelector(
                '.modal.show, .modal-overlay.show, .modal-overlay.active, ' +
                '.mark-paid-modal.show, .photo-fullscreen-modal.show, ' +
                '.receipt-modal-overlay.active, [data-modal].active'
            );

            if (anyModal) {
                closeModal(anyModal);
                return;
            }

            if (STATE.activeSidebar) {
                closeAllSidebars();
                return;
            }

            closeAllDropdowns();
        });
    }


    /* ─────────────────────────────────────────────────────────── */
    /* ⬆️ SECTION 14: SCROLL-TO-TOP BUTTON                         */
    /* ─────────────────────────────────────────────────────────── */
    function setupScrollToTop() {
        // Create button
        let btn = document.querySelector('[data-scroll-top]');
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'scroll-to-top-btn';
            btn.setAttribute('data-scroll-top', '');
            btn.setAttribute('aria-label', 'Scroll to top');
            btn.innerHTML = '↑';
            document.body.appendChild(btn);
        }

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, { passive: true });

        // Show/hide on scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > CONFIG.scrollTopThreshold) {
                        btn.classList.add('visible');
                    } else {
                        btn.classList.remove('visible');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 🚀 SECTION 15: INIT + AUTO-SETUP                            */
    /* ─────────────────────────────────────────────────────────── */
    function init() {
        detectDevice();
        createOverlay();
        watchSidebars();
        setupDropdownOutsideClick();
        setupModalBackdropClick();
        setupSwipeEngine();
        setupRipple();
        setupLongPress();
        setupEscKey();
        setupScrollToTop();

        // Re-detect device on resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                detectDevice();
                // Re-watch sidebars (new ones might be added)
                watchSidebars();
            }, 200);
        }, { passive: true });

        // Re-scan after dynamic content loads
        const reScanObserver = new MutationObserver(() => {
            watchSidebars();
        });
        reScanObserver.observe(document.body, {
            childList: true,
            subtree: false
        });

        console.log('[MobileUX] Initialized ✓ (v1.0)', {
            mobile: STATE.isMobile,
            touch: STATE.isTouch
        });
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }


    /* ─────────────────────────────────────────────────────────── */
    /* 🌐 SECTION 16: PUBLIC API (window.MobileUX)                 */
    /* ─────────────────────────────────────────────────────────── */
    const MobileUX = {
        // State accessors
        isMobile: () => STATE.isMobile,
        isTouch: () => STATE.isTouch,
        getActiveSidebar: () => STATE.activeSidebar,

        // Sidebar control
        openSidebar,
        closeSidebar,
        closeAllSidebars,
        toggleSidebar(sidebar) {
            if (!sidebar) return;
            if (sidebar.classList.contains('open')) {
                closeSidebar(sidebar);
            } else {
                openSidebar(sidebar);
            }
        },

        // Dropdown control
        closeAllDropdowns,

        // Modal control
        closeModal,
        closeAllModals,

        // Scroll lock
        lockScroll,
        unlockScroll,

        // Overlay control
        showOverlay,
        hideOverlay,

        // Re-scan (for dynamically added content)
        rescan() {
            watchSidebars();
        },

        // Config access (for advanced users)
        config: CONFIG,

        // Version
        version: '1.0'
    };

    // Expose to window
    window.MobileUX = MobileUX;

})(window, document);

/* ═══════════════════════════════════════════════════════════════ */
/* 🏁 END OF MOBILE-TOUCH.JS v1.0                                  */
/* Total Lines: ~550                                               */
/* Sections: 16                                                    */
/* Public API: window.MobileUX                                     */
/* ═══════════════════════════════════════════════════════════════ */