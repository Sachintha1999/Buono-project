/* ═══════════════════════════════════════════════════════════
   ☕ BUONO WELCOME - PREMIUM MOBILE EXTRAS
   File: welcome-extras.js
   Version: 1.0
   Purpose: 
     1. Click outside → close mobile menu
     2. Premium section content animations
   Note: Runs AFTER welcome-script.js (safe, additive)
   ═══════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    console.log('✨ [WELCOME-EXTRAS] Loading premium features...');

    // ═══════════════════════════════════════════════════════
    // 🎯 FEATURE 1: Click Outside to Close Mobile Menu
    // ═══════════════════════════════════════════════════════
    function initClickOutsideMenu() {
        document.addEventListener('click', function(e) {
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
        document.addEventListener('keydown', function(e) {
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
    // Works on PC + Mobile (smooth, premium feel)
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
    // 🚀 INITIALIZATION
    // ═══════════════════════════════════════════════════════
    function init() {
        const startTime = performance.now();

        initClickOutsideMenu();
        initSectionAnimations();

        const elapsed = Math.round(performance.now() - startTime);
        console.log(`✅ [WELCOME-EXTRAS] Ready! Init time: ${elapsed}ms`);
        console.log('✨ [WELCOME-EXTRAS] Premium UX activated!');
    }

    // Wait for DOM + small delay (let welcome-script.js init first!)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 100);
        });
    } else {
        setTimeout(init, 100);
    }

})();