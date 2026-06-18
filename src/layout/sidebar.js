/* ═══════════════════════════════════════════════════════════
   BUONO - SIDEBAR JS
   Version: 2.0 - Clean architecture, no double bindings
   Date: 2026-06-17
   
   RESPONSIBILITY:
   ✅ Define: window.openSidebar, closeSidebar, toggleSidebar
   ✅ Submenu expand/collapse logic
   ✅ Same-page section navigation (smooth scroll)
   ✅ Scroll spy (active state on scroll)
   ✅ Hash URL handling
   
   ❌ NOT responsible for:
   - Hamburger click (handled by buono-page-builder.js)
   - Close button click (handled by buono-page-builder.js)
   - Backdrop click (handled by buono-page-builder.js)
   - Logout click (handled by buono-page-builder.js)
   - ESC key (handled by buono-page-builder.js)
   
   This prevents DOUBLE BINDING bugs!
   ═══════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    /* ───────────── Element References ───────────── */
    function getSidebar() {
        return document.getElementById('appSidebar');
    }

    function getBackdrop() {
        return document.getElementById('sidebarBackdrop');
    }

    /* ═══════════════════════════════════════════
       SIDEBAR OPEN / CLOSE / TOGGLE
       (Single source of truth for these functions)
       ═══════════════════════════════════════════ */

    window.openSidebar = function() {
        const sidebar = getSidebar();
        const backdrop = getBackdrop();

        if (!sidebar) {
            console.warn('[Sidebar] #appSidebar not found');
            return;
        }

        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('show');

        document.body.classList.add('sidebar-open');
        document.body.style.overflow = 'hidden';
        
        console.log('[Sidebar] 🔓 Opened');
    };

    window.closeSidebar = function() {
        const sidebar = getSidebar();
        const backdrop = getBackdrop();

        if (!sidebar) return;

        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');

        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
        
        console.log('[Sidebar] 🔒 Closed');
    };

    window.toggleSidebar = function() {
        const sidebar = getSidebar();

        if (!sidebar) {
            console.warn('[Sidebar] #appSidebar not found (will retry)');
            // Retry after components load
            setTimeout(function() {
                const sb = getSidebar();
                if (sb) window.toggleSidebar();
            }, 100);
            return;
        }

        if (sidebar.classList.contains('open')) {
            window.closeSidebar();
        } else {
            window.openSidebar();
        }
    };

    /* ═══════════════════════════════════════════
       SUBMENU SYSTEM
       (Expand/collapse parent menu items)
       ═══════════════════════════════════════════ */

    function closeAllSubmenus(exceptParent) {
        const openParents = document.querySelectorAll('.sidebar-parent.open');
        openParents.forEach(function(parent) {
            if (parent !== exceptParent) {
                parent.classList.remove('open');
            }
        });
    }

    function openParentForLink(link) {
        if (!link) return;
        const parent = link.closest('.sidebar-parent');
        if (parent) {
            parent.classList.add('open');
        }
    }

    function initSubmenus() {
        const toggles = document.querySelectorAll('[data-submenu-toggle]');

        toggles.forEach(function(toggle) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const parent = toggle.closest('.sidebar-parent');
                if (!parent) return;

                const isOpen = parent.classList.contains('open');

                closeAllSubmenus(parent);

                if (isOpen) {
                    parent.classList.remove('open');
                } else {
                    parent.classList.add('open');
                }
            });
        });
    }

    /* ═══════════════════════════════════════════
       SECTION NAVIGATION (Smooth scroll + active)
       ═══════════════════════════════════════════ */

    function getScrollOffset() {
        const topbar = document.querySelector('.topbar');
        const sectionNav = document.querySelector('.section-nav');

        let offset = 16;

        if (topbar) {
            offset += topbar.offsetHeight;
        }

        if (sectionNav && getComputedStyle(sectionNav).position === 'sticky') {
            offset += sectionNav.offsetHeight + 8;
        }

        return offset;
    }

    function scrollToSection(targetId) {
        const target = document.querySelector(targetId);

        if (!target) {
            console.warn('[Sidebar] Section not found: ' + targetId);
            return false;
        }

        const offset = getScrollOffset();
        const targetY = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top: targetY, behavior: 'smooth' });
        return true;
    }

    function setActiveSectionLink(targetId) {
        // Clear all active states
        document.querySelectorAll('.sidebar-submenu a[href^="#"], .section-nav .section-nav-item[href^="#"]')
            .forEach(function(link) {
                link.classList.remove('active');
            });

        // Activate matching
        const matchSelector =
            '.sidebar-submenu a[href="' + targetId + '"], ' +
            '.section-nav .section-nav-item[href="' + targetId + '"]';

        document.querySelectorAll(matchSelector).forEach(function(link) {
            link.classList.add('active');
            openParentForLink(link);
        });
    }

    function bindSectionLinks() {
        const selector =
            '.sidebar-submenu a[href^="#"], ' +
            '.section-nav .section-nav-item[href^="#"]';

        document.querySelectorAll(selector).forEach(function(link) {
            link.addEventListener('click', function(e) {
                const href = link.getAttribute('href');

                if (!href || href === '#' || !href.startsWith('#')) return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();

                scrollToSection(href);
                setActiveSectionLink(href);

                if (history.replaceState) {
                    history.replaceState(null, '', href);
                }

                // Mobile: close sidebar after click
                if (window.innerWidth <= 768) {
                    window.closeSidebar();
                }
            });
        });
    }

    /* ═══════════════════════════════════════════
       SCROLL SPY
       ═══════════════════════════════════════════ */

    function initScrollSpy() {
        const sections = document.querySelectorAll('.page-section[id]');
        if (sections.length === 0) return;

        let ticking = false;

        function updateActiveOnScroll() {
            const offset = getScrollOffset() + 20;
            const scrollY = window.pageYOffset;

            let currentId = null;

            sections.forEach(function(section) {
                const top = section.offsetTop - offset;
                if (scrollY >= top) {
                    currentId = '#' + section.id;
                }
            });

            if (currentId) {
                setActiveSectionLink(currentId);
            }

            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateActiveOnScroll);
                ticking = true;
            }
        }, { passive: true });

        updateActiveOnScroll();
    }

    /* ═══════════════════════════════════════════
       MAIN INIT
       (NO hamburger/close/backdrop bindings here!)
       ═══════════════════════════════════════════ */

    function initSidebar() {
        // Submenu toggles
        initSubmenus();

        // Section links (sidebar submenu + section-nav)
        bindSectionLinks();

        // Scroll spy auto-activate
        initScrollSpy();

        // Handle initial hash in URL
        if (window.location.hash) {
            const hash = window.location.hash;
            const target = document.querySelector(hash);

            if (target) {
                setActiveSectionLink(hash);
                setTimeout(function() {
                    scrollToSection(hash);
                }, 100);
            }
        }

        console.log('[Sidebar] ✓ Initialized v2.0 (submenu + scroll spy)');
    }

    /* ───────────── Auto Init ───────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
    
    // Re-init when sidebar component loads (for submenu/section links)
    document.addEventListener('buono:components-ready', function() {
        setTimeout(initSidebar, 50);
    });

})();