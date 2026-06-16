/* ═══════════════════════════════════════════════════════════
   ☕ BUONO WELCOME - PREMIUM MOBILE EXTRAS
   File: welcome-extras.js
   Version: 2.0 - Loader-Safe Edition
   Date: 2026-06-16
   
   🎯 PURPOSE: 
   1. Click outside → close mobile menu
   2. ESC key → close mobile menu
   3. Premium section content animations
   
   📋 NOTES:
   - Runs AFTER welcome-script.js (safe, additive)
   - Loader-safe init via BuonoLoader.whenReady()
   - All features wait for DOM + Loader ready
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    console.log('✨ [WELCOME-EXTRAS] Script loading...');

    // ═══════════════════════════════════════════════════════
    // 🎯 STATE
    // ═══════════════════════════════════════════════════════
    const state = {
        initialized: false
    };

    // ═══════════════════════════════════════════════════════
    // 🎯 FEATURE 1: Click Outside to Close Mobile Menu
    // ═══════════════════════════════════════════════════════
    function initClickOutsideMenu() {
        document.addEventListener('click', function (e) {
            const mobileMenu = document.getElementById('navMobileMenu');
            const hamburger = document.getElementById('navHamburger');

            if (!mobileMenu || !hamburger) return;

            // Only act if menu is open
            if (!mobileMenu.classList.contains('active')) return;

            // If click is INSIDE menu OR hamburger → ignore
            if (mobileMenu.contains(e.target) || hamburger.contains(e.target)) {
                return;
            }

            // Click is outside → close menu!
            mobileMenu.classList.remove('active');
            hamburger.textContent = '☰';

            console.log('🚪 [EXTRAS] Mobile menu closed (outside click)');
        });

        // Also close on ESC key (bonus!)
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const mobileMenu = document.getElementById('navMobileMenu');
                const hamburger = document.getElementById('navHamburger');

                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    if (hamburger) hamburger.textContent = '☰';
                    console.log('⎋ [EXTRAS] Mobile menu closed (ESC)');
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // 🎬 FEATURE 2: Premium Section Content Animations
    // When section visible → trigger content animation
    // ═══════════════════════════════════════════════════════
    function initSectionAnimations() {
        // Target sections
        const sections = document.querySelectorAll(
            '.hero, .about, .menu, .academy, .why-us, .testimonials, .contact'
        );

        if (!sections.length) {
            console.warn('⚠️ [EXTRAS] No sections found');
            return;
        }

        // Add animation class to section children
        sections.forEach(section => {
            // Find content wrappers inside sections
            const containers = section.querySelectorAll(
                '.container, .hero-content, .about-grid, .menu-grid, ' +
                '.academy-grid, .why-us-grid, .testimonials-carousel, .contact-grid'
            );

            containers.forEach(container => {
                container.classList.add('section-animate-in');
            });
        });

        // IntersectionObserver - trigger when section visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');

                    // Once shown, don't re-trigger
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -80px 0px'
        });

        // Observe all animate-in containers
        document.querySelectorAll('.section-animate-in').forEach(el => {
            observer.observe(el);
        });

        console.log(`🎬 [EXTRAS] Section animations initialized (${sections.length} sections)`);
    }

    // ═══════════════════════════════════════════════════════
    // 🚀 MAIN INITIALIZATION
    // ═══════════════════════════════════════════════════════
    function initExtras() {
        if (state.initialized) {
            console.warn('⚠️ [WELCOME-EXTRAS] Already initialized, skipping');
            return;
        }
        state.initialized = true;

        const startTime = performance.now();

        try {
            initClickOutsideMenu();
            initSectionAnimations();

            const elapsed = Math.round(performance.now() - startTime);
            console.log(`✅ [WELCOME-EXTRAS] Ready! Init time: ${elapsed}ms`);
            console.log('✨ [WELCOME-EXTRAS] Premium UX activated! (v2.0)');
        } catch (error) {
            console.error('❌ [WELCOME-EXTRAS] Init error:', error);
        }
    }

    // ═══════════════════════════════════════════════════════
    // ⏳ LOADER-SAFE INIT PATTERN
    // ═══════════════════════════════════════════════════════

    function waitForDomReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
            } else {
                resolve();
            }
        });
    }

    function waitForBuonoReady() {
        return new Promise((resolve) => {
            // Already ready
            if (window.BuonoReady === true) {
                resolve();
                return;
            }

            // Use loader's official API
            if (window.BuonoLoader && typeof BuonoLoader.whenReady === 'function') {
                BuonoLoader.whenReady().then(() => resolve());
                return;
            }

            // Fallback: listen for event
            document.addEventListener('buono:ready', () => resolve(), { once: true });

            // Last resort timeout
            setTimeout(() => {
                console.warn('⚠️ [WELCOME-EXTRAS] BuonoLoader timeout, proceeding anyway');
                resolve();
            }, 5000);
        });
    }

    // ═══════════════════════════════════════════════════════
    // 🎬 START
    // Wait for: DOM + BuonoLoader + small delay (let welcome-script.js init first)
    // ═══════════════════════════════════════════════════════
    Promise.all([
        waitForDomReady(),
        waitForBuonoReady()
    ])
        .then(() => {
            console.log('✅ [WELCOME-EXTRAS] DOM + BuonoLoader ready');
            
            // Small delay to let welcome-script.js finish rendering first
            // (extras are additive enhancements, not critical)
            setTimeout(initExtras, 150);
        })
        .catch(error => {
            console.error('❌ [WELCOME-EXTRAS] Init promise failed:', error);
            // Try to init anyway as fallback
            setTimeout(initExtras, 200);
        });

    // ═══════════════════════════════════════════════════════
    // 🌐 PUBLIC API (for debugging)
    // ═══════════════════════════════════════════════════════
    window.WelcomeExtras = {
        version: '2.0',
        state: state,
        initSectionAnimations: initSectionAnimations,
        initClickOutsideMenu: initClickOutsideMenu
    };

})();

/* ═══════════════════════════════════════════════════════════
   END OF welcome-extras.js v2.0
   Loader-Safe Edition | 2026-06-16
   ═══════════════════════════════════════════════════════════ */