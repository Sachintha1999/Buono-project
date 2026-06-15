/* ═══════════════════════════════════════════════════════════
   BUONO - SIDEBAR JS
   Phase 1 Day 4 - Layout System
   Version: 1.1
   
   Features:
   - Sidebar open / close / toggle
   - Backdrop click + ESC key close
   - Mobile auto-close on link click
   - Sidebar submenu (parent expand/collapse)
   - Same-page section navigation (smooth scroll)
   - Section-nav (top pill menu) support
   - Active state tracking (scroll spy)
   - Hash URL support
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

    /* ───────────── Open Sidebar ───────────── */
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
    };

    /* ───────────── Close Sidebar ───────────── */
    window.closeSidebar = function() {
        const sidebar = getSidebar();
        const backdrop = getBackdrop();

        if (!sidebar) return;

        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');

        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
    };

    /* ───────────── Toggle Sidebar ───────────── */
    window.toggleSidebar = function() {
        const sidebar = getSidebar();

        if (!sidebar) {
            console.warn('[Sidebar] #appSidebar not found');
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

                /* Close other open submenus (optional accordion) */
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

        const targetY =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            offset;

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });

        return true;
    }

    function setActiveSectionLink(targetId) {
        /* Sidebar submenu links */
        const subLinks = document.querySelectorAll('.sidebar-submenu a[href^="#"]');
        subLinks.forEach(function(link) {
            link.classList.remove('active');
        });

        /* Section-nav links */
        const navLinks = document.querySelectorAll('.section-nav .section-nav-item[href^="#"]');
        navLinks.forEach(function(link) {
            link.classList.remove('active');
        });

        /* Activate matching */
        const matchSelector =
            '.sidebar-submenu a[href="' + targetId + '"], ' +
            '.section-nav .section-nav-item[href="' + targetId + '"]';

        const activeLinks = document.querySelectorAll(matchSelector);
        activeLinks.forEach(function(link) {
            link.classList.add('active');
            openParentForLink(link);
        });
    }

    function bindSectionLinks() {
        const selector =
            '.sidebar-submenu a[href^="#"], ' +
            '.section-nav .section-nav-item[href^="#"]';

        const links = document.querySelectorAll(selector);

        links.forEach(function(link) {
            link.addEventListener('click', function(e) {
                const href = link.getAttribute('href');

                if (!href || href === '#' || !href.startsWith('#')) return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();

                scrollToSection(href);
                setActiveSectionLink(href);

                /* Update URL hash without jumping */
                if (history.replaceState) {
                    history.replaceState(null, '', href);
                }

                /* Mobile: close sidebar after click */
                if (window.innerWidth <= 768) {
                    window.closeSidebar();
                }
            });
        });
    }

    /* ═══════════════════════════════════════════
       SCROLL SPY (Auto-activate on scroll)
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

        /* Initial */
        updateActiveOnScroll();
    }

    /* ═══════════════════════════════════════════
       MAIN INIT
       ═══════════════════════════════════════════ */

    function initSidebar() {
        const backdrop = getBackdrop();

        /* Backdrop click → close */
        if (backdrop) {
            backdrop.addEventListener('click', function() {
                window.closeSidebar();
            });
        }

        /* ESC key → close */
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const sidebar = getSidebar();
                if (sidebar && sidebar.classList.contains('open')) {
                    window.closeSidebar();
                }
            }
        });

        /* Mobile: normal sidebar links (not submenu toggles, not hash links) close sidebar */
        const sidebar = getSidebar();
        if (sidebar) {
            const items = sidebar.querySelectorAll('.sidebar-item');

            items.forEach(function(item) {
                item.addEventListener('click', function() {
                    /* Skip submenu toggles */
                    if (item.hasAttribute('data-submenu-toggle')) return;

                    const href = item.getAttribute('href') || '';

                    /* Hash links handled separately by bindSectionLinks */
                    if (href.startsWith('#')) return;

                    if (window.innerWidth <= 768) {
                        window.closeSidebar();
                    }
                });
            });
        }

        /* Submenu toggles */
        initSubmenus();

        /* Section links (sidebar submenu + section-nav) */
        bindSectionLinks();

        /* Scroll spy auto-activate */
        initScrollSpy();

        /* Load with hash → activate + scroll */
        if (window.location.hash) {
            const hash = window.location.hash;
            const target = document.querySelector(hash);

            if (target) {
                setActiveSectionLink(hash);

                /* Delay scroll for layout settle */
                setTimeout(function() {
                    scrollToSection(hash);
                }, 100);
            }
        }

        console.log('[Sidebar] Initialized ✓ (v1.1 with submenu)');
    }

    /* ───────────── Auto Init ───────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }

})();